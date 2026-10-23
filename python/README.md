# kLog SDK para Python

[![PyPI version](https://img.shields.io/pypi/v/klog-sdk.svg)](https://pypi.org/project/klog-sdk/)
[![Python versions](https://img.shields.io/pypi/pyversions/klog-sdk.svg)](https://pypi.org/project/klog-sdk/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com%2Fdocs%2Fsdks-success.svg)](https://klog.krisskira.com/docs/sdks)

Cliente oficial de Python para la ingesta de telemetría y eventos en la plataforma kLog (`POST /v1/ingest/{tenantId}/events`). Diseñado sin dependencias pesadas de terceros (utiliza la biblioteca estándar `urllib`), con búfer no bloqueante y gestión segura de credenciales.

---

## 📦 Instalación

Requiere **Python 3.10** o superior:

```bash
# Versión oficial estable (PyPI - Producción)
pip install klog-sdk

# Versión preliminar (TestPyPI - Staging)
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ klog-sdk
```

*(O con poetry / uv / pipenv: `poetry add klog-sdk` o `uv add klog-sdk`)*

---

## 🚀 Inicio Rápido

```python
import os
from klog_sdk import Client, Config

# Inicialización explícita
client = Client(
    Config(
        base_url=os.getenv("KLOG_URL", "https://klog-api.krisskira.com"),
        tenant_id=os.environ["KLOG_TENANT_ID"],       # UUIDv7 del tenant
        token=os.environ["KLOG_TOKEN"],               # API token klog_...
        application_id=os.getenv("KLOG_APPLICATION_ID"), # Opcional
    )
)

# Emisión de eventos (no bloquea el hilo de tu aplicación)
res = client.info("Usuario completó registro", {
    "user_id": "usr_9982",
    "plan": "pro",
    "source": "web_signup"
})

client.error("Fallo de comunicación con microservicio", {
    "service": "billing",
    "http_status": 504,
})

# Vaciado del búfer y cierre limpio
client.flush()
client.close()
```

### Inicialización directa desde Variables de Entorno

```python
from klog_sdk import Client

# Carga automáticamente KLOG_URL, KLOG_TENANT_ID, KLOG_TOKEN y KLOG_APPLICATION_ID
client = Client.from_env()

client.info("Worker batch ejecutado con éxito", {"processed_items": 1500})
```

---

## ⚙️ Opciones de Configuración

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `base_url` | `str` | **Sí** | URL base de kLog (ej: `https://klog-api.krisskira.com` para prod, `https://klog-api-staging.krisskira.com` para staging). |
| `tenant_id` | `str` | **Sí** | UUIDv7 del tenant en kLog. |
| `token` | `str` | **Sí** | Token Bearer `klog_...` emitido para el proyecto. |
| `application_id` | `str \| None` | No | UUIDv7 de la aplicación en el catálogo. |
| `max_queue_size` | `int` | No | Capacidad del búfer en memoria (defecto `1000`). |
| `max_concurrency` | `int` | No | Hilos concurrentes de envío (defecto `4`). |
| `timeout` | `float` | No | Timeout de la conexión HTTP en segundos (defecto `10.0`). |
| `max_retries` | `int` | No | Reintentos con retroceso exponencial (defecto `3`). |

---

## 🛡️ Comportamiento y Reintentos

- **`201` y `202` son éxitos:** Si el evento es recibido o descartado por un transform `filter`, el SDK lo procesa correctamente sin lanzar excepción.
- **Reintentos automáticos:** Ante caídas temporales de red, errores HTTP `429` (rate limit) y códigos `502`, `503`, `504`, el SDK reintenta hasta agotar la cuota configurada.
- **Sin reintentos en `4xx`:** Ante credenciales inválidas (`401`), falta de permisos (`403`) o sintaxis errónea (`400`), se notifica el fallo de inmediato.

---

## 📖 Enlaces

- **Manual de Usuario:** [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- **Contrato OpenAPI:** [api/openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml)
- **Repositorio:** [github.com/kriverdevice/klog-sdks](https://github.com/kriverdevice/klog-sdks)
