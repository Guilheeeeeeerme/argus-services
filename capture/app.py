"""Minimal independently runnable ingestion service shell.

The deployed implementation will consume the argus-libs ingestion contract;
this skeleton exposes an operational health endpoint without importing Core.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - required stdlib handler name
        if self.path != "/health":
            self.send_error(404)
            return
        payload = json.dumps({"service": "ingestion", "status": "ok"}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: object) -> None:
        return


ThreadingHTTPServer(("0.0.0.0", int(os.environ["PORT"])), Handler).serve_forever()
