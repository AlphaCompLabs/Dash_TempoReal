import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ClientTrafficSummary, ProtocolDrilldown } from '../models/traffic.model';

@Injectable({
  providedIn: 'root'
})
export class TrafficService {
  private readonly API_BASE_URL = 'http://localhost:8000/';

  constructor(private http: HttpClient) {}

  // Lista de clientes da rede
  getClients(): Observable<NetworkClient[]> {
    return this.http.get<ClientTrafficSummary[]>(`${this.apiUrl}/traffic`).pipe(
      map(clients =>
        clients.map(c => ({
          ip: c.ip,
          downloadValue: c.inbound,
          uploadValue: c.outbound
        }))
      )
    );
  }

  // Protocolos detalhados de um cliente específico
  getClientProtocols(ip: string): Observable<ProtocolData[]> {
    return this.http.get<ProtocolDrilldown[]>(`${this.apiUrl}/traffic/${ip}/protocols`).pipe(
      map(protocols =>
        protocols.map(p => ({
          protocol: p.name,
          downloadValue: p.y, // como o backend só manda total
          uploadValue: 0      // se quiser separar, teria que mudar backend
        }))
      )
    );
  }
    /**
     
  Busca os dados detalhados por protocolo para um cliente específico.
  Esta função é chamada sob demanda (ex: quando um utilizador clica numa barra do gráfico).
  @param ip O endereço IP do cliente a ser detalhado.*/
  public getProtocolDrilldownData(ip: string): Observable<ProtocolDrilldown[]> {
    return this.http.get<ProtocolDrilldown[]>(${this.API_BASE_URL}/api/traffic/${ip}/protocols).pipe(
        catchError(error => {
          console.error(Erro ao buscar dados de drill down para o IP ${ip}:, error);
          this.errorSubject.next(Não foi possível carregar os detalhes para o IP ${ip}.);
          return of([]); // Retorna um array vazio em caso de erro}));}
  }
}
