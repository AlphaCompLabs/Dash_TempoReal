# CLAUDE.md, Dash_TempoReal (NetVision)

> **Spec viva.** Porta de entrada lida pelo agente em toda sessão. Não duplica o [README.md](README.md), **aponta** pra ele. Atualize quando uma regra, comando, módulo ou hurdle mudar.
>
> **Última revisão:** 2026-11-10
> **Rodar o sistema completo (5 terminais), formato do JSON e testes:** [README.md](README.md)

---

## 1. O que é

**NetVision**, dashboard de análise de tráfego de rede em tempo real da equipe AlphaCompLabs (Caio Silveira, Diogo Freitas, Elisa Nunes de Freitas, Giovanna, Gustavo Martins Gripaldi, Mariana Monteiro, Mayron Malaquias, Pedrobrgss). O `Network_analyzer` (Scapy) captura pacotes e posta janelas de 5 s no `BackEnd_RESTful` (FastAPI); o frontend Angular consulta a API a cada 5 s e mostra tráfego por cliente (IP), drill-down por protocolo e histórico de 60 s. Ao vivo: https://alphacomplabs.github.io/Dash_TempoReal/ (**demo estática: dados simulados no navegador**). Página no portfólio de Gustavo: https://g2portfolio.grovicdata.com/projetos/dash-tempo-real/. Versão anterior à demo: tag `v1-pre-demo`.

## 2. Stack + Comandos

Angular 20.3 standalone (zone.js, CSR, sem SSR) + Tailwind v4 (`@tailwindcss/postcss`) + Chart.js/ng2-charts (só no histórico, carregado sob demanda). Node 22. Backend: Python, FastAPI, Scapy/Npcap. Mantido em Angular 20 de propósito (o builder de testes jest e o ng2-charts 8 travam o salto para 21 sem ganho visível).

```bash
cd FrontEnd/FrontEnd-Angular
npm start              # frontend real, fala com http://127.0.0.1:8000 (ver README para backend + analyzer + servidores)
npm run start:demo     # demo com simulador: http://localhost:4200/Dash_TempoReal/
npm run build          # build de produção real (DEMO = false)
npm run build:demo     # build de produção da demo (configuração production,pages: baseHref + troca do demo.ts)
npm run check          # smoke pós-build: SEO, faixa da demo, créditos, zero travessão longo, invariantes do simulador
npm run build:pages    # build:demo + check + cópia para ../../docs (.nojekyll, 404.html noindex)
```

## 3. Mapa de módulos

| Caminho | Responsabilidade |
|---|---|
| `BackEnd_RESTful/main.py` | API FastAPI (ingestão + consumo). Fonte dos formatos JSON que o simulador imita. |
| `Network_analyzer/` | Captura Scapy, agregação por janela, emissão para a API. `util.py` define os rótulos de protocolo. |
| `Servidores/` | Servidores HTTP (8001) e FTP (2121) usados para gerar tráfego nos testes. |
| `FrontEnd/FrontEnd-Angular/src/app/services/traffic-data.ts` | Fonte única dos dados no front: polling de 5 s via HttpClient. Não sabe da demo. |
| `FrontEnd/FrontEnd-Angular/src/app/demo/` | `demo.ts` (flag, trocado por `demo.pages.ts` no build da demo), `traffic-sim.ts` (simulador, sem imports), `traffic-sim.interceptor.ts` (responde `/api/*`). |
| `FrontEnd/FrontEnd-Angular/src/app/components/` | header, welcome (painel de boas-vindas), sidebar (anéis de download/upload), main-chart (barras + drill-down + histórico), `history-chart.component.ts` (canvas Chart.js, `@defer`), footer. |
| `FrontEnd/FrontEnd-Angular/src/app/team.ts` | Equipe, URL do repo e do portfólio (faixa e créditos em `app.component.html`). Repetida no JSON-LD do `src/index.html`. |
| `FrontEnd/FrontEnd-Angular/scripts/` | `check.mjs`, `pages.mjs`. |
| `FrontEnd/FrontEnd-Angular/public/` | `og.png` (1200x630, screenshot da demo), `robots.txt`, `sitemap.xml`. |
| `docs/` | Saída do build publicada no GitHub Pages. Nunca editar à mão. |

