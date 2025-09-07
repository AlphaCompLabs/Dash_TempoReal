import threading
import logging
import queue
import signal
from scapy.all import sniff, IP, TCP, UDP, ICMP  # type: ignore
from time import monotonic_ns
from .aggregator import SlidingAggregator
from .config import Settings

class CaptureService:
    def __init__(self, settings: Settings, aggregator: SlidingAggregator):
        self.settings = settings
        self.aggregator = aggregator
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._q: "queue.Queue[bytes]" = queue.Queue(maxsize=settings.max_queued_packets)
        self._log = logging.getLogger("capture")

    def _build_bpf(self) -> str:
        base = f"ip host {self.settings.server_ip}"
        if self.settings.bpf_extra:
            base = f"({base}) and ({self.settings.bpf_extra})"
        return base

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, name="capture-thread", daemon=True)
        self._thread.start()
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)

    def _handle_signal(self, *_):
        self._log.info("Recebido sinal, encerrando captura.")
        self.stop()

    def _run(self):
        bpf = self._build_bpf()
        self._log.info("Iniciando captura na iface=%s, bpf='%s'", self.settings.iface, bpf)
        try:
            sniff(
                iface=self.settings.iface,
                filter=bpf,
                prn=self._on_packet,
                store=False,
                promisc=self.settings.enable_promisc,
                stop_filter=lambda _: self._stop_event.is_set()
            )
        except PermissionError as e:
            self._log.error("Permissão insuficiente para capturar: %s", e, exc_info=True)
        except OSError as e:
            self._log.error("Erro de SO ao iniciar captura (iface/filtro): %s", e, exc_info=True)
        except Exception as e:
            self._log.error("Falha inesperada na captura: %s", e, exc_info=True)
        finally:
            self._log.info("Captura finalizada.")

    def _on_packet(self, pkt):
        try:
            if not pkt.haslayer(IP):
                return
            ip = pkt[IP]
            length = int(getattr(pkt, "wirelen", len(bytes(pkt))))  # wirelen em algumas plataformas
            server = str(self.settings.server_ip)
            src = ip.src
            dst = ip.dst
            direction = None
            client_ip = None

            if src == server and dst != server:
                direction = "out"
                client_ip = dst
            elif dst == server and src != server:
                direction = "in"
                client_ip = src
            else:
                # Tráfego que não é estritamente cliente<->server (ex: multicast local)
                return

            ip_proto = int(ip.proto)
            l4_sport, l4_dport = None, None
            if ip.haslayer(TCP):
                tcp = pkt[TCP]
                l4_sport, l4_dport = int(tcp.sport), int(tcp.dport)
            elif ip.haslayer(UDP):
                udp = pkt[UDP]
                l4_sport, l4_dport = int(udp.sport), int(udp.dport)
            elif ip.haslayer(ICMP):
                pass  # icmp não tem portas

            self.aggregator.add_packet(
                t_ns=monotonic_ns(),
                client_ip=client_ip,
                direction=direction,  # type: ignore
                ip_proto=ip_proto,
                l4_sport=l4_sport,
                l4_dport=l4_dport,
                length=length
            )
        except Exception as e:
            # Nunca deixar a captura morrer por um pacote malformado
            self._log.debug("Pacote ignorado por erro: %s", e, exc_info=True)
