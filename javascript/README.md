# kLog SDK para JavaScript y TypeScript

[![npm version (node)](https://img.shields.io/npm/v/@kriverdevice/klog-node.svg?label=@kriverdevice/klog-node)](https://www.npmjs.com/package/@kriverdevice/klog-node)
[![npm version (web)](https://img.shields.io/npm/v/@kriverdevice/klog-web.svg?label=@kriverdevice/klog-web)](https://www.npmjs.com/package/@kriverdevice/klog-web)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com%2Fdocs%2Fsdks-success.svg)](https://klog.krisskira.com/docs/sdks)

Clientes oficiales para Node.js y Navegador desarrollados por **Kriver Devices** (team `klog`) que envían eventos de telemetría a la API de ingesta REST de kLog (`POST /v1/ingest/{tenantId}/events`).

---

## 📦 Paquetes e Instalación

### 1. Entorno Node.js (Servidor / Microservicios)

Para servidores backend Node.js (v22.12 o superior):

```bash
# Versión oficial estable (Producción)
npm install @kriverdevice/klog-node

# Versión preliminar (Staging)
npm install @kriverdevice/klog-node@beta
```

*(O con tu gestor preferido: `pnpm add @kriverdevice/klog-node` o `yarn add @kriverdevice/klog-node`)*

### 2. Entorno Web / Navegador (Browser)

Para aplicaciones frontend (React, Vue, Vite, etc.):

```bash
# Versión oficial estable (Producción)
npm install @kriverdevice/klog-web

# Versión preliminar (Staging)
npm install @kriverdevice/klog-web@beta
```

---

## 🚀 Inicio Rápido

### En Node.js con TypeScript / ESM

```typescript
import { createClient } from "@kriverdevice/klog-node";

// Inicialización del cliente
const klog = createClient({
  baseUrl: process.env.KLOG_URL || "https://klog-api.krisskira.com",
  tenantId: process.env.KLOG_TENANT_ID!,       // UUIDv7 de tu organización
  token: process.env.KLOG_TOKEN!,             // API Token de proyecto (klog_...)
  applicationId: process.env.KLOG_APPLICATION_ID, // Opcional: ID de la aplicación
});

// Emisión de eventos (no bloquea el hilo de ejecución)
await klog.info("Usuario inició sesión", {
  userId: "usr_12345",
  authMethod: "password",
});

await klog.error("Falla al procesar transacción", {
  orderId: "ord_9981",
  amount: 450.00,
  reason: "Fondos insuficientes",
});

// Al cerrar la aplicación o función serverless, vacía la cola en memoria
await klog.flush();
await klog.close();
```

### Inicialización automática desde variables de entorno

```typescript
import { createClientFromEnv } from "@kriverdevice/klog-node";

// Lee KLOG_URL, KLOG_TENANT_ID, KLOG_TOKEN y KLOG_APPLICATION_ID automáticamente
const klog = createClientFromEnv();
await klog.info("Servicio iniciado");
```

### En el Navegador (Browser)

```typescript
import { createClient } from "@kriverdevice/klog-web";

const klog = createClient({
  baseUrl: "/api/telemetry", // Recomendado: endpoint proxy en el mismo dominio
  tenantId: "018e3a2b-c456-7890-abcd-ef0123456789",
  token: "klog_...",
});

// Registra la interacción del usuario sin bloquear el renderizado
klog.info("Botón de checkout clickeado", {
  cartItemsCount: 3,
});
```

---

## ⚙️ Parámetros de Configuración

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `baseUrl` | `string` | **Sí** | URL base de la API de kLog (ej: `https://klog-api.krisskira.com` para prod, `https://klog-api-staging.krisskira.com` para staging, o `http://localhost:3100`). |
| `tenantId` | `string` | **Sí** | Identificador UUIDv7 del tenant u organización receptora. |
| `token` | `string` | **Sí** | API token de proyecto con prefijo `klog_`. |
| `applicationId` | `string` | No | UUIDv7 de la aplicación emisora registrada en el catálogo. |
| `maxQueueSize` | `number` | No | Capacidad máxima del búfer en memoria (por defecto: `1000`). |
| `maxConcurrency` | `number` | No | Número máximo de peticiones simultáneas (por defecto: `4`). |
| `timeoutMs` | `number` | No | Tiempo máximo de espera HTTP por petición en ms (por defecto: `10000`). |
| `maxRetries` | `number` | No | Número de reintentos ante fallos transitorios de red o HTTP 429 (por defecto: `3`). |

---

## 🛡️ Políticas de Respuesta y Reintentos

- **`201 Created`**: Evento aceptado y almacenado correctamente en el flujo de telemetría.
- **`202 Accepted` (Dropped)**: Evento evaluado exitosamente y descartado por una regla de filtro (`filter transform`). Se procesa como éxito.
- **Reintentos automáticos:** En caso de microcortes de red, errores de gateway (`502`, `503`, `504`) o límite de tasa (`429`), el cliente reintenta con retroceso exponencial (`backoff`).
- **Sin reintento en errores de cliente (`400`, `401`, `403`):** Se rechaza de forma inmediata para no generar saturación innecesaria ante credenciales inválidas.

---

## 🔒 Consideraciones de Seguridad

1. **Secreto del token:** El token solo posee permisos de ingesta (`POST /v1/ingest/...`) con rol `device`. Nunca lo uses para consultas GraphQL.
2. **Protección en Frontend:** En navegadores el token viaja en las peticiones del cliente. En producción expón un proxy intermedio en tu propio servidor (same-origin) o restringe el token a nivel de proyecto y cuota.
3. **Cero registro en texto plano:** Los SDKs de kLog garantizan que el valor del token nunca se escribe en consolas ni trazas de error.

---

## 📖 Enlaces de Referencia

- **Manual en Landing kLog:** [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- **Contrato OpenAPI de Ingesta:** [openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml)
- **Monorepo GitHub:** [github.com/kriverdevice/klog-sdks](https://github.com/kriverdevice/klog-sdks)
