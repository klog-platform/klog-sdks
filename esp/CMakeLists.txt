idf_component_register(
  SRCS "src/klog.c" "src/klog_platform_idf.c"
  INCLUDE_DIRS "include"
  REQUIRES esp_http_client esp_timer nvs_flash
)
