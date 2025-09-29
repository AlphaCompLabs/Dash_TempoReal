# =====================================================================================
# SERVIDOR BACKEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.8.0 (Refatorado para Lifespan Events)
#
# Autor: Equipe Backend - Diogo Freitas e Gustavo Martins
# Descrição: Esta versão moderniza o código, substituindo o decorador obsoleto
#            `@app.on_event("startup")` pelo novo gerenciador de `lifespan`,
#            conforme recomendado pela documentação do FastAPI.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

import threading
import time
from typing import Dict, List, Optional
import logging
import socket
from contextlib import asynccontextmanager 
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, Field
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- SEÇÃO 1: MODELOS DE DADOS PARA INGESTÃO ---
# (Nenhuma alteração nesta seção)
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
    
class GlobalProtocolSummary(BaseModel):
    name: str
    y: int

# --- SEÇÃO 2: ARMAZENAMENTO DE DADOS EM MEMÓRIA --- 
# (Nenhuma alteração nesta seção)
class TimestampedClientData(BaseModel):
    data: ClientData
    last_seen: float = Field(default_factory=time.time)

class TrafficDataStore:
    # ... (A classe TrafficDataStore continua exatamente igual)
    def __init__(self, timeout_seconds: int = 15):
        self.CLIENT_TIMEOUT_SECONDS = timeout_seconds
        self._clients_data: Dict[str, TimestampedClientData] = {}
        self._lock = threading.Lock()
        logging.info(f"Gerenciador de estado iniciado. Timeout de cliente definido para {self.CLIENT_TIMEOUT_SECONDS} segundos.")
    def update_data(self, new_clients_data: Dict[str, ClientData]):
        with self._lock:
            now = time.time()
            for ip, client_data in new_clients_data.items():
                self._clients_data[ip] = TimestampedClientData(data=client_data, last_seen=now)
            logging.info(f"{len(new_clients_data)} clientes recebidos/atualizados.")
    def cleanup_inactive_clients(self):
        with self._lock:
            now = time.time()
            inactive_ips = [
                ip for ip, ts_data in self._clients_data.items()
                if now - ts_data.last_seen > self.CLIENT_TIMEOUT_SECONDS
            ]
            if inactive_ips:
                for ip in inactive_ips:
                    del self._clients_data[ip]
                logging.info(f"Clientes inativos removidos: {', '.join(inactive_ips)}")
    def get_data(self) -> Dict[str, ClientData]:
        with self._lock:
            return {ip: ts_data.data for ip, ts_data in self._clients_data.items()}
    def clear(self):
        with self._lock:
            self._clients_data.clear()
            logging.info("Armazenamento de dados de tráfego limpo para teste.")

data_store = TrafficDataStore(timeout_seconds=15)

def run_cleanup_task():
    while True:
        time.sleep(data_store.CLIENT_TIMEOUT_SECONDS / 2)
        try:
            data_store.cleanup_inactive_clients()
        except Exception as e:
            logging.error(f"Erro na tarefa de limpeza de clientes: {e}", exc_info=True)

def clear_traffic_data():
    data_store.clear()

# --- SEÇÃO 3: INICIALIZAÇÃO DA APLICAÇÃO FASTAPI (REFATORADO) ---

# CRIA A FUNÇÃO LIFESPAN
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código a ser executado na inicialização (startup)
    cleanup_thread = threading.Thread(target=run_cleanup_task, daemon=True)
    cleanup_thread.start()
    logging.info("Tarefa de limpeza de clientes inativos iniciada em segundo plano.")
    
    yield # A aplicação fica "viva" aqui
    
    # Código a ser executado na finalização (shutdown) - opcional
    logging.info("Servidor a finalizar. Tarefa de limpeza será encerrada.")

app = FastAPI(
    title="Dashboard de Tráfego de Servidor - API",
    description="API RESTful que recebe dados do `network_analyzer` e os fornece para um dashboard de visualização.",
    version="2.8.0",
    contact={ "name": "Equipe Backend", "url": "https://github.com/AlphaCompLabs/Dash_TempoReal" },
    lifespan=lifespan # REGISTRA A FUNÇÃO LIFESPAN
)

# --- CONFIGURAÇÃO DE CORS ---
# (Nenhuma alteração nesta seção)
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
# (Nenhuma alteração nesta seção)
class ClientTrafficSummary(BaseModel):
    ip: str
    inbound: int
    outbound: int

# ▼▼▼ ALTERAÇÃO IMPORTANTE AQUI ▼▼▼
class ProtocolDrilldown(BaseModel):
    name: str
    inbound: int
    outbound: int
    y: int

# --- SEÇÃO 5: ENDPOINTS DA API ---
# (Nenhuma alteração nesta seção)
@app.post("/api/ingest", status_code=204, tags=["Data Ingestion"])
def receive_traffic_data(payload: TrafficPayload):
    try:
        data_store.update_data(payload.clients)
        return Response(status_code=204)
    except Exception as e:
        logging.error(f"Erro inesperado ao armazenar dados: {e}", exc_info=True)
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno no servidor.")

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

@app.get("/api/traffic/protocols/summary", response_model=List[GlobalProtocolSummary], tags=["Data Consumption"])
def get_global_protocol_summary():
    latest_clients = data_store.get_data()
    protocol_summary: Dict[str, int] = {}
    for client_data in latest_clients.values():
        for protocol_name, protocol_data in client_data.protocols.items():
            total_bytes = protocol_data.in_bytes + protocol_data.out_bytes
            protocol_summary[protocol_name] = protocol_summary.get(protocol_name, 0) + total_bytes
    response_data = [
        GlobalProtocolSummary(name=name, y=total_traffic)
        for name, total_traffic in protocol_summary.items()
    ]
    return response_data

# --- 5.3 Função para descobrir o IP local ---
def get_lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

@app.get("/api/server-info")
def get_server_info():
    lan_ip = get_lan_ip()
    return {"server_ip": lan_ip}
