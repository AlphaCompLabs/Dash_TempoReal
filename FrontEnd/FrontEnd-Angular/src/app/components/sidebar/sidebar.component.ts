/**
 * =====================================================================================
 * COMPONENTE DA SIDEBAR (COM LÓGICA CONTEXTUAL)
 * Versão: 2.0.0 (Refatorado para múltiplos modos de visualização)
 *
 * Descrição: Este componente agora possui dois modos de operação:
 * 1. MODO GERAL: Exibe as estatísticas totais da rede.
 * 2. MODO DE FOCO: Ativado pelo "drill down" do gráfico, exibe as estatísticas
 * de um único cliente selecionado.
 * =====================================================================================
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { TrafficDataService, GlobalProtocolSummary } from '../../services/traffic-data';
import { ThemeService } from '../../services/theme.service';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // --- Propriedades de Estado ---
  public totalDownload: string = '0 Mb';
  public totalUpload: string = '0 Mb';
  public activeClients: number = 0;
  public topTalker: string = 'N/A';
  public topProtocol: string = 'N/A';
  public isDrillDownMode: boolean = false;

  // --- Propriedades de Estilo e Gráfico ---
  public sidebarStyleObject: object = {};
  public imageFilterStyle: string = 'none';
  public radius: number = 54;
  public circumference: number = 0;
  public downloadProgress: number = 0;
  public uploadProgress: number = 0;
  public downloadStrokeOffset: number = 0;
  public uploadStrokeOffset: number = 0;
  public downloadFontSize: number = 30;
  public uploadFontSize: number = 30;

  private masterSubscription!: Subscription;

  constructor(
    private trafficService: TrafficDataService,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.circumference = this.radius * 2 * Math.PI;
    this.initializeSubscriptions();
  }

  ngOnDestroy(): void {
    this.masterSubscription?.unsubscribe();
  }

  private initializeSubscriptions(): void {
    this.masterSubscription = combineLatest([
      this.trafficService.trafficData$,
      this.trafficService.isDrillDownActive$,
      this.trafficService.selectedClientData$,
      this.themeService.isLightMode$
    ]).subscribe(([allClients, isDrillDown, selectedClient, isLightMode]) => {
      this.isDrillDownMode = isDrillDown;
      this.updateSidebarStyles(isLightMode);

      if (isDrillDown && selectedClient) {
        // MODO DE FOCO (DRILL DOWN)
          const isClientStillConnected = allClients.some(client => client.ip === selectedClient.ip);

          if (isClientStillConnected) {
            // Se estiver conectado, processa os dados dele normalmente
            this.processClientSpecificData(selectedClient);
          } else {
            // Se NÃO estiver conectado, reseta os contadores para zero
            this.resetToDefaults();
          }
      } else {
        // MODO GERAL
        this.processGlobalData(allClients);
      }
    });
  }

  private processClientSpecificData(client: ClientTrafficSummary): void {
    // ATUALIZA os totais para mostrar apenas os dados do cliente
    this.totalDownload = this.formatBytes(client.inbound);
    this.totalUpload = this.formatBytes(client.outbound);

    // CALCULA o gráfico proporcional para este cliente
    this.calculateProportionalProgress(client.inbound, client.outbound);

    // BUSCA e calcula o Top Protocol para este cliente
    this.trafficService.getProtocolDrilldownData(client.ip).subscribe(protocols => {
      this.calculateTopProtocol(protocols);
    });
  }

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
    this.topProtocol = 'N/A'; // Top Protocol é N/A no modo geral

    // CALCULA o gráfico proporcional para o total da rede
    this.calculateProportionalProgress(totalBytesIn, totalBytesOut);
  }

  private calculateProportionalProgress(bytesIn: number, bytesOut: number): void {
    const totalTraffic = bytesIn + bytesOut;
    if (totalTraffic === 0) {
      this.downloadProgress = 0;
      this.uploadProgress = 0;
    } else {
      this.downloadProgress = (bytesIn / totalTraffic) * 100;
      this.uploadProgress = (bytesOut / totalTraffic) * 100;
    }

    const downloadOffset = this.circumference - (this.downloadProgress / 100) * this.circumference;
    this.downloadStrokeOffset = Math.max(0, Math.min(downloadOffset, this.circumference));

    const uploadOffset = this.circumference - (this.uploadProgress / 100) * this.circumference;
    this.uploadStrokeOffset = Math.max(0, Math.min(uploadOffset, this.circumference));
    
    if (this.totalDownload.length >= 8) { this.downloadFontSize = 24; } else { this.downloadFontSize = 30; }
    if (this.totalUpload.length >= 8) { this.uploadFontSize = 24; } else { this.uploadFontSize = 30; }
  }

  private calculateTopProtocol(protocols: ProtocolDrilldown[] | GlobalProtocolSummary[]): void {
    if (!protocols || protocols.length === 0) {
      this.topProtocol = 'N/A';
      return;
    }
    const top = protocols.reduce((prev, current) => (prev.y > current.y) ? prev : current);
    this.topProtocol = top.name;
  }

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
  
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  private updateSidebarStyles(isLightMode: boolean): void {
    if (isLightMode) {
      const lightOverlay = 'linear-gradient(rgba(212, 212, 212, 0.5), rgba(212, 212, 212, 0.5))';
      this.sidebarStyleObject = {
        'width': '250px',
        'height': 'calc(100vh - 90px)',
        'background-color': '#d4d4d4',
        'background-image': `${lightOverlay}, url('assets/images/sidebar_image_white.svg')`,
        'background-repeat': 'no-repeat',
        'background-size': 'contain',
        'background-position': 'center top'
      };
    } else {
      const darkOverlay = 'linear-gradient(rgba(25, 25, 25, 0.85), rgba(25, 25, 25, 0.85))';
      this.sidebarStyleObject = {
        'width': '250px',
        'height': 'calc(100vh - 90px)',
        'background-color': "#191919",
        'background-image': `${darkOverlay}, url('assets/images/sidebar_image.png')`,
        'background-repeat': 'no-repeat',
        'background-size': 'contain',
        'background-position': 'center top'
      };
    }
    this.imageFilterStyle = 'none';
  }
}