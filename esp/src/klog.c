#include "klog.h"
#include "klog_platform.h"

#include <stdio.h>
#include <string.h>

#ifndef KLOG_JSON_MAX
#define KLOG_JSON_MAX 2048
#endif

static klog_config_t g_cfg;
static bool g_ready;
static char g_url[256];
static char g_auth[192];

static const char *level_name(klog_level_t level) {
  switch (level) {
    case KLOG_LEVEL_DEBUG: return "debug";
    case KLOG_LEVEL_WARN: return "warn";
    case KLOG_LEVEL_ERROR: return "error";
    case KLOG_LEVEL_INFO:
    default: return "info";
  }
}

static int json_escape_append(char *dst, size_t dst_len, size_t *used, const char *src) {
  if (!src) src = "";
  for (const unsigned char *p = (const unsigned char *)src; *p; ++p) {
    char esc[7];
    const char *chunk;
    size_t n;
    if (*p == '"' || *p == '\\') {
      esc[0] = '\\';
      esc[1] = (char)*p;
      esc[2] = 0;
      chunk = esc;
      n = 2;
    } else if (*p < 0x20) {
      n = (size_t)snprintf(esc, sizeof(esc), "\\u%04x", *p);
      chunk = esc;
    } else {
      esc[0] = (char)*p;
      esc[1] = 0;
      chunk = esc;
      n = 1;
    }
    if (*used + n + 1 >= dst_len) return -1;
    memcpy(dst + *used, chunk, n);
    *used += n;
  }
  dst[*used] = 0;
  return 0;
}

static int build_body(char *dst, size_t dst_len, klog_level_t level, const char *message,
                      const char *payload_json, const char *trace_id) {
  size_t used = 0;
  int n;
  if (used + 12 >= dst_len) return -1;
  memcpy(dst, "{\"message\":\"", 12);
  used = 12;
  if (json_escape_append(dst, dst_len, &used, message) != 0) return -1;
  n = snprintf(dst + used, dst_len - used, "\",\"level\":\"%s\",\"applicationId\":\"%s\",\"payload\":",
               level_name(level), g_cfg.application_id ? g_cfg.application_id : "");
  if (n < 0 || (size_t)n >= dst_len - used) return -1;
  used += (size_t)n;
  const char *payload = (payload_json && payload_json[0]) ? payload_json : "{}";
  size_t plen = strlen(payload);
  if (used + plen + 2 >= dst_len) return -1;
  memcpy(dst + used, payload, plen);
  used += plen;
  if (trace_id && trace_id[0]) {
    n = snprintf(dst + used, dst_len - used, ",\"traceId\":\"");
    if (n < 0 || (size_t)n >= dst_len - used) return -1;
    used += (size_t)n;
    if (json_escape_append(dst, dst_len, &used, trace_id) != 0) return -1;
    if (used + 2 >= dst_len) return -1;
    dst[used++] = '"';
  }
  if (used + 2 >= dst_len) return -1;
  dst[used++] = '}';
  dst[used] = 0;
  return (int)used;
}

static bool retryable_status(int status) {
  return status == 429 || status == 502 || status == 503 || status == 504 || status == 0;
}

static void parse_id(const char *body, char *out, size_t out_len) {
  out[0] = 0;
  if (!body || out_len < 2) return;
  const char *p = strstr(body, "\"id\"");
  if (!p) return;
  p = strchr(p + 4, '"');
  if (!p) return;
  ++p;
  const char *end = strchr(p, '"');
  if (!end) return;
  size_t n = (size_t)(end - p);
  if (n >= out_len) n = out_len - 1;
  memcpy(out, p, n);
  out[n] = 0;
}

klog_err_t klog_init(const klog_config_t *config) {
  if (!config || !config->base_url || !config->tenant_id || !config->token || !config->application_id) {
    return KLOG_ERR_INVALID;
  }
  g_cfg = *config;
  if (g_cfg.max_retries == 0) g_cfg.max_retries = 3;
  if (g_cfg.timeout_ms == 0) g_cfg.timeout_ms = 10000;

  int n = snprintf(g_url, sizeof(g_url), "%s/v1/ingest/%s/events", g_cfg.base_url, g_cfg.tenant_id);
  if (n < 0 || (size_t)n >= sizeof(g_url)) return KLOG_ERR_INVALID;
  n = snprintf(g_auth, sizeof(g_auth), "Bearer %s", g_cfg.token);
  if (n < 0 || (size_t)n >= sizeof(g_auth)) return KLOG_ERR_INVALID;
  g_ready = true;
  return KLOG_OK;
}

void klog_deinit(void) {
  g_ready = false;
  memset(&g_cfg, 0, sizeof(g_cfg));
  g_url[0] = 0;
  g_auth[0] = 0;
}

klog_err_t klog_log(klog_level_t level, const char *message, const char *payload_json,
                    const char *trace_id, klog_result_t *out) {
  if (!g_ready) return KLOG_ERR_CLOSED;
  if (!message || !message[0]) return KLOG_ERR_INVALID;

  char body[KLOG_JSON_MAX];
  if (build_body(body, sizeof(body), level, message, payload_json, trace_id) < 0) {
    return KLOG_ERR_NOMEM;
  }

  klog_http_response_t resp;
  klog_err_t last = KLOG_ERR_NETWORK;
  uint8_t attempts = (uint8_t)(g_cfg.max_retries + 1);
  for (uint8_t attempt = 1; attempt <= attempts; ++attempt) {
    memset(&resp, 0, sizeof(resp));
    last = klog_platform_http_post(g_url, g_auth, body, g_cfg.timeout_ms, &resp);
    if (last == KLOG_OK) {
      if (resp.status == 201 || resp.status == 202) {
        if (out) {
          memset(out, 0, sizeof(*out));
          out->http_status = resp.status;
          out->created = resp.status == 201;
          out->dropped = resp.status == 202;
          parse_id(resp.body, out->id, sizeof(out->id));
        }
        return KLOG_OK;
      }
      if (resp.status == 400 || resp.status == 401 || resp.status == 403) {
        return KLOG_ERR_HTTP;
      }
      if (!retryable_status(resp.status)) {
        return KLOG_ERR_HTTP;
      }
      last = KLOG_ERR_HTTP;
    }
    if (attempt == attempts) break;
    /* backoff simple: 200ms * 2^(attempt-1), tope ~1.6s (sin jitter en MCU) */
    uint32_t delay_ms = 200u << (attempt - 1);
    if (delay_ms > 1600u) delay_ms = 1600u;
    klog_platform_delay_ms(delay_ms);
  }
  return last;
}

klog_err_t klog_debug(const char *message, const char *payload_json) {
  return klog_log(KLOG_LEVEL_DEBUG, message, payload_json, NULL, NULL);
}
klog_err_t klog_info(const char *message, const char *payload_json) {
  return klog_log(KLOG_LEVEL_INFO, message, payload_json, NULL, NULL);
}
klog_err_t klog_warn(const char *message, const char *payload_json) {
  return klog_log(KLOG_LEVEL_WARN, message, payload_json, NULL, NULL);
}
klog_err_t klog_error(const char *message, const char *payload_json) {
  return klog_log(KLOG_LEVEL_ERROR, message, payload_json, NULL, NULL);
}
