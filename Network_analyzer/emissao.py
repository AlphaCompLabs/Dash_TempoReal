# =====================================================================================
# MÓDULO EMISSOR DE PAYLOAD (EMITTER)
# Versão: 1.1.0 (Refatorado para separação de responsabilidades)
#
# Autor: Equipe de Análise de Rede
# Descrição: Este módulo fornece funcionalidades para serializar e enviar payloads
#            JSON para múltiplos destinos, como endpoints HTTP (com retentativas),
#            arquivos locais ou a saída padrão (stdout).
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import sys
import time
import json
import logging
from typing import Dict, Any, Optional
from urllib import request, error

# --- SEÇÃO 1: CONSTANTES DE MÓDULO ---
INITIAL_BACKOFF_S = 0.8  # Tempo de espera inicial para o retry do POST em segundos.

# --- SEÇÃO 2: FUNÇÃO PÚBLICA (ORQUESTRADORA) ---

def emit_json(payload: Dict[str, Any],
              to_file: Optional[str],
              post_url: Optional[str],
              post_timeout: float,
              post_retries: int,
              file_append: bool) -> int:
    """
    Orquestra o envio de um payload JSON para um ou mais destinos.

    :param payload: O dicionário Python a ser enviado como JSON.
    :param to_file: O caminho do arquivo para salvar o JSON.
    :param post_url: A URL para onde o JSON será enviado via POST.
    :param post_timeout: Timeout em segundos para a requisição POST.
    :param post_retries: Número de tentativas extras para o POST.
    :param file_append: Se True, anexa ao arquivo (NDJSON); senão, sobrescreve.
    :return: 0 em caso de sucesso total, 1 se qualquer uma das emissões falhar.
    """
    try:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    except Exception as e:
        logging.error("Falha ao serializar o payload para JSON: %s", e)
        return 1

    # Rastreia o sucesso de todas as operações.
    all_successful = True

    if post_url:
        all_successful &= _post_with_retry(post_url, data, post_timeout, post_retries)

    if to_file:
        all_successful &= _write_to_file(to_file, data, file_append, bool(post_url))

    if not post_url and not to_file:
        all_successful &= _write_to_stdout(data)

    return 0 if all_successful else 1

# --- SEÇÃO 3: FUNÇÕES PRIVADAS (AUXILIARES) ---

def _post_with_retry(url: str, data: bytes, timeout: float, retries: int) -> bool:
    """Tenta enviar dados via POST, com lógica de retry e backoff exponencial."""
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    attempt = 0
    while True:
        try:
            with request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8", errors="ignore")
                logging.debug("POST para %s OK (status: %d): %s", url, resp.status, body.strip())
                return True # Sucesso
        except error.HTTPError as e:
            # Erros HTTP (4xx, 5xx) são fatais e não acionam retry.
            body = e.read().decode("utf-8", errors="ignore")
            logging.error("POST para %s falhou com erro HTTP %s: %s", url, e.code, body.strip())
            return False # Falha
        except Exception as e:
            # Outros erros (timeout, DNS, etc.) acionam retry.
            if attempt >= retries:
                logging.error("POST para %s falhou após %d tentativas: %s", url, attempt + 1, e)
                return False # Falha

            attempt += 1
            sleep_s = INITIAL_BACKOFF_S * (2 ** (attempt - 1))
            logging.warning("POST para %s falhou (%s). Tentando novamente em %.1fs (%d/%d)...",
                            url, e, sleep_s, attempt, retries)
            time.sleep(sleep_s)

def _write_to_file(path: str, data: bytes, append: bool, is_secondary_output: bool) -> bool:
    """Escreve os dados em um arquivo, com modo de apêndice ou sobrescrita."""
    try:
        mode = "ab" if append else "wb"
        with open(path, mode) as f:
            f.write(data)
            if append:
                f.write(b"\n") # Garante o formato NDJSON.

        # Loga apenas se o arquivo for o único destino, para evitar poluição no log.
        if not is_secondary_output:
            logging.info("JSON %s em %s", "anexado" if append else "salvo", path)
        return True
    except Exception as e:
        logging.error("Falha ao escrever no arquivo %s: %s", path, e)
        return False

def _write_to_stdout(data: bytes) -> bool:
    """Escreve os dados na saída padrão (console)."""
    try:
        sys.stdout.buffer.write(data)
        sys.stdout.write("\n")
        sys.stdout.flush()
        return True
    except Exception as e:
        logging.error("Falha ao escrever para STDOUT: %s", e)
        return False