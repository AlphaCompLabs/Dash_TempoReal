# =====================================================================================
# FUNÇÕES DE UTILIDADE - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.3.1
#
# Autor: Equipe Redes - Mayron Malaquias e Pedro Borges
# Descrição: Este script contém várias funções utilitárias que são usadas em
#            diferentes partes da aplicação, como normalização de dados, validação,
#            anonimização e metadados do sistema.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

# Importações de bibliotecas padrão do Python
import time
import hmac
import hashlib
import socket
from typing import Optional, Callable
from urllib.parse import urlparse

# Mapeamento de portas e protocolos conhecidos para nomes mais amigáveis.
KNOWN_PORTS = {
    80: "HTTP", 443: "HTTPS", 53: "DNS",
    20: "FTP-DATA", 21: "FTP", 2121: "FTP", 8001: "HTTP",
    123: "NTP", 25: "SMTP", 110: "POP3", 143: "IMAP",
    22: "SSH", 3306: "MySQL", 5432: "Postgres"
}

# --- SEÇÃO 1: FUNÇÕES DE PROTOCOLO E REDE ---

def friendly_proto(layer: str, sport: Optional[int], dport: Optional[int]) -> str:
    """
    Converte um protocolo de rede em um nome mais legível.

    :param layer: O nome da camada de transporte (ex: "TCP", "UDP", "ICMP").
    :param sport: O número da porta de origem.
    :param dport: O número da porta de destino.
    :return: Uma string representando o protocolo de forma amigável (ex: "HTTPS", "DNS").
    """
    # Lógica específica para protocolos comuns
    if layer == "ICMP":
        return "ICMP"
    
    if layer in ("TCP", "UDP"):
        # QUIC / HTTPS / DNS / NTP
        if sport == 443 or dport == 443:
            return "QUIC" if layer == "UDP" else "HTTPS"
        if sport == 53 or dport == 53:
            return "DNS"
        if sport == 123 or dport == 123:
            return "NTP"
        
        # Mapeamento para outras portas conhecidas
        for p in (sport, dport):
            if p in KNOWN_PORTS:
                return KNOWN_PORTS[p]
        
        # Se a porta não é conhecida, retorna o nome da camada + o número da porta.
        p = dport if dport else sport
        return f"{layer}:{p}" if p else layer
    
    return layer

def validate_url(u: str) -> bool:
    """
    Valida se uma string é uma URL HTTP/HTTPS bem formada.

    :param u: A URL a ser validada.
    :return: True se a URL for válida, False caso contrário.
    """
    try:
        p = urlparse(u)
        return p.scheme in ("http", "https") and bool(p.netloc)
    except Exception:
        return False

def now_ts() -> float:
    """
    Retorna o timestamp Unix atual em segundos.

    :return: Um float representando o tempo atual.
    """
    return time.time()

def hostname() -> str:
    """
    Retorna o nome da máquina atual.

    :return: Uma string com o nome do host.
    """
    try:
        return socket.gethostname()
    except Exception:
        return "unknown-host"

# --- SEÇÃO 2: FUNÇÕES DE ANONIMIZAÇÃO ---

def anon_hasher(key: bytes) -> Callable[[str], str]:
    """
    Cria e retorna uma função de anonimização que usa HMAC-SHA1.
    Essa abordagem gera um hash consistente para o mesmo IP, mas impede
    que o IP original seja revertido.

    :param key: A chave secreta usada para o hashing.
    :return: Uma função que recebe uma string (IP) e retorna uma string (hash anonimizado).
    """
    def _h(s: str) -> str:
        return hmac.new(key, s.encode("utf-8"), hashlib.sha1).hexdigest()[:16]
    return _h
