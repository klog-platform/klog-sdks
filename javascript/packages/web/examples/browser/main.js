import { createClient } from "@klog/sdk-web";

/**
 * Same-origin: baseUrl apunta al prefijo proxied. El token del cliente es un placeholder;
 * en dev el proxy de Vite sustituye Authorization con KLOG_TOKEN del .env.
 */
const klog = createClient({
  baseUrl: "/klog-proxy",
  tenantId: import.meta.env.VITE_KLOG_TENANT_ID ?? "018e3a2b-7c4d-7f91-88b1-3e129f123456",
  token: "klog_demo0000_" + "x".repeat(43),
  applicationId: import.meta.env.VITE_KLOG_APPLICATION_ID ?? "018e3a2b-87cf-7922-8114-ba83726410cc",
  flushOnUnload: true,
});

document.getElementById("send")?.addEventListener("click", () => {
  klog.info("click desde ejemplo browser", { page: location.pathname });
  console.log("Evento encolado; usa await klog.flush() en consola para forzar envío.");
});

window.klog = klog;
