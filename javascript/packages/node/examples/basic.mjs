/**
 * Ejemplo mínimo. Variables:
 *   KLOG_URL=http://localhost:3100
 *   KLOG_TENANT_ID=...
 *   KLOG_TOKEN=klog_...
 *   KLOG_APPLICATION_ID=...
 *
 * Ejecutar desde packages/node tras `npm run build` en el workspace sdk:
 *   node examples/basic.mjs
 */
import { createClientFromEnv } from "../dist/index.js";

const client = createClientFromEnv(process.env, {
  sync: true,
  onOverflow: (entry) => console.warn("cola llena, descartado:", entry.message),
  onError: (err) => console.error("ingesta fallida:", err),
});

await client.debug("debug", { step: 1 });
const result = await client.info("sdk-node example", { source: "examples/basic.mjs" });
await client.warn("warn de ejemplo");
console.log("201/202:", result);
await client.flush();
await client.close();
