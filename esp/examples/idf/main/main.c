#include "klog.h"

#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "nvs_flash.h"

static const char *TAG = "klog_example";

void app_main(void) {
  ESP_ERROR_CHECK(nvs_flash_init());
  ESP_ERROR_CHECK(esp_netif_init());
  ESP_ERROR_CHECK(esp_event_loop_create_default());
  // Conecta Wi‑Fi con tu propio helper o menuconfig antes de ingerir.

  klog_config_t cfg = {
      .base_url = "http://192.168.1.10:3100",
      .tenant_id = "018e3a2b-7c4d-7f91-88b1-3e129f123456",
      .token = "klog_replace_me",
      .application_id = "018e3a2b-87cf-7922-8114-ba83726410cc",
      .max_retries = 3,
      .timeout_ms = 8000,
  };
  if (klog_init(&cfg) != KLOG_OK) {
    ESP_LOGE(TAG, "klog_init failed");
    return;
  }
  klog_result_t result;
  klog_err_t err = klog_log(KLOG_LEVEL_INFO, "esp-idf boot", "{\"ok\":true}", NULL, &result);
  ESP_LOGI(TAG, "ingest err=%d status=%d id=%s", (int)err, result.http_status, result.id);
}
