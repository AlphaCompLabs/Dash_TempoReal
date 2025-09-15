/**
 * =========================================================================
 * SERVIÇO DE DADOS DE TRÁFEGO (APLICAÇÃO REAL)
 * Versão: 2.0.0
 *
 * Descrição: Este serviço é o único responsável por comunicar com a API
 * Backend. Ele busca os dados de tráfego periodicamente (polling) e
 * disponibiliza-os de forma reativa para qualquer componente da aplicação
 * que precise deles.
 * =========================================================================
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ClientTrafficSummary, ProtocolDrilldown } from '../models/traffic.model';

@Injectable({
  providedIn: 'root'
})
export class TrafficDataService {
  // --- A URL base da vossa API Backend ---
  // Mantenha-a num único lugar para facilitar futuras alterações.
  private readonly API_BASE_URL = 'http://localhost:8000';

  // --- Estado Reativo (Reactive State) ---
  // BehaviorSubjects para guardar o estado atual dos dados, do carregamento e dos erros.
  private trafficDataSubject = new BehaviorSubject<ClientTrafficSummary[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(true); // Começa como true na primeira carga
  private errorSubject = new BehaviorSubject<string | null>(null);

  // --- Observables Públicos ---
  // Os componentes da aplicação (gráficos, sidebar, etc.) irão "inscrever-se" (subscribe)
  // a estes Observables para receberem atualizações automáticas.
  public trafficData$: Observable<ClientTrafficSummary[]> = this.trafficDataSubject.asObservable();
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicia a busca de dados assim que o serviço é criado.
    this.startDataPolling();
  }

  /**
   * Inicia o ciclo de "polling" que busca dados da API a cada 5 segundos.
   */
  private startDataPolling(): void {
    timer(0, 5000) // Inicia imediatamente (0) e repete a cada 5000ms
      .pipe(
        tap(() => this.isLoadingSubject.next(true)), // Avisa que uma busca começou
        switchMap(() => // switchMap cancela a requisição anterior se uma nova começar
          this.http.get<ClientTrafficSummary[]>(`${this.API_BASE_URL}/api/traffic`)
            .pipe(
              catchError(error => { // Lida com erros na chamada HTTP
                console.error('Erro ao buscar dados da API:', error);
                this.errorSubject.next('Não foi possível carregar os dados do tráfego.');
                return of([]); // Retorna um array vazio para não quebrar a aplicação
              })
            )
        )
      )
      .subscribe(data => {
        // Quando os dados chegam com sucesso:
        this.trafficDataSubject.next(data); // Atualiza os dados para todos os 'inscritos'
        this.isLoadingSubject.next(false);   // Avisa que a busca terminou
        this.errorSubject.next(null);        // Limpa qualquer erro anterior
      });
  }

  /**
   * Busca os dados detalhados por protocolo para um cliente específico.
   * Esta função é chamada sob demanda (ex: quando um utilizador clica numa barra do gráfico).
   * @param ip O endereço IP do cliente a ser detalhado.
   */
  public getProtocolDrilldownData(ip: string): Observable<ProtocolDrilldown[]> {
    return this.http.get<ProtocolDrilldown[]>(`${this.API_BASE_URL}/api/traffic/${ip}/protocols`)
      .pipe(
        catchError(error => {
          console.error(`Erro ao buscar dados de drill down para o IP ${ip}:`, error);
          this.errorSubject.next(`Não foi possível carregar os detalhes para o IP ${ip}.`);
          return of([]); // Retorna um array vazio em caso de erro
        })
      );
  }
}

