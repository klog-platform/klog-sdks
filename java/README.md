# kLog SDK para Java

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-com.kriverdevice:klog--sdk-blue.svg)](https://github.com/kriverdevice/klog-sdks/packages)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com%2Fdocs%2Fsdks-success.svg)](https://klog.krisskira.com/docs/sdks)

Cliente oficial para Java (JDK 17+) que emite telemetría y eventos hacia la API REST de kLog (`POST /v1/ingest/{tenantId}/events`). Utiliza el cliente HTTP estándar `java.net.http.HttpClient` del JDK, sin dependencias externas pesadas, con cola circular y despacho asíncrono seguro para hilos (`thread-safe`).

---

## 📦 Instalación

### Maven (`pom.xml`)

```xml
<dependency>
  <groupId>com.kriverdevice</groupId>
  <artifactId>klog-sdk</artifactId>
  <version>0.1.0</version>
</dependency>
```

### Gradle (`build.gradle` o `build.gradle.kts`)

```groovy
// Groovy
implementation 'com.kriverdevice:klog-sdk:0.1.0'

// Kotlin DSL
implementation("com.kriverdevice:klog-sdk:0.1.0")
```

---

## 🚀 Inicio Rápido

```java
package com.ejemplo;

import com.kriverdevice.klog.Client;
import com.kriverdevice.klog.Config;
import com.kriverdevice.klog.Result;

import java.util.Map;

public class App {
    public static void main(String[] args) {
        // Inicialización del cliente con configuración
        Config config = new Config(
            System.getenv().getOrDefault("KLOG_URL", "https://klog-api.krisskira.com"),
            System.getenv("KLOG_TENANT_ID"),       // UUIDv7 del tenant
            System.getenv("KLOG_TOKEN"),           // Token de proyecto klog_...
            System.getenv("KLOG_APPLICATION_ID")   // Opcional
        );

        try (Client client = new Client(config)) {
            // Emisión de eventos (no bloquea el hilo de ejecución)
            Result res = client.info("Pago procesado exitosamente", Map.of(
                "orderId", "ORD-8819",
                "customerTier", "enterprise",
                "amount", 1499.00
            ));

            System.out.printf("Evento registrado: id=%s (created=%b, dropped=%b)%n",
                res.id(), res.created(), res.dropped());

            client.error("Fallo de conexión en microservicio", Map.of(
                "service", "inventory",
                "retriesExhausted", true
            ));

            // Vaciado manual de la cola antes de terminar
            client.flush();
        }
    }
}
```

### Inicialización desde el Entorno

```java
// Carga automáticamente KLOG_URL, KLOG_TENANT_ID, KLOG_TOKEN y KLOG_APPLICATION_ID
Client client = Client.fromEnv();
client.info("Microservicio iniciado correctamente");
```

---

## ⚙️ Parámetros de Configuración

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `baseUrl` | `String` | **Sí** | URL base de la API de kLog (ej: `https://klog-api.krisskira.com` para prod, `https://klog-api-staging.krisskira.com` para staging). |
| `tenantId` | `String` | **Sí** | Identificador UUIDv7 del tenant. |
| `token` | `String` | **Sí** | Token Bearer emitido para el proyecto (`klog_...`). |
| `applicationId` | `String` | No | UUIDv7 de la aplicación emisora. |
| `maxQueueSize` | `int` | No | Capacidad del búfer en memoria (por defecto `1000`). |
| `timeoutSeconds` | `int` | No | Tiempo máximo de espera HTTP (por defecto `10s`). |
| `maxRetries` | `int` | No | Reintentos ante fallos temporales (por defecto `3`). |

---

## 🛡️ Políticas de Respuesta y Reintentos

- **`201` y `202` son válidos:** El objeto `Result` refleja si fue creado (`created()`) o descartado por un transform (`dropped()`).
- **Reintentos automáticos:** Ante caídas de red, códigos `429` (límite de tasa) y fallos `502`–`504`.
- **Sin reintento en errores definitivos:** Respuestas `400`, `401`, `403` lanzan excepción inmediatamente.

---

## 📖 Enlaces

- **Manual de Usuario:** [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- **Contrato OpenAPI:** [api/openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml)
- **Monorepo GitHub:** [github.com/kriverdevice/klog-sdks](https://github.com/kriverdevice/klog-sdks)
