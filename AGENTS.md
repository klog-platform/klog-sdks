# SDKs kLog

Esta carpeta agrupa los clientes de ingesta por lenguaje. No es un monorepo npm único: cada subcarpeta arranca sola.

| Carpeta | Qué es |
|---------|--------|
| `javascript/` | Workspaces npm: core, `@klog/sdk-node`, `@klog/sdk-web` |
| `go/` | Módulo Go `klog/sdk-go` |
| `python/` | Paquete `klog-sdk` |
| `php/` | Paquete Composer `klog/sdk-php` |
| `java/` | Artefacto Maven `io.klog:klog-sdk` |
| `esp/` | Biblioteca C/C++ para ESP32 (Arduino y ESP-IDF) |

## Invariantes

- Solo ingesta REST. GraphQL y la consola no viven aquí.
- Identificadores públicos UUIDv7; API token `klog_…`.
- 201 creado / 202 dropped; sin reintentos en 400/401/403.
- El contrato HTTP está en `../api/openapi/ingest.yaml`. Cada SDK define sus propios tipos.
- No reintroducir NATS, ClickHouse, una API en Node ni un RBAC de un solo rol.

Al editar un SDK, seguir el `AGENTS.md` de esa subcarpeta.

Responder en español.
