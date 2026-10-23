# SDK ESP32 kLog

[![ESP32](https://img.shields.io/badge/architecture-ESP32-blue.svg)](https://www.espressif.com/)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks?lang=es)

Biblioteca C/C++ oficial de ingesta REST para **Arduino** y **ESP-IDF**.  
English: [README.md](README.md)

1. Descarga `klog-esp32-<tag>.zip` desde [Releases](https://github.com/klog-platform/klog-sdks/releases).
2. Arduino: Sketch → Include Library → Add .ZIP Library.
3. ESP-IDF: usa la carpeta `esp/` como componente.

```c
klog_config_t cfg = {
  .base_url = "https://klog-api.krisskira.com",
  .tenant_id = "YOUR_TENANT_UUID",
  .token = "klog_…",
  .application_id = "YOUR_APP_UUID",
};
klog_client_t *client = klog_client_create(&cfg);
klog_info(client, "sensor.reading", "{\"c\":22.5}");
klog_flush(client);
klog_client_destroy(client);
```

Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks?lang=es) · Código: [tree/main/esp](https://github.com/klog-platform/klog-sdks/tree/main/esp)
