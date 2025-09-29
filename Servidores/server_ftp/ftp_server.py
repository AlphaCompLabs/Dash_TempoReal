# =====================================================================================
# SERVIDOR FTP DE TESTE (PYFTPDLIB)
# Versão: 1.2.0 (Refatorado com logging profissional)
#
# Autor: Equipe DevOps/QA
# Descrição: Este script inicia um servidor FTP anônimo e somente leitura para fins
#            de teste. Ele serve arquivos de um diretório local para gerar
#            tráfego de rede que possa ser monitorado pelo dashboard Netvision.
#
# Dependência: pyftpdlib
# Para instalar: pip install pyftpdlib
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import os
import sys
import logging
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

# --- SEÇÃO 1: CONFIGURAÇÃO E CONSTANTES ---
FTP_HOST = "0.0.0.0"  # Escuta em todas as interfaces de rede
FTP_PORT = 2121
FTP_DIRECTORY = "ftp_files"  # Pasta que será a raiz do servidor FTP
TEST_FILE_NAME = "NETVISION.zip"
TEST_FILE_SIZE_MB = 100

def _setup_logging():
    """Configura um logger básico para exibir mensagens formatadas no console."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

# --- SEÇÃO 2: FUNÇÕES PRINCIPAIS ---

def preparar_ambiente_ftp() -> bool:
    """
    Cria o diretório FTP e um arquivo de teste para download, se não existirem.
    :return: True se o ambiente foi preparado com sucesso, False caso contrário.
    """
    try:
        logging.info("Preparando o diretório de arquivos em '%s'...", FTP_DIRECTORY)
        if not os.path.exists(FTP_DIRECTORY):
            os.makedirs(FTP_DIRECTORY)
            logging.info("Diretório '%s' criado.", FTP_DIRECTORY)

        caminho_arquivo = os.path.join(FTP_DIRECTORY, TEST_FILE_NAME)

        if not os.path.exists(caminho_arquivo):
            logging.info("Criando arquivo de teste de %dMB em '%s'...", TEST_FILE_SIZE_MB, caminho_arquivo)
            with open(caminho_arquivo, 'wb') as f:
                f.write(os.urandom(TEST_FILE_SIZE_MB * 1024 * 1024))
            logging.info("Arquivo de teste criado com sucesso.")
        return True

    except PermissionError:
        logging.critical("Sem permissão para criar diretório/arquivo em '%s'.", os.path.abspath(FTP_DIRECTORY))
        logging.critical("DICA: Tente executar o script com privilégios de administrador.")
        return False
    except Exception as e:
        logging.critical("Erro inesperado ao preparar o ambiente: %s", e)
        return False

def iniciar_servidor_ftp():
    """Configura e inicia o servidor FTP, mantendo-o em execução."""
    # Configura um autorizador para permitir acesso anônimo somente leitura.
    autorizador = DummyAuthorizer()
    # perm='elr': (e)nter directory, (l)ist files, (r)etrieve file (download)
    autorizador.add_anonymous(os.path.abspath(FTP_DIRECTORY), perm='elr')

    # Configura o manipulador de conexões FTP.
    manipulador = FTPHandler
    manipulador.authorizer = autorizador
    manipulador.banner = "Servidor FTP de Teste Netvision. Bem-vindo!"
    manipulador.timeout = 3600  # Aumenta timeout de inatividade para 1 hora.

    # Configura o servidor.
    endereco = (FTP_HOST, FTP_PORT)
    servidor = FTPServer(endereco, manipulador)

    # Limites de conexão.
    servidor.max_cons = 256
    servidor.max_cons_per_ip = 5

    try:
        logging.info("Servidor FTP iniciado em ftp://%s:%d", FTP_HOST, FTP_PORT)
        logging.info("Pressione CTRL+C para parar o servidor.")
        servidor.serve_forever()

    except OSError as e:
        if e.errno in (98, 10048): # Códigos de erro para "Address already in use" em Linux/Windows
            logging.critical("A porta %d já está sendo utilizada por outro programa.", FTP_PORT)
            logging.critical("DICA: Verifique se não há outro servidor rodando e tente novamente.")
        else:
            logging.critical("Erro de sistema operacional ao iniciar o servidor: %s", e)
    except Exception as e:
        logging.critical("Ocorreu um erro inesperado no servidor: %s", e)

# --- SEÇÃO 3: PONTO DE ENTRADA (ENTRY POINT) ---

if __name__ == "__main__":
    _setup_logging()
    
    if preparar_ambiente_ftp():
        iniciar_servidor_ftp()
    else:
        logging.critical("Não foi possível iniciar o servidor devido a falha na preparação do ambiente.")
        sys.exit(1)