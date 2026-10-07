import { describe, expect, it, vi } from "vitest";
import { KlogHttpError } from "../domain/errors.js";
import type { LogFields } from "../domain/types.js";
import { HttpTransport } from "./httpTransport.js";

const token = "klog_AbCd1234_" + "x".repeat(43);
const tenantId = "018e3a2b-7c4d-7f91-88b1-3e129f123456";
const applicationId = "018e3a2b-87cf-7922-8114-ba83726410cc";

const entry: LogFields = {
  applicationId,
  level: "info",
  message: "hola",
  payload: { n: 1 },
  tags: ["t"],
};

function transportWith(fetchImpl: typeof fetch) {
  return new HttpTransport({
    baseUrl: "http://api.test/",
    tenantId,
    token,
    fetchImpl,
  });
}

describe("HttpTransport", () => {
  it("201 devuelve created con evento parseado", async () => {
    const event = {
      id: tenantId,
      message: "hola",
      payload: { n: 1 },
      tags: ["t"],
      createdAt: "2026-10-02T12:00:00Z",
    };
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(event), { status: 201, headers: { "Content-Type": "application/json" } }),
    );
    const t = transportWith(fetchImpl as typeof fetch);
    const result = await t.send(entry, new AbortController().signal);
    expect(result).toEqual({ kind: "created", event });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`http://api.test/v1/ingest/${tenantId}/events`);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
  });

  it("202 devuelve dropped distinto de 201", async () => {
    const droppedId = "018e3a2b-7c4d-7f91-88b1-3e129f123457";
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ dropped: true, id: droppedId }), { status: 202 }),
    );
    const t = transportWith(fetchImpl as typeof fetch);
    const result = await t.send(entry, new AbortController().signal);
    expect(result).toEqual({ kind: "dropped", id: droppedId });
  });

  it("401 y 403 lanzan error no reintentable", async () => {
    for (const status of [401, 403]) {
      const fetchImpl = vi.fn(async () =>
        new Response(JSON.stringify({ error: "denied" }), { status }),
      );
      const t = transportWith(fetchImpl as typeof fetch);
      await expect(t.send(entry, new AbortController().signal)).rejects.toMatchObject({
        status,
        retryable: false,
      });
    }
  });

  it("429 es reintentable", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: "rate limit" }), { status: 429 }));
    const t = transportWith(fetchImpl as typeof fetch);
    await expect(t.send(entry, new AbortController().signal)).rejects.toMatchObject({
      status: 429,
      retryable: true,
    });
  });

  it("fallo de red es reintentable", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const t = transportWith(fetchImpl as typeof fetch);
    await expect(t.send(entry, new AbortController().signal)).rejects.toBeInstanceOf(KlogHttpError);
    await expect(t.send(entry, new AbortController().signal)).rejects.toMatchObject({ retryable: true, status: 0 });
  });

  it("abort por timeout marca retryable", async () => {
    const fetchImpl = vi.fn(async (_url, init) => {
      const signal = init?.signal as AbortSignal;
      if (signal.aborted) throw new Error("aborted");
      await new Promise(() => undefined);
    });
    const t = transportWith(fetchImpl as typeof fetch);
    const controller = new AbortController();
    controller.abort();
    await expect(t.send(entry, controller.signal)).rejects.toMatchObject({
      retryable: true,
      status: 0,
    });
  });
});
