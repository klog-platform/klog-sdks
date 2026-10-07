package klog

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInfoCreatesEvent(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("method %s", r.Method)
		}
		if !strings.HasPrefix(r.URL.Path, "/v1/ingest/") {
			t.Fatalf("path %s", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer klog_test" {
			t.Fatalf("auth %q", got)
		}
		body, _ := io.ReadAll(r.Body)
		var entry Entry
		if err := json.Unmarshal(body, &entry); err != nil {
			t.Fatal(err)
		}
		if entry.Message != "hola" || entry.ApplicationID != "app-1" {
			t.Fatalf("entry %+v", entry)
		}
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"evt-1","message":"hola"}`))
	}))
	defer srv.Close()

	client, err := New(Config{
		BaseURL: srv.URL, TenantID: "tenant-1", Token: "klog_test", ApplicationID: "app-1",
		MaxRetries: 0,
	})
	if err != nil {
		t.Fatal(err)
	}
	res, err := client.Info(context.Background(), "hola", map[string]any{"n": 1})
	if err != nil {
		t.Fatal(err)
	}
	if !res.Created || res.ID != "evt-1" {
		t.Fatalf("result %+v", res)
	}
}

func TestDroppedIsDistinct(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusAccepted)
		_, _ = w.Write([]byte(`{"dropped":true,"id":"evt-2"}`))
	}))
	defer srv.Close()

	var dropped string
	client, err := New(Config{
		BaseURL: srv.URL, TenantID: "t", Token: "klog_x", ApplicationID: "a",
		MaxRetries: 0,
		OnDropped:  func(id string) { dropped = id },
	})
	if err != nil {
		t.Fatal(err)
	}
	res, err := client.Warn(context.Background(), "filtrado", nil)
	if err != nil || !res.Dropped || dropped != "evt-2" {
		t.Fatalf("res=%+v dropped=%q err=%v", res, dropped, err)
	}
}

func TestDoesNotRetryUnauthorized(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"unauthorized"}`))
	}))
	defer srv.Close()

	client, err := New(Config{
		BaseURL: srv.URL, TenantID: "t", Token: "bad", ApplicationID: "a",
		MaxRetries: 3,
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = client.Error(context.Background(), "x", nil)
	if err == nil {
		t.Fatal("expected error")
	}
	if calls != 1 {
		t.Fatalf("calls=%d want 1", calls)
	}
}
