# SDKs JavaScript kLog

[![npm node](https://img.shields.io/npm/v/@kriverdevice/klog-node.svg?label=@kriverdevice/klog-node)](https://www.npmjs.com/package/@kriverdevice/klog-node)
[![npm web](https://img.shields.io/npm/v/@kriverdevice/klog-web.svg?label=@kriverdevice/klog-web)](https://www.npmjs.com/package/@kriverdevice/klog-web)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks?lang=es)

Clientes oficiales de ingesta para **Node.js** y el **navegador**.  
English: [README.md](README.md)

| Paquete | Uso |
|---|---|
| `@kriverdevice/klog-node` | Servidores y workers (Node 22.12+) |
| `@kriverdevice/klog-web` | Navegador (preferir proxy same-origin en producción) |
| `@kriverdevice/klog-core` | Cola / reintentos / validación (dependencia) |

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks?lang=es)
- Código: [tree/main/javascript](https://github.com/klog-platform/klog-sdks/tree/main/javascript)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)

## Instalación

```bash
npm install @kriverdevice/klog-node
# o
npm install @kriverdevice/klog-web
```

## Configuración

| Opción / env | Requerido | Descripción |
|---|---|---|
| `baseUrl` / `KLOG_URL` | Sí | p. ej. `https://klog-api.krisskira.com` |
| `tenantId` / `KLOG_TENANT_ID` | Sí | UUIDv7 de la organización |
| `token` / `KLOG_TOKEN` | Sí | `klog_<prefix>_<secret>` |
| `applicationId` / `KLOG_APPLICATION_ID` | Sí | UUIDv7 de la aplicación |

## Node.js

```ts
import { createClient } from "@kriverdevice/klog-node";

const client = createClient({
  baseUrl: process.env.KLOG_URL ?? "https://klog-api.krisskira.com",
  tenantId: process.env.KLOG_TENANT_ID!,
  token: process.env.KLOG_TOKEN!,
  applicationId: process.env.KLOG_APPLICATION_ID!,
});

client.info("order.created", { orderId: "ord_1" });
await client.flush();
await client.close();
```

## Navegador y frameworks

No incrustes tokens de larga vida en el bundle frontend. Usa un proxy same-origin.

Ejemplos (vanilla, React, React Native, Vue, Angular, Laravel/Python) en la versión en inglés: [README.md](README.md#browser--frameworks).

## Respuestas y reintentos

- `201` creado · `202` descartado por filter (éxito)
- Reintentos: red, `429`, `502`–`504`
- Sin reintento: `400`, `401`, `403`
