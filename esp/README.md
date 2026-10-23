# kLog ESP32 SDK

[![ESP32](https://img.shields.io/badge/architecture-ESP32-blue.svg)](https://www.espressif.com/)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks)

Official C/C++ REST ingest library for **Arduino** and **ESP-IDF**.  
Español: [README.es.md](README.es.md)

No platform MQTT — devices POST to ` /v1/ingest/{tenantId}/events` like every other SDK.

## Install

1. Download `klog-esp32-<tag>.zip` from [GitHub Releases](https://github.com/klog-platform/klog-sdks/releases).
2. **Arduino IDE:** Sketch → Include Library → Add .ZIP Library.
3. **ESP-IDF:** place the component under `components/klog` (or clone this repo and point CMake at `esp/`).

```bash
git clone https://github.com/klog-platform/klog-sdks.git
# use the esp/ folder as an IDF component
```

## Usage (C)

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

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- Source: [tree/main/esp](https://github.com/klog-platform/klog-sdks/tree/main/esp)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)
