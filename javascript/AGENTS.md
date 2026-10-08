# SDK kLog

Bibliotecas JavaScript para la ingesta REST. GraphQL y la consola no viven aquí.

| Paquete | Destino |
|---------|---------|
| `@klog/sdk-core` | Cola, reintentos, validación y transporte HTTP |
| `@klog/sdk-node` | Node 18+ |
| `@klog/sdk-web` | Browser (token expuesto: preferir proxy) |

## Arranque

Desde la raíz del repo `sdks`:

```bash
npm install
npm run check
```

Solo estos paquetes: `npx turbo run lint test build --filter=@klog/sdk-core --filter=@klog/sdk-node --filter=@klog/sdk-web`.

Los esquemas del evento viven en `packages/core/src/domain/ingest.ts`.

## Invariantes

- Un evento por `POST /v1/ingest/{tenantId}/events`.
- API token `klog_…`; no loguear el secreto.
- No reintentar 400, 401 ni 403.
- 201 = creado; 202 = descartado por transform.

Responder en español.
