/*
 # =====================================================================================
 # SERVIDOR FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
 # Versão: 4.0.1 (Correção de Persistência de Estilo da Legenda)
 # Autor(es): Equipe Frontend
 # Data: 2025-09-30
 # Descrição: Lógica do componente principal. Funcionalidade de drill-down
 #            restaurada e integrada com o novo gráfico de histórico sincronizado.
 #            Correção aplicada para manter o estado visual da legenda após
 #            atualizações de dados em tempo real.
 # =====================================================================================
*/

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 1 - IMPORTAÇÕES
// -----------------------------------------------------------------------------------------
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TrafficDataService } from '../../services/traffic-data';
import { ClientTrafficSummary, ProtocolDrilldown, HistoricalDataPoint } from '../../models/traffic.model';
import { UiStateService } from '../../services/ui-state.service';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip
} from 'chart.js';

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 2 - COMPONENTE
// -----------------------------------------------------------------------------------------
@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrls: ['./main-chart.component.css'],
  standalone: true,
  imports: [CommonModule,
    BaseChartDirective,
  ]
})
export class MainChartComponent implements OnInit, OnDestroy {

  // -----------------------------------------------------------------------------------------
  //                                SEÇÃO 3 - PROPRIEDADES
  // -----------------------------------------------------------------------------------------

  // --- Estado do Gráfico Principal ---
  public networkClients: ClientTrafficSummary[] = [];
  public maxChartValue: number = 0;
  public yAxisLabels: number[] = [];
  public chartUnit: string = 'Bytes';
  public pingState: 'idle' | 'green' | 'red' = 'idle';
  private mainChartDivisor: number = 1;
  private readonly MAX_CLIENTS_TO_DISPLAY = 10;

  // --- Estado do Gráfico de Detalhe (Drilldown) ---
  public selectedClientForDetail: ClientTrafficSummary | null = null;
  public detailData: ProtocolDrilldown[] = [];
  public maxDetailChartValue: number = 0;
  public yAxisDetailLabels: number[] = [];
  public detailChartUnit: string = 'Bytes';
  public isSelectedClientConnected: boolean = true;
  private detailChartDivisor: number = 1;

  // --- Estado do Tooltip ---
  public isTooltipVisible: boolean = false;
  public tooltipText: string = '';
  public tooltipTop: number = 0;
  public tooltipLeft: number = 0;
  private tooltipContext: ClientTrafficSummary | ProtocolDrilldown | null = null;

  // --- Estado dos Filtros ---
  public activeMainFilter: 'all' | 'download' | 'upload' = 'all';
  public activeDetailFilter: 'all' | 'download' | 'upload' = 'all';
  public playPingAnimation: boolean = false;

  // --- Gerenciamento de Inscrição ---
  private dataSubscription!: Subscription;
  private uiStateSubscription!: Subscription;
  private historySubscription!: Subscription;

  // --- Propriedades do Gráfico de Histórico ---
  public showHistoryChart: boolean = false;
  public lineChartType: ChartType = 'line';
  public readonly downloadLineColor = '#0d93c3';
  public readonly uploadLineColor = '#8bd9f5';
  public readonly downloadFillColor = 'rgba(13, 147, 195, 0.3)';
  public readonly uploadFillColor = 'rgba(139, 217, 245, 0.3)';

  private readonly historyChartLabels = ['-60s', '-55s', '-50s', '-45s', '-40s', '-35s', '-30s', '-25s', '-20s', '-15s', '-10s', '-5s', 'Agora'];
  private historyChartUnit = 'Bytes';
  private historyChartDivisor = 1;

