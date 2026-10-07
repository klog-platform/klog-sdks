import { describe, expect, it, vi } from "vitest";
import { createClient } from "./index.js";

const token = "klog_AbCd1234_" + "x".repeat(43);

describe("createClient web", () => {
  it("usa fetch y no bloquea el hilo con sync=false", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: "018e3a2b-7c4d-7f91-88b1-3e129f123456",
          message: "x",
          payload: {},
          tags: [],
          createdAt: "2026-10-02T12:00:00Z",
        }),
        { status: 201 },
      ),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const client = createClient({
      baseUrl: "http://api.test",
      tenantId: "018e3a2b-7c4d-7f91-88b1-3e129f123456",
      applicationId: "018e3a2b-87cf-7922-8114-ba83726410cc",
      token,
      fetchImpl: fetchImpl as typeof fetch,
      flushOnUnload: false,
    });
    expect(warn).toHaveBeenCalled();
    client.info("async");
    await client.flush();
    expect(fetchImpl).toHaveBeenCalledOnce();
    await client.close();
    warn.mockRestore();
  });
});
