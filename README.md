<<<<<<< HEAD
Ei integrante da equipe, escreva a especificação da sua aplicação aqui lindão/lindona, bom trabalho!
=======
Teste do servidor em http://127.0.0.1:8000 

Iniciar o uvicorn: python -m uvicorn BackEnd.main:app --reload


// Colar no Console depois de escrever (allow pasting):

const ws = new WebSocket("ws://127.0.0.1:8000/ws");

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
>>>>>>> a5dade2b0739023bc90a7d9e166738f36e4b64d0
