import { KlogHttpError } from "../domain/errors.js";
import type { ClientConfig, IngestResult, LogFields } from "../domain/types.js";
import type { IngestTransport } from "../ports/transport.js";

type Pending = {
  entry: LogFields;
  resolve: (result: IngestResult) => void;
  reject: (error: unknown) => void;
};

export class IngestQueue {
  private readonly pending: Pending[] = [];
  private active = 0;
  private closed = false;
  private readonly maxConcurrency: number;
  private readonly maxQueueSize: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    private readonly transport: IngestTransport,
    private readonly config: ClientConfig,
  ) {
    this.maxConcurrency = config.maxConcurrency ?? 4;
    this.maxQueueSize = config.maxQueueSize ?? 1000;
    this.timeoutMs = config.requestTimeoutMs ?? 10_000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  enqueue(entry: LogFields): Promise<IngestResult> {
    if (this.closed) {
      return Promise.reject(new Error("El cliente está cerrado."));
    }
    if (this.pending.length + this.active >= this.maxQueueSize) {
      this.config.onOverflow?.(entry);
      return Promise.reject(new Error("Cola de ingesta llena."));
    }
    return new Promise<IngestResult>((resolve, reject) => {
      this.pending.push({ entry, resolve, reject });
      this.pump();
    });
  }

  async flush(): Promise<void> {
    while (this.pending.length > 0 || this.active > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  async close(): Promise<void> {
    await this.flush();
    this.closed = true;
  }

  private pump(): void {
    while (this.active < this.maxConcurrency && this.pending.length > 0) {
      const next = this.pending.shift();
      if (!next) return;
      this.active++;
      void this.deliver(next).finally(() => {
        this.active--;
        this.pump();
      });
    }
  }

  private async deliver(item: Pending): Promise<void> {
    let attempt = 0;
    for (;;) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const result = await this.transport.send(item.entry, controller.signal);
        clearTimeout(timer);
        if (result.kind === "dropped") this.config.onDropped?.(result.id);
        item.resolve(result);
        return;
      } catch (error) {
        clearTimeout(timer);
        const retryable = error instanceof KlogHttpError ? error.retryable : true;
        if (!retryable || attempt > this.maxRetries) {
          this.config.onError?.(error);
          item.reject(error);
          return;
        }
        const delay = Math.min(3200, 200 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 100);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
