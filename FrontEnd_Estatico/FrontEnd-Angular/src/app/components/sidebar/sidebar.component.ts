import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrafficDataService } from '../../services/traffic.service';
import { NetworkClient } from '../../models/traffic.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  totalDownload: number = 0;
  totalUpload: number = 0;
  connectedClients: number = 0;
  topTalker: string = 'N/A';
  private trafficSubscription: Subscription | undefined;
  private trafficInterval: any;

  constructor(private trafficService: TrafficDataService) { }

  ngOnInit(): void {
    this.fetchTraffic();
    // Atualiza a cada 5s
    this.trafficInterval = setInterval(() => this.fetchTraffic(), 5000);
  }

  ngOnDestroy(): void {
    // Garante que o intervalo e a assinatura sejam limpos para evitar vazamentos de memória
    if (this.trafficInterval) {
      clearInterval(this.trafficInterval);
    }
    if (this.trafficSubscription) {
      this.trafficSubscription.unsubscribe();
    }
  }

  private fetchTraffic(): void {
    this.trafficSubscription = this.trafficService.getClients().subscribe({
      next: (clients: NetworkClient[]) => {
        // Se a lista de clientes estiver vazia, reinicia os valores
        if (!clients || clients.length === 0) {
          this.resetValues();
          console.warn('Nenhum cliente conectado ou dados de tráfego vazios.');
          return;
        }
        
        // Atualiza os valores se houver dados
        this.connectedClients = clients.length;
        this.totalDownload = clients.reduce((sum, c) => sum + c.downloadValue, 0);
        this.totalUpload = clients.reduce((sum, c) => sum + c.uploadValue, 0);

        // Encontra o cliente com o maior tráfego
        const top = clients.sort((a, b) =>
          (b.downloadValue + b.uploadValue) - (a.downloadValue + a.uploadValue)
        )[0];

        this.topTalker = top ? top.ip : 'N/A';
      },
      error: (err) => {
        console.error('Erro ao buscar dados de tráfego:', err);
        this.resetValues();
      }
    });
  }

  private resetValues(): void {
    this.connectedClients = 0;
    this.totalDownload = 0;
    this.totalUpload = 0;
    this.topTalker = 'N/A';
  }
}