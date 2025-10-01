# =====================================================================================
# TESTE UNITÁRIO AUTOMATIZADO PARA A API BACKEND
# Versão: 2.0.1 (Refatorado com Fixtures e Edge Cases)
#
# Autor: Equipe Backend/QA
# Descrição: Este script usa pytest e TestClient para validar o comportamento
#            da API RESTful. Esta versão utiliza fixtures para melhor isolamento
#            e reutilização, e adiciona testes para casos de borda (edge cases),
#            garantindo maior robustez e confiabilidade da aplicação.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Adiciona o diretório raiz do projeto ao caminho do Python para importação.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from BackEnd_RESTful.main import app, clear_traffic_data  # Importa a função de limpeza

# --- SEÇÃO 1: FIXTURES DO PYTEST ---

@pytest.fixture(scope="module")
def client() -> TestClient:
    """
    Fixture que cria e disponibiliza uma instância do TestClient para todos os testes.
    O escopo "module" significa que ele é criado apenas uma vez por arquivo de teste.
    """
    return TestClient(app)

@pytest.fixture
def valid_payload() -> dict:
    """
    Fixture que fornece um payload de dados válido para ser reutilizado nos testes.
    """
    return {
        "host": "test-host", "iface": "test-iface", "server_ip": "127.0.0.1",
        "window_start": 1757439600, "window_end": 1757439605,
        "clients": {
            "192.168.1.101": {
                "in_bytes": 1000, "out_bytes": 5000,
                "protocols": {"TCP": {"in": 800, "out": 4500}, "UDP": {"in": 200, "out": 500}}
            },
            "10.0.0.5": {
                "in_bytes": 250, "out_bytes": 0,
                "protocols": {"DNS": {"in": 250, "out": 0}}
            }
        }
    }

@pytest.fixture(autouse=True)
def cleanup_data_store():
    """
    Fixture que limpa o armazenamento de dados em memória ANTES de cada teste.
    O 'autouse=True' garante que ela rode automaticamente para todos os testes,
    proporcionando total isolamento e evitando que um teste afete o outro.
    """
    clear_traffic_data()
    yield # O teste é executado aqui
    clear_traffic_data()


# --- SEÇÃO 2: TESTES DE "CAMINHO FELIZ" (HAPPY PATH) ---

def test_ingest_and_get_traffic_data(client: TestClient, valid_payload: dict):
    """
    Testa o fluxo principal: envia dados para /api/ingest e depois os recupera
    em /api/traffic, verificando se a resposta está correta.
    """
    # Ação: Envia os dados
    response_post = client.post("/api/ingest", json=valid_payload)
    assert response_post.status_code == 204

    # Ação: Busca os dados
    response_get = client.get("/api/traffic")
    
    # Verificação
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

def test_get_protocol_drilldown_data(client: TestClient, valid_payload: dict):
    """
    Testa o endpoint de drill down para um cliente específico.
    """
    # Preparação: Envia os dados necessários para o teste
    client.post("/api/ingest", json=valid_payload)
    
    # Ação: Busca os protocolos do cliente específico
    response = client.get("/api/traffic/192.168.1.101/protocols")

    # Verificação
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2

    tcp_data = next((item for item in data if item["name"] == "TCP"), None)
    assert tcp_data is not None
    assert tcp_data["y"] == 800 + 4500  # Total de tráfego TCP

    udp_data = next((item for item in data if item["name"] == "UDP"), None)
    assert udp_data is not None
    assert udp_data["y"] == 200 + 500  # Total de tráfego UDP


# --- SEÇÃO 3: TESTES DE CASOS DE BORDA (EDGE CASES) ---

def test_get_traffic_when_empty(client: TestClient):
    """
    Garante que a API retorna uma lista vazia quando nenhum
    dado foi ingerido ainda.
    """
    response = client.get("/api/traffic")
    assert response.status_code == 200
    assert response.json() == []

def test_get_protocol_for_nonexistent_client(client: TestClient, valid_payload: dict):
    """
    Garante que a API retorna um erro 404 (Not Found) ao
    pedir o drill down de um IP que não existe.
    """
    # Preparação: Ingerir dados para que o armazenamento não esteja vazio
    client.post("/api/ingest", json=valid_payload)

    # Ação: Tentar buscar um IP que não está no payload
    response = client.get("/api/traffic/999.999.999.999/protocols")

    # Verificação
    assert response.status_code == 404
    # Atualizamos a mensagem de erro esperada para corresponder à resposta real da API.
    assert response.json() == {"detail": "O IP '999.999.999.999' não foi encontrado."}

