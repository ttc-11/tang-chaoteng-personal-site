from __future__ import annotations

import json
import os
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import error, request


WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/3a0296e4-3a1b-407b-8752-72b8ad1989f5"
ROOT = Path(__file__).resolve().parent


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_POST(self) -> None:
        if self.path != "/api/contact":
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload_bytes = self.rfile.read(content_length)
            payload = json.loads(payload_bytes.decode("utf-8"))
            contact_type = str(payload.get("contactType", "")).strip()
            contact_value = str(payload.get("contactValue", "")).strip()

            if not contact_type or not contact_value:
                self._send_json(
                    HTTPStatus.BAD_REQUEST,
                    {"ok": False, "message": "Missing contactType or contactValue"},
                )
                return

            message = "\n".join(
                [
                    "个人网站收到一条新的联系方式提交",
                    f"联系方式类型：{contact_type}",
                    f"联系方式内容：{contact_value}",
                ]
            )

            feishu_request = request.Request(
                WEBHOOK_URL,
                data=json.dumps(
                    {
                        "msg_type": "text",
                        "content": {"text": message},
                    }
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            with request.urlopen(feishu_request, timeout=10) as response:
                response_body = response.read().decode("utf-8")
                result = json.loads(response_body)

            if result.get("code") != 0 and result.get("StatusCode") != 0:
                self._send_json(
                    HTTPStatus.BAD_GATEWAY,
                    {"ok": False, "message": "Feishu webhook rejected request", "result": result},
                )
                return

            self._send_json(HTTPStatus.OK, {"ok": True})
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            self._send_json(
                HTTPStatus.BAD_GATEWAY,
                {"ok": False, "message": f"Webhook HTTP error {exc.code}", "detail": body},
            )
        except Exception as exc:  # noqa: BLE001
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "message": str(exc)},
            )

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    port = int(os.environ.get("PORT", "8000"))
    handler = partial(SiteHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Serving personal-site at http://127.0.0.1:{port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
