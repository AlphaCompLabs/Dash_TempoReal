# =====================================================================================
# TESTE UNITÁRIO AUTOMATIZADO PARA A API BACKEND
# Versão: 1.1.1 
#
# Autor: Equipe Backend/QA - Diogo Freitas, Gustavo Martins e Caio Silveira (DevOps/QA)
# Descrição: Este script usa pytest e TestClient para validar o comportamento
#            da nossa API RESTful, garantindo que ela funcione como esperado.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---

from fastapi.testclient import TestClient
import sys
import os

# Adiciona o diretório raiz do projeto ao caminho do Python.
# Isso é crucial para que o pytest consiga encontrar e importar os módulos.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Agora que o caminho está ajustado, podemos importar a nossa aplicação 'app'
# a partir da pasta correta: 'BackEnd_RESTful'.
from BackEnd_RESTful.main import app

# --- SEÇÃO 1: CONFIGURAÇÃO DO AMBIENTE DE TESTE ---

client = TestClient(app)

# --- SEÇÃO 2: DADOS DE TESTE (MOCK PAYLOAD) ---
VALID_PAYLOAD = {
    "host": "test-host",
    "iface": "test-iface",
    "server_ip": "127.0.0.1",
    "window_start": 1757439600,
    "window_end": 1757439605,
    "clients": {
        "192.168.1.101": {
            "in_bytes": 1000,
            "out_bytes": 5000,
            "protocols": {
                "TCP": {"in": 800, "out": 4500},
                "UDP": {"in": 200, "out": 500}
            }
        },
        "10.0.0.5": {
            "in_bytes": 250,
            "out_bytes": 0,
            "protocols": {
                "DNS": {"in": 250, "out": 0}
            }
        }
    }
}

# --- SEÇÃO 3: TESTES UNITÁRIOS ---

def test_ingest_and_get_traffic_data():
    """
    Testa o fluxo principal: envia dados para /api/ingest e depois os recupera
    em /api/traffic, verificando se a resposta está correta.
    """
    response_post = client.post("/api/ingest", json=VALID_PAYLOAD)
    assert response_post.status_code == 204

    response_get = client.get("/api/traffic")
    assert response_get.status_code == 200
    
    data = response_get.json()
    assert isinstance(data, list)
    assert len(data) == 2

    client1_data = next((item for item in data if item["ip"] == "192.168.1.101"), None)
    assert client1_data is not None
    assert client1_data["inbound"] == 1000
    assert client1_data["outbound"] == 5000

    client2_data = next((item for item in data if item["ip"] == "10.0.0.5"), None)
    assert client2_data is not None
    assert client2_data["inbound"] == 250
    assert client2_data["outbound"] == 0

def test_get_protocol_drilldown_data():
    """
    Testa o endpoint de drill down para um cliente específico.
    """
    client.post("/api/ingest", json=VALID_PAYLOAD)
    response = client.get("/api/traffic/192.168.1.101/protocols")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2

    tcp_data = next((item for item in data if item["name"] == "TCP"), None)
    assert tcp_data is not None
    assert tcp_data["y"] == 800 + 4500

    udp_data = next((item for item in data if item["name"] == "UDP"), None)
    assert udp_data is not None
    assert udp_data["y"] == 200 + 500
