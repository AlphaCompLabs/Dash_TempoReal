from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import datetime
import random
import json
from contextlib import asynccontextmanager

#Versão 3.0.2 - Com tratamento de erros

# --- Definições ---

class GerenciadorDeConexoes:
    def __init__(self):
        # A lista de conexões ativas.
        self.conexoes_ativas: list[WebSocket] = []

    async def conectar(self, websocket: WebSocket):
        """Conecta um novo cliente e o adiciona à lista."""
        try:
            await websocket.accept()
            self.conexoes_ativas.append(websocket)
        except Exception as e:
            print(f"Erro ao conectar cliente: {e}")

    def desconectar(self, websocket: WebSocket):
        """Remove um cliente da lista.
        
        'try-except' para evitar erros caso o cliente já tenha sido
        removido por algum outro motivo, como uma desconexão brusca.
        """
        try:
            self.conexoes_ativas.remove(websocket)
        except ValueError:
            print(f"Aviso: Tentativa de remover um cliente que já não estava na lista.")

    async def transmissao(self, message: str):
        """Transmite uma mensagem para todos os clientes ativos.

        Cada transmissão é envolvida em um 'try-except' para garantir que,
        se um cliente se desconectar durante o loop, a transmissão para os
        outros clientes não seja interrompida.
        """
        conexoes_para_remover = []
        for conexao in self.conexoes_ativas:
            try:
                await conexao.send_text(message)
            except WebSocketDisconnect:
                # O cliente se desconectou. Adicionamos a conexão à lista de remoção.
                print("Cliente desconectado durante a transmissão.")
                conexoes_para_remover.append(conexao)
            except RuntimeError as e:
                # Outros erros de runtime, como soquete fechado.
                print(f"Erro de runtime ao enviar mensagem: {e}")
                conexoes_para_remover.append(conexao)
            except Exception as e:
                # Qualquer outra exceção inesperada.
                print(f"Erro inesperado durante a transmissão: {e}")
                conexoes_para_remover.append(conexao)
        
        # Remove as conexões que falharam após o loop.
        for conexao in conexoes_para_remover:
            self.conexoes_ativas.remove(conexao)

gerenciador = GerenciadorDeConexoes()

async def transmissao_periodica():
    """Tarefa em segundo plano que gera e envia dados periodicamente."""
    while True:
        try:
            mock_data = {
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
                        "client_ip": "10.0.0.12",
                        "inbound_bytes": random.randint(100, 500),
                        "outbound_bytes": random.randint(100, 500),
                        "protocols": {"UDP": random.randint(200, 1000)}
                    }
                ]
            }
            await gerenciador.transmissao(json.dumps(mock_data))
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Erro na tarefa de transmissão periódica: {e}")
            # Se ocorrer um erro, o loop continua para tentar novamente.
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Servidor iniciando... transmissão em segundo plano ativada.")
    task = asyncio.create_task(transmissao_periodica())
    yield
    print("Servidor desligando... cancelando tarefas.")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Tarefa de transmissão cancelada com sucesso.")
    except Exception as e:
        print(f"Erro ao cancelar a tarefa: {e}")

# --- Instância do App ---

app = FastAPI(lifespan=lifespan)

# --- Rotas (Endpoints) ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await gerenciador.conectar(websocket)
    print(f"Nova conexão. Total de clientes: {len(gerenciador.conexoes_ativas)}")
    try:
        # Mantém a conexão viva para receber transmissões .
        # 'try-except' genérico para capturar qualquer falha inesperada.
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Cliente desconectado via WebSocketDisconnect.")
    except Exception as e:
        print(f"Erro inesperado no endpoint WebSocket: {e}")
    finally:
        gerenciador.desconectar(websocket) 
        print(f"Cliente desconectado. Total de clientes: {len(gerenciador.conexoes_ativas)}")
