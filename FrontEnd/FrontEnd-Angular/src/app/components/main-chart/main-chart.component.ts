/**
 * =========================================================================
 * COMPONENTE DO GRÁFICO PRINCIPAL (COM LÓGICA DE FILTROS)
 * Versão: 2.3.1 (Tooltip Corrigido)
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

  // Propriedades do Gráfico Principal
  public networkClients: ClientTrafficSummary[] = [];
  public maxChartValue: number = 25;
  public yAxisLabels: number[] = [];

  // Propriedades do Drill Down
  public selectedClientForDetail: ClientTrafficSummary | null = null;
  public detailData: ProtocolDrilldown[] = [];
  public maxDetailChartValue: number = 30;
  public yAxisDetailLabels: number[] = [];
  public isSelectedClientConnected: boolean = true;

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

  // ▼▼▼ FUNÇÃO CORRIGIDA ▼▼▼
  public showTooltip(event: MouseEvent, data: ClientTrafficSummary | ProtocolDrilldown): void {
    this.isTooltipVisible = true;
    
    // CORREÇÃO: Usamos a propriedade 'y', que só existe em ProtocolDrilldown,
    // para diferenciar os tipos de dados de forma segura.
    if ('y' in data) {
      // Se 'y' existe, sabemos que 'data' é do tipo ProtocolDrilldown
      const totalMB = (data.y).toFixed(2);
      this.tooltipText = `Protocolo: ${data.name}\nTráfego Total: ${totalMB} Bytes`;
    } else {
      // Caso contrário, é do tipo ClientTrafficSummary
      const downloadMB = (data.inbound).toFixed(2);
      const uploadMB = (data.outbound).toFixed(2);
      this.tooltipText = `Download: ${downloadMB} Bytes\nUpload: ${uploadMB} Bytes`;
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

  // --- Funções de Cálculo (ajustadas para Bytes) ---

  private setupChartScale(): void {
    if (!this.hasClients) { this.maxChartValue = 0; this.yAxisLabels = []; return; }
    const maxValue = Math.max(...this.networkClients.map(c => c.inbound + c.outbound));
    this.maxChartValue = Math.ceil(maxValue / 1000) * 1000 || 1000;
    const step = this.maxChartValue / 5;
    this.yAxisLabels = Array.from({ length: 6 }, (_, i) => Math.round(this.maxChartValue - (i * step)));
  }

  calculateTotalHeight = (client: ClientTrafficSummary) => Math.min((((client.inbound + client.outbound)) / this.maxChartValue) * 100, 100);
  calculateDownloadRatio = (client: ClientTrafficSummary) => (client.inbound + client.outbound === 0) ? 0 : (client.inbound / (client.inbound + client.outbound)) * 100;
  calculateUploadRatio = (client: ClientTrafficSummary) => (client.inbound + client.outbound === 0) ? 0 : (client.outbound / (client.inbound + client.outbound)) * 100;

  private setupDetailChartScale(): void {
    if (this.detailData.length === 0) { this.maxDetailChartValue = 0; this.yAxisDetailLabels = []; return; }
    const maxValue = Math.max(...this.detailData.map(p => p.y));
    this.maxDetailChartValue = Math.ceil(maxValue / 1000) * 1000 || 1000;
    const step = this.maxDetailChartValue / 5;
    this.yAxisDetailLabels = Array.from({ length: 6 }, (_, i) => Math.round(this.maxDetailChartValue - (i * step)));
  }

  calculateDetailTotalHeight = (protocol: ProtocolDrilldown) => Math.min(((protocol.y) / this.maxDetailChartValue) * 100, 100);
  
  calculateDetailDownloadRatio = (protocol: ProtocolDrilldown) => (protocol.y === 0) ? 0 : (protocol.inbound / protocol.y) * 100;
  calculateDetailUploadRatio = (protocol: ProtocolDrilldown) => (protocol.y === 0) ? 0 : (protocol.outbound / protocol.y) * 100;
}

