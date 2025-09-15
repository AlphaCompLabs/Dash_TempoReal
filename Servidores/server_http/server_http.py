# =====================================================================================
# SERVIDOR HTTP DE TESTE
# Versão: 1.1.0 (Modificado para servir arquivos estáticos)
#
# Autor: Equipe DevOps/QA - Caio Silveira
# Descrição: Este script inicia um servidor HTTP simples para o cenário de teste do
#            projeto. Ele serve um index.html e outros arquivos estáticos (vídeos, etc.)
#            e permite executar comandos CLI via query string.
#
# Dependência: Nenhuma (usa apenas a biblioteca padrão do Python)
# =====================================================================================

import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import subprocess
import urllib.parse
import mimetypes # Importa a biblioteca para detectar o tipo do arquivo

# --- 1. Configurações do Servidor ---
HTTP_HOST = "0.0.0.0"
HTTP_PORT = 8001
# O BASE_DIR agora será o diretório onde o script está. Usaremos ele como a raiz.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(BASE_DIR, "index.html")

# --- 2. Preparação do ambiente (sem alterações) ---
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
    Handler HTTP para servir arquivos e executar comandos.
    """

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed_path.query)
        # Remove a barra inicial para facilitar a junção de caminhos
        path = parsed_path.path.lstrip('/')
        print(f"GET de {self.client_address}, path: {path}, query: {query}")
        
        # --- Executar comando CLI via query 'cmd' (prioridade) ---
        if "cmd" in query:
            cmd = query["cmd"][0]
            try:
                output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=5)
                response = output.decode()
                self.send_response(200)
                self.send_header("Content-type", "text/plain; charset=utf-8")
            except Exception as e:
                response = f"Erro ao executar comando: {e}"
                self.send_response(500) # Erro interno do servidor
                self.send_header("Content-type", "text/plain; charset=utf-8")

            self.end_headers()
            self.wfile.write(response.encode("utf-8"))
            return

        # --- Servir index.html na raiz ---
        if path == "" or path == "index.html" or path == "index":
             filepath = INDEX_FILE
        else:
             # --- PONTO CHAVE: SERVIR OUTROS ARQUIVOS ESTÁTICOS ---
             # Constrói o caminho completo do arquivo no sistema
             filepath = os.path.join(BASE_DIR, path)

        print(f"DEBUG: Procurando arquivo em: {filepath}")

        # --- Lógica para entregar o arquivo (seja index ou outro) ---
        if os.path.exists(filepath) and not os.path.isdir(filepath):
            try:
                with open(filepath, "rb") as f:
                    content = f.read()
                
                # Detecta o tipo do arquivo (MIME Type)
                mimetype, _ = mimetypes.guess_type(filepath)
                if mimetype is None:
                    mimetype = "application/octet-stream" # Tipo genérico

                self.send_response(200)
                self.send_header("Content-type", mimetype)
                self.end_headers()
                self.wfile.write(content)
                return
            except Exception as e:
                # Se der erro ao ler o arquivo, retorna erro 500
                response = f"Erro ao ler o arquivo: {e}".encode("utf-8")
                self.send_response(500)
                self.send_header("Content-type", "text/plain; charset=utf-8")
                self.end_headers()
                self.wfile.write(response)
                return
        
        # --- Se o arquivo não for encontrado, retorna 404 ---
        response = "404 - Arquivo Nao Encontrado".encode("utf-8")
        self.send_response(404)
        self.send_header("Content-type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(response)

# --- 4. Servidor multithreaded (sem alterações) ---
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Servidor HTTP multi-threaded"""

# --- 5. Inicialização do servidor (sem alterações) ---
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

# --- 6. Entrada principal (sem alterações) ---
if __name__ == "__main__":
    if preparar_ambiente_http():
        iniciar_servidor_http()
    else:
        sys.exit(1)