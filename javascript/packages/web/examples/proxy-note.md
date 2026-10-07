# Browser y proxy

`@klog/sdk-web` añade el Bearer en el cliente. Eso implica:

1. Cualquiera puede leer el token del bundle.
2. El origen de la SPA debe estar en `CORS_ORIGIN` de la API, o las peticiones fallan.

Patrón recomendado en producción:

```
Browser  -->  POST /klog-proxy/v1/ingest/{tenantId}/events  (same-origin)
Proxy/BFF -->  POST {API}/v1/ingest/{tenantId}/events  (con Bearer real)
```

El SDK web sirve para demos, entornos controlados o cuando el token es deliberadamente “publicable” (rate-limited y rotado).
