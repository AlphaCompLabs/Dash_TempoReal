/*
# =====================================================================================
# SERVIDOR FRONTEND - SERVIÇO DE DADOS DE TRÁFEGO (TRAFFIC DATA SERVICE)
# Versão: 3.0.1 (Padronização de Código e Documentação)
#
# Autor(es): Equipe Frontend 
# Data: 2025-09-30
# Descrição: Este serviço é a única fonte da verdade para os dados de tráfego.
#            Ele gerencia o estado da aplicação relacionado aos dados, buscando
#            informações da API em intervalos regulares de forma síncrona.
# =====================================================================================
*/

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer, of, shareReplay, forkJoin } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ClientTrafficSummary, ProtocolDrilldown, HistoricalDataPoint } from '../models/traffic.model';

// --- SEÇÃO 2: INTERFACES LOCAIS ---

/** Estrutura para o resumo global de protocolos. */
export interface GlobalProtocolSummary { name: string; y: number; }

/** Estrutura para a resposta da API de informações do servidor. */
interface IServerInfo { server_ip: string; }


// --- SEÇÃO 3: DECORADOR E DEFINIÇÃO DO SERVIÇO ---
@Injectable({ providedIn: 'root' })
/**
 * Gerencia todo o estado e a comunicação com a API de dados de tráfego.
 */
export class TrafficDataService implements OnDestroy {

  // --- SEÇÃO 4: PROPRIEDADES E ESTADO DA CLASSE ---

  // --- Constantes de Configuração ---
  private readonly API_BASE_URL = 'http://127.0.0.1:8000';
  private readonly POLLING_INTERVAL_MS = 5000;
  private readonly API_ERROR_MESSAGE = 'Não foi possível carregar os dados do tráfego.';

  // --- Gerenciamento de Estado Interno (Subjects) ---
  private readonly trafficDataSubject = new BehaviorSubject<ClientTrafficSummary[]>([]);
  private readonly historyDataSubject = new BehaviorSubject<HistoricalDataPoint[]>([]);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(true);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly isDrillDownActiveSubject = new BehaviorSubject<boolean>(false);
  private readonly selectedClientDataSubject = new BehaviorSubject<ClientTrafficSummary | null>(null);

  // --- Observables Públicos (API do Serviço) ---
  public readonly trafficData$: Observable<ClientTrafficSummary[]> = this.trafficDataSubject.asObservable();
  public readonly historyData$: Observable<HistoricalDataPoint[]> = this.historyDataSubject.asObservable();
  public readonly isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  public readonly error$: Observable<string | null> = this.errorSubject.asObservable();
  public readonly isDrillDownActive$: Observable<boolean> = this.isDrillDownActiveSubject.asObservable();
  public readonly selectedClientData$: Observable<ClientTrafficSummary | null> = this.selectedClientDataSubject.asObservable();

  // --- Gerenciamento de Inscrições e Cache ---
  private subscriptions = new Subscription();
  private serverInfoCache$: Observable<IServerInfo> | null = null;


  // --- SEÇÃO 5: CONSTRUTOR E CICLO DE VIDA ---

  /**
   * @param http Serviço do Angular para realizar requisições HTTP.
   */
  constructor(private http: HttpClient) {
    this.startDataPolling();
  }

  /**
   * Garante que a inscrição de polling seja cancelada quando o serviço for destruído.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  // --- SEÇÃO 6: MÉTODOS PÚBLICOS (API DO SERVIÇO) ---

  /**
   * Busca os dados de tráfego detalhados por protocolo para um IP específico.
   * @param ip O endereço IP do cliente.
   * @returns Um Observable com a lista de protocolos ou um array vazio em caso de erro.
   */
  public getProtocolDrilldownData(ip: string): Observable<ProtocolDrilldown[]> {
    const drilldownUrl = `${this.API_BASE_URL}/api/traffic/${ip}/protocols`;
    return this.http.get<ProtocolDrilldown[]>(drilldownUrl).pipe(
      catchError(error => {
        console.error(`Erro ao buscar dados de drilldown para ${ip}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Define o cliente atualmente selecionado para o modo de foco (drilldown).
   * @param client O objeto do cliente ou `null` para limpar a seleção.
   */
  public setSelectedClient(client: ClientTrafficSummary | null): void {
    this.selectedClientDataSubject.next(client);
  }

  /**
   * Define o estado do modo de foco (drilldown).
   * @param isActive `true` se o modo de foco estiver ativo, `false` caso contrário.
   */
  public setDrillDownState(isActive: boolean): void {
    this.isDrillDownActiveSubject.next(isActive);
  }

  /**
   * Busca um resumo agregado de todos os protocolos na rede.
   * @returns Um Observable com o resumo ou um array vazio em caso de erro.
   */
  public getGlobalProtocolSummary(): Observable<GlobalProtocolSummary[]> {
    const summaryUrl = `${this.API_BASE_URL}/api/traffic/protocols/summary`;
    return this.http.get<GlobalProtocolSummary[]>(summaryUrl).pipe(
      catchError(error => {
        console.error(`Erro ao buscar resumo de protocolos:`, error);
        return of([]);
      })
    );
  }

  /**
   * Busca as informações do servidor, utilizando um cache para evitar requisições repetidas.
   * @returns Um Observable com as informações do servidor.
   */
  public getServerInfo(): Observable<IServerInfo> {
    if (!this.serverInfoCache$) {
      const serverInfoUrl = `${this.API_BASE_URL}/api/server-info`;
      this.serverInfoCache$ = this.http.get<IServerInfo>(serverInfoUrl).pipe(
        shareReplay(1) // Cacheia a última resposta e a compartilha com novos inscritos.
      );
    }
    return this.serverInfoCache$;
  }


  // --- SEÇÃO 7: MÉTODOS PRIVADOS (LÓGICA INTERNA) ---

  /**
   * Inicia o processo de polling que busca dados da API em intervalos regulares.
   * Utiliza `forkJoin` para buscar dados de tráfego e histórico de forma concorrente.
   */
  private startDataPolling(): void {
    const trafficUrl = `${this.API_BASE_URL}/api/traffic`;
    const historyUrl = `${this.API_BASE_URL}/api/traffic/history`;

    const polling$ = timer(0, this.POLLING_INTERVAL_MS).pipe(
      tap(() => this.isLoadingSubject.next(true)),
      switchMap(() => {
        const trafficRequest$ = this.http.get<ClientTrafficSummary[]>(trafficUrl);
        const historyRequest$ = this.http.get<HistoricalDataPoint[]>(historyUrl);

        return forkJoin([trafficRequest$, historyRequest$]).pipe(
          catchError(error => {
            console.error('Erro ao buscar dados da API:', error);
            this.errorSubject.next(this.API_ERROR_MESSAGE);
            // Retorna um valor padrão para não quebrar o stream
            return of([[], []] as [ClientTrafficSummary[], HistoricalDataPoint[]]);
          })
        );
      })
    );

    this.subscriptions.add(
      polling$.subscribe(([trafficData, historyData]) => {
        this.errorSubject.next(null); // Limpa erros anteriores em caso de sucesso
        this.trafficDataSubject.next(trafficData);
        this.historyDataSubject.next(historyData);
        this.isLoadingSubject.next(false);
      })
    );
  }
}