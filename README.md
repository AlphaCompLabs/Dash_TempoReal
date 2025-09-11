# Política e Relatório de Segurança do Projeto
Este documento (`SECURITY.md`) serve como o registro central das práticas de segurança adotadas no desenvolvimento da API deste projeto. Ele contém o relatório da última análise estática de segurança (SAST) realizada no código-fonte do backend.

O objetivo é manter a transparência sobre a segurança do nosso código e fornecer um guia para que qualquer membro da equipe, ou o avaliador do projeto, possa replicar a análise.

## 🛡️ O que é Teste Estático de Segurança (SAST)?
SAST, ou Static Application Security Testing, é uma metodologia de teste de segurança que analisa o código-fonte de uma aplicação em busca de vulnerabilidades conhecidas **sem executar o código**. É como um "revisor de código automatizado" focado em encontrar falhas de segurança comuns, como:

- Uso de funções perigosas.

- Configurações inseguras.

- Senhas ou chaves secretas "hardcoded" (escritas diretamente no código).

Para este projeto, utilizamos a ferramenta Bandit, um scanner SAST líder para a linguagem Python.

## 🚀 Como Executar a Análise de Segurança Novamente
Qualquer pessoa com acesso ao código pode e deve executar o scanner de segurança para validar os resultados. Siga os passos abaixo:

1. **Configure o Ambiente:**
Garanta que você está na pasta raiz do projeto e que o ambiente virtual (`venv`) está ativo. Se o Bandit ainda não estiver instalado, instale-o com as dependências do projeto:
```
# Ative o ambiente virtual (exemplo para PowerShell)
.\venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt
``` 
2. **Execute o Bandit:**
Com o `venv` ativo, execute o seguinte comando a partir da pasta raiz do projeto:
```
bandit -r ./BackEnd_RESTful/
```
- `bandit`: O comando que invoca o scanner.

- `-r`: Analisa o diretório de forma recursiva.

- `./BackEnd_RESTful/`: O caminho para a pasta que contém o código-fonte da API a ser analisado.

## 📊 Interpretando os Resultados
O Bandit gera um relatório no terminal, classificando as possíveis vulnerabilidades por:

- **Severidade (`Severity`):** O impacto potencial do problema (`Low`, `Medium`, `High`).

- **Confiança (`Confidence`):** A certeza que o Bandit tem de que aquilo é realmente um problema (`Low`, `Medium`, `High`).

**Nosso Foco:** A prioridade é sempre investigar e corrigir os problemas de severidade `High` e `Medium`. Problemas de baixa severidade ou baixa confiança são frequentemente "falsos positivos" em projetos pequenos, mas ainda assim devem ser analisados.

**Relatório da Última Análise**

Abaixo está o log completo da última análise de segurança executada no código.

_________________________________________________ 

**Run started:** `2025-09-11 04:18:28.685632`

**Test results:**

        No issues identified.

**Code scanned:**

        Total lines of code: 120
        Total lines skipped (#nosec): 0

**Run metrics:**

        Total issues (by severity):
                Undefined: 0
                Low: 0
                Medium: 0
                High: 0
        Total issues (by confidence):
                Undefined: 0
                Low: 0
                Medium: 0
                High: 0

**Files skipped (0):**

_________________________________________________