import { describe, expect, it, vi } from "vitest";
import { KlogHttpError } from "../domain/errors.js";
import type { IngestTransport } from "../ports/transport.js";
import { KlogIngestClient } from "./client.js";
import { prepareEntry, redactAuthorization } from "./validate.js";

const base = {
  baseUrl: "http://localhost:3100",
  tenantId: "018e3a2b-7c4d-7f91-88b1-3e129f123456",
  applicationId: "018e3a2b-87cf-7922-8114-ba83726410cc",
  token: "klog_AbCd1234_" + "x".repeat(43),
};

describe("validate", () => {
  it("normaliza tags y nivel", () => {
    const entry = prepareEntry({ message: "hola", tags: [" a ", "a", "b"] }, base);
    expect(entry.level).toBe("info");
    expect(entry.tags).toEqual(["a", "b"]);
  });

  it("redacta el Bearer", () => {
    expect(redactAuthorization(`Authorization: Bearer ${base.token}`)).toContain("klog_••••");
  });
});

describe("KlogIngestClient", () => {
  it("envía en sync y trata 202 como dropped", async () => {
    const transport: IngestTransport = {
      send: vi.fn(async () => ({ kind: "dropped" as const, id: base.tenantId })),
    };
    const onDropped = vi.fn();
    const client = new KlogIngestClient({ ...base, sync: true, onDropped }, transport);
    const result = await client.info("x");
    expect(result).toEqual({ kind: "dropped", id: base.tenantId });
    expect(onDropped).toHaveBeenCalledWith(base.tenantId);
    await client.close();
  });

  it("expone log/debug/info/warn/error con nivel correcto", async () => {
    const transport: IngestTransport = {
      send: vi.fn(async (entry) => ({
        kind: "created" as const,
        event: {
          id: base.tenantId,
          message: entry.message,
          payload: entry.payload ?? {},
          tags: entry.tags ?? [],
          createdAt: new Date().toISOString(),
        },
      })),
    };
    const client = new KlogIngestClient({ ...base, sync: true, defaultLevel: "warn" }, transport);
    await client.log({ message: "generic" });
    await client.debug("d", { x: 1 });
    await client.info("i");
    await client.warn("w");
    await client.error("e");
    const levels = (transport.send as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: [{ level?: string }]) => c[0].level,
    );
    expect(levels).toEqual(["warn", "debug", "info", "warn", "error"]);
    await client.close();
  });

  it("reintenta fallos transitorios y no reintenta 401", async () => {
    let calls = 0;
    const transport: IngestTransport = {
      send: vi.fn(async () => {
        calls++;
        if (calls < 3) throw new KlogHttpError("Service Unavailable", 503, true);
        return {
          kind: "created" as const,
          event: {
            id: base.tenantId,
            message: "ok",
            payload: {},
            tags: [],
            createdAt: new Date().toISOString(),
          },
        };
      }),
    };
    const client = new KlogIngestClient({ ...base, sync: true, maxRetries: 3, requestTimeoutMs: 1000 }, transport);
    await client.info("retry");
    expect(calls).toBe(3);

    const auth: IngestTransport = {
      send: vi.fn(async () => {
        throw new KlogHttpError("unauthorized", 401, false);
      }),
    };
    const denied = new KlogIngestClient({ ...base, sync: true }, auth);
    await expect(denied.info("no")).rejects.toMatchObject({ status: 401 });
    expect(auth.send).toHaveBeenCalledTimes(1);
    await client.close();
    await denied.close();
  });
});
