import {
  HttpTransport,
  KlogIngestClient,
  type ClientConfig,
  type CreateClientOptions,
  type FetchLike,
} from "@kriverdevice/klog-core";

export * from "@kriverdevice/klog-core";

export type WebClientOptions = CreateClientOptions & {
  fetchImpl?: FetchLike;
  /**
   * Si es true (default), al cerrar la pestaña se intenta flush con keepalive.
   * El token queda visible en el bundle: preferir un proxy same-origin en producción.
   */
  flushOnUnload?: boolean;
};

/**
 * Cliente browser. CORS debe incluir el origen de la app en CORS_ORIGIN de la API,
 * o usa un proxy same-origin que añada el Bearer.
 */
export function createClient(options: WebClientOptions): KlogIngestClient {
  const { transport, fetchImpl, flushOnUnload = true, ...config } = options;
  if (typeof console !== "undefined") {
    console.warn(
      "[@kriverdevice/klog-web] El API token queda expuesto en el navegador. Usa un proxy same-origin en producción.",
    );
  }
  const http =
    transport ??
    new HttpTransport({
      baseUrl: config.baseUrl,
      tenantId: config.tenantId,
      token: config.token,
      fetchImpl,
    });
  const client = new KlogIngestClient(config as ClientConfig, http);
  if (flushOnUnload && typeof window !== "undefined") {
    const drain = () => {
      void client.flush();
    };
    window.addEventListener("pagehide", drain);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") drain();
    });
  }
  return client;
}
