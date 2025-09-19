# =====================================================================================
# CAPTURA DE PACOTES - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.3.1
#
# Autor: Equipe Redes - Mayron Malaquias e Pedro Borges
# Descrição: Este script contém a classe Sniffer, que utiliza a biblioteca Scapy
#            para capturar pacotes de rede e enviar os dados para a classe
#            Aggregator para processamento.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

# Importações de bibliotecas padrão do Python
import logging
import threading
from typing import Optional

# Importa módulos auxiliares do projeto
import Aggregator
from util import friendly_proto

# --- SEÇÃO 1: CLASSE SNIFFER (MOTOR DE CAPTURA) ---

class Sniffer:
    """
    Uma classe que encapsula a lógica de captura de pacotes de rede usando Scapy.
    Ela pode operar em modo "live" (capturando de uma interface de rede) ou
    lendo pacotes de um arquivo .pcap.
    Os dados capturados são enviados para uma instância de Aggregator.
    """

    def __init__(self, aggr: Aggregator, server_ip: Optional[str], iface: Optional[str], bpf: Optional[str] = None,
                 pcap: Optional[str] = None):
        """
        Inicializa o Sniffer.

        :param aggr: A instância do Aggregator onde os dados serão armazenados.
        :param server_ip: O IP do servidor local, usado para determinar a direção do tráfego ("in" ou "out").
        :param iface: A interface de rede a ser usada para a captura (ex: "eth0").
        :param bpf: Um filtro BPF (Berkeley Packet Filter) para capturar apenas pacotes específicos.
        :param pcap: O caminho para um arquivo .pcap para ler pacotes em vez de capturar ao vivo.
        """
        self.aggr = aggr
        self.server_ip = server_ip
        self.iface = iface
        self._pcap = pcap
        
        # Se um filtro BPF não for fornecido, cria um padrão que captura todo o tráfego de/para o server_ip.
        self._bpf = bpf or (f"host {server_ip}" if server_ip else None)
        
        # Cria um "evento" de parada. É um sinalizador seguro para threads que será usado para parar a captura.
        self._stop = threading.Event()
        self._thr: Optional[threading.Thread] = None  # Variável para armazenar a thread de captura.

    def start(self):
        """
        Inicia o processo de captura de pacotes em uma thread de background.
        """
        # A importação do Scapy é feita aqui dentro para que ele seja uma dependência opcional.
        try:
            from scapy.all import sniff, IP, TCP, UDP, ICMP, rdpcap  # noqa (ignora avisos do linter)
        except Exception as e:
            logging.warning("Scapy/Npcap indisponível: %s. Captura desativada.", e)
            return

        # --- Define a função de callback, que será executada para cada pacote capturado ---
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

                # --- Determina a direção do tráfego em relação ao servidor ---
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

        # --- Define as funções que serão executadas pela thread ---
        def _run_live():
            """Função alvo para a captura ao vivo."""
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
            """Função alvo para a leitura de um arquivo pcap."""
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
        """
        Sinaliza para a thread de captura parar e aguarda sua finalização.
        """
        self._stop.set()
        
        if self._thr and self._thr.is_alive():
            self._thr.join(timeout=2)
