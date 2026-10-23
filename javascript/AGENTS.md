# SDK kLog

Bibliotecas JavaScript para la ingesta REST. GraphQL y la consola no viven aquí.

| Paquete | Destino |
|---------|---------|
| `@kriverdevice/klog-core` | Cola, reintentos, validación y transporte HTTP |
| `@kriverdevice/klog-node` | Node 22.12+ |
| `@kriverdevice/klog-web` | Browser (token expuesto: preferir proxy) |

## Arranque

Desde la raíz del repo `klog-sdks`:

```bash
npm install
npm run check
```

Solo estos paquetes: `npx turbo run lint test build --filter=@kriverdevice/klog-core --filter=@kriverdevice/klog-node --filter=@kriverdevice/klog-web`.

Los esquemas del evento viven en `packages/core/src/domain/ingest.ts`.

## Invariantes

- Un evento por `POST /v1/ingest/{tenantId}/events`.
- API token `klog_…`; no loguear el secreto.
- No reintentar 400, 401 ni 403.
- 201 = creado; 202 = descartado por transform.
- Docs: `https://klog.krisskira.com` · API: `https://klog-api.krisskira.com`.

Responder en español.
