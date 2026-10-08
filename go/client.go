package klog

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Config configura el cliente de ingesta. El token no debe registrarse en logs.
type Config struct {
	BaseURL        string
	TenantID       string
	Token          string
	ApplicationID  string
	DefaultTags    []string
	DefaultLevel   string
	HTTPClient     *http.Client
	MaxRetries     int
	Timeout        time.Duration
	MaxQueueSize   int
	MaxConcurrency int
	OnDropped      func(id string)
	OnOverflow     func(Entry)
	OnError        func(error)
}

// Entry es un evento pendiente de envío.
type Entry struct {
	Level         string   `json:"level,omitempty"`
	Message       string   `json:"message"`
	Payload       any      `json:"payload,omitempty"`
	Tags          []string `json:"tags,omitempty"`
	TraceID       string   `json:"traceId,omitempty"`
	ApplicationID string   `json:"applicationId,omitempty"`
}

// Result distingue creación (201) y descarte por transform (202).
type Result struct {
	Created bool
	Dropped bool
	ID      string
	Raw     json.RawMessage
}

// Client envía eventos a POST /v1/ingest/{tenantId}/events.
type Client struct {
	cfg    Config
	http   *http.Client
	url    string
	mu     sync.Mutex
	queue  []queued
	active int
	closed bool
	wg     sync.WaitGroup
}

type queued struct {
	entry Entry
	done  chan resultOrErr
}

type resultOrErr struct {
	res Result
	err error
}

// New valida la configuración y crea un cliente con cola acotada.
func New(cfg Config) (*Client, error) {
	cfg.BaseURL = strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	if cfg.BaseURL == "" || cfg.TenantID == "" || cfg.Token == "" || cfg.ApplicationID == "" {
		return nil, errors.New("faltan BaseURL, TenantID, Token o ApplicationID")
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 10 * time.Second
	}
	if cfg.MaxRetries <= 0 {
		cfg.MaxRetries = 3
	}
	if cfg.MaxQueueSize <= 0 {
		cfg.MaxQueueSize = 1000
	}
	if cfg.MaxConcurrency <= 0 {
		cfg.MaxConcurrency = 4
	}
	if cfg.DefaultLevel == "" {
		cfg.DefaultLevel = "info"
	}
	hc := cfg.HTTPClient
	if hc == nil {
		hc = &http.Client{Timeout: cfg.Timeout}
	}
	return &Client{
		cfg:  cfg,
		http: hc,
		url:  fmt.Sprintf("%s/v1/ingest/%s/events", cfg.BaseURL, cfg.TenantID),
	}, nil
}

// FromEnv lee KLOG_URL, KLOG_TENANT_ID, KLOG_TOKEN y KLOG_APPLICATION_ID.
func FromEnv(getenv func(string) string, overrides Config) (*Client, error) {
	if getenv == nil {
		return nil, errors.New("getenv es requerido")
	}
	if overrides.BaseURL == "" {
		overrides.BaseURL = firstNonEmpty(getenv("KLOG_URL"), getenv("KLOG_API_URL"))
	}
	if overrides.TenantID == "" {
		overrides.TenantID = getenv("KLOG_TENANT_ID")
	}
	if overrides.Token == "" {
		overrides.Token = getenv("KLOG_TOKEN")
	}
	if overrides.ApplicationID == "" {
		overrides.ApplicationID = getenv("KLOG_APPLICATION_ID")
	}
	return New(overrides)
}

func (c *Client) Debug(ctx context.Context, message string, payload any, tags ...string) (Result, error) {
	return c.Log(ctx, Entry{Level: "debug", Message: message, Payload: payload, Tags: tags})
}
func (c *Client) Info(ctx context.Context, message string, payload any, tags ...string) (Result, error) {
	return c.Log(ctx, Entry{Level: "info", Message: message, Payload: payload, Tags: tags})
}
func (c *Client) Warn(ctx context.Context, message string, payload any, tags ...string) (Result, error) {
	return c.Log(ctx, Entry{Level: "warn", Message: message, Payload: payload, Tags: tags})
}
func (c *Client) Error(ctx context.Context, message string, payload any, tags ...string) (Result, error) {
	return c.Log(ctx, Entry{Level: "error", Message: message, Payload: payload, Tags: tags})
}

// Log encola y espera el resultado del envío.
func (c *Client) Log(ctx context.Context, entry Entry) (Result, error) {
	entry = c.normalize(entry)
	ch := make(chan resultOrErr, 1)
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return Result{}, errors.New("el cliente está cerrado")
	}
	if len(c.queue)+c.active >= c.cfg.MaxQueueSize {
		c.mu.Unlock()
		if c.cfg.OnOverflow != nil {
			c.cfg.OnOverflow(entry)
		}
		return Result{}, errors.New("cola de ingesta llena")
	}
	c.queue = append(c.queue, queued{entry: entry, done: ch})
	c.pumpLocked()
	c.mu.Unlock()

	select {
	case <-ctx.Done():
		return Result{}, ctx.Err()
	case out := <-ch:
		return out.res, out.err
	}
}

