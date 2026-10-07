# kLog SDK para ESP32

Cliente de ingesta REST portable entre **Arduino** y **ESP-IDF** (Espressif).

## Arduino

1. Copia `sdks/esp` a `~/Documents/Arduino/libraries/klog` (o añade la ruta en el IDE).
2. Abre `examples/arduino/BasicIngest/BasicIngest.ino`.
3. Define Wi‑Fi y credenciales kLog.

```cpp
#include <klog.h>

void setup() {
  klog_config_t cfg = {
    .base_url = "http://192.168.1.10:3100",
    .tenant_id = "018e3a2b-...",
    .token = "klog_...",
    .application_id = "018e3a2b-...",
  };
  klog_init(&cfg);
  klog_info("boot", "{\"heap\":1234}");
}
```

## ESP-IDF

Añade este directorio como componente (o vía `idf_component.yml` local):

```bash
idf.py create-project-from-example # o copia examples/idf
idf.py -p /dev/ttyUSB0 flash monitor
```

```c
#include "klog.h"

klog_config_t cfg = { .base_url = CONFIG_KLOG_URL, ... };
klog_init(&cfg);
klog_info("sensor", "{\"temp\":22.5}");
```

## Contrato

- `POST {base_url}/v1/ingest/{tenant_id}/events`
- Bearer API token; un evento por POST
- `201` creado / `202` dropped
- Reintentos en red/`429`/`502`–`504`; nunca en `400`/`401`/`403`

El `payload` se pasa como string JSON (el dispositivo construye el objeto).
