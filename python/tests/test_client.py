from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

from klog_sdk import Client, Config, HTTPError


class _Handler(BaseHTTPRequestHandler):
    responses: list[tuple[int, bytes]] = []
    calls = 0
    last_body: dict | None = None
    last_auth: str | None = None

    def do_POST(self) -> None:  # noqa: N802
        type(self).calls += 1
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        type(self).last_body = json.loads(raw.decode("utf-8"))
        type(self).last_auth = self.headers.get("Authorization")
        status, body = self.responses.pop(0) if self.responses else (201, b'{"id":"e1"}')
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


@pytest.fixture()
def server():
    _Handler.responses = []
    _Handler.calls = 0
    _Handler.last_body = None
    httpd = HTTPServer(("127.0.0.1", 0), _Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield httpd
    httpd.shutdown()


def _client(httpd: HTTPServer, **kwargs) -> Client:
    host, port = httpd.server_address
    return Client(
        Config(
            base_url=f"http://{host}:{port}",
            tenant_id="tenant",
            token="klog_test",
            application_id="app",
            max_retries=kwargs.pop("max_retries", 0),
            **kwargs,
        )
    )


def test_info_creates(server):
    _Handler.responses = [(201, b'{"id":"evt-1"}')]
    client = _client(server)
    result = client.info("hola", {"n": 1})
    assert result.created and result.id == "evt-1"
    assert _Handler.last_auth == "Bearer klog_test"
    assert _Handler.last_body["message"] == "hola"
    assert _Handler.last_body["applicationId"] == "app"


def test_dropped(server):
    dropped: list[str] = []
    _Handler.responses = [(202, b'{"dropped":true,"id":"evt-2"}')]
    client = _client(server, on_dropped=dropped.append)
    result = client.warn("filtrado")
    assert result.dropped and dropped == ["evt-2"]


def test_no_retry_on_401(server):
    _Handler.responses = [(401, b'{"error":"unauthorized"}'), (201, b'{"id":"x"}')]
    client = _client(server, max_retries=3)
    with pytest.raises(HTTPError):
        client.error("x")
    assert _Handler.calls == 1
