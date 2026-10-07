export { KlogIngestClient, type CreateClientOptions } from "./application/client.js";
export { IngestQueue } from "./application/queue.js";
export { assertConfig, prepareEntry, redactAuthorization } from "./application/validate.js";
export { KlogHttpError, KlogValidationError, isRetryableStatus } from "./domain/errors.js";
export type { ClientConfig, Event, IngestDropped, IngestResult, LogFields, LogLevel } from "./domain/types.js";
export { HttpTransport, type HttpTransportOptions } from "./infrastructure/httpTransport.js";
export type { FetchLike, IngestTransport } from "./ports/transport.js";