  public lineChartData: ChartConfiguration['data'] = {
    labels: this.historyChartLabels,
    datasets: [
      { data: [], label: 'Download', borderColor: this.downloadLineColor, backgroundColor: this.downloadFillColor, fill: true, pointRadius: 3, pointHoverRadius: 8, tension: 0.2 },
      { data: [], label: 'Upload', borderColor: this.uploadLineColor, backgroundColor: this.uploadFillColor, fill: true, pointRadius: 3, pointHoverRadius: 8, tension: 0.2 }
    ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        ticks: {
          color: '#9ca3af',
          callback: (value) => {
            const numericValue = typeof value === 'string' ? parseFloat(value) : value;
            if (numericValue === 0) return '0';
            const formattedValue = (numericValue / this.historyChartDivisor).toFixed(1);
            const cleanValue = formattedValue.endsWith('.0') ? formattedValue.slice(0, -2) : formattedValue;
            return `${cleanValue} ${this.historyChartUnit}`;
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#9ca3af',
          boxWidth: 12,
          padding: 20
        },
        onClick: (e, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          if (typeof index === 'undefined') return;

          const isCurrentlyTheOnlyOneVisible = legend.chart.isDatasetVisible(index) && legend.chart.getVisibleDatasetCount() === 1;

          if (isCurrentlyTheOnlyOneVisible) {
            this.historyChartSelection = 'both';
          } else {
            this.historyChartSelection = index === 0 ? 'download' : 'upload';
          }

          this.syncHistoryChartState();
        }
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const label = tooltipItem.dataset.label || '';
            const value = tooltipItem.raw as number;
            return `${label}: ${this.formatBytes(value)}`;
          }
        }
      }
    }
  };

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  private historyChartSelection: 'download' | 'upload' | 'both' = 'both';

  // -----------------------------------------------------------------------------------------
  //                                SEÇÃO 4 - CONSTRUTOR
  // -----------------------------------------------------------------------------------------
  constructor(
    private trafficService: TrafficDataService,
    public uiStateService: UiStateService
  ) {
    Chart.register(
      LineController, LineElement, PointElement, LinearScale, CategoryScale,
      Filler, Legend, Tooltip
    );
    this.initializeHistoryChartData();
  }

  // -----------------------------------------------------------------------------------------
  //                                SEÇÃO 5 - MÉTODOS DE CICLO DE VIDA
  // -----------------------------------------------------------------------------------------
  ngOnInit(): void {
    this.subscribeToTrafficData();

    this.uiStateSubscription = this.uiStateService.showHistoryChart$.subscribe(
      isVisible => {
        this.showHistoryChart = isVisible;
      }
    );

    this.historySubscription = this.trafficService.historyData$.subscribe(data => {
      this.processHistoryData(data);
    });
  }

  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
    this.uiStateSubscription?.unsubscribe();
    this.historySubscription?.unsubscribe();
  }

  // -----------------------------------------------------------------------------------------
  //                                SEÇÃO 6 - MÉTODOS PÚBLICOS
  // -----------------------------------------------------------------------------------------

  public get hasClients(): boolean {
    return this.networkClients && this.networkClients.length > 0;
  }

  public setMainFilter(filter: 'all' | 'download' | 'upload'): void {
    this.activeMainFilter = this.activeMainFilter === filter ? 'all' : filter;
    this.setupChartScale();
  }

  public setDetailFilter(filter: 'all' | 'download' | 'upload'): void {
    this.activeDetailFilter = this.activeDetailFilter === filter ? 'all' : filter;
    this.setupDetailChartScale();
  }

  public selectClientForDetail(client: ClientTrafficSummary): void {
    this.hideTooltip();
    this.selectedClientForDetail = client;
    this.isSelectedClientConnected = true;
    this.activeDetailFilter = 'all';
    this.trafficService.setDrillDownState(true);
    this.trafficService.setSelectedClient(client);
    this.trafficService.getProtocolDrilldownData(client.ip).subscribe(protocolData => {
      this.detailData = protocolData;
      this.setupDetailChartScale();
    });
  }

  public goBackToMainChart(): void {
    this.hideTooltip();
    this.selectedClientForDetail = null;
    this.detailData = [];
    this.trafficService.setDrillDownState(false);
    this.trafficService.setSelectedClient(null);
  }

  public showTooltip(event: MouseEvent, data: ClientTrafficSummary | ProtocolDrilldown): void {
    this.isTooltipVisible = true;
    this.tooltipContext = data;
    const isDrilldown = 'y' in data;
    if (isDrilldown) {
      this.tooltipText = `Protocolo: ${data.name}\nTráfego Total: ${this.formatBytes(data.y)}`;
    } else {
      const formattedDownload = this.formatBytes(data.inbound);
      const formattedUpload = this.formatBytes(data.outbound);
      this.tooltipText = `Download: ${formattedDownload}\nUpload: ${formattedUpload}`;
    }
    this.moveTooltip(event);
  }

  public hideTooltip(): void {
    this.isTooltipVisible = false;
    this.tooltipContext = null;
  }

  public moveTooltip(event: MouseEvent): void {
    this.tooltipLeft = event.clientX + 15;
    this.tooltipTop = event.clientY + 15;
  }

  public calculateTotalHeight(client: ClientTrafficSummary): number {
    if (this.maxChartValue === 0) return 0;
    let valueInBytes = 0;
    if (this.activeMainFilter === 'download') valueInBytes = client.inbound;
    else if (this.activeMainFilter === 'upload') valueInBytes = client.outbound;
    else valueInBytes = client.inbound + client.outbound;
    const valueInUnit = valueInBytes / this.mainChartDivisor;
    return Math.min((valueInUnit / this.maxChartValue) * 100, 100);
  }

  public calculateDownloadRatio(client: ClientTrafficSummary): number {
    if (this.activeMainFilter === 'upload') return 0;
    if (this.activeMainFilter === 'download') return 100;
    const total = client.inbound + client.outbound;
    return total === 0 ? 0 : (client.inbound / total) * 100;
  }

  public calculateUploadRatio(client: ClientTrafficSummary): number {
    if (this.activeMainFilter === 'download') return 0;
    if (this.activeMainFilter === 'upload') return 100;
    const total = client.inbound + client.outbound;
    return total === 0 ? 0 : (client.outbound / total) * 100;
  }

  public calculateDetailTotalHeight(protocol: ProtocolDrilldown): number {
    if (this.maxDetailChartValue === 0) return 0;
    let valueInBytes = 0;
    if (this.activeDetailFilter === 'download') valueInBytes = protocol.inbound;
    else if (this.activeDetailFilter === 'upload') valueInBytes = protocol.outbound;
    else valueInBytes = protocol.y;
    const valueInUnit = valueInBytes / this.detailChartDivisor;
    return Math.min((valueInUnit / this.maxDetailChartValue) * 100, 100);
  }

  public calculateDetailDownloadRatio(protocol: ProtocolDrilldown): number {
    return protocol.y === 0 ? 0 : (protocol.inbound / protocol.y) * 100;
  }

  public calculateDetailUploadRatio(protocol: ProtocolDrilldown): number {
    return protocol.y === 0 ? 0 : (protocol.outbound / protocol.y) * 100;
  }

  // -----------------------------------------------------------------------------------------
  //                                SEÇÃO 7 - MÉTODOS PRIVADOS
  // -----------------------------------------------------------------------------------------

  private subscribeToTrafficData(): void {
    this.dataSubscription = this.trafficService.trafficData$.subscribe(data => {
      const sortedClients = [...data].sort((a, b) =>
        (b.inbound + b.outbound) - (a.inbound + a.outbound)
      );
      this.networkClients = sortedClients.slice(0, this.MAX_CLIENTS_TO_DISPLAY);
      if (this.isTooltipVisible && this.tooltipContext && 'ip' in this.tooltipContext) {
        const clientStillExists = this.networkClients.some(c => c.ip === (this.tooltipContext as ClientTrafficSummary).ip);
        if (!clientStillExists) this.hideTooltip();
      }
      this.setupChartScale();
      this.validateSelectedClientConnection();
      this.pingState = data && data.length > 0 ? 'green' : 'red';
      setTimeout(() => { this.pingState = 'idle'; }, 1000);
    });
  }

  private validateSelectedClientConnection(): void {
    if (!this.selectedClientForDetail) return;
    this.isSelectedClientConnected = this.networkClients.some(c => c.ip === this.selectedClientForDetail!.ip);
    if (this.isSelectedClientConnected) {
      this.playPingAnimation = true;
      setTimeout(() => { this.playPingAnimation = false; }, 1000);
    } else {
      this.hideTooltip();
      this.setupDetailChartScale();
    }
  }

  private setupChartScale(): void {
    if (!this.hasClients) {
      this.maxChartValue = 0;
      this.yAxisLabels = [];
      return;
    }
    const dataInBytes = this.networkClients.map(c => {
      if (this.activeMainFilter === 'download') return c.inbound;
      if (this.activeMainFilter === 'upload') return c.outbound;
      return c.inbound + c.outbound;
    });
    const scale = this.calculateChartScale(dataInBytes);
    this.maxChartValue = scale.maxChartValue;
    this.yAxisLabels = scale.yAxisLabels;
    this.chartUnit = scale.unit;
    this.mainChartDivisor = scale.divisor;
  }

  private setupDetailChartScale(): void {
    if (this.detailData.length === 0) {
      this.maxDetailChartValue = 0;
      this.yAxisDetailLabels = [];
      return;
    }
    const dataInBytes = this.detailData.map(p => {
      if (this.activeDetailFilter === 'download') return p.inbound;
      if (this.activeDetailFilter === 'upload') return p.outbound;
      return p.y;
    });
    const scale = this.calculateChartScale(dataInBytes);
    this.maxDetailChartValue = scale.maxChartValue;
    this.yAxisDetailLabels = scale.yAxisLabels;
    this.detailChartUnit = scale.unit;
    this.detailChartDivisor = scale.divisor;
  }

  private calculateChartScale(data: number[]): { maxChartValue: number; yAxisLabels: number[]; unit: string; divisor: number } {
    if (data.length === 0) return { maxChartValue: 0, yAxisLabels: [], unit: 'Bytes', divisor: 1 };
    const maxValueInBytes = Math.max(...data);
    if (maxValueInBytes === 0) return { maxChartValue: 1, yAxisLabels: [1, 0], unit: 'Bytes', divisor: 1 };
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(maxValueInBytes) / Math.log(k));
    const unit = sizes[i] || sizes[0];
    const divisor = Math.pow(k, i) || 1;
    const maxValueInUnit = maxValueInBytes / divisor;
    const maxChartValue = Math.ceil(maxValueInUnit);
    const step = maxChartValue > 0 ? maxChartValue / 5 : 1;
    const yAxisLabels = Array.from({ length: 6 }, (_, idx) => parseFloat((maxChartValue - (idx * step)).toFixed(1)));
    return { maxChartValue, yAxisLabels, unit, divisor };
  }

  private formatBytes(bytes: number, decimals: number = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  private initializeHistoryChartData(): void {
    const initialData = Array(this.historyChartLabels.length).fill(0);
    this.lineChartData.datasets[0].data = [...initialData];
    this.lineChartData.datasets[1].data = [...initialData];
    this.chart?.update();
  }

  private processHistoryData(apiData: HistoricalDataPoint[]): void {
    let newDownloadBytes = 0;
    let newUploadBytes = 0;
    if (this.networkClients.length === 0) {
      newDownloadBytes = 0;
      newUploadBytes = 0;
    } else if (apiData && apiData.length > 0) {
      const latestPoint = apiData[apiData.length - 1];
      newDownloadBytes = latestPoint.total_inbound;
      newUploadBytes = latestPoint.total_outbound;
    }
    const downloadDataBytes = this.lineChartData.datasets[0].data as number[];
    const uploadDataBytes = this.lineChartData.datasets[1].data as number[];
    downloadDataBytes.shift();
    uploadDataBytes.shift();
    downloadDataBytes.push(newDownloadBytes);
    uploadDataBytes.push(newUploadBytes);
    let maxTotalTrafficInWindow = 0;
    for (let i = 0; i < downloadDataBytes.length; i++) {
      const totalAtPoint = (downloadDataBytes[i] || 0) + (uploadDataBytes[i] || 0);
      if (totalAtPoint > maxTotalTrafficInWindow) {
        maxTotalTrafficInWindow = totalAtPoint;
      }
    }
    this.updateHistoryChartScale(maxTotalTrafficInWindow);
    this.chart?.update();
    // =============================================================================
    // ESTA É A LINHA QUE RESOLVE O PROBLEMA DE PERSISTÊNCIA DO ESTILO
    // =============================================================================
    this.syncHistoryChartState();
  }

  private syncHistoryChartState(): void {
    if (!this.chart?.chart) {
      return;
    }
    const chartInstance = this.chart.chart;
    const legend = chartInstance.legend;

    const showDownload = this.historyChartSelection === 'both' || this.historyChartSelection === 'download';
    const showUpload = this.historyChartSelection === 'both' || this.historyChartSelection === 'upload';

    chartInstance.getDatasetMeta(0).hidden = !showDownload;
    chartInstance.getDatasetMeta(1).hidden = !showUpload;

    if (legend && legend.legendItems) {
      const defaultColor = '#9ca3af';
      const activeColor = '#ffffff';
      const dimmedColor = '#6b7280';

      legend.legendItems.forEach((item) => {
        const itemIndex = item.datasetIndex;
        if (typeof itemIndex === 'undefined') return;

        const isVisible = !chartInstance.getDatasetMeta(itemIndex).hidden;
        const dataset = chartInstance.data.datasets[itemIndex];

        item.hidden = false;
        item.strokeStyle = dataset.borderColor as string;
        item.fillStyle = isVisible ? (dataset.borderColor as string) : 'transparent';

        if (this.historyChartSelection === 'both') {
          item.fontColor = defaultColor;
        } else {
          item.fontColor = isVisible ? activeColor : dimmedColor;
        }
      });
    }
    chartInstance.update();
  }

  private updateHistoryChartScale(maxValueInBytes: number): void {
    if (maxValueInBytes < 1024) {
      this.historyChartUnit = 'Bytes';
      this.historyChartDivisor = 1;
      return;
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(maxValueInBytes) / Math.log(k));
    this.historyChartUnit = sizes[i] || 'Bytes';
    this.historyChartDivisor = Math.pow(k, i) || 1;
  }
}