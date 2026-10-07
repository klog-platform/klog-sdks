import type { Event, IngestDropped, LogLevel } from "./ingest.js";

export type { Event, IngestDropped, LogLevel };

export type IngestResult =
  | { kind: "created"; event: Event }
  | { kind: "dropped"; id: string };

export type LogFields = {
  level?: LogLevel | string;
  message: string;
  payload?: unknown;
  tags?: string[];
  traceId?: string;
  applicationId?: string;
};

export type ClientConfig = {
  baseUrl: string;
  tenantId: string;
  token: string;
  applicationId: string;
  defaultTags?: string[];
  defaultLevel?: LogLevel;
  maxConcurrency?: number;
  maxQueueSize?: number;
  requestTimeoutMs?: number;
  maxRetries?: number;
  /** Si es true, log() espera a que el envío termine. */
  sync?: boolean;
  onDropped?: (id: string) => void;
  onOverflow?: (entry: LogFields) => void;
  onError?: (error: unknown) => void;
};
