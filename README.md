# 📊 Dashboard Análise de Tráfego em Tempo Real 

O presente trabalho tem como objetivo realizar a captura de tráfego em um servidor. Ele servirá para processar os dados, que poderão ser vizualizados dinamicamente, da seguinte forma:
- Entrada de tráfego;
- Saída de tráfego;
- Comunicação do servidor (IPs clientes);
- Protocolos que estão sendo utilizados.

## 🛠️ Funcionalidades do Sistema

## ⚙️ Tecnologias Utilizadas

## 📂 Documentação Simplificada

## 👥 Contribuições
1. **Não faça commits diretamente na `main`**
  
2. **Em branches, utilize os prefixos:**
   - `docs:` para documentação;
   - `feat:` para novas funcionalidades;
   - `fix:` para correções;
     
3. **Já em commits, utilize os seguintes prefixos:**
   - `docs:` para documentação;
   - `style:` para ajustes de formatação;
   - `feat:` para novas funcionalidades;
   - `refactor:` para refatoração de código;
   - `chore:` para manutenção;
   - `test:` para testes.

=======
# 📊 Dashboard de Análise de Tráfego em Tempo Real

Sistema para captura e análise de tráfego em servidores, permitindo a visualização dinâmica de informações sobre comunicação, protocolos e fluxo de dados. O objetivo é monitorar o tráfego de rede em tempo real, exibindo:

- Tráfego de entrada e saída
- Comunicação do servidor (IPs de clientes)
- Protocolos utilizados
- Dashboard dinâmico com gráficos interativos
- Listagem de IPs e protocolos ativos

---

