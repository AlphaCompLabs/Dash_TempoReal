import logging
import threading
from typing import Optional
import Aggregator
from util import friendly_proto

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