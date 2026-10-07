import { z } from "zod";

/** UUIDv7 público que usan API, SDKs y consola. */
export const publicIdSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

const LEVEL_ALIASES: Record<string, LogLevel> = {
  debug: "debug",
  trace: "debug",
  info: "info",
  notice: "info",
  warn: "warn",
  warning: "warn",
  error: "error",
  err: "error",
  fatal: "error",
  critical: "error",
};

/** Normaliza alias de severidad al conjunto canónico; vacío → info. */
export function normalizeLevel(raw: string | undefined | null): LogLevel {
  if (!raw || !raw.trim()) return "info";
  return LEVEL_ALIASES[raw.trim().toLowerCase()] ?? "info";
}

export const MESSAGE_MAX = 32_768;
export const TRACE_ID_MAX = 128;
export const TAGS_MAX = 50;
export const TAG_MAX = 100;

export const ingestEventInputSchema = z.object({
  applicationId: publicIdSchema.optional(),
  level: z.string().optional(),
  traceId: z.string().max(TRACE_ID_MAX).optional(),
  message: z.string().trim().min(1).max(MESSAGE_MAX),
  payload: z.unknown().optional(),
  tags: z.array(z.string().trim().min(1).max(TAG_MAX)).max(TAGS_MAX).optional(),
});

export type IngestEventInput = z.infer<typeof ingestEventInputSchema>;

export const eventSchema = z.object({
  id: publicIdSchema,
  applicationId: publicIdSchema.optional().nullable(),
  level: logLevelSchema.optional(),
  message: z.string(),
  payload: z.unknown(),
  tags: z.array(z.string()),
  createdAt: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

export const ingestDroppedSchema = z.object({
  dropped: z.literal(true),
  id: publicIdSchema,
});

export type IngestDropped = z.infer<typeof ingestDroppedSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
});

export type APIError = z.infer<typeof apiErrorSchema>;

/** Prefijo + secreto opaco de un API token de ingesta. */
export const apiTokenFormat = /^klog_[A-Za-z0-9_-]{8}_[A-Za-z0-9_-]{43}$/;

export function isApiTokenFormat(raw: string): boolean {
  return apiTokenFormat.test(raw);
}
