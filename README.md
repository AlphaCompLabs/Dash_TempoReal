<<<<<<< HEAD
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
<<<<<<< HEAD
python .\sink.py --port 8000 --ingest-path /api/ingest --current-path /api/current
python .\run.py --server-ip 192.168.1.11 --iface "Ethernet 2" --interval 5 --post "http://localhost:8000/api/ingest"

Invoke-WebRequest "http://192.168.1.10:8080" -OutFile $env:TEMP\test.html
>>
>> # Loop pra gerar bastante tráfego:
>> while ($true) {
>>   Invoke-WebRequest "http://192.168.1.11:8080" -OutFile $env:TEMP\test.html | Out-Null
>>   Start-Sleep -Milliseconds 200
>> }


python -m http.server 8080 --bind 0.0.0.0
>> # (opcional) abrir a porta no firewall
>> netsh advfirewall firewall add rule name="Python HTTP 8080" dir=in action=allow protocol=TCP localport=8080

https://npcap.com/ <- necesario para utilizar scapy no windows

=======
# Documentação do `run.py`

Este documento detalha o funcionamento do script `run.py`, um produtor de dados de tráfego de rede. Ele captura pacotes, agrega informações em janelas de tempo e envia os dados em formato JSON.




## Funcionalidade

O `run.py` é um script versátil para monitoramento de tráfego de rede. Suas principais funcionalidades são:

- **Captura de Pacotes:** Utiliza a biblioteca Scapy para capturar pacotes de rede em uma interface específica. Alternativamente, pode ler pacotes de um arquivo PCAP para fins de teste.
- **Agregação de Dados:** Agrega os dados dos pacotes capturados em janelas de tempo configuráveis. As informações são agrupadas por endereço IP do cliente, direção do tráfego (entrada/saída) e protocolo.
- **Emissão de Dados:** Envia os dados agregados em formato JSON para diferentes destinos:
    - Saída padrão (stdout)
    - Arquivo de texto (NDJSON)
    - Requisição POST para um endpoint HTTP
- **Anonimização:** Oferece a opção de anonimizar os endereços IP dos clientes usando HMAC-SHA1.
- **Mock de Dados:** Permite a geração de dados fictícios para testes, sem a necessidade de captura de pacotes reais.




## Argumentos da Linha de Comando

O script `run.py` aceita os seguintes argumentos de linha de comando para configurar seu comportamento:

| Argumento | Descrição | Tipo | Padrão | Obrigatório |
|---|---|---|---|---|
| `--server-ip` | IP do servidor observado (define direção in/out). Recomendado. | `str` | `None` | Não |
| `--iface` | Interface de rede para captura (ex.: 'Ethernet', 'Wi-Fi', 'eth0'). | `str` | `None` | Não |
| `--interval` | Tamanho da janela/intervalo de emissão em segundos. | `float` | `5.0` | Não |
| `--post` | URL para POST do JSON (ex.: `http://localhost:8000/api/ingest`). | `str` | `None` | Não |
| `--post-timeout` | Timeout do POST em segundos. | `float` | `10.0` | Não |
| `--post-retries` | Tentativas extras no POST (backoff exponencial). | `int` | `2` | Não |
| `--file` | Salvar JSON em arquivo. Por padrão, sobrescreve a cada janela. | `str` | `None` | Não |
| `--file-append` | Se setado, grava NDJSON (1 JSON por linha). | `action` | `False` | Não |
| `--mock` | Injeta eventos fictícios (útil p/ teste). | `action` | `False` | Não |
| `--no-capture` | Desliga captura (só mock/PCAP). | `action` | `False` | Não |
| `--bpf` | Filtro BPF (ex.: `'host 192.168.1.11 and (tcp port 8080 or icmp)'`). | `str` | `None` | Não |
| `--pcap` | Ler pacotes de um arquivo `.pcap` em vez de capturar (para testes). | `str` | `None` | Não |
| `--log-level` | Nível de log. | `str` | `INFO` | Não |
| `--log-file` | Arquivo de log (opcional). | `str` | `None` | Não |
| `--max-clients` | Mantém apenas os N clientes com maior tráfego (0 = ilimitado). | `int` | `0` | Não |
| `--anon` | Anonimiza IPs (hash HMAC-SHA1). Usa chave de `ANON_KEY` envvar ou aleatória. | `action` | `False` | Não |
| `--anon-key` | Chave para HMAC (se não setada, usa `ANON_KEY` do ambiente ou gera aleatória). | `str` | `None` | Não |




