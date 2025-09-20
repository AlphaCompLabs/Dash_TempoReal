// traffic.service.ts
import { BehaviorSubject, timer, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry, switchMap, tap } from 'rxjs/operators';
import {
  API_CONFIG,
  ClientTrafficSummaryFromAPI,
  NetworkClient,
  ProtocolDrilldownFromAPI,
  ProtocolData,
} from '../models/traffic.models';

@Injectable({
  providedIn: 'root'
})
export class TrafficDataService {
  // --- A URL base da vossa API Backend ---
  // Mantida num único lugar para facilitar futuras alterações.
  private readonly API_BASE_URL = 'http://localhost:8000';

  // --- Estado Reativo (Reactive State) ---
  // BehaviorSubjects guardam o estado atual dos dados, do carregamento e dos erros.
  private trafficDataSubject = new BehaviorSubject<ClientTrafficSummaryFromAPI[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(true); // Começa como true na primeira carga
  private errorSubject = new BehaviorSubject<string | null>(null);

  // --- Observables Públicos ---
  // Os componentes (gráficos, sidebar, etc.) fazem subscribe para receber atualizações.
  public trafficData$: Observable<ClientTrafficSummaryFromAPI[]> = this.trafficDataSubject.asObservable();
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicia a busca de dados assim que o serviço é criado.
    this.startDataPolling();
  }

  // Conversão utilitária: bytes -> MB (com 2 casas)
  private bytesToMB(bytes: number): number {
    return parseFloat((bytes / (1024 * 1024)).toFixed(2));
  }

  /**
   * Inicia um polling de 5s para GET /api/traffic
   * - Loga o início e o fim de cada ciclo
   * - Loga a URL requisitada (o “que está sendo enviado”)
   * - Loga a resposta crua (amostra) e o total de itens
   * - Loga o que é emitido no BehaviorSubject
   */
  private startDataPolling(): void {
    timer(0, 5000) // Inicia imediatamente (0) e repete a cada 5000ms
      .pipe(
        tap(() => {
          this.isLoadingSubject.next(true); // Avisa que uma busca começou
          const startedAt = new Date().toISOString();
          console.log('[TrafficDataService] ▶️ Iniciando ciclo de polling', { startedAt });
        }),
        
      switchMap(() => {
        const url = `${this.API_BASE_URL}/api/traffic`;
        const sentAt = new Date().toISOString();
        // LOG do que está sendo ENVIADO (método + URL)
        console.log('[TrafficDataService] 🌐 Enviando requisição GET', { url, sentAt });

          return this.http.get<ClientTrafficSummaryFromAPI[]>(url)
          .pipe(
            tap((resp) => {
              // LOG da resposta crua (amostra dos primeiros itens)
              const receivedAt = new Date().toISOString();
              const total = Array.isArray(resp) ? resp.length : 0;
              console.log('[TrafficDataService] ✅ Resposta recebida', {
                receivedAt,
                totalItems: total,
                sample: Array.isArray(resp) ? resp.slice(0, Math.min(total, 3)) : resp
              });
            }),
            catchError(error => {
              // Lida com erros na chamada HTTP
              console.error('[TrafficDataService] ❌ Erro ao buscar dados da API', {
                when: new Date().toISOString(),
                error
              });
              this.errorSubject.next('Não foi possível carregar os dados do tráfego.');
              return of([]); // Retorna um array vazio para não quebrar a aplicação
            })
          );
        })
      )
      .subscribe(data => {
        // Quando os dados chegam com sucesso, atualiza os subjects
        this.trafficDataSubject.next(data);
        this.isLoadingSubject.next(false);
        this.errorSubject.next(null);

        // LOG do que está sendo EMITIDO (estado interno)
        console.log('[TrafficDataService] 📤 Emitindo novo estado para subscribers', {
          when: new Date().toISOString(),
          emittedItems: data.length,
          emittedSample: data.slice(0, Math.min(data.length, 3))
        });
      });
  }

  /**
   * Obtém um resumo do tráfego de todos os clientes da rede.
   * Rota da API: GET /api/traffic
   * (Mantida exatamente como estava; apenas adicionei logs e comentários.)
   */
  getClients(): Observable<NetworkClient[]> {
    const url = `${this.API_BASE_URL}/api/traffic`;
    // LOG do que está sendo ENVIADO
    console.log('[TrafficDataService] 🌐 (getClients) GET', { url, at: new Date().toISOString() });

    return this.http
      .get<ClientTrafficSummaryFromAPI[]>(url)
      .pipe(
        retry(API_CONFIG.MAX_RETRIES),
        tap((raw) => {
          // LOG da resposta crua (antes do map)
          console.log('[TrafficDataService] 📥 (getClients) Resposta bruta', {
            at: new Date().toISOString(),
            totalItems: Array.isArray(raw) ? raw.length : 0,
            sample: Array.isArray(raw) ? raw.slice(0, Math.min(raw.length, 3)) : raw
          });
        }),
        map((clients) =>
          clients.map((c) => ({
            ip: c.ip,
            downloadValue: this.bytesToMB(c.inbound),
            uploadValue: this.bytesToMB(c.outbound),
          }))
        ),
        tap((mapped) => {
          // LOG dos dados já transformados (o que o componente consome)
          console.log('[TrafficDataService] 🧮 (getClients) Dados mapeados para NetworkClient', {
            at: new Date().toISOString(),
            totalItems: mapped.length,
            sample: mapped.slice(0, Math.min(mapped.length, 3))
          });
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Busca os dados detalhados por protocolo para um cliente específico.
   * Rota da API: GET /api/traffic/{ip}/protocols
   * (Mantida; apenas logs e comentários adicionados.)
   * @param ip O endereço IP do cliente a ser detalhado.
   */
  public getProtocolDrilldownData(ip: string): Observable<ProtocolDrilldownFromAPI[]> {
    const url = `${this.API_BASE_URL}/api/traffic/${ip}/protocols`;
    // LOG do que está sendo ENVIADO
    console.log('[TrafficDataService] 🌐 (getProtocolDrilldownData) GET', { url, ip, at: new Date().toISOString() });

    return this.http.get<ProtocolDrilldownFromAPI[]>(url)
      .pipe(
        tap((resp) => {
          // LOG da resposta crua
          console.log('[TrafficDataService] 📥 (getProtocolDrilldownData) Resposta recebida', {
            at: new Date().toISOString(),
            ip,
            totalItems: Array.isArray(resp) ? resp.length : 0,
            sample: Array.isArray(resp) ? resp.slice(0, Math.min(resp.length, 5)) : resp
          });
        }),
        catchError(error => {
          console.error('[TrafficDataService] ❌ (getProtocolDrilldownData) Erro', {
            at: new Date().toISOString(),
            ip,
            error
          });
          this.errorSubject.next(`Não foi possível carregar os detalhes para o IP ${ip}.`);
          return of([]); // Retorna um array vazio em caso de erro
        })
      );
  }

  /**
   * Tratamento genérico de erros HTTP.
   * (Mantido; apenas comentários/logs.)
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Um erro desconhecido ocorreu.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      errorMessage = `Código do erro: ${error.status}, mensagem: ${error.message}`;
    }
    console.error('[TrafficDataService] ❌ handleError', {
      at: new Date().toISOString(),
      errorMessage,
      raw: error
    });
    return throwError(() => new Error(errorMessage));
  }
}
