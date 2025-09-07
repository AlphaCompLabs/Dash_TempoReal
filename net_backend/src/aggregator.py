import threading
from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple
from .models import Direction, WindowSummary, ProtoBreakdown

PROTO_LABELS = {
    "TCP_20": "FTP-DATA",
    "TCP_21": "FTP",
    "TCP_80": "HTTP",
    "TCP_443": "HTTPS",
    "UDP_53": "DNS",
    "ICMP": "ICMP",
}

def classify_proto(ip_proto: int, l4_sport: int | None, l4_dport: int | None) -> str:
    if ip_proto == 1:
        return "ICMP"
    if ip_proto == 6:  # TCP
        if  l4_sport in (20, 21) or l4_dport in (20, 21):
            return "FTP" if 21 in (l4_sport, l4_dport) else "FTP-DATA"
        if 80 in (l4_sport, l4_dport):
            return "HTTP"
        if 443 in (l4_sport, l4_dport):
            return "HTTPS"
        return "Other-TCP"
    if ip_proto == 17:  # UDP
        if 53 in (l4_sport, l4_dport):
            return "DNS"
        return "Other-UDP"
    return "Other"

class SlidingAggregator:
    """
    Agrega bytes por janela (size = window_seconds), por cliente e direção,
    e mantém breakdown por protocolo.
    """
    def __init__(self, window_seconds: int = 5, max_windows: int = 3600):
        self.window_seconds = window_seconds
        self.max_windows = max_windows
        self._lock = threading.RLock()

        # Estruturas:
        # key: (window_start_ts, client_ip, direction) -> bytes
        self._bytes: Dict[Tuple[int, str, Direction], int] = defaultdict(int)
        # key: (window_start_ts, client_ip, direction, proto) -> bytes
        self._by_proto: Dict[Tuple[int, str, Direction, str], int] = defaultdict(int)
        # fila para ordem temporal de janelas (para expurgo)
        self._windows: deque[int] = deque()

    def _window_key(self, t_ns: int) -> int:
        # t_ns: epoch ns; converte para segundos e alinha à grade da janela
        t = t_ns // 1_000_000_000
        return (t // self.window_seconds) * self.window_seconds

    def add_packet(self, t_ns: int, client_ip: str, direction: Direction,
                   ip_proto: int, l4_sport: int | None, l4_dport: int | None, length: int) -> None:
        if length <= 0:
            return
        w = self._window_key(t_ns)
        proto = classify_proto(ip_proto, l4_sport, l4_dport)

        with self._lock:
            self._bytes[(w, client_ip, direction)] += length
            self._by_proto[(w, client_ip, direction, proto)] += length
            if (not self._windows) or self._windows[-1] != w:
                # Evita janelas duplicadas adjacentes
                if not self._windows or w > self._windows[-1]:
                    self._windows.append(w)
                    # Expurgo se excedeu máximo
                    while len(self._windows) > self.max_windows:
                        old = self._windows.popleft()
                        # remove entradas antigas
                        to_del = [k for k in self._bytes if k[0] == old]
                        for k in to_del:
                            del self._bytes[k]
                        to_del_p = [k for k in self._by_proto if k[0] == old]
                        for k in to_del_p:
                            del self._by_proto[k]

    def window_summary(self, w_start: int) -> WindowSummary | None:
        with self._lock:
            if w_start not in self._windows:
                return None
            w_end = w_start + self.window_seconds
            totals_by_client: Dict[str, Dict[Direction, int]] = defaultdict(lambda: {"in": 0, "out": 0})
            total_in = 0
            total_out = 0
            for (w, client, direction), b in self._bytes.items():
                if w != w_start:
                    continue
                totals_by_client[client][direction] += b
                if direction == "in":
                    total_in += b
                else:
                    total_out += b
            return WindowSummary(
                window_start=datetime.fromtimestamp(w_start, tz=timezone.utc),
                window_end=datetime.fromtimestamp(w_end, tz=timezone.utc),
                totals_by_client=totals_by_client,
                total_in=total_in,
                total_out=total_out
            )

    def last_n_summaries(self, n: int) -> list[WindowSummary]:
        with self._lock:
            out = []
            for w in list(self._windows)[-n:]:
                s = self.window_summary(w)
                if s:
                    out.append(s)
            return out

    def client_proto_breakdown(self, w_start: int, client_ip: str, direction: Direction) -> ProtoBreakdown:
        with self._lock:
            pb: Dict[str, int] = defaultdict(int)
            for (w, c, d, proto), b in self._by_proto.items():
                if w == w_start and c == client_ip and d == direction:
                    pb[proto] += b
            return ProtoBreakdown(by_proto=dict(pb))