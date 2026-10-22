# SDKs kLog

Clientes oficiales para la ingesta REST (`POST /v1/ingest/{tenantId}/events`).

Un solo repositorio, orquestado con Turborepo. Cada lenguaje sigue usando su herramienta; la raíz solo encadena lint, test y build.

```bash
npm install
npm run check
```

| Comando | Qué hace |
|---------|----------|
| `npm run lint` | Tipos en TypeScript, `gofmt` + `go vet`, Ruff, `php -l`, compilación Java y ESP con `-Werror` |
| `npm run test` | Vitest, `go test`, pytest, PHPUnit, JUnit y las pruebas host de ESP |
| `npm run build` | `tsc`, `go build`, `compileall`, `composer validate`, `mvn package` y el objeto C |
| `npm run check` | Las tres tareas, en ese orden por paquete |

Hace falta Node 22 (sirve 18+), Go 1.22, Python 3.10, PHP 8.1, Java 17 y gcc. Python usa `.venv` si existe (`python3 -m venv .venv && .venv/bin/python -m pip install -e ".[dev]"`); si no, `python3`. PHP pide `composer install` en su carpeta. El pipeline de git es `.github/workflows/ci.yml`; no publica paquetes.

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

Cada SDK documenta su arranque en su `README.md`.

## Documentación oficial

Fuente operativa: Confluence **KLOG**. El repo `../docs` es el respaldo en Git.

| Tema | Confluence | Repo (backup / local) |
|------|------------|------------------------|
| Índice SDK | [Índice — sdk](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/327689/ndice+sdk) | [`docs/wiki/sdk/`](../docs/wiki/sdk/) |
| Arquitectura y flujos | [Arquitectura Y Flujos](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/1179649/Arquitectura+Y+Flujos) | [`arquitectura-y-flujos.md`](../docs/wiki/sdk/arquitectura-y-flujos.md) |
| Features por lenguaje | [Features Por Lenguaje](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/950314/Features+Por+Lenguaje) | [`features-por-lenguaje.md`](../docs/wiki/sdk/features-por-lenguaje.md) |
| Contrato ingesta | [Contrato Ingesta](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/1146902/Contrato+Ingesta) | OpenAPI en `api`: [`../api/openapi/ingest.yaml`](../api/openapi/ingest.yaml) |
| SDKs e ingesta | [13-sdks-e-ingesta](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/65891/13-sdks-e-ingesta) | [`docs/13-sdks-e-ingesta.md`](../docs/13-sdks-e-ingesta.md) |
| Vista de sistema | [Vista Sistema](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/589831/Vista+Sistema) | [`vista-sistema.md`](../docs/wiki/arquitectura/vista-sistema.md) |
| Mapa Atlassian | — | [`docs/atlassian-sync.md`](../docs/atlassian-sync.md) |
