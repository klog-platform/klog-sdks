import type { IngestResult, LogFields } from "../domain/types.js";

export interface IngestTransport {
  send(input: LogFields, signal: AbortSignal): Promise<IngestResult>;
}

export type FetchLike = typeof fetch;
