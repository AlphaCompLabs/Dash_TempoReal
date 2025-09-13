# =====================================================================================
# SERVIDOR HTTP DE TESTE
# Versão: 1.0.0
#
# Autor: Equipe DevOps/QA - Caio Silveira
# Descrição: Este script inicia um servidor HTTP simples para o cenário de teste do
#            projeto. Ele serve um index.html e permite executar comandos CLI via
#            query string, gerando tráfego de rede que possa ser monitorizado pelo dashboard.
#
# Dependência: Nenhuma (usa apenas a biblioteca padrão do Python)
# =====================================================================================

import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import subprocess
import urllib.parse

# --- 1. Configurações do Servidor ---
HTTP_HOST = "26.185.28.93"
HTTP_PORT = 8001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(BASE_DIR, "index.html")

# --- 2. Preparação do ambiente ---
def preparar_ambiente_http():
    """
    Cria um index.html de teste se não existir.
    """
    try:
        print(f"INFO: Verificando index em '{INDEX_FILE}'...")
        if not os.path.exists(INDEX_FILE):
            print("INFO: Arquivo index.html não encontrado. Criando arquivo de teste...")
            with open(INDEX_FILE, "w", encoding="utf-8") as f:
                f.write("""<!doctype html>
<html>
<head><meta charset="utf-8"><title>Servidor HTTP de Teste</title></head>
<body>
<h1>Bem-vindo ao Servidor HTTP de Teste</h1>
<p>Este é o index.html padrão gerado pelo script.</p>
</body>
</html>""")
            print("INFO: index.html criado com sucesso.")
        return True
    except PermissionError:
        print(f"ERRO CRÍTICO: Sem permissão para criar '{INDEX_FILE}'.")
        print("DICA: Tente executar o script com privilégios adequados.")
        return False
    except Exception as e:
        print(f"ERRO CRÍTICO: Ocorreu um erro inesperado ao preparar o ambiente: {e}")
        return False

# --- 3. Classe handler do servidor HTTP ---
class HTTPRequestHandler(BaseHTTPRequestHandler):
    """
    Handler HTTP para servir index.html e executar comandos CLI via query string.
    """

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed_path.query)
        path = parsed_path.path
        print(f"GET de {self.client_address}, path: {path}, query: {query}")

        # --- Servir index.html ---
        if path == "/" or path == "/index":
            if os.path.exists(INDEX_FILE):
                with open(INDEX_FILE, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(content)
                return
            else:
                content = "Index não encontrado".encode("utf-8")
                self.send_response(404)
                self.send_header("Content-type", "text/plain; charset=utf-8")
                self.end_headers()
                self.wfile.write(content)
                return

        # --- Executar comando CLI via query 'cmd' ---
        if "cmd" in query:
            cmd = query["cmd"][0]
            try:
                output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=5)
                response = output.decode()
            except Exception as e:
                response = f"Erro ao executar comando: {e}"

            self.send_response(200)
            self.send_header("Content-type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(response.encode("utf-8"))
            return

        # --- Resposta padrão ---
        response = f"Você acessou {path} da LAN"
        self.send_response(200)
        self.send_header("Content-type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(response.encode("utf-8"))

# --- 4. Servidor multithreaded ---
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Servidor HTTP multi-threaded"""

# --- 5. Inicialização do servidor ---
def iniciar_servidor_http():
    """
    Configura e inicia o servidor HTTP multithreaded.
    """
    try:
        server = ThreadedHTTPServer((HTTP_HOST, HTTP_PORT), HTTPRequestHandler)
        print(f"INFO: Servidor HTTP iniciado em http://{HTTP_HOST}:{HTTP_PORT}")
        print("INFO: Pressione CTRL+C para parar o servidor.")
        server.serve_forever()
    except OSError as e:
        if e.errno == 10048:
            print(f"ERRO CRÍTICO: A porta {HTTP_PORT} já está a ser utilizada.")
            print("DICA: Verifique se não há outro servidor a rodar e tente novamente.")
        else:
            print(f"ERRO CRÍTICO: Erro de sistema operacional ao iniciar o servidor: {e}")
    except Exception as e:
        print(f"ERRO CRÍTICO: Ocorreu um erro inesperado no servidor: {e}")

# --- 6. Entrada principal ---
if __name__ == "__main__":
    if preparar_ambiente_http():
        iniciar_servidor_http()
    else:
        sys.exit(1)
