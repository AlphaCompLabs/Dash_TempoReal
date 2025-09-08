# 🚀 Backend do Dashboard de Tráfego de Rede

Bem-vindo ao backend do nosso projeto! Este serviço, construído com FastAPI, é o coração do nosso sistema de monitoramento. Ele recebe dados em tempo real do `network_analyzer` e os disponibiliza para o frontend através de uma API RESTful moderna e bem documentada.

### Arquitetura de Dados
O fluxo de dados do sistema é simples e robusto:

`[Network Analyzer]` ➔ `POST /api/ingest` ➔ `[Backend API]` ➔ `GET /api/traffic` ➔ `[Frontend]`

---

## ✨ Começando em 3 Passos

Siga este guia para configurar e executar o backend em poucos minutos.

### **Passo 1: Preparação do Ambiente**

Vamos preparar um ambiente Python limpo e isolado para o projeto.

1.  **Crie um Ambiente Virtual:**
    Abra o terminal na pasta do projeto e execute:
    ```bash
    python -m venv venv
    ```

2.  **Ative o Ambiente Virtual:**
    - No **Windows**:
      ```bash
      .\venv\Scripts\activate
      ```
    - No **macOS / Linux**:
      ```bash
      source venv/bin/activate
      ```
    *(Seu terminal agora deve exibir `(venv)` no início da linha.)*

3.  **Instale as Dependências:**
    ```bash
    pip install -r requirements.txt
    ```

### **Passo 2: Executando o Sistema**

Para que o dashboard funcione, tanto o **Backend** quanto o **Network Analyzer** precisam estar rodando ao mesmo tempo. Você precisará de **dois terminais**.

**🖥️ No Terminal 1 - Inicie o Backend:**
Com o ambiente virtual ativado, inicie o servidor da API.
```bash
uvicorn main:app --reload
```
> O backend estará rodando em `http://127.0.0.1:8000` e aguardando dados.

**📡 No Terminal 2 - Inicie o Network Analyzer:**
Navegue até a pasta do `network_analyzer` e execute-o, apontando para a URL do seu backend.
```bash
python .\main.py --server-ip <Seu IP> --iface "Ethernet" --interval 5 --post "http://localhost:8000/api/ingest"
```
> Agora, o `network_analyzer` está enviando dados para o seu backend a cada 5 segundos! Você verá logs aparecendo no terminal do backend.

### **Passo 3: Testando a API**

A melhor forma de explorar e testar a API é através da documentação interativa (Swagger UI) que o FastAPI gera automaticamente.

1.  **Abra o Navegador:**
    Acesse a URL [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

2.  **Explore os Endpoints de Consumo:**
    - Clique na rota `GET /api/traffic` e depois em "Try it out" > "Execute". Você verá os dados que o frontend usará no gráfico principal.
    - Faça o mesmo com `GET /api/traffic/{client_ip}/protocols` para testar os dados de drill down.

---

## 📖 Referência Rápida da API

| Método | Endpoint                               | Descrição                                                                         |
| :----- | :------------------------------------- | :-------------------------------------------------------------------------------- |
| `POST` | `/api/ingest`                          | **Recebe** dados do `network_analyzer`. Usado internamente pelo sistema.          |
| `GET`  | `/api/traffic`                         | **Fornece** a lista de tráfego agregado por cliente para o gráfico principal.     |
| `GET`  | `/api/traffic/{client_ip}/protocols`   | **Fornece** a quebra de tráfego por protocolo para o gráfico de drill down.       |