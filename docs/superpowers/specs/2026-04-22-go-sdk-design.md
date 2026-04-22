# Go SDK Design Spec

## Overview

A Go SDK for Pingback that lets Go developers define cron jobs and background tasks, register them with the platform, and handle execution requests. Standalone repo at `github.com/champ3oy/pingback-go`.

## Decisions

- **Separate repo** — Go convention; clean import path via `go get`.
- **net/http only** — Zero dependencies, stdlib `http.Handler`. Works with any router.
- **Functional API** — `pb.Cron()` / `pb.Task()` registration, matching the JS SDK patterns.
- **Auto-register on first Handler() call** — Transparent, like the NestJS adapter.
- **Handler only** — Returns `http.Handler` for users to mount. No built-in server.

## Public API

```go
package pingback

// Client
func New(apiKey string, cronSecret string, opts ...Option) *Pingback
func (p *Pingback) Cron(name, schedule string, handler HandlerFunc, opts ...FuncOption)
func (p *Pingback) Task(name string, handler HandlerFunc, opts ...FuncOption)
func (p *Pingback) Handler() http.Handler
func (p *Pingback) Trigger(ctx context.Context, taskName string, payload any) (string, error)

// Options
func WithPlatformURL(url string) Option       // default: https://api.pingback.lol
func WithBaseURL(url string) Option           // app's public URL
func WithRetries(n int) FuncOption            // default: 0
func WithTimeout(d string) FuncOption         // e.g. "30s", "5m"
func WithConcurrency(n int) FuncOption        // default: 1

// Handler signature
type HandlerFunc func(ctx Context) (any, error)

// Context (per-execution)
type Context struct {
    ExecutionID string
    Attempt     int
    ScheduledAt time.Time
    Payload     json.RawMessage
}
func (c *Context) Log(msg string, meta ...any)
func (c *Context) Warn(msg string, meta ...any)
func (c *Context) Error(msg string, meta ...any)
func (c *Context) Debug(msg string, meta ...any)
func (c *Context) Task(name string, payload any)
```

### Notes

- `HandlerFunc` returns `(any, error)` — `any` becomes `result`, `error` becomes the error string.
- `Payload` is `json.RawMessage` so users unmarshal into their own types.
- `Log()` = info level. `Warn()`, `Error()`, `Debug()` for other levels.
- `Trigger()` accepts `context.Context` for cancellation/timeouts.

## Usage Example

```go
package main

import (
    "net/http"
    "os"

    pingback "github.com/champ3oy/pingback-go"
)

func main() {
    pb := pingback.New(
        os.Getenv("PINGBACK_API_KEY"),
        os.Getenv("PINGBACK_CRON_SECRET"),
    )

    pb.Cron("cleanup", "0 3 * * *", func(ctx pingback.Context) (any, error) {
        expired, err := removeExpiredSessions()
        if err != nil {
            return nil, err
        }
        ctx.Log("Removed sessions", "count", expired)
        return map[string]int{"removed": expired}, nil
    }, pingback.WithRetries(2))

    pb.Task("send-email", func(ctx pingback.Context) (any, error) {
        var p EmailPayload
        json.Unmarshal(ctx.Payload, &p)
        err := sendEmail(p)
        ctx.Log("Sent email", "to", p.To)
        return nil, err
    }, pingback.WithTimeout("15s"))

    http.Handle("/api/pingback", pb.Handler())
    http.ListenAndServe(":8080", nil)
}
```

## Request Handling Flow

1. **Verify signature** — Read raw body. Check `X-Pingback-Signature` and `X-Pingback-Timestamp` headers. Compute HMAC-SHA256 over `"{timestamp}.{body}"` using `cronSecret`. Timing-safe compare. Reject if invalid or timestamp > 5 minutes old. Return 401.

2. **Parse payload** — Unmarshal body into `ExecutionPayload`:
   ```json
   {
     "function": "cleanup",
     "executionId": "uuid",
     "attempt": 1,
     "scheduledAt": "2026-04-22T03:00:00Z",
     "payload": {}
   }
   ```

3. **Lookup handler** — Find registered function by name. Return 404 if not found.

4. **Build context** — Create `Context` with execution metadata, empty log slice, empty task slice.

5. **Execute** — Call the handler. Measure duration with `time.Now()`.

6. **Respond** — Return JSON:
   ```json
   {
     "status": "success",
     "result": { "removed": 42 },
     "logs": [
       { "timestamp": 1713754800123, "level": "info", "message": "Removed sessions", "meta": { "count": 42 } }
     ],
     "tasks": [],
     "durationMs": 523
   }
   ```
   HTTP 200 on success, HTTP 500 on handler error.

## Registration Flow

On the first call to `Handler()`:

1. Collect metadata from all registered crons and tasks.
2. POST to `{platformURL}/api/v1/register`:
   ```json
   {
     "functions": [
       { "name": "cleanup", "type": "cron", "schedule": "0 3 * * *", "options": { "retries": 2 } },
       { "name": "send-email", "type": "task", "options": { "timeout": "15s" } }
     ],
     "endpoint_url": "https://myapp.com/api/pingback"
   }
   ```
   Headers: `Authorization: Bearer {apiKey}`, `Content-Type: application/json`.
3. Log result. If registration fails, log the error but don't block serving.

Uses `sync.Once` to ensure registration runs exactly once.

## Trigger Flow

`pb.Trigger(ctx, "send-email", payload)`:

1. POST to `{platformURL}/api/v1/trigger`:
   ```json
   { "task": "send-email", "payload": { "to": "user@example.com" } }
   ```
   Headers: `Authorization: Bearer {apiKey}`.
2. Parse response, return `executionId`.
3. Propagate HTTP errors as Go errors.

## HMAC Verification

- Algorithm: HMAC-SHA256
- Message: `"{X-Pingback-Timestamp}.{rawBody}"`
- Key: `cronSecret`
- Output: hex-encoded digest
- Comparison: `hmac.Equal()` (timing-safe)
- Clock tolerance: 5 minutes

## File Structure

```
pingback-go/
├── pingback.go        # Pingback client, Cron(), Task(), Handler(), Trigger()
├── context.go         # Context struct, logging methods, Task collector
├── hmac.go            # HMAC signing, verification, timing-safe compare
├── register.go        # Registration HTTP call to platform
├── types.go           # ExecutionPayload, ExecutionResult, FunctionDef, options
├── pingback_test.go   # Client and handler tests
├── hmac_test.go       # Signature verification tests
├── go.mod
├── go.sum
├── LICENSE
└── README.md
```

## Testing

- **HMAC tests** — Valid signature, invalid signature, expired timestamp, tampered body.
- **Handler tests** — Successful execution, unknown function (404), invalid signature (401), handler error (500 + error response), fan-out tasks collected in response.
- **Registration tests** — Mock HTTP server, verify payload shape, verify sync.Once behavior.
- **Trigger tests** — Mock HTTP server, verify request format, error propagation.

All tests use `net/http/httptest` — no external test dependencies.
