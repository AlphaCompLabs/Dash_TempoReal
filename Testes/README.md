# Testes Unitários Automatizados - API Backend
Este documento descreve como configurar e executar a suíte de testes automatizados para a API RESTful do projeto. O objetivo destes testes é garantir a confiabilidade, a corretude e a robustez do servidor backend, validando o comportamento de cada endpoint.

A implementação destes testes atende ao critério de avaliação de **"Testes unitários automatizados"**, contribuindo para a nota máxima do projeto.

## 🛠️ Ferramentas Utilizadas
**Pytest:** O framework utilizado como executor dos testes. Ele é responsável por encontrar, executar os testes e gerar os relatórios.

**FastAPI TestClient:** Uma ferramenta fornecida pelo FastAPI que nos permite fazer requisições HTTP à nossa API diretamente em memória, sem a necessidade de rodar um servidor web real. Isso torna os testes extremamente rápidos e isolados.

**HTTPX:** A biblioteca que o `TestClient` usa por baixo dos panos para fazer as requisições assíncronas.

## ⚙️ Configuração do Ambiente de Teste
Para executar os testes, siga os passos abaixo. É crucial que o **ambiente virtual `(venv)`** esteja ativo para garantir que todas as dependências corretas sejam utilizadas.

1. **Navegue até a Pasta Raiz do Projeto:**
Abra um terminal e certifique-se de que você está na pasta principal do projeto (a pasta que contém as subpastas `BackEnd` e `Testes`).

2. Ative o Ambiente Virtual:
```
Se estiver usando PowerShell (padrão do VS Code)
.\venv\Scripts\activate

Se estiver usando Command Prompt (CMD)
venv\Scripts\activate
```

Você deverá ver o ```(venv)``` aparecer no início do prompt do seu terminal.

3. **Instale as Dependências (se ainda não o fez):**
Garanta que todas as dependências do projeto, incluindo as de teste, estejam instaladas no seu ambiente virtual.
```
pip install -r requirements.txt
```
## 🚀 Como Executar os Testes
Com o ambiente virtual ativo e na pasta raiz do projeto, execute o seguinte comando:
```
pytest
```
O `pytest` irá descobrir e executar automaticamente todos os testes localizados na pasta `Testes/`. Ao final, ele apresentará um resumo dos resultados. Para uma saída mais detalhada, você pode usar a flag `-v`:
```
pytest -v
```
## ✅ Validações Realizadas
A suíte de testes atual `(test_api.py)` foca em validar os "contratos" e a lógica principal da nossa API.

1. **Fluxo Principal de Ingestão e Consumo `(test_ingest_and_get_traffic_data)`**
- **O quê:** Simula o `network_analyzer` enviando um payload de dados válido para o endpoint `POST /api/ingest`.

- **Validação:** Em seguida, faz uma requisição `GET /api/traffic` e verifica se:

    - A resposta tem o status `200 OK`.

    - O corpo da resposta é uma lista.

    - O número de clientes na resposta corresponde ao que foi enviado.

    - Os valores de `inbound` e `outbound` para cada cliente estão corretos.

2. **Funcionalidade de Drill Down (`test_get_protocol_drilldown_data`)**
- **O quê:** Simula um clique do usuário no dashboard, fazendo uma requisição ao endpoint GET /api/traffic/{client_ip}/protocols para um IP específico.

- **Validação:** Verifica se:

    - A resposta tem o status `200 OK`.

     O corpo da resposta é uma lista.

    - Os dados de protocolo estão formatados corretamente (`name` e `y`).

    - O valor y (tráfego total) para cada protocolo foi somado corretamente (`in_bytes + out_bytes`).

3. **Caminhos de Erro (Testes de Robustez)**
- **O quê**: Testa como a API se comporta em cenários de erro.

- **Validação** (`test_get_drilldown_for_nonexistent_ip`): Tenta buscar o drill down para um IP que não existe e verifica se a API retorna corretamente um erro `404 Not Found`.


TESTE REALIZADO NO DIA 29/09/2025:

 ======================================================================================= test session starts =======================================================================================
platform win32 -- Python 3.12.10, pytest-8.4.2, pluggy-1.6.0 -- C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\servidores_teste\venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API
plugins: anyio-4.10.0
collected 4 items                                                                                                                                                                                  

tests/test_Unitário.py::test_ingest_and_get_traffic_data PASSED                                                                                                                              [ 25%]
tests/test_Unitário.py::test_get_protocol_drilldown_data PASSED                                                                                                                              [ 50%]
tests/test_Unitário.py::test_get_traffic_when_empty PASSED                                                                                                                                   [ 75%]
tests/test_Unitário.py::test_get_protocol_for_nonexistent_client PASSED                                                                                                                      [100%]

======================================================================================== warnings summary =========================================================================================
BackEnd_RESTful\main.py:138
  C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\BackEnd_RESTful\main.py:138: DeprecationWarning: 
          on_event is deprecated, use lifespan event handlers instead.
  
          Read more about it in the
          [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).

    @app.on_event("startup")

servidores_teste\venv\Lib\site-packages\fastapi\applications.py:4495
  C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\servidores_teste\venv\Lib\site-packages\fastapi\applications.py:4495: DeprecationWarning:
          on_event is deprecated, use lifespan event handlers instead.

          Read more about it in the
          [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).

    return self.router.on_event(event_type)

servidores_teste\venv\Lib\site-packages\_pytest\cacheprovider.py:475
  C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\servidores_teste\venv\Lib\site-packages\_pytest\cacheprovider.py:475: PytestCacheWarning: could not create cache path C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\.pytest_cache\v\cache\nodeids: [WinError 5] Acesso negado: 'C:\\Users\\diogo\\OneDrive\\Área de Trabalho\\Back-End_API\\.pytest_cache\\v\\cache'
    config.cache.set("cache/nodeids", sorted(self.cached_nodeids))

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
================================================================================== 4 passed, 3 warnings in 0.48s ================================================================================== 
