"""Bound request bodies sent to AI endpoints before JSON parsing."""

import json
from typing import Any, Awaitable, Callable, Dict


ASGIMessage = Dict[str, Any]
ASGIReceive = Callable[[], Awaitable[ASGIMessage]]
ASGISend = Callable[[ASGIMessage], Awaitable[None]]


class AIRequestBodyLimitMiddleware:
    """Reject oversized AI POST bodies, including requests without Content-Length."""

    def __init__(self, app, *, max_body_bytes: int, path_prefix: str) -> None:
        self.app = app
        self.max_body_bytes = max_body_bytes
        self.path_prefix = path_prefix

    async def __call__(self, scope, receive: ASGIReceive, send: ASGISend) -> None:
        if (
            scope.get("type") != "http"
            or scope.get("method") != "POST"
            or not scope.get("path", "").startswith(self.path_prefix)
        ):
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        content_length = headers.get(b"content-length")
        if content_length is not None:
            try:
                if int(content_length) > self.max_body_bytes:
                    await self._send_too_large(send)
                    return
            except ValueError:
                # Still enforce the limit while reading if the header is malformed.
                pass

        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            if message["type"] != "http.request":
                continue

            chunk = message.get("body", b"")
            if len(body) + len(chunk) > self.max_body_bytes:
                await self._send_too_large(send)
                return
            body.extend(chunk)
            if not message.get("more_body", False):
                break

        delivered = False

        async def replay_body() -> ASGIMessage:
            nonlocal delivered
            if delivered:
                return {"type": "http.disconnect"}
            delivered = True
            return {"type": "http.request", "body": bytes(body), "more_body": False}

        await self.app(scope, replay_body, send)

    async def _send_too_large(self, send: ASGISend) -> None:
        body = json.dumps(
            {"detail": f"AI request body must not exceed {self.max_body_bytes} bytes."}
        ).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": 413,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("ascii")),
                    (b"connection", b"close"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})
