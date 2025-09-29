/**
 * =====================================================================================
 * SERVIÇO DE DADOS DE TRÁFEGO (TRAFFIC DATA SERVICE)
 * Versão: 2.3.0 (Padronização do Código)
 *
 * Autor: Equipe Frontend
 * Descrição: Este serviço é a única fonte de verdade para os dados de tráfego
 * da aplicação. Ele se comunica com a API Backend, buscando dados
 * periodicamente (polling) e os disponibiliza de forma reativa através
 * de Observables, gerenciando também os estados de carregamento e erro.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ClientTrafficSummary, ProtocolDrilldown } from '../models/traffic.model';

// --- SEÇÃO 2: INTERFACES ---
export interface GlobalProtocolSummary {
  name: string;
  y: number;
}

// --- SEÇÃO 3: METADADOS DO SERVIÇO ---
@Injectable({
  providedIn: 'root'
})
export class TrafficDataService implements OnDestroy {

  // --- SEÇÃO 4: CONSTANTES E CONFIGURAÇÕES ---
  private readonly API_BASE_URL = 'http://127.0.0.1:8000';
  private readonly POLLING_INTERVAL_MS = 5000;

  // --- SEÇÃO 5: GERENCIAMENTO DE ESTADO REATIVO ---

  // Subjects Privados: Armazenam o estado interno do serviço.
  private readonly trafficDataSubject = new BehaviorSubject<ClientTrafficSummary[]>([]);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(true);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly isDrillDownActiveSubject = new BehaviorSubject<boolean>(false);
  private readonly selectedClientDataSubject = new BehaviorSubject<ClientTrafficSummary | null>(null);

  // Observables Públicos: Exponhem o estado de forma segura (somente leitura).
  public readonly trafficData$: Observable<ClientTrafficSummary[]> = this.trafficDataSubject.asObservable();
  public readonly isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  public readonly error$: Observable<string | null> = this.errorSubject.asObservable();
  public readonly isDrillDownActive$: Observable<boolean> = this.isDrillDownActiveSubject.asObservable();
  public readonly selectedClientData$: Observable<ClientTrafficSummary | null> = this.selectedClientDataSubject.asObservable();

  // Propriedades internas para gerenciamento.
  private pollingSubscription!: Subscription;

  // --- SEÇÃO 6: CONSTRUTOR E CICLO DE VIDA ---
  constructor(private http: HttpClient) {
    this.startDataPolling();
  }

  /**
   * Executado na destruição do serviço.
   * Garante que a inscrição do polling seja cancelada para evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  // --- SEÇÃO 7: MÉTODOS PÚBLICOS (API DO SERVIÇO) ---

  /**
   * Busca os dados detalhados por protocolo para um cliente específico.
   * @param ip O endereço IP do cliente a ser detalhado.
   * @returns Um Observable com os dados de drilldown ou um array vazio em caso de erro.
   */
  public getProtocolDrilldownData(ip: string): Observable<ProtocolDrilldown[]> {
    const drilldownUrl = `${this.API_BASE_URL}/api/traffic/${ip}/protocols`;
    return this.http.get<ProtocolDrilldown[]>(drilldownUrl).pipe(
      catchError(error => {
        const errorMessage = `Não foi possível carregar os detalhes para o IP ${ip}.`;
        console.error(`Erro ao buscar dados de drilldown para ${ip}:`, error);
        this.errorSubject.next(errorMessage);
        return of([]);
      })
    );
  }

  /**
   * Define o cliente atualmente selecionado no estado do serviço.
   * @param client O objeto do cliente selecionado ou `null` para limpar a seleção.
   */
  public setSelectedClient(client: ClientTrafficSummary | null): void {
    this.selectedClientDataSubject.next(client);
  }

  /**
   * Define o estado do modo de detalhe (drilldown).
   * @param isActive Booleano indicando se o modo de detalhe está ativo.
   */
  public setDrillDownState(isActive: boolean): void {
    this.isDrillDownActiveSubject.next(isActive);
  }

  /**
   * Busca um resumo global do tráfego por protocolo em toda a rede.
   * @returns Um Observable com o resumo dos protocolos ou um array vazio em caso de erro.
   */
  public getGlobalProtocolSummary(): Observable<GlobalProtocolSummary[]> {
    const summaryUrl = `${this.API_BASE_URL}/api/traffic/protocols/summary`;
    return this.http.get<GlobalProtocolSummary[]>(summaryUrl).pipe(
      catchError(error => {
        const errorMessage = `Não foi possível carregar o resumo de protocolos.`;
        console.error(`Erro ao buscar resumo de protocolos:`, error);
        return of([]);
      })
    );
  }

  // --- SEÇÃO 8: LÓGICA PRIVADA (POLLING) ---

  /**
   * Inicia o ciclo de polling que busca dados da API em intervalos regulares.
   * Utiliza `timer` e `switchMap` para uma estratégia de polling robusta.
   */
  private startDataPolling(): void {
    const trafficUrl = `${this.API_BASE_URL}/api/traffic`;
    this.pollingSubscription = timer(0, this.POLLING_INTERVAL_MS).pipe(
      tap(() => this.isLoadingSubject.next(true)),
      switchMap(() =>
        this.http.get<ClientTrafficSummary[]>(trafficUrl).pipe(
          catchError(error => {
            const errorMessage = 'Não foi possível carregar os dados do tráfego.';
            console.error('Erro ao buscar dados da API de tráfego:', error);
            this.errorSubject.next(errorMessage);
            this.trafficDataSubject.next([]);
            this.isLoadingSubject.next(false);
            return of([]);
          })
        )
      )
    ).subscribe(data => {
      this.trafficDataSubject.next(data);
      this.isLoadingSubject.next(false);
      this.errorSubject.next(null);
    });
  }
}

