# kLog JavaScript SDKs

[![npm node](https://img.shields.io/npm/v/@kriverdevice/klog-node.svg?label=@kriverdevice/klog-node)](https://www.npmjs.com/package/@kriverdevice/klog-node)
[![npm web](https://img.shields.io/npm/v/@kriverdevice/klog-web.svg?label=@kriverdevice/klog-web)](https://www.npmjs.com/package/@kriverdevice/klog-web)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks)

Official ingest clients for **Node.js** and the **browser**.  
Español: [README.es.md](README.es.md)

| Package | Use |
|---|---|
| `@kriverdevice/klog-node` | Servers, workers, scripts (Node 22.12+) |
| `@kriverdevice/klog-web` | Browsers (prefer a same-origin proxy in production) |
| `@kriverdevice/klog-core` | Shared queue / retries / validation (dependency) |

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- Source: [github.com/klog-platform/klog-sdks/tree/main/javascript](https://github.com/klog-platform/klog-sdks/tree/main/javascript)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)

## Install

```bash
npm install @kriverdevice/klog-node
# or
npm install @kriverdevice/klog-web
```

## Configuration

| Option / env | Required | Description |
|---|---|---|
| `baseUrl` / `KLOG_URL` | Yes | e.g. `https://klog-api.krisskira.com` |
| `tenantId` / `KLOG_TENANT_ID` | Yes | Organization UUIDv7 |
| `token` / `KLOG_TOKEN` | Yes | `klog_<prefix>_<secret>` |
| `applicationId` / `KLOG_APPLICATION_ID` | Yes | Application UUIDv7 |

## Node.js

```ts
import { createClient, createClientFromEnv } from "@kriverdevice/klog-node";

const client = createClient({
  baseUrl: process.env.KLOG_URL ?? "https://klog-api.krisskira.com",
  tenantId: process.env.KLOG_TENANT_ID!,
  token: process.env.KLOG_TOKEN!,
  applicationId: process.env.KLOG_APPLICATION_ID!,
});

client.info("order.created", { orderId: "ord_1" });
await client.flush();
await client.close();

// Or from environment:
const fromEnv = createClientFromEnv();
```

## Browser & frameworks

In production, do **not** embed long-lived API tokens in frontend bundles. Proxy `/klog-proxy` (or similar) to the API and inject `Authorization` on the server.

### Vanilla JavaScript

```html
<script type="module">
  import { createClient } from "https://esm.sh/@kriverdevice/klog-web";

  const client = createClient({
    baseUrl: "/klog-proxy",
    tenantId: "YOUR_TENANT_UUID",
    token: "injected-by-proxy-or-short-lived",
    applicationId: "YOUR_APP_UUID",
  });

  document.getElementById("btn").onclick = () => {
    client.info("ui.click", { path: location.pathname });
  };
</script>
```

### React

```tsx
import { useEffect, useRef } from "react";
import { createClient } from "@kriverdevice/klog-web";

export function useKlog() {
  const ref = useRef<ReturnType<typeof createClient>>();
  useEffect(() => {
    ref.current = createClient({
      baseUrl: "/klog-proxy",
      tenantId: import.meta.env.VITE_KLOG_TENANT_ID,
      token: import.meta.env.VITE_KLOG_TOKEN,
      applicationId: import.meta.env.VITE_KLOG_APPLICATION_ID,
    });
    return () => { void ref.current?.close(); };
  }, []);
  return ref;
}

// usage: klog.current?.info("page.view", { route });
```

### React Native

Use `@kriverdevice/klog-node` patterns with your bundler’s `fetch`, or call REST with the same headers. Prefer keeping the token in secure storage / a BFF, not in the JS bundle.

```ts
import { createClient } from "@kriverdevice/klog-web"; // fetch-based transport

const client = createClient({
  baseUrl: "https://your-bff.example.com/klog",
  tenantId,
  token,
  applicationId,
});
client.info("screen.open", { name: "Home" });
```

### Vue 3

```ts
import { onMounted, onUnmounted } from "vue";
import { createClient } from "@kriverdevice/klog-web";

export function useKlog() {
  let client: ReturnType<typeof createClient> | undefined;
  onMounted(() => {
    client = createClient({ baseUrl: "/klog-proxy", tenantId, token, applicationId });
  });
  onUnmounted(() => { void client?.close(); });
  return { info: (m: string, p?: object) => client?.info(m, p) };
}
```

### Angular

```ts
import { Injectable, OnDestroy } from "@angular/core";
import { createClient, type KlogClient } from "@kriverdevice/klog-web";

@Injectable({ providedIn: "root" })
export class KlogService implements OnDestroy {
  private client: KlogClient = createClient({
    baseUrl: "/klog-proxy",
    tenantId: "...",
    token: "...",
    applicationId: "...",
  });
  info(message: string, payload?: Record<string, unknown>) {
    this.client.info(message, payload);
  }
  ngOnDestroy() { void this.client.close(); }
}
```

### Server templates (Laravel / Python)

Emit events from the **backend** with `@kriverdevice/klog-node`, `klog-sdk` (Python), or `kriverdevice/klog-sdk-php` — not from Blade/Jinja with a secret token in HTML.

```php
// Laravel: use the PHP SDK in a job/controller
$client->info('invoice.paid', ['id' => $invoice->id]);
```

```python
# Django/Flask: use klog-sdk
client.info("request.handled", {"path": request.path})
```

## Responses & retries

- `201` created · `202` dropped by transform filter (success)
- Retries: network, `429`, `502`–`504`
- No retries: `400`, `401`, `403`
