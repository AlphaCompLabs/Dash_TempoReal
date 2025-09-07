Backend 
1° Passo Baixar dependencias do requirements.txt
pip install -r .\requirements.txt

2° Passo Teste do Servidor:
- IP Servidor Test: http://127.0.0.1:8000 
- Iniciar o uvicorn: python -m uvicorn BackEnd.main:app --reload
- // Colar no Console depois de escrever (allow pasting):
- const ws = new WebSocket("ws://127.0.0.1:8000/ws");

ws.onmessage = function(event) {
    console.log("Mensagem recebida do servidor:", JSON.parse(event.data));
};

ws.onopen = function() {
    console.log("Conexão WebSocket estabelecida com sucesso!");
};

ws.onerror = function(error) {
    console.error("Erro na conexão WebSocket:", error);
};

console.log("Tentando conectar ao WebSocket...");

//
