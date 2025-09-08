import threading
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# --- 1. Modelos de Dados (Contrato da API com o Network Analyzer) ---
# Os modelos foram ajustados para corresponder EXATAMENTE ao payload
# que o network_analyzer está enviando

class ProtocolInOutData(BaseModel):
    """
    Descreve a quebra de bytes de entrada/saída para um único protocolo.
    Esta é a nova estrutura detalhada que o analyzer envia.
    """
    in_bytes: int = Field(alias="in", description="Bytes de entrada para este protocolo.")
    out_bytes: int = Field(alias="out", description="Bytes de saída para este protocolo.")

class ClientData(BaseModel):
    """
    Agrega todos os dados de tráfego para um único cliente.
    """
    in_bytes: int = Field(..., description="Total de bytes recebidos do cliente.", example=1024)
    out_bytes: int = Field(..., description="Total de bytes enviados para o cliente.", example=20480)
    # O campo 'protocols' agora espera a nova estrutura detalhada ProtocolInOutData.
    protocols: Dict[str, ProtocolInOutData]

class TrafficPayload(BaseModel):
    """
    Representa o payload completo que o 'network_analyzer' envia via POST.
    O modelo foi "achatado" para remover o objeto 'meta', batendo com os dados reais.
    """
    host: str = Field(..., example="laptop-dev")
    iface: Optional[str] = Field(None, example="eth0")
    server_ip: Optional[str] = Field(None, example="192.168.1.10")
    window_start: int = Field(..., description="Timestamp Unix do início da janela de captura.", example=1725822000)
    window_end: int = Field(..., description="Timestamp Unix do fim da janela de captura.", example=1725822005)
    clients: Dict[str, ClientData] = Field(..., description="Dicionário de clientes, onde a chave é o IP.")


# --- 2. Armazenamento Seguro em Memória (Singleton Pattern) ---
class TrafficDataStore:
    """
    Classe para armazenar os dados de tráfego dos clientes de forma segura.
    Funciona como um 'singleton', uma única instância compartilhada na aplicação.
    """
    def __init__(self):
        self._latest_clients_data: Optional[Dict[str, ClientData]] = None
        self._lock = threading.Lock()

    def update_data(self, new_clients_data: Dict[str, ClientData]):
        """ Atualiza os dados dos clientes com o novo payload. """
        with self._lock:
            print(f"INFO: {len(new_clients_data)} clientes recebidos e armazenados.")
            self._latest_clients_data = new_clients_data

    def get_data(self) -> Optional[Dict[str, ClientData]]:
        """ Retorna uma cópia segura dos últimos dados de clientes. """
        with self._lock:
            return self._latest_clients_data.copy() if self._latest_clients_data else None

data_store = TrafficDataStore()

# --- 3. Configuração da Aplicação FastAPI ---
app = FastAPI(
    title="Dashboard de Tráfego de Servidor - API",
    description="API RESTful que recebe dados do `network_analyzer` e os fornece para um dashboard de visualização em tempo real.",
    version="1.2.0", # Versão atualizada
    contact={
        "name": "Equipe Backend",
        "url": "https://github.com/AlphaCompLabs/Dash_TempoReal",
    },
)

# --- 4. Endpoints da API (Interface com o Mundo Externo) ---
# Modelos de Resposta para o Frontend
class ClientTrafficSummary(BaseModel):
    ip: str
    inbound: int
    outbound: int

class ProtocolDrilldown(BaseModel):
    name: str
    y: int

# --- Endpoint de Ingestão de Dados ---
@app.post(
    "/api/ingest",
    status_code=204,
    tags=["Data Ingestion"],
    summary="Recebe dados do Network Analyzer",
    description="Este endpoint é o ponto de entrada para os dados capturados. Ele é chamado periodicamente pelo `network_analyzer`."
)
def receive_traffic_data(payload: TrafficPayload):
    """
    Valida e armazena os dados de tráfego recebidos do `network_analyzer`.

    - Validação: O corpo da requisição é automaticamente validado contra o novo modelo `TrafficPayload`.
    - Armazenamento: A seção `clients` do payload é extraída e salva no armazenamento em memória.
    - Resposta: Retorna um status `204 No Content` em caso de sucesso.
    """
    data_store.update_data(payload.clients)
    return

# --- Endpoints de Consumo de Dados (para o Frontend) ---
@app.get(
    "/api/traffic",
    response_model=List[ClientTrafficSummary],
    tags=["Data Consumption"],
    summary="Lista o tráfego agregado por cliente",
    description="Fornece os dados para o gráfico principal do dashboard, mostrando o tráfego de entrada e saída para cada cliente ativo."
)
def get_main_traffic_data():
    """
    Busca os dados mais recentes e os formata em uma lista para o gráfico principal.
    """
    latest_clients = data_store.get_data()
    if not latest_clients:
        return []
    response_data = [
        ClientTrafficSummary(ip=ip, inbound=data.in_bytes, outbound=data.out_bytes)
        for ip, data in latest_clients.items()
    ]
    return response_data

@app.get(
    "/api/traffic/{client_ip}/protocols",
    response_model=List[ProtocolDrilldown],
    tags=["Data Consumption"],
    summary="Detalha o tráfego de um cliente por protocolo",
    description="Fornece os dados para o gráfico de *drill down*. Dado um IP, retorna a quebra de tráfego por protocolo."
)
def get_protocol_drilldown_data(client_ip: str):
    """
    Filtra os dados para um `client_ip` específico e formata a saída para
    ser compatível com a visualização de drill down (ex: Highcharts).
    """
    latest_clients = data_store.get_data()
    if not latest_clients or client_ip not in latest_clients:
        raise HTTPException(status_code=404, detail=f"Client IP '{client_ip}' not found in the latest data window.")

    client_protocols = latest_clients[client_ip].protocols

    # A lógica de transformação foi atualizada para somar os bytes de 'in' e 'out'
    # para obter o valor total do protocolo, que é o que o gráfico de drill down precisa.
    response_data = [
        ProtocolDrilldown(name=protocol, y=(data.in_bytes + data.out_bytes))
        for protocol, data in client_protocols.items()
    ]
    return response_data