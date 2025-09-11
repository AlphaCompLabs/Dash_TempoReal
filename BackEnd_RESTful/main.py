# =====================================================================================
# SERVIDOR BACKEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.3.1 
#
# Autor: Equipe Backend - Diogo Freitas e Gustavo Martins
# Descrição: Este script implementa uma API RESTful com FastAPI para receber dados
#            de tráfego de um analisador de rede e servi-los a um dashboard de
#            visualização.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

# Importações de bibliotecas padrão do Python
import threading
from typing import Dict, List, Optional
import logging

# Importações de bibliotecas de terceiros (FastAPI e Pydantic)
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, Field
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR

# --- Configuração de Logging ---
# Define um formato padrão para os logs do servidor, o que é uma prática
# mais robusta e controlável do que usar simples 'print()'.
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# --- SEÇÃO 1: MODELOS DE DADOS PARA INGESTÃO (CONTRATO COM O ANALISADOR) ---
# Estas classes, usando Pydantic, definem a estrutura exata do JSON que
# esperamos receber da equipe de Redes. O FastAPI as utiliza para validar
# automaticamente os dados de entrada. Se os dados não seguirem este
# "contrato", o FastAPI retorna um erro 422 (Unprocessable Entity) sem
# que precisemos escrever código para isso.

class ProtocolInOutData(BaseModel):
    """Define a estrutura para os bytes de entrada/saída de um protocolo."""
    in_bytes: int = Field(alias="in", description="Bytes de entrada para este protocolo.")
    out_bytes: int = Field(alias="out", description="Bytes de saída para este protocolo.")

class ClientData(BaseModel):
    """Agrega todas as informações de tráfego de um único cliente (IP)."""
    in_bytes: int = Field(..., description="Total de bytes recebidos do cliente.", json_schema_extra={'example': '1024'})
    out_bytes: int = Field(..., description="Total de bytes enviados para o cliente.", json_schema_extra={'example': '20480'})
    protocols: Dict[str, ProtocolInOutData]

class TrafficPayload(BaseModel):
    """Define o corpo (payload) completo da requisição POST vinda do analisador de rede."""
    host: str = Field(..., json_schema_extra={'example': 'laptop-dev'})
    iface: Optional[str] = Field(None, json_schema_extra={'example': 'eth0'})
    server_ip: Optional[str] = Field(None, json_schema_extra={'example': '192.168.1.10'})
    window_start: int = Field(..., description="Timestamp Unix do início da janela.", json_schema_extra={'example': '1725822000'})
    window_end: int = Field(..., description="Timestamp Unix do fim da janela.", json_schema_extra={'example': '1725822005'})
    clients: Dict[str, ClientData]


# --- SEÇÃO 2: ARMAZENAMENTO DE DADOS EM MEMÓRIA ---
# Como não estamos usando um banco de dados, esta classe atua como nosso
# armazenamento temporário, guardando apenas a última janela de dados recebida.

class TrafficDataStore:
    """
    Classe singleton para armazenar os dados de tráfego de forma segura,
    evitando condições de corrida (race conditions) entre múltiplas requisições.
    """
    def __init__(self):
        """Inicializa o armazenamento e um 'Lock' para segurança em threads."""
        self._latest_clients_data: Optional[Dict[str, ClientData]] = None
        self._lock = threading.Lock() # Garante que apenas uma thread modifique os dados por vez.

    def update_data(self, new_clients_data: Dict[str, ClientData]):
        """Atualiza os dados armazenados com o novo payload de forma segura."""
        with self._lock:
            logging.info(f"{len(new_clients_data)} clientes recebidos e armazenados.")
            self._latest_clients_data = new_clients_data

    def get_data(self) -> Optional[Dict[str, ClientData]]:
        """Retorna uma cópia segura dos últimos dados para evitar modificações acidentais."""
        with self._lock:
            return self._latest_clients_data.copy() if self._latest_clients_data else None

# --- Instância Global do Armazenamento ---
# Esta única instância será compartilhada por toda a aplicação.
data_store = TrafficDataStore()


