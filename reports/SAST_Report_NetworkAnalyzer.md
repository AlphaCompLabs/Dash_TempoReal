# Relatório de Segurança Estática (SAST) – Módulo Agregador (Aggregator.py)
### - Data de Execução: 30 de Setembro de 2025

### - Ferramenta de Teste: Bandit (Analisador de Segurança para Python)

### - Módulo Testado: Network_analyzer (com foco no Aggregator.py e emissao.py)

### - Autor da Análise: Equipe de Redes/QA

### 1. Resumo Executivo
Foi realizada uma análise de segurança estática (SAST) em todo o código-fonte do módulo Network_analyzer. A análise foi concluída com sucesso e identificou uma (1) vulnerabilidade de severidade Média e múltiplas vulnerabilidades de severidade Baixa.

Após uma análise detalhada, concluiu-se que:

1. A vulnerabilidade de severidade Média (B310), relacionada ao uso de urllib.request.urlopen, foi classificada como um falso positivo, dado que a URL utilizada no código é uma constante fixa e não pode ser manipulada por um utilizador externo.

2. As vulnerabilidades de severidade Baixa (B101) estão todas localizadas nos ficheiros de teste e referem-se ao uso da declaração assert, que é a prática padrão para verificação em testes unitários e não representa um risco para a aplicação.

Com base nesta análise, o módulo Network_analyzer é considerado seguro, e nenhuma ação de correção é necessária.

### 2. Detalhes da Execução
A análise foi realizada com o seguinte comando:
```
bandit -r Network_analyzer/ -x "*/venv/*" -f json
```
O resultado da execução identificou 39 problemas no total, distribuídos da seguinte forma:
```
{
  "_totals": {
    "SEVERITY.HIGH": 0,
    "SEVERITY.MEDIUM": 1,
    "SEVERITY.LOW": 38,
    "CONFIDENCE.HIGH": 39
  }
}
```
### 3. Análise Detalhada das Descobertas
#### 3.1. [MÉDIA] B310: Uso de urllib.request.urlopen
- Descrição: O Bandit alerta para o uso de urlopen, pois esta função pode ser usada para aceder a esquemas inesperados (como file:///) se a URL for controlada por um atacante, podendo levar ao acesso de ficheiros locais no servidor.

- Localização: Network_analyzer/emissao.py, linha 69.

- Análise de Risco: No nosso código, a variável url passada para esta função é uma constante (http://localhost:8000/api/ingest) e não pode ser influenciada por nenhuma entrada externa. O risco de um atacante fornecer um caminho malicioso (file:///...) é nulo.

- Avaliação: Falso Positivo. Nenhuma ação é necessária.

#### 3.2. [BAIXA] B101: Uso de assert
- Descrição: O Bandit alerta para o uso de assert porque estas declarações são removidas quando o código Python é executado em modo otimizado, o que poderia remover verificações de segurança.

- Localização: Network_analyzer/tests/test_aggregator.py e Network_analyzer/tests/test_emissao.py.

- Análise de Risco: Todas as ocorrências desta descoberta estão em ficheiros de teste unitário. O uso de assert é a forma padrão e correta de fazer verificações em testes com pytest. Este código nunca será executado em produção.

- Avaliação: Não é um Risco. O uso de assert é intencional e correto para o contexto de testes. Nenhuma ação é necessária.

### 4. Conclusão
O módulo Network_analyzer passou com sucesso na análise de segurança estática. Todas as descobertas foram analisadas e classificadas como não aplicáveis ou como falsos positivos no contexto deste projeto. O código é considerado seguro para o seu propósito.