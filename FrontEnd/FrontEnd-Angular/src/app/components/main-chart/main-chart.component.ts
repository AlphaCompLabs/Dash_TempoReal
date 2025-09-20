/**
 * =========================================================================
 * COMPONENTE DO GRÁFICO PRINCIPAL (COM LÓGICA DE FILTROS)
 * Versão: 2.3.2 (Dados em KB)
 *
 * Descrição: Esta versão corrige a lógica de tipagem na função showTooltip
 * para diferenciar corretamente entre os dados do gráfico principal e os
 * dados de drill down.
 * =========================================================================
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { TrafficDataService } from '../../services/traffic-data.service';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrls: ['./main-chart.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class MainChartComponent implements OnInit, OnDestroy {

  /**
   * Função auxiliar para formatar bytes em um formato legível (KB, MB, GB).
   * @param bytes O número de bytes a ser formatado.
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (!+bytes) return '0 Bytes'; // O "+bytes" converte para número e checa se é 0 ou inválido
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  // --- Constante de conversão ---
  private readonly BYTES_IN_A_KILOBYTE = 1024;

  // Propriedades do Gráfico Principal
  public networkClients: ClientTrafficSummary[] = [];
  public maxChartValue: number = 25;
  public yAxisLabels: number[] = [];
  public chartUnit: string = 'Bytes';
  

  // Propriedades do Drill Down
  public selectedClientForDetail: ClientTrafficSummary | null = null;
  public detailData: ProtocolDrilldown[] = [];
  public maxDetailChartValue: number = 30;
  public yAxisDetailLabels: number[] = [];
  public isSelectedClientConnected: boolean = true;
  public detailChartUnit: string = 'Bytes';
  private detailChartDivisor: number = 1;

  // Propriedades do Tooltip
  public isTooltipVisible: boolean = false;
  public tooltipText: string = '';
  public tooltipTop: number = 0;
  public tooltipLeft: number = 0;
  
  public activeMainFilter: 'all' | 'download' | 'upload' = 'all';
  public activeDetailFilter: 'all' | 'download' | 'upload' = 'all';

  private dataSubscription: Subscription | undefined;

  constructor(private trafficService: TrafficDataService) { }

  ngOnInit(): void {
    this.subscribeToTrafficData();
  }

  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
  }

  // --- Funções de controle (sem alteração) ---
  public setMainFilter(filter: 'all' | 'download' | 'upload'): void {
    this.activeMainFilter = this.activeMainFilter === filter ? 'all' : filter;
  }

  public setDetailFilter(filter: 'all' | 'download' | 'upload'): void {
    this.activeDetailFilter = this.activeDetailFilter === filter ? 'all' : filter;
  }

  private subscribeToTrafficData(): void {
    this.dataSubscription = this.trafficService.trafficData$.subscribe(data => {
      this.networkClients = data;
      this.setupChartScale();
      this.validateSelectedClient();
    });
  }
  
  public get hasClients(): boolean {
    return this.networkClients && this.networkClients.length > 0;
  }

  public selectClientForDetail(client: ClientTrafficSummary): void {
    this.hideTooltip();
    this.selectedClientForDetail = client;
    this.isSelectedClientConnected = true;
    this.activeDetailFilter = 'all';
    this.trafficService.getProtocolDrilldownData(client.ip).subscribe(protocolData => {
      this.detailData = protocolData;
      this.setupDetailChartScale();
    });
  }

  public goBackToMainChart(): void {
    this.hideTooltip();
    this.selectedClientForDetail = null;
    this.detailData = [];
  }

  private validateSelectedClient(): void {
    if (!this.selectedClientForDetail) return;
    this.isSelectedClientConnected = this.networkClients.some(
      client => client.ip === this.selectedClientForDetail!.ip
    );
  }

  // --- Funções do Tooltip (AJUSTADAS PARA KB) ---
  public showTooltip(event: MouseEvent, data: ClientTrafficSummary | ProtocolDrilldown): void {
  this.isTooltipVisible = true;
  
  if ('y' in data) { // ProtocolDrilldown
    this.tooltipText = `Protocolo: ${data.name}\nTráfego Total: ${this.formatBytes(data.y)}`;
  } else { // ClientTrafficSummary
    const formattedDownload = this.formatBytes(data.inbound);
    const formattedUpload = this.formatBytes(data.outbound);
    this.tooltipText = `Download: ${formattedDownload}\nUpload: ${formattedUpload}`;
  }
  
  this.moveTooltip(event);
}

  public hideTooltip(): void {
    this.isTooltipVisible = false;
  }

  public moveTooltip(event: MouseEvent): void {
    this.tooltipLeft = event.clientX + 15;
    this.tooltipTop = event.clientY + 15;
  }

  // --- Funções de Cálculo (AJUSTADAS PARA KB) ---

  private setupChartScale(): void {
  if (!this.hasClients) {
    this.maxChartValue = 0;
    this.yAxisLabels = [];
    return;
  }
  const maxValueInBytes = Math.max(...this.networkClients.map(c => c.inbound + c.outbound));
  if (maxValueInBytes === 0) {
    this.maxChartValue = 0;
    this.yAxisLabels = [0];
    this.chartUnit = 'Bytes';
    return;
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  // Descobre o índice da unidade apropriada (0=Bytes, 1=KB, 2=MB...)
  const i = Math.floor(Math.log(maxValueInBytes) / Math.log(k));
  
  // Define a unidade e o divisor para a escala inteira
  this.chartUnit = sizes[i];
  const divisor = Math.pow(k, i);

  // Converte o valor máximo para a nova unidade e arredonda
  const maxValueInUnit = maxValueInBytes / divisor;
  this.maxChartValue = Math.ceil(maxValueInUnit);

  const step = this.maxChartValue / 5;
  this.yAxisLabels = Array.from({ length: 6 }, (_, i) => Math.round(this.maxChartValue - (i * step)));
}

// Lembre-se que as funções calculate...Height agora precisam usar o divisor correto
calculateTotalHeight = (client: ClientTrafficSummary) => {
  const k = 1024;
  const i = Math.floor(Math.log(this.networkClients.reduce((acc, c) => Math.max(acc, c.inbound + c.outbound), 0)) / Math.log(k));
  const divisor = Math.pow(k, i) || 1; // || 1 para evitar divisão por 0
  const totalClientInUnit = (client.inbound + client.outbound) / divisor;
  return Math.min((totalClientInUnit / this.maxChartValue) * 100, 100);
};

  calculateDownloadRatio = (client: ClientTrafficSummary) => (client.inbound + client.outbound === 0) ? 0 : (client.inbound / (client.inbound + client.outbound)) * 100;
  calculateUploadRatio = (client: ClientTrafficSummary) => (client.inbound + client.outbound === 0) ? 0 : (client.outbound / (client.inbound + client.outbound)) * 100;

  private setupDetailChartScale(): void {
  if (!this.detailData || this.detailData.length === 0) {
    this.maxDetailChartValue = 0;
    this.yAxisDetailLabels = [];
    this.detailChartUnit = 'Bytes';
    this.detailChartDivisor = 1;
    return;
  }

  const maxValueInBytes = Math.max(...this.detailData.map(p => p.y));
  if (maxValueInBytes === 0) {
    this.maxDetailChartValue = 0;
    this.yAxisDetailLabels = [0];
    this.detailChartUnit = 'Bytes';
    this.detailChartDivisor = 1;
    return;
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  // Descobre o índice da unidade apropriada (0=Bytes, 1=KB, 2=MB...)
  const i = Math.floor(Math.log(maxValueInBytes) / Math.log(k));
  
  this.detailChartUnit = sizes[i];
  this.detailChartDivisor = Math.pow(k, i);

  // Converte o valor máximo para a nova unidade e arredonda para cima
  const maxValueInUnit = maxValueInBytes / this.detailChartDivisor;
  this.maxDetailChartValue = Math.ceil(maxValueInUnit);

  // Calcula os rótulos do eixo Y com base no novo valor máximo
  const step = this.maxDetailChartValue / 5;
  this.yAxisDetailLabels = Array.from({ length: 6 }, (_, i) => Math.round(this.maxDetailChartValue - (i * step)));
}

calculateDetailTotalHeight = (protocol: ProtocolDrilldown) => {
  if (this.maxDetailChartValue === 0) return 0;
  

  const totalProtocolInUnit = protocol.y / this.detailChartDivisor;
  
  return Math.min((totalProtocolInUnit / this.maxDetailChartValue) * 100, 100);
};
  calculateDetailDownloadRatio = (protocol: ProtocolDrilldown) => (protocol.y === 0) ? 0 : (protocol.inbound / protocol.y) * 100;
  calculateDetailUploadRatio = (protocol: ProtocolDrilldown) => (protocol.y === 0) ? 0 : (protocol.outbound / protocol.y) * 100;
}