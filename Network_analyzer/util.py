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

KNOWN_PORTS = {
    80: "HTTP", 443: "HTTPS", 53: "DNS",
    20: "FTP-DATA", 21: "FTP", 2121: "FTP", "HTTP":8001,
    123: "NTP", 25: "SMTP", 110: "POP3", 143: "IMAP",
    22: "SSH", 3306: "MySQL", 5432: "Postgres", 8001: "(HTTP) TCP"
}

# --- SEÇÃO 1: FUNÇÕES DE PROTOCOLO E REDE ---
def friendly_proto(layer: str, sport: Optional[int], dport: Optional[int]) -> str:
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
        p = dport if dport else sport
        if not p:
            return layer # Retorna só TCP ou UDP se não houver porta

        # Busca o nome amigável no dicionário. Se não encontrar, usa o nome da camada (ex: "TCP").
        protocol_name = KNOWN_PORTS.get(p, layer)
        
        return f"{protocol_name}:{p}"
        
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