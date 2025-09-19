import asyncio
import random
import threading
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# --- 1. Modelos de Dados (Contrato da API) ---
# Usar Pydantic para definir a estrutura dos dados é uma das melhores práticas
# do FastAPI. Garante validação automática e documentação clara.

class ProtocolData(BaseModel):
    """ Representa o total de bytes para um único protocolo. """
    # Exemplo: {"TCP": 16194}
    # Usamos um Dict[str, int] para permitir nomes de protocolos flexíveis (TCP, UDP, etc.)
    # o ... como primeiro argumento do Field indica que o campo é obrigatório
    protocols: Dict[str, int] = Field(..., example={"TCP": 15000, "UDP": 250})

class ClientData(BaseModel):
    """ Agrega todos os dados de tráfego para um único cliente. """
    in_bytes: int = Field(..., description="Total de bytes recebidos do cliente.", example=1024)
    out_bytes: int = Field(..., description="Total de bytes enviados para o cliente.", example=20480)
    # O Pydantic irá validar que o campo 'protocols' segue a estrutura que definimos em ProtocolData
    protocols: Dict[str, int] = Field(..., example={"TCP": 21504})
    
class TrafficPayload(BaseModel):
    """
    Representa o payload completo que o 'network_analyzer' nos enviará.
    Este é o modelo que validará os dados recebidos no endpoint POST.
    """
    clients: Dict[str, ClientData] = Field(..., description="Dicionário de clientes, onde a chave é o IP.")

# --- 2. Armazenamento Seguro em Memória (Singleton Pattern) ---
# Esta classe guardará o último payload recebido.
# Usar uma classe em vez de uma variável global é mais limpo e organizado.

class TrafficDataStore:
    """
    Classe para armazenar o último dado de tráfego recebido de forma segura.
    Funciona como um 'singleton', uma única instância compartilhada na aplicação.
    """
    def __init__(self):
        self._latest_data: Optional[TrafficPayload] = None
        # O Lock é crucial para evitar 'race conditions'. Ele garante que apenas
        # uma thread (ou requisição) possa modificar ou ler os dados por vez,
        # prevenindo corrupção de dados em ambientes assíncronos.
        self._lock = threading.Lock()

    def update_data(self, new_data: TrafficPayload):
        """ Atualiza os dados armazenados com o novo payload. """
        # O 'with self._lock:' adquire o lock antes de entrar no bloco
        # e o libera automaticamente ao sair, mesmo que ocorram erros.
        with self._lock:
            print("INFO: Novos dados recebidos e armazenados.")
            self._latest_data = new_data

    def get_data(self) -> Optional[TrafficPayload]:
        """ Retorna uma cópia segura dos últimos dados armazenados. """
        with self._lock:
            # Retornamos uma cópia para que modificações externas não afetem
            # o dado original armazenado, um princípio de encapsulamento.
            return self._latest_data.copy(deep=True) if self._latest_data else None

# Instanciamos o nosso armazenamento. Esta única instância será usada por toda a aplicação.
data_store = TrafficDataStore()

# --- 3. Simulador do Network Analyzer ---
# Esta função cria dados aleatórios e os insere no nosso data_store,
# simulando o POST que viria do serviço 'network_analyzer'.

async def generate_and_store_mock_data():
    """ Gera dados de tráfego aleatórios e os armazena. """
    # Lista de IPs e protocolos para gerar dados mais variados
    mock_clients = {
        "192.168.1.50": "TCP",
        "192.168.1.55": "TCP",
        "10.0.0.12": "UDP",
        "172.16.0.8": "ICMP"
    }
    
    clients_data = {}
    for ip, proto in mock_clients.items():
        # Gera valores aleatórios para cada cliente
        in_bytes = random.randint(100, 5000)
        out_bytes = random.randint(5000, 50000)
        total_bytes = in_bytes + out_bytes
        
        clients_data[ip] = ClientData(
            in_bytes=in_bytes,
            out_bytes=out_bytes,
            protocols={proto: total_bytes}
        )
    
    # Monta o payload final no formato esperado
    mock_payload = TrafficPayload(clients=clients_data)
    
    # Armazena os dados gerados
    data_store.update_data(mock_payload)

