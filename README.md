# kLog SDKs

[![CI](https://github.com/klog-platform/klog-sdks/actions/workflows/ci.yml/badge.svg)](https://github.com/klog-platform/klog-sdks/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks)

Official **REST ingest** clients for [kLog](https://klog.krisskira.com/docs/intro).  
Also available in Spanish: [README.es.md](README.es.md)

Every client sends events to `POST /v1/ingest/{tenantId}/events` with a project API token (`Authorization: Bearer klog_<prefix>_<secret>`).

| | |
|---|---|
| **Docs** | [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks) |
| **OpenAPI** | [Interactive](https://klog.krisskira.com/docs/ingest-api) · [YAML](https://klog.krisskira.com/openapi/ingest.yaml) · [JSON](https://klog.krisskira.com/openapi/ingest.json) |
| **Repository** | [github.com/klog-platform/klog-sdks](https://github.com/klog-platform/klog-sdks) |

npm packages use the `@kriverdevice` scope; this repository lives under the `klog-platform` GitHub organization.

## Official clients

| Runtime | Package | Guide |
|---|---|---|
| **Node.js** | [`@kriverdevice/klog-node`](https://www.npmjs.com/package/@kriverdevice/klog-node) | [javascript/README.md](javascript/README.md) |
| **Browser / Web** | [`@kriverdevice/klog-web`](https://www.npmjs.com/package/@kriverdevice/klog-web) | [javascript/README.md](javascript/README.md#browser--frameworks) |
| **Go** | `github.com/klog-platform/klog-sdks/go` | [go/README.md](go/README.md) |
| **Python** | [`klog-sdk`](https://pypi.org/project/klog-sdk/) | [python/README.md](python/README.md) |
| **PHP** | [`kriverdevice/klog-sdk-php`](https://packagist.org/packages/kriverdevice/klog-sdk-php) | [php/README.md](php/README.md) |
| **Java** | `com.kriverdevice:klog-sdk` | [java/README.md](java/README.md) |
| **ESP32** | `klog` (Arduino / ESP-IDF) | [esp/README.md](esp/README.md) |

Shared contract: **201** stored · **202** dropped by filter transform · retry on network / `429` / `502`–`504` · **no retry** on `400` / `401` / `403`.

### Quick install

```bash
npm install @kriverdevice/klog-node          # or @kriverdevice/klog-web
go get github.com/klog-platform/klog-sdks/go@latest
pip install klog-sdk
composer require kriverdevice/klog-sdk-php
```

Configure `KLOG_URL`, `KLOG_TENANT_ID`, `KLOG_TOKEN`, and `KLOG_APPLICATION_ID` (or the language-specific config fields).  
Base URLs: `https://klog-api.krisskira.com` (prod) · `https://klog-api-staging.krisskira.com` (staging) · `http://localhost:3100` (local).

## Other clients (HTTP)

You can call the ingest API from any HTTP stack. Examples below are **not** official SDKs.

### curl

```bash
curl -sS -X POST "$KLOG_URL/v1/ingest/$KLOG_TENANT_ID/events" \
  -H "Authorization: Bearer $KLOG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "'"$KLOG_APPLICATION_ID"'",
    "level": "info",
    "message": "hello from curl"
  }'
```

### Android (Kotlin)

```kotlin
val body = """{"applicationId":"$appId","level":"info","message":"hello from android"}"""
val req = Request.Builder()
  .url("$baseUrl/v1/ingest/$tenantId/events")
  .addHeader("Authorization", "Bearer $token")
  .addHeader("Content-Type", "application/json")
  .post(body.toRequestBody("application/json".toMediaType()))
  .build()
client.newCall(req).execute().use { /* 201 or 202 = success */ }
```

### Swift

```swift
var request = URLRequest(url: URL(string: "\(baseUrl)/v1/ingest/\(tenantId)/events")!)
request.httpMethod = "POST"
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try JSONSerialization.data(withJSONObject: [
  "applicationId": applicationId,
  "level": "info",
  "message": "hello from ios",
])
let (_, response) = try await URLSession.shared.data(for: request)
// Treat HTTP 201 and 202 as success
```

## Source layout

```
javascript/   @kriverdevice/klog-core · klog-node · klog-web
go/           Go module
python/       klog-sdk (import klog_sdk)
php/          kriverdevice/klog-sdk-php
java/         com.kriverdevice:klog-sdk
esp/          Arduino + ESP-IDF
```
