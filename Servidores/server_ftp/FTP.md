# Guia de Utilização dos Servidores de Teste (para Clientes)
Este documento explica como os clientes (as "outras máquinas" do cenário de teste) devem utilizar os servidores de teste (FTP e HTTP) para gerar tráfego de rede. O objetivo é que a atividade gerada possa ser capturada e validada pelo nosso sistema de monitorização.

Nota: As instruções detalhadas para iniciar os servidores encontram-se no `README.md` principal de cada servidor.

## 📄 Servidor FTP
O servidor FTP serve para simular transferências de ficheiros. Existem duas formas de aceder: via Explorador de Ficheiros do Windows (mais fácil) ou via Linha de Comandos (mais técnico).

### **Como Gerar Tráfego FTP (Instruções para os Clientes)**
 
#### **Opção 1: Via Linha de Comandos (CMD)**
Este método é ideal para ver os detalhes da conexão.

**Passos:**

1. **Abra a Linha de Comandos:** Pressione a tecla Windows, digite `cmd`, e pressione Enter.

2. **Inicie o cliente FTP:** No terminal, digite o seguinte comando e pressione Enter:
```
ftp
```
| O seu prompt irá mudar para ``ftp>.`` 

3. **Conecte-se ao servidor:** Use o comando ``open`` seguido do endereço IP e da porta fornecidos pela pessoa que está a rodar o servidor.

```
open <ENDEREÇO_IP_DO_SERVIDOR> 2121
```
| (Exemplo: open 192.168.1.105 2121)

4. **Faça o login:**

- O servidor irá pedir um nome de utilizador. Digite ``anonymous`` e pressione Enter.

- Ele irá pedir uma senha. Apenas pressione Enter (não precisa de senha).

Liste os ficheiros: Para ver os ficheiros disponíveis no servidor, use o comando:

```
ls
```

| Você deverá ver o ficheiro ```NETVISION.zip``` na lista.

Para gerar tráfego, faça o download do ficheiro: Use o comando ``get``.

```
get NETVISION.zip
```

| Isto irá baixar o ficheiro para a pasta onde você iniciou o ``cmd``.

Encerre a conexão: Depois do download terminar, digite ``bye`` para sair.

A ação de download irá criar um pico de tráfego FTP, que deverá ser capturado e exibido no dashboard.

#### **Opção 2: Via Explorador de Ficheiros do Windows**
1. **Abra o Explorador de Ficheiros do Windows** (a pasta amarela na barra de tarefas).

2. Clique na barra de endereço no topo.

3. Digite o endereço do servidor e pressione Enter:

```
ftp://<ENDEREÇO_IP_DO_SERVIDOR>:2121
```
4. **Para gerar tráfego, faça o download do ficheiro:**

- Arrastar e Soltar: Arraste o ficheiro ``NETVISION.zip`` para a sua Área de Trabalho.

- **Copiar e Colar**: Copie o ficheiro e cole-o numa pasta local.

**⚠️ Resolução de Problemas Comuns**
- **Erro "O Windows não pode aceder a essa pasta" / Conexão Recusada**: Quase sempre, isto é causado pelo Firewall do Windows na máquina que está a rodar o servidor. A pessoa que está a rodar o servidor precisa de criar uma regra de entrada para permitir conexões na porta TCP 2121.

- **A Conexão Falha**: Verifique se o endereço IP do servidor está correto e se ambos os computadores (servidor e cliente) estão na mesma rede.