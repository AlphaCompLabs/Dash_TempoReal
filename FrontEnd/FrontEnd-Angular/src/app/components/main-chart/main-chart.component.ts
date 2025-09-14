// import { Component } from '@angular/core';
// @Component({
//   selector: 'app-main-chart',
//   imports: [],
//   templateUrl: './main-chart.component.html',
//   styleUrl: './main-chart.component.css'
// })
// export class MainChartComponent {
// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaces para tipagem dos dados
export interface NetworkClient {
  ip: string;
  downloadValue: number;
  uploadValue: number;
}
export interface ProtocolData {
  protocol: string;
  downloadValue: number;
  uploadValue: number;
}
// Tipo genérico para o tooltip, que funciona para ambos os casos
type TooltipData = {
  downloadValue: number;
  uploadValue: number;
};

@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrl: './main-chart.component.css',
  standalone: true,
  imports: [CommonModule]
})
export class MainChartComponent implements OnInit {

  // Propriedades do Gráfico Principal
  public networkClients: NetworkClient[] = [];
  public maxChartValue: number = 25;
  public yAxisLabels: number[] = [];

  // Propriedades do Drill Down
  public selectedClientForDetail: NetworkClient | null = null;
  public detailData: ProtocolData[] = [];
  public maxDetailChartValue: number = 30;
  public yAxisDetailLabels: number[] = [];
  public isSelectedClientConnected: boolean = true;

  // Propriedades do Tooltip
  public isTooltipVisible: boolean = false;
  public tooltipText: string = '';
  public tooltipTop: number = 0;
  public tooltipLeft: number = 0;

  private protocolDataMap = new Map<string, ProtocolData[]>([
    ['192.168.1.100', [{ protocol: 'HTTP', downloadValue: 5, uploadValue: 3 }, { protocol: 'FTP', downloadValue: 2, uploadValue: 0 },]],
    ['192.168.1.101', [{ protocol: 'TCP', downloadValue: 10, uploadValue: 2 }, { protocol: 'UDP', downloadValue: 8, uploadValue: 8 },]],
    ['192.168.1.102', [{ protocol: 'HTTP', downloadValue: 4, uploadValue: 2.75 }, { protocol: 'FTP', downloadValue: 2, uploadValue: 1 }, { protocol: 'TCP', downloadValue: 2.25, uploadValue: 3 },]],
    ['192.168.1.105', [{ protocol: 'UDP', downloadValue: 2, uploadValue: 8 },]],
    ['192.168.1.112', [{ protocol: 'HTTP', downloadValue: 3, uploadValue: 0.5 }, { protocol: 'TCP', downloadValue: 1, uploadValue: 0.5 },]],
  ]);
  
  constructor() { }

  ngOnInit(): void {
    this.networkClients = [
      { ip: '192.168.1.100', downloadValue: 7, uploadValue: 3 },
      { ip: '192.168.1.101', downloadValue: 18, uploadValue: 10 },
      { ip: '192.168.1.102', downloadValue: 8.25, uploadValue: 6.75 },
      { ip: '192.168.1.105', downloadValue: 2, uploadValue: 8 },
      { ip: '192.168.1.112', downloadValue: 4, uploadValue: 1 },
    ];
    this.setupChartScale();
    setInterval(() => {
      if (this.networkClients.length > 0) { this.networkClients.shift(); }
      this.setupChartScale();
      this.validateSelectedClient();
    }, 5000);
  }

  get hasClients(): boolean {
    return this.networkClients && this.networkClients.length > 0;
  }

  public selectClientForDetail(client: NetworkClient): void {
    this.hideTooltip();
    this.selectedClientForDetail = client;
    this.detailData = this.protocolDataMap.get(client.ip) || [];
    this.setupDetailChartScale();
    this.isSelectedClientConnected = true;
  }

  public goBackToMainChart(): void {
    this.hideTooltip();
    this.selectedClientForDetail = null;
    this.detailData = [];
    this.isSelectedClientConnected = true;
  }

  private validateSelectedClient(): void {
    if (!this.selectedClientForDetail) return;
    const clientStillExists = this.networkClients.some(
      client => client.ip === this.selectedClientForDetail!.ip
    );
    this.isSelectedClientConnected = clientStillExists;
  }

  // --- Funções do Tooltip ---

  // ✅ CORREÇÃO AQUI: A função agora é mais simples e sempre mostra ambos os valores.
  public showTooltip(event: MouseEvent, data: TooltipData): void {
    this.isTooltipVisible = true;
    
    const downloadVal = data.downloadValue.toLocaleString('pt-BR');
    const uploadVal = data.uploadValue.toLocaleString('pt-BR');
    
    // Usamos '\n' para criar uma quebra de linha que será interpretada pelo CSS.
    this.tooltipText = `Download: ${downloadVal} MB\nUpload: ${uploadVal} MB`;
    
    this.moveTooltip(event);
  }

  public hideTooltip(): void {
    this.isTooltipVisible = false;
  }

  public moveTooltip(event: MouseEvent): void {
    this.tooltipLeft = event.clientX;
    this.tooltipTop = event.clientY;
  }

  // --- Funções de cálculo (sem alterações) ---

  private setupChartScale(): void {
    if (!this.hasClients) { this.maxChartValue = 0; this.yAxisLabels = []; return; }
    const maxValue = Math.max(...this.networkClients.map(c => c.downloadValue + c.uploadValue));
    this.maxChartValue = Math.ceil(maxValue / 5) * 5 || 5;
    const step = this.maxChartValue / 5;
    this.yAxisLabels = Array.from({ length: 6 }, (_, i) => this.maxChartValue - (i * step));
  }
  calculateTotalHeight = (client: NetworkClient) => Math.min(((client.downloadValue + client.uploadValue) / this.maxChartValue) * 100, 100);
  calculateDownloadRatio = (client: NetworkClient) => (client.downloadValue + client.uploadValue === 0) ? 0 : (client.downloadValue / (client.downloadValue + client.uploadValue)) * 100;
  calculateUploadRatio = (client: NetworkClient) => (client.downloadValue + client.uploadValue === 0) ? 0 : (client.uploadValue / (client.downloadValue + client.uploadValue)) * 100;
  private setupDetailChartScale(): void {
    if (this.detailData.length === 0) { this.maxDetailChartValue = 0; this.yAxisDetailLabels = []; return; }
    const maxValue = Math.max(...this.detailData.map(p => p.downloadValue + p.uploadValue));
    this.maxDetailChartValue = Math.ceil(maxValue / 5) * 5 || 5;
    const step = this.maxDetailChartValue / 5;
    this.yAxisDetailLabels = Array.from({ length: 6 }, (_, i) => parseFloat((this.maxDetailChartValue - (i * step)).toFixed(2)));
  }
  calculateDetailTotalHeight = (protocol: ProtocolData) => Math.min(((protocol.downloadValue + protocol.uploadValue) / this.maxDetailChartValue) * 100, 100);
  calculateDetailDownloadRatio = (protocol: ProtocolData) => (protocol.downloadValue + protocol.uploadValue === 0) ? 0 : (protocol.downloadValue / (protocol.downloadValue + protocol.uploadValue)) * 100;
  calculateDetailUploadRatio = (protocol: ProtocolData) => (protocol.downloadValue + protocol.uploadValue === 0) ? 0 : (protocol.uploadValue / (protocol.downloadValue + protocol.uploadValue)) * 100;
}