# =====================================================================================
# SERVIDOR BACKEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 2.7.0 (com endpoint dedicado para o top_protocol)
#
# Autor: Equipe Backend - Diogo Freitas e Gustavo Martins
# Descrição: Este script implementa uma API RESTful com FastAPI. Esta versão
#            adiciona um mecanismo de timeout para remover clientes inativos
#            automaticamente, garantindo que o dashboard reflita o estado atual.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

import threading
import time
from typing import Dict, List, Optional
import logging
import socket

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
    
class GlobalProtocolSummary(BaseModel):
    name: str
    y: int


# --- SEÇÃO 2: ARMAZENAMENTO DE DADOS EM MEMÓRIA --- ▼▼▼ MODIFICADO ▼▼▼

# Estrutura para guardar dados do cliente com timestamp
class TimestampedClientData(BaseModel):
    data: ClientData
    last_seen: float = Field(default_factory=time.time)

class TrafficDataStore:
    """
    Armazena e gerencia os dados de tráfego, incluindo um mecanismo de timeout
    para clientes inativos.
    """
    def __init__(self, timeout_seconds: int = 5):
        # O timeout define quanto tempo um cliente pode ficar sem enviar dados antes de ser considerado inativo.
        # Um bom valor é 2 a 3 vezes o intervalo de envio do seu script de captura.
        self.CLIENT_TIMEOUT_SECONDS = timeout_seconds
        self._clients_data: Dict[str, TimestampedClientData] = {}
        self._lock = threading.Lock()
        logging.info(f"Gerenciador de estado iniciado. Timeout de cliente definido para {self.CLIENT_TIMEOUT_SECONDS} segundos.")

    def update_data(self, new_clients_data: Dict[str, ClientData]):
        """
        Atualiza os dados dos clientes existentes ou adiciona novos.
        Em vez de substituir, esta função faz um "merge" e atualiza o timestamp 'last_seen'.
        """
        with self._lock:
            now = time.time()
            for ip, client_data in new_clients_data.items():
                self._clients_data[ip] = TimestampedClientData(data=client_data, last_seen=now)
            logging.info(f"{len(new_clients_data)} clientes recebidos/atualizados.")

    def cleanup_inactive_clients(self):
        """
        Verifica e remove clientes que não são vistos há mais tempo que o timeout definido.
        """
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
        """
        Retorna uma cópia dos dados dos clientes atualmente ativos.
        """
        with self._lock:
            # Retorna apenas os dados, sem o timestamp, para manter o contrato com o resto da API
            return {ip: ts_data.data for ip, ts_data in self._clients_data.items()}

# Instancia o data_store. Se seu script de captura envia dados a cada 5 segundos, um timeout de 15 é uma boa escolha.
data_store = TrafficDataStore(timeout_seconds=15)

# Função para a tarefa de limpeza em segundo plano
def run_cleanup_task():
    """Função que será executada em uma thread separada para limpeza contínua."""
    while True:
        time.sleep(data_store.CLIENT_TIMEOUT_SECONDS / 2) # Verifica na metade do tempo do timeout
        try:
            data_store.cleanup_inactive_clients()
        except Exception as e:
            logging.error(f"Erro na tarefa de limpeza de clientes: {e}", exc_info=True)


# --- SEÇÃO 3: INICIALIZAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI(
    title="Dashboard de Tráfego de Servidor - API",
    description="API RESTful que recebe dados do `network_analyzer` e os fornece para um dashboard de visualização.",
    version="2.6.0", # Versão atualizada
    contact={ "name": "Equipe Backend", "url": "https://github.com/AlphaCompLabs/Dash_TempoReal" },
)

# Evento de startup para iniciar a tarefa em segundo plano
@app.on_event("startup")
def startup_event():
    cleanup_thread = threading.Thread(target=run_cleanup_task, daemon=True)
    cleanup_thread.start()
    logging.info("Tarefa de limpeza de clientes inativos iniciada em segundo plano.")


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

class ProtocolDrilldown(BaseModel):
    name: str
    inbound: int
    outbound: int
    y: int

# --- SEÇÃO 5: ENDPOINTS DA API ---
# Nenhuma alteração necessária nesta seção, pois abstraímos a lógica no data_store

# --- 5.1 Endpoint de Ingestão de Dados ---
@app.post("/api/ingest", status_code=204, tags=["Data Ingestion"])
def receive_traffic_data(payload: TrafficPayload):
    try:
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
    """
    Agrega o tráfego de todos os clientes por protocolo e retorna um resumo global.
    """
    latest_clients = data_store.get_data()
    protocol_summary: Dict[str, int] = {}

    # 1. Itera sobre cada cliente ativo
    for client_data in latest_clients.values():
        # 2. Itera sobre os protocolos de cada cliente
        for protocol_name, protocol_data in client_data.protocols.items():
            total_bytes = protocol_data.in_bytes + protocol_data.out_bytes
            
            # 3. Soma o tráfego no nosso dicionário de resumo
            protocol_summary[protocol_name] = protocol_summary.get(protocol_name, 0) + total_bytes

    # 4. Transforma o dicionário no formato de lista que o frontend espera
    response_data = [
        GlobalProtocolSummary(name=name, y=total_traffic)
        for name, total_traffic in protocol_summary.items()
    ]

    return response_data

# --- 5.3 Função para descobrir o IP local ---
def get_lan_ip():
    # Cria um socket temporário para se conectar a um IP externo
    # Isso força o sistema operacional a revelar qual IP local ele usaria
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Não precisa ser alcançável, é só para o SO escolher uma interface
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1' # Retorna localhost em caso de erro
    finally:
        s.close()
    return IP

# Crie o novo endpoint /api/server-info
@app.get("/api/server-info")
def get_server_info():
    lan_ip = get_lan_ip()
    return {"server_ip": lan_ip}