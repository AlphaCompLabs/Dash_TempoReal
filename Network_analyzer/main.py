# =====================================================================================
# CAPTURA E PROCESSAMENTO - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.3.1
#
# Autor: Equipe Redes - Mayron Malaquias e Pedro Borges
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

# Importa todas as funções e classes dos outros módulos que criamos.
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
    # Garante que o intervalo não seja muito baixo para evitar uso excessivo de CPU.
    if args.interval < 1.0:
        logging.warning("--interval muito baixo (%.2fs). Ajustando para 1s.", args.interval)
        args.interval = 1.0

    # Valida se a URL de POST é bem-formada antes de tentar usá-la.
    if args.post and not validate_url(args.post):
        logging.error("URL inválida para --post: %r", args.post)
        return 2  # Retorna um código de erro para o sistema operacional.

    # Alerta o usuário sobre uma configuração que pode não gerar dados.
    if args.no_capture and not args.mock and not args.pcap:
        logging.warning("--no-capture ativo sem --mock ou --pcap. Não haverá dados a emitir.")

    # --- Configuração da Anonimização ---
    anon_func = None
    if args.anon:
        # Define a chave de anonimização com uma ordem de prioridade:
        # 1. Argumento --anon-key.
        # 2. Variável de ambiente ANON_KEY.
        # 3. Uma chave aleatória segura como último recurso.
        key = (args.anon_key or os.environ.get("ANON_KEY") or os.urandom(32)).encode("utf-8", "ignore")
        # Cria a função de hashing que será passada para o Aggregator.
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
        sniffer.start()  # O sniffer rodará em uma thread separada.

    # 3. CONFIGURAÇÃO DE ENCERRAMENTO SEGURO (GRACEFUL SHUTDOWN)
    # ----------------------------------------------------------------
    
    stop = threading.Event()  # Cria um "evento" que servirá como sinal de parada para o loop principal.

    # Define uma função que será chamada quando o programa receber um sinal de interrupção (Ctrl+C).
    def _sig(_s, _f):
        logging.info("Sinal de parada recebido. Encerrando...")
        stop.set()  # "Ativa" o evento de parada.

    # Associa os sinais SIGINT (Ctrl+C) e SIGTERM (sinal de término padrão) à nossa função _sig.
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
        # O loop continua enquanto o evento "stop" não for ativado.
        while not stop.is_set():
            # Se o modo --mock estiver ativo, injeta dados de teste no agregador.
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
                # Se a emissão falhar, apenas loga um aviso e continua. Isso torna o programa resiliente.
                logging.warning("Falha na emissão da janela (rc=%d). Continuando.", rc)

            # Espera o tempo definido pelo intervalo antes de iniciar a próxima iteração.
            # Isso garante que um snapshot seja gerado a cada `window_s` segundos.
            time.sleep(window_s)
            
    finally:
        # O bloco `finally` é SEMPRE executado, não importa como o loop `try` termine (normalmente ou por erro).
        # Isso garante que a thread do sniffer seja parada de forma limpa.
        if sniffer:
            logging.info("Parando a captura de pacotes...")
            sniffer.stop()
            
    logging.info("Programa encerrado.")
    return 0  # Retorna código de sucesso.


# Ponto de entrada padrão para um script Python.
if __name__ == "__main__":
    # Chama a função principal e usa seu código de retorno (0 para sucesso) para sair do programa.
    sys.exit(main())