# 🌐 FrontEnd

Esta parte do projeto é responsável por fornecer a interface visual que mostra o tráfego de rede de clientes. O Front foi construído com [Angular CLI](https://github.com/angular/angular-cli) na versão 20.2.2 e foi diretamente integrado à FastAPI do `BackEnd_RESTful`.

## 🔷 Funcionalidades
- ***Gráfico principal***: exibe o tráfego por cliente (IP) separado entre Download e Upload;
- ***Função Drill-down***: detalhamento dos protocolos por cliente selecionado;
- ***Top Talker***: destaca o cliente com maior volume de tráfego;
- ***Estatísticas em Tempo Real***: Sidebar com contadores e métricas.

## 📁 Estrutura do Projeto
<pre>
└── src/
    ├── app/
    │   ├── components/ # Componentes da interface
    │   ├── models # Modelos de dados
    │   ├── pages/home # Estrutura da home do projeto
    │   └── services # Serviços de integração com API
    └── assets # Recursos estáticos
</pre>
    
## 📋 Pré-requisitos 
Antes de começar, certifique-se de ter instalado:
- [Node.js](https://nodejs.org/) (versão 18.x ou superior)
- [Angular CLI](https://angular.io/cli) (versão 20.2.2)

Para instalar o Angular CLI globalmente, execute:
```bash
npm install -g @angular/cli@20.2.2
```

## 🎮 Uso na Interface
- Cada barra do gráfico representa um cliente (IP).
    - Metade superior: tráfego de download;
    - Métade inferior: tráfego de upload.
- Tooltips: ao passar o mouse sobre as barras, os valores exatos serão exibidos.
- Drill-down: ao clicar em qualquer cliente, é possível ver os detalhes por protocolo.
    - O botão superior permite retornar ao gráfico principal.
 
## ⚙️ Configurando o ambiente
Para iniciar dentro dessa parte do projeto, é necessário configurar o ambiente:
1. No terminal, instale as competências:
```bash
npm install
```
2. Com as dependências devidamente instaladas, rode o projeto:

```bash
ng serve
```
Após a instalação e inicialização do projeto, em seu navegador entre em: `http://localhost:4200/`


***Observação***: se houver algum erro nas dependências, limpe o cache e reinstale:
- ```bash
  rm -rf node_modules package-lock.json
    ```
- ```bash
  npm install
    ```


    


  
