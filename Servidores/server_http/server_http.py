# =====================================================================================
# SERVIDOR HTTP DE TESTE
# Versão: 1.2.0 (Refatorado com logging e separação de responsabilidades)
#
# Autor: Equipe DevOps/QA
# Descrição: Este script inicia um servidor HTTP multithreaded para fins de teste.
#            Ele serve arquivos estáticos do diretório local e permite a
#            execução de comandos de shell via query string para simulação.
#
# ATENÇÃO: RISCO DE SEGURANÇA
# A funcionalidade de executar comandos (`?cmd=...`) é EXTREMAMENTE PERIGOSA e
# expõe o sistema a vulnerabilidades de Execução Remota de Código (RCE).
# Use este servidor APENAS em ambientes de teste controlados e isolados.
# NUNCA exponha este servidor à internet ou a redes não confiáveis.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import os
import sys
import logging
import subprocess
import mimetypes
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# --- SEÇÃO 1: CONFIGURAÇÃO, CONSTANTES E LOGGING ---
HTTP_HOST = "0.0.0.0"
HTTP_PORT = 8001
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Raiz do servidor
INDEX_FILE = os.path.join(BASE_DIR, "index.html")

def _setup_logging():
    """Configura um logger básico para exibir mensagens formatadas no console."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

# --- SEÇÃO 2: CLASSE DO HANDLER HTTP ---
class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    """
    Handler que processa requisições GET.

    Ele pode servir arquivos estáticos ou executar um comando de shell,
    retornando a saída como texto simples.
    """
    def do_GET(self):
        """Orquestra a resposta para uma requisição GET."""
        parsed_url = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        path = parsed_url.path.lstrip('/')

        logging.info("GET de %s, Path: /%s, Query: %s", self.client_address[0], path, query_params)

        if "cmd" in query_params:
            # Se o parâmetro 'cmd' existe, trata como uma execução de comando.
            status, content_type, body = self._handle_command(query_params["cmd"][0])
        else:
            # Caso contrário, trata como um pedido de arquivo estático.
            filepath = INDEX_FILE if path in ("", "index.html", "index") else os.path.join(BASE_DIR, path)
            status, content_type, body = self._serve_file(filepath)

        self._send_response(status, content_type, body)

    def _handle_command(self, cmd: str) -> tuple[int, str, bytes]:
        """
        Executa um comando de shell e retorna o resultado.
        """
        logging.warning("Executando comando via GET: '%s'", cmd)
        try:
            # AVISO: shell=True é uma grande vulnerabilidade de segurança.
            output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=10)
            return 200, "text/plain; charset=utf-8", output
        except FileNotFoundError:
            response = f"Comando não encontrado: {cmd}".encode("utf-8")
            return 404, "text/plain; charset=utf-8", response
        except subprocess.TimeoutExpired:
            response = f"Comando excedeu o tempo limite: {cmd}".encode("utf-8")
            return 500, "text/plain; charset=utf-8", response
        except Exception as e:
            response = f"Erro ao executar comando '{cmd}': {e}".encode("utf-8")
            return 500, "text/plain; charset=utf-8", response

    def _serve_file(self, filepath: str) -> tuple[int, str, bytes]:
        """
        Serve um arquivo do sistema de arquivos ou retorna um erro 404.
        """
        logging.debug("Procurando arquivo em: %s", filepath)
        if os.path.exists(filepath) and not os.path.isdir(filepath):
            try:
                with open(filepath, "rb") as f:
                    content = f.read()
                mimetype, _ = mimetypes.guess_type(filepath)
                return 200, mimetype or "application/octet-stream", content
            except Exception as e:
                logging.error("Erro ao ler o arquivo '%s': %s", filepath, e)
                return 500, "text/plain; charset=utf-8", b"Erro interno ao ler arquivo."

        return 404, "text/plain; charset=utf-8", b"404 - Arquivo Nao Encontrado"

    def _send_response(self, status: int, content_type: str, body: bytes):
        """Envia a resposta HTTP completa para o cliente."""
        self.send_response(status)
        self.send_header("Content-type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: any) -> None:
        """Sobrescreve o log padrão do servidor para não poluir a saída."""
        return # Silencia os logs automáticos de cada requisição

# --- SEÇÃO 3: CLASSES DO SERVIDOR ---
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Permite que o servidor HTTP processe múltiplas requisições simultaneamente."""
    daemon_threads = True # Permite fechar o servidor com Ctrl+C mesmo com threads ativas

# --- SEÇÃO 4: FUNÇÕES PRINCIPAIS ---
def preparar_ambiente_http() -> bool:
    """Cria um index.html de teste se não existir."""
    try:
        if not os.path.exists(INDEX_FILE):
            logging.info("Arquivo index.html não encontrado. Criando um novo...")
            html_content = """<!doctype html>
<html><head><title>Servidor HTTP Teste</title></head>
<body><h1>Servidor HTTP de Teste Netvision</h1></body></html>"""
            with open(INDEX_FILE, "w", encoding="utf-8") as f:
                f.write(html_content)
            logging.info("index.html de teste criado com sucesso.")
        return True
    except PermissionError:
        logging.critical("Sem permissão para criar '%s'. Tente executar com mais privilégios.", INDEX_FILE)
        return False
    except Exception as e:
        logging.critical("Erro inesperado ao preparar o ambiente: %s", e)
        return False

def iniciar_servidor_http():
    """Configura e inicia o servidor HTTP, mantendo-o em execução."""
    try:
        server = ThreadedHTTPServer((HTTP_HOST, HTTP_PORT), SimpleHTTPRequestHandler)
        logging.info("Servidor HTTP iniciado em http://%s:%d", HTTP_HOST, HTTP_PORT)
        logging.info("Pressione CTRL+C para parar o servidor.")
        server.serve_forever()
    except OSError as e:
        if e.errno in (98, 10048):
            logging.critical("A porta %d já está sendo utilizada por outro programa.", HTTP_PORT)
        else:
            logging.critical("Erro de sistema operacional ao iniciar o servidor: %s", e)
    except Exception as e:
        logging.critical("Ocorreu um erro inesperado no servidor: %s", e)

# --- SEÇÃO 5: PONTO DE ENTRADA (ENTRY POINT) ---
if __name__ == "__main__":
    _setup_logging()
    if preparar_ambiente_http():
        iniciar_servidor_http()
    else:
        logging.critical("Não foi possível iniciar o servidor devido a falha na preparação do ambiente.")
        sys.exit(1)