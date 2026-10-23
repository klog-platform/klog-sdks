package com.kriverdevice.klog;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClientTest {
  private HttpServer server;

  @AfterEach
  void tearDown() {
    if (server != null) server.stop(0);
  }

  @Test
  void infoCreatesEvent() throws Exception {
    AtomicInteger calls = new AtomicInteger();
    List<String> bodies = new ArrayList<>();
    List<String> auths = new ArrayList<>();
    server = start((exchange) -> {
      calls.incrementAndGet();
      auths.add(exchange.getRequestHeaders().getFirst("Authorization"));
      bodies.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
      byte[] resp = "{\"id\":\"evt-1\"}".getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(201, resp.length);
      try (OutputStream os = exchange.getResponseBody()) {
        os.write(resp);
      }
    });

    Client client = new Client(Config.builder()
        .baseUrl(baseUrl())
        .tenantId("tenant")
        .token("klog_test")
        .applicationId("app")
        .maxRetries(0)
        .build());

    Result result = client.info("hola", Map.of("n", 1));
    assertTrue(result.created);
    assertEquals("evt-1", result.id);
    assertEquals("Bearer klog_test", auths.get(0));
    assertTrue(bodies.get(0).contains("\"message\":\"hola\""));
    assertTrue(bodies.get(0).contains("\"applicationId\":\"app\""));
    assertEquals(1, calls.get());
  }

  @Test
  void droppedIsDistinct() throws Exception {
    List<String> dropped = new ArrayList<>();
    server = start((exchange) -> {
      byte[] resp = "{\"dropped\":true,\"id\":\"evt-2\"}".getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(202, resp.length);
      try (OutputStream os = exchange.getResponseBody()) {
        os.write(resp);
      }
    });

    Client client = new Client(Config.builder()
        .baseUrl(baseUrl())
        .tenantId("tenant")
        .token("klog_test")
        .applicationId("app")
        .maxRetries(0)
        .onDropped(dropped::add)
        .build());

    Result result = client.warn("filtrado", null);
    assertTrue(result.dropped);
    assertEquals(List.of("evt-2"), dropped);
  }

  @Test
  void doesNotRetryUnauthorized() throws Exception {
    AtomicInteger calls = new AtomicInteger();
    server = start((exchange) -> {
      calls.incrementAndGet();
      byte[] resp = "{\"error\":\"unauthorized\"}".getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(401, resp.length);
      try (OutputStream os = exchange.getResponseBody()) {
        os.write(resp);
      }
    });

    Client client = new Client(Config.builder()
        .baseUrl(baseUrl())
        .tenantId("tenant")
        .token("bad")
        .applicationId("app")
        .maxRetries(3)
        .build());

    HttpError err = assertThrows(HttpError.class, () -> client.error("x", null));
    assertEquals(401, err.status);
    assertFalse(err.retryable);
    assertEquals(1, calls.get());
  }

  private String baseUrl() {
    return "http://127.0.0.1:" + server.getAddress().getPort();
  }

  private HttpServer start(Handler handler) throws IOException {
    HttpServer httpServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    httpServer.createContext("/", exchange -> {
      try {
        handler.handle(exchange);
      } catch (Exception e) {
        throw new IOException(e);
      }
    });
    httpServer.setExecutor(Executors.newCachedThreadPool());
    httpServer.start();
    this.server = httpServer;
    return httpServer;
  }

  @FunctionalInterface
  private interface Handler {
    void handle(com.sun.net.httpserver.HttpExchange exchange) throws Exception;
  }
}
