/**
 * =====================================================================================
 * SERVIÇO DE DADOS DE TRÁFEGO (TRAFFIC DATA SERVICE)
 * Versão: 2.3.1 (Otimizado com Cache)
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
// Importação do 'shareReplay'
import { BehaviorSubject, Observable, Subscription, timer, of, shareReplay } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ClientTrafficSummary, ProtocolDrilldown } from '../models/traffic.model';

// --- SEÇÃO 2: INTERFACES ---
export interface GlobalProtocolSummary {
  name: string;
  y: number;
}

interface ServerInfoResponse {
  server_ip: string;
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

  // Subjects Privados
  private readonly trafficDataSubject = new BehaviorSubject<ClientTrafficSummary[]>([]);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(true);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly isDrillDownActiveSubject = new BehaviorSubject<boolean>(false);
  private readonly selectedClientDataSubject = new BehaviorSubject<ClientTrafficSummary | null>(null);

  // Observables Públicos
  public readonly trafficData$: Observable<ClientTrafficSummary[]> = this.trafficDataSubject.asObservable();
  public readonly isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  public readonly error$: Observable<string | null> = this.errorSubject.asObservable();
  public readonly isDrillDownActive$: Observable<boolean> = this.isDrillDownActiveSubject.asObservable();
  public readonly selectedClientData$: Observable<ClientTrafficSummary | null> = this.selectedClientDataSubject.asObservable();

  // Propriedades internas
  private pollingSubscription!: Subscription;
  // Propriedade para guardar o resultado da busca do IP do servidor em cache.
  private serverInfoCache$: Observable<ServerInfoResponse> | null = null;


  // --- SEÇÃO 6: CONSTRUTOR E CICLO DE VIDA ---
  constructor(private http: HttpClient) {
    this.startDataPolling();
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  // --- SEÇÃO 7: MÉTODOS PÚBLICOS (API DO SERVIÇO) ---

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

  public setSelectedClient(client: ClientTrafficSummary | null): void {
    this.selectedClientDataSubject.next(client);
  }

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

  /**
   * Busca o IP do servidor com uma estratégia de cache.
   * A chamada HTTP é feita apenas uma vez e o resultado é reutilizado.
   * @returns Um Observable com a informação do servidor.
   */
  public getServerInfo(): Observable<ServerInfoResponse> {
    if (!this.serverInfoCache$) {
      const serverInfoUrl = `${this.API_BASE_URL}/api/server-info`;
      this.serverInfoCache$ = this.http.get<ServerInfoResponse>(serverInfoUrl).pipe(
        shareReplay(1)
      );
    }
    return this.serverInfoCache$;
  }

  // --- SEÇÃO 8: LÓGICA PRIVADA (POLLING) ---

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