async def periodic_mock_data_generator():
    """ Roda a geração de dados em um loop infinito a cada 5 segundos. """
    print("INFO: Iniciando o gerador de dados simulados em background...")
    while True:
        await generate_and_store_mock_data()
        await asyncio.sleep(5)

# --- Configuração da Aplicação FastAPI ---
# O 'lifespan' é o gerenciador de ciclo de vida do FastAPI.
# É o local ideal para iniciar e parar tarefas de fundo.

background_task = None

async def lifespan(app: FastAPI):
    # O código aqui executa QUANDO A APLICAÇÃO INICIA
    global background_task
    loop = asyncio.get_event_loop()
    # Criamos a tarefa que rodará em segundo plano
    background_task = loop.create_task(periodic_mock_data_generator())
    yield
    # O código aqui executa QUANDO A APLICAÇÃO TERMINA (ex: com Ctrl+C)
    print("INFO: Encerrando a aplicação e a tarefa de fundo.")
    background_task.cancel() # Cancela a tarefa de forma limpa

app = FastAPI(lifespan=lifespan)

# --- 4. Endpoints da API (Interface com o Mundo Externo) ---

# --- Passo 2: Endpoint para RECEBER dados ---
@app.post("/api/traffic-data", status_code=204)
def receive_traffic_data(payload: TrafficPayload):
    """
    Recebe os dados de tráfego do 'network_analyzer' e os armazena.
    Este endpoint será usado pelo serviço real no futuro.
    Retorna 204 No Content em caso de sucesso, uma prática comum para endpoints
    que recebem dados mas não precisam retornar nada no corpo da resposta.
    """
    data_store.update_data(payload)
    # Não retornamos nada, apenas o status code 204.
    return

# --- Passo 4: Endpoints para FORNECER dados ao Frontend ---

# Modelos de Resposta: É uma boa prática definir modelos específicos para as respostas,
# pois nem sempre o formato da resposta é igual ao formato armazenado.
class ClientTrafficSummary(BaseModel):
    ip: str
    inbound: int
    outbound: int

class ProtocolDrilldown(BaseModel):
    name: str
    y: int

@app.get("/api/traffic", response_model=List[ClientTrafficSummary])
def get_main_traffic_data():
    """
    Fornece os dados agregados de tráfego (inbound/outbound) para cada cliente.
    Este endpoint alimenta o gráfico principal do dashboard.
    """
    latest_data = data_store.get_data()
    if not latest_data:
        # Se ainda não recebemos dados, retornamos uma lista vazia.
        # Levantar um erro 404 aqui poderia ser uma alternativa, mas uma
        # lista vazia é mais amigável para o frontend.
        return []

    # Transformação dos dados: Convertendo do formato de armazenamento para o
    # formato que o frontend espera (uma lista de objetos).
    # Esta separação entre lógica interna e formato de API é muito importante.
    response_data = []
    for ip, data in latest_data.clients.items():
        response_data.append(
            ClientTrafficSummary(ip=ip, inbound=data.in_bytes, outbound=data.out_bytes)
        )
    return response_data

@app.get("/api/traffic/{client_ip}/protocols", response_model=List[ProtocolDrilldown])
def get_protocol_drilldown_data(client_ip: str):
    """
    Fornece a quebra de tráfego por protocolo para um cliente específico.
    Alimenta o gráfico de drill down.
    """
    latest_data = data_store.get_data()
    if not latest_data or client_ip not in latest_data.clients:
        # Se o IP do cliente não for encontrado nos dados mais recentes,
        # retornamos um erro 404 Not Found, que é o código HTTP semanticamente correto.
        raise HTTPException(status_code=404, detail="Client IP not found")

    client_protocols = latest_data.clients[client_ip].protocols
    
    # Transformação para o formato esperado pelo Highcharts drilldown:
    # [{"name": "TCP", "y": 12345}, {"name": "UDP", "y": 678}]
    response_data = [
        ProtocolDrilldown(name=protocol, y=byte_count)
        for protocol, byte_count in client_protocols.items()
    ]
    
    return response_data