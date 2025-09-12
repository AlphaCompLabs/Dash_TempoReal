# Criar uma Regra no Firewall

Para configurar o firewall, você precisa de dizer ao "segurança" que é permitido receber visitantes na porta `2121`. 

## Vamos criar uma regra de entrada no Firewall.

- Abra o **Firewall com Segurança Avançada: ** 

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