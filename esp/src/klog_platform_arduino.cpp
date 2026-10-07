#if defined(ARDUINO) && (defined(ESP32) || defined(ARDUINO_ARCH_ESP32))

#include "klog.h"
#include "klog_platform.h"

#include <HTTPClient.h>
#include <WiFi.h>

void klog_platform_delay_ms(uint32_t ms) { delay(ms); }

klog_err_t klog_platform_http_post(const char *url, const char *auth_header, const char *json_body,
                                   uint16_t timeout_ms, klog_http_response_t *response) {
  if (!url || !auth_header || !json_body || !response) return KLOG_ERR_INVALID;
  memset(response, 0, sizeof(*response));

  HTTPClient http;
  http.setTimeout(timeout_ms);
  if (!http.begin(url)) {
    return KLOG_ERR_NETWORK;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", auth_header);
  http.addHeader("User-Agent", "klog-sdk-esp/0.1");

  int code = http.POST((uint8_t *)json_body, strlen(json_body));
  response->status = code > 0 ? code : 0;
  if (code > 0) {
    String body = http.getString();
    size_t n = body.length();
    if (n >= sizeof(response->body)) n = sizeof(response->body) - 1;
    memcpy(response->body, body.c_str(), n);
    response->body[n] = 0;
  }
  http.end();
  return code > 0 ? KLOG_OK : KLOG_ERR_NETWORK;
}

#endif /* ARDUINO ESP32 */
