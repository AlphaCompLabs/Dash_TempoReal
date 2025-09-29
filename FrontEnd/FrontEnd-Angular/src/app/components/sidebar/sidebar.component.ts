// =====================================================================================
// COMPONENTE ANGULAR - SIDEBAR DE ESTATÍSTICAS
// Versão: 2.1.0 (Estrutura e documentação aprimoradas)
//
// Autor: Equipe Frontend
// Descrição: Este componente renderiza a barra lateral que exibe as estatísticas
//            de tráfego da rede. Opera em dois modos distintos:
//            1. MODO GERAL: Mostra os dados agregados de todos os clientes ativos.
//            2. MODO DE FOCO: Ativado por um "drill down", exibe dados detalhados
//               de um único cliente selecionado.
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES E DEPENDÊNCIAS ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { TrafficDataService } from '../../services/traffic-data';
import { ThemeService } from '../../services/theme.service';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

// --- SEÇÃO 1: METADADOS DO COMPONENTE (@Component) ---
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 2: PROPRIEDADES E ESTADO DO COMPONENTE ---

  // 2.1. Estado Principal (Dados exibidos na UI)
  public totalDownload: string = '0 Mb';
  public totalUpload: string = '0 Mb';
  public activeClients: number = 0;
  public topTalker: string = 'N/A';
  public topProtocol: string = 'N/A';
  public isDrillDownMode: boolean = false;

  // 2.2. Configurações do Gráfico SVG (Donut Chart)
  public readonly radius: number = 54; // Raio do círculo do gráfico. `readonly` pois é uma constante.
  public readonly circumference: number = this.radius * 2 * Math.PI;
  public downloadProgress: number = 0;
  public uploadProgress: number = 0;
  public downloadStrokeOffset: number = this.circumference;
  public uploadStrokeOffset: number = this.circumference;
  public downloadFontSize: number = 30; // Ajustado dinamicamente para caber no gráfico
  public uploadFontSize: number = 30;   // Ajustado dinamicamente para caber no gráfico

  // 2.3. Estilos Dinâmicos
  public sidebarStyleObject: object = {};

  // 2.4. Gerenciamento Interno
  private masterSubscription!: Subscription;

  // --- SEÇÃO 3: CONSTRUTOR E CICLO DE VIDA (LIFECYCLE HOOKS) ---

  constructor(
    private trafficService: TrafficDataService,
    private themeService: ThemeService
  ) { }

  /**
   * Hook executado na inicialização do componente.
   * Ideal para inicializar lógicas complexas e subscriptions.
   */
  ngOnInit(): void {
    this.initializeMainDataSubscription();
  }

  /**
   * Hook executado na destruição do componente.
   * Essencial para limpar subscriptions e evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    this.masterSubscription?.unsubscribe();
  }

  // --- SEÇÃO 4: ORQUESTRADOR PRINCIPAL DE DADOS ---

  /**
   * Centraliza e gerencia todas as fontes de dados reativas (`Observables`).
   * Utiliza `combineLatest` para garantir que o componente reaja a qualquer
   * mudança de estado (dados de tráfego, modo de drill down, tema) de forma síncrona.
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

      // Roteia o fluxo de dados para o processador correto com base no modo atual
      if (isDrillDown && selectedClient) {
        // MODO DE FOCO: Exibe dados de um cliente específico.
        const isClientStillConnected = allClients.some(client => client.ip === selectedClient.ip);
        this.processClientSpecificData(selectedClient, isClientStillConnected);
      } else {
        // MODO GERAL: Exibe dados agregados de toda a rede.
        this.processGlobalData(allClients);
      }
    });
  }

  // --- SEÇÃO 5: PROCESSADORES DE DADOS (MODO GERAL VS. FOCO) ---

  /**
   * Processa e exibe dados para um único cliente selecionado (Modo de Foco).
   * @param client O cliente cujos dados serão exibidos.
   * @param isConnected Flag que indica se o cliente ainda está enviando dados.
   */
  private processClientSpecificData(client: ClientTrafficSummary, isConnected: boolean): void {
    if (!isConnected) {
        // Se o cliente foi desconectado, reseta os contadores para evitar exibir dados obsoletos.
        this.resetToDefaults();
        // Mantém o IP no campo "Top Talker" para que o usuário saiba de quem eram os dados.
        this.topTalker = client.ip;
        return;
    }

    this.totalDownload = this.formatBytes(client.inbound);
    this.totalUpload = this.formatBytes(client.outbound);
    this.activeClients = 1; // Em modo de foco, há apenas 1 cliente "ativo" na visão.
    this.topTalker = client.ip;

    this.calculateProportionalProgress(client.inbound, client.outbound);

    // Busca os protocolos específicos deste cliente para exibir o "Top Protocol".
    // ATENÇÃO: Uma subscrição aninhada pode ser um anti-padrão. Para lógicas mais
    // complexas, considere refatorar usando operadores RxJS como `switchMap` no orquestrador principal.
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

    // Encontra o cliente com maior tráfego total (inbound + outbound)
    const topTalkerClient = allClients.reduce((top, current) =>
      (current.inbound + current.outbound) > (top.inbound + top.outbound) ? current : top
    );

    this.totalDownload = this.formatBytes(totalBytesIn);
    this.totalUpload = this.formatBytes(totalBytesOut);
    this.activeClients = allClients.length;
    this.topTalker = topTalkerClient.ip;
    this.topProtocol = 'N/A'; // Top Protocol é irrelevante no modo geral.

    this.calculateProportionalProgress(totalBytesIn, totalBytesOut);
  }

  // --- SEÇÃO 6: MÉTODOS UTILITÁRIOS (CÁLCULO E FORMATAÇÃO) ---

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

    // Calcula o "offset" do traço do SVG para representar a porcentagem
    this.downloadStrokeOffset = this.circumference - (this.downloadProgress / 100) * this.circumference;
    this.uploadStrokeOffset = this.circumference - (this.uploadProgress / 100) * this.circumference;

    // Lógica de UI: Reduz o tamanho da fonte se o texto for muito longo para caber no gráfico.
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
    // `reduce` é uma forma eficiente de encontrar o maior valor em um array.
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

  // --- SEÇÃO 7: GERENCIAMENTO DE ESTILOS DINÂMICOS ---

  /**
   * Atualiza o objeto de estilo da sidebar com base no tema (claro/escuro).
   * O objeto é vinculado diretamente ao `[ngStyle]` no template.
   * @param isLightMode Booleano que indica se o modo claro está ativo.
   */
  private updateSidebarStyles(isLightMode: boolean): void {
    // Define um objeto base com estilos comuns para evitar repetição.
    const baseStyles = {
      'width': '250px',
      'height': 'calc(100vh - 90px)',
      'background-repeat': 'no-repeat',
      'background-size': 'contain',
      'background-position': 'center top'
    };

    if (isLightMode) {
      this.sidebarStyleObject = {
        ...baseStyles, // Espalha os estilos base
        'background-color': '#d4d4d4',
        'background-image': `linear-gradient(rgba(212, 212, 212, 0.5), rgba(212, 212, 212, 0.5)), url('assets/images/sidebar_image_white.svg')`
      };
    } else {
      this.sidebarStyleObject = {
        ...baseStyles, // Espalha os estilos base
        'background-color': "#191919",
        'background-image': `linear-gradient(rgba(25, 25, 25, 0.85), rgba(25, 25, 25, 0.85)), url('assets/images/sidebar_image.png')`
      };
    }
  }
}