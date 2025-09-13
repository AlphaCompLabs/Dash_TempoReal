import time
import hmac
import hashlib
import socket
from typing import Optional, Callable
from urllib.parse import urlparse

KNOWN_PORTS = {
    80: "HTTP", 443: "HTTPS", 53: "DNS",
    20: "FTP-DATA", 21: "FTP", 2121: "FTP",
    123: "NTP", 25: "SMTP", 110: "POP3", 143: "IMAP",
    22: "SSH", 3306: "MySQL", 5432: "Postgres"
}

def friendly_proto(layer: str, sport: Optional[int], dport: Optional[int]) -> str:
    if layer == "ICMP":
        return "ICMP"
    if layer in ("TCP", "UDP"):
        # QUIC / HTTPS / DNS / NTP
        if sport == 443 or dport == 443:
            return "QUIC" if layer == "UDP" else "HTTPS"
        if sport == 53 or dport == 53:
            return "DNS"
        if sport == 123 or dport == 123:
            return "NTP"
        for p in (sport, dport):
            if p in KNOWN_PORTS:
                return KNOWN_PORTS[p]
        p = dport if dport else sport
        return f"{layer}:{p}" if p else layer
    return layer

def validate_url(u: str) -> bool:
    try:
        p = urlparse(u)
        return p.scheme in ("http", "https") and bool(p.netloc)
    except Exception:
        return False

def now_ts() -> float:
    return time.time()

def hostname() -> str:
    try:
        return socket.gethostname()
    except Exception:
        return "unknown-host"

def anon_hasher(key: bytes) -> Callable[[str], str]:
    def _h(s: str) -> str:
        return hmac.new(key, s.encode("utf-8"), hashlib.sha1).hexdigest()[:16]
    return _h