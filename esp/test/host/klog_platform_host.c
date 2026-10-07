#include "../../src/klog_platform.h"

#include <stdio.h>
#include <string.h>
#include <unistd.h>

/* Respuesta simulada para pruebas host. */
int g_fake_status = 201;
const char *g_fake_body = "{\"id\":\"evt-host-1\"}";
int g_http_calls = 0;
char g_last_body[2048];

void klog_platform_delay_ms(uint32_t ms) { (void)ms; }

klog_err_t klog_platform_http_post(const char *url, const char *auth_header, const char *json_body,
                                   uint16_t timeout_ms, klog_http_response_t *response) {
  (void)url;
  (void)auth_header;
  (void)timeout_ms;
  g_http_calls++;
  snprintf(g_last_body, sizeof(g_last_body), "%s", json_body ? json_body : "");
  memset(response, 0, sizeof(*response));
  response->status = g_fake_status;
  snprintf(response->body, sizeof(response->body), "%s", g_fake_body);
  return KLOG_OK;
}
