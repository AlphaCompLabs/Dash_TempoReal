# =====================================================================================
# CAPTURA E PROCESSAMENTO - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.3.1
#
# Autor: Equipe Backend - Mayron Malaquias e Pedro Borges
# Descrição: Este script orquestra a captura de pacotes de rede e o envio de
#            dados agregados para um servidor backend, permitindo a visualização
#            em tempo real de métricas de tráfego.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

# Importações de bibliotecas padrão do Python
import os
import sys
import time
import signal
import logging
import threading

# Importa as classes e funções dos módulos auxiliares do projeto
from cli import parse_args
from Logging import setup_logging
from util import validate_url, anon_hasher, hostname, now_ts
from Aggregator import Aggregator
from captura import Sniffer
from emissao import emit_json


def main():
    """
    Função principal que orquestra a execução do programa.
    """
    # 1. INICIALIZAÇÃO E CONFIGURAÇÃO
    # ----------------------------------------------------------------

    # Processa os argumentos da linha de comando (ex: --iface, --post, etc.).
    args = parse_args()
    # Configura o sistema de logging com base nos argumentos.
    setup_logging(args.log_level, args.log_file)

    # --- Validação dos Argumentos ---
    if args.interval < 1.0:
        logging.warning("--interval muito baixo (%.2fs). Ajustando para 1s.", args.interval)
        args.interval = 1.0

    if args.post and not validate_url(args.post):
        logging.error("URL inválida para --post: %r", args.post)
        return 2

    if args.no_capture and not args.mock and not args.pcap:
        logging.warning("--no-capture ativo sem --mock ou --pcap. Não haverá dados a emitir.")

    # --- Configuração da Anonimização ---
    anon_func = None
    if args.anon:
        key = (args.anon_key or os.environ.get("ANON_KEY") or os.urandom(32)).encode("utf-8", "ignore")
        anon_func = anon_hasher(key)

    # 2. CRIAÇÃO DOS OBJETOS PRINCIPAIS
    # ----------------------------------------------------------------

    window_s = int(args.interval)
    # Instancia o agregador com as configurações definidas.
    aggr = Aggregator(window_s=window_s, max_clients=max(0, args.max_clients), anon=anon_func)

    # Instancia e inicia o sniffer (capturador de pacotes) se a captura não estiver desativada.
    sniffer = None
    if not args.no_capture:
        sniffer = Sniffer(aggr, server_ip=args.server_ip, iface=args.iface, bpf=args.bpf, pcap=args.pcap)
        sniffer.start()

    # 3. CONFIGURAÇÃO DE ENCERRAMENTO SEGURO (GRACEFUL SHUTDOWN)
    # ----------------------------------------------------------------

    stop = threading.Event()

    def _sig(_s, _f):
        logging.info("Sinal de parada recebido. Encerrando...")
        stop.set()

    signal.signal(signal.SIGINT, _sig)
    signal.signal(signal.SIGTERM, _sig)
    
    # Prepara um dicionário de metadados para ser incluído em cada payload.
    meta = {
        "host": hostname(),
        "iface": args.iface,
        "server_ip": args.server_ip
    }

    # 4. LOOP PRINCIPAL
    # ----------------------------------------------------------------

    try:
        while not stop.is_set():
            if args.mock:
                now = now_ts()
                aggr.add(now+1, "10.0.0.2", "in", 1500, "HTTP")
                aggr.add(now+2, "10.0.0.2", "out", 700, "HTTP")
                aggr.add(now+3, "10.0.0.3", "in", 400, "HTTPS")
                aggr.add(now+4, "10.0.0.4", "out", 250, "FTP")
                aggr.add(now+4.2, "10.0.0.3", "out", 180, "DNS")

            # Pega um "snapshot" dos dados agregados na janela de tempo atual.
            payload = aggr.snapshot(meta)
            
            # Chama a função de emissão para enviar o payload para seus destinos.
            rc = emit_json(
                payload,
                to_file=args.file,
                post_url=args.post,
                post_timeout=args.post_timeout,
                post_retries=max(0, args.post_retries),
                file_append=bool(args.file and args.file_append)
            )
            if rc != 0:
                logging.warning("Falha na emissão da janela (rc=%d). Continuando.", rc)

            time.sleep(window_s)
            
    finally:
        if sniffer:
            logging.info("Parando a captura de pacotes...")
            sniffer.stop()
            
    logging.info("Programa encerrado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())