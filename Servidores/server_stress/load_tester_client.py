# =====================================================================================
# CLIENTE DE TESTE DE CARGA (HTTP/FTP)
# Versão: 1.0.0
#
# Descrição: Este script conecta-se a um servidor HTTP ou FTP e baixa
#            repetidamente um ficheiro de teste em loop para gerar um
#            fluxo de tráfego de rede contínuo e mensurável.
# =====================================================================================

import sys
import time
import requests
from ftplib import FTP

def run_http_load_test(target_ip: str, port: int, filename: str):
    """Inicia um loop de downloads via HTTP."""
    url = f"http://{target_ip}:{port}/{filename}"
    print(f"--- INICIANDO TESTE DE CARGA HTTP ---")
    print(f"Alvo: {url}")
    print("A baixar o ficheiro em loop... Pressione CTRL+C para parar.")

    total_bytes_downloaded = 0
    download_count = 0
    try:
        while True:
            response = requests.get(url, stream=True)
            if response.status_code == 200:
                for chunk in response.iter_content(chunk_size=8192):
                    total_bytes_downloaded += len(chunk)
                download_count += 1
                # Usa \r para reescrever a mesma linha, criando um status dinâmico
                print(f"\rDownloads concluídos: {download_count} | Total baixado: {(total_bytes_downloaded / (1024*1024)):.2f} MB", end="")
            else:
                print(f"\nERRO: O servidor respondeu com o status {response.status_code}")
                break
            time.sleep(1) # Pequena pausa entre os downloads
    except KeyboardInterrupt:
        print("\n\nTeste interrompido pelo utilizador.")
    except requests.exceptions.ConnectionError as e:
        print(f"\nERRO DE CONEXÃO: Não foi possível conectar ao servidor. Verifique o IP e a porta. Detalhes: {e}")
    finally:
        print("Teste finalizado.")

def run_ftp_load_test(target_ip: str, port: int, filename: str):
    """Inicia um loop de downloads via FTP."""
    print(f"--- INICIANDO TESTE DE CARGA FTP ---")
    print(f"Alvo: ftp://{target_ip}:{port}/{filename}")
    print("A baixar o ficheiro em loop... Pressione CTRL+C para parar.")
    
    total_bytes_downloaded = 0
    download_count = 0
    try:
        while True:
            with FTP() as ftp:
                ftp.connect(target_ip, port, timeout=10)
                ftp.login() # Login anónimo
                
                # 'retrbinary' é o comando para baixar um ficheiro em modo binário
                # O 'lambda' aqui é uma forma de processar os "pedaços" do ficheiro à medida que chegam
                bytes_this_download = 0
                def handle_chunk(chunk):
                    nonlocal bytes_this_download
                    bytes_this_download += len(chunk)

                ftp.retrbinary(f'RETR {filename}', handle_chunk)
                
                total_bytes_downloaded += bytes_this_download
                download_count += 1
                print(f"\rDownloads concluídos: {download_count} | Total baixado: {(total_bytes_downloaded / (1024*1024)):.2f} MB", end="")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nTeste interrompido pelo utilizador.")
    except Exception as e:
        print(f"\nERRO DE CONEXÃO: Não foi possível conectar ao servidor FTP. Detalhes: {e}")
    finally:
        print("Teste finalizado.")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Uso: python load_tester_client.py <http|ftp> <IP_DO_SERVIDOR_ALVO> <PORTA>")
        print("Exemplo HTTP: python load_tester_client.py http 192.168.0.148 8001")
        print("Exemplo FTP:  python load_tester_client.py ftp 192.168.0.148 2121")
        sys.exit(1)
    
    protocol = sys.argv[1].lower()
    ip = sys.argv[2]
    try:
        port = int(sys.argv[3])
    except ValueError:
        print("ERRO: A porta precisa de ser um número.")
        sys.exit(1)

    # Assumimos que o nome do ficheiro de teste é sempre o mesmo
    test_filename = "NETVISION.zip"

    if protocol == 'http':
        run_http_load_test(ip, port, test_filename)
    elif protocol == 'ftp':
        run_ftp_load_test(ip, port, test_filename)
    else:
        print(f"ERRO: Protocolo '{protocol}' desconhecido. Use 'http' ou 'ftp'.")
        sys.exit(1)