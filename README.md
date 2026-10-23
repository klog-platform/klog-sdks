# kLog SDKs — Monorepo Oficial de Ingesta

[![CI](https://github.com/kriverdevice/klog-sdks/actions/workflows/ci.yml/badge.svg)](https://github.com/kriverdevice/klog-sdks/actions/workflows/ci.yml)
[![Deploy](https://github.com/kriverdevice/klog-sdks/actions/workflows/deploy.yml/badge.svg)](https://github.com/kriverdevice/klog-sdks/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-klog.krisskira.com%2Fdocs%2Fsdks-success.svg)](https://klog.krisskira.com/docs/sdks)

Clientes oficiales para la ingesta REST de telemetría y eventos (`POST /v1/ingest/{tenantId}/events`) en la plataforma **kLog**.

- **Organización:** [`kriverdevice`](https://github.com/kriverdevice) (npm scope `@kriverdevice`)
- **Team / producto:** `klog`
- Monorepo unificado con **Turborepo**. Cada ecosistema conserva sus herramientas nativas; la raíz orquesta `lint`, `test` y `build`.

---

## Matriz de SDKs y gestores

| Lenguaje / Runtime | Paquete oficial | Gestor | Instalación (prod) | Staging |
|---|---|---|---|---|
| **Node.js (22.12+)** | [`@kriverdevice/klog-node`](javascript/packages/node) | npm | `npm install @kriverdevice/klog-node` | `@beta` |
| **Web / Browser** | [`@kriverdevice/klog-web`](javascript/packages/web) | npm | `npm install @kriverdevice/klog-web` | `@beta` |
| **Go (1.22+)** | [`github.com/kriverdevice/klog-sdks/go`](go/) | Go Modules | `go get github.com/kriverdevice/klog-sdks/go@latest` | tag `stg` |
| **Python (3.10+)** | [`klog-sdk`](python/) | PyPI | `pip install klog-sdk` | TestPyPI |
| **PHP (8.1+)** | [`kriverdevice/klog-sdk-php`](php/) | Packagist | `composer require kriverdevice/klog-sdk-php` | `dev-stg` |
| **Java (17+)** | [`com.kriverdevice:klog-sdk`](java/) | Maven / GH Packages | ver README Java | GitHub Packages |
| **ESP32 (IoT)** | [`klog`](esp/) | Arduino / ESP-IDF | [Releases (.zip)](https://github.com/kriverdevice/klog-sdks/releases) | Artifact ZIP en CI |

---

## Contrato homogéneo de ingesta

1. **Protocolo:** REST HTTP/HTTPS hacia `POST /v1/ingest/{tenantId}/events`.
2. **Autenticación:** `Authorization: Bearer klog_<prefix>_<secret>`.
3. **No bloqueante por defecto:** búfer circular en memoria con vaciado asíncrono.
4. **Respuestas:** `201 Created` (persistido) · `202 Accepted` (descartado por transform/`filter`).
5. **Reintentos:** red, `429`, `502`–`504`. **Sin reintento** en `400` / `401` / `403`.
6. **Seguridad:** el secreto del token no va a logs ni al cuerpo del evento. En browser, preferir proxy same-origin.

---

## Desarrollo en el monorepo

### Requisitos

- Node.js ≥ 22.12
- Go ≥ 1.22
- Python ≥ 3.10
- PHP ≥ 8.1 con extensión `curl`
- Java JDK ≥ 17 y Apache Maven
- GCC / Make (pruebas host ESP32)

### Instalación y verificación

```bash
npm install
npm run check   # lint + test + build (6 lenguajes)
```

```bash
npm run lint
npm run test
npm run build
```

Filtros Turborepo:

```bash
npx turbo run test --filter=@kriverdevice/klog-node
npx turbo run test --filter=@kriverdevice/klog-sdk-python
npx turbo run test --filter=@kriverdevice/klog-sdk-go
```

---

## Flujos de Git y release

- **`ci.yml`:** lint/test/build en PRs y pushes; **no publica**.
- **`deploy.yml`:** publica a registries (stg → beta/TestPyPI; prod → tags `v*.*.*` / `sdk-*-v*.*.*`).

### Staging (`stg`)

Push a `stg` o `workflow_dispatch` con `environment: stg`.

### Producción

Tag semántico en historia de `prod`, o dispatch con `environment: prod`.

---

## Dominios canónicos

- **Portal / docs SDKs:** `https://klog.krisskira.com/docs/sdks`
- **API (prod):** `https://klog-api.krisskira.com`
- **API (staging):** `https://klog-api-staging.krisskira.com`
- **Local:** `http://localhost:3100`

---

## Enlaces

- Manual público: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- Contrato OpenAPI: [openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml)
- Confluence KLOG: [Índice SDK](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/327689/ndice+sdk)
