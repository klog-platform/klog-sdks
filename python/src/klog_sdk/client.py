from __future__ import annotations

import json
import os
import random
import threading
import time
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Config:
    base_url: str
    tenant_id: str
    token: str
    application_id: str
    default_tags: list[str] = field(default_factory=list)
    default_level: str = "info"
    max_retries: int = 3
    timeout_s: float = 10.0
    max_queue_size: int = 1000
    max_concurrency: int = 4
    on_dropped: Callable[[str], None] | None = None
    on_overflow: Callable[[dict[str, Any]], None] | None = None
    on_error: Callable[[Exception], None] | None = None


@dataclass
class Entry:
    message: str
    level: str | None = None
    payload: Any = None
    tags: list[str] | None = None
    trace_id: str | None = None
    application_id: str | None = None


@dataclass
class Result:
    created: bool = False
    dropped: bool = False
    id: str = ""
    raw: dict[str, Any] | None = None


class HTTPError(Exception):
    def __init__(self, status: int, body: str, retryable: bool) -> None:
        super().__init__(f"klog ingest http {status}: {body}")
        self.status = status
        self.body = body
        self.retryable = retryable


class Client:
    """Envía eventos a POST /v1/ingest/{tenantId}/events."""

    def __init__(self, config: Config) -> None:
        base = config.base_url.rstrip("/")
        if not base or not config.tenant_id or not config.token or not config.application_id:
            raise ValueError("faltan base_url, tenant_id, token o application_id")
        self._cfg = config
        self._url = f"{base}/v1/ingest/{config.tenant_id}/events"
        self._lock = threading.Lock()
        self._queue: list[tuple[Entry, threading.Event, list[Any]]] = []
        self._active = 0
        self._closed = False

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None, **overrides: Any) -> Client:
        env = env if env is not None else os.environ
        cfg = Config(
            base_url=overrides.get("base_url") or env.get("KLOG_URL") or env.get("KLOG_API_URL") or "",
            tenant_id=overrides.get("tenant_id") or env.get("KLOG_TENANT_ID") or "",
            token=overrides.get("token") or env.get("KLOG_TOKEN") or "",
            application_id=overrides.get("application_id") or env.get("KLOG_APPLICATION_ID") or "",
            default_tags=overrides.get("default_tags", []),
            default_level=overrides.get("default_level", "info"),
            max_retries=overrides.get("max_retries", 3),
            timeout_s=overrides.get("timeout_s", 10.0),
            max_queue_size=overrides.get("max_queue_size", 1000),
            max_concurrency=overrides.get("max_concurrency", 4),
            on_dropped=overrides.get("on_dropped"),
            on_overflow=overrides.get("on_overflow"),
            on_error=overrides.get("on_error"),
        )
        return cls(cfg)

    def debug(self, message: str, payload: Any = None, **extra: Any) -> Result:
        return self.log(Entry(message=message, payload=payload, level="debug", **_extra(extra)))

    def info(self, message: str, payload: Any = None, **extra: Any) -> Result:
        return self.log(Entry(message=message, payload=payload, level="info", **_extra(extra)))

    def warn(self, message: str, payload: Any = None, **extra: Any) -> Result:
        return self.log(Entry(message=message, payload=payload, level="warn", **_extra(extra)))

    def error(self, message: str, payload: Any = None, **extra: Any) -> Result:
        return self.log(Entry(message=message, payload=payload, level="error", **_extra(extra)))

    def log(self, entry: Entry) -> Result:
        entry = self._normalize(entry)
        done = threading.Event()
        box: list[Any] = [None, None]
        with self._lock:
            if self._closed:
                raise RuntimeError("el cliente está cerrado")
            if len(self._queue) + self._active >= self._cfg.max_queue_size:
                if self._cfg.on_overflow:
                    self._cfg.on_overflow(self._to_dict(entry))
                raise RuntimeError("cola de ingesta llena")
            self._queue.append((entry, done, box))
            self._pump_locked()
        done.wait()
        if box[1] is not None:
            raise box[1]
        return box[0]

    def flush(self, timeout_s: float | None = None) -> None:
        deadline = None if timeout_s is None else time.monotonic() + timeout_s
        while True:
            with self._lock:
                idle = not self._queue and self._active == 0
            if idle:
                return
            if deadline is not None and time.monotonic() >= deadline:
                raise TimeoutError("flush timeout")
            time.sleep(0.01)

    def close(self) -> None:
        self.flush()
        with self._lock:
            self._closed = True

    def _normalize(self, entry: Entry) -> Entry:
        if not (entry.message or "").strip():
            entry.message = "(empty)"
        if not entry.level:
            entry.level = self._cfg.default_level
        if not entry.application_id:
            entry.application_id = self._cfg.application_id
        if entry.tags is None and self._cfg.default_tags:
            entry.tags = list(self._cfg.default_tags)
        if entry.payload is None:
            entry.payload = {}
        return entry

    def _to_dict(self, entry: Entry) -> dict[str, Any]:
        body: dict[str, Any] = {
            "message": entry.message,
            "level": entry.level,
            "applicationId": entry.application_id,
            "payload": entry.payload if entry.payload is not None else {},
        }
        if entry.tags:
            body["tags"] = entry.tags
        if entry.trace_id:
            body["traceId"] = entry.trace_id
        return body

    def _pump_locked(self) -> None:
        while self._active < self._cfg.max_concurrency and self._queue:
            item = self._queue.pop(0)
            self._active += 1
            threading.Thread(target=self._worker, args=item, daemon=True).start()

    def _worker(self, entry: Entry, done: threading.Event, box: list[Any]) -> None:
        try:
            box[0] = self._deliver(entry)
        except Exception as exc:  # noqa: BLE001 — se propaga al llamador
            box[1] = exc
            if self._cfg.on_error:
                self._cfg.on_error(exc)
        finally:
            done.set()
            with self._lock:
                self._active -= 1
                self._pump_locked()

    def _deliver(self, entry: Entry) -> Result:
        last: Exception | None = None
        for attempt in range(1, self._cfg.max_retries + 2):
            try:
                result = self._send_once(entry)
                if result.dropped and self._cfg.on_dropped:
                    self._cfg.on_dropped(result.id)
                return result
            except HTTPError as exc:
                last = exc
                if not exc.retryable:
                    break
            except (urllib.error.URLError, TimeoutError, OSError) as exc:
                last = exc
            if attempt > self._cfg.max_retries:
                break
            delay = min(3.2, 0.2 * (2 ** (attempt - 1))) + random.random() * 0.1
            time.sleep(delay)
        assert last is not None
        raise last

    def _send_once(self, entry: Entry) -> Result:
        data = json.dumps(self._to_dict(entry)).encode("utf-8")
        req = urllib.request.Request(
            self._url,
            data=data,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self._cfg.token}",
                "User-Agent": "klog-sdk-python/0.1",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self._cfg.timeout_s) as resp:
                raw = resp.read().decode("utf-8")
                status = resp.status
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            status = exc.code
            if status in (429, 502, 503, 504):
                raise HTTPError(status, raw, True) from exc
            if status in (400, 401, 403):
                raise HTTPError(status, raw, False) from exc
            raise HTTPError(status, raw, status >= 500) from exc

        parsed = json.loads(raw) if raw else {}
        if status == 201:
            return Result(created=True, id=str(parsed.get("id", "")), raw=parsed)
        if status == 202:
            return Result(dropped=True, id=str(parsed.get("id", "")), raw=parsed)
        raise HTTPError(status, raw, status >= 500)


def _extra(extra: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if "tags" in extra:
        out["tags"] = extra["tags"]
    if "trace_id" in extra:
        out["trace_id"] = extra["trace_id"]
    if "application_id" in extra:
        out["application_id"] = extra["application_id"]
    return out
