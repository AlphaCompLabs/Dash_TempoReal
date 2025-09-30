/*
# =====================================================================================
# SERVIDOR FRONTEND - COMPONENTE HEADER (CABEÇALHO DA APLICAÇÃO)
# Versão: 2.2.1 (Revisão Final de Padrões de Código)
#
# Autor(es): Equipe Frontend 
# Data: 2025-09-30
# Descrição: Este componente renderiza o cabeçalho principal da aplicação.
#            Ele gerencia a troca de tema (claro/escuro) e a alternância
#            de visibilidade do painel de histórico.
# =====================================================================================
*/

// --- SEÇÃO 1: IMPORTAÇÕES E DEPENDÊNCIAS ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';

// --- SEÇÃO 2: METADADOS DO COMPONENTE ---
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
/**
 * Componente Header que serve como a barra de navegação superior da aplicação.
 */
export class HeaderComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 3: PROPRIEDADES DA CLASSE ---

  /**
   * Flag que indica se o tema claro está ativo.
   * É pública para ser acessível diretamente pelo template do componente.
   * @public
   */
  public isLightMode = false;

  /**
   * Armazena a inscrição (subscription) ao Observable do tema para
   * posterior cancelamento, evitando vazamentos de memória.
   * @private
   */
  private themeSubscription!: Subscription;


  // --- SEÇÃO 4: CONSTRUTOR E INJEÇÃO DE DEPENDÊNCIAS ---

  /**
   * Inicializa o componente injetando os serviços necessários.
   * @param themeService Serviço para gerenciamento do tema da aplicação.
   * @param uiStateService Serviço para gerenciamento do estado da UI.
   */
  constructor(
    private themeService: ThemeService,
    private uiStateService: UiStateService
  ) { }


  // --- SEÇÃO 5: MÉTODOS DO CICLO DE VIDA (LIFECYCLE HOOKS) ---

  /**
   * Método executado na inicialização do componente.
   * Inscreve-se no estado do tema para atualizar a UI em tempo real.
   */
  ngOnInit(): void {
    this.themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      this.isLightMode = isLight;
    });
  }

  /**
   * Método executado na destruição do componente.
   * Cancela a inscrição ao Observable de tema para prevenir vazamentos de memória (memory leaks).
   */
  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }


  // --- SEÇÃO 6: MÉTODOS PÚBLICOS (EVENT HANDLERS) ---

  /**
   * Delega ao ThemeService a responsabilidade de alternar o tema.
   * Chamado por um evento de clique no template.
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Delega ao UiStateService a responsabilidade de alternar a visibilidade do painel de histórico.
   * Chamado por um evento de clique no template.
   */
  toggleHistory(): void {
    this.uiStateService.toggleHistoryChart();
  }
}