// Flush espera a que la cola quede vacía.
func (c *Client) Flush(ctx context.Context) error {
	for {
		c.mu.Lock()
		idle := len(c.queue) == 0 && c.active == 0
		c.mu.Unlock()
		if idle {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(10 * time.Millisecond):
		}
	}
}

// Close drena la cola y rechaza nuevos envíos.
func (c *Client) Close(ctx context.Context) error {
	if err := c.Flush(ctx); err != nil {
		return err
	}
	c.mu.Lock()
	c.closed = true
	c.mu.Unlock()
	c.wg.Wait()
	return nil
}

func (c *Client) normalize(entry Entry) Entry {
	if strings.TrimSpace(entry.Message) == "" {
		entry.Message = "(empty)"
	}
	if entry.Level == "" {
		entry.Level = c.cfg.DefaultLevel
	}
	if entry.ApplicationID == "" {
		entry.ApplicationID = c.cfg.ApplicationID
	}
	if len(entry.Tags) == 0 && len(c.cfg.DefaultTags) > 0 {
		entry.Tags = append([]string(nil), c.cfg.DefaultTags...)
	}
	if entry.Payload == nil {
		entry.Payload = map[string]any{}
	}
	return entry
}

func (c *Client) pumpLocked() {
	for c.active < c.cfg.MaxConcurrency && len(c.queue) > 0 {
		item := c.queue[0]
		c.queue = c.queue[1:]
		c.active++
		c.wg.Add(1)
		go func(q queued) {
			defer c.wg.Done()
			res, err := c.deliver(q.entry)
			q.done <- resultOrErr{res: res, err: err}
			c.mu.Lock()
			c.active--
			c.pumpLocked()
			c.mu.Unlock()
		}(item)
	}
}

func (c *Client) deliver(entry Entry) (Result, error) {
	var last error
	for attempt := 1; attempt <= c.cfg.MaxRetries+1; attempt++ {
		res, err := c.sendOnce(entry)
		if err == nil {
			if res.Dropped && c.cfg.OnDropped != nil {
				c.cfg.OnDropped(res.ID)
			}
			return res, nil
		}
		last = err
		var httpErr *HTTPError
		if errors.As(err, &httpErr) && !httpErr.Retryable {
			break
		}
		if attempt > c.cfg.MaxRetries {
			break
		}
		delay := time.Duration(200*(1<<(attempt-1))) * time.Millisecond
		if delay > 3200*time.Millisecond {
			delay = 3200 * time.Millisecond
		}
		delay += time.Duration(rand.Intn(100)) * time.Millisecond
		time.Sleep(delay)
	}
	if c.cfg.OnError != nil {
		c.cfg.OnError(last)
	}
	return Result{}, last
}

func (c *Client) sendOnce(entry Entry) (Result, error) {
	body, err := json.Marshal(entry)
	if err != nil {
		return Result{}, err
	}
	req, err := http.NewRequest(http.MethodPost, c.url, bytes.NewReader(body))
	if err != nil {
		return Result{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.cfg.Token)
	req.Header.Set("User-Agent", "klog-sdk-go/0.1")

	resp, err := c.http.Do(req)
	if err != nil {
		return Result{}, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))

	switch resp.StatusCode {
	case http.StatusCreated:
		var created struct {
			ID string `json:"id"`
		}
		_ = json.Unmarshal(raw, &created)
		return Result{Created: true, ID: created.ID, Raw: raw}, nil
	case http.StatusAccepted:
		var dropped struct {
			Dropped bool   `json:"dropped"`
			ID      string `json:"id"`
		}
		_ = json.Unmarshal(raw, &dropped)
		return Result{Dropped: true, ID: dropped.ID, Raw: raw}, nil
	case http.StatusTooManyRequests, http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return Result{}, &HTTPError{Status: resp.StatusCode, Body: string(raw), Retryable: true}
	case http.StatusBadRequest, http.StatusUnauthorized, http.StatusForbidden:
		return Result{}, &HTTPError{Status: resp.StatusCode, Body: string(raw), Retryable: false}
	default:
		retryable := resp.StatusCode >= 500
		return Result{}, &HTTPError{Status: resp.StatusCode, Body: string(raw), Retryable: retryable}
	}
}

// HTTPError describe un fallo HTTP de ingesta.
type HTTPError struct {
	Status    int
	Body      string
	Retryable bool
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("klog ingest http %d: %s", e.Status, e.Body)
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
