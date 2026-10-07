import { apiErrorSchema, eventSchema, ingestDroppedSchema } from "../domain/ingest.js";
import { KlogHttpError, isRetryableStatus } from "../domain/errors.js";
import type { IngestResult, LogFields } from "../domain/types.js";
import type { FetchLike, IngestTransport } from "../ports/transport.js";

export type HttpTransportOptions = {
  baseUrl: string;
  tenantId: string;
  token: string;
  fetchImpl?: FetchLike;
};

export class HttpTransport implements IngestTransport {
  private readonly fetchImpl: FetchLike;

  constructor(private readonly options: HttpTransportOptions) {
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async send(input: LogFields, signal: AbortSignal): Promise<IngestResult> {
    const url = `${this.options.baseUrl.replace(/\/$/, "")}/v1/ingest/${this.options.tenantId}/events`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.token}`,
        },
        body: JSON.stringify({
          applicationId: input.applicationId,
          level: input.level,
          traceId: input.traceId || undefined,
          message: input.message,
          payload: input.payload ?? {},
          tags: input.tags ?? [],
        }),
        signal,
      });
    } catch (error) {
      if (signal.aborted) {
        throw new KlogHttpError("timeout", 0, true);
      }
      throw new KlogHttpError(error instanceof Error ? error.message : "network", 0, true);
    }

    const text = await response.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: text.slice(0, 200) };
      }
    }

    if (response.status === 201) {
      return { kind: "created", event: eventSchema.parse(body) };
    }
    if (response.status === 202) {
      const dropped = ingestDroppedSchema.parse(body);
      return { kind: "dropped", id: dropped.id };
    }

    const message = apiErrorSchema.safeParse(body).success
      ? apiErrorSchema.parse(body).error
      : `HTTP ${response.status}`;
    throw new KlogHttpError(message, response.status, isRetryableStatus(response.status));
  }
}
