import { afterEach, describe, expect, it, vi } from "vitest";
import { KlogHttpError } from "../domain/errors.js";
import type { IngestTransport } from "../ports/transport.js";
import { IngestQueue } from "./queue.js";

const base = {
  baseUrl: "http://localhost:3100",
  tenantId: "018e3a2b-7c4d-7f91-88b1-3e129f123456",
  applicationId: "018e3a2b-87cf-7922-8114-ba83726410cc",
  token: "klog_AbCd1234_" + "x".repeat(43),
};

const created = {
  kind: "created" as const,
  event: {
    id: base.tenantId,
    message: "ok",
    payload: {},
    tags: [],
    createdAt: new Date().toISOString(),
  },
};

afterEach(() => {
  vi.useRealTimers();
});

describe("IngestQueue", () => {
  it("llama onOverflow cuando la cola está llena", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport: IngestTransport = {
      send: vi.fn(async () => {
        await gate;
        return created;
      }),
    };
    const onOverflow = vi.fn();
    const queue = new IngestQueue(transport, {
      ...base,
      maxQueueSize: 1,
      maxConcurrency: 1,
      onOverflow,
    });
    const first = queue.enqueue({ message: "a", level: "info" });
    await expect(queue.enqueue({ message: "b", level: "info" })).rejects.toThrow(/Cola/);
    expect(onOverflow).toHaveBeenCalledWith(expect.objectContaining({ message: "b" }));
    release();
    await first;
  });

  it("respeta maxConcurrency", async () => {
    let concurrent = 0;
    let maxSeen = 0;
    const transport: IngestTransport = {
      send: vi.fn(async () => {
        concurrent++;
        maxSeen = Math.max(maxSeen, concurrent);
        await new Promise((r) => setTimeout(r, 20));
        concurrent--;
        return created;
      }),
    };
    const queue = new IngestQueue(transport, { ...base, maxConcurrency: 2, maxQueueSize: 10 });
    await Promise.all([
      queue.enqueue({ message: "1", level: "info" }),
      queue.enqueue({ message: "2", level: "info" }),
      queue.enqueue({ message: "3", level: "info" }),
      queue.enqueue({ message: "4", level: "info" }),
    ]);
    expect(maxSeen).toBeLessThanOrEqual(2);
    expect(maxSeen).toBeGreaterThan(1);
  });

  it("flush espera a pending y active", async () => {
    const transport: IngestTransport = {
      send: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 30));
        return created;
      }),
    };
    const queue = new IngestQueue(transport, { ...base, maxConcurrency: 1 });
    void queue.enqueue({ message: "x", level: "info" });
    void queue.enqueue({ message: "y", level: "info" });
    await queue.flush();
    expect(transport.send).toHaveBeenCalledTimes(2);
  });

  it("close rechaza nuevos envíos", async () => {
    const transport: IngestTransport = {
      send: vi.fn(async () => created),
    };
    const queue = new IngestQueue(transport, base);
    await queue.close();
    await expect(queue.enqueue({ message: "z", level: "info" })).rejects.toThrow(/cerrado/);
  });

  it("reintenta con backoff y respeta maxRetries", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const transport: IngestTransport = {
      send: vi.fn(async () => {
        calls++;
        throw new KlogHttpError("503", 503, true);
      }),
    };
    const onError = vi.fn();
    const queue = new IngestQueue(transport, {
      ...base,
      maxRetries: 2,
      requestTimeoutMs: 5000,
      onError,
    });
    const promise = queue.enqueue({ message: "fail", level: "info" });
    const expectation = expect(promise).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await expectation;
    expect(calls).toBe(3);
    expect(onError).toHaveBeenCalledOnce();
  });

  it("requestTimeoutMs aborta envíos lentos", async () => {
    vi.useFakeTimers();
    const transport: IngestTransport = {
      send: vi.fn(async (_entry, signal) => {
        await new Promise<void>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        });
      }),
    };
    const queue = new IngestQueue(transport, { ...base, maxRetries: 0, requestTimeoutMs: 100 });
    const promise = queue.enqueue({ message: "slow", level: "info" });
    const expectation = expect(promise).rejects.toBeTruthy();
    await vi.advanceTimersByTimeAsync(150);
    await expectation;
    expect(transport.send).toHaveBeenCalledOnce();
  });

  it("400 no reintenta", async () => {
    const transport: IngestTransport = {
      send: vi.fn(async () => {
        throw new KlogHttpError("bad request", 400, false);
      }),
    };
    const queue = new IngestQueue(transport, { ...base, maxRetries: 5 });
    await expect(queue.enqueue({ message: "bad", level: "info" })).rejects.toMatchObject({ status: 400 });
    expect(transport.send).toHaveBeenCalledTimes(1);
  });
});