## Como Utilizar

Para utilizar o `run.py`, você pode executá-lo diretamente via linha de comando, passando os argumentos necessários. Abaixo estão alguns exemplos de uso, baseados no `README.md` fornecido:

### Exemplo 1: Captura de Tráfego e Envio via POST

Este é um cenário comum onde o `run.py` captura o tráfego de uma interface específica e envia os dados agregados para um endpoint HTTP (como o `sink.py`).

```bash
python .\run.py --server-ip 192.168.1.11 --iface "Ethernet 2" --interval 5 --post "http://localhost:8000/api/ingest"
```

**Explicação:**
- `--server-ip 192.168.1.11`: Define o IP do servidor para 192.168.1.11. Isso é crucial para que o script determine a direção do tráfego (entrada/saída) em relação a este servidor.
- `--iface "Ethernet 2"`: Especifica a interface de rede "Ethernet 2" para a captura de pacotes. Você deve substituir isso pela interface de rede correta do seu sistema.
- `--interval 5`: Define a janela de agregação de dados para 5 segundos. A cada 5 segundos, os dados capturados e agregados serão emitidos.
- `--post "http://localhost:8000/api/ingest"`: Envia o JSON resultante para a URL `http://localhost:8000/api/ingest` via requisição POST. Este é o endpoint padrão do `sink.py`.

### Exemplo 2: Leitura de PCAP e Saída para Arquivo

Para testes ou análise de dados históricos, você pode usar um arquivo PCAP em vez de capturar tráfego ao vivo.

```bash
python .\run.py --pcap /caminho/para/seu/arquivo.pcap --file saida.json --interval 10
```

**Explicação:**
- `--pcap /caminho/para/seu/arquivo.pcap`: Lê os pacotes do arquivo PCAP especificado. Substitua `/caminho/para/seu/arquivo.pcap` pelo caminho real do seu arquivo.
- `--file saida.json`: Salva o JSON agregado no arquivo `saida.json`. Por padrão, este arquivo será sobrescrito a cada intervalo.
- `--interval 10`: Define a janela de agregação para 10 segundos.

### Exemplo 3: Geração de Dados Fictícios (Mock) e Saída para STDOUT

Útil para verificar o formato de saída do JSON sem a necessidade de uma interface de rede ou arquivo PCAP.

```bash
python .\run.py --mock --interval 3
```

**Explicação:**
- `--mock`: Ativa a geração de dados fictícios. O script injetará eventos de tráfego simulados.
- `--interval 3`: Define a janela de agregação para 3 segundos. Os dados serão impressos no console a cada 3 segundos.

### Exemplo 4: Anonimização de IPs

Para fins de privacidade, você pode anonimizar os endereços IP no payload JSON.

```bash
python .\run.py --iface "eth0" --interval 5 --post "http://localhost:8000/api/ingest" --anon --anon-key "minhachavesecreta"
```

**Explicação:**
- `--anon`: Ativa a anonimização dos endereços IP.
- `--anon-key "minhachavesecreta"`: Fornece uma chave secreta para o processo de anonimização HMAC-SHA1. Se não for fornecida, o script tentará usar a variável de ambiente `ANON_KEY` ou gerará uma aleatoriamente.

### Dependências

Para a funcionalidade de captura de pacotes, o `run.py` depende da biblioteca `scapy`. Em sistemas Windows, pode ser necessário instalar o Npcap para que o Scapy funcione corretamente. O `README.md` menciona:

`https://npcap.com/ <- necesario para utilizar scapy no windows`

Certifique-se de ter o Scapy instalado (`pip install scapy`) e as dependências de captura de pacotes apropriadas para o seu sistema operacional.




## Estrutura do JSON de Saída

O `run.py` emite um objeto JSON que contém os dados agregados do tráfego de rede. A estrutura básica do JSON é a seguinte:

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




## Detalhes de Implementação

O `run.py` é estruturado em torno de algumas classes e funções principais que orquestram a captura, agregação e emissão de dados.

### `Aggregator` Class

A classe `Aggregator` é responsável por gerenciar a agregação de dados de tráfego em janelas de tempo. Ela mantém o estado da janela atual e processa os pacotes recebidos.

- **`__init__(self, window_s: int = 5, max_clients: int = 0, anon: Optional[Callable[[str], str]] = None)`:**
    - `window_s`: Define o tamanho da janela de agregação em segundos.
    - `max_clients`: Limita o número de clientes a serem mantidos na agregação (os N clientes com maior tráfego).
    - `anon`: Uma função opcional para anonimizar IPs.
