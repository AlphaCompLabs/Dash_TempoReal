/*
# =====================================================================================
# SERVIDOR FRONTEND - SERVIÇO DE ESTADO DA UI (UI STATE SERVICE)
# Versão: 1.0.1 (Padronização de Código e Documentação)
#
# Autor(es): Equipe Frontend 
# Data: 2025-09-30
# Descrição: Serviço para gerenciar estados globais da interface do usuário (UI),
#            como a visibilidade de painéis, modais e overlays, desacoplando
#            a comunicação entre componentes não relacionados.
# =====================================================================================
*/

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';


// --- SEÇÃO 2: DECORADOR E DEFINIÇÃO DO SERVIÇO ---
@Injectable({
  providedIn: 'root'
})
/**
 * Gerencia o estado global da interface do usuário (UI).
 */
export class UiStateService {

  // --- SEÇÃO 3: GERENCIAMENTO DE ESTADO (SUBJECTS E OBSERVABLES) ---

  /**
   * Subject privado que armazena o estado de visibilidade do gráfico de histórico.
   * Inicia com o valor `false` (oculto).
   * @private
   */
  private readonly showHistoryChartSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable público que os componentes podem assinar para reagir às
   * mudanças de visibilidade do gráfico de histórico.
   * @public
   * @readonly
   */
  public readonly showHistoryChart$: Observable<boolean> = this.showHistoryChartSubject.asObservable();


  // --- SEÇÃO 4: MÉTODOS PÚBLICOS (API DO SERVIÇO) ---

  /**
   * Alterna o estado de visibilidade do gráfico de histórico.
   * Se estiver visível, o torna oculto. Se estiver oculto, o torna visível.
   */
  public toggleHistoryChart(): void {
    const currentState = this.showHistoryChartSubject.getValue();
    this.showHistoryChartSubject.next(!currentState);
  }
}