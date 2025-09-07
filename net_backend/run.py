#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Producer REAL v2: captura com Scapy (ou PCAP), agrega por janela e emite JSON (stdout, arquivo NDJSON ou POST).
Melhorias: logging, retry, NDJSON opcional, metadados, limites de memória, anonimização, testes via PCAP.
"""

import os
import sys
import time
import json
import hmac
import hashlib
import signal
import socket
import logging
import argparse
import threading
from collections import defaultdict
from typing import Dict, Any, Optional, Tuple, Callable
from urllib import request, error
from urllib.parse import urlparse

__VERSION__ = "2.0.0"

# ==================== CLI ====================

def parse_args():
    ap = argparse.ArgumentParser(
        description="Producer REAL v2: captura com Scapy, agrega por janela e entrega JSON (stdout/arquivo/POST)."
    )
    ap.add_argument("--server-ip", required=False,
                    help="IP do servidor observado (define direção in/out). Recomendado.")
    ap.add_argument("--iface", help="Interface (ex.: 'Ethernet', 'Wi-Fi', 'eth0').")
    ap.add_argument("--interval", type=float, default=5.0, help="Tamanho da janela/intervalo de emissão (s).")
    ap.add_argument("--post", help="URL para POST do JSON (ex.: http://localhost:8000/api/ingest).")
    ap.add_argument("--post-timeout", type=float, default=10.0, help="Timeout do POST (s).")
    ap.add_argument("--post-retries", type=int, default=2, help="Tentativas extras no POST (backoff exponencial).")
    ap.add_argument("--file", help="Salvar JSON em arquivo. Por padrão, sobrescreve a cada janela.")
    ap.add_argument("--file-append", action="store_true", help="Se setado, grava NDJSON (1 JSON por linha).")
    ap.add_argument("--mock", action="store_true", help="Injeta eventos fictícios (útil p/ teste).")
    ap.add_argument("--no-capture", action="store_true", help="Desliga captura (só mock/PCAP).")
    ap.add_argument("--bpf", help="Filtro BPF (ex.: 'host 192.168.1.11 and (tcp port 8080 or icmp)')")
    ap.add_argument("--pcap", help="Ler pacotes de um arquivo .pcap em vez de capturar (para testes).")
    ap.add_argument("--log-level", default="INFO", choices=["DEBUG","INFO","WARNING","ERROR","CRITICAL"],
                    help="Nível de log.")
    ap.add_argument("--log-file", help="Arquivo de log (opcional).")
    ap.add_argument("--max-clients", type=int, default=0,
                    help="Mantém apenas os N clientes com maior tráfego (0 = ilimitado).")
    ap.add_argument("--anon", action="store_true",
                    help="Anonimiza IPs (hash HMAC-SHA1). Usa chave de ANON_KEY envvar ou aleatória.")
    ap.add_argument("--anon-key", help="Chave para HMAC (se não setada, usa ANON_KEY do ambiente ou gera aleatória).")
    return ap.parse_args()


# ==================== Logging ====================

def setup_logging(level: str, log_file: Optional[str]) -> None:
    handlers = [logging.StreamHandler(sys.stderr)]
    if log_file:
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))
    logging.basicConfig(
        level=getattr(logging, level),
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=handlers
    )

# ==================== Util ====================

KNOWN_PORTS = {
    80: "HTTP", 443: "HTTPS", 53: "DNS",
    20: "FTP-DATA", 21: "FTP",
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

# ==================== Agregação ====================

class Aggregator:
    """
    Agrega bytes por IP e protocolo. Rola janelas com base no timestamp (ts) recebido.
    Mantém apenas uma janela "corrente".
    """
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

# ==================== Emissão ====================

def emit_json(payload: Dict[str, Any],
              to_file: Optional[str],
              post_url: Optional[str],
              post_timeout: float,
              post_retries: int,
              file_append: bool) -> int:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    # POST (com retries)
    if post_url:
        req = request.Request(post_url, data=data, headers={"Content-Type": "application/json"}, method="POST")
        attempt = 0
        backoff = 0.8
        while True:
            try:
                with request.urlopen(req, timeout=post_timeout) as resp:
                    body = resp.read().decode("utf-8", errors="ignore")
                    logging.debug("POST OK: %s", body.strip())
                    break
            except error.HTTPError as e:
                body = e.read().decode("utf-8", errors="ignore")
                logging.error("POST HTTP %s: %s", e.code, body.strip())
                return 1
            except Exception as e:
                if attempt >= post_retries:
                    logging.error("POST ERROR (tentativas esgotadas): %s", e)
                    return 1
                attempt += 1
                sleep_s = backoff * (2 ** (attempt - 1))
                logging.warning("POST falhou (%s). Tentando novamente em %.1fs (%d/%d)...",
                                e, sleep_s, attempt, post_retries)
                time.sleep(sleep_s)

    # Arquivo
    if to_file:
        try:
            mode = "ab" if file_append else "wb"
            with open(to_file, mode) as f:
                f.write(data)
                if file_append:
                    f.write(b"\n")
            if not post_url:
                logging.info("JSON %s em %s", "acrescentado" if file_append else "salvo", to_file)
        except Exception as e:
            logging.error("FILE ERROR: %s", e)
            return 1

    # STDOUT (se nada mais)
    if not post_url and not to_file:
        try:
            sys.stdout.buffer.write(data)
            sys.stdout.write("\n")
            sys.stdout.flush()
        except Exception as e:
            logging.error("STDOUT ERROR: %s", e)
            return 1

    return 0

# ==================== Captura ====================

class Sniffer:
    def __init__(self, aggr: Aggregator, server_ip: Optional[str], iface: Optional[str], bpf: Optional[str] = None,
                 pcap: Optional[str] = None):
        self.aggr = aggr
        self.server_ip = server_ip
        self.iface = iface
        self._bpf = bpf or (f"host {server_ip}" if server_ip else None)
        self._stop = threading.Event()
        self._thr: Optional[threading.Thread] = None
        self._pcap = pcap

    def start(self):
        try:
            from scapy.all import sniff, IP, TCP, UDP, ICMP, rdpcap  # noqa
        except Exception as e:
            logging.warning("Scapy/Npcap indisponível: %s. Captura desativada.", e)
            return

        def _cb(pkt):
            try:
                from scapy.all import IP, TCP, UDP, ICMP  # noqa
                ts = float(pkt.time)
                nbytes = len(bytes(pkt))
                ip = pkt.getlayer(IP)
                if not ip:
                    return
                src, dst = ip.src, ip.dst
                layer, sport, dport = "OTHER", None, None
                if pkt.haslayer(ICMP):
                    layer = "ICMP"
                elif pkt.haslayer(TCP):
                    layer = "TCP"; tcp = pkt.getlayer(TCP); sport, dport = int(tcp.sport), int(tcp.dport)
                elif pkt.haslayer(UDP):
                    layer = "UDP"; udp = pkt.getlayer(UDP); sport, dport = int(udp.sport), int(udp.dport)
                proto = friendly_proto(layer, sport, dport)

                # direção relativa ao server_ip (se fornecido)
                if self.server_ip:
                    if src == self.server_ip:
                        direction, client = "out", dst
                    elif dst == self.server_ip:
                        direction, client = "in", src
                    else:
                        return
                else:
                    direction, client = "out", dst

                self.aggr.add(ts, client_ip=client, direction=direction, nbytes=nbytes, proto=proto)
            except Exception as e:
                logging.debug("Callback erro: %s", e)

        def _run_live():
            from scapy.all import sniff
            try:
                sniff_kwargs = dict(prn=_cb, store=False, stop_filter=lambda p: self._stop.is_set())
                if self.iface:
                    sniff_kwargs["iface"] = self.iface
                if self._bpf:
                    sniff_kwargs["filter"] = self._bpf
                sniff(**sniff_kwargs)
            except Exception as e:
                logging.error("Falha na captura live: %s", e)

        def _run_pcap():
            from scapy.all import rdpcap
            try:
                pkts = rdpcap(self._pcap)
                for p in pkts:
                    if self._stop.is_set():
                        break
                    _cb(p)
            except Exception as e:
                logging.error("Falha ao ler PCAP: %s", e)

        if self.iface or self._bpf:
            logging.info("CAPTURE iface=%r bpf=%r pcap=%r", self.iface, self._bpf, self._pcap)

        target = _run_pcap if self._pcap else _run_live
        self._thr = threading.Thread(target=target, daemon=True)
        self._thr.start()

    def stop(self):
        self._stop.set()
        if self._thr and self._thr.is_alive():
            self._thr.join(timeout=2)

# ==================== Main ====================

def main():
    args = parse_args()
    setup_logging(args.log_level, args.log_file)

    if args.interval < 1.0:
        logging.warning("--interval muito baixo (%.2fs). Ajustando para 1s.", args.interval)
        args.interval = 1.0

    if args.post and not validate_url(args.post):
        logging.error("URL inválida para --post: %r", args.post)
        return 2

    if args.no_capture and not args.mock and not args.pcap:
        logging.warning("--no-capture ativo sem --mock ou --pcap. Não haverá dados a emitir.")

    # anon key
    anon_func = None
    if args.anon:
        key = (args.anon_key or os.environ.get("ANON_KEY") or os.urandom(32)).encode("utf-8", "ignore")
        anon_func = anon_hasher(key)

    window_s = int(args.interval)
    aggr = Aggregator(window_s=window_s, max_clients=max(0, args.max_clients), anon=anon_func)

    sniffer = None
    if not args.no_capture:
        sniffer = Sniffer(aggr, server_ip=args.server_ip, iface=args.iface, bpf=args.bpf, pcap=args.pcap)
        sniffer.start()

    stop = threading.Event()

    def _sig(_s, _f):
        stop.set()

    signal.signal(signal.SIGINT, _sig)
    signal.signal(signal.SIGTERM, _sig)

    meta = {
        "host": hostname(),
        "iface": args.iface,
        "server_ip": args.server_ip
    }

    try:
        while not stop.is_set():
            if args.mock:
                now = now_ts()
                aggr.add(now+1, "10.0.0.2", "in", 1500, "HTTP")
                aggr.add(now+2, "10.0.0.2", "out", 700, "HTTP")
                aggr.add(now+3, "10.0.0.3", "in", 400, "HTTPS")
                aggr.add(now+4, "10.0.0.4", "out", 250, "FTP")
                aggr.add(now+4.2, "10.0.0.3", "out", 180, "DNS")

            payload = aggr.snapshot(meta)
            rc = emit_json(
                payload,
                to_file=args.file,
                post_url=args.post,
                post_timeout=args.post_timeout,
                post_retries=max(0, args.post_retries),
                file_append=bool(args.file and args.file_append)
            )
            if rc != 0:
                # não aborta o processo inteiro por um erro de emissão; apenas loga.
                logging.warning("Falha na emissão da janela (rc=%d). Continuando.", rc)

            # espera até o início da próxima janela, alinhado
            time.sleep(window_s)
    finally:
        if sniffer:
            sniffer.stop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
