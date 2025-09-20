# =====================================================================================
# SERVIDOR BACKEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.5.0 (com dados de drill down melhorados)
#
# Autor: Equipe Backend - Diogo Freitas e Gustavo Martins
# Descrição: Este script implementa uma API RESTful com FastAPI. Esta versão
#            enriquece o endpoint de drill down para fornecer dados
#            detalhados de inbound e outbound por protocolo.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

import threading
from typing import Dict, List, Optional
import logging

from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, Field
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from fastapi.middleware.cors import CORSMiddleware


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# --- SEÇÃO 1: MODELOS DE DADOS PARA INGESTÃO ---
class ProtocolInOutData(BaseModel):
    in_bytes: int = Field(alias="in")
    out_bytes: int = Field(alias="out")
class ClientData(BaseModel):
    in_bytes: int
    out_bytes: int
    protocols: Dict[str, ProtocolInOutData]
class TrafficPayload(BaseModel):
    host: str
    iface: Optional[str] = None
    server_ip: Optional[str] = None
    window_start: int
    window_end: int
    clients: Dict[str, ClientData]


# --- SEÇÃO 2: ARMAZENAMENTO DE DADOS EM MEMÓRIA ---
class TrafficDataStore:
    def __init__(self):
        self._latest_clients_data: Optional[Dict[str, ClientData]] = None
        self._lock = threading.Lock()
    def update_data(self, new_clients_data: Dict[str, ClientData]):
        with self._lock:
            logging.info(f"{len(new_clients_data)} clientes recebidos e armazenados.")
            self._latest_clients_data = new_clients_data
    def get_data(self) -> Optional[Dict[str, ClientData]]:
        with self._lock:
            return self._latest_clients_data.copy() if self._latest_clients_data else None
data_store = TrafficDataStore()


# --- SEÇÃO 3: INICIALIZAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI(
    title="Dashboard de Tráfego de Servidor - API",
    description="API RESTful que recebe dados do `network_analyzer` e os fornece para um dashboard de visualização.",
    version="2.5.0", # Versão atualizada
    contact={ "name": "Equipe Backend", "url": "https://github.com/AlphaCompLabs/Dash_TempoReal" },
)


# --- CONFIGURAÇÃO DE CORS ---
origins = [
    "http://localhost:4200",
    "http://localhost",
    "http://127.0.0.1:4200",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- SEÇÃO 4: MODELOS DE DADOS PARA CONSUMO (CONTRATO COM O FRONTEND) ---
class ClientTrafficSummary(BaseModel):
    ip: str
    inbound: int
    outbound: int

# ▼▼▼ ALTERAÇÃO IMPORTANTE AQUI ▼▼▼
class ProtocolDrilldown(BaseModel):
    """Modelo de resposta para o gráfico de drill down (tráfego por protocolo)."""
    name: str
    inbound: int  # Adicionado para permitir o filtro no frontend
    outbound: int # Adicionado para permitir o filtro no frontend
    y: int        # Mantemos o total (inbound + outbound) para conveniência

# --- SEÇÃO 5: ENDPOINTS DA API ---

# --- 5.1 Endpoint de Ingestão de Dados ---
@app.post("/api/ingest", status_code=204, tags=["Data Ingestion"])
def receive_traffic_data(payload: TrafficPayload):
    try:
        # A linha de depuração pode ser comentada ou removida em produção
        # logging.info(f"PAYLOAD BRUTO RECEBIDO: {payload.model_dump_json(indent=2)}")
        data_store.update_data(payload.clients)
        return Response(status_code=204)
    except Exception as e:
        logging.error(f"Erro inesperado ao armazenar dados: {e}", exc_info=True)
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno no servidor.")

# --- 5.2 Endpoints de Consumo de Dados (para o Frontend) ---
@app.get("/api/traffic", response_model=List[ClientTrafficSummary], tags=["Data Consumption"])
def get_main_traffic_data():
    latest_clients = data_store.get_data()
    if not latest_clients:
        return []
    response_data = [
        ClientTrafficSummary(ip=ip, inbound=data.in_bytes, outbound=data.out_bytes)
        for ip, data in latest_clients.items()
    ]
    return response_data

@app.get("/api/traffic/{client_ip}/protocols", response_model=List[ProtocolDrilldown], tags=["Data Consumption"])
def get_protocol_drilldown_data(client_ip: str):
    latest_clients = data_store.get_data()
    if not latest_clients or client_ip not in latest_clients:
        raise HTTPException(status_code=404, detail=f"O IP '{client_ip}' não foi encontrado.")

    client_protocols = latest_clients[client_ip].protocols

    # Transforma os dados para incluir inbound, outbound e o total (y).
    response_data = [
        ProtocolDrilldown(
            name=protocol,
            inbound=data.in_bytes,
            outbound=data.out_bytes,
            y=(data.in_bytes + data.out_bytes)
        )
        for protocol, data in client_protocols.items()
    ]
    return response_data