#if defined(ESP_PLATFORM) && !defined(ARDUINO)

#include "klog.h"
#include "klog_platform.h"

#include <string.h>

#include "esp_http_client.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

void klog_platform_delay_ms(uint32_t ms) { vTaskDelay(pdMS_TO_TICKS(ms)); }

typedef struct {
  klog_http_response_t *response;
  size_t used;
} ctx_t;

static esp_err_t on_event(esp_http_client_event_t *evt) {
  ctx_t *ctx = (ctx_t *)evt->user_data;
  if (evt->event_id == HTTP_EVENT_ON_DATA && evt->data_len > 0 && ctx && ctx->response) {
    size_t space = sizeof(ctx->response->body) - 1 - ctx->used;
    size_t n = (size_t)evt->data_len < space ? (size_t)evt->data_len : space;
    memcpy(ctx->response->body + ctx->used, evt->data, n);
    ctx->used += n;
    ctx->response->body[ctx->used] = 0;
  }
  return ESP_OK;
}

klog_err_t klog_platform_http_post(const char *url, const char *auth_header, const char *json_body,
                                   uint16_t timeout_ms, klog_http_response_t *response) {
  if (!url || !auth_header || !json_body || !response) return KLOG_ERR_INVALID;
  memset(response, 0, sizeof(*response));
  ctx_t ctx = {.response = response, .used = 0};

  esp_http_client_config_t config = {
      .url = url,
      .method = HTTP_METHOD_POST,
      .timeout_ms = timeout_ms,
      .event_handler = on_event,
      .user_data = &ctx,
  };
  esp_http_client_handle_t client = esp_http_client_init(&config);
  if (!client) return KLOG_ERR_NOMEM;

  esp_http_client_set_header(client, "Content-Type", "application/json");
  esp_http_client_set_header(client, "Authorization", auth_header);
  esp_http_client_set_header(client, "User-Agent", "klog-sdk-esp/0.1");
  esp_http_client_set_post_field(client, json_body, (int)strlen(json_body));

  esp_err_t err = esp_http_client_perform(client);
  if (err == ESP_OK) {
    response->status = esp_http_client_get_status_code(client);
  } else {
    response->status = 0;
  }
  esp_http_client_cleanup(client);
  return err == ESP_OK ? KLOG_OK : KLOG_ERR_NETWORK;
}

#endif /* ESP_PLATFORM && !ARDUINO */
