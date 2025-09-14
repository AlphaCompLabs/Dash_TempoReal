Entendi 👍
O problema no seu README é que você usou **quebra de bloco de código incorreta**: abriu um bloco \`\`\`\`markdown mas não fechou corretamente, e ainda colocou sequências ANSI (`\033[0;32m`) que não são renderizadas no GitHub/Markdown.

Aqui está a versão corrigida e limpa para você colar:

````markdown
# Servidor HTTP de Teste

## Versão
1.0.0

## Autor
Equipe DevOps/QA - Caio Silveira

## Descrição
Este script inicia um **servidor HTTP simples** para o cenário de teste do projeto.  
Ele serve um `index.html` de teste e permite executar **comandos CLI via query string**, gerando tráfego de rede que pode ser monitorado pelo dashboard.

O servidor é **multithreaded**, permitindo múltiplos acessos simultâneos na LAN.

---

## Dependências
Nenhuma. O script utiliza apenas a **biblioteca padrão do Python 3**.

Recomendado: Python 3.6 ou superior.

---

## Configurações do Servidor

- **HOST:** `0.0.0.0` (acessível na LAN colocando o IP da máquina ou rede)  
- **PORT:** `8001` (pode ser alterada no código)  
- **INDEX_FILE:** `index.html` criado automaticamente na mesma pasta do script, se não existir.

---

## Como executar

1. Clone ou copie o script para uma pasta de sua preferência.
2. Abra o terminal na pasta do script.
3. Execute o servidor:

```bash
python server_http.py
````

---

## Configuração do Firewall (Windows)

Por padrão, o **Windows Defender Firewall** pode bloquear conexões externas ao servidor HTTP em Python.
Isso significa que o servidor funcionará normalmente em `http://127.0.0.1:8000`, mas outros dispositivos da rede não conseguirão acessá-lo.

### 🔎 Sintomas comuns

* No navegador de outro computador:

```
ERR_CONNECTION_TIMED_OUT
```

ou

```
ERR_CONNECTION_REFUSED
```

* No terminal de outro dispositivo (exemplo com `curl`):

```
curl: (7) Failed to connect to 192.168.x.x port 8000: Connection refused
```

Perfeito 👌
Segue a versão ajustada com **exemplos tanto para PowerShell quanto para CMD** na parte do firewall:

````markdown
### ✅ Solução: liberar a porta no firewall

Para permitir conexões externas, você precisa liberar a porta no firewall.  
Execute **um dos comandos abaixo** como administrador (substitua `8000` pela porta do seu servidor):

#### 🔹 PowerShell (recomendado)

```powershell
New-NetFirewallRule -DisplayName "Python HTTP Server" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
````

#### 🔹 CMD (Prompt de Comando)

```cmd
netsh advfirewall firewall add rule name="Python HTTP Server" dir=in action=allow protocol=TCP localport=8000
```

---

### ❌ Remover a regra

Se quiser remover a regra depois:

#### 🔹 PowerShell

```powershell
Remove-NetFirewallRule -DisplayName "Python HTTP Server"
```

#### 🔹 CMD

```cmd
netsh advfirewall firewall delete rule name="Python HTTP Server"
```
Assim você cobre os dois casos (quem usa PowerShell e quem ainda prefere o CMD).  

Quer que eu já aplique essa versão revisada no seu README inteiro?
```


### ⚠️ Observação

Na primeira execução, o Windows pode exibir um aviso:

> **O Windows Defender Firewall bloqueou alguns recursos deste aplicativo.**
> Clique em **Permitir acesso** para liberar a porta no seu perfil de rede (Privada ou Pública).

Se você clicar em **Cancelar**, apenas `localhost` funcionará, e acessos externos continuarão bloqueados.

```

---

👉 Agora os blocos de código ficam certinhos no GitHub e não aparecem aquelas sequências estranhas (`\033[0;32m`).  

Quer que eu também deixe os erros (`ERR_CONNECTION_REFUSED` etc.) destacados em **vermelho** usando Markdown em vez das sequências ANSI?
```
