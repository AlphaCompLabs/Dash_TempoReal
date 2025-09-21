/**
 * =====================================================================================
 * ARQUIVO DE DEFINIÇÃO DE ROTAS DA APLICAÇÃO (APP ROUTES)
 * Versão: 1.0.0
 *
 * Autor: Equipe Frontend
 * Descrição: Este arquivo centraliza a configuração das rotas da aplicação Angular.
 * Ele mapeia os caminhos da URL (paths) para os componentes que devem ser
 * renderizados para cada caminho.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---

// Importações do Framework Angular
import { Routes } from '@angular/router';

// Importação dos componentes de página (Pages)
import { HomeComponent } from './pages/home/home.component';

// --- SEÇÃO 1: DEFINIÇÃO DAS ROTAS ---

/**
 * A constante 'routes' é um array de objetos que define a configuração de
 * navegação da aplicação. O Angular Router utiliza este array para determinar
 * qual componente exibir com base na URL atual do navegador.
 */
export const routes: Routes = [
  // --- Rota Principal (Página Inicial) ---
  {
    // path: '' -> Define esta como a rota padrão/raiz da aplicação (ex: http://localhost:4200/).
    path: '',

    // component: HomeComponent -> O componente que será carregado quando esta rota for ativada.
    component: HomeComponent,

    // title: '...' -> O título que será exibido na aba do navegador para esta rota.
    title: 'Netvision - Dashboard'
  }

  // Futuras rotas podem ser adicionadas aqui. Ex:
  // { path: 'settings', component: SettingsComponent, title: 'Netvision - Configurações' },
  // { path: 'about', component: AboutComponent, title: 'Netvision - Sobre' },
];