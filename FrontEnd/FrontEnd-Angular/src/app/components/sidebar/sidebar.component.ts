/**
 * =====================================================================================
 * COMPONENTE DA SIDEBAR (INTEGRADO COM A API E TEMA DINÂMICO)
 * Versão: 1.2.0 (Estrutura e documentação aprimoradas)
 *
 * Descrição: Este componente exibe as informações gerais e estatísticas da rede.
 * Ele consome dados do TrafficDataService para os cálculos e também se
 * inscreve no ThemeService para ajustar sua aparência dinamicamente.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TrafficDataService } from '../../services/traffic-data';
import { ThemeService } from '../../services/theme.service'; // Correção: removido .ts da importação
import { ClientTrafficSummary } from '../../models/traffic.model';

// --- SEÇÃO 1: METADADOS DO COMPONENTE ---
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 2: PROPRIEDADES DE ESTADO DO COMPONENTE ---

  // --- Propriedades de Estatísticas da Rede ---
  public totalDownload: string = '0 Mb';
  public totalUpload: string = '0 Mb';
  public activeClients: number = 0;
  public topTalker: string = 'N/A';

  // --- Propriedades de Estilo Dinâmico (Tema) ---
  public sidebarStyleObject: object = {};
  public imageFilterStyle: string = 'none';

  // --- Gerenciamento de Inscrições (Subscriptions) ---
  private dataSubscription!: Subscription;
  private themeSubscription!: Subscription;

  // --- SEÇÃO 3: CICLO DE VIDA (LIFECYCLE HOOKS) ---

  /**
   * Construtor do componente, responsável pela Injeção de Dependência.
   * @param trafficService Serviço para obter dados de tráfego de rede.
   * @param themeService Serviço para gerenciar o estado do tema (claro/escuro).
   */
  constructor(
    private trafficService: TrafficDataService,
    private themeService: ThemeService
  ) { }

  /**
   * Método executado na inicialização do componente.
   * Inicia as inscrições nos serviços de dados e de tema.
   */
  ngOnInit(): void {
    this.subscribeToThemeChanges();
    this.subscribeToTrafficData();
  }

  /**
   * Método executado na destruição do componente.
   * Cancela todas as inscrições para evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }

  // --- SEÇÃO 4: LÓGICA PRIVADA DE ATUALIZAÇÃO E CÁLCULOS ---

  /** Inscreve-se no serviço de tema para receber atualizações de estilo. */
  private subscribeToThemeChanges(): void {
    this.themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      this.updateSidebarStyles(isLight);
    });
  }

  /** Inscreve-se no serviço de dados para receber e processar estatísticas de tráfego. */
  private subscribeToTrafficData(): void {
    this.dataSubscription = this.trafficService.trafficData$.subscribe(
      (data: ClientTrafficSummary[]) => {
        this.calculateStatistics(data);
      }
    );
  }

  /**
   * Atualiza os estilos da sidebar com base na seleção de tema.
   * @param isLightMode Booleano que indica se o modo claro está ativo.
   */
  private updateSidebarStyles(isLightMode: boolean): void {
    // NOTA: A linha 'background-image' está comentada conforme original.
    // const darkGradient = 'linear-gradient(rgba(25, 25, 27, 0.8), rgba(25, 25, 27, 0.8))';
    // const lightGradient = 'linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7))';

    this.sidebarStyleObject = {
      'width': '250px',
      'height': 'calc(100vh - 90px)',
      'background-color': isLightMode ? 'var(--color-primary)' : 'var(--color-dark)',
      // 'background-image': `${isLightMode ? lightGradient : darkGradient}, url('assets/images/sidebar_image.png')`,
      'background-repeat': 'no-repeat',
      'background-size': 'contain',
      'background-position': 'top'
    };

    // A lógica de filtro pode ser expandida aqui, ex: 'invert(1)' para o tema claro.
    this.imageFilterStyle = 'none';
  }

  /**
   * Calcula as estatísticas globais da rede com base nos dados recebidos.
   * @param data Array de clientes e seus respectivos dados de tráfego.
   */
  private calculateStatistics(data: ClientTrafficSummary[]): void {
    if (!data || data.length === 0) {
      this.totalDownload = '0 Mb';
      this.totalUpload = '0 Mb';
      this.activeClients = 0;
      this.topTalker = 'N/A';
      return;
    }

    // Calcula o total de download e upload somando os valores de todos os clientes.
    const totalBytesIn = data.reduce((sum, client) => sum + client.inbound, 0);
    const totalBytesOut = data.reduce((sum, client) => sum + client.outbound, 0);

    // Encontra o cliente com o maior tráfego combinado (inbound + outbound).
    const topTalkerClient = data.reduce((top, current) =>
      (current.inbound + current.outbound) > (top.inbound + top.outbound) ? current : top
    );

    this.totalDownload = this.formatBytes(totalBytesIn);
    this.totalUpload = this.formatBytes(totalBytesOut);
    this.activeClients = data.length;
    this.topTalker = topTalkerClient.ip;
  }

  // --- SEÇÃO 5: MÉTODOS PRIVADOS DE UTILIDADE ---

  /**
   * Formata um valor em bytes para uma unidade de medida mais legível (Kb, Mb, Gb...).
   * @param bytes O número de bytes a ser formatado.
   * @param decimals O número de casas decimais.
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb']; // Corrigido para "Bytes" no singular para o valor 0
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}