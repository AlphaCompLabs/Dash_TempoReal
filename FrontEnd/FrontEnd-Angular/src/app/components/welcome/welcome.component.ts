/**
 * =====================================================================================
 * COMPONENTE DE BOAS-VINDAS (WELCOME)
 * Versão: 2.2.1
 *
 * Autor: Equipe Frontend
 * Descrição: Este componente exibe uma tela inicial de boas-vindas com um painel
 * informativo. O painel busca e exibe dinamicamente o endereço do servidor
 * HTTP a partir da API e pode ser ocultado/exibido pelo usuário.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';

// --- SEÇÃO 1: INTERFACES E TIPOS DE DADOS ---
/**
 * Define a estrutura da resposta esperada do endpoint /api/server-info.
 * Garante a tipagem segura dos dados recebidos da API.
 */
interface ServerInfoResponse {
  server_ip: string;
}

// --- SEÇÃO 2: METADADOS DO COMPONENTE ---
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 3: PROPRIEDADES DE ESTADO E CONSTANTES ---

  /** Controla a visibilidade do painel lateral de informações. */
  public isPanelOpen: boolean = true;

  /** Armazena o endereço do servidor para exibição no painel. */
  public serverAddress: string = 'Carregando...';

  /** URL do endpoint da API para buscar informações do servidor. */
  private readonly API_URL = 'http://localhost:8000/api/server-info';

  /** Armazena a referência da inscrição HTTP para limpeza posterior. */
  private serverInfoSubscription!: Subscription;

  // --- SEÇÃO 4: CICLO DE VIDA (LIFECYCLE HOOKS) ---

  /**
   * Construtor do componente, usado para a Injeção de Dependência.
   * @param http Instância do serviço HttpClient para realizar requisições à API.
   */
  constructor(private http: HttpClient) { }

  /**
   * Método executado na inicialização do componente.
   * Dispara a busca pelos dados do servidor.
   */
  ngOnInit(): void {
    this.fetchServerAddress();
  }

  /**
   * Método executado na destruição do componente.
   * Cancela a inscrição HTTP para evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    this.serverInfoSubscription?.unsubscribe();
  }

  // --- SEÇÃO 5: LÓGICA PRIVADA DE DADOS ---

  /**
   * Realiza a chamada HTTP para a API, busca o IP do servidor e atualiza a propriedade 'serverAddress'.
   * Trata os casos de sucesso e erro da requisição.
   */
  private fetchServerAddress(): void {
    this.serverInfoSubscription = this.http.get<ServerInfoResponse>(this.API_URL).subscribe({
      /** Callback executado em caso de sucesso na requisição. */
      next: (response) => {
        const hostname = response.server_ip;
        this.serverAddress = `http://${hostname}:8001`;
      },
      /** Callback executado em caso de falha na requisição. */
      error: (err) => {
        console.error("Falha ao buscar o IP do servidor:", err);
        this.serverAddress = "Falha na conexão com a API";
      }
    });
  }

  // --- SEÇÃO 6: MÉTODOS PÚBLICOS (EVENT HANDLERS) ---

  /**
   * Alterna o estado de visibilidade do painel lateral.
   * Este método é chamado pelo evento de clique no template.
   */
  public togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }
}