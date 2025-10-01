# =====================================================================================
# MÓDULO SNIFFER DE PACOTES DE REDE
# Versão: 1.1.0 (Refatorado para maior clareza e separação de responsabilidades)
#
# Autor: Equipe de Análise de Rede
# Descrição: Este módulo fornece a classe `Sniffer`, um wrapper em torno do Scapy
#            para capturar pacotes de rede ao vivo ou de um arquivo PCAP.
#            A captura é executada em uma thread separada para não bloquear
#            a aplicação principal e os dados são enviados a um Aggregator.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---

# Importações da biblioteca padrão
import logging
import threading
from typing import Optional, Any

# Importações da aplicação local
from Aggregator import Aggregator
from util import friendly_proto

# --- SEÇÃO 1: DEFINIÇÃO DA CLASSE PRINCIPAL ---
class Sniffer:
    """
    Encapsula a lógica de captura de pacotes de rede usando Scapy.

    Opera em modo "live" (capturando de uma interface) ou "offline" (lendo de
    um arquivo .pcap) e envia os dados capturados para uma instância de Aggregator.
    """

    def __init__(self, aggr: Aggregator, server_ip: Optional[str], iface: Optional[str],
                 bpf: Optional[str] = None, pcap: Optional[str] = None):
        """
        Inicializa o Sniffer.

        :param aggr: A instância do Aggregator onde os dados serão armazenados.
        :param server_ip: O IP do servidor local para determinar a direção do tráfego.
        :param iface: A interface de rede para a captura (ex: "eth0").
        :param bpf: Um filtro BPF (Berkeley Packet Filter) para a captura.
        :param pcap: O caminho para um arquivo .pcap para leitura de pacotes.
        """
        self.aggr = aggr
        self.server_ip = server_ip
        self.iface = iface
        self._pcap = pcap
        self._bpf = bpf or (f"host {server_ip}" if server_ip else None)

        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._scapy: Optional[Any] = self._lazy_import_scapy()

    # --- MÉTODOS PÚBLICOS (CICLO DE VIDA) ---

    def start(self):
        """Inicia o processo de captura de pacotes em uma thread de background."""
        if not self._scapy:
            logging.warning("Scapy/Npcap indisponível. A captura de pacotes está desativada.")
            return

        logging.info("Iniciando captura: iface=%r bpf=%r pcap=%r", self.iface, self._bpf, self._pcap)

        # Escolhe qual método a thread vai executar: ler do pcap ou capturar ao vivo.
        target_func = self._run_pcap_read if self._pcap else self._run_live_capture

        # `daemon=True` garante que a thread não impedirá o programa de finalizar.
        self._thread = threading.Thread(target=target_func, daemon=True)
        self._thread.start()

    def stop(self):
        """Sinaliza para a thread de captura parar e aguarda sua finalização."""
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2)
            logging.info("Captura de pacotes finalizada.")

    # --- MÉTODOS PRIVADOS (LÓGICA INTERNA) ---

    def _lazy_import_scapy(self) -> Optional[Any]:
        """Tenta importar o Scapy. Permite que o programa funcione mesmo sem ele."""
        try:
            from scapy import all as scapy_all
            return scapy_all
        except ImportError as e:
            logging.debug("Falha ao importar Scapy: %s", e)
            return None

    def _packet_callback(self, pkt: Any):
        """
        Processa cada pacote capturado pelo Scapy.

        Este método é chamado para cada pacote e é responsável por extrair,
        processar e enviar os dados para o Aggregator.
        """
        try:
            if not self._scapy: return

            ts, nbytes = float(pkt.time), len(bytes(pkt))
            ip_layer = pkt.getlayer(self._scapy.IP)

            if not ip_layer:
                return

            src, dst = ip_layer.src, ip_layer.dst
            layer, sport, dport = "OTHER", None, None

            if pkt.haslayer(self._scapy.TCP):
                layer = "TCP"
                tcp = pkt.getlayer(self._scapy.TCP)
                sport, dport = int(tcp.sport), int(tcp.dport)
            elif pkt.haslayer(self._scapy.UDP):
                layer = "UDP"
                udp = pkt.getlayer(self._scapy.UDP)
                sport, dport = int(udp.sport), int(udp.dport)
            elif pkt.haslayer(self._scapy.ICMP):
                layer = "ICMP"

            proto = friendly_proto(layer, sport, dport)

            # Determina a direção do tráfego e o IP do cliente.
            if self.server_ip:
                if src == self.server_ip:
                    direction, client_ip = "out", dst
                elif dst == self.server_ip:
                    direction, client_ip = "in", src
                else:
                    return  # Pacote não relacionado ao servidor.
            else:
                direction, client_ip = "out", dst # Assume saída se não houver IP de servidor.

            self.aggr.add(ts, client_ip=client_ip, direction=direction, nbytes=nbytes, proto=proto)

        except Exception as e:
            logging.debug("Erro no callback do pacote: %s", e)

    def _run_live_capture(self):
        """Função alvo da thread para captura de pacotes ao vivo."""
        if not self._scapy: return
        try:
            sniff_kwargs = {
                "prn": self._packet_callback,
                "store": False,
                "stop_filter": lambda p: self._stop_event.is_set()
            }
            if self.iface:
                sniff_kwargs["iface"] = self.iface
            if self._bpf:
                sniff_kwargs["filter"] = self._bpf

            self._scapy.sniff(**sniff_kwargs)
        except Exception as e:
            logging.error("Falha crítica na thread de captura ao vivo: %s", e)

    def _run_pcap_read(self):
        """Função alvo da thread para leitura de pacotes de um arquivo .pcap."""
        if not self._scapy or not self._pcap: return
        try:
            for packet in self._scapy.rdpcap(self._pcap):
                if self._stop_event.is_set():
                    break
                self._packet_callback(packet)
        except Exception as e:
            logging.error("Falha ao ler o arquivo PCAP '%s': %s", self._pcap, e)