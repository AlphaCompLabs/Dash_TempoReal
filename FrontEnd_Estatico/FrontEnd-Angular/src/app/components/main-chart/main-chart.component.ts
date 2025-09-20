import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  NetworkClient, ProtocolData } from '../../models/traffic.models';
import { TrafficService } from '../../services/traffic.service';

@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrl: './main-chart.component.css',
  standalone: true,
  imports: [CommonModule]
})
export class MainChartComponent implements OnInit {

  public networkClients: NetworkClient[] = [];
  public maxChartValue: number = 25;
  public yAxisLabels: number[] = [];

  public selectedClientForDetail: NetworkClient | null = null;
  public detailData: ProtocolData[] = [];
  public maxDetailChartValue: number = 30;
  public yAxisDetailLabels: number[] = [];
  public isSelectedClientConnected: boolean = true;

  // Tooltip
  public isTooltipVisible: boolean = false;
  public tooltipText: string = '';
  public tooltipTop: number = 0;
  public tooltipLeft: number = 0;

  constructor(private trafficservice: TrafficService) {}

  ngOnInit(): void {
    this.fetchClients();

    // Atualiza a cada 5s
    setInterval(() => {
      this.fetchClients();
      this.validateSelectedClient();
    }, 5000);
  }

  get hasClients(): boolean {
    return this.networkClients && this.networkClients.length > 0;
  }

  private fetchClients(): void {
    this.trafficservice.getClients().subscribe(data => {
      this.networkClients = data;
      this.setupChartScale();
    });
  }

  public selectClientForDetail(client: NetworkClient): void {
    this.hideTooltip();
    this.selectedClientForDetail = client;
    
    this.trafficservice.getClientProtocols(client.ip).subscribe(data => {
      this.detailData = data;
      this.setupDetailChartScale();
      this.isSelectedClientConnected = true;
    });
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

  // Tooltip
  public showTooltip(event: MouseEvent, data: { downloadValue: number; uploadValue: number; }): void {
    this.isTooltipVisible = true;
    this.tooltipText = `Download: ${data.downloadValue} MB\nUpload: ${data.uploadValue} MB`;
    this.moveTooltip(event);
  }
  public hideTooltip(): void { this.isTooltipVisible = false; }
  public moveTooltip(event: MouseEvent): void {
    this.tooltipLeft = event.clientX;
    this.tooltipTop = event.clientY;
  }

  // Escalas
  private setupChartScale(): void {
    if (!this.hasClients) { this.maxChartValue = 0; this.yAxisLabels = []; return; }
    const maxValue = Math.max(...this.networkClients.map(c => c.downloadValue + c.uploadValue));
    this.maxChartValue = Math.ceil(maxValue / 5) * 5 || 5;
    const step = this.maxChartValue / 5;
    this.yAxisLabels = Array.from({ length: 6 }, (_, i) => this.maxChartValue - (i * step));
  }

  calculateTotalHeight = (client: NetworkClient) =>
    Math.min(((client.downloadValue + client.uploadValue) / this.maxChartValue) * 100, 100);

  calculateDownloadRatio = (client: NetworkClient) =>
    (client.downloadValue + client.uploadValue === 0) ? 0 :
    (client.downloadValue / (client.downloadValue + client.uploadValue)) * 100;

  calculateUploadRatio = (client: NetworkClient) =>
    (client.downloadValue + client.uploadValue === 0) ? 0 :
    (client.uploadValue / (client.downloadValue + client.uploadValue)) * 100;

  private setupDetailChartScale(): void {
    if (this.detailData.length === 0) { this.maxDetailChartValue = 0; this.yAxisDetailLabels = []; return; }
    const maxValue = Math.max(...this.detailData.map(p => p.downloadValue + p.uploadValue));
    this.maxDetailChartValue = Math.ceil(maxValue / 5) * 5 || 5;
    const step = this.maxDetailChartValue / 5;
    this.yAxisDetailLabels = Array.from({ length: 6 }, (_, i) => parseFloat((this.maxDetailChartValue - (i * step)).toFixed(2)));
  }

  calculateDetailTotalHeight = (protocol: ProtocolData) =>
    Math.min(((protocol.downloadValue + protocol.uploadValue) / this.maxDetailChartValue) * 100, 100);

  calculateDetailDownloadRatio = (protocol: ProtocolData) =>
    (protocol.downloadValue + protocol.uploadValue === 0) ? 0 :
    (protocol.downloadValue / (protocol.downloadValue + protocol.uploadValue)) * 100;

  calculateDetailUploadRatio = (protocol: ProtocolData) =>
    (protocol.downloadValue + protocol.uploadValue === 0) ? 0 :
    (protocol.uploadValue / (protocol.downloadValue + protocol.uploadValue)) * 100;
}
