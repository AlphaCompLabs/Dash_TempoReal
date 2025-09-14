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

---

## 🔥 Configuração firewall

Por padrão, o **Windows Defender Firewall** pode bloquear conexões externas ao servidor HTTP em Python. Isso significa que o servidor funcionará normalmente em `http://127.0.0.1:8000`, mas outros dispositivos da rede não conseguirão acessá-lo.

### 🔎 Sintomas comuns

* No navegador de outro computador:

  ```
  ERR_CONNECTION_TIMED_OUT
  ```

  ou

  ```
  ERR_CONNECTION_REFUSED
  ```

### ✅ Solução: liberar a porta no firewall

Para permitir conexões externas, execute o seguinte comando no **PowerShell como administrador** (substitua `8000` pela porta do seu servidor):

```powershell
New-NetFirewallRule -DisplayName "Python HTTP Server" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

### ❌ Remover a regra

Se quiser remover a regra depois:

```powershell
Remove-NetFirewallRule -DisplayName "Python HTTP Server"
```

### ⚠️ Observação

Na primeira execução, o Windows pode exibir um aviso:

> **O Windows Defender Firewall bloqueou alguns recursos deste aplicativo.**
> Clique em **Permitir acesso** para liberar a porta no seu perfil de rede (Privada ou Pública).

Se você clicar em **Cancelar**, apenas `localhost` funcionará, e acessos externos continuarão bloqueados.
