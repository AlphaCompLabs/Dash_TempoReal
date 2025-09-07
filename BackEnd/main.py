# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# import asyncio
# import datetime
# import random
# import json
# from contextlib import asynccontextmanager

# # --- Definições ---

# class GerenciadorDeConexoes:
#     def __init__(self):
#         self.conexoes_ativas: list[WebSocket] = []

#     async def conectar(self, websocket: WebSocket):
#         await websocket.accept()
#         self.conexoes_ativas.append(websocket)

#     def desconectar(self, websocket: WebSocket): 
#         self.conexoes_ativas.remove(websocket)
        
#     async def transmissao(self, message: str):
#         for conexao in self.conexoes_ativas:
#             await conexao.send_text(message)

# gerenciador = GerenciadorDeConexoes()

# async def transmissao_periodica():
#     while True:
#         mock_data = {
#             "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
#             "traffic_data": [
#                 {
#                     "client_ip": "192.168.1.50",
#                     "inbound_bytes": random.randint(500, 2000),
#                     "outbound_bytes": random.randint(10000, 20000),
#                     "protocols": {"TCP": random.randint(10000, 22000)}
#                 },
#                 {
#                     "client_ip": "192.168.1.55",
#                     "inbound_bytes": random.randint(8000, 12000),
#                     "outbound_bytes": random.randint(1000, 2000),
#                     "protocols": {"TCP": random.randint(9000, 14000)}
#                 },
#                 {
#                     "client_ip": "10.0.0.12",
#                     "inbound_bytes": random.randint(100, 500),
#                     "outbound_bytes": random.randint(100, 500),
#                     "protocols": {"UDP": random.randint(200, 1000)}
#                 }
#             ]
#         }

#         await gerenciador.transmissao(json.dumps(mock_data))
#         await asyncio.sleep(5)

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     print("Servidor iniciando... transmissão em segundo plano ativada.")
#     task = asyncio.create_task(transmissao_periodica())
#     yield
#     print("Servidor desligando... cancelando tarefas.")
#     task.cancel()

# # --- Instância do App ---

# app = FastAPI(lifespan=lifespan)

# # --- Rotas (Endpoints) ---

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await gerenciador.conectar(websocket)
#     print(f"Nova conexão. Total de clientes: {len(gerenciador.conexoes_ativas)}")
#     try:
#         # Mantém a conexão viva para receber broadcasts
#         while True:
#             await asyncio.sleep(1)
#     except WebSocketDisconnect:
#         gerenciador.desconectar(websocket) # <--- CORREÇÃO 1: Nome da chamada
#         print(f"Cliente desconectado. Total de clientes: {len(gerenciador.conexoes_ativas)}")

import asyncio
import datetime  # Usado para pegar a hora atual
import random    # Usado para gerar números aleatórios
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("Cliente conectado!")
    await websocket.accept()
    try:
        while True:

            # Criando o mock_data com a nova estrutura e dados dinâmicos
            mock_data = {
                # Pega a hora atual em UTC e formata como string
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "traffic_data": [
                    {
                        "client_ip": "192.168.1.50",
                        "inbound_bytes": random.randint(500, 2000),
                        "outbound_bytes": random.randint(10000, 20000),
                        "protocols": {"TCP": random.randint(10000, 22000)}
                    },
                    {
                        "client_ip": "192.168.1.55",
                        "inbound_bytes": random.randint(8000, 12000),
                        "outbound_bytes": random.randint(1000, 2000),
                        "protocols": {"TCP": random.randint(9000, 14000)}
                    },
                    {
                        # Adicionei um terceiro cliente para mais variedade
                        "client_ip": "10.0.0.12",
                        "inbound_bytes": random.randint(100, 500),
                        "outbound_bytes": random.randint(100, 500),
                        "protocols": {"UDP": random.randint(200, 1000)}
                    }
                ]
            }

            # Envia os dados para o cliente
            await websocket.send_json(mock_data)
            # Espera 5 segundos
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        print("Cliente desconectado")