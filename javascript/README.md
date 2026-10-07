# SDK kLog

Clientes JavaScript para enviar eventos a la API de ingesta de kLog.

## Paquetes

| Paquete | Uso |
|---------|-----|
| [`@klog/sdk-node`](packages/node) | Servidores Node 18+ |
| [`@klog/sdk-web`](packages/web) | Navegador (con advertencias de CORS y token) |
| [`@klog/sdk-core`](packages/core) | Núcleo compartido (no se usa solo) |

## Quick start (Node)

```bash
npm install
npm run build
```

```ts
import { createClient } from "@klog/sdk-node";

const klog = createClient({
  baseUrl: process.env.KLOG_URL!,
  tenantId: process.env.KLOG_TENANT_ID!,
  token: process.env.KLOG_TOKEN!,
  applicationId: process.env.KLOG_APPLICATION_ID!,
});

await klog.info("Pedido creado", { orderId: "42" });
await klog.flush();
await klog.close();
```

Variables de ejemplo: [`.env.example`](.env.example).

## Arranque del monorepo

```bash
npm install
npm run build
npm test
```

Node ≥18. Workspaces en `packages/*`.

## Publicación y versionado

Versión actual **0.1.0** (pre-1.0). Paquetes `private` hasta el primer release
en npm. Orden de publicación previsto: core → node → web.

Documentación completa: [wiki SDK](../../docs/wiki/sdk/README.md) (quickstarts,
esquema, reintentos, CORS, rotación).

## Seguridad

- El API token autentica solo la ingesta REST. No sirve para GraphQL.
- En el navegador el token es visible: el patrón recomendado es un proxy same-origin.
- Nunca registres el Bearer en logs.
- Respeta `429` (rate limit de ingesta en la API).

## Contrato

OpenAPI: [`../api/openapi/ingest.yaml`](../api/openapi/ingest.yaml).
