package main

import (
	"context"
	"log"
	"os"
	"time"

	klog "github.com/klog-platform/klog-sdks/go"
)

func main() {
	client, err := klog.FromEnv(os.Getenv, klog.Config{})
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	defer client.Close(ctx)

	res, err := client.Info(ctx, "hola desde Go", map[string]any{"sdk": "go"})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("created=%v dropped=%v id=%s", res.Created, res.Dropped, res.ID)
}
