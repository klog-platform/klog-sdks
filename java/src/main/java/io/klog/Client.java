package io.klog;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

public final class Client implements AutoCloseable {
  private final Config config;
  private final HttpClient http;
  private final URI uri;
  private volatile boolean closed;

  public Client(Config config) {
    this(config, HttpClient.newBuilder().connectTimeout(config.timeout).build());
  }

  public Client(Config config, HttpClient http) {
    Objects.requireNonNull(config, "config");
    String base = config.baseUrl == null ? "" : config.baseUrl.trim().replaceAll("/+$", "");
    if (base.isEmpty() || config.tenantId.isBlank() || config.token.isBlank() || config.applicationId.isBlank()) {
      throw new IllegalArgumentException("faltan baseUrl, tenantId, token o applicationId");
    }
    this.config = config;
    this.http = Objects.requireNonNull(http, "http");
    this.uri = URI.create(base + "/v1/ingest/" + config.tenantId + "/events");
  }

  public static Client fromEnv() {
    return fromEnv(System.getenv());
  }

  public static Client fromEnv(Map<String, String> env) {
    String base = firstNonBlank(env.get("KLOG_URL"), env.get("KLOG_API_URL"));
    return new Client(Config.builder()
        .baseUrl(base == null ? "" : base)
        .tenantId(env.getOrDefault("KLOG_TENANT_ID", ""))
        .token(env.getOrDefault("KLOG_TOKEN", ""))
        .applicationId(env.getOrDefault("KLOG_APPLICATION_ID", ""))
        .build());
  }

  public Result debug(String message, Object payload) {
    return log(Entry.of("debug", message, payload));
  }

  public Result info(String message, Object payload) {
    return log(Entry.of("info", message, payload));
  }

  public Result warn(String message, Object payload) {
    return log(Entry.of("warn", message, payload));
  }

  public Result error(String message, Object payload) {
    return log(Entry.of("error", message, payload));
  }

  public Result log(Entry entry) {
    if (closed) throw new IllegalStateException("el cliente está cerrado");
    Entry normalized = normalize(entry);
    Exception last = null;
    int attempts = config.maxRetries + 1;
    for (int attempt = 1; attempt <= attempts; attempt++) {
      try {
        Result result = sendOnce(normalized);
        if (result.dropped && config.onDropped != null) {
          config.onDropped.accept(result.id);
        }
        return result;
      } catch (HttpError e) {
        last = e;
        if (!e.retryable) break;
      } catch (IOException | InterruptedException e) {
        last = e;
        if (e instanceof InterruptedException) {
          Thread.currentThread().interrupt();
        }
      }
      if (attempt >= attempts) break;
      long delay = Math.min(3200L, 200L * (1L << (attempt - 1))) + ThreadLocalRandom.current().nextInt(100);
      try {
        Thread.sleep(delay);
      } catch (InterruptedException ie) {
        Thread.currentThread().interrupt();
        throw new RuntimeException(ie);
      }
    }
    if (config.onError != null && last != null) {
      config.onError.accept(last);
    }
    if (last instanceof RuntimeException) {
      throw (RuntimeException) last;
    }
    throw new RuntimeException(last);
  }

  public void flush() {
    // Envío síncrono.
  }

  @Override
  public void close() {
    flush();
    closed = true;
  }

  private Entry normalize(Entry entry) {
    String message = entry.message == null || entry.message.isBlank() ? "(empty)" : entry.message;
    String level = entry.level == null || entry.level.isBlank() ? config.defaultLevel : entry.level;
    String applicationId = entry.applicationId == null || entry.applicationId.isBlank()
        ? config.applicationId : entry.applicationId;
    List<String> tags = entry.tags == null && !config.defaultTags.isEmpty() ? config.defaultTags : entry.tags;
    Object payload = entry.payload == null ? Map.of() : entry.payload;
    return new Entry(message, level, payload, tags, entry.traceId, applicationId);
  }

  private Result sendOnce(Entry entry) throws IOException, InterruptedException {
    Map<String, Object> body = new HashMap<>();
    body.put("message", entry.message);
    body.put("level", entry.level);
    body.put("applicationId", entry.applicationId);
    body.put("payload", entry.payload);
    if (entry.tags != null) body.put("tags", entry.tags);
    if (entry.traceId != null && !entry.traceId.isBlank()) body.put("traceId", entry.traceId);

    HttpRequest request = HttpRequest.newBuilder(uri)
        .timeout(config.timeout == null ? Duration.ofSeconds(10) : config.timeout)
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer " + config.token)
        .header("User-Agent", "klog-sdk-java/0.1")
        .POST(HttpRequest.BodyPublishers.ofString(Json.stringify(body)))
        .build();

    HttpResponse<String> response;
    try {
      response = http.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (IOException e) {
      throw new HttpError(0, e.getMessage() == null ? "network error" : e.getMessage(), true);
    }

    int status = response.statusCode();
    String raw = response.body() == null ? "" : response.body();
    String id = Json.extractId(raw);
    if (status == 201) return new Result(true, false, id, raw);
    if (status == 202) return new Result(false, true, id, raw);
    if (status == 429 || status == 502 || status == 503 || status == 504) {
      throw new HttpError(status, raw, true);
    }
    if (status == 400 || status == 401 || status == 403) {
      throw new HttpError(status, raw, false);
    }
    throw new HttpError(status, raw, status >= 500);
  }

  private static String firstNonBlank(String a, String b) {
    if (a != null && !a.isBlank()) return a;
    if (b != null && !b.isBlank()) return b;
    return "";
  }
}
