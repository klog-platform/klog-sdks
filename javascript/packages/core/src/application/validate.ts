import {
  ingestEventInputSchema,
  isApiTokenFormat,
  normalizeLevel,
  publicIdSchema,
} from "../domain/ingest.js";
import { KlogValidationError } from "../domain/errors.js";
import type { ClientConfig, LogFields } from "../domain/types.js";

export function assertConfig(config: ClientConfig): void {
  if (!config.baseUrl?.trim()) throw new KlogValidationError("baseUrl es obligatorio.", "baseUrl");
  try {
    publicIdSchema.parse(config.tenantId);
  } catch {
    throw new KlogValidationError("tenantId debe ser un UUIDv7.", "tenantId");
  }
  try {
    publicIdSchema.parse(config.applicationId);
  } catch {
    throw new KlogValidationError("applicationId debe ser un UUIDv7.", "applicationId");
  }
  if (!isApiTokenFormat(config.token)) {
    throw new KlogValidationError("token debe tener el formato klog_<prefijo>_<secreto>.", "token");
  }
}

export function prepareEntry(fields: LogFields, config: ClientConfig): LogFields {
  const tags = [...(config.defaultTags ?? []), ...(fields.tags ?? [])];
  const unique = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  const parsed = ingestEventInputSchema.safeParse({
    applicationId: fields.applicationId ?? config.applicationId,
    level: fields.level ?? config.defaultLevel,
    traceId: fields.traceId,
    message: fields.message,
    payload: fields.payload ?? {},
    tags: unique,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new KlogValidationError(issue?.message ?? "Evento inválido.", issue?.path.join(".") || "message");
  }
  return {
    applicationId: parsed.data.applicationId,
    level: normalizeLevel(parsed.data.level),
    traceId: parsed.data.traceId,
    message: parsed.data.message,
    payload: parsed.data.payload ?? {},
    tags: parsed.data.tags,
  };
}

/** Nunca incluir el Bearer completo en mensajes o logs. */
export function redactAuthorization(value: string): string {
  return value.replace(/Bearer\s+klog_[^\s]+/gi, "Bearer klog_••••");
}
