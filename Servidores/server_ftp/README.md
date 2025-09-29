# Como iniciar o servidor FTP

1. Acesse a pasta servidores_teste:

```
cd Servidores/server_ftp
```

2. Crie o ambiente virtual `venv`:

```
python -m venv venv
```

3. Inicie o ambiente virtual:

```
.\venv\Scripts\activate
```

4. Baixe a biblioteca `pyftpdlib`:

```
pip install pyftpdlib
```

5. Inicie o servidor no terminal Power Shell:
```
python ftp_server.py 
```

6. Após iniciar o servidor ele retornará a seguinte mensagem:

```
INFO: Servidor FTP iniciado em ftp://0.0.0.0:2121
```

7. Para acessar o servidor abra o Prompt de Comando do seu servidor e utilize o comando:

```
ipconfig
```

8. Identifique o seu IP e acesse o seguinte local por meio do seu **Gerenciador de Arquivos  (A "pasta amarela")**:

```
ftp://<SEU_IP_AQUI>:2121
```

### Observação: Caso não seja possível acessar o servidor FTP, será necessário criar uma regra no Firewall.

# Criar uma Regra no Firewall

Para configurar o firewall, você precisa de dizer ao "segurança" que é permitido receber visitantes na porta `2121`. 

## Vamos criar uma regra de entrada no Firewall.

- Abra o **Firewall com Segurança Avançada:** 

- Clique no menu Iniciar e pesquise por Firewall do Windows Defender com Segurança Avançada. Clique para abrir.

- Crie uma Nova Regra de Entrada:

- Na coluna da esquerda, clique em `"Regras de Entrada"`.

- Na coluna da direita, clique em `"Nova Regra..."`.

- Siga o Assistente:

- Tipo de Regra: Selecione `"Porta"` e clique em `"Avançar"`.

- Protocolo e Portas: Selecione `"TCP"`. Em "Portas locais específicas", digite `2121`. - - Clique em `"Avançar"`.

- Ação: Selecione `"Permitir a conexão"`. Clique em `"Avançar"`.

- Perfil: Deixe as caixas marcadas como estão (geralmente `"Domínio"`, `"Particular"`, `"Público"`). Clique em `"Avançar"`.

- Nome: Dê um nome fácil de lembrar para a regra, como `Servidor FTP do Projeto`. Clique em `"Concluir"`.