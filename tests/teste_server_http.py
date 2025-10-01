# =====================================================================================
# TESTE UNITÁRIO AUTOMATIZADO PARA SERVIDOR HTTP
# Versão: 1.1.0 (Com Path Corrigido e Sincronização de Servidor)
#
# Autor: Equipe Backend/QA
# Descrição: Este script usa unitest e requests para validar o comportamento do
#            servidor HTTP de teste, focando em funcionalidade e vulnerabilidades.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import unittest
import requests
import subprocess
import time
import threading

import sys
import os
# from server_http import iniciar_servidor_http # Será importado após o ajuste do PATH

# --- SEÇÃO 1: CONFIGURAÇÃO DE AMBIENTE E PATH ---

# --- AJUSTE O PATH DO SISTEMA PARA ENCONTRAR O MÓDULO DO SERVIDOR ---
# 1. Obtém o diretório base: .../Dashboard (Sobe dois níveis de 'tests/')
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 

# 2. Constrói o caminho para o diretório que contém o arquivo server_http.py
path_modulo = os.path.join(base_dir, 'Servidores', 'server_http')

# 3. Adiciona esse caminho ao sys.path para que a importação funcione
sys.path.insert(0, path_modulo)
# ---------------------------------------------------------------------

# A importação deve funcionar agora que o caminho da pasta foi adicionado
from server_http import iniciar_servidor_http 

# --- SEÇÃO 2: CONSTANTES DE TESTE ---
SERVER_URL = "http://localhost:8001"
TIMEOUT = 5
MAX_TRIES = 10 # Máximo de tentativas para conectar no servidor (Para sincronização)

# --- SEÇÃO 3: CLASSE DE TESTE UNITÁRIO ---
class TestServidorSegurancaEFuncionalidade(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Prepara e inicia o servidor HTTP em uma thread separada e espera a conexão."""
        print("\n[SETUP] Iniciando servidor de teste...")
        
        # Inicia o servidor na thread
        cls.server_thread = threading.Thread(target=iniciar_servidor_http, daemon=True)
        cls.server_thread.start()
        
        # --- Lógica de Sincronização Inteligente ---
        # Tenta conectar repetidamente até que o servidor esteja realmente ativo.
        for i in range(MAX_TRIES):
            try:
                # Tenta uma requisição rápida para verificar se a porta está ativa
                requests.get(SERVER_URL, timeout=0.5) 
                print(f"[SETUP] Servidor pronto após {i+1} tentativas.")
                return 
            except requests.exceptions.ConnectionError:
                time.sleep(0.5) # Espera e tenta novamente

        # Falha o setup se o servidor não iniciar dentro do tempo limite.
        cls.server_thread.join(timeout=1)
        raise Exception("O servidor de teste não iniciou a tempo na porta 8001.")


    # --- TESTES DE FUNCIONALIDADE BÁSICA ---
    def test_01_servir_index_html(self):
        """Verifica se a raiz '/' retorna 200 e o corpo esperado."""
        try:
            response = requests.get(SERVER_URL, timeout=TIMEOUT)
            self.assertEqual(response.status_code, 200, "Deveria retornar status 200 para a raiz")
            self.assertIn(b"Servidor HTTP Teste", response.content, "Deveria conter o título do HTML")
            self.assertIn("text/html", response.headers['Content-type'], "Deveria ser Content-type HTML")
        except requests.exceptions.ConnectionError:
            self.fail("Servidor não conseguiu iniciar ou responder.")

    def test_02_arquivo_nao_encontrado(self):
        """Verifica se um path inexistente retorna 404."""
        response = requests.get(f"{SERVER_URL}/naoexiste.pdf", timeout=TIMEOUT)
        self.assertEqual(response.status_code, 404, "Deveria retornar 404 para arquivo inexistente")
        self.assertIn(b"404 - Arquivo Nao Encontrado", response.content)
    
    # --- TESTES DE SEGURANÇA CRÍTICA (RCE) ---
    def test_03_vulnerabilidade_rce_whoami(self):
        """CONFIRMAÇÃO DA VULNERABILIDADE: Verifica se 'whoami' é executado."""
        response = requests.get(f"{SERVER_URL}/?cmd=whoami", timeout=TIMEOUT)
        self.assertEqual(response.status_code, 200, "O RCE deveria retornar 200")
        self.assertTrue(len(response.text.strip()) > 0, "Deveria retornar a saída do comando")

    def test_04_vulnerabilidade_rce_path_traversal(self):
        """CONFIRMAÇÃO DA VULNERABILIDADE: Tenta listar arquivos via comando (confirma encadeamento)."""
        response = requests.get(f"{SERVER_URL}/?cmd=ls%20-l", timeout=TIMEOUT) 
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"index.html", response.content, "Deve listar o arquivo de teste")

    # --- TESTES DE SEGURANÇA (PATH TRAVERSAL) ---
    def test_05_path_traversal_via_arquivos(self):
        """Tenta Path Traversal na rota de arquivos estáticos."""
        response = requests.get(f"{SERVER_URL}/../../../../etc/passwd", timeout=TIMEOUT)
        self.assertEqual(response.status_code, 404, "Não deveria permitir Path Traversal na rota de arquivos")