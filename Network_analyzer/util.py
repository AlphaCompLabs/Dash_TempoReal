# =====================================================================================
# MÓDULO DE UTILITÁRIOS (UTIL)
# Versão: 1.1.0 (Refatorado `friendly_proto` e constantes)
#
# Autor: Equipe de Análise de Rede
# Descrição: Este módulo fornece uma coleção de funções auxiliares reutilizáveis
#            (a "caixa de ferramentas") usadas em toda a aplicação, incluindo
#            formatação de protocolos, validações, hashing e outras tarefas comuns.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import time
import hmac
import hashlib
import socket
from typing import Optional, Callable
from urllib.parse import urlparse

# --- SEÇÃO 1: CONSTANTES DE MÓDULO ---

# Dicionário para mapear portas conhecidas para nomes amigáveis.
# A lógica de `friendly_proto` prioriza a porta de destino (dport).
KNOWN_PORTS = {
    # Portas Web
    80: "HTTP",
    443: "HTTPS",
    8001: "HTTP_ALT", # Porta alternativa comum para HTTP

    # Portas de Email
    25: "SMTP",
    110: "POP3",
    143: "IMAP",

    # Portas de Transferência de Arquivos
    20: "FTP-DATA",
    21: "FTP",
    2121: "FTP_ALT",

    # Portas de Banco de Dados e Infraestrutura
    22: "SSH",
    53: "DNS",
    123: "NTP",
    3306: "MySQL",
    5432: "Postgres",
}

# --- SEÇÃO 2: FUNÇÕES DE UTILIDADE ---

# --- Funções de Rede e Protocolo ---

def friendly_proto(layer: str, sport: Optional[int], dport: Optional[int]) -> str:
    """
    [REFATORADO] Converte informações de camada e porta em um nome de protocolo amigável.

    :param layer: A camada de transporte (ex: "TCP", "UDP").
    :param sport: A porta de origem.
    :param dport: A porta de destino.
    :return: Uma string representando o protocolo (ex: "HTTPS", "DNS", "TCP:54321").
    """
    if layer == "ICMP":
        return "ICMP"

    if layer == "UDP" and (sport == 443 or dport == 443):
        return "QUIC" # Protocolo QUIC (sobre UDP) usa a porta 443.

    # Prioriza a porta de destino, pois geralmente indica o serviço.
    port_to_check = dport or sport
    if not port_to_check:
        return layer  # Retorna "TCP" ou "UDP" se não houver portas.

    # Busca o nome no dicionário; se não encontrar, retorna o nome da camada.
    protocol_name = KNOWN_PORTS.get(port_to_check, layer)

    # Se o nome do protocolo já inclui a camada (ex: TCP), não o repete.
    if protocol_name == layer:
        return f"{layer}:{port_to_check}"
    return protocol_name

def validate_url(url: str) -> bool:
    """Verifica se uma string é uma URL HTTP/HTTPS bem-formada."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except (ValueError, AttributeError):
        return False

def hostname() -> str:
    """Retorna o hostname da máquina local ou um valor padrão em caso de falha."""
    try:
        return socket.gethostname()
    except Exception:
        return "unknown-host"

# --- Funções de Criptografia e Hashing ---

def anon_hasher(key: bytes) -> Callable[[str], str]:
    """
    Cria e retorna uma função (closure) que anonimiza strings usando HMAC-SHA1.

    :param key: A chave secreta para o HMAC.
    :return: Uma função que recebe uma string e retorna seu hash anonimizado.
    """
    def _h(s: str) -> str:
        # HMAC-SHA1 é usado por ser rápido. Para anonimização, suas vulnerabilidades
        # criptográficas não são uma preocupação. O resultado é truncado para 16 caracteres.
        return hmac.new(key, s.encode("utf-8"), hashlib.sha1).hexdigest()[:16]
    return _h

# --- Funções de Tempo ---

def now_ts() -> float:
    """Retorna o timestamp Unix atual como um float."""
    return time.time()