import type { ClientConfig, IngestResult, LogFields, LogLevel } from "../domain/types.js";
import type { IngestTransport } from "../ports/transport.js";
import { IngestQueue } from "./queue.js";
import { assertConfig, prepareEntry } from "./validate.js";

export class KlogIngestClient {
  private readonly queue: IngestQueue;

  constructor(
    private readonly config: ClientConfig,
    transport: IngestTransport,
  ) {
    assertConfig(config);
    this.queue = new IngestQueue(transport, config);
  }

  log(fields: LogFields): Promise<IngestResult> | void {
    const entry = prepareEntry(fields, this.config);
    const promise = this.queue.enqueue(entry);
    if (this.config.sync) return promise;
    void promise.catch(() => undefined);
  }

  debug(message: string, payload?: unknown, extra?: Omit<LogFields, "message" | "level" | "payload">) {
    return this.log({ ...extra, message, payload, level: "debug" });
  }

  info(message: string, payload?: unknown, extra?: Omit<LogFields, "message" | "level" | "payload">) {
    return this.log({ ...extra, message, payload, level: "info" });
  }

  warn(message: string, payload?: unknown, extra?: Omit<LogFields, "message" | "level" | "payload">) {
    return this.log({ ...extra, message, payload, level: "warn" });
  }

  error(message: string, payload?: unknown, extra?: Omit<LogFields, "message" | "level" | "payload">) {
    return this.log({ ...extra, message, payload, level: "error" });
  }

  flush(): Promise<void> {
    return this.queue.flush();
  }

  close(): Promise<void> {
    return this.queue.close();
  }
}

export type CreateClientOptions = ClientConfig & {
  transport?: IngestTransport;
  defaultLevel?: LogLevel;
};
