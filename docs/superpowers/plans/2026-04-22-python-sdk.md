# Python SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python SDK for Pingback that lets Python developers define cron jobs and background tasks using decorators, register them with the platform, and handle execution requests.

**Architecture:** Single Python package with zero external dependencies. Four modules: context, HMAC, registration, and the main client. Framework-agnostic `handle()` method with thin Flask/FastAPI wrappers. Decorator-based function registration.

**Tech Stack:** Python stdlib only — `hmac`, `hashlib`, `json`, `time`, `urllib.request`, `threading`, `unittest` (tests).

**Spec:** `docs/superpowers/specs/2026-04-22-python-sdk-design.md`

---

### Task 1: Project scaffold

**Files:**
- Create: `pingback-py/pyproject.toml`
- Create: `pingback-py/pingback/__init__.py`
- Create: `pingback-py/LICENSE`

- [ ] **Step 1: Create project directory structure**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
mkdir -p pingback tests example
```

- [ ] **Step 2: Create pyproject.toml**

```toml
[build-system]
requires = ["setuptools>=64"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "pingback-py"
version = "0.1.0"
description = "Python SDK for Pingback — reliable cron jobs and background tasks"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.10"
authors = [{name = "Pingback"}]
keywords = ["pingback", "cron", "scheduled-jobs", "background-tasks"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
]

[project.urls]
Homepage = "https://pingback.lol"
Repository = "https://github.com/champ3oy/pingback-py"
Documentation = "https://pingback.lol/docs"
```

- [ ] **Step 3: Create pingback/__init__.py**

```python
from pingback.client import Pingback
from pingback.context import Context

__all__ = ["Pingback", "Context"]
```

- [ ] **Step 4: Create empty module files so imports don't fail yet**

Create `pingback/client.py`:
```python
class Pingback:
    pass
```

Create `pingback/context.py`:
```python
class Context:
    pass
```

Create `pingback/hmac.py` (empty):
```python
```

Create `pingback/register.py` (empty):
```python
```

- [ ] **Step 5: Copy LICENSE**

```bash
cp /Users/cirx/Desktop/projects/personal/pingback/pingback/LICENSE /Users/cirx/Desktop/projects/personal/pingback/pingback-py/LICENSE
```

- [ ] **Step 6: Initialize git and commit**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
git init
git add pyproject.toml pingback/ LICENSE
git commit -m "chore: initialize Python package"
```

---

### Task 2: Context

**Files:**
- Create: `pingback-py/pingback/context.py`

- [ ] **Step 1: Implement context.py**

```python
import time
from datetime import datetime


class Context:
    """Per-execution context passed to cron and task handlers."""

    def __init__(self, execution_id: str, attempt: int, scheduled_at: datetime, payload=None):
        self.execution_id = execution_id
        self.attempt = attempt
        self.scheduled_at = scheduled_at
        self.payload = payload
        self._logs: list[dict] = []
        self._tasks: list[dict] = []

    def _add_log(self, level: str, message: str, **meta):
        entry = {
            "timestamp": int(time.time() * 1000),
            "level": level,
            "message": message,
        }
        if meta:
            entry["meta"] = meta
        self._logs.append(entry)

    def log(self, message: str, **meta):
        """Add an info-level log entry."""
        self._add_log("info", message, **meta)

    def warn(self, message: str, **meta):
        """Add a warn-level log entry."""
        self._add_log("warn", message, **meta)

    def error(self, message: str, **meta):
        """Add an error-level log entry."""
        self._add_log("error", message, **meta)

    def debug(self, message: str, **meta):
        """Add a debug-level log entry."""
        self._add_log("debug", message, **meta)

    def task(self, name: str, payload=None):
        """Queue a fan-out task to be dispatched after this handler completes."""
        self._tasks.append({"name": name, "payload": payload})
```

- [ ] **Step 2: Verify it imports**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
python -c "from pingback.context import Context; c = Context('id', 1, None); c.log('test', x=1); print(c._logs)"
```

Expected: `[{'timestamp': ..., 'level': 'info', 'message': 'test', 'meta': {'x': 1}}]`

- [ ] **Step 3: Commit**

```bash
git add pingback/context.py
git commit -m "feat: add execution context with logging and fan-out"
```

---

### Task 3: HMAC verification

**Files:**
- Create: `pingback-py/pingback/hmac.py`
- Create: `pingback-py/tests/test_hmac.py`

- [ ] **Step 1: Write test_hmac.py**

```python
import time
import unittest

from pingback.hmac import compute_hmac, verify_signature


class TestHMAC(unittest.TestCase):
    def test_valid_signature(self):
        secret = "test-secret"
        body = '{"function":"cleanup"}'
        ts = str(int(time.time()))
        sig = compute_hmac(ts, body, secret)

        # Should not raise
        verify_signature(sig, ts, body, secret)

    def test_invalid_signature(self):
        secret = "test-secret"
        body = '{"function":"cleanup"}'
        ts = str(int(time.time()))

        with self.assertRaises(ValueError):
            verify_signature("bad-signature", ts, body, secret)

    def test_expired_timestamp(self):
        secret = "test-secret"
        body = '{"function":"cleanup"}'
        ts = str(int(time.time()) - 360)  # 6 minutes ago
        sig = compute_hmac(ts, body, secret)

        with self.assertRaises(ValueError):
            verify_signature(sig, ts, body, secret)

    def test_tampered_body(self):
        secret = "test-secret"
        body = '{"function":"cleanup"}'
        ts = str(int(time.time()))
        sig = compute_hmac(ts, body, secret)

        with self.assertRaises(ValueError):
            verify_signature(sig, ts, '{"function":"malicious"}', secret)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
python -m pytest tests/test_hmac.py -v 2>/dev/null || python -m unittest tests.test_hmac -v
```

Expected: ImportError — `compute_hmac` and `verify_signature` not defined.

- [ ] **Step 3: Implement hmac.py**

```python
import hashlib
import hmac as _hmac
import time


MAX_CLOCK_SKEW = 300  # 5 minutes in seconds


def compute_hmac(timestamp: str, body: str, secret: str) -> str:
    """Compute HMAC-SHA256 signature for the given timestamp and body."""
    message = f"{timestamp}.{body}"
    return _hmac.new(
        secret.encode(), message.encode(), hashlib.sha256
    ).hexdigest()


def verify_signature(signature: str, timestamp: str, body: str, secret: str):
    """Verify HMAC signature. Raises ValueError if invalid."""
    try:
        ts = int(timestamp)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid timestamp: {timestamp}")

    age = abs(int(time.time()) - ts)
    if age > MAX_CLOCK_SKEW:
        raise ValueError(f"Timestamp expired: {age}s old")

    expected = compute_hmac(timestamp, body, secret)
    if not _hmac.compare_digest(expected, signature):
        raise ValueError("Signature mismatch")
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
python -m unittest tests.test_hmac -v
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add pingback/hmac.py tests/test_hmac.py
git commit -m "feat: add HMAC signature verification"
```

---

### Task 4: Registration

**Files:**
- Create: `pingback-py/pingback/register.py`

- [ ] **Step 1: Implement register.py**

```python
import json
import logging
import urllib.request

logger = logging.getLogger("pingback")


def register(functions: dict, api_key: str, platform_url: str, base_url: str | None):
    """Register functions with the Pingback platform."""
    funcs = []
    for name, fn_def in functions.items():
        entry = {
            "name": name,
            "type": fn_def["type"],
            "options": {
                "retries": fn_def["retries"],
                "timeout": fn_def["timeout"],
                "concurrency": fn_def["concurrency"],
            },
        }
        if fn_def["type"] == "cron":
            entry["schedule"] = fn_def["schedule"]
        # Clean None values from options
        entry["options"] = {k: v for k, v in entry["options"].items() if v is not None and v != 0}
        funcs.append(entry)

    payload = {"functions": funcs}
    if base_url:
        payload["endpoint_url"] = base_url

    body = json.dumps(payload).encode()
    url = f"{platform_url}/api/v1/register"

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            jobs = result.get("jobs", [])
            logger.info(f"[pingback] Registered {len(jobs)} function(s) with platform")
    except Exception as e:
        logger.error(f"[pingback] Registration failed: {e}")
```

- [ ] **Step 2: Verify it imports**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
python -c "from pingback.register import register; print('ok')"
```

- [ ] **Step 3: Commit**

```bash
git add pingback/register.py
git commit -m "feat: add platform registration"
```

---

### Task 5: Main client

**Files:**
- Create: `pingback-py/pingback/client.py`
- Create: `pingback-py/tests/test_client.py`

- [ ] **Step 1: Implement client.py**

```python
import json
import logging
import threading
import time
import urllib.request
from datetime import datetime

from pingback.context import Context
from pingback.hmac import verify_signature
from pingback.register import register as register_functions

logger = logging.getLogger("pingback")

DEFAULT_PLATFORM_URL = "https://api.pingback.lol"


class Pingback:
    """Pingback SDK client."""

    def __init__(
        self,
        api_key: str,
        cron_secret: str,
        platform_url: str | None = None,
        base_url: str | None = None,
    ):
        self.api_key = api_key
        self.cron_secret = cron_secret
        self.platform_url = platform_url or DEFAULT_PLATFORM_URL
        self.base_url = base_url
        self._functions: dict = {}
        self._registered = False
        self._register_lock = threading.Lock()

    def cron(self, name: str, schedule: str, retries: int = 0, timeout: str | None = None, concurrency: int = 1):
        """Decorator to register a cron job."""
        def decorator(fn):
            self._functions[name] = {
                "type": "cron",
                "schedule": schedule,
                "handler": fn,
                "retries": retries,
                "timeout": timeout,
                "concurrency": concurrency,
            }
            return fn
        return decorator

    def task(self, name: str, retries: int = 0, timeout: str | None = None, concurrency: int = 1):
        """Decorator to register a background task."""
        def decorator(fn):
            self._functions[name] = {
                "type": "task",
                "schedule": None,
                "handler": fn,
                "retries": retries,
                "timeout": timeout,
                "concurrency": concurrency,
            }
            return fn
        return decorator

    def _ensure_registered(self):
        """Register functions with the platform once."""
        with self._register_lock:
            if not self._registered and self.api_key:
                self._registered = True
                try:
                    register_functions(self._functions, self.api_key, self.platform_url, self.base_url)
                except Exception as e:
                    logger.error(f"[pingback] Registration failed: {e}")

    def handle(self, body: bytes, headers: dict) -> dict:
        """Process an execution request. Framework-agnostic core method."""
        self._ensure_registered()

        body_str = body.decode("utf-8") if isinstance(body, bytes) else body

        # Verify signature
        sig = headers.get("X-Pingback-Signature") or headers.get("x-pingback-signature", "")
        ts = headers.get("X-Pingback-Timestamp") or headers.get("x-pingback-timestamp", "")
        try:
            verify_signature(sig, ts, body_str, self.cron_secret)
        except ValueError as e:
            return {"_status": 401, "error": f"unauthorized: {e}"}

        # Parse payload
        try:
            data = json.loads(body_str)
        except json.JSONDecodeError:
            return {"_status": 400, "error": "invalid payload"}

        func_name = data.get("function", "")
        fn_def = self._functions.get(func_name)
        if not fn_def:
            return {"_status": 404, "error": f'function "{func_name}" not found'}

        # Build context
        scheduled_at = datetime.fromisoformat(data.get("scheduledAt", "").replace("Z", "+00:00"))
        ctx = Context(
            execution_id=data.get("executionId", ""),
            attempt=data.get("attempt", 1),
            scheduled_at=scheduled_at,
            payload=data.get("payload"),
        )

        # Execute
        start = time.time()
        try:
            result = fn_def["handler"](ctx)
            duration_ms = int((time.time() - start) * 1000)
            return {
                "_status": 200,
                "status": "success",
                "result": result,
                "logs": ctx._logs,
                "tasks": ctx._tasks,
                "durationMs": duration_ms,
            }
        except Exception as e:
            duration_ms = int((time.time() - start) * 1000)
            return {
                "_status": 500,
                "status": "error",
                "error": str(e),
                "logs": ctx._logs,
                "tasks": ctx._tasks,
                "durationMs": duration_ms,
            }

    def flask_handler(self):
        """Return a Flask view function."""
        def handler():
            from flask import request, jsonify
            result = self.handle(request.data, dict(request.headers))
            status = result.pop("_status", 200)
            return jsonify(result), status
        return handler

    def fastapi_handler(self):
        """Return a FastAPI endpoint."""
        async def handler(request):
            from fastapi.responses import JSONResponse
            body = await request.body()
            result = self.handle(body, dict(request.headers))
            status = result.pop("_status", 200)
            return JSONResponse(result, status_code=status)
        return handler

    def trigger(self, task_name: str, payload=None) -> str:
        """Trigger a task programmatically. Returns execution_id."""
        data = json.dumps({"task": task_name, "payload": payload}).encode()
        url = f"{self.platform_url}/api/v1/trigger"

        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                return result["executionId"]
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            raise RuntimeError(f"Trigger failed ({e.code}): {body}")
```

- [ ] **Step 2: Write test_client.py**

```python
import json
import time
import unittest
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

from pingback import Pingback
from pingback.hmac import compute_hmac


def signed_headers(body: str, secret: str) -> dict:
    ts = str(int(time.time()))
    sig = compute_hmac(ts, body, secret)
    return {
        "X-Pingback-Signature": sig,
        "X-Pingback-Timestamp": ts,
        "Content-Type": "application/json",
    }


class TestDecorators(unittest.TestCase):
    def test_cron_registers_function(self):
        pb = Pingback("key", "secret")

        @pb.cron("cleanup", "0 3 * * *", retries=2)
        def cleanup(ctx):
            pass

        self.assertIn("cleanup", pb._functions)
        self.assertEqual(pb._functions["cleanup"]["type"], "cron")
        self.assertEqual(pb._functions["cleanup"]["schedule"], "0 3 * * *")
        self.assertEqual(pb._functions["cleanup"]["retries"], 2)

    def test_task_registers_function(self):
        pb = Pingback("key", "secret")

        @pb.task("send-email", timeout="15s")
        def send_email(ctx):
            pass

        self.assertIn("send-email", pb._functions)
        self.assertEqual(pb._functions["send-email"]["type"], "task")
        self.assertEqual(pb._functions["send-email"]["timeout"], "15s")


class TestHandle(unittest.TestCase):
    def _make_pb(self):
        pb = Pingback("key", "secret")
        pb._registered = True  # skip registration
        return pb

    def test_success(self):
        pb = self._make_pb()

        @pb.cron("cleanup", "0 3 * * *")
        def cleanup(ctx):
            ctx.log("cleaned up", count=42)
            return {"removed": 42}

        body = '{"function":"cleanup","executionId":"exec-1","attempt":1,"scheduledAt":"2026-04-22T03:00:00Z"}'
        headers = signed_headers(body, "secret")
        result = pb.handle(body.encode(), headers)

        self.assertEqual(result["_status"], 200)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["result"], {"removed": 42})
        self.assertEqual(len(result["logs"]), 1)
        self.assertEqual(result["logs"][0]["level"], "info")
        self.assertEqual(result["logs"][0]["meta"], {"count": 42})

    def test_unknown_function(self):
        pb = self._make_pb()
        body = '{"function":"nonexistent","executionId":"exec-1","attempt":1,"scheduledAt":"2026-04-22T03:00:00Z"}'
        headers = signed_headers(body, "secret")
        result = pb.handle(body.encode(), headers)

        self.assertEqual(result["_status"], 404)

    def test_invalid_signature(self):
        pb = self._make_pb()

        @pb.task("job")
        def job(ctx):
            pass

        body = '{"function":"job","executionId":"exec-1","attempt":1,"scheduledAt":"2026-04-22T03:00:00Z"}'
        headers = signed_headers(body, "wrong-secret")
        result = pb.handle(body.encode(), headers)

        self.assertEqual(result["_status"], 401)

    def test_handler_error(self):
        pb = self._make_pb()

        @pb.task("fail")
        def fail(ctx):
            raise RuntimeError("something broke")

        body = '{"function":"fail","executionId":"exec-1","attempt":1,"scheduledAt":"2026-04-22T03:00:00Z"}'
        headers = signed_headers(body, "secret")
        result = pb.handle(body.encode(), headers)

        self.assertEqual(result["_status"], 500)
        self.assertEqual(result["status"], "error")
        self.assertEqual(result["error"], "something broke")

    def test_fan_out(self):
        pb = self._make_pb()

        @pb.cron("parent", "* * * * *")
        def parent(ctx):
            ctx.task("child-a", {"id": "1"})
            ctx.task("child-b", {"id": "2"})

        body = '{"function":"parent","executionId":"exec-1","attempt":1,"scheduledAt":"2026-04-22T03:00:00Z"}'
        headers = signed_headers(body, "secret")
        result = pb.handle(body.encode(), headers)

        self.assertEqual(len(result["tasks"]), 2)
        self.assertEqual(result["tasks"][0]["name"], "child-a")

    def test_payload(self):
        pb = self._make_pb()

        @pb.task("echo")
        def echo(ctx):
            return ctx.payload

        body = '{"function":"echo","executionId":"exec-1","attempt":1,"scheduledAt":"2026-04-22T03:00:00Z","payload":{"msg":"hello"}}'
        headers = signed_headers(body, "secret")
        result = pb.handle(body.encode(), headers)

        self.assertEqual(result["result"], {"msg": "hello"})


class TestTrigger(unittest.TestCase):
    def test_trigger_success(self):
        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                assert body["task"] == "send-email"
                self.send_response(201)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"executionId": "exec-123", "task": "send-email"}).encode())

            def log_message(self, format, *args):
                pass

        server = HTTPServer(("127.0.0.1", 0), Handler)
        port = server.server_address[1]
        t = Thread(target=server.handle_request)
        t.start()

        pb = Pingback("test-key", "secret", platform_url=f"http://127.0.0.1:{port}")
        exec_id = pb.trigger("send-email", {"to": "a@b.com"})

        self.assertEqual(exec_id, "exec-123")
        t.join(timeout=2)
        server.server_close()

    def test_trigger_error(self):
        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                self.send_response(404)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(b'Task "nope" not found')

            def log_message(self, format, *args):
                pass

        server = HTTPServer(("127.0.0.1", 0), Handler)
        port = server.server_address[1]
        t = Thread(target=server.handle_request)
        t.start()

        pb = Pingback("test-key", "secret", platform_url=f"http://127.0.0.1:{port}")
        with self.assertRaises(RuntimeError):
            pb.trigger("nope")

        t.join(timeout=2)
        server.server_close()


class TestRegister(unittest.TestCase):
    def test_register_sends_correct_payload(self):
        received = {}

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                received["body"] = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                received["auth"] = self.headers["Authorization"]
                self.send_response(201)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"jobs": [{"name": "cleanup", "status": "active"}]}).encode())

            def log_message(self, format, *args):
                pass

        server = HTTPServer(("127.0.0.1", 0), Handler)
        port = server.server_address[1]
        t = Thread(target=server.handle_request)
        t.start()

        pb = Pingback("test-key", "secret", platform_url=f"http://127.0.0.1:{port}")

        @pb.cron("cleanup", "0 3 * * *", retries=2)
        def cleanup(ctx):
            pass

        @pb.task("send-email", timeout="15s")
        def send_email(ctx):
            pass

        # Trigger registration
        pb._ensure_registered()

        t.join(timeout=2)
        server.server_close()

        self.assertEqual(received["auth"], "Bearer test-key")
        self.assertEqual(len(received["body"]["functions"]), 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run all tests**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
python -m unittest discover tests -v
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add pingback/client.py tests/test_client.py
git commit -m "feat: add client, handler, trigger, and tests"
```

---

### Task 6: README

**Files:**
- Create: `pingback-py/README.md`

- [ ] **Step 1: Create README.md**

Content:

````markdown
# pingback-py

Python SDK for [Pingback](https://pingback.lol) — reliable cron jobs and background tasks.

## Installation

```bash
pip install pingback-py
```

## Quick Start

```python
import os
from pingback import Pingback

pb = Pingback(
    api_key=os.environ["PINGBACK_API_KEY"],
    cron_secret=os.environ["PINGBACK_CRON_SECRET"],
)

@pb.cron("cleanup", "0 3 * * *", retries=2, timeout="60s")
def cleanup(ctx):
    removed = remove_expired_sessions()
    ctx.log("Removed sessions", count=removed)
    return {"removed": removed}

@pb.task("send-email", retries=3, timeout="15s")
def send_email(ctx):
    to = ctx.payload["to"]
    deliver_email(to)
    ctx.log("Sent email", to=to)
    return {"sent": to}
```

## Framework Integration

### Flask

```python
from flask import Flask

app = Flask(__name__)
app.route("/api/pingback", methods=["POST"])(pb.flask_handler())
```

### FastAPI

```python
from fastapi import FastAPI

app = FastAPI()
app.post("/api/pingback")(pb.fastapi_handler())
```

### Django

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def pingback_handler(request):
    result = pb.handle(request.body, dict(request.headers))
    status = result.pop("_status", 200)
    return JsonResponse(result, status=status)
```

### Any Framework

```python
result = pb.handle(body=request_body_bytes, headers=request_headers_dict)
```

## Defining Functions

### Cron Jobs

```python
@pb.cron("daily-report", "0 9 * * *", retries=3, timeout="60s")
def daily_report(ctx):
    report = generate_report()
    ctx.log("Report generated", rows=report.row_count)
    return report
```

### Background Tasks

```python
@pb.task("process-upload", retries=2, timeout="5m")
def process_upload(ctx):
    file_id = ctx.payload["file_id"]
    result = process_file(file_id)
    ctx.log("Processed file", file_id=file_id)
    return result
```

### Fan-Out

```python
@pb.cron("send-emails", "*/15 * * * *")
def send_emails(ctx):
    pending = get_pending_emails()
    for email in pending:
        ctx.task("send-email", {"id": email.id})
    ctx.log("Dispatched emails", count=len(pending))
    return {"dispatched": len(pending)}
```

## Programmatic Triggering

```python
exec_id = pb.trigger("send-email", {"to": "user@example.com"})
```

## Structured Logging

```python
ctx.log("message")                         # info
ctx.log("message", key="value")            # info with metadata
ctx.warn("slow query", ms=2500)            # warning
ctx.error("failed", code="E001")           # error
ctx.debug("cache stats", hits=847)         # debug
```

## Configuration

```python
pb = Pingback(
    api_key="pb_live_...",
    cron_secret="...",
    platform_url="https://api.pingback.lol",  # default
    base_url="https://myapp.com",              # your app's public URL
)
```

### Function Options

```python
@pb.cron("job", "* * * * *", retries=3, timeout="30s", concurrency=5)
@pb.task("job", retries=3, timeout="30s", concurrency=5)
```

## Environment Variables

```
PINGBACK_API_KEY=pb_live_...        # From your Pingback project settings
PINGBACK_CRON_SECRET=...            # From your Pingback project settings
```

## How It Works

1. Define cron jobs and tasks with `@pb.cron()` and `@pb.task()` decorators
2. Mount the handler using your framework's routing
3. On the first request, the SDK registers your functions with the Pingback platform
4. The platform sends signed HTTP requests to your handler when jobs are due
5. The handler verifies the HMAC signature, executes the function, and returns results
6. Fan-out tasks are dispatched independently by the platform
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

### Task 7: Example app

**Files:**
- Create: `pingback-py/example/app.py`

- [ ] **Step 1: Create example/app.py**

```python
"""
Example Flask app using the Pingback Python SDK.

Usage:
    pip install flask
    PINGBACK_API_KEY=... PINGBACK_CRON_SECRET=... python app.py
"""

import json
import os
import time

from flask import Flask

from pingback import Pingback

app = Flask(__name__)

pb = Pingback(
    api_key=os.environ.get("PINGBACK_API_KEY", ""),
    cron_secret=os.environ.get("PINGBACK_CRON_SECRET", ""),
    base_url=os.environ.get("BASE_URL"),
)


@pb.cron("health-check", "* * * * *")
def health_check(ctx):
    ctx.log("Health check started")
    ctx.log("All systems operational", timestamp=int(time.time()))
    return {"status": "healthy"}


@pb.cron("daily-cleanup", "0 3 * * *", retries=2, timeout="60s")
def daily_cleanup(ctx):
    ctx.log("Starting cleanup")
    removed = 42  # simulate
    ctx.log("Cleanup complete", removed=removed)
    return {"removed": removed}


@pb.cron("send-emails", "*/15 * * * *")
def send_emails(ctx):
    emails = ["user1@example.com", "user2@example.com", "user3@example.com"]
    for email in emails:
        ctx.task("send-email", {"to": email})
    ctx.log("Dispatched emails", count=len(emails))
    return {"dispatched": len(emails)}


@pb.task("send-email", retries=3, timeout="15s")
def send_email(ctx):
    to = ctx.payload["to"]
    ctx.log("Sending email", to=to)
    time.sleep(0.1)  # simulate
    ctx.log("Email sent", to=to)
    return {"sent": to}


@pb.task("process-webhook", timeout="30s")
def process_webhook(ctx):
    ctx.log("Processing webhook", execution_id=ctx.execution_id)
    ctx.debug("Raw payload", payload=ctx.payload)
    return {"processed": True}


app.route("/api/pingback", methods=["POST"])(pb.flask_handler())


@app.route("/")
def index():
    return "Pingback Python Example"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting server on :{port}")
    app.run(host="0.0.0.0", port=port)
```

- [ ] **Step 2: Commit**

```bash
git add example/app.py
git commit -m "feat: add Flask example app"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/cirx/Desktop/projects/personal/pingback/pingback-py
python -m unittest discover tests -v
```

Expected: all tests pass.

- [ ] **Step 2: Verify imports work**

```bash
python -c "from pingback import Pingback, Context; print('Pingback SDK loaded')"
```

- [ ] **Step 3: Verify file structure**

```bash
ls -R pingback/ tests/ example/
```

Expected:
```
pingback/:
__init__.py  client.py  context.py  hmac.py  register.py

tests/:
test_client.py  test_hmac.py

example/:
app.py
```

- [ ] **Step 4: Final commit if any changes**

```bash
git status
```
