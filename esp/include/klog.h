#ifndef KLOG_H
#define KLOG_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
  KLOG_OK = 0,
  KLOG_ERR_INVALID = 1,
  KLOG_ERR_HTTP = 2,
  KLOG_ERR_NETWORK = 3,
  KLOG_ERR_NOMEM = 4,
  KLOG_ERR_CLOSED = 5,
  KLOG_ERR_OVERFLOW = 6,
} klog_err_t;

typedef enum {
  KLOG_LEVEL_DEBUG = 0,
  KLOG_LEVEL_INFO = 1,
  KLOG_LEVEL_WARN = 2,
  KLOG_LEVEL_ERROR = 3,
} klog_level_t;

typedef struct {
  const char *base_url;       /* sin barra final, p.ej. http://192.168.1.10:3100 */
  const char *tenant_id;      /* UUIDv7 */
  const char *token;          /* klog_... ; no loguear */
  const char *application_id; /* UUIDv7 */
  uint8_t max_retries;        /* default 3 */
  uint16_t timeout_ms;        /* default 10000 */
} klog_config_t;

typedef struct {
  bool created;
  bool dropped;
  char id[40];
  int http_status;
} klog_result_t;

/** Inicializa el cliente. Las cadenas de config deben permanecer válidas. */
klog_err_t klog_init(const klog_config_t *config);

/** Libera buffers internos. */
void klog_deinit(void);

klog_err_t klog_log(klog_level_t level, const char *message, const char *payload_json,
                    const char *trace_id, klog_result_t *out);

klog_err_t klog_debug(const char *message, const char *payload_json);
klog_err_t klog_info(const char *message, const char *payload_json);
klog_err_t klog_warn(const char *message, const char *payload_json);
klog_err_t klog_error(const char *message, const char *payload_json);

/** Puerto de plataforma: POST JSON y devuelve status + cuerpo (recortado). */
typedef struct {
  int status;
  char body[256];
} klog_http_response_t;

/**
 * Implementado por Arduino o ESP-IDF.
 * url y body son NUL-terminated. auth_header es "Bearer …".
 */
klog_err_t klog_platform_http_post(const char *url, const char *auth_header,
                                   const char *json_body, uint16_t timeout_ms,
                                   klog_http_response_t *response);

#ifdef __cplusplus
}
#endif

#endif /* KLOG_H */
