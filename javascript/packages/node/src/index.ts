import {
  HttpTransport,
  KlogIngestClient,
  type ClientConfig,
  type CreateClientOptions,
  type FetchLike,
} from "@kriverdevice/klog-core";

export * from "@kriverdevice/klog-core";

export type NodeClientOptions = CreateClientOptions & {
  /** fetch inyectable (p. ej. undici); por defecto globalThis.fetch. */
  fetchImpl?: FetchLike;
};

/** Crea un cliente de ingesta para Node 18+. No lee process.env solo: pasa la config. */
export function createClient(options: NodeClientOptions): KlogIngestClient {
  const { transport, fetchImpl, ...config } = options;
  const http =
    transport ??
    new HttpTransport({
      baseUrl: config.baseUrl,
      tenantId: config.tenantId,
      token: config.token,
      fetchImpl,
    });
  return new KlogIngestClient(config as ClientConfig, http);
}

/** Lee las variables KLOG_* habituales; falla si falta alguna. */
export function createClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  overrides: Partial<NodeClientOptions> = {},
): KlogIngestClient {
  const baseUrl = overrides.baseUrl ?? env.KLOG_URL ?? env.KLOG_API_URL;
  const tenantId = overrides.tenantId ?? env.KLOG_TENANT_ID;
  const token = overrides.token ?? env.KLOG_TOKEN;
  const applicationId = overrides.applicationId ?? env.KLOG_APPLICATION_ID;
  if (!baseUrl || !tenantId || !token || !applicationId) {
    throw new Error("Faltan KLOG_URL, KLOG_TENANT_ID, KLOG_TOKEN o KLOG_APPLICATION_ID.");
  }
  return createClient({
    ...overrides,
    baseUrl,
    tenantId,
    token,
    applicationId,
  });
}
