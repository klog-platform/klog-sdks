# SDKs kLog

Clientes oficiales para la ingesta REST (`POST /v1/ingest/{tenantId}/events`).

| Carpeta | Lenguaje / plataforma | Paquetes |
|---------|----------------------|----------|
| [`javascript/`](javascript/) | Node 18+ y navegador | `@klog/sdk-node`, `@klog/sdk-web` |
| [`go/`](go/) | Go 1.22+ | `klog/sdk-go` |
| [`python/`](python/) | Python 3.10+ | `klog-sdk` |
| [`php/`](php/) | PHP 8.1+ | `klog/sdk-php` |
| [`java/`](java/) | Java 17+ | `io.klog:klog-sdk` |
| [`esp/`](esp/) | ESP32 (Arduino + ESP-IDF) | componente C/C++ `klog` |

## Contrato común

- Autenticación con API token `klog_…` (header `Authorization: Bearer …`).
- Un evento por POST. Cuerpo: `message`, opcional `level`, `traceId`, `payload`, `tags`, `applicationId`.
- `201` = creado; `202` = descartado por transform; no reintentar `400`/`401`/`403`.
- Reintentar red, `429` y `502`–`504` con backoff.
- Nunca registrar el secreto del token.

Cada SDK documenta su arranque en su `README.md`. La wiki vive en [`docs/wiki/sdk/`](../docs/wiki/sdk/).

Documentación de flujos y features:

- [Arquitectura y flujos](../docs/wiki/sdk/arquitectura-y-flujos.md)
- [Features por lenguaje](../docs/wiki/sdk/features-por-lenguaje.md)
- [Vista de sistema](../docs/wiki/arquitectura/vista-sistema.md)
- Entrada numerada: [13-sdks-e-ingesta.md](../docs/13-sdks-e-ingesta.md)
