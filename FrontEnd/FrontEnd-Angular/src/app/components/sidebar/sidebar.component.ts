/*
# =====================================================================================
# SERVIDOR FRONTEND - COMPONENTE DA BARRA LATERAL (SIDEBAR)
# Versão: 3.0.1 (Padronização Segura e Organização de Código)
#
# Autor(es): Equipe Frontend (Revisado por Padronização de Código)
# Data: 2025-09-30
# Descrição: Lógica do componente da barra lateral (Sidebar). Exibe estatísticas
#            de tráfego em dois modos: GERAL (todos os clientes) e FOCO
#            (um cliente específico), reagindo em tempo real às mudanças de dados.
# =====================================================================================
*/

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { TrafficDataService } from '../../services/traffic-data';
import { ThemeService } from '../../services/theme.service';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

// --- SEÇÃO 2: METADADOS DO COMPONENTE ---
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
/**
 * Componente Sidebar que exibe um resumo das estatísticas de tráfego.
 */
export class SidebarComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 3: PROPRIEDADES E ESTADO DA CLASSE ---

  // --- Constantes Internas ---
  private readonly NOT_AVAILABLE_LABEL = 'N/A';
  private readonly DEFAULT_FONT_SIZE = 30;
  private readonly REDUCED_FONT_SIZE = 24;
  private readonly FONT_SIZE_THRESHOLD = 8; // Comprimento da string para reduzir a fonte
  private readonly BYTE_UNITS = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb'];

  // --- Estado da UI (Dados exibidos no template) ---
  public totalDownload: string = '0 Mb';
  public totalUpload: string = '0 Mb';
  public activeClients: number = 0;
  public topTalker: string = this.NOT_AVAILABLE_LABEL;
  public topProtocol: string = this.NOT_AVAILABLE_LABEL;
  public isDrillDownMode: boolean = false;

  // --- Estado do Gráfico SVG Circular ---
  public readonly radius: number = 54;
  public readonly circumference: number = this.radius * 2 * Math.PI;
  public downloadProgress: number = 0;
  public uploadProgress: number = 0;
  public downloadStrokeOffset: number = this.circumference;
  public uploadStrokeOffset: number = this.circumference;
  public downloadFontSize: number = this.DEFAULT_FONT_SIZE;
  public uploadFontSize: number = this.DEFAULT_FONT_SIZE;

  // --- Estilos Dinâmicos ---
  public sidebarStyleObject: object = {};

  // --- Gerenciamento de Inscrições (Subscriptions) ---
  private subscriptions = new Subscription();


  // --- SEÇÃO 4: CONSTRUTOR E MÉTODOS DE CICLO DE VIDA ---

  /**
   * @param trafficService Serviço que fornece os dados de tráfego em tempo real.
   * @param themeService Serviço que gerencia o estado do tema (claro/escuro).
   */
  constructor(
    private trafficService: TrafficDataService,
    private themeService: ThemeService
  ) { }

  /**
   * Método de ciclo de vida do Angular, executado na inicialização do componente.
   */
  ngOnInit(): void {
    this.initializeMainDataSubscription();
  }

  /**
   * Método de ciclo de vida do Angular, executado na destruição do componente.
   * Garante que todas as inscrições (subscriptions) sejam canceladas para evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  // --- SEÇÃO 5: MÉTODOS PRIVADOS DE PROCESSAMENTO DE DADOS ---

  /**
   * Inicializa a inscrição principal que reage a todas as fontes de dados relevantes.
   * `combineLatest` garante que a UI seja atualizada de forma síncrona sempre
   * que qualquer um dos Observables emitir um novo valor.
   */
  private initializeMainDataSubscription(): void {
    const combinedStream$ = combineLatest([
      this.trafficService.trafficData$,
      this.trafficService.isDrillDownActive$,
      this.trafficService.selectedClientData$,
      this.themeService.isLightMode$
    ]);

    this.subscriptions.add(
      combinedStream$.subscribe(([allClients, isDrillDown, selectedClient, isLightMode]) => {
        this.isDrillDownMode = isDrillDown;
        this.updateSidebarStyles(isLightMode);

        if (isDrillDown && selectedClient) {
          const isClientStillConnected = allClients.some(client => client.ip === selectedClient.ip);
          this.processClientSpecificData(selectedClient, isClientStillConnected);
        } else {
          this.processGlobalData(allClients);
        }
      })
    );
  }

  /**
   * Processa e exibe dados para um único cliente (Modo de Foco/Drilldown).
   * @param client O cliente a ser exibido.
   * @param isConnected Flag que indica se o cliente ainda está ativo.
   */
  private processClientSpecificData(client: ClientTrafficSummary, isConnected: boolean): void {
    if (!isConnected) {
      this.resetToDefaults();
      this.topTalker = client.ip; // Mantém o IP do cliente desconectado
      return;
    }

    this.totalDownload = this.formatBytes(client.inbound);
    this.totalUpload = this.formatBytes(client.outbound);
    this.activeClients = 1;
    this.topTalker = client.ip;
    this.calculateProportionalProgress(client.inbound, client.outbound);

    // Nota: Esta é uma sub-inscrição segura, pois `getProtocolDrilldownData`
    // provavelmente usa HttpClient, que completa o Observable automaticamente.
    this.trafficService.getProtocolDrilldownData(client.ip).subscribe(protocols => {
      this.calculateTopProtocol(protocols);
    });
  }

  /**
   * Processa e exibe dados agregados de todos os clientes (Modo Geral).
   * @param allClients Array com os dados de todos os clientes.
   */
  private processGlobalData(allClients: ClientTrafficSummary[]): void {
    if (!allClients || allClients.length === 0) {
      this.resetToDefaults();
      return;
    }

    const totalBytesIn = allClients.reduce((sum, c) => sum + c.inbound, 0);
    const totalBytesOut = allClients.reduce((sum, c) => sum + c.outbound, 0);

    const topTalkerClient = allClients.reduce((top, current) =>
      (current.inbound + current.outbound) > (top.inbound + top.outbound) ? current : top
    );

    this.totalDownload = this.formatBytes(totalBytesIn);
    this.totalUpload = this.formatBytes(totalBytesOut);
    this.activeClients = allClients.length;
    this.topTalker = topTalkerClient.ip;
    this.topProtocol = this.NOT_AVAILABLE_LABEL;
    this.calculateProportionalProgress(totalBytesIn, totalBytesOut);
  }


  // --- SEÇÃO 6: MÉTODOS PRIVADOS DE CÁLCULO E UTILITÁRIOS ---

  /**
   * Calcula a porcentagem do tráfego e define os offsets do SVG para o gráfico.
   * @param bytesIn Total de bytes de entrada.
   * @param bytesOut Total de bytes de saída.
   */
  private calculateProportionalProgress(bytesIn: number, bytesOut: number): void {
    const totalTraffic = bytesIn + bytesOut;

    if (totalTraffic === 0) {
      this.downloadProgress = 0;
      this.uploadProgress = 0;
    } else {
      this.downloadProgress = (bytesIn / totalTraffic) * 100;
      this.uploadProgress = (bytesOut / totalTraffic) * 100;
    }

    this.downloadStrokeOffset = this.circumference - (this.downloadProgress / 100) * this.circumference;
    this.uploadStrokeOffset = this.circumference - (this.uploadProgress / 100) * this.circumference;

    // Ajusta o tamanho da fonte se o texto for muito longo
    this.downloadFontSize = this.totalDownload.length >= this.FONT_SIZE_THRESHOLD ? this.REDUCED_FONT_SIZE : this.DEFAULT_FONT_SIZE;
    this.uploadFontSize = this.totalUpload.length >= this.FONT_SIZE_THRESHOLD ? this.REDUCED_FONT_SIZE : this.DEFAULT_FONT_SIZE;
  }

  /**
   * Identifica o protocolo com o maior tráfego total em uma lista.
   * @param protocols Array de protocolos com dados de tráfego.
   */
  private calculateTopProtocol(protocols: ProtocolDrilldown[]): void {
    if (!protocols || protocols.length === 0) {
      this.topProtocol = this.NOT_AVAILABLE_LABEL;
      return;
    }
    const top = protocols.reduce((prev, current) => (prev.y > current.y) ? prev : current);
    this.topProtocol = top.name;
  }

  /**
   * Reseta as propriedades de estado para seus valores padrão.
   */
  private resetToDefaults(): void {
    this.totalDownload = '0 Mb';
    this.totalUpload = '0 Mb';
    this.activeClients = 0;
    this.topTalker = this.NOT_AVAILABLE_LABEL;
    this.topProtocol = this.NOT_AVAILABLE_LABEL;
    this.downloadProgress = 0;
    this.uploadProgress = 0;
    this.downloadStrokeOffset = this.circumference;
    this.uploadStrokeOffset = this.circumference;
    this.downloadFontSize = this.DEFAULT_FONT_SIZE;
    this.uploadFontSize = this.DEFAULT_FONT_SIZE;
  }

  /**
   * Formata um número de bytes em uma string legível (Kb, Mb, etc.).
   * @param bytes O número de bytes a ser formatado.
   * @param decimals O número de casas decimais.
   * @returns Uma string formatada, ex: "1.25 Gb".
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + this.BYTE_UNITS[i];
  }

  /**
   * Atualiza o objeto de estilo da sidebar com base no tema (claro/escuro).
   * O objeto é vinculado diretamente ao `[ngStyle]` no template.
   * As cores e imagens não foram alteradas, apenas organizadas.
   * @param isLightMode Booleano que indica se o modo claro está ativo.
   */
  private updateSidebarStyles(isLightMode: boolean): void {
    const baseStyles = {
      'width': '250px',
      'height': 'calc(100vh - 90px)',
      'background-repeat': 'no-repeat',
      'background-size': 'contain',
      'background-position': 'center top'
    };

    if (isLightMode) {
      this.sidebarStyleObject = {
        ...baseStyles,
        'background-color': '#d4d4d4',
        'background-image': `linear-gradient(rgba(212, 212, 212, 0.5), rgba(212, 212, 212, 0.5)), url('assets/images/sidebar_image_white.svg')`
      };
    } else {
      this.sidebarStyleObject = {
        ...baseStyles,
        'background-color': "#191919",
        'background-image': `linear-gradient(rgba(25, 25, 25, 0.85), rgba(25, 25, 25, 0.85)), url('assets/images/sidebar_image.png')`
      };
    }
  }
}