import os
import sys
import time
import signal
import logging
import threading
from cli import parse_args
from Logging import setup_logging
from util import validate_url
from util import anon_hasher
from Aggregator import Aggregator
from captura import Sniffer
from util import hostname
from util import now_ts
from emissao import emit_json

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
