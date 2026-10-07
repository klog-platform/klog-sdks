import { describe, expect, it, vi } from "vitest";
import { createClient, createClientFromEnv } from "./index.js";

const token = "klog_AbCd1234_" + "x".repeat(43);
const base = {
  baseUrl: "http://api.test",
  tenantId: "018e3a2b-7c4d-7f91-88b1-3e129f123456",
  applicationId: "018e3a2b-87cf-7922-8114-ba83726410cc",
  token,
};

describe("createClient", () => {
  it("hace POST con Authorization Bearer", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: base.tenantId,
          message: "hola",
          payload: {},
          tags: [],
          createdAt: "2026-10-02T12:00:00Z",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    const client = createClient({ ...base, sync: true, fetchImpl: fetchImpl as typeof fetch });
    await client.info("hola", { n: 1 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`http://api.test/v1/ingest/${base.tenantId}/events`);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
    await client.close();
  });

  it("trata 202 como dropped", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ dropped: true, id: base.tenantId }), { status: 202 }),
    );
    const client = createClient({ ...base, sync: true, fetchImpl: fetchImpl as typeof fetch });
    const result = await client.warn("descartado");
    expect(result).toEqual({ kind: "dropped", id: base.tenantId });
    await client.close();
  });

  it("createClientFromEnv exige variables", () => {
    expect(() => createClientFromEnv({})).toThrow(/KLOG_/);
    const client = createClientFromEnv({
      KLOG_URL: base.baseUrl,
      KLOG_TENANT_ID: base.tenantId,
      KLOG_TOKEN: token,
      KLOG_APPLICATION_ID: base.applicationId,
    });
    expect(client).toBeTruthy();
  });
});
