#include <WiFi.h>
#include <klog.h>

// Sustituye por tu red y credenciales de consola kLog.
const char *WIFI_SSID = "tu-wifi";
const char *WIFI_PASS = "tu-password";

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print('.');
  }
  Serial.println("\nWiFi ok");

  klog_config_t cfg = {};
  cfg.base_url = "http://192.168.1.10:3100";
  cfg.tenant_id = "018e3a2b-7c4d-7f91-88b1-3e129f123456";
  cfg.token = "klog_replace_me";
  cfg.application_id = "018e3a2b-87cf-7922-8114-ba83726410cc";
  cfg.max_retries = 3;
  cfg.timeout_ms = 8000;

  if (klog_init(&cfg) != KLOG_OK) {
    Serial.println("klog_init failed");
    return;
  }
  klog_result_t result;
  klog_err_t err = klog_log(KLOG_LEVEL_INFO, "esp32 boot", "{\"rssi\":-60}", NULL, &result);
  Serial.printf("ingest err=%d status=%d created=%d dropped=%d id=%s\n", (int)err, result.http_status,
                (int)result.created, (int)result.dropped, result.id);
}

void loop() {
  delay(15000);
  klog_info("heartbeat", "{\"uptime_ms\":15000}");
}
