import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { TrafficClient, ChartDataItem } from '../models/traffic.models';

@Injectable({
  providedIn: 'root'
})
export class TrafficData {
  private trafficDataSubject = new BehaviorSubject<TrafficClient[]>([]);
  private lastUpdateSubject = new BehaviorSubject<Date>(new Date()); // Horário de atualização
  private isLoadinSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  trafficData$ = this.trafficDataSubject.asObservable();
  lastUpdate$ = this.lastUpdateSubject.asObservable();
  isLoading$ = this.isLoadinSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  private serverIP = '192.168.1.100';

  constructor() {
    this.startDataPolling();
  }

  private startDataPolling(): void {
    interval(5000).subscribe(() => {
      this.fetchData();
    });
  }

  private fetchData(): void {
    this.isLoadinSubject.next(true);
    this.errorSubject.next(null);

    try {
      setTimeout(() => {
        const data = this.generateMockData();
        this.trafficDataSubject.next(data);
        this.lastUpdateSubject.next(new Date());
        this.isLoadinSubject.next(false);
      }, 100);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message: 'Erro ao buscar dados';
        this.errorSubject.next(errorMessage);
        this.isLoadinSubject.next(false);
      }
    }

    private generateMockData(): TrafficClient[] {
      const clients: string[] = [
        '192.168.1.10', '192.168.1.15', '192.168.1.20',
        '192.168.1.25', '192.168.1.30'
      ];

      return clients.map((ip: string): TrafficClient => ({
        ip, 
        bytes_in: Math.floor(Math.random() * 3000000),
        bytes_out: Math.floor(Math.random() * 1500000),
        protocols: {
          HTTP: {
            in: Math.floor(Math.random() * 2000000),
            out: Math.floor(Math.random() * 800000)   
          },
          FTP: {
            in: Math.floor(Math.random() * 800000),
            out: Math.floor(Math.random() * 4000000)
          },
          SSH: {
            in: Math.floor(Math.random() * 200000),
            out: Math.floor(Math.random() * 300000)
          }
        }
      }));
    }

    getServerIP(): string {
      return this.serverIP;
    }

    getChartData(): Observable<ChartDataItem[]> {
      return this.trafficData$.pipe(
        map(data => data.map(client => ({
          ip: client.ip,
          entrada: client.bytes_in / 1024 / 1024,
          saida: clearInterval.bytes_out / 1024 / 1024,
          rawData: client 
        })))
      );
    }

    calculateStats(data: TrafficClient[]) {
      try {
        const totalBytesIn = data.reduce((sum, client) => sum + client.bytes_in, 0);
        const totalBytesOut = data.reduce((sum, client) => sum + client.bytes_out, 0);
        const totalBytes = totalBytesIn + totalBytesOut;

        return {
          activeClients: data.length,
          totalIn: this.formatBytes(totalBytesIn),
          totalOut: this.formatBytes(totalBytesOut),
          totalGeneral: this.formatBytes(totalBytes)
        }
      }
    }
  }
}
