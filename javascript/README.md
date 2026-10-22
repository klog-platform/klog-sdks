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
cd ..   # raíz del repo sdks, si aún no instalaste
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

Instala en la raíz del repo `sdks`:

```bash
cd ..
npm install
npm run check
```

Node ≥18. `@klog/sdk-core`, `@klog/sdk-node` y `@klog/sdk-web` son workspaces de esa raíz. Para correr solo JavaScript: `npx turbo run lint test build --filter=@klog/sdk-core --filter=@klog/sdk-node --filter=@klog/sdk-web`.

## Publicación y versionado

Versión actual **0.1.0** (pre-1.0). Paquetes `private` hasta el primer release
en npm. Orden de publicación previsto: core → node → web.

Documentación completa (Confluence): [Índice — sdk](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/327689/ndice+sdk)
(quickstarts, esquema, reintentos, CORS, rotación). Respaldo Git:
[`docs/wiki/sdk/`](../../docs/wiki/sdk/README.md).

## Seguridad

- El API token autentica solo la ingesta REST. No sirve para GraphQL.
- En el navegador el token es visible: el patrón recomendado es un proxy same-origin.
- Nunca registres el Bearer en logs.
- Respeta `429` (rate limit de ingesta en la API).

## Contrato

OpenAPI (repo `api`): [`../../api/openapi/ingest.yaml`](../../api/openapi/ingest.yaml).
Especificación legible: [Contrato Ingesta](https://krisskira.atlassian.net/wiki/spaces/KLOG/pages/1146902/Contrato+Ingesta).
