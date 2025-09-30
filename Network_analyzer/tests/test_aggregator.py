# =====================================================================================
# TESTE UNITÁRIO AUTOMATIZADO PARA O NETWORK ANALYZER
# Versão: 2.0.0 (Sincronizado com a classe Aggregator real)
#
# Autor: Equipe de Redes/QA
# Descrição: Esta suíte de testes valida o comportamento da classe Aggregator,
#            garantindo que a adição de dados, a agregação por cliente/protocolo,
#            e a criação de snapshots (destrutivos e não destrutivos) funcionam
#            conforme o esperado.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import pytest
import time

# Adiciona o diretório raiz ao path para permitir a importação dos módulos da aplicação
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Aggregator import Aggregator
from util import now_ts

# --- SEÇÃO 1: FIXTURES DE TESTE ---

@pytest.fixture
def aggregator() -> Aggregator:
    """ Fornece uma instância nova e limpa do Aggregator para cada teste. """
    # Usa a janela de tempo padrão de 5 segundos
    return Aggregator()

# --- SEÇÃO 2: TESTES UNITÁRIOS ---

def test_aggregator_initialization(aggregator: Aggregator):
    """
    Testa se o Aggregator é inicializado com um estado limpo e correto.
    """
    # Acessa o dicionário interno para verificar o estado inicial
    assert aggregator._current["clients"] == {}
    assert aggregator._current["pkt_count"] == 0
    assert aggregator._current["byte_count"] == 0

def test_add_single_packet(aggregator: Aggregator):
    """
    Testa a adição de um único evento de rede (pacote).
    """
    # 1. AÇÃO: Adiciona um evento de download para um novo cliente.
    aggregator.add(ts=now_ts(), client_ip="192.168.1.10", direction="in", nbytes=512, proto="TCP")
    
    # 2. VERIFICAÇÃO:
    clients_data = aggregator._current["clients"]
    assert len(clients_data) == 1
    
    client = clients_data["192.168.1.10"]
    assert client["in"] == 512
    assert client["out"] == 0
    assert client["proto"]["TCP"]["in"] == 512
    assert client["proto"]["TCP"]["out"] == 0
    assert aggregator._current["pkt_count"] == 1
    assert aggregator._current["byte_count"] == 512

def test_aggregation_of_multiple_packets(aggregator: Aggregator):
    """
    Testa a agregação correta de múltiplos pacotes para múltiplos clientes e protocolos.
    """
    # 1. AÇÃO: Adiciona uma sequência de eventos de rede.
    ts = now_ts()
    aggregator.add(ts=ts, client_ip="192.168.1.10", direction="in", nbytes=1000, proto="TCP")
    aggregator.add(ts=ts, client_ip="192.168.1.10", direction="out", nbytes=500, proto="TCP")
    aggregator.add(ts=ts, client_ip="192.168.1.20", direction="in", nbytes=250, proto="UDP")
    aggregator.add(ts=ts, client_ip="192.168.1.10", direction="in", nbytes=200, proto="UDP")

    # 2. VERIFICAÇÃO:
    clients_data = aggregator._current["clients"]
    assert len(clients_data) == 2

    # Verifica Cliente 1 (IP: 192.168.1.10)
    client1 = clients_data["192.168.1.10"]
    assert client1["in"] == 1200  # 1000 (TCP) + 200 (UDP)
    assert client1["out"] == 500   # 500 (TCP)
    assert client1["proto"]["TCP"]["in"] == 1000
    assert client1["proto"]["TCP"]["out"] == 500
    assert client1["proto"]["UDP"]["in"] == 200

    # Verifica Cliente 2 (IP: 192.168.1.20)
    client2 = clients_data["192.168.1.20"]
    assert client2["in"] == 250 # 250 (UDP)
    assert client2["out"] == 0
    assert client2["proto"]["UDP"]["in"] == 250
    
    assert aggregator._current["pkt_count"] == 4
    assert aggregator._current["byte_count"] == 1950 # 1000 + 500 + 250 + 200

def test_get_snapshot_and_roll_window(aggregator: Aggregator):
    """
    Testa se o método destrutivo retorna o payload correto E limpa o estado interno.
    """
    # 1. PREPARAÇÃO: Adiciona dados
    aggregator.add(ts=now_ts(), client_ip="192.168.1.10", direction="in", nbytes=100, proto="TCP")
    assert len(aggregator._current["clients"]) == 1
    
    meta_info = {"server_ip": "10.0.0.1", "host": "test-host"}

    # 2. AÇÃO: Chama o método destrutivo
    payload = aggregator.get_snapshot_and_roll_window(meta=meta_info)

    # 3. VERIFICAÇÃO DO PAYLOAD:
    assert payload["server_ip"] == "10.0.0.1"
    assert len(payload["clients"]) == 1
    assert payload["clients"]["192.168.1.10"]["in_bytes"] == 100
    
    # 4. VERIFICAÇÃO DA LIMPEZA: O estado interno deve ter sido resetado.
    assert aggregator._current["clients"] == {}
    assert aggregator._current["pkt_count"] == 0

def test_max_clients_limit(aggregator: Aggregator):
    """
    Testa se a opção max_clients limita corretamente o número de clientes no payload.
    """
    # 1. PREPARAÇÃO: Cria um novo agregador com limite de 1 cliente
    aggregator_limited = Aggregator(max_clients=1)
    
    # Adiciona dados para 2 clientes, um com mais tráfego que o outro
    ts = now_ts()
    aggregator_limited.add(ts=ts, client_ip="192.168.1.10", direction="in", nbytes=100, proto="TCP") # Menor tráfego
    aggregator_limited.add(ts=ts, client_ip="192.168.1.20", direction="in", nbytes=500, proto="TCP") # Maior tráfego

    # 2. AÇÃO: Gera o snapshot
    payload = aggregator_limited.snapshot()

    # 3. VERIFICAÇÃO:
    assert len(payload["clients"]) == 1
    # Garante que o cliente retornado é o "top talker"
    assert "192.168.1.20" in payload["clients"]
    assert "192.168.1.10" not in payload["clients"]

