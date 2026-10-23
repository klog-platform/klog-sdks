# SDK Go kLog

[![Go Reference](https://pkg.go.dev/badge/github.com/klog-platform/klog-sdks/go.svg)](https://pkg.go.dev/github.com/klog-platform/klog-sdks/go)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks?lang=es)

Cliente oficial de ingesta REST para Go 1.22+.  
English: [README.md](README.md)

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks?lang=es)
- Código: [tree/main/go](https://github.com/klog-platform/klog-sdks/tree/main/go)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)

## Instalación

```bash
go get github.com/klog-platform/klog-sdks/go@latest
```

## Uso

```go
import (
	"context"
	"os"
	"time"
	klog "github.com/klog-platform/klog-sdks/go"
)

client, err := klog.New(klog.Config{
	BaseURL:       os.Getenv("KLOG_URL"),
	TenantID:      os.Getenv("KLOG_TENANT_ID"),
	Token:         os.Getenv("KLOG_TOKEN"),
	ApplicationID: os.Getenv("KLOG_APPLICATION_ID"),
})
// manejar err
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
defer client.Close(ctx)
_ = client.Info(ctx, "worker.tick", map[string]any{"n": 1})
```

Siempre `Flush` / `Close` con context. `201` y `202` son éxito; no reintentes `400`/`401`/`403`.
