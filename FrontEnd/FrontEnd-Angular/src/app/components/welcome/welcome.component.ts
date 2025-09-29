/*
 # =====================================================================================
 # SERVIDOR FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
 # Versão: 3.0.0 (Padronização do Código)
 # Autor(es): Equipe Frontend
 # Data: 2025-09-29
 # Descrição: Lógica do componente de boas-vindas (Welcome). Gerencia a
 #            exibição e o recolhimento do painel lateral informativo, busca o
 #            endereço do servidor e reage às mudanças de tema da aplicação.
 # =====================================================================================
*/

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 1 - IMPORTAÇÕES
// -----------------------------------------------------------------------------------------
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

// -----------------------------------------------------------------------------------------
//                               SEÇÃO 2 - INTERFACES
// -----------------------------------------------------------------------------------------
interface ServerInfoResponse {
  server_ip: string;
}

// -----------------------------------------------------------------------------------------
//                               SEÇÃO 3 - COMPONENTE
// -----------------------------------------------------------------------------------------
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

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 4 - PROPRIEDADES
  // -----------------------------------------------------------------------------------------
  public isPanelOpen: boolean = true;
  public serverAddress: string = 'Carregando...';
  public isLightMode: boolean = false;

  private readonly API_URL = 'http://localhost:8000/api/server-info';
  private serverInfoSubscription!: Subscription;
  private themeSubscription!: Subscription;

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 5 - CONSTRUTOR
  // -----------------------------------------------------------------------------------------
  constructor(
    private http: HttpClient,
    private themeService: ThemeService
  ) { }

  // -----------------------------------------------------------------------------------------
  //                           SEÇÃO 6 - MÉTODOS DE CICLO DE VIDA
  // -----------------------------------------------------------------------------------------

  /**
   * Executado na inicialização do componente.
   * Inicia a busca pelo endereço do servidor e se inscreve nas alterações de tema.
   */
  ngOnInit(): void {
    this.fetchServerAddress();
    this.themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      this.isLightMode = isLight;
    });
  }

  /**
   * Executado na destruição do componente.
   * Cancela as inscrições em Observables para evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    this.serverInfoSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }

  // -----------------------------------------------------------------------------------------
  //                              SEÇÃO 7 - MÉTODOS PÚBLICOS
  // -----------------------------------------------------------------------------------------

  /**
   * Alterna a visibilidade do painel lateral, invertendo o estado da propriedade `isPanelOpen`.
   * Este método é chamado pelo evento de clique no botão do template.
   */
  public togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }

  // -----------------------------------------------------------------------------------------
  //                             SEÇÃO 8 - MÉTODOS PRIVADOS
  // -----------------------------------------------------------------------------------------

  /**
   * Realiza uma requisição HTTP GET para a API backend para obter o endereço IP do servidor.
   * Atualiza a propriedade `serverAddress` com o resultado ou com uma mensagem de erro.
   */
  private fetchServerAddress(): void {
    this.serverInfoSubscription = this.http.get<ServerInfoResponse>(this.API_URL).subscribe({
      next: (response) => {
        const hostname = response.server_ip;
        this.serverAddress = `http://${hostname}:8001`;
      },
      error: (err) => {
        console.error("Falha ao buscar o IP do servidor:", err);
        this.serverAddress = "Falha na conexão com a API";
      }
    });
  }
}
