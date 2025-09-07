# Backend RESTful (Provisório com Dados Simulados)

Este é um servidor de backend temporário para o projeto de Dashboard de Análise de Tráfego.

**Objetivo:** Simular o `network_analyzer` gerando dados de tráfego aleatórios a cada 5 segundos e servi-los através de uma API RESTful para que a equipe de frontend possa desenvolver e testar a interface do usuário.

---

### Como Funciona

O código em `main.py` é dividido em quatro partes principais:
1.  **Modelos Pydantic:** Definem a estrutura esperada dos dados, garantindo que a API seja robusta e bem documentada.
2.  **Armazenamento em Memória (`TrafficDataStore`):** Uma classe simples que guarda o último conjunto de dados de tráfego recebido, de forma segura contra conflitos.
3.  **Simulador de Dados:** Uma tarefa de fundo (`background task`) que gera novos dados de tráfego a cada 5 segundos e atualiza o armazenamento, imitando o comportamento do `network_analyzer`.
4.  **Endpoints da API:** As rotas HTTP (`/api/...`) que o frontend irá chamar para obter os dados.

---

### Guia de Instalação e Execução

**1. Preparação do Ambiente**

- Crie um ambiente virtual para isolar as dependências:
  ```bash
  python -m venv venv
  ```
- Ative o ambiente virtual clique no executável dentro da pasta:
  - **Windows:** `.\venv\Scripts\activate`
  - **macOS/Linux:** `source venv/bin/activate`
- Instale as dependências necessárias:
  ```bash
  pip install -r requirements.txt
  ```

**2. Iniciando o Servidor**

- Com o ambiente virtual ativado, execute o seguinte comando:
  ```bash
  uvicorn main:app --reload
  ```
- O servidor estará disponível em `http://127.0.0.1:8000`.

---

### Como Testar os Endpoints

A maneira mais fácil e completa de testar é usando a documentação interativa gerada automaticamente pelo FastAPI.

1.  **Inicie o servidor.**
2.  **Abra seu navegador** e acesse a URL: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
3.  **Explore os Endpoints:**
    - Clique em `GET /api/traffic` -> "Try it out" -> "Execute" para ver os dados do gráfico principal.
    - Clique em `GET /api/traffic/{client_ip}/protocols` -> "Try it out" -> Digite um IP (ex: `192.168.1.55`) -> "Execute" para ver os dados do drill down.