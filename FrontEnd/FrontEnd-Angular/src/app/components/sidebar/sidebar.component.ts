/*
 # =====================================================================================
 # SERVIDOR FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
 # Versão: 3.0.0 (Padronização do Código)
 # Autor(es): Equipe Frontend
 # Data: 2025-09-29
 # Descrição: Lógica do componente da barra lateral (Sidebar). Responsável por
 #            exibir as estatísticas de tráfego, operando em modo GERAL
 #            (todos os clientes) e em modo de FOCO (um cliente específico).
 # =====================================================================================
*/

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 1 - IMPORTAÇÕES
// -----------------------------------------------------------------------------------------
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { TrafficDataService } from '../../services/traffic-data';
import { ThemeService } from '../../services/theme.service';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

// -----------------------------------------------------------------------------------------
//                               SEÇÃO 2 - COMPONENTE
// -----------------------------------------------------------------------------------------
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 3 - PROPRIEDADES
  // -----------------------------------------------------------------------------------------

  // --- Dados Exibidos na UI ---
  public totalDownload: string = '0 Mb';
  public totalUpload: string = '0 Mb';
  public activeClients: number = 0;
  public topTalker: string = 'N/A';
  public topProtocol: string = 'N/A';
  public isDrillDownMode: boolean = false;

  // --- Configurações do Gráfico SVG ---
  public readonly radius: number = 54;
  public readonly circumference: number = this.radius * 2 * Math.PI;
  public downloadProgress: number = 0;
  public uploadProgress: number = 0;
  public downloadStrokeOffset: number = this.circumference;
  public uploadStrokeOffset: number = this.circumference;
  public downloadFontSize: number = 30;
  public uploadFontSize: number = 30;

  // --- Estilos Dinâmicos ---
  public sidebarStyleObject: object = {};

  // --- Gerenciamento Interno ---
  private masterSubscription!: Subscription;

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 4 - CONSTRUTOR
  // -----------------------------------------------------------------------------------------
  constructor(
    private trafficService: TrafficDataService,
    private themeService: ThemeService
  ) { }

  // -----------------------------------------------------------------------------------------
  //                           SEÇÃO 5 - MÉTODOS DE CICLO DE VIDA
  // -----------------------------------------------------------------------------------------
  ngOnInit(): void {
    this.initializeMainDataSubscription();
  }

  ngOnDestroy(): void {
    this.masterSubscription?.unsubscribe();
  }

  // -----------------------------------------------------------------------------------------
  //                             SEÇÃO 6 - MÉTODOS PRIVADOS
  // -----------------------------------------------------------------------------------------

  /**
   * Inicializa a inscrição principal que reage a todas as fontes de dados relevantes
   * (tráfego, modo de drilldown, cliente selecionado e tema).
   * O `combineLatest` garante que o componente seja atualizado de forma síncrona
   * sempre que qualquer um desses `Observables` emitir um novo valor.
   */
  private initializeMainDataSubscription(): void {
    this.masterSubscription = combineLatest([
      this.trafficService.trafficData$,
      this.trafficService.isDrillDownActive$,
      this.trafficService.selectedClientData$,
      this.themeService.isLightMode$
    ]).subscribe(([allClients, isDrillDown, selectedClient, isLightMode]) => {
      this.isDrillDownMode = isDrillDown;
      this.updateSidebarStyles(isLightMode);

      if (isDrillDown && selectedClient) {
        const isClientStillConnected = allClients.some(client => client.ip === selectedClient.ip);
        this.processClientSpecificData(selectedClient, isClientStillConnected);
      } else {
        this.processGlobalData(allClients);
      }
    });
  }

  /**
   * Processa e exibe dados para um único cliente selecionado (Modo de Foco/Drilldown).
   * @param client O cliente cujos dados serão exibidos.
   * @param isConnected Flag que indica se o cliente ainda está enviando dados.
   */
  private processClientSpecificData(client: ClientTrafficSummary, isConnected: boolean): void {
    if (!isConnected) {
        this.resetToDefaults();
        this.topTalker = client.ip;
        return;
    }

    this.totalDownload = this.formatBytes(client.inbound);
    this.totalUpload = this.formatBytes(client.outbound);
    this.activeClients = 1;
    this.topTalker = client.ip;

    this.calculateProportionalProgress(client.inbound, client.outbound);

    this.trafficService.getProtocolDrilldownData(client.ip).subscribe(protocols => {
      this.calculateTopProtocol(protocols);
    });
  }

  /**
   * Processa e exibe dados agregados de todos os clientes (Modo Geral).
   * @param allClients Array com os dados de todos os clientes ativos.
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
    this.topProtocol = 'N/A';

    this.calculateProportionalProgress(totalBytesIn, totalBytesOut);
  }

  /**
   * Calcula a porcentagem de download e upload em relação ao tráfego total
   * e define os offsets do SVG para renderizar o gráfico de anel.
   * @param bytesIn Total de bytes de entrada (download).
   * @param bytesOut Total de bytes de saída (upload).
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

    this.downloadFontSize = this.totalDownload.length >= 8 ? 24 : 30;
    this.uploadFontSize = this.totalUpload.length >= 8 ? 24 : 30;
  }

  /**
   * Itera sobre uma lista de protocolos e identifica aquele com o maior tráfego total.
   * @param protocols Array de protocolos com seus dados de tráfego.
   */
  private calculateTopProtocol(protocols: ProtocolDrilldown[]): void {
    if (!protocols || protocols.length === 0) {
      this.topProtocol = 'N/A';
      return;
    }
    const top = protocols.reduce((prev, current) => (prev.y > current.y) ? prev : current);
    this.topProtocol = top.name;
  }

  /**
   * Reseta todas as propriedades de estado para seus valores padrão.
   * Usado quando não há clientes conectados ou em transições de estado.
   */
  private resetToDefaults(): void {
    this.totalDownload = '0 Mb';
    this.totalUpload = '0 Mb';
    this.activeClients = 0;
    this.topTalker = 'N/A';
    this.topProtocol = 'N/A';
    this.downloadProgress = 0;
    this.uploadProgress = 0;
    this.downloadStrokeOffset = this.circumference;
    this.uploadStrokeOffset = this.circumference;
    this.downloadFontSize = 30;
    this.uploadFontSize = 30;
  }

  /**
   * Formata um número de bytes em uma string legível (Kb, Mb, Gb, etc.).
   * @param bytes O número de bytes a ser formatado.
   * @param decimals O número de casas decimais a serem exibidas.
   * @returns Uma string formatada, e.g., "1.25 Gb".
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Atualiza o objeto de estilo da sidebar com base no tema (claro/escuro).
   * O objeto é vinculado diretamente ao `[ngStyle]` no template.
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
