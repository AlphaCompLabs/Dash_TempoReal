# =====================================================================================
# CONFIGURAÇÃO DE LOGGING - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.3.1
#
# Autor: Equipe Redes - Mayron Malaquias e Pedro Borges
# Descrição: Este script contém a função para configurar o sistema de logging
#            da aplicação, direcionando as mensagens para o console e/ou um arquivo.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

# Importações de bibliotecas padrão do Python
import sys
import logging
from typing import Optional


# --- SEÇÃO 1: FUNÇÃO DE CONFIGURAÇÃO DE LOGS ---

def setup_logging(level: str, log_file: Optional[str]) -> None:
    """
    Configura o sistema de logging global do programa.

    :param level: O nível mínimo de log a ser exibido (ex: "INFO", "DEBUG").
    :param log_file: O caminho do arquivo onde os logs serão salvos. Se None, os logs irão apenas para o console.
    """
    
    # Cria uma lista de "manipuladores" (handlers) de log.
    # Por padrão, sempre haverá um handler para enviar os logs para a saída de erro padrão (o console/terminal).
    handlers = [logging.StreamHandler(sys.stderr)]
    
    # Se um nome de arquivo de log foi fornecido...
    if log_file:
        # ...cria um FileHandler para escrever os logs nesse arquivo, usando codificação UTF-8.
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))
        
    # `basicConfig` é a forma mais simples de configurar o logger raiz.
    # Uma vez chamado, ele configura o sistema de log para toda a aplicação.
    logging.basicConfig(
        # `getattr(logging, level)` converte a string "INFO" para a constante logging.INFO.
        level=getattr(logging, level),
        
        # Define o formato de cada linha de log.
        # %(asctime)s: Timestamp (data e hora).
        # %(levelname)s: Nível do log (INFO, ERROR, etc.).
        # %(message)s: A mensagem de log em si.
        format="%(asctime)s %(levelname)s %(message)s",
        
        # Usa a lista de handlers que definimos acima. Os logs serão enviados para todos eles.
        handlers=handlers
    )