## 4. Regras SEMPRE-ATIVAS

- **Visual é da equipe:** preservar layout, cores (tokens em `styles.css`), fontes (Montserrat + Saved by Zero) e imagens. Ajuste só o que estiver quebrado (responsivo, contraste, performance). `--color-secondary` foi clareado de `#79A9BB` para `#84B3C4` só para passar AA.
- **Demo atrás das interfaces reais:** nada de `if (DEMO)` em serviço ou componente de dados. O simulador entra só pelo interceptor; a API real continua funcionando com `DEMO = false`.
- **Faixa de aviso** na demo: "Demo estática para portfólio: dados simulados no navegador." + link do portfólio com barra no fim. Créditos da equipe sempre visíveis no rodapé.
- **Base `/Dash_TempoReal/`:** caminhos de assets sempre relativos (`assets/...`), nunca `/assets/...`. A altura da faixa entra em `--demo-bar` (sidebar, home e botão do painel descontam).
- **Links do router terminam em `/`** (`TrailingSlashSerializer`); rota `**` volta para o dashboard (o `404.html` do Pages sobe o app).
- **Zero travessão longo (U+2014)** em texto visível; o `check` decodifica os escapes `\xNN`/`\uNNNN` do esbuild antes de procurar.
- **Bundle inicial sem Chart.js:** o histórico fica em `@defer (on immediate)` dentro do `@if` do painel. Sem `prefetch on idle` (avaliava o Chart.js depois do load e gerava uma long task de ~700 ms no mobile).
- **`npm run build:pages` verde** antes de publicar.

## 5. Segurança

- A demo não faz nenhuma requisição de rede para dados (interceptor responde tudo em memória). Única origem externa: Google Fonts (CSS embutido no HTML pelo build, woff2 do gstatic).
- Dados exibidos só por interpolação do Angular (escapados), sem `innerHTML`.
- Sem segredos no worktree (varredura de 2026-11-10: zero). O histórico do git tem `venv/` e `net_backend/.venv/` antigos com código de bibliotecas (sem credenciais reais). `.gitignore` cobre `venv`, `.env*`, `__pycache__`, `node_modules`, `dist`, `.angular`, `.shots/`.
- CORS do backend real limitado a `localhost:4200`.

## 6. Common Hurdles

- **`HttpClientModule` em `imports` de componente standalone** cria um HttpClient separado, sem os interceptors do `app.config`: foi removido do `WelcomeComponent` (senão a demo tentava `localhost:8000`).
- **Classes globais sem layer vencem utilitários do Tailwind v4** (`.themed-image { display: inline-block }` ganha de `max-sm:hidden`). Para esconder/mostrar essas, usar CSS próprio.
- **Node 22 `cpSync` sai com 127** no caminho com "Programação": `pages.mjs` usa `cp` de `fs/promises`.
- **Git Bash converte `/Dash_TempoReal/` em caminho do Windows** ao passar como argumento: usar `MSYS_NO_PATHCONV=1`.
- **Kaspersky e Lighthouse:** injeta um script http (`gc.kis...kaspersky-labs.com`) e derruba boas práticas para ~82 (`is-on-https`). Medir no Chromium do Playwright com `--remote-debugging-port` + `npx lighthouse@12 <url> --port=<porta>`, servindo `docs/` com gzip sob `/Dash_TempoReal/`. Medição de 2026-11-10: mobile 90/100/82/100, desktop 100/100/81/100 (perf/a11y/BP/SEO).
- **Imagens originais em 2363 px** exibidas a 32-140 px: foram redimensionadas (PNG com paleta, mesmos nomes). Se trocar arte, exportar no tamanho de uso (2x).
- **Chart.js responsivo** mede o pai do `<canvas>`: o host do `HistoryChartComponent` é `display: block; height: 100%`.
