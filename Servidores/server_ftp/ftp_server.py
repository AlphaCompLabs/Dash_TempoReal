# =====================================================================================
# SERVIDOR FTP DE TESTE
# Versão: 1.1.1
#
# Autor: Equipe DevOps/QA - Caio Silveira, Diogo Freitas(Backend/API)
# Descrição: Este script inicia um servidor FTP simples para o cenário de teste do
#            projeto. Ele serve ficheiros de uma pasta local para gerar tráfego
#            de rede que possa ser monitorizado pelo dashboard.
#
# Dependência: pyftpdlib
# Para instalar: pip install pyftpdlib
# =====================================================================================

import os
import sys
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

# --- 1. Configurações do Servidor ---
FTP_HOST = "0.0.0.0"
FTP_PORT = 2121
FTP_DIRECTORY = "ftp_files"

def preparar_ambiente_ftp():
    """
    Cria o diretório FTP e um ficheiro de teste para download, se não existirem.
    """
    try:
        print(f"INFO: Preparando o diretório de arquivos em '{FTP_DIRECTORY}'...")
        if not os.path.exists(FTP_DIRECTORY):
            os.makedirs(FTP_DIRECTORY)
            print(f"INFO: Diretório '{FTP_DIRECTORY}' criado.")

        caminho_ficheiro = os.path.join(FTP_DIRECTORY, "arquivo_teste.zip")
        tamanho_ficheiro_mb = 10

        if not os.path.exists(caminho_ficheiro):
            print(f"INFO: Criando ficheiro de teste de {tamanho_ficheiro_mb}MB em '{caminho_ficheiro}'...")
            with open(caminho_ficheiro, 'wb') as f:
                f.write(os.urandom(tamanho_ficheiro_mb * 1024 * 1024))
            print("INFO: Ficheiro de teste criado com sucesso.")
        
        return True

    except PermissionError:
        print(f"ERRO CRÍTICO: Sem permissão para criar o diretório ou o ficheiro em '{os.path.abspath(FTP_DIRECTORY)}'.")
        print("DICA: Tente executar o script como administrador.")
        return False
    except Exception as e:
        print(f"ERRO CRÍTICO: Ocorreu um erro inesperado ao preparar o ambiente: {e}")
        return False

def iniciar_servidor_ftp():
    """
    Configura e inicia o servidor FTP.
    """
    autorizador = DummyAuthorizer()
    autorizador.add_anonymous(os.path.abspath(FTP_DIRECTORY), perm='elr')

    manipulador = FTPHandler
    manipulador.authorizer = autorizador
    manipulador.banner = "Servidor FTP de Teste para Projeto Dashboard. Bem-vindo!"

    # Aumenta o timeout de inatividade da conexão para 1 hora (3600 segundos).
    # O padrão é de 300 segundos (5 minutos).
    manipulador.timeout = 3600

    endereco = (FTP_HOST, FTP_PORT)
    servidor = FTPServer(endereco, manipulador)

    servidor.max_cons = 256
    servidor.max_cons_per_ip = 5

    try:
        print(f"INFO: Servidor FTP iniciado em ftp://{FTP_HOST}:{FTP_PORT}")
        print("INFO: Pressione CTRL+C para parar o servidor.")
        servidor.serve_forever()
    
    except OSError as e:
        if e.errno == 10048:
            print(f"ERRO CRÍTICO: A porta {FTP_PORT} já está a ser utilizada por outro programa.")
            print("DICA: Verifique se não há outro servidor a rodar e tente novamente.")
        else:
            print(f"ERRO CRÍTICO: Erro de sistema operacional ao iniciar o servidor: {e}")
    except Exception as e:
        print(f"ERRO CRÍTICO: Ocorreu um erro inesperado no servidor: {e}")


if __name__ == "__main__":
    if preparar_ambiente_ftp():
        iniciar_servidor_ftp()
    else:
        sys.exit(1)

