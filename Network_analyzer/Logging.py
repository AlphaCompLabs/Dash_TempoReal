# =====================================================================================
# MÓDULO DE CONFIGURAÇÃO DE LOGGING
# Versão: 1.1.0 (Refatorado para configuração explícita e robusta)
#
# Autor: Equipe de Análise de Rede
# Descrição: Este módulo fornece uma função centralizada (`setup_logging`) para
#            configurar o sistema de logging de toda a aplicação. Ele permite
#            definir o nível de verbosidade e direcionar a saída para o
#            console e/ou para um arquivo.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import sys
import logging
from typing import Optional

# --- SEÇÃO 1: CONSTANTES DE MÓDULO ---
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"
DEFAULT_LOG_LEVEL = "INFO"

# --- SEÇÃO 2: FUNÇÃO DE CONFIGURAÇÃO ---

def setup_logging(level: str, log_file: Optional[str]) -> None:
    """
    Configura o logger raiz da aplicação de forma explícita e segura.

    Esta abordagem é mais robusta que `basicConfig`, pois remove handlers
    existentes antes de adicionar os novos, garantindo uma configuração limpa.

    :param level: O nível mínimo de log a ser exibido (ex: "INFO", "DEBUG").
                  Não diferencia maiúsculas de minúsculas.
    :param log_file: O caminho do arquivo para salvar os logs. Se None, os logs
                     irão apenas para o console.
    """
    # 1. Valida e converte o nível de log de string para a constante do logging.
    try:
        log_level_const = getattr(logging, level.upper())
    except AttributeError:
        logging.warning(
            "Nível de log inválido '%s'. Usando o padrão: '%s'.",
            level, DEFAULT_LOG_LEVEL
        )
        log_level_const = getattr(logging, DEFAULT_LOG_LEVEL)

    # 2. Define o formato que todas as mensagens de log terão.
    formatter = logging.Formatter(LOG_FORMAT)

    # 3. Obtém o logger raiz e redefine suas configurações.
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level_const)
    # Limpa quaisquer handlers pré-existentes para evitar duplicação de logs.
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # 4. Configura o handler para o console (saída de erro padrão).
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 5. Se um arquivo de log foi especificado, configura o handler de arquivo.
    if log_file:
        try:
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
        except (IOError, OSError) as e:
            logging.error("Não foi possível abrir o arquivo de log '%s': %s", log_file, e)

    logging.info("Sistema de logging configurado para o nível %s.", level.upper())