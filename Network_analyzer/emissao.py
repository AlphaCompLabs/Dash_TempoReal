# =====================================================================================
# LÓGICA DE EMISSÃO DE DADOS - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.3.1
#
# Autor: Equipe Redes - Mayron Malaquias e Pedro Borges
# Descrição: Este script contém a função que envia o payload JSON para diferentes
#            destinos, como uma API RESTful, um arquivo local ou a saída padrão.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

# Importações de bibliotecas padrão do Python

import sys
import time
import json
import logging
from typing import Dict, Any, Optional
from urllib import request, error  # Módulos padrão do Python para fazer requisições web.


# --- SEÇÃO 1: FUNÇÃO PRINCIPAL DE EMISSÃO ---
def emit_json(payload: Dict[str, Any],
              to_file: Optional[str],
              post_url: Optional[str],
              post_timeout: float,
              post_retries: int,
              file_append: bool) -> int:
    """
    Envia um payload JSON para um ou mais destinos (POST, arquivo, stdout).
    Implementa uma lógica de retry com backoff exponencial para o POST.

    :param payload: O dicionário Python a ser enviado como JSON.
    :param to_file: O caminho do arquivo para salvar o JSON.
    :param post_url: A URL para onde o JSON será enviado via POST.
    :param post_timeout: Timeout em segundos para a requisição POST.
    :param post_retries: Número de tentativas extras para o POST em caso de falha.
    :param file_append: Se True, anexa ao arquivo (NDJSON), senão, sobrescreve.
    :return: 0 em caso de sucesso, 1 em caso de falha.
    """
    # Serializa o dicionário Python para uma string JSON e, em seguida,
    # a codifica em bytes usando UTF-8. Isso é necessário para envio pela rede e escrita em arquivo.
    # `ensure_ascii=False` preserva caracteres como 'ç' e 'ã'.
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    # --- Bloco de envio para a URL via POST ---
    if post_url:
        # Prepara a requisição HTTP, especificando a URL, os dados (data),
        # o cabeçalho (essencial para o servidor saber que está recebendo JSON) e o método.
        req = request.Request(post_url, data=data, headers={"Content-Type": "application/json"}, method="POST")
        
        # --- Lógica de Retry (tentativas extras) com Backoff Exponencial ---
        attempt = 0
        backoff = 0.8  # Tempo de espera inicial em segundos.
        while True:  # Loop infinito que só é quebrado por sucesso (break) ou falha total (return).
            try:
                # Tenta abrir a URL (enviar a requisição). `with` garante que a conexão será fechada.
                with request.urlopen(req, timeout=post_timeout) as resp:
                    # Se a requisição foi bem-sucedida (código 2xx), lê a resposta.
                    body = resp.read().decode("utf-8", errors="ignore")
                    logging.debug("POST OK: %s", body.strip())
                    break  # Sai do loop `while` pois a operação foi um sucesso.

            except error.HTTPError as e:
                # Captura erros específicos de HTTP (ex: 404 Not Found, 500 Internal Server Error).
                # Estes são considerados erros fatais e não acionam o retry.
                body = e.read().decode("utf-8", errors="ignore")
                logging.error("POST HTTP %s: %s", e.code, body.strip())
                return 1  # Retorna código de erro.

            except Exception as e:
                # Captura outras exceções (ex: timeout de rede, falha de DNS).
                # Estes erros acionam a lógica de retry.
                if attempt >= post_retries:
                    # Se o número de tentativas extras foi esgotado, desiste.
                    logging.error("POST ERROR (tentativas esgotadas): %s", e)
                    return 1  # Retorna código de erro.
                
                attempt += 1
                # Calcula o tempo de espera. A cada tentativa, o tempo dobra (0.8s, 1.6s, 3.2s...).
                # Isso evita sobrecarregar um servidor que pode estar se recuperando de uma falha.
                sleep_s = backoff * (2 ** (attempt - 1))
                logging.warning("POST falhou (%s). Tentando novamente em %.1fs (%d/%d)...",
                                e, sleep_s, attempt, post_retries)
                time.sleep(sleep_s)  # Pausa a execução antes da próxima tentativa.

    # --- Bloco de escrita em arquivo ---
    if to_file:
        try:
            # Define o modo de abertura: 'ab' (append binary) ou 'wb' (write binary).
            mode = "ab" if file_append else "wb"
            with open(to_file, mode) as f:
                f.write(data)
                if file_append:
                    # Adiciona uma nova linha para criar o formato NDJSON (JSON delimitado por nova linha).
                    f.write(b"\n")
            
            # Loga uma mensagem de sucesso apenas se o arquivo for o único destino, para não poluir o log.
            if not post_url:
                logging.info("JSON %s em %s", "acrescentado" if file_append else "salvo", to_file)
        except Exception as e:
            logging.error("FILE ERROR: %s", e)
            return 1 # Retorna código de erro.

    # --- Bloco de saída padrão (STDOUT) ---
    # Este bloco só é executado se nenhuma outra forma de saída foi configurada.
    if not post_url and not to_file:
        try:
            # Escreve os bytes de dados diretamente no buffer do stdout para evitar problemas de codificação do terminal.
            sys.stdout.buffer.write(data)
            sys.stdout.write("\n")
            sys.stdout.flush() # Garante que o texto seja exibido imediatamente.
        except Exception as e:
            logging.error("STDOUT ERROR: %s", e)
            return 1 # Retorna código de erro.

    # Se a função chegou até aqui, todas as operações foram bem-sucedidas.
    return 0