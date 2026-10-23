# kLog SDK para PHP

[![Latest Version on Packagist](https://img.shields.io/packagist/v/kriverdevice/klog-sdk-php.svg)](https://packagist.org/packages/kriverdevice/klog-sdk-php)
[![Total Downloads](https://img.shields.io/packagist/dt/kriverdevice/klog-sdk-php.svg)](https://packagist.org/packages/kriverdevice/klog-sdk-php)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com%2Fdocs%2Fsdks-success.svg)](https://klog.krisskira.com/docs/sdks)

Cliente oficial en PHP (8.1+) para la ingesta de telemetría y eventos en la plataforma kLog (`POST /v1/ingest/{tenantId}/events`). Utiliza la extensión `curl` nativa, compatible con frameworks modernos (Laravel, Symfony, WordPress) y arquitecturas tradicionales.

---

## 📦 Instalación

A través de [Composer](https://getcomposer.org/):

```bash
# Versión oficial estable (Producción)
composer require kriverdevice/klog-sdk-php

# Versión de desarrollo / Staging
composer require kriverdevice/klog-sdk-php:dev-stg
```

---

## 🚀 Inicio Rápido

```php
<?php

require_once __DIR__ . '/vendor/autoload.php';

use Klog\Client;
use Klog\Config;

// Inicialización explícita
$config = new Config(
    baseUrl: getenv('KLOG_URL') ?: 'https://klog-api.krisskira.com',
    tenantId: getenv('KLOG_TENANT_ID'),       // UUIDv7 del tenant
    token: getenv('KLOG_TOKEN'),             // Token de proyecto klog_...
    applicationId: getenv('KLOG_APPLICATION_ID') ?: null // Opcional
);

$client = new Client($config);

// Registro de eventos
$result = $client->info('Orden de compra procesada', [
    'orderId' => 'ORD-12904',
    'customer' => 'acme_corp',
    'total' => 1290.50,
]);

$client->error('Excepción al conectar con pasarela', [
    'gateway' => 'stripe',
    'code' => 'CARD_DECLINED',
]);

// Drenado de cola y cierre
$client->flush();
$client->close();
```

### Inicialización directa desde Variables de Entorno

```php
$client = Client::fromEnv();
$client->info('Tarea programada finalizada con éxito');
```

---

## ⚙️ Opciones de Configuración

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `baseUrl` | `string` | **Sí** | URL base de la API de kLog (ej: `https://klog-api.krisskira.com` para prod, `https://klog-api-staging.krisskira.com` para staging). |
| `tenantId` | `string` | **Sí** | Identificador UUIDv7 del tenant receptor. |
| `token` | `string` | **Sí** | Token Bearer de proyecto (`klog_...`). |
| `applicationId` | `?string` | No | UUIDv7 de la aplicación registrada en el catálogo. |
| `maxQueueSize` | `int` | No | Capacidad del búfer en memoria (por defecto `1000`). |
| `timeout` | `float` | No | Timeout de la conexión cURL en segundos (por defecto `10.0`). |
| `maxRetries` | `int` | No | Intentos con backoff exponencial (por defecto `3`). |

---

## 🛡️ Políticas y Reintentos

- **`201` y `202` son exitosos:** El cliente procesa el código `201 Created` y `202 Accepted` (descartado por transform) sin lanzar excepciones.
- **Reintentos en fallos transitorios:** Reintenta automáticamente en caso de problemas de conectividad de red, HTTP `429` (límite de cuota) y errores `502`–`504`.
- **Sin reintentos ante errores de autenticación:** Errores `401 Unauthorized` o `403 Forbidden` fallan de forma inmediata.

---

## 📖 Enlaces

- **Manual en Landing kLog:** [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- **Contrato OpenAPI de Ingesta:** [openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml)
- **Paquete en Packagist:** [packagist.org/packages/kriverdevice/klog-sdk-php](https://packagist.org/packages/kriverdevice/klog-sdk-php)
