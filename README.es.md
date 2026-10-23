# SDKs kLog

[![CI](https://github.com/klog-platform/klog-sdks/actions/workflows/ci.yml/badge.svg)](https://github.com/klog-platform/klog-sdks/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks?lang=es)

Clientes oficiales de **ingesta REST** para [kLog](https://klog.krisskira.com/docs/intro?lang=es).  
Also available in English: [README.md](README.md)

Todos envían eventos a `POST /v1/ingest/{tenantId}/events` con API token de proyecto (`Authorization: Bearer klog_<prefix>_<secret>`).

| | |
|---|---|
| **Docs** | [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks?lang=es) |
| **OpenAPI** | [Interactivo](https://klog.krisskira.com/docs/ingest-api) · [YAML](https://klog.krisskira.com/openapi/ingest.yaml) · [JSON](https://klog.krisskira.com/openapi/ingest.json) |
| **Repositorio** | [github.com/klog-platform/klog-sdks](https://github.com/klog-platform/klog-sdks) |

Los paquetes npm usan el scope `@kriverdevice`; este repositorio está en la organización GitHub `klog-platform`.

## Clientes oficiales

| Runtime | Paquete | Guía |
|---|---|---|
| **Node.js** | [`@kriverdevice/klog-node`](https://www.npmjs.com/package/@kriverdevice/klog-node) | [javascript/README.es.md](javascript/README.es.md) |
| **Browser / Web** | [`@kriverdevice/klog-web`](https://www.npmjs.com/package/@kriverdevice/klog-web) | [javascript/README.es.md](javascript/README.es.md) |
| **Go** | `github.com/klog-platform/klog-sdks/go` | [go/README.es.md](go/README.es.md) |
| **Python** | [`klog-sdk`](https://pypi.org/project/klog-sdk/) | [python/README.es.md](python/README.es.md) |
| **PHP** | [`kriverdevice/klog-sdk-php`](https://packagist.org/packages/kriverdevice/klog-sdk-php) | [php/README.es.md](php/README.es.md) |
| **Java** | `com.kriverdevice:klog-sdk` | [java/README.es.md](java/README.es.md) |
| **ESP32** | `klog` (Arduino / ESP-IDF) | [esp/README.es.md](esp/README.es.md) |

Contrato: **201** persistido · **202** descartado por filter · reintento en red / `429` / `502`–`504` · **sin reintento** en `400` / `401` / `403`.

### Instalación rápida

```bash
npm install @kriverdevice/klog-node
go get github.com/klog-platform/klog-sdks/go@latest
pip install klog-sdk
composer require kriverdevice/klog-sdk-php
```

Variables: `KLOG_URL`, `KLOG_TENANT_ID`, `KLOG_TOKEN`, `KLOG_APPLICATION_ID`.  
URLs: `https://klog-api.krisskira.com` (prod) · `https://klog-api-staging.krisskira.com` (staging) · `http://localhost:3100` (local).

## Otros clientes (HTTP)

Puedes llamar a la API desde cualquier stack HTTP. Los ejemplos siguientes **no** son SDKs oficiales.

### curl

```bash
curl -sS -X POST "$KLOG_URL/v1/ingest/$KLOG_TENANT_ID/events" \
  -H "Authorization: Bearer $KLOG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "'"$KLOG_APPLICATION_ID"'",
    "level": "info",
    "message": "hola desde curl"
  }'
```

Ver también snippets **Kotlin** y **Swift** en [README.md](README.md#other-clients-http).
