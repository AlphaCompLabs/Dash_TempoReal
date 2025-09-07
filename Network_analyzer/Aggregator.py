import threading
from collections import defaultdict
from typing import Dict, Any, Optional, Callable
from util import now_ts

__VERSION__ = "2.0.0"

class Aggregator:
    def __init__(self, window_s: int = 5, max_clients: int = 0, anon: Optional[Callable[[str], str]] = None):
        now = now_ts()
        start = now - (now % window_s)
        self.window_s = window_s
        self.lock = threading.Lock()
        self.max_clients = max_clients
        self.anon = anon
        self._current = self._new_window(start)

    def _new_window(self, start: float) -> Dict[str, Any]:
        return {
            "start": start,
            "end": start + self.window_s,
            "clients": defaultdict(lambda: {
                "in": 0, "out": 0, "proto": defaultdict(lambda: {"in": 0, "out": 0})
            }),
            "pkt_count": 0,
            "byte_count": 0
        }

    def _maybe_roll(self, ts: float):
        while ts >= self._current["end"]:
            start_next = self._current["end"]
            self._current = self._new_window(start_next)

    def add(self, ts: float, client_ip: str, direction: str, nbytes: int, proto: str):
        with self.lock:
            self._maybe_roll(ts)
            ip_key = self.anon(client_ip) if self.anon else client_ip
            d = "in" if direction == "in" else "out"
            n = int(nbytes)
            c = self._current["clients"][ip_key]
            c[d] += n
            c["proto"][proto][d] += n
            self._current["pkt_count"] += 1
            self._current["byte_count"] += n

    def snapshot(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        with self.lock:
            # aplicar max_clients (top-K por tráfego total)
            clients_dict = self._current["clients"]
            if self.max_clients and len(clients_dict) > self.max_clients:
                items = []
                for ip, v in clients_dict.items():
                    total = int(v["in"]) + int(v["out"])
                    items.append((ip, total))
                items.sort(key=lambda x: x[1], reverse=True)
                keep = set(ip for ip, _ in items[:self.max_clients])
            else:
                keep = None

            clients_out = {}
            total_in = 0
            total_out = 0
            for ip, v in clients_dict.items():
                if keep is not None and ip not in keep:
                    continue
                in_b = int(v["in"]); out_b = int(v["out"])
                total_in += in_b; total_out += out_b
                clients_out[ip] = {
                    "in_bytes": in_b,
                    "out_bytes": out_b,
                    "protocols": {p: {"in": int(pv["in"]), "out": int(pv["out"])} for p, pv in v["proto"].items()}
                }

            payload = {
                "version": __VERSION__,
                "window_start": self._current["start"],
                "window_end": self._current["end"],
                "emitted_at": now_ts(),
                "host": meta.get("host"),
                "iface": meta.get("iface"),
                "server_ip": meta.get("server_ip"),
                "n_clients": len(clients_out),
                "total_in": total_in,
                "total_out": total_out,
                "pkt_count": self._current["pkt_count"],
                "byte_count": self._current["byte_count"],
                "clients": clients_out
            }
            return payload
