# Relatório de Análise Estática de Segurança (SAST) - Backend
### Projeto: Dashboard de Análise de Tráfego de Servidor em Tempo Real
### Ferramenta de Análise: Bandit (Versão Padrão)
### Data da Análise: 29 de Setembro de 2025
### Alvo da Análise: Código-fonte do servidor backend (BackEnd_RESTful/)

1. Resumo Executivo
Foi conduzida uma análise estática de segurança (SAST) no código-fonte do backend da aplicação. O objetivo da verificação foi identificar potenciais vulnerabilidades de segurança comuns em código Python, conforme os critérios de avaliação do projeto.

A análise foi concluída com sucesso e não identificou nenhuma vulnerabilidade de segurança no código-fonte de produção (main.py).

Resultado Geral: O código da aplicação passou na verificação de segurança estática, sendo considerado seguro e cumprindo os requisitos para a pontuação extra do projeto.

2. Resultados Detalhados
A ferramenta Bandit analisou 167 linhas de código no ficheiro main.py e não encontrou nenhuma issue de segurança. A secção results do relatório JSON gerado pela ferramenta estava vazia, confirmando a ausência de descobertas.

Métricas Principais:

Ficheiros Analisados: 1 (BackEnd_RESTful/main.py)

Vulnerabilidades de Severidade ALTA: 0

Vulnerabilidades de Severidade MÉDIA: 0

Vulnerabilidades de Severidade BAIXA: 0

Extrato do Relatório JSON:

```
{
  "results": []
}
```
3.  Conclusão
O código de produção do backend (main.py) foi verificado e está em conformidade com as boas práticas de segurança avaliadas pela ferramenta Bandit. A ausência de vulnerabilidades demonstra a qualidade e a robustez do código desenvolvido pela equipe.