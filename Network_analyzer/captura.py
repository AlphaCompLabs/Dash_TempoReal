# Importa as bibliotecas necessárias.
import logging  # Para registrar mensagens de informação, aviso e erro.
import threading  # Para rodar a captura de pacotes em uma thread separada, sem bloquear o programa principal.
from typing import Optional

# Importa as classes do outro arquivo.
import Aggregator  # A classe que agrega os dados que este Sniffer vai capturar.
from util import friendly_proto  # Uma função auxiliar para criar um nome de protocolo amigável (ex: "HTTP_80").

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
        # Se o Scapy não estiver instalado, o programa pode continuar funcionando sem a captura de pacotes.
        try:
            from scapy.all import sniff, IP, TCP, UDP, ICMP, rdpcap  # noqa (ignora avisos do linter)
        except Exception as e:
            logging.warning("Scapy/Npcap indisponível: %s. Captura desativada.", e)
            return

        # --- Define a função de callback, que será executada para cada pacote capturado ---
        def _cb(pkt):
            try:
                # Reimporta para garantir o escopo, embora não seja estritamente necessário.
                from scapy.all import IP, TCP, UDP, ICMP  # noqa
                
                # Extrai informações básicas do pacote.
                ts = float(pkt.time)  # Timestamp do pacote.
                nbytes = len(bytes(pkt))  # Tamanho total do pacote em bytes.
                
                ip = pkt.getlayer(IP)
                if not ip:  # Se não for um pacote IP, ignora.
                    return
                
                src, dst = ip.src, ip.dst # IP de origem e destino.

                # Tenta identificar o protocolo da camada de transporte (TCP, UDP, ICMP).
                layer, sport, dport = "OTHER", None, None # Padrão para protocolos não identificados.
                if pkt.haslayer(ICMP):
                    layer = "ICMP"
                elif pkt.haslayer(TCP):
                    layer = "TCP"; tcp = pkt.getlayer(TCP); sport, dport = int(tcp.sport), int(tcp.dport)
                elif pkt.haslayer(UDP):
                    layer = "UDP"; udp = pkt.getlayer(UDP); sport, dport = int(udp.sport), int(udp.dport)
                
                # Usa a função auxiliar para formatar o nome do protocolo (ex: "TCP_443" -> "HTTPS").
                proto = friendly_proto(layer, sport, dport)

                # --- Determina a direção do tráfego em relação ao servidor ---
                if self.server_ip:
                    if src == self.server_ip:
                        direction, client = "out", dst  # Se a origem é o servidor, é tráfego de SAÍDA.
                    elif dst == self.server_ip:
                        direction, client = "in", src   # Se o destino é o servidor, é tráfego de ENTRADA.
                    else:
                        return # Pacote não envolve o servidor, ignora.
                else:
                    # Se não há um IP de servidor, assume que todo tráfego é de saída.
                    direction, client = "out", dst

                # Adiciona os dados processados ao agregador.
                self.aggr.add(ts, client_ip=client, direction=direction, nbytes=nbytes, proto=proto)
            except Exception as e:
                # Captura qualquer erro no processamento do pacote para não travar a captura.
                logging.debug("Callback erro: %s", e)

        # --- Define as funções que serão executadas pela thread ---
        def _run_live():
            """Função alvo para a captura ao vivo."""
            from scapy.all import sniff
            try:
                # Monta os argumentos para a função sniff do Scapy.
                sniff_kwargs = dict(prn=_cb, store=False, stop_filter=lambda p: self._stop.is_set())
                if self.iface:
                    sniff_kwargs["iface"] = self.iface
                if self._bpf:
                    sniff_kwargs["filter"] = self._bpf
                
                # Inicia a captura. Ela continuará até stop_filter retornar True.
                sniff(**sniff_kwargs)
            except Exception as e:
                logging.error("Falha na captura live: %s", e)

        def _run_pcap():
            """Função alvo para a leitura de um arquivo pcap."""
            from scapy.all import rdpcap
            try:
                pkts = rdpcap(self._pcap) # Lê todos os pacotes do arquivo.
                for p in pkts:
                    if self._stop.is_set(): # Verifica se a parada foi solicitada.
                        break
                    _cb(p) # Processa cada pacote.
            except Exception as e:
                logging.error("Falha ao ler PCAP: %s", e)
        
        # Loga a configuração da captura.
        if self.iface or self._bpf:
            logging.info("CAPTURE iface=%r bpf=%r pcap=%r", self.iface, self._bpf, self._pcap)

        # Escolhe qual função a thread vai executar: ler do pcap ou capturar ao vivo.
        target = _run_pcap if self._pcap else _run_live
        
        # Cria e inicia a thread. `daemon=True` significa que a thread não impedirá o programa de fechar.
        self._thr = threading.Thread(target=target, daemon=True)
        self._thr.start()

    def stop(self):
        """
        Sinaliza para a thread de captura parar e aguarda sua finalização.
        """
        # Ativa o evento de parada. A função em execução na thread (sniff ou o loop do pcap) verá isso e irá parar.
        self._stop.set()
        
        # Se a thread existe e está ativa, aguarda até 2 segundos para ela terminar.
        if self._thr and self._thr.is_alive():
            self._thr.join(timeout=2)