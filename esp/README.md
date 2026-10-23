# kLog SDK para ESP32 (IoT REST)

[![ESP32](https://img.shields.io/badge/architecture-ESP32-blue.svg)](https://www.espressif.com/)
[![Framework](https://img.shields.io/badge/framework-Arduino%20%7C%20ESP--IDF-green.svg)](https://github.com/kriverdevice/klog-sdks)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com%2Fdocs%2Fsdks-success.svg)](https://klog.krisskira.com/docs/sdks)

Biblioteca oficial en C/C++ para microcontroladores **ESP32** (incluidos ESP32-S2, ESP32-S3, ESP32-C3 y ESP32-C6). Emite telemetría directamente a la API REST de kLog (`POST /v1/ingest/{tenantId}/events`) vía HTTPS/HTTP con API token de proyecto (rol `device`).

> **Nota de Arquitectura:** kLog no utiliza intermediarios MQTT de plataforma ni brokers Mosquitto. Toda la ingesta IoT se realiza directamente mediante el contrato REST oficial seguro.

---

## 📦 Instalación

### Opción 1: Arduino IDE

1. Descarga el archivo `klog-esp32-klog-esp32-v0.1.0.ziplt;tagklog-esp32-v0.1.0.zipgt;.zip` desde la sección de [Releases de GitHub](https://github.com/kriverdevice/klog-sdks/releases).
2. En Arduino IDE, navega a **Programa → Incluir Librería → Añadir librería .ZIP...** y selecciona el archivo descargado.
3. Abre el ejemplo incluido en **Archivo → Ejemplos → klog → BasicIngest**.

*(O clona manualmente este directorio dentro de `~/Documents/Arduino/libraries/klog`)*

### Opción 2: ESP-IDF

Añade la biblioteca como componente en tu proyecto:

```bash
# Como submódulo o clon en la carpeta components/ de tu proyecto ESP-IDF
git clone https://github.com/kriverdevice/klog-sdks.git components/klog-sdks
```

O añade la dependencia en tu manifiesto `main/idf_component.yml`:
```yaml
dependencies:
  klog:
    path: ../../components/klog-sdks/esp
```

---

## 🚀 Inicio Rápido

### En Arduino (ESP32)

```cpp
#include <WiFi.h>
#include <klog.h>

const char* ssid = "MI_WIFI";
const char* password = "MI_PASSWORD";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado!");

  // Configuración de kLog
  klog_config_t cfg = {
    .base_url = "https://klog-api.krisskira.com",
    .tenant_id = "018e3a2b-c456-7890-abcd-ef0123456789", // UUIDv7 del tenant
    .token = "klog_dev_a1b2c3d4e5f6...",                  // Token de proyecto (rol device)
    .application_id = "018e3a2b-1111-2222-3333-444455556666", // Opcional
    .timeout_ms = 8000,
  };

  if (klog_init(&cfg) != KLOG_OK) {
    Serial.println("Fallo al inicializar kLog");
    return;
  }

  // Emisión de evento de telemetría con payload JSON
  klog_info("Dispositivo IoT encendido", "{\"firmware\":\"v1.2.0\",\"heap_free\":182400}");
}

void loop() {
  delay(10000);

  // Lectura periódica de sensores
  float temperatura = 24.5;
  int humedad = 60;

  char payload[128];
  snprintf(payload, sizeof(payload), "{\"temperatura\":%.1f,\"humedad\":%d}", temperatura, humedad);

  klog_result_t res;
  if (klog_send(KLOG_LEVEL_INFO, "Lectura de sensor", payload, &res) == KLOG_OK) {
    Serial.printf("Telemetría enviada: id=%s (created=%d, dropped=%d)\n",
                  res.id, res.created, res.dropped);
  }
}
```

### En ESP-IDF (C puro)

```c
#include "esp_log.h"
#include "klog.h"

void app_main(void) {
    klog_config_t cfg = {
        .base_url = "https://klog-api.krisskira.com",
        .tenant_id = CONFIG_KLOG_TENANT_ID,
        .token = CONFIG_KLOG_DEVICE_TOKEN,
        .application_id = CONFIG_KLOG_APP_ID,
        .timeout_ms = 5000,
    };

    klog_init(&cfg);
    klog_info("ESP-IDF boot", "{\"target\":\"ESP32-S3\",\"cpu_mhz\":240}");
}
```

---

## ⚙️ Estructura de Configuración (`klog_config_t`)

```c
typedef struct {
    const char *base_url;        // URL base de la API (ej: https://klog-api.krisskira.com para prod, https://klog-api-staging.krisskira.com para staging)
    const char *tenant_id;       // UUIDv7 del tenant
    const char *token;           // Token klog_... con rol device
    const char *application_id;  // UUIDv7 de la app (opcional)
    uint32_t   timeout_ms;       // Timeout HTTP en milisegundos (por defecto 8000)
} klog_config_t;
```

---

## 🛡️ Políticas de Ingesta y Reintentos

- **`201 Created`**: El evento se almacenó y procesó en la plataforma.
- **`202 Accepted`**: El evento fue filtrado y descartado por una regla de transform en el servidor.
- **Reintentos en red:** Si la señal WiFi sufre una caída temporal o el servidor responde `429` o `502`–`504`, la biblioteca reintenta automáticamente antes de reportar error.
- **Cero reintentos ante error de token:** Si el token fue revocado o es inválido (`401`/`403`), no se satura el canal con reintentos inútiles.

---

## 📖 Enlaces

- **Manual en Landing kLog:** [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- **Contrato OpenAPI de Ingesta:** [openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml)
- **Monorepo GitHub:** [github.com/kriverdevice/klog-sdks](https://github.com/kriverdevice/klog-sdks)
