# 🌐 FrontEnd

Esta parte do projeto é responsável por fornecer a interface visual que mostra o tráfego de rede de clientes. O Front foi construído com [Angular CLI](https://github.com/angular/angular-cli) na versão 20.2.2 e foi diretamente integrado à FastAPI do `BackEnd_RESTful`.

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

Após a instalação e inicialização do projeo, em seu navegador entre em: `http://localhost:4200/`. 

## 🔷 O que é exibido:
- No gráfico principal, o tráfego por cliente (IP) é separado entre Download e Upload;
- A função Drill-down detalha os protocolos quando um cliente específico é selecionado;
- O Top Talker destaca o cliente com maior volume de tráfego;
- No sidebar as estatísticas são contabilizadas e exibidas.

## 🔷 Uso dentro da interface
- Cada barra do gráfico representa um cliente (IP).
    - Metade superior: tráfego de download;
    - Métade inferior: tráfego de upload.
- Tooltips: ao passar o mouse sobre as barras, os valores exatos serão exibidos.
- Drill-down: ao clicar em qualquer cliente, é possível ver os detalhes por protocolo.
    - O botão superior permite retornar ao gráfico principal.

  
