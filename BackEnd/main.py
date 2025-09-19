# Versão Final - Integrada com a equipe de Redes

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
import json

# --- A classe GerenciadorDeConexoes continua a mesma, está perfeita ---
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
            pass # Ignora erros se a conexão já foi removida

    async def transmissao(self, message: str):
        # Itera sobre uma cópia da lista para poder remover itens com segurança
        for conexao in list(self.conexoes_ativas):
            try:
                await conexao.send_text(message)
            except (WebSocketDisconnect, RuntimeError):
                # Se o cliente desconectou ou o soquete fechou, removemos
                self.desconectar(conexao)

# --- FIM DA CLASSE -----

# Instância única do gerenciador
gerenciador = GerenciadorDeConexoes()

# Instância do FastAPI (agora sem o 'lifespan')
app = FastAPI()


# --- ENDPOINT PARA RECEBER DADOS DA EQUIPE DE REDES ---
@app.post("/api/ingest") # Ou o nome que vocês combinaram, ex: /traffic-update
async def receber_dados_de_trafego(request: Request):
    """
    Este endpoint é chamado pela equipe de Redes a cada 5 segundos.
    """
    try:
        # 1. Recebe o JSON que a equipe de Redes enviou
        dados = await request.json()

        # 2. Pede ao gerenciador para transmitir os dados para todos os dashboards
        await gerenciador.transmissao(json.dumps(dados))
        
        return {"status": "success", "message": "Dados recebidos e transmitidos."}
    
    except Exception as e:
        print(f"Erro ao processar dados recebidos: {e}")
        return {"status": "error", "message": "Falha ao processar os dados."}


# --- ROTA WEBSOCKET PARA O FRONTEND (praticamente a mesma de antes) ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await gerenciador.conectar(websocket)
    print(f"Novo dashboard conectado. Total: {len(gerenciador.conexoes_ativas)}")
    try:
        # Apenas mantém a conexão viva para receber as transmissões
        while True:
            # Espera por qualquer mensagem (ou desconexão) do cliente
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("Dashboard desconectado.")
    finally:
        gerenciador.desconectar(websocket)
        print(f"Dashboard desconectado. Total: {len(gerenciador.conexoes_ativas)}")