- **`_maybe_roll(self, ts: float)`:** Método interno que verifica se o timestamp do pacote atual excede o fim da janela atual. Se sim, ele "rola" para uma nova janela.
- **`add(self, ts: float, client_ip: str, direction: str, nbytes: int, proto: str)`:** Adiciona dados de um pacote à agregação. Ele atualiza os contadores de bytes de entrada/saída para o cliente e protocolo específicos.
- **`snapshot(self, meta: Dict[str, Any]) -> Dict[str, Any]`:** Gera um "instantâneo" dos dados agregados na janela atual. Aplica o filtro `max_clients` se configurado e adiciona metadados (host, interface, IP do servidor) ao payload final.

### `Sniffer` Class

A classe `Sniffer` encapsula a lógica de captura de pacotes, seja de uma interface de rede ao vivo ou de um arquivo PCAP.

- **`__init__(self, aggr: Aggregator, server_ip: Optional[str], iface: Optional[str], bpf: Optional[str] = None, pcap: Optional[str] = None)`:**
    - `aggr`: Uma instância da classe `Aggregator` para onde os pacotes capturados serão enviados.
    - `server_ip`: O IP do servidor para determinar a direção do tráfego.
    - `iface`: A interface de rede para captura ao vivo.
    - `bpf`: Um filtro BPF opcional para a captura.
    - `pcap`: O caminho para um arquivo PCAP, se a captura for de um arquivo.
- **`start()`:** Inicia o processo de sniffing em uma thread separada. Ele usa `scapy.all.sniff` para captura ao vivo ou `scapy.all.rdpcap` para ler de um arquivo PCAP. Um callback (`_cb`) é usado para processar cada pacote e adicioná-lo ao `Aggregator`.
- **`stop()`:** Sinaliza para a thread de sniffing parar e aguarda sua finalização.

### Funções Auxiliares

- **`parse_args()`:** Utiliza `argparse` para definir e processar os argumentos da linha de comando.
- **`setup_logging(level: str, log_file: Optional[str])`:** Configura o sistema de logging do Python, permitindo diferentes níveis de log e saída para arquivo.
- **`friendly_proto(layer: str, sport: Optional[int], dport: Optional[int]) -> str`:** Uma função utilitária para retornar um nome de protocolo mais amigável (ex: HTTP, HTTPS, DNS) com base na camada e portas.
- **`validate_url(u: str) -> bool`:** Valida se uma string é uma URL HTTP/HTTPS válida.
- **`now_ts()`:** Retorna o timestamp Unix atual.
- **`hostname()`:** Retorna o nome do host.
- **`anon_hasher(key: bytes) -> Callable[[str], str]`:** Retorna uma função para anonimizar IPs usando HMAC-SHA1 com uma chave fornecida.
- **`emit_json(...)`:** Responsável por emitir o payload JSON. Lida com o envio via POST (com retries e backoff exponencial), gravação em arquivo (sobrescrevendo ou anexando NDJSON) e saída para stdout.

### Fluxo Principal (`main` function)

1. **Parsing de Argumentos:** Os argumentos da linha de comando são lidos.
2. **Configuração de Logging:** O logging é inicializado.
3. **Inicialização do Anonimizador:** Se a anonimização for solicitada, a função de hash é preparada.
4. **Criação do `Aggregator`:** Uma instância do `Aggregator` é criada com base nos argumentos.
5. **Inicialização do `Sniffer`:** Se a captura não estiver desativada, uma instância do `Sniffer` é criada e iniciada em uma thread separada.
6. **Loop Principal:** O script entra em um loop infinito que:
    - Se `--mock` estiver ativo, injeta dados fictícios no `Aggregator`.
    - Gera um `snapshot` dos dados agregados do `Aggregator`.
    - Chama `emit_json` para enviar o payload para o destino configurado.
    - Aguarda o tempo definido por `--interval` antes de processar a próxima janela.
7. **Tratamento de Sinais:** O script captura sinais de interrupção (Ctrl+C) e término para garantir um desligamento limpo, parando o sniffer antes de sair.


Ao fazer isso, o script run.py em execução no servidor-alvo começará a capturar esses pacotes e a enviar os dados agregados a cada 5 segundos para o sink.py.
Comandos Úteis
Para identificar o nome da sua interface de rede no Windows, use o PowerShell:
Get-NetAdapter | Select Name, Status
>>>>>>> cae83d1d7f04b5f7d6c849d1449b244f7f70508e
>>>>>>> redes
