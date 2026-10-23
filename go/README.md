# kLog SDK for Go

[![Go Reference](https://pkg.go.dev/badge/github.com/klog-platform/klog-sdks/go.svg)](https://pkg.go.dev/github.com/klog-platform/klog-sdks/go)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks?lang=en)

Official REST ingest client for Go 1.22+.  
Español: [README.es.md](README.es.md)

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks?lang=en)
- Source: [github.com/klog-platform/klog-sdks/tree/main/go](https://github.com/klog-platform/klog-sdks/tree/main/go)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)

## Install

```bash
go get github.com/klog-platform/klog-sdks/go@latest
```

## Usage

```go
package main

import (
	"context"
	"log"
	"os"
	"time"

	klog "github.com/klog-platform/klog-sdks/go"
)

func main() {
	client, err := klog.New(klog.Config{
		BaseURL:       os.Getenv("KLOG_URL"), // https://klog-api.krisskira.com
		TenantID:      os.Getenv("KLOG_TENANT_ID"),
		Token:         os.Getenv("KLOG_TOKEN"),
		ApplicationID: os.Getenv("KLOG_APPLICATION_ID"),
	})
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	defer client.Close(ctx)

	_ = client.Info(ctx, "worker.tick", map[string]any{"n": 1})
}
```

## Config

| Field | Env | Required |
|---|---|---|
| `BaseURL` | `KLOG_URL` | Yes |
| `TenantID` | `KLOG_TENANT_ID` | Yes |
| `Token` | `KLOG_TOKEN` | Yes |
| `ApplicationID` | `KLOG_APPLICATION_ID` | Yes |

Always `Flush` / `Close` with a context before process exit. Treat `201` and `202` as success; do not retry `400`/`401`/`403`.
