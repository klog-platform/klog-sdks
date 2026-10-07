import { defineConfig, loadEnv } from "vite";

/**
 * Proxy same-origin: el navegador POSTea a /klog-proxy/v1/ingest/{tenantId}/events
 * y Vite reenvía a la API real añadiendo Bearer (desde .env del dev server).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      port: 5199,
      proxy: {
        "/klog-proxy": {
          target: env.KLOG_URL ?? "http://localhost:3100",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/klog-proxy/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const token = env.KLOG_TOKEN;
              if (token) proxyReq.setHeader("Authorization", `Bearer ${token}`);
            });
          },
        },
      },
    },
  };
});
