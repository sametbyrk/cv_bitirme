import asyncio
import unittest

from app.middleware.ai_request_size import AIRequestBodyLimitMiddleware


class AIRequestBodyLimitTests(unittest.TestCase):
    def _invoke(self, chunks, *, content_length=None, limit=8):
        messages = [
            {"type": "http.request", "body": chunk, "more_body": index < len(chunks) - 1}
            for index, chunk in enumerate(chunks)
        ]
        read_index = 0
        app_called = False
        forwarded_body = bytearray()
        sent = []

        async def receive():
            nonlocal read_index
            message = messages[read_index]
            read_index += 1
            return message

        async def send(message):
            sent.append(message)

        async def app(scope, app_receive, app_send):
            nonlocal app_called
            app_called = True
            message = await app_receive()
            forwarded_body.extend(message.get("body", b""))
            await app_send({"type": "http.response.start", "status": 200, "headers": []})
            await app_send({"type": "http.response.body", "body": b"ok"})

        headers = []
        if content_length is not None:
            headers.append((b"content-length", str(content_length).encode("ascii")))
        middleware = AIRequestBodyLimitMiddleware(app, max_body_bytes=limit, path_prefix="/api/v1/ai/")
        scope = {"type": "http", "method": "POST", "path": "/api/v1/ai/tailor", "headers": headers}
        asyncio.run(middleware(scope, receive, send))
        return app_called, bytes(forwarded_body), sent

    def test_body_at_limit_is_forwarded(self):
        called, body, sent = self._invoke([b"1234", b"5678"], content_length=8)
        self.assertTrue(called)
        self.assertEqual(body, b"12345678")
        self.assertEqual(sent[0]["status"], 200)

    def test_content_length_above_limit_is_rejected_before_body_read(self):
        called, _, sent = self._invoke([b"123456789"], content_length=9)
        self.assertFalse(called)
        self.assertEqual(sent[0]["status"], 413)

    def test_chunked_body_above_limit_is_rejected(self):
        called, _, sent = self._invoke([b"1234", b"56789"])
        self.assertFalse(called)
        self.assertEqual(sent[0]["status"], 413)


if __name__ == "__main__":
    unittest.main()