# --- SEÇÃO 3: INICIALIZAÇÃO DA APLICAÇÃO FASTAPI ---
# Aqui criamos a instância principal da aplicação e definimos seus metadados,
# que serão usados para gerar a documentação automática (Swagger/OpenAPI).

app = FastAPI(
    title="Dashboard de Tráfego de Servidor - API",
    description="API RESTful que recebe dados do `network_analyzer` e os fornece para um dashboard de visualização.",
    version="1.3.1",
    contact={
        "name": "Equipe Backend",
        "url": "https://github.com/AlphaCompLabs/Dash_TempoReal",
    },
)


# --- SEÇÃO 4: MODELOS DE DADOS PARA CONSUMO (CONTRATO COM O FRONTEND) ---
# Estas classes definem a estrutura dos dados que nossa API vai ENVIAR
# como resposta para o frontend. Elas garantem que a saída seja consistente
# e ajudam a documentar a API.

class ClientTrafficSummary(BaseModel):
    """Modelo de resposta para o gráfico principal (tráfego por IP)."""
    ip: str
    inbound: int
    outbound: int

class ProtocolDrilldown(BaseModel):
    """Modelo de resposta para o gráfico de drill down (tráfego por protocolo)."""
    name: str
    y: int # Nome comum utilizado ('y') para o valor em bibliotecas de gráficos.


# --- SEÇÃO 5: ENDPOINTS DA API ---
# Cada função abaixo define uma "rota" ou "endpoint" da nossa API, ou seja,
# uma URL que pode ser acessada para executar uma ação.

# --- 5.1 Endpoint de Ingestão de Dados ---
@app.post(
    "/api/ingest",
    status_code=204, # 204 No Content: Resposta de sucesso que não precisa retornar um corpo.
    tags=["Data Ingestion"],
    summary="Recebe dados do Network Analyzer",
    description="Ponto de entrada para os dados capturados. Chamado periodicamente pelo `network_analyzer`."
)
def receive_traffic_data(payload: TrafficPayload):
    """
    Valida e armazena os dados de tráfego recebidos.
    A validação contra o modelo `TrafficPayload` é feita automaticamente pelo FastAPI.
    """
    try:
        # Extrai apenas a parte 'clients' do payload e a salva.
        data_store.update_data(payload.clients)
        return Response(status_code=204)
    except Exception as e:
        # Captura qualquer erro inesperado durante o armazenamento para evitar que o servidor trave.
        logging.error(f"Erro inesperado ao armazenar dados: {e}", exc_info=True)
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno no servidor ao processar os dados recebidos."
        )

# --- 5.2 Endpoints de Consumo de Dados (para o Frontend) ---
@app.get(
    "/api/traffic",
    response_model=List[ClientTrafficSummary],
    tags=["Data Consumption"],
    summary="Lista o tráfego agregado por cliente",
    description="Fornece os dados para o gráfico principal do dashboard."
)
def get_main_traffic_data():
    """Busca os dados mais recentes e os formata para o gráfico principal."""
    latest_clients = data_store.get_data()
    if not latest_clients:
        return [] # Retorna uma lista vazia se nenhum dado foi recebido ainda.

    # Transforma o dicionário de dados no formato de lista esperado pelo frontend.
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
    description="Fornece os dados para o gráfico de drill down quando o usuário clica em um IP."
)
def get_protocol_drilldown_data(client_ip: str):
    """
    Filtra os dados para um `client_ip` específico e os formata para o gráfico de detalhes.
    O `client_ip` é um parâmetro de caminho (path parameter) extraído da URL.
    """
    latest_clients = data_store.get_data()

    # Validação para garantir que o IP solicitado existe nos dados atuais.
    if not latest_clients or client_ip not in latest_clients:
        raise HTTPException(status_code=404, detail=f"O IP '{client_ip}' não foi encontrado na última janela de dados.")

    client_protocols = latest_clients[client_ip].protocols

    # Transforma os dados de protocolo no formato esperado pelo gráfico de drill down.
    response_data = [
        ProtocolDrilldown(name=protocol, y=(data.in_bytes + data.out_bytes))
        for protocol, data in client_protocols.items()
    ]
    return response_data

