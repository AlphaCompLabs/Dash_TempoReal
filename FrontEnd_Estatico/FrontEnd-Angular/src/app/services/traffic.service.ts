import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ClientTrafficSummary, ProtocolDrilldown, NetworkClient, ProtocolData } from '../models/traffic.models';

@Injectable({
  providedIn: 'root'
})
export class TrafficService {
  private apiUrl = 'http://localhost:8000/api';

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
}
