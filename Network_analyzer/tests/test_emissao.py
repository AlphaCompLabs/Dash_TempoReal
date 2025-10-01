# =====================================================================================
# TESTE UNITÁRIO AUTOMATIZADO PARA O MÓDULO DE EMISSÃO
# Versão: 2.0.0 (Sincronizado com emissao.py real)
#
# Autor: Equipe de Redes/QA
# Descrição: Esta suíte de testes valida o comportamento do módulo `emissao.py`.
#            Ela utiliza mocks para simular interações com a rede (HTTP), o sistema
#            de ficheiros e a saída padrão (stdout), garantindo que a lógica de
#            orquestração, retentativas e tratamento de erros funcione como esperado.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import pytest
from unittest.mock import MagicMock, mock_open, patch, call
from urllib import error
import json

# Adiciona o diretório raiz ao path para permitir a importação dos módulos da aplicação
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importa a função principal a ser testada
from emissao import emit_json

# --- SEÇÃO 1: FIXTURES E DADOS DE TESTE ---

@pytest.fixture
def mock_payload() -> dict:
    """ Fornece um payload de exemplo, como se viesse do Aggregator. """
    return {
        "version": "2.1.0",
        "clients": {
            "192.168.1.10": {"in_bytes": 1024, "out_bytes": 4096}
        }
    }

# --- SEÇÃO 2: TESTES UNITÁRIOS ---

def test_emit_to_post_success(mocker, mock_payload):
    """
    Testa o cenário de sucesso ao enviar dados via POST para uma URL.
    """
    # 1. PREPARAÇÃO: Simula a função `urllib.request.urlopen`
    mock_urlopen = mocker.patch('urllib.request.urlopen')
    
    # 2. AÇÃO: Chama a função principal com o destino post_url
    result = emit_json(payload=mock_payload, post_url="http://fake-api.com/ingest", to_file=None, post_timeout=1, post_retries=3, file_append=False)

    # 3. VERIFICAÇÃO:
    mock_urlopen.assert_called_once() # Garante que a chamada HTTP foi feita
    assert result == 0 # Espera 0, que significa sucesso total

def test_emit_to_post_fails_with_retries(mocker, mock_payload):
    """
    Testa a lógica de retentativas quando a chamada POST falha com um erro de rede.
    """
    # 1. PREPARAÇÃO: Simula `urlopen` para sempre lançar um erro de rede (ex: DNS, Timeout)
    mock_urlopen = mocker.patch('urllib.request.urlopen', side_effect=error.URLError("Network Error"))
    # Simula `time.sleep` para que os testes não esperem de verdade
    mock_sleep = mocker.patch('time.sleep')
    
    post_retries = 2
    
    # 2. AÇÃO:
    result = emit_json(payload=mock_payload, post_url="http://fake-api.com/ingest", to_file=None, post_timeout=1, post_retries=post_retries, file_append=False)

    # 3. VERIFICAÇÃO:
    # A função deve ter sido chamada 3 vezes (1 tentativa original + 2 retentativas)
    assert mock_urlopen.call_count == post_retries + 1
    # A função de espera deve ter sido chamada 2 vezes
    assert mock_sleep.call_count == post_retries
    assert result == 1 # Espera 1, que significa falha

def test_emit_to_post_fails_with_http_error(mocker, mock_payload):
    """
    Testa a falha imediata (sem retentativas) quando a API retorna um erro HTTP (ex: 404, 500).
    """
    # 1. PREPARAÇÃO: Simula `urlopen` para lançar um erro HTTP
    mock_urlopen = mocker.patch('urllib.request.urlopen', side_effect=error.HTTPError("url", 500, "Server Error", {}, None))
    mock_sleep = mocker.patch('time.sleep') # Para garantir que não é chamado

    # 2. AÇÃO:
    result = emit_json(payload=mock_payload, post_url="http://fake-api.com/ingest", to_file=None, post_timeout=1, post_retries=3, file_append=False)

    # 3. VERIFICAÇÃO:
    mock_urlopen.assert_called_once() # Apenas uma tentativa deve ser feita
    mock_sleep.assert_not_called()    # Não deve haver retentativas
    assert result == 1 # Espera 1 (falha)

def test_emit_to_file_success(mocker, mock_payload):
    """
    Testa a escrita bem-sucedida de um payload num ficheiro.
    """
    # 1. PREPARAÇÃO: Simula a função 'open' para não escrever no disco
    m = mock_open()
    mocker.patch('builtins.open', m)

    # 2. AÇÃO:
    result = emit_json(payload=mock_payload, to_file="output.json", post_url=None, post_timeout=1, post_retries=3, file_append=False)

    # 3. VERIFICAÇÃO:
    m.assert_called_once_with("output.json", "wb") # Verifica se o ficheiro foi aberto no modo de escrita binária
    handle = m()
    handle.write.assert_called_once() # Verifica se algo foi escrito
    assert result == 0 # Espera 0 (sucesso)

def test_emit_to_stdout_success(mocker, mock_payload):
    """
    Testa a escrita bem-sucedida na saída padrão (stdout) quando nenhum outro destino é fornecido.
    """
    # 1. PREPARAÇÃO: Simula o buffer de escrita do stdout
    mock_stdout_buffer_write = mocker.patch('sys.stdout.buffer.write')
    # Também simulamos o sys.stdout.write para ter controlo total.
    mock_stdout_text_write = mocker.patch('sys.stdout.write')

    # 2. AÇÃO:
    result = emit_json(payload=mock_payload, to_file=None, post_url=None, post_timeout=1, post_retries=3, file_append=False)

    # 3. VERIFICAÇÃO:
    # Verificamos explicitamente o conteúdo de cada chamada.
    expected_data = json.dumps(mock_payload, ensure_ascii=False).encode("utf-8")
    
    # Verifica se a escrita no buffer foi chamada com o payload JSON
    mock_stdout_buffer_write.assert_called_once_with(expected_data)
    # Verifica se a escrita de texto foi chamada com a nova linha
    mock_stdout_text_write.assert_called_once_with("\n")
    
    assert result == 0

def test_json_serialization_error():
    """
    Testa se a função retorna um erro se o payload não puder ser serializado para JSON.
    """
    # Um objeto 'set' não pode ser convertido para JSON, o que causará um TypeError.
    unserializable_payload = {"data": {1, 2, 3}}
    
    result = emit_json(payload=unserializable_payload, to_file=None, post_url="http://fake-api.com", post_timeout=1, post_retries=3, file_append=False)
    
    assert result == 1 # Espera 1 (falha)

