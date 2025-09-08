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