# =====================================================================================
# MÓDULO DE INTERFACE DE LINHA DE COMANDO (CLI)
# Versão: 1.1.0 (Refatorado com grupos de argumentos e constantes)
#
# Autor: Equipe de Análise de Rede
# Descrição: Este módulo é responsável por configurar e processar todos os
#            argumentos da linha de comando para a aplicação, utilizando a
#            biblioteca `argparse`.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import argparse

# --- SEÇÃO 1: CONSTANTES DE CONFIGURAÇÃO PADRÃO ---
DEFAULT_INTERVAL_S = 5.0
DEFAULT_MAX_CLIENTS = 0
DEFAULT_POST_TIMEOUT_S = 10.0
DEFAULT_POST_RETRIES = 2
DEFAULT_LOG_LEVEL = "INFO"

# --- SEÇÃO 2: FUNÇÃO PRINCIPAL DE PARSING ---
def parse_args() -> argparse.Namespace:
    """
    Configura e processa os argumentos da linha de comando para a aplicação.

    Utiliza grupos de argumentos (`argument_group`) para uma saída de ajuda (`--help`)
    mais organizada e legível.

    :return: Um objeto `Namespace` com todos os argumentos fornecidos pelo usuário.
    """
    parser = argparse.ArgumentParser(
        description="Netvision Producer: captura pacotes, agrega em janelas e envia via JSON.",
        formatter_class=argparse.RawTextHelpFormatter # Melhora a formatação da ajuda.
    )

    # --- Grupo 1: Argumentos de Captura de Rede ---
    capture_group = parser.add_argument_group("Argumentos de Captura de Rede")
    capture_group.add_argument("--server-ip", required=False,
                               help="IP do servidor local para definir a direção do tráfego (in/out).")
    capture_group.add_argument("--iface", help="Interface de rede para captura (ex: 'eth0', 'Wi-Fi').")
    capture_group.add_argument("--bpf", help="Filtro BPF para capturar pacotes específicos.")
    capture_group.add_argument("--pcap", help="Ler pacotes de um arquivo .pcap em vez de capturar ao vivo.")

    # --- Grupo 2: Argumentos de Agregação e Emissão ---
    agg_group = parser.add_argument_group("Argumentos de Agregação e Emissão")
    agg_group.add_argument("--interval", type=float, default=DEFAULT_INTERVAL_S,
                           help=f"Tamanho da janela de agregação em segundos (padrão: {DEFAULT_INTERVAL_S}s).")
    agg_group.add_argument("--max-clients", type=int, default=DEFAULT_MAX_CLIENTS,
                           help="Manter apenas os N clientes com maior tráfego (0 = ilimitado).")

    # --- Grupo 3: Argumentos de Saída (Output) ---
    output_group = parser.add_argument_group("Argumentos de Saída (Output)")
    output_group.add_argument("--post", help="URL para onde o JSON será enviado via POST (ex: http://localhost:8000/api/ingest).")
    output_group.add_argument("--post-timeout", type=float, default=DEFAULT_POST_TIMEOUT_S,
                              help=f"Timeout para a requisição POST em segundos (padrão: {DEFAULT_POST_TIMEOUT_S}s).")
    output_group.add_argument("--post-retries", type=int, default=DEFAULT_POST_RETRIES,
                              help=f"Tentativas extras no POST com backoff exponencial (padrão: {DEFAULT_POST_RETRIES}).")
    output_group.add_argument("--file", help="Salvar JSON em arquivo (sobrescreve a cada janela por padrão).")
    output_group.add_argument("--file-append", action="store_true",
                              help="Se usado, anexa ao arquivo em formato NDJSON (um JSON por linha).")

    # --- Grupo 4: Argumentos de Anonimização ---
    anon_group = parser.add_argument_group("Argumentos de Anonimização")
    anon_group.add_argument("--anon", action="store_true",
                            help="Ativa a anonimização de IPs (hash HMAC-SHA1).")
    anon_group.add_argument("--anon-key", help="Chave para HMAC (se não informada, usa a variável de ambiente ANON_KEY ou gera uma aleatória).")

    # --- Grupo 5: Argumentos de Logging e Debug ---
    log_group = parser.add_argument_group("Argumentos de Logging e Debug")
    log_group.add_argument("--log-level", default=DEFAULT_LOG_LEVEL,
                           choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
                           help=f"Define o nível de verbosidade do log (padrão: {DEFAULT_LOG_LEVEL}).")
    log_group.add_argument("--log-file", help="Redireciona a saída do log para um arquivo.")

    # --- Grupo 6: Argumentos de Teste e Comportamento ---
    test_group = parser.add_argument_group("Argumentos de Teste e Comportamento")
    test_group.add_argument("--mock", action="store_true",
                            help="Injeta eventos de tráfego fictícios (útil para testes de output).")
    test_group.add_argument("--no-capture", action="store_true",
                            help="Desativa a captura de pacotes (útil para rodar apenas com --mock ou --pcap).")

    return parser.parse_args()