/**
 * =====================================================================================
 * ARQUIVO DE CONFIGURAÇÃO PRINCIPAL DA APLICAÇÃO (APP CONFIG)
 * Versão: 1.0.0
 *
 * Autor: Equipe Frontend
 * Descrição: Este arquivo centraliza a configuração de provedores (providers) para
 * a aplicação Angular em modo standalone. Ele define os serviços e
 * funcionalidades essenciais que estarão disponíveis em toda a aplicação,
 * como roteamento, cliente HTTP e detecção de mudanças.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---

// Importações do Framework Angular
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Importação das rotas da aplicação
import { routes } from './app.routes';
import { TrailingSlashSerializer } from './shared/trailing-slash';
import { DEMO } from './demo/demo';
import { trafficSimInterceptor } from './demo/traffic-sim.interceptor';

// --- SEÇÃO 1: CONFIGURAÇÃO DA APLICAÇÃO (appConfig) ---

/**
 * A constante 'appConfig' contém a configuração de nível raiz da aplicação.
 * O array 'providers' lista todos os serviços e funcionalidades que serão
 * injetados e disponibilizados para todos os componentes.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Configura a estratégia de detecção de mudanças do Angular.
    // 'eventCoalescing: true' é uma otimização que agrupa múltiplos eventos
    // que ocorrem na mesma "rodada" do navegador em uma única detecção de mudança.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Configura o sistema de roteamento da aplicação com as rotas
    // definidas no arquivo 'app.routes.ts'.
    provideRouter(routes),

    // Links gerados pelo router terminam em "/" (o GitHub Pages responde /caminho com 301).
    { provide: UrlSerializer, useClass: TrailingSlashSerializer },

    // Disponibiliza o serviço HttpClient para toda a aplicação,
    // permitindo a comunicação com APIs externas via requisições HTTP.
    // Na demo do GitHub Pages (DEMO = true) o interceptor responde as rotas /api/ com dados simulados no navegador.
    provideHttpClient(withInterceptors(DEMO ? [trafficSimInterceptor] : []))
  ]
};