/**
 * =========================================================================
 * COMPONENTE DA SIDEBAR (INTEGRADO COM A API E TEMA DINÂMICO)
 * Versão: 1.1.0
 *
 * Descrição: Este componente exibe as informações gerais e estatísticas
 * da rede. Ele consome os dados do TrafficDataService para os cálculos
 * e também consome o ThemeService para ajustar sua aparência dinamicamente.
 * =========================================================================
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// IMPORTAÇÕES DE SERVIÇOS E MODELOS
import { TrafficDataService } from '../../services/traffic-data.service';
import { ClientTrafficSummary } from '../../models/traffic.model';
import { ThemeService } from '../../services/theme.service.ts'; // ✅ 1. IMPORTA O NOVO SERVIÇO DE TEMA

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // --- Propriedades para Dados da Rede (Existentes) ---
  public totalDownload: string = '0 Mb';
  public totalUpload: string = '0 Mb';
  public activeClients: number = 0;
  public topTalker: string = 'N/A';
  private dataSubscription: Subscription | undefined;

  // --- Propriedades para Controle do Tema (Novas) ---
  public sidebarStyleObject: object = {};      // Para o [ngStyle] da tag <aside>
  public imageFilterStyle: string = 'none';    // Para o [style.filter] das imagens SVG
  private themeSubscription: Subscription | undefined;

  // ✅ 2. INJETA AMBOS OS SERVIÇOS NO CONSTRUTOR
  constructor(
    private trafficService: TrafficDataService,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    // ✅ 3. INICIA A "ESCUTA" DAS MUDANÇAS DE TEMA
    this.themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      // Quando o tema muda, chama a função para atualizar os estilos
      this.updateSidebarStyles(isLight);
    });

    // --- (Seu código existente para escutar os dados de tráfego) ---
    this.dataSubscription = this.trafficService.trafficData$.subscribe(
      (data: ClientTrafficSummary[]) => {
        this.calculateStatistics(data);
      }
    );
  }

  ngOnDestroy(): void {
    // Cancela ambas as subscrições para evitar memory leaks
    this.dataSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe(); // ✅ Garante a limpeza da subscrição do tema
  }
  
  /**
   * ✅ 4. NOVA FUNÇÃO QUE CONSTRÓI OS ESTILOS DINÂMICOS
   * Esta função é chamada sempre que o tema é alterado.
   * @param isLightMode Booleano recebido do ThemeService.
   */
  private updateSidebarStyles(isLightMode: boolean): void {
    const darkGradient = 'linear-gradient(rgba(25, 25, 27, 0.8), rgba(25, 25, 27, 0.8))';
    const lightGradient = 'linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7))';
    
    this.sidebarStyleObject = {
      'width': '250px',
      'height': 'calc(100vh - 90px)',
      'background-color': isLightMode ? 'var(--color-primary)' : 'var(--color-dark)',
      //'background-image': `${isLightMode ? lightGradient : darkGradient}, url('assets/images/sidebar_image.png')`,
      'background-repeat': 'no-repeat',
      'background-size': 'contain',
      'background-position': 'top'
    };
    
    // Atualiza o filtro do SVG: inverte a cor no tema claro, senão não faz nada
    this.imageFilterStyle = 'none';
  }

  // --- (Suas funções calculateStatistics e formatBytes permanecem 100% iguais) ---

  private calculateStatistics(data: ClientTrafficSummary[]): void {
    if (!data || data.length === 0) {
      this.totalDownload = '0 Mb';
      this.totalUpload = '0 Mb';
      this.activeClients = 0;
      this.topTalker = 'N/A';
      return;
    }
    const totalBytesIn = data.reduce((sum, client) => sum + client.inbound, 0);
    const totalBytesOut = data.reduce((sum, client) => sum + client.outbound, 0);
    const topTalkerClient = data.reduce((top, current) => {
      const topTotal = (top.inbound || 0) + (top.outbound || 0);
      const currentTotal = current.inbound + current.outbound;
      return currentTotal > topTotal ? current : top;
    }, data[0]);
    this.totalDownload = this.formatBytes(totalBytesIn);
    this.totalUpload = this.formatBytes(totalBytesOut);
    this.activeClients = data.length;
    this.topTalker = topTalkerClient.ip;
  }

  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}