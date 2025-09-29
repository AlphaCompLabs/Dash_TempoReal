/**
 * =====================================================================================
 * ARQUIVO DE ENTRADA PRINCIPAL DA APLICAÇÃO (MAIN.TS)
 * Versão: 1.0.1
 *
 * Autor: Equipe Frontend
 * Descrição: Este é o principal ponto de entrada (entry point) da aplicação.
 * É o primeiro código a ser executado. Sua única responsabilidade é
 * inicializar (bootstrap) o Angular, carregando o componente raiz
 * (AppComponent) e as configurações globais (appConfig).
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---

// Importações do Framework Angular
import { bootstrapApplication } from '@angular/platform-browser';

// Importações da aplicação local
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// --- SEÇÃO 1: INICIALIZAÇÃO (BOOTSTRAP) DA APLICAÇÃO ---

/**
 * A função 'bootstrapApplication' inicia a aplicação Angular no navegador.
 * @param AppComponent O componente raiz que servirá como a "casca" principal da aplicação.
 * @param appConfig O objeto de configuração que fornece os serviços e funcionalidades
 * essenciais, como rotas e cliente HTTP.
 */
bootstrapApplication(AppComponent, appConfig)
  // O '.catch()' captura e exibe no console qualquer erro crítico que possa ocorrer
  // durante o processo de inicialização da aplicação, que é um evento raro.
  .catch((err) => console.error(err));