# Versão com documentação OpenAPI (Swagger) automática

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
import json

# --- 1. DEFINIÇÃO DOS MODELOS DE DADOS (USANDO Pydantic) ---
# Isto descreve a estrutura do JSON para o FastAPI e para a documentação.

class ProtocoloDetalhe(BaseModel):
    """Descreve o tráfego de um único protocolo."""
    in_bytes: int = Field(..., description="Bytes de entrada para este protocolo.", example=1024)
    out_bytes: int = Field(..., description="Bytes de saída para este protocolo.", example=2048)

class ClienteTrafego(BaseModel):
    """Descreve os dados de tráfego para um único cliente IP."""
    client_ip: str = Field(..., description="O endereço IP do cliente.", example="192.168.1.50")
    inbound_bytes: int = Field(..., description="Total de bytes recebidos do cliente.", example=874)
    outbound_bytes: int = Field(..., description="Total de bytes enviados para o cliente.", example=15320)
    protocols: Dict[str, int] = Field(..., description="Dicionário com o total de bytes por protocolo.", example={"TCP": 16194, "UDP": 500})

class PayloadTrafego(BaseModel):
    """O corpo (body) completo da requisição POST enviada pela equipe de Redes."""
    timestamp: str = Field(..., description="Timestamp da janela de dados em formato ISO 8601.", example="2025-09-05T23:10:25Z")
    traffic_data: List[ClienteTrafego] = Field(..., description="Uma lista com os dados de tráfego de cada cliente.")

class RespostaSucesso(BaseModel):
    """Modelo de resposta para operações bem-sucedidas."""
    status: str = Field("success", example="success")
    message: str = Field(..., example="Dados recebidos e transmitidos.")

# --- A classe GerenciadorDeConexoes continua a mesma ---
class GerenciadorDeConexoes:
    def __init__(self):
        self.conexoes_ativas: list[WebSocket] = []

    async def conectar(self, websocket: WebSocket):
        await websocket.accept()
        self.conexoes_ativas.append(websocket)

    def desconectar(self, websocket: WebSocket):
        try:
            self.conexoes_ativas.remove(websocket)
        except ValueError:
            pass

    async def transmissao(self, message: str):
        for conexao in list(self.conexoes_ativas):
            try:
                await conexao.send_text(message)
            except (WebSocketDisconnect, RuntimeError):
                self.desconectar(conexao)

gerenciador = GerenciadorDeConexoes()

# --- 2. INSTÂNCIA DO APP COM METADADOS PARA A DOCUMENTAÇÃO ---
app = FastAPI(
    title="API do Dashboard de Tráfego de Rede",
    description="Esta API recebe dados de tráfego de rede e os transmite em tempo real para dashboards conectados via WebSocket.",
    version="1.0.0",
    contact={
        "name": "Equipe Backend - AlphaCompLabs",
        "url": "https://github.com/AlphaCompLabs/Dash_TempoReal",
    },
)

# --- 3. ENDPOINTS ATUALIZADOS COM DOCUMENTAÇÃO ---

@app.post(
    "/api/ingest",
    response_model=RespostaSucesso,
    summary="Recebe e distribui dados de tráfego",
    description="Endpoint chamado pela equipe de Redes a cada 5 segundos para enviar os dados de tráfego capturados. Os dados recebidos são imediatamente transmitidos para todos os clientes WebSocket conectados."
)
async def receber_dados_de_trafego(payload: PayloadTrafego):
    """
    Recebe um payload JSON com dados de tráfego, valida sua estrutura
    e o transmite para todos os clientes conectados.
    """
    try:
        # FastAPI já validou o 'payload' contra o modelo PayloadTrafego.
        # Convertemos o objeto Pydantic de volta para um dicionário e depois para uma string JSON.
        dados_json_str = payload.model_dump_json()
        await gerenciador.transmissao(dados_json_str)
        return {"status": "success", "message": "Dados recebidos e transmitidos."}
    
    except Exception as e:
        print(f"Erro ao processar dados recebidos: {e}")
        # Em um cenário real, um erro aqui seria um 500 Internal Server Error.
        raise HTTPException(status_code=500, detail=f"Falha ao processar os dados: {e}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Endpoint WebSocket para os dashboards se conectarem.

    Uma vez conectado, o cliente não precisa enviar nenhuma mensagem. Ele apenas
    ficará "ouvindo" e receberá os dados de tráfego que são enviados pelo
    endpoint `/api/ingest` a cada 5 segundos.

    **Nota:** A documentação OpenAPI/Swagger tem suporte limitado para WebSockets,
    mas esta descrição explica o seu funcionamento.
    """
    await gerenciador.conectar(websocket)
    print(f"Novo dashboard conectado. Total: {len(gerenciador.conexoes_ativas)}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("Dashboard desconectado.")
    finally:
        gerenciador.desconectar(websocket)
        print(f"Dashboard desconectado. Total: {len(gerenciador.conexoes_ativas)}")
