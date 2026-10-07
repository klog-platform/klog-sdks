# kLog SDK para Go

```bash
go get klog/sdk-go@latest   # o replace local: ../sdks/go
```

```go
package main

import (
	"context"
	"log"
	"os"

	klog "klog/sdk-go"
)

func main() {
	client, err := klog.New(klog.Config{
		BaseURL:       os.Getenv("KLOG_URL"),
		TenantID:      os.Getenv("KLOG_TENANT_ID"),
		Token:         os.Getenv("KLOG_TOKEN"),
		ApplicationID: os.Getenv("KLOG_APPLICATION_ID"),
	})
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close(context.Background())

	if _, err := client.Info(context.Background(), "Pedido creado", map[string]any{"orderId": "42"}); err != nil {
		log.Fatal(err)
	}
	_ = client.Flush(context.Background())
}
```

Variables: `KLOG_URL`, `KLOG_TENANT_ID`, `KLOG_TOKEN`, `KLOG_APPLICATION_ID`.

- `201` creado / `202` dropped.
- Reintentos en red, `429`, `502`–`504`.
- No reintenta `400`/`401`/`403`.
