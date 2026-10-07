import io.klog.Client;
import io.klog.Result;

import java.util.Map;

public final class BasicExample {
  public static void main(String[] args) {
    try (Client client = Client.fromEnv()) {
      Result result = client.info("hola desde Java", Map.of("sdk", "java"));
      System.out.printf("created=%s dropped=%s id=%s%n", result.created, result.dropped, result.id);
    }
  }
}
