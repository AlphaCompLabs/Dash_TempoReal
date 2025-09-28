/**
 * =====================================================================================
 * COMPONENTE DO GRÁFICO PRINCIPAL (main-chart.component.ts)
 * Versão: 2.5.0 (Código padronizado e documentado)
 *
 * Autor: Equipe Frontend
 * Descrição: Esta versão finaliza a padronização do componente, adicionando
 * documentação JSDoc completa, garantindo consistência na sintaxe
 * dos métodos e melhorando a clareza geral do código para facilitar
 * a manutenção e a colaboração da equipe.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TrafficDataService } from '../../services/traffic-data';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

// --- SEÇÃO 1: METADADOS DO COMPONENTE ---
@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrls: ['./main-chart.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class MainChartComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 2: PROPRIEDADES DE ESTADO DO COMPONENTE ---

  // Estado do Gráfico Principal
  public networkClients: ClientTrafficSummary[] = [];
  public maxChartValue: number = 0;
  public yAxisLabels: number[] = [];
  public chartUnit: string = 'Bytes';
  private mainChartDivisor: number = 1;
  private readonly MAX_CLIENTS_TO_DISPLAY = 10;
  /** Controla o acionamento da animação de 'flash' no indicador de status. */
  public pingState: 'idle' | 'green' | 'red' = 'idle';

  // Estado do Gráfico de Detalhe (Drilldown)
  public selectedClientForDetail: ClientTrafficSummary | null = null;
  public detailData: ProtocolDrilldown[] = [];
  public maxDetailChartValue: number = 0;
  public yAxisDetailLabels: number[] = [];
  public detailChartUnit: string = 'Bytes';
  public isSelectedClientConnected: boolean = true;
  private detailChartDivisor: number = 1;

  // Estado do Tooltip
  public isTooltipVisible: boolean = false;
  public tooltipText: string = '';
  public tooltipTop: number = 0;
  public tooltipLeft: number = 0;

  // Estado dos Filtros
  public activeMainFilter: 'all' | 'download' | 'upload' = 'all';
  public activeDetailFilter: 'all' | 'download' | 'upload' = 'all';
  public playPingAnimation: boolean = false;

  // Gerenciamento de Inscrição (Subscription) para evitar memory leaks
  private dataSubscription!: Subscription;

  // --- SEÇÃO 3: MÉTODOS DO CICLO DE VIDA ANGULAR (LIFECYCLE HOOKS) ---

  constructor(private trafficService: TrafficDataService) { }

  ngOnInit(): void {
    this.subscribeToTrafficData();
  }

  ngOnDestroy(): void {
    // Garante que a inscrição seja desfeita ao destruir o componente.
    this.dataSubscription?.unsubscribe();
  }

  // --- SEÇÃO 4: LÓGICA DE DADOS E ASSINATURAS (SUBSCRIPTIONS) ---

  /**
 * Inscreve-se no Observable de dados de tráfego e atualiza a UI a cada nova emissão.
 */
