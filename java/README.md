# kLog SDK for Java

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-com.kriverdevice:klog--sdk-blue.svg)](https://github.com/klog-platform/klog-sdks/packages)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks?lang=en)

Official REST ingest client for Java 17+ (`java.net.http`).  
Español: [README.es.md](README.es.md)

```xml
<dependency>
  <groupId>com.kriverdevice</groupId>
  <artifactId>klog-sdk</artifactId>
  <version>0.1.0</version>
</dependency>
```

GitHub Packages registry: `https://maven.pkg.github.com/klog-platform/klog-sdks`

```java
import com.kriverdevice.klog.Client;
import com.kriverdevice.klog.Config;
import java.util.Map;

var client = new Client(Config.builder()
    .baseUrl(System.getenv().getOrDefault("KLOG_URL", "https://klog-api.krisskira.com"))
    .tenantId(System.getenv("KLOG_TENANT_ID"))
    .token(System.getenv("KLOG_TOKEN"))
    .applicationId(System.getenv("KLOG_APPLICATION_ID"))
    .build());
client.info("job.finished", Map.of("ok", true));
client.flush();
client.close();
```

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks?lang=en)
- Source: [tree/main/java](https://github.com/klog-platform/klog-sdks/tree/main/java)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)
