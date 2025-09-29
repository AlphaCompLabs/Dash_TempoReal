/*
 # =====================================================================================
 # SERVIDOR FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
 # Versão: 3.0.0 (Padronização do Código)
 # Autor(es): Equipe Frontend
 # Data: 2025-09-29
 # Descrição: Lógica do componente do gráfico principal (MainChart). Este é um
 #            componente crítico que gerencia a exibição dos dados de tráfego,
 #            incluindo a visão geral e o detalhamento por cliente.
 # =====================================================================================
*/

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 1 - IMPORTAÇÕES
// -----------------------------------------------------------------------------------------
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TrafficDataService } from '../../services/traffic-data';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

// -----------------------------------------------------------------------------------------
//                               SEÇÃO 2 - COMPONENTE
// -----------------------------------------------------------------------------------------
@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrls: ['./main-chart.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class MainChartComponent implements OnInit, OnDestroy {

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 3 - PROPRIEDADES
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

  // --- Estado dos Filtros ---
  public activeMainFilter: 'all' | 'download' | 'upload' = 'all';
  public activeDetailFilter: 'all' | 'download' | 'upload' = 'all';
  public playPingAnimation: boolean = false;

  // --- Gerenciamento de Inscrição ---
  private dataSubscription!: Subscription;

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 4 - CONSTRUTOR
  // -----------------------------------------------------------------------------------------
  constructor(private trafficService: TrafficDataService) { }

  // -----------------------------------------------------------------------------------------
  //                           SEÇÃO 5 - MÉTODOS DE CICLO DE VIDA
  // -----------------------------------------------------------------------------------------
  ngOnInit(): void {
    this.subscribeToTrafficData();
  }

  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
  }

  // -----------------------------------------------------------------------------------------
  //                              SEÇÃO 6 - MÉTODOS PÚBLICOS
  // -----------------------------------------------------------------------------------------

  /**
   * Propriedade computada (getter) para verificar se há clientes a serem exibidos.
   * Usado no template para renderização condicional da UI.
   * @returns {boolean} Verdadeiro se a lista de clientes não estiver vazia.
   */
  public get hasClients(): boolean {
    return this.networkClients && this.networkClients.length > 0;
  }

  /**
   * Define o filtro para o gráfico principal (download/upload/todos).
   * Se o filtro clicado já estiver ativo, ele é desativado (volta para 'all').
   * @param filter O tipo de filtro a ser aplicado ('download' ou 'upload').
   */
  public setMainFilter(filter: 'all' | 'download' | 'upload'): void {
    this.activeMainFilter = this.activeMainFilter === filter ? 'all' : filter;
    this.setupChartScale();
  }

  /**
   * Define o filtro para o gráfico de detalhe (download/upload/todos).
   * Se o filtro clicado já estiver ativo, ele é desativado (volta para 'all').
   * @param filter O tipo de filtro a ser aplicado ('download' ou 'upload').
   */
  public setDetailFilter(filter: 'all' | 'download' | 'upload'): void {
    this.activeDetailFilter = this.activeDetailFilter === filter ? 'all' : filter;
    this.setupDetailChartScale();
  }

  /**
   * Seleciona um cliente para exibir a visualização de detalhe (drilldown).
   * Inicia a busca dos dados de tráfego por protocolo para o cliente selecionado.
   * @param client O objeto do cliente que foi clicado no gráfico.
   */
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

  /**
   * Retorna da visualização de detalhe para o gráfico principal.
   * Limpa os dados e o estado relacionados ao cliente que estava selecionado.
   */
  public goBackToMainChart(): void {
    this.hideTooltip();
    this.selectedClientForDetail = null;
    this.detailData = [];
    this.trafficService.setDrillDownState(false);
    this.trafficService.setSelectedClient(null);
  }

  /**
   * Torna o tooltip visível e define seu conteúdo com base nos dados da barra.
   * Formata os valores de tráfego para uma leitura amigável.
   * @param event O evento do mouse, usado para obter a posição do cursor.
   * @param data Os dados do cliente ou protocolo associados à barra do gráfico.
   */
  public showTooltip(event: MouseEvent, data: ClientTrafficSummary | ProtocolDrilldown): void {
    this.isTooltipVisible = true;
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

  /**
   * Esconde o tooltip, tornando-o invisível na tela.
   */
  public hideTooltip(): void {
    this.isTooltipVisible = false;
  }

  /**
   * Atualiza a posição (top, left) do tooltip na tela com base no movimento do cursor.
   * @param event O evento de movimento do mouse.
   */
  public moveTooltip(event: MouseEvent): void {
    this.tooltipLeft = event.clientX + 15;
    this.tooltipTop = event.clientY + 15;
  }

  /**
   * Calcula a altura percentual total da barra de um cliente para o gráfico principal.
   * @param client O cliente para o qual a altura da barra será calculada.
   * @returns A altura em porcentagem (de 0 a 100).
   */
  public calculateTotalHeight(client: ClientTrafficSummary): number {
    if (this.maxChartValue === 0) return 0;
    let valueInBytes = 0;
    if (this.activeMainFilter === 'download') valueInBytes = client.inbound;
    else if (this.activeMainFilter === 'upload') valueInBytes = client.outbound;
    else valueInBytes = client.inbound + client.outbound;
    const valueInUnit = valueInBytes / this.mainChartDivisor;
    return Math.min((valueInUnit / this.maxChartValue) * 100, 100);
  }

  /**
   * Calcula a proporção percentual de download dentro da altura total da barra de um cliente.
   * @param client O cliente a ser calculado.
   * @returns A proporção de download em porcentagem.
   */
  public calculateDownloadRatio(client: ClientTrafficSummary): number {
    if (this.activeMainFilter === 'upload') return 0;
    if (this.activeMainFilter === 'download') return 100;
    const total = client.inbound + client.outbound;
    return total === 0 ? 0 : (client.inbound / total) * 100;
  }

  /**
   * Calcula a proporção percentual de upload dentro da altura total da barra de um cliente.
   * @param client O cliente a ser calculado.
   * @returns A proporção de upload em porcentagem.
   */
  public calculateUploadRatio(client: ClientTrafficSummary): number {
    if (this.activeMainFilter === 'download') return 0;
    if (this.activeMainFilter === 'upload') return 100;
    const total = client.inbound + client.outbound;
    return total === 0 ? 0 : (client.outbound / total) * 100;
  }

  /**
   * Calcula a altura percentual total da barra de um protocolo para o gráfico de detalhe.
   * @param protocol O protocolo para o qual a altura da barra será calculada.
   * @returns A altura em porcentagem (de 0 a 100).
   */
  public calculateDetailTotalHeight(protocol: ProtocolDrilldown): number {
    if (this.maxDetailChartValue === 0) return 0;
    let valueInBytes = 0;
    if (this.activeDetailFilter === 'download') valueInBytes = protocol.inbound;
    else if (this.activeDetailFilter === 'upload') valueInBytes = protocol.outbound;
    else valueInBytes = protocol.y;
    const valueInUnit = valueInBytes / this.detailChartDivisor;
    return Math.min((valueInUnit / this.maxDetailChartValue) * 100, 100);
  }

  /**
   * Calcula a proporção percentual de download dentro da altura total da barra de um protocolo.
   * @param protocol O protocolo a ser calculado.
   * @returns A proporção de download em porcentagem.
   */
  public calculateDetailDownloadRatio(protocol: ProtocolDrilldown): number {
    return protocol.y === 0 ? 0 : (protocol.inbound / protocol.y) * 100;
  }

  /**
   * Calcula a proporção percentual de upload dentro da altura total da barra de um protocolo.
   * @param protocol O protocolo a ser calculado.
   * @returns A proporção de upload em porcentagem.
   */
  public calculateDetailUploadRatio(protocol: ProtocolDrilldown): number {
    return protocol.y === 0 ? 0 : (protocol.outbound / protocol.y) * 100;
  }

  // -----------------------------------------------------------------------------------------
  //                             SEÇÃO 7 - MÉTODOS PRIVADOS
  // -----------------------------------------------------------------------------------------

  /**
   * Inscreve-se no serviço de dados de tráfego. A cada nova emissão de dados,
   * a lista de clientes é ordenada, filtrada (top 10), e o gráfico é atualizado.
   */
  private subscribeToTrafficData(): void {
    this.dataSubscription = this.trafficService.trafficData$.subscribe(data => {
      const sortedClients = [...data].sort((a, b) =>
        (b.inbound + b.outbound) - (a.inbound + a.outbound)
      );
      const topClients = sortedClients.slice(0, this.MAX_CLIENTS_TO_DISPLAY);
      this.networkClients = topClients;
      this.setupChartScale();
      this.validateSelectedClientConnection();
      if (data && data.length > 0) {
        this.pingState = 'green';
      } else {
        this.pingState = 'red';
      }
      setTimeout(() => {
        this.pingState = 'idle';
      }, 1000);
    });
  }

  /**
   * Verifica se o cliente atualmente selecionado para detalhe ainda existe na
   * lista de clientes ativos. Se não, marca-o como desconectado na UI.
   */
  private validateSelectedClientConnection(): void {
    if (!this.selectedClientForDetail) {
      return;
    }
    this.isSelectedClientConnected = this.networkClients.some(
      client => client.ip === this.selectedClientForDetail!.ip
    );
    if (!this.isSelectedClientConnected) {
      this.setupDetailChartScale();
    }
  }

  /**
   * Orquestra o cálculo da escala para o gráfico principal. Prepara os dados
   * com base no filtro ativo e chama a função de cálculo central.
   */
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

  /**
   * Orquestra o cálculo da escala para o gráfico de detalhe. Prepara os dados
   * com base no filtro ativo e chama a função de cálculo central.
   */
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

  /**
   * Lógica central e reutilizável que calcula a escala ideal para um eixo Y.
   * Determina a melhor unidade (Bytes, KB, MB...) e gera os rótulos.
   * @param data Um array de valores numéricos (em bytes) a serem plotados.
   * @returns Um objeto com o valor máximo do eixo, os rótulos, a unidade e o divisor.
   */
  private calculateChartScale(data: number[]): { maxChartValue: number; yAxisLabels: number[]; unit: string; divisor: number } {
    if (data.length === 0) {
      return { maxChartValue: 0, yAxisLabels: [], unit: 'Bytes', divisor: 1 };
    }
    const maxValueInBytes = Math.max(...data);
    if (maxValueInBytes === 0) {
      return { maxChartValue: 1, yAxisLabels: [1, 0], unit: 'Bytes', divisor: 1 };
    }
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

  /**
   * Função utilitária para formatar um número de bytes em uma string legível.
   * @param bytes O número de bytes a ser formatado.
   * @param decimals O número de casas decimais desejado no resultado.
   * @returns A string formatada (ex: "1.23 MB").
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
