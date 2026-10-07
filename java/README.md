# kLog SDK para Java

```xml
<dependency>
  <groupId>io.klog</groupId>
  <artifactId>klog-sdk</artifactId>
  <version>0.1.0</version>
</dependency>
```

```java
import io.klog.Client;
import io.klog.Config;
import io.klog.Result;

var client = Client.fromEnv();
Result result = client.info("Pedido creado", Map.of("orderId", "42"));
client.flush();
client.close();
```

Variables: `KLOG_URL`, `KLOG_TENANT_ID`, `KLOG_TOKEN`, `KLOG_APPLICATION_ID`.

- `201` creado / `202` dropped.
- Reintentos en red, `429`, `502`–`504`.
- No reintenta `400`/`401`/`403`.
- Usa `java.net.http.HttpClient` (JDK 17+).