## 📑 Sumário
- [Tecnologias Utilizadas](#%EF%B8%8F-tecnologias-utilizadas)
- [Padrões e Configuração](#%EF%B8%8F-padrões-e-configuração)
- [Como Construir o Projeto](#%EF%B8%8F-como-construir-o-projeto)
- [Realizando Testes](#-realizando-testes)
- [Autores](#-autores)

---

## ⚙️ Tecnologias Utilizadas

### Backend
* **Runtime:** **Uvicorn**
* **Framework:** **FastAPI**
* **Linguagens:** **JavaScript** e **Python** (para scripts ou serviços específicos).
* **Segurança/Análise:** **Bandit** (Linter de segurança para Python).

### Frontend
* **Framework:** **Angular 20.2.2**
* **Linguagem:** **TypeScript**
* **Estilização:** **Tailwind CSS**
* **Gerenciamento de dependências e execução:** **Node.js (npm)**

### Monitoramento & Comunicação
* **Análise de Rede:** **Scapy, NPCAP**
* **Comunicação em Tempo Real:** **API RestFull**
* **Comparação de resultados:** **Wireshark API**

### Desenvolvimento & Testes
* **Testes:** **Jest** (para testes unitários).
* **Versionamento:** **Git** / **GitHub**
* **Pacotes:** **npm**

### Gerenciamento
* **Gerenciamento de Projeto:** **Trello**

[🔼 Voltar ao topo](#-sumário)

---

## 🗃️ Padrões e Configuração
A parte de `~/Network_analyzer` emite um objeto JSON que contém os dados agregados do tráfego de rede. A estrutura básica do JSON é a seguinte:

```json
{
  "version": "2.0.0",
  "window_start": 1678886400.0, (timestamp Unix do início da janela)
  "window_end": 1678886405.0, (timestamp Unix do fim da janela)
  "emitted_at": 1678886405.123, (timestamp Unix da emissão)
  "host": "nome-do-host",
  "iface": "nome-da-interface",
  "server_ip": "IP-do-servidor",
  "n_clients": 5, (número de clientes únicos)
  "total_in": 123456, (total de bytes de entrada)
  "total_out": 789012, (total de bytes de saída)
  "pkt_count": 100, (total de pacotes na janela)
  "byte_count": 912468, (total de bytes na janela)
  "clients": {
    "10.0.0.2": {
      "in_bytes": 1500,
      "out_bytes": 700,
      "protocols": {
        "HTTP": {"in": 1500, "out": 700}
      }
    },
    "10.0.0.3": {
      "in_bytes": 400,
      "out_bytes": 180,
      "protocols": {
        "HTTPS": {"in": 400, "out": 0},
        "DNS": {"in": 0, "out": 180}
      }
    },
    "anon_ip_hash": { (se anonimizado)
      "in_bytes": 200,
      "out_bytes": 300,
      "protocols": {
        "TCP:8080": {"in": 200, "out": 300}
      }
    }
  }
}
```

**Campos Principais:**

- `version`: Versão do script `run.py`.
- `window_start`, `window_end`: Timestamps Unix (em segundos) que definem o início e o fim da janela de agregação.
- `emitted_at`: Timestamp Unix (em segundos) de quando o payload foi gerado.
- `host`: Nome do host onde o script está sendo executado.
- `iface`: Nome da interface de rede utilizada para a captura.
- `server_ip`: O IP do servidor configurado, se houver.
- `n_clients`: Número de clientes únicos detectados na janela.
- `total_in`, `total_out`: Total de bytes de entrada e saída para todos os clientes na janela.
- `pkt_count`, `byte_count`: Contagem total de pacotes e bytes processados na janela.
- `clients`: Um dicionário onde as chaves são os IPs dos clientes (ou seus hashes, se anonimizados) e os valores são objetos contendo:
    - `in_bytes`, `out_bytes`: Bytes de entrada e saída para aquele cliente específico.
    - `protocols`: Um dicionário detalhando o tráfego por protocolo (ex: HTTP, HTTPS, DNS, TCP:porta, UDP:porta, ICMP) para aquele cliente, também dividido em bytes de entrada e saída.

[🔼 Voltar ao topo](#-sumário)

---

## 🏗️ Como Construir o Projeto

### 🧩 Pré-requisitos

Estes pré-requisitos são específicos para o ambiente **Windows**. Certifique-se de que tudo está instalado e configurado antes de prosseguir:

| Requisito | Versão Mínima | Observação | Link para Download |
| :--- | :--- | :--- | :--- |
| **Python** | 3.6 ou superior | Recomendado que o `pip` seja instalado e adicionado ao PATH. | 🔗 [Download Python(LTS)](https://www.python.org/downloads/) |
| **Node.js** e **npm** | Mais recente | Necessário para o Front-end. | 🔗 [Download Node.js(LTS)](https://nodejs.org/en/download) |
| **Angular CLI** | v20.2.2 | Instale globalmente com `npm install -g @angular/cli@20.2.2`. | (Instalado via npm) |
| **Npcap** | Mais recente | Essencial para a captura de tráfego de rede (Network Analyzer). | 🔗 [Download Npcap](https://npcap.com/#download) |
| **Espaço em Disco** | 5 GB livre | Para garantir a instalação de todas as dependências. | - |

### 📦 Clonando o Repositório

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/AlphaCompLabs/Dash_TempoReal.git
    ```
2.  **Acesse o diretório:**
    ```bash
    cd Dash_TempoReal
    ```
    *Dica: A partir de agora, usaremos o símbolo **`~`** para representar o diretório principal do projeto (`Dash_TempoReal`).*

-----

## 🚀 Instalação e Execução dos Componentes

O projeto exige que **todos os 5 componentes** estejam rodando em **cinco terminais PowerShell separados** para funcionar corretamente.

### 1\. Inicialização do Backend (API)

Este é o primeiro componente a ser executado, pois ele hospeda o endpoint que receberá os dados do Network Analyzer.

#### Passo 1: Preparação

1. **Acesse o diretório do backend:** (na pasta `~`)
    ```bash
    cd ~\Dash_TempoReal\BackEnd_RESTful
    ```

2.  **Crie um Ambiente Virtual:** (na pasta `~`)
    ```bash
    python -m venv venv
    ```
2.  **Ative o Ambiente Virtual:**
    ```bash
    .\venv\Scripts\activate
    ```
3.  **Instale as Dependências** do Backend:
    ```bash
    pip install -r requirements.txt
    ```

#### Passo 2: Execução

**🖥️ No Terminal 1 - Inicie o Backend:**
Com o ambiente virtual ativado, inicie o servidor da API.
```bash
uvicorn main:app --reload
```
*(OU)*

```bash
python -m uvicorn main:app --reload
```

> O backend estará rodando em `http://127.0.0.1:8000` e aguardando dados.

-----

### 2\. Inicialização do Network Analyzer (`main.py`)

O Network Analyzer captura e envia os dados para o Backend (rodando no Terminal 1).

**⚠️ AVISO:** Este componente exige um **novo terminal** e a **ativação de um novo ambiente virtual**.Se você estiver em um ambiente virtual, digite **`deactivate` para sair.**

#### Passo 1: Configuração

1.  **Abra o Terminal 2** e acesse o diretório:
    ```bash
    cd ~\Dash_TempoReal\Network_analyzer
    ```
2.  **Crie um novo Ambiente Virtual** (`venv_analyzer`) e **Ative-o**:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
**⚠️ Atenção:** Não esqueça de ter instalado em sua máquina o [NPCAP](https://npcap.com/#download, isso é pré-requisito para esse passo

3.  **Instale as dependências** (`scapy` e `cap`):
    ```bash
    pip install scapy cap
    ```
4.  **Identifique sua Interface de Rede:**
    Você precisará do nome exato da interface (ex: "Wi-Fi") para o próximo passo.
    ```bash
    Get-NetAdapter | Select Name, Status
    ipconfig
    ```
    <img width="877" height="484" alt="image" src="https://github.com/user-attachments/assets/54b7ec74-8258-498d-9ad0-8019f3116cea" />

#### Passo 2: Execução

**🖥️ Terminal 2 (Network Analyzer) - Execute a Captura**
Execute o comando abaixo, substituindo `<Seu IP>` e `"<Sua interface>"` pelos valores reais.

```bash
python ./main.py --server-ip <Seu IP(Substitua informações dentro e apague o "<>")> --iface "<Sua interface(Substitua informações dentro e apague o "<>")>" --interval 5 --post "http://localhost:8000/api/ingest" --bpf "tcp port 8001 or tcp port 2121"
```

-----

### 3\. Inicialização do Frontend (Angular)

**⚠️ AVISO:** Este componente exige um **novo terminal** e **não utiliza ambiente virtual Python. Se você estiver em um ambiente virtual, digite `deactivate` para sair.**

**🖥️ Terminal 3 (Frontend) - Inicie o Projeto**

1.  **Abra o Terminal 3** e acesse a **raiz do projeto** (`~`):
    ```bash
    cd ~\Dash_TempoReal\FrontEnd\FrontEnd-Angular 
    ```
2.  Execute a sequência de comandos:
   
    2.1.  Instalar Node Modules:
    ```bash
    npm install
    ```
    2.2. Instalar Angular CLI(Pré-requisto):
     ```bash
    npm install -g @angular/cli@20.2.2
     ```
     2.3. Inicializar server:
     ```bash
    ng serve
    ```

Após a inicialização, acesse a aplicação web: **[http://localhost:4200/](http://localhost:4200/)**

-----

### 4\. Inicialização do Servidor HTTP (`server_http.py`)

**⚠️ AVISO:** Este componente exige um **novo terminal** e **não utiliza ambiente virtual Python**. Se você estiver em um ambiente virtual, digite `deactivate` para sair.

**🖥️ Terminal 4 (Servidor HTTP) - Inicie o Servidor**

1.  **Abra o Terminal 4** e acesse a pasta:
    ```bash
    cd ~\Dash_TempoReal\Servidores\server_http
    ```
2.  Execute o seguinte comando:
    ```bash
    python server_http.py
    ```
Após a inicialização, acesse a aplicação web: **[http://127.0.0.1:8001](http://127.0.0.1:8001)**

-----

### 5\. Inicialização do Servidor FTP (`ftp_server.py`)

**⚠️ AVISO:** Este componente exige um **novo terminal** e a **criação e ativação de um novo ambiente virtual**.

**🖥️ Terminal 5 (Servidor FTP) - Inicie o Servidor**

1.  **Abra o Terminal 5** e acesse a pasta:
    ```bash
    cd ~\Dash_TempoReal\Servidores\server_ftp
    ```
2.  **Crie e Ative o Ambiente Virtual** (`venv_ftp`):
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
3.  **Baixe a biblioteca** `pyftpdlib`:
    ```bash
    pip install pyftpdlib
    ```
4.  **Inicie o servidor:**
    ```bash
    python ftp_server.py
    ```
    Confirme a mensagem de inicialização:
    ```
    INFO: Servidor FTP iniciado em ftp://0.0.0.0:2121
    ```

[🔼 Voltar ao topo](#-sumário)

-----

## 🧪 Realizando Testes

Com os **cinco terminais rodando** (Backend, Network Analyzer, Frontend, Servidor HTTP e FTP), você pode gerar tráfego e visualizar os resultados.

### Teste de Geração de Tráfego (HTTP e FTP)

1.  **Descubra seu IP:** Abra o **Prompt de Comando** e use:
      ```bash
      ipconfig
      ```
2.  **Acesse o Servidor FTP:**
      * Use o **Gerenciador de Arquivos** e na barra de endereço, use o seu IP:
      ```
      ftp://<SEU_IP_AQUI>:2121
      ```
3.  **Acesse o Servidor HTTP:**
      * Use o **Navegador** e acesse:
      
        🔗 **[http://127.0.0.1:8001](http://127.0.0.1:8001)**
      * *Ao realizar esses acessos, o **Terminal 2** (Network Analyzer) deve começar a exibir logs de pacotes e o **Terminal 1** (Backend) deve registrar a ingestão de dados.*

### Teste Network Analyzer (HTTP e FTP)

Acesse o **Terminal 2** realize testes de movimentação nos servidores e verifique os logs presentes.

### Teste da API (Swagger UI)

1.  **Abra o Navegador** e acesse a documentação interativa:

      🔗 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**
    
4.  **Explore os Endpoints:**
      * Use as rotas `GET /api/traffic` e `GET /api/traffic/{client_ip}/protocols` para testar os dados em tempo real.

### Visualização na Aplicação Web

Acesse **[http://localhost:4200/](http://localhost:4200/)** no seu navegador para ver o tráfego gerado organizado no Dashboard.

[🔼 Voltar ao topo](#-sumário)

---

## 👥 Autores

* **Autor:** Compania AlphaCompLabs  
* **GitHub:** [github.com/AlphaCompLabs](https://github.com/AlphaCompLabs)

[🔼 Voltar ao topo](#-sumário)
