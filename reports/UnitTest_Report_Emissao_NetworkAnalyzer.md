# Relatório de Testes Unitários – Módulo de Emissão (emissao.py)
### Data de Execução: 30 de Setembro de 2025

### Ferramenta de Teste: pytest 8.4.2

### Módulo Testado: emissao.py (Versão 1.1.0)

### Autor do Teste: Equipe de Redes/QA

### 1. Resumo Executivo
A suíte de testes unitários para o módulo de emissão (emissao.py) foi executada com sucesso absoluto. Todos os 6 casos de teste passaram, validando a funcionalidade central do componente, que é responsável por enviar os dados agregados para os destinos configurados.

Os resultados confirmam que a lógica de envio para endpoints HTTP (incluindo retentativas e tratamento de erros), a escrita em ficheiros locais, a saída para o terminal (stdout) e o tratamento de erros de serialização estão a funcionar conforme o esperado. O módulo é considerado estável e fiável.

### 2. Detalhes da Execução
Abaixo está o output completo da execução dos testes no terminal.
```
========================= test session starts =========================
platform win32 -- Python 3.12.10, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\Network_analyzer
plugins: mock-3.15.1
collected 6 items

tests/test_emissao.py::test_emit_to_post_success PASSED          [ 16%]
tests/test_emissao.py::test_emit_to_post_fails_with_retries PASSED [ 33%]
tests/test_emissao.py::test_emit_to_post_fails_with_http_error PASSED [ 50%]
tests/test_emissao.py::test_emit_to_file_success PASSED          [ 66%]
tests/test_emissao.py::test_emit_to_stdout_success PASSED         [ 83%]
tests/test_emissao.py::test_json_serialization_error PASSED      [100%]

========================== 6 passed in 0.05s ==========================
```
### 3. Análise dos Resultados
Todos os testes foram executados com sucesso, validando os seguintes cenários:

✅ ``test_emit_to_post_success``: Confirmou que o módulo envia corretamente um payload JSON para o endpoint da API via POST quando a conexão é bem-sucedida.

✅ ``test_emit_to_post_fails_with_retries``: Verificou que a lógica de retentativas é acionada corretamente quando ocorrem erros de rede (ex: timeout, falha de DNS).

✅ ``test_emit_to_post_fails_with_http_error``: Validou que o sistema lida com erros de servidor (ex: status 500) de forma imediata, sem tentar reenviar os dados desnecessariamente.

✅ ``test_emit_to_file_success``: Garantiu que o payload pode ser escrito com sucesso num ficheiro local.

✅ ``test_emit_to_stdout_success``: Confirmou que o payload é corretamente impresso na consola quando nenhum outro destino é especificado.

✅ ``test_json_serialization_error``: Validou que o módulo lida de forma segura com payloads que não podem ser convertidos para JSON, evitando que a aplicação quebre.

### 4. Conclusão
O módulo emissao.py passou em todos os testes unitários. A sua lógica de envio de dados e tratamento de erros é considerada robusta e fiável. Não foram encontradas anomalias, e o componente está pronto para integração.