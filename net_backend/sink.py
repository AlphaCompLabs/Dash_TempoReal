#!/usr/bin/env python3
import json
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict, Optional

LAST_PAYLOAD: Optional[Dict[str, Any]] = None  # guarda o último JSON válido

class IngestHandler(BaseHTTPRequestHandler):
    ingest_path = "/api/ingest"
    current_path = "/api/current"
    save_file: Optional[str] = None
    quiet: bool = False

    def _send_json(self, code: int, obj: Dict[str, Any]):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != self.ingest_path:
            self._send_json(404, {"ok": False, "error": "not found"})
            return

        n = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(n)
        try:
            payload = json.loads(raw.decode("utf-8", "ignore"))
        except json.JSONDecodeError as e:
            self._send_json(400, {"ok": False, "error": f"invalid json: {e}"})
            return

        # resumo
        clients = payload.get("clients", {}) or {}
        total_in = sum(int(c.get("in_bytes", 0) or 0) for c in clients.values())
        total_out = sum(int(c.get("out_bytes", 0) or 0) for c in clients.values())
        summary = {"ok": True, "n_clients": len(clients), "total_in": total_in, "total_out": total_out}

        # guarda e imprime
        global LAST_PAYLOAD
        LAST_PAYLOAD = payload

        if not self.quiet:
            print("\n=== JSON recebido ===\n", json.dumps(payload, ensure_ascii=False))

        # opcional: salvar em arquivo
        if self.save_file:
            try:
                with open(self.save_file, "wb") as f:
                    f.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                summary["file_error"] = str(e)

        self._send_json(200, summary)

    def do_GET(self):
        if self.path != self.current_path:
            self._send_json(404, {"ok": False, "error": "not found"})
            return
        self._send_json(200, LAST_PAYLOAD or {"window_start": 0, "window_end": 0, "clients": {}})

    # reduz verbosidade do log
    def log_message(self, format, *args):
        if not self.quiet:
            super().log_message(format, *args)

def main():
    ap = argparse.ArgumentParser(description="Sink HTTP simples para ingestão do JSON de tráfego.")
    ap.add_argument("--port", type=int, default=8000, help="Porta para escutar (padrão: 8000).")
    ap.add_argument("--ingest-path", default="/api/ingest", help="Caminho do POST de ingestão.")
    ap.add_argument("--current-path", default="/api/current", help="Caminho do GET do último payload.")
    ap.add_argument("--save", dest="save_file", help="Salvar último payload em arquivo (opcional).")
    ap.add_argument("--quiet", action="store_true", help="Menos logs no console.")
    args = ap.parse_args()

    IngestHandler.ingest_path = args.ingest_path
    IngestHandler.current_path = args.current_path
    IngestHandler.save_file = args.save_file
    IngestHandler.quiet = args.quiet

    srv = HTTPServer(("0.0.0.0", args.port), IngestHandler)
    print(f"Sink ouvindo em http://localhost:{args.port}{args.ingest_path}  (GET {args.current_path})")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()

if __name__ == "__main__":
    main()
