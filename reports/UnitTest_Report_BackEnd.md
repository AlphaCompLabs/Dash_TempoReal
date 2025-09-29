# Relatório de Execução de Testes Unitários - Backend
### Projeto: Dashboard de Análise de Tráfego de Servidor em Tempo Real
### Ferramenta de Teste: Pytest
### Data da Execução: 29 de Setembro de 2025
### Alvo dos Testes: tests/test_Unitário.py

1. Resumo Executivo
A suíte de testes unitários automatizados para o backend foi executada com sucesso. O objetivo foi validar a lógica de negócio da API, incluindo a ingestão de dados, a recuperação de informações, e o tratamento de casos de borda (edge cases), como a consulta a IPs inexistentes ou a um sistema sem dados.

Resultado Geral: 100% de Aprovação. Todos os 4 testes implementados passaram, confirmando que a API se comporta conforme o esperado e que a lógica de manipulação de dados está robusta e correta.

2. Resultados Detalhados da Execução
Abaixo está o output completo gerado pelo Pytest durante a execução da suíte de testes.
```
======================================================================================= test session starts =======================================================================================
platform win32 -- Python 3.12.10, pytest-8.4.2, pluggy-1.6.0 -- C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\servidores_teste\venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API
plugins: anyio-4.10.0
collected 4 items

tests/test_Unitário.py::test_ingest_and_get_traffic_data PASSED                                                                                                                              [ 25%]
tests/test_Unitário.py::test_get_protocol_drilldown_data PASSED                                                                                             [ 50%]
tests/test_Unitário.py::test_get_traffic_when_empty PASSED                                                                                                                                   [ 75%]
tests/test_Unitário.py::test_get_protocol_for_nonexistent_client PASSED                                                                                                                     [100%]

======================================================================================== warnings summary =========================================================================================
... (PytestCacheWarning sobre permissões do OneDrive) ...
================================================================================== 4 passed, 1 warning in 0.62s ===================================================================================
```

3. Análise dos Resultados
Testes Aprovados (4 passed): Todos os cenários de teste definidos foram executados e passaram com sucesso. Isto valida que:

O endpoint /api/ingest recebe e processa os dados corretamente.

O endpoint /api/traffic retorna a lista de clientes formatada como esperado.

O endpoint de drilldown (/api/traffic/{client_ip}/protocols) funciona para IPs válidos.

A API lida corretamente com cenários de erro, como a busca por um IP inexistente (retornando 404) e a consulta ao sistema sem dados (retornando uma lista vazia).

Avisos (1 warning): O único aviso exibido é de natureza informativa (PytestCacheWarning) e está relacionado à incapacidade de criar uma pasta de cache devido a permissões do OneDrive. Este aviso não impacta a validade ou o sucesso dos resultados dos testes.

4. Conclusão
A suíte de testes unitários confirmou que o backend da aplicação é funcional, robusto e está a funcionar de acordo com os requisitos. A aprovação em todos os testes demonstra a alta qualidade do código e cumpre o critério de avaliação para a pontuação extra do projeto.