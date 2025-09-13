# Servidor HTTP de Teste

## Versão
1.0.0

## Autor
Equipe DevOps/QA - Caio Silveira

## Descrição
Este script inicia um **servidor HTTP simples** para o cenário de teste do projeto.  
Ele serve um `index.html` de teste e permite executar **comandos CLI via query string**, gerando tráfego de rede que pode ser monitorizado pelo dashboard.

O servidor é **multithreaded**, permitindo múltiplos acessos simultâneos na LAN.

---

## Dependências
Nenhuma. O script utiliza apenas a **biblioteca padrão do Python 3**.

Recomendado: Python 3.6 ou superior.

---

## Configurações do Servidor

- **HOST:** `0.0.0.0` (acessível na LAN colocar IPVA da máquina ou rede)  
- **PORT:** `8001` (pode ser alterada no código)  
- **INDEX_FILE:** `index.html` criado automaticamente na mesma pasta do script, se não existir.

---

## Como executar

1. Clone ou copie o script para uma pasta de sua preferência.
2. Abra o terminal na pasta do script.
3. Execute o servidor:

```bash
python server_http.py
