# kLog SDK para Go

[![Go Reference](https://pkg.go.dev/badge/github.com/kriverdevice/klog-sdks/go.svg)](https://pkg.go.dev/github.com/kriverdevice/klog-sdks/go)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com%2Fdocs%2Fsdks-success.svg)](https://klog.krisskira.com/docs/sdks)

Cliente oficial en Go para la ingesta de telemetría y eventos en la API REST de kLog (`POST /v1/ingest/{tenantId}/events`). Implementa búfer en memoria no bloqueante, tipado estricto, despacho asíncrono y reintentos transparentes.

---

## 📦 Instalación

Requiere **Go 1.22** o superior:

```bash
# Versión oficial estable (Producción)
go get github.com/kriverdevice/klog-sdks/go@latest

# Versión preliminar / Staging
go get github.com/kriverdevice/klog-sdks/go@stg
```

---

## 🚀 Inicio Rápido

```go
package main

import (
	"context"
	"log"
	"os"
	"time"

	klog "github.com/kriverdevice/klog-sdks/go"
)

func main() {
	// Inicialización del cliente con configuración explícita
	client, err := klog.New(klog.Config{
		BaseURL:       os.Getenv("KLOG_URL"),        // ej: "https://klog-api.krisskira.com"
		TenantID:      os.Getenv("KLOG_TENANT_ID"), // UUIDv7 de tu tenant
		Token:         os.Getenv("KLOG_TOKEN"),     // API token klog_...
		ApplicationID: os.Getenv("KLOG_APPLICATION_ID"), // Opcional
	})
	if err != nil {
		log.Fatalf("Error al inicializar kLog: %v", err)
	}

	// Asegura el drenado de la cola y cierre del cliente al salir
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	defer client.Close(ctx)

	// Emisión de eventos (no bloquea el flujo principal)
	res, err := client.Info(ctx, "Servicio iniciado", map[string]any{
		"version": "1.4.0",
		"env":     "production",
	})
	if err != nil {
		log.Printf("Fallo al registrar evento: %v", err)
	} else {
		log.Printf("Evento emitido -> id: %s (creado=%v, descartado=%v)", res.ID, res.Created, res.Dropped)
	}

	// Registro de errores estructurados
	_, _ = client.Error(ctx, "Error de base de datos", map[string]any{
		"query": "SELECT * FROM orders WHERE id = $1",
		"code":  "SQL_CONN_TIMEOUT",
	})

	// Vaciado manual si es requerido (e.g. antes de culminar una tarea batch)
	_ = client.Flush(ctx)
}
```

### Inicialización directa desde el Entorno

```go
client, err := klog.FromEnv(os.Getenv, klog.Config{})
```

---

## ⚙️ Configuración

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `BaseURL` | `string` | **Sí** | URL base de la API de kLog (ej: `https://klog-api.krisskira.com` para prod, `https://klog-api-staging.krisskira.com` para staging). |
| `TenantID` | `string` | **Sí** | Identificador UUIDv7 del tenant receptor. |
| `Token` | `string` | **Sí** | Token Bearer de proyecto (`klog_...`). |
| `ApplicationID` | `string` | No | UUIDv7 de la aplicación en el catálogo. |
| `MaxQueueSize` | `int` | No | Capacidad del canal interno (por defecto `1000`). |
| `MaxConcurrency` | `int` | No | Goroutines de despacho concurrente (por defecto `4`). |
| `Timeout` | `time.Duration` | No | Timeout por petición HTTP (por defecto `10s`). |
| `MaxRetries` | `int` | No | Reintentos con backoff (por defecto `3`). |

---

## 🛡️ Políticas de Ingesta y Reintentos

- **`201 Created` / `202 Accepted`:** Ambos códigos HTTP son tratados como recepciones exitosas (`res.Created == true` o `res.Dropped == true` respectivamente).
- **Reintentos en fallos transitorios:** Reintenta automáticamente ante errores de red, HTTP `429` (rate limit) y errores de servidor `502`, `503`, `504`.
- **Sin reintentos ante errores definitivos:** HTTP `400`, `401`, `403` devuelven el error de forma inmediata sin reintentar.

---

## 📖 Enlaces

- **Manual de Usuario:** [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- **Contrato OpenAPI:** [api/openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml)
- **Monorepo:** [github.com/kriverdevice/klog-sdks](https://github.com/kriverdevice/klog-sdks)
