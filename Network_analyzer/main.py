# =====================================================================================
# PONTO DE ENTRADA PRINCIPAL (MAIN SCRIPT)
# Versão: 2.1.0 (Refatorado para clareza e separação de responsabilidades)
#
# Autor: Equipe de Análise de Rede
# Descrição: Este script orquestra a inicialização e execução do Netvision Producer.
#            Ele processa argumentos da CLI, configura logging, inicia a captura
#            de pacotes e entra em um loop principal para agregar e emitir dados
#            em intervalos regulares.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import os
import sys
import time
import signal
import logging
import threading
import argparse
from typing import Callable

# Importações dos módulos da aplicação (assumindo nomes de arquivo em minúsculo)
from cli import parse_args
from Logging import setup_logging
from Aggregator import Aggregator
from captura import Sniffer
from emissao import emit_json
from util import validate_url, anon_hasher, hostname, now_ts


# --- SEÇÃO 1: FUNÇÕES AUXILIARES DE INICIALIZAÇÃO E EXECUÇÃO ---

def _initialize_and_validate(args: "argparse.Namespace") -> "Callable | None":
    """Configura logging, valida argumentos e prepara a função de anonimização."""
    setup_logging(args.log_level, args.log_file)

    if args.interval < 1.0:
        logging.warning("--interval muito baixo (%.2fs). Ajustando para 1.0s.", args.interval)
        args.interval = 1.0

    if args.post and not validate_url(args.post):
        logging.error("URL inválida para --post: %r", args.post)
        sys.exit(2)

    if args.no_capture and not args.mock and not args.pcap:
        logging.warning("--no-capture ativo sem --mock ou --pcap. Não haverá dados a emitir.")

    anon_func = None
    if args.anon:
        key_source = args.anon_key or os.environ.get("ANON_KEY")
        key = (key_source or os.urandom(32)).encode("utf-8", "ignore")
        anon_func = anon_hasher(key)
        logging.info("Anonimização de IP ativada.")

    return anon_func

def _setup_shutdown_handler() -> threading.Event:
    """Configura os signal handlers para um encerramento gracioso (Ctrl+C)."""
    stop_event = threading.Event()
    def _handle_signal(sig, frame):
        logging.info("Sinal de parada (%s) recebido. Encerrando...", signal.Signals(sig).name)
        stop_event.set()
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)
    return stop_event

def _run_main_loop(args: "argparse.Namespace", aggr: Aggregator, stop_event: threading.Event):
    """Executa o loop principal de agregação e emissão de dados."""
    logging.info("Iniciando loop principal. Pressione Ctrl+C para sair.")
    meta = {"host": hostname(), "iface": args.iface, "server_ip": args.server_ip}

    while not stop_event.is_set():
        # A espera é a primeira ação do loop para dar tempo de capturar o primeiro lote de dados.
        stop_event.wait(timeout=args.interval)
        if stop_event.is_set():
            break

        if args.mock:
            # Injeta dados de teste, se o modo mock estiver ativo.
            now = now_ts()
            aggr.add(now, "10.0.0.2", "in", 1500, "HTTP")
            aggr.add(now, "10.0.0.3", "in", 400, "HTTPS")

        # [CORREÇÃO CRÍTICA] Usa o método que pega o snapshot E avança a janela.
        payload = aggr.get_snapshot_and_roll_window(meta)
        if not payload["clients"] and not args.mock:
            logging.debug("Nenhum cliente na janela. Pulando emissão.")
            continue

        logging.info("Emitindo janela de %ds com %d clientes.", aggr.window_s, payload["n_clients"])
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


# --- SEÇÃO 2: FUNÇÃO PRINCIPAL (MAIN) ---

def main() -> int:
    """Função principal que orquestra a execução da aplicação."""
    sniffer = None
    try:
        # 1. Preparação
        args = parse_args()
        anon_func = _initialize_and_validate(args)
        stop_event = _setup_shutdown_handler()

        # 2. Criação dos Objetos Principais
        aggr = Aggregator(
            window_s=int(args.interval),
            max_clients=max(0, args.max_clients),
            anon=anon_func
        )

        # 3. Início dos Processos em Background
        if not args.no_capture:
            sniffer = Sniffer(aggr, server_ip=args.server_ip, iface=args.iface, bpf=args.bpf, pcap=args.pcap)
            sniffer.start()

        # 4. Execução do Loop Principal
        _run_main_loop(args, aggr, stop_event)

    except Exception as e:
        logging.critical("Erro não tratado no fluxo principal: %s", e, exc_info=True)
        return 1
    finally:
        # 5. Limpeza e Encerramento
        if sniffer:
            logging.info("Parando a captura de pacotes...")
            sniffer.stop()

    logging.info("Programa encerrado.")
    return 0


# --- SEÇÃO 3: PONTO DE ENTRADA (ENTRY POINT) ---
if __name__ == "__main__":
    sys.exit(main())