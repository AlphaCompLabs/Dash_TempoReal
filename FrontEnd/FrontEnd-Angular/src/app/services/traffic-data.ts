/**
 * =====================================================================================
 * SERVIÇO DE DADOS DE TRÁFEGO (TRAFFIC DATA SERVICE)
 * Versão: 2.1.0 (Aprimorado com tratamento de erro robusto e constantes)
 *
 * Autor: Equipe Frontend
 * Descrição: Este serviço é a única fonte de verdade para os dados de tráfego
 * da aplicação. Ele se comunica com a API Backend, buscando dados
 * periodicamente (polling) e os disponibiliza de forma reativa através
 * de Observables, gerenciando também os estados de carregamento e erro.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ClientTrafficSummary, ProtocolDrilldown } from '../models/traffic.model';

// --- SEÇÃO 1: METADADOS DO SERVIÇO ---
@Injectable({
  providedIn: 'root'
})
export class TrafficDataService implements OnDestroy {

  // --- SEÇÃO 2: CONSTANTES E CONFIGURAÇÕES ---
  private readonly API_BASE_URL = 'http://127.0.0.1:8000';
  private readonly POLLING_INTERVAL_MS = 5000; // Intervalo de busca de dados em milissegundos

  // --- SEÇÃO 3: GERENCIAMENTO DE ESTADO REATIVO (STATE MANAGEMENT) ---

  /** Armazena o último snapshot dos dados de tráfego. */
  private readonly trafficDataSubject = new BehaviorSubject<ClientTrafficSummary[]>([]);
  /** Armazena o estado de carregamento (true se uma busca está em andamento). */
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(true);
  /** Armazena a última mensagem de erro ocorrida. */
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  /** Observable público para os dados de tráfego. Componentes se inscrevem a ele. */
  public readonly trafficData$: Observable<ClientTrafficSummary[]> = this.trafficDataSubject.asObservable();
  /** Observable público para o estado de carregamento. */
  public readonly isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  /** Observable público para o estado de erro. */
  public readonly error$: Observable<string | null> = this.errorSubject.asObservable();

  // --- SEÇÃO 4: PROPRIEDADES DO SERVIÇO ---
  private pollingSubscription!: Subscription;

  // --- SEÇÃO 5: CICLO DE VIDA E INICIALIZAÇÃO ---

  constructor(private http: HttpClient) {
    this.startDataPolling();
  }

  /**
   * Garante que a inscrição do polling seja cancelada quando o serviço for destruído.
   * Embora seja um serviço singleton, esta é uma prática robusta.
   */
  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  // --- SEÇÃO 6: MÉTODOS PÚBLICOS (API DO SERVIÇO) ---

  /**
   * Busca os dados detalhados por protocolo para um cliente específico.
   * @param ip O endereço IP do cliente a ser detalhado.
   * @returns Um Observable com os dados de drilldown ou um array vazio em caso de erro.
   */
  public getProtocolDrilldownData(ip: string): Observable<ProtocolDrilldown[]> {
    const drilldownUrl = `${this.API_BASE_URL}/api/traffic/${ip}/protocols`;
    return this.http.get<ProtocolDrilldown[]>(drilldownUrl)
      .pipe(
        catchError(error => {
          const errorMessage = `Não foi possível carregar os detalhes para o IP ${ip}.`;
          console.error(`Erro ao buscar dados de drilldown para ${ip}:`, error);
          this.errorSubject.next(errorMessage);
          return of([]); // Retorna um Observable com um array vazio para não quebrar a inscrição
        })
      );
  }

  // --- SEÇÃO 7: LÓGICA PRIVADA (POLLING E FETCHING) ---

  /**
   * Inicia o ciclo de polling que busca dados da API em intervalos regulares.
   */
  private startDataPolling(): void {
    const trafficUrl = `${this.API_BASE_URL}/api/traffic`;

    this.pollingSubscription = timer(0, this.POLLING_INTERVAL_MS)
      .pipe(
        // Antes de cada busca, sinaliza que o carregamento começou.
        tap(() => this.isLoadingSubject.next(true)),

        // Cancela a requisição HTTP anterior se uma nova for iniciada (evita race conditions).
        switchMap(() =>
          this.http.get<ClientTrafficSummary[]>(trafficUrl).pipe(
            // Em caso de erro na requisição HTTP, trata o erro sem quebrar o polling.
            catchError(error => {
              const errorMessage = 'Não foi possível carregar os dados do tráfego.';
              console.error('Erro ao buscar dados da API de tráfego:', error);
              this.errorSubject.next(errorMessage);
              this.trafficDataSubject.next([]); // Aprimoramento: Limpa dados antigos em caso de erro.
              this.isLoadingSubject.next(false); // Correção Crítica: Finaliza o loading em caso de erro.
              return of([]); // Retorna um array vazio para o fluxo principal (timer) não quebrar.
            })
          )
        )
      )
      .subscribe(data => {
        // Bloco executado a cada vez que dados são recebidos com sucesso:
        this.trafficDataSubject.next(data);  // 1. Atualiza os dados para todos os componentes.
        this.isLoadingSubject.next(false);   // 2. Avisa que o carregamento terminou.
        this.errorSubject.next(null);        // 3. Limpa qualquer mensagem de erro anterior.
      });
  }
}