private subscribeToTrafficData(): void {
  this.dataSubscription = this.trafficService.trafficData$.subscribe(data => {
    
    // 1. Ordena os clientes pelo tráfego total (download + upload) em ordem decrescente.
    // Usamos [...data] para criar uma cópia e não modificar o array original.
    const sortedClients = [...data].sort((a, b) => 
      (b.inbound + b.outbound) - (a.inbound + a.outbound)
    );

    // 2. Pega apenas os 10 primeiros clientes da lista ordenada.
    const topClients = sortedClients.slice(0, this.MAX_CLIENTS_TO_DISPLAY);

    // 3. Atribui a lista processada ao estado do componente.
    this.networkClients = topClients;

    // O resto do código continua igual, mas agora trabalhando com a lista limitada.
    this.setupChartScale();
    this.validateSelectedClientConnection();

     // Apenas aciona o flash se a lista de dados recebida NÃO estiver vazia
     // 1. Verifica se a resposta da API tem dados
    if (data && data.length > 0) {
      // Se tem dados, define o estado para 'green'
      this.pingState = 'green';
    } else {
      // Se a resposta é vazia, define o estado para 'red'
      this.pingState = 'red';
    }
    
    // 2. Agenda a redefinição do estado para 'idle' após a animação
    setTimeout(() => {
      this.pingState = 'idle';
    }, 1000); // Duração da animação em milissegundos

    // // Dispara a animação de "ping" por 1 segundo
    // this.playPingAnimation = true;
    // setTimeout(() => {
    //   this.playPingAnimation = false;
    // }, 1000); // Duração da animação em milissegundos
  });
}



  /**
   * Verifica se o cliente selecionado para detalhe ainda está presente na lista de
   * clientes ativos. Se não estiver, marca como desconectado.
   */
  private validateSelectedClientConnection(): void {
    if (!this.selectedClientForDetail) {
      return; // Nenhum cliente selecionado, nada a fazer.
    }

    this.isSelectedClientConnected = this.networkClients.some(
      client => client.ip === this.selectedClientForDetail!.ip
    );

    // Se o cliente foi desconectado, recalcula a escala para exibir seu último estado.
    if (!this.isSelectedClientConnected) {
      this.setupDetailChartScale();
    }
  }

  // --- SEÇÃO 5: MÉTODOS PÚBLICOS DE INTERAÇÃO (EVENT HANDLERS) ---

  /**
   * Getter computado para verificar se existem clientes a serem exibidos.
   * Usado no template para renderização condicional.
   * @returns {boolean} Verdadeiro se houver clientes.
   */
  public get hasClients(): boolean {
    return this.networkClients && this.networkClients.length > 0;
  }

  /**
   * Alterna o filtro do gráfico principal (Download/Upload/Todos) e recalcula sua escala.
   * @param filter O filtro a ser aplicado: 'download', 'upload' ou 'all'.
   */
  public setMainFilter(filter: 'all' | 'download' | 'upload'): void {
    // Se o filtro clicado já estiver ativo, desativa-o (volta para 'all').
    
    this.activeMainFilter = this.activeMainFilter === filter ? 'all' : filter;
    this.setupChartScale();
  }

  /**
   * Alterna o filtro do gráfico de detalhe (Download/Upload/Todos) e recalcula sua escala.
   * @param filter O filtro a ser aplicado: 'download', 'upload' ou 'all'.
   */
  public setDetailFilter(filter: 'all' | 'download' | 'upload'): void {
    this.activeDetailFilter = this.activeDetailFilter === filter ? 'all' : filter;
    this.setupDetailChartScale();
  }

  /**
   * Seleciona um cliente para exibir a visualização de detalhe (drilldown) dos protocolos.
   * @param client O objeto do cliente que foi clicado.
   */
  public selectClientForDetail(client: ClientTrafficSummary): void {
    this.hideTooltip();
    this.selectedClientForDetail = client;
    this.isSelectedClientConnected = true;
    this.activeDetailFilter = 'all';

    // --- Linhas Modificadas ---
    this.trafficService.setDrillDownState(true);
    this.trafficService.setSelectedClient(client); // Linha adicionada

    this.trafficService.getProtocolDrilldownData(client.ip).subscribe(protocolData => {
      this.detailData = protocolData;
      this.setupDetailChartScale();
    });
  }

  public goBackToMainChart(): void {
    this.hideTooltip();
    this.selectedClientForDetail = null;
    this.detailData = [];

    // --- Linhas Modificadas ---
    this.trafficService.setDrillDownState(false);
    this.trafficService.setSelectedClient(null); // Linha adicionada
  }

  // --- SEÇÃO 6: MÉTODOS PÚBLICOS PARA CONTROLE DO TOOLTIP ---

  /**
   * Exibe e popula o tooltip com base nos dados da barra.
   * @param event O evento do mouse para posicionamento.
   * @param data Os dados do cliente ou do protocolo.
   */
  public showTooltip(event: MouseEvent, data: ClientTrafficSummary | ProtocolDrilldown): void {
    this.isTooltipVisible = true;
    const isDrilldown = 'y' in data; // 'y' só existe em ProtocolDrilldown

    if (isDrilldown) {
      this.tooltipText = `Protocolo: ${data.name}\nTráfego Total: ${this.formatBytes(data.y)}`;
    } else {
      const formattedDownload = this.formatBytes(data.inbound);
      const formattedUpload = this.formatBytes(data.outbound);
      this.tooltipText = `Download: ${formattedDownload}\nUpload: ${formattedUpload}`;
    }
    this.moveTooltip(event);
  }

  /** Esconde o tooltip. */
  public hideTooltip(): void {
    this.isTooltipVisible = false;
  }

  /**
   * Atualiza a posição do tooltip com base no movimento do cursor.
   * @param event O evento do mouse.
   */
  public moveTooltip(event: MouseEvent): void {
    this.tooltipLeft = event.clientX + 15;
    this.tooltipTop = event.clientY + 15;
  }

  // --- SEÇÃO 7: LÓGICA PRIVADA DE CÁLCULO DE ESCALA ---

  /**
   * Orquestrador para o gráfico principal. Prepara os dados com base no filtro ativo
   * e chama a função centralizada para calcular a escala do eixo Y.
   */
  private setupChartScale(): void {
    if (!this.hasClients) {
      // Reseta os valores do gráfico se não houver clientes.
      this.maxChartValue = 0;
      this.yAxisLabels = [];
      return;
    }

    const dataInBytes = this.networkClients.map(c => {
      if (this.activeMainFilter === 'download') return c.inbound;
      if (this.activeMainFilter === 'upload') return c.outbound;
      return c.inbound + c.outbound; // 'all'
    });

    const scale = this.calculateChartScale(dataInBytes);
    this.maxChartValue = scale.maxChartValue;
    this.yAxisLabels = scale.yAxisLabels;
    this.chartUnit = scale.unit;
    this.mainChartDivisor = scale.divisor;
  }

  /**
   * Orquestrador para o gráfico de detalhe. Prepara os dados com base no filtro ativo
   * e chama a função centralizada para calcular a escala do eixo Y.
   */
  private setupDetailChartScale(): void {
    if (this.detailData.length === 0) {
      // Reseta os valores do gráfico se não houver dados de protocolo.
      this.maxDetailChartValue = 0;
      this.yAxisDetailLabels = [];
      return;
    }

    const dataInBytes = this.detailData.map(p => {
      if (this.activeDetailFilter === 'download') return p.inbound;
      if (this.activeDetailFilter === 'upload') return p.outbound;
      return p.y; // 'y' representa o total (inbound + outbound)
    });
    
    const scale = this.calculateChartScale(dataInBytes);
    this.maxDetailChartValue = scale.maxChartValue;
    this.yAxisDetailLabels = scale.yAxisLabels;
    this.detailChartUnit = scale.unit;
    this.detailChartDivisor = scale.divisor;
  }

  /**
   * [LÓGICA CENTRAL] Calcula a escala ideal para o eixo Y de um gráfico (DRY).
   * @param data Um array de números (em bytes) a serem plotados.
   * @returns Um objeto contendo os valores calculados para a escala do gráfico.
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
    // Arredonda para cima para garantir que a maior barra caiba no gráfico.
    const maxChartValue = Math.ceil(maxValueInUnit);
    
    const step = maxChartValue > 0 ? maxChartValue / 5 : 1;
    const yAxisLabels = Array.from({ length: 6 }, (_, idx) => parseFloat((maxChartValue - (idx * step)).toFixed(1)));
    
    return { maxChartValue, yAxisLabels, unit, divisor };
  }


  // --- SEÇÃO 8: MÉTODOS PÚBLICOS DE CÁLCULO PARA O TEMPLATE (.html) ---

  /**
   * Calcula a altura percentual total da barra de um cliente para o gráfico principal.
   * @param client O cliente para o qual a altura da barra será calculada.
   * @returns A altura em porcentagem (0 a 100).
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
   * Calcula a proporção percentual de download dentro da barra total de um cliente.
   * @param client O cliente a ser calculado.
   * @returns A proporção em porcentagem.
   */
  public calculateDownloadRatio(client: ClientTrafficSummary): number {
    if (this.activeMainFilter === 'upload') return 0;
    if (this.activeMainFilter === 'download') return 100;
    const total = client.inbound + client.outbound;
    return total === 0 ? 0 : (client.inbound / total) * 100;
  }

  /**
   * Calcula a proporção percentual de upload dentro da barra total de um cliente.
   * @param client O cliente a ser calculado.
   * @returns A proporção em porcentagem.
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
   * @returns A altura em porcentagem (0 a 100).
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
   * Calcula a proporção percentual de download dentro da barra total de um protocolo.
   * @param protocol O protocolo a ser calculado.
   * @returns A proporção em porcentagem.
   */
  public calculateDetailDownloadRatio(protocol: ProtocolDrilldown): number {
    return protocol.y === 0 ? 0 : (protocol.inbound / protocol.y) * 100;
  }
  
  /**
   * Calcula a proporção percentual de upload dentro da barra total de um protocolo.
   * @param protocol O protocolo a ser calculado.
   * @returns A proporção em porcentagem.
   */
  public calculateDetailUploadRatio(protocol: ProtocolDrilldown): number {
    return protocol.y === 0 ? 0 : (protocol.outbound / protocol.y) * 100;
  }

  // --- SEÇÃO 9: MÉTODOS PRIVADOS DE UTILIDADE ---

  /**
   * Formata um número de bytes em uma string legível (KB, MB, GB, etc.).
   * @param bytes O número de bytes a ser formatado.
   * @param decimals O número de casas decimais.
   * @returns A string formatada.
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

