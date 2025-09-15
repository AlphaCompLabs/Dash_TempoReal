/**
 * =========================================================================
 * COMPONENTE DA SIDEBAR (INTEGRADO COM A API)
 * Versão: 1.0.0
 *
 * Descrição: Este componente exibe as informações gerais e estatísticas
 * da rede. Ele consome os dados do TrafficDataService para calcular
 * e exibir o total de download, upload, número de clientes e o "top talker".
 * =========================================================================
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// 1. IMPORTA O SERVIÇO E OS MODELOS DE DADOS
import { TrafficDataService } from '../../services/traffic-data.service';
import { ClientTrafficSummary } from '../../models/traffic.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // --- Propriedades para Exibição no Template ---
  public totalDownload: string = '0 Mb';
  public totalUpload: string = '0 Mb';
  public activeClients: number = 0;
  public topTalker: string = 'N/A';

  private dataSubscription: Subscription | undefined;

  // 2. INJETA O SERVIÇO DE DADOS
  constructor(private trafficService: TrafficDataService) { }

  ngOnInit(): void {
    // 3. INICIA A "ESCUTA" DOS DADOS
    // Subscreve ao fluxo de dados do serviço. Este bloco de código será
    // executado a cada 5 segundos, sempre que novos dados da API chegarem.
    this.dataSubscription = this.trafficService.trafficData$.subscribe(
      (data: ClientTrafficSummary[]) => {
        // Quando os dados chegam, chama a função para calcular as estatísticas
        this.calculateStatistics(data);
      }
    );
  }

  ngOnDestroy(): void {
    // Boa prática: cancela a subscrição para evitar memory leaks
    this.dataSubscription?.unsubscribe();
  }

  /**
   * Calcula as estatísticas gerais a partir dos dados de tráfego recebidos.
   * @param data A lista de clientes e seus dados de tráfego.
   */
  private calculateStatistics(data: ClientTrafficSummary[]): void {
    if (!data || data.length === 0) {
      this.totalDownload = '0 Mb';
      this.totalUpload = '0 Mb';
      this.activeClients = 0;
      this.topTalker = 'N/A';
      return;
    }

    // Soma o total de bytes de entrada e saída de todos os clientes
    const totalBytesIn = data.reduce((sum, client) => sum + client.inbound, 0);
    const totalBytesOut = data.reduce((sum, client) => sum + client.outbound, 0);

    // Encontra o cliente com o maior tráfego total (in + out)
    const topTalkerClient = data.reduce((top, current) => {
      const topTotal = (top.inbound || 0) + (top.outbound || 0);
      const currentTotal = current.inbound + current.outbound;
      return currentTotal > topTotal ? current : top;
    }, data[0]);

    // Atualiza as propriedades que serão exibidas no HTML
    this.totalDownload = this.formatBytes(totalBytesIn);
    this.totalUpload = this.formatBytes(totalBytesOut);
    this.activeClients = data.length;
    this.topTalker = topTalkerClient.ip;
  }

  /**
   * Função auxiliar para formatar bytes em um formato legível (KB, MB, GB).
   * @param bytes O número de bytes a ser formatado.
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
