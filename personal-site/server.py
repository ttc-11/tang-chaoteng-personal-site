from __future__ import annotations

import json
import os
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import urllib.error
import urllib.request
from http import HTTPStatus
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", "8765"))
FEISHU_WEBHOOK_URL = os.environ.get(
    "FEISHU_WEBHOOK_URL",
    "https://open.feishu.cn/open-apis/bot/v2/hook/3a0296e4-3a1b-407b-8752-72b8ad1989f5",
)


def get_local_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_POST(self) -> None:
        if self.path != "/api/message":
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"ok": False, "error": "Invalid JSON"}, HTTPStatus.BAD_REQUEST)
            return

        required_fields = ["company", "name", "role", "contact", "message"]
        missing = [field for field in required_fields if not str(payload.get(field, "")).strip()]
        if missing:
            self._send_json(
                {"ok": False, "error": f"Missing fields: {', '.join(missing)}"},
                HTTPStatus.BAD_REQUEST,
            )
            return

        text = "\n".join(
            [
                "收到新的企业留言",
                f"公司名称：{payload['company']}",
                f"联系人：{payload['name']}",
                f"岗位 / 合作方向：{payload['role']}",
                f"联系方式：{payload['contact']}",
                f"留言内容：{payload['message']}",
            ]
        )

        request = urllib.request.Request(
            FEISHU_WEBHOOK_URL,
            data=json.dumps(
                {
                    "msg_type": "text",
                    "content": {"text": text},
                }
            ).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=12) as response:
                response_body = response.read().decode("utf-8", errors="ignore")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            self._send_json(
                {"ok": False, "error": f"Feishu returned HTTP {exc.code}", "detail": body},
                HTTPStatus.BAD_GATEWAY,
            )
            return
        except urllib.error.URLError as exc:
            self._send_json(
                {"ok": False, "error": f"Network error: {exc.reason}"},
                HTTPStatus.BAD_GATEWAY,
            )
            return

        self._send_json({"ok": True, "detail": response_body}, HTTPStatus.OK)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def _send_json(self, payload: dict, status: HTTPStatus) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(data)
        self.wfile.flush()


if __name__ == "__main__":
    class ReusableThreadingHTTPServer(ThreadingHTTPServer):
        allow_reuse_address = True

    with ReusableThreadingHTTPServer((HOST, PORT), SiteHandler) as httpd:
        local_ip = get_local_ip()
        print(f"Serving on http://127.0.0.1:{PORT}")
        print(f"LAN access on http://{local_ip}:{PORT}")
        httpd.serve_forever()
