/*
# =====================================================================================
# SERVIDOR FRONTEND - COMPONENTE DE BOAS-VINDAS (WELCOME)
# Versão: 3.0.1 (Padronização Segura e Organização de Código)
#
# Autor(es): Equipe Frontend 
# Data: 2025-09-30
# Descrição: Lógica do componente de boas-vindas (Welcome). Gerencia a
#            exibição do painel informativo, busca o endereço do servidor
#            e reage às mudanças de tema da aplicação.
# =====================================================================================
*/

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

// --- SEÇÃO 2: TIPOS E INTERFACES ---

/**
 * Define a estrutura da resposta da API que fornece informações do servidor.
 */
interface ServerInfo {
  server_ip: string;
}

// --- SEÇÃO 3: METADADOS DO COMPONENTE ---
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
/**
 * Componente Welcome, responsável pela tela inicial e painel de ajuda.
 */
export class WelcomeComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 4: PROPRIEDADES E ESTADO DA CLASSE ---

  // --- Constantes Internas ---
  private readonly API_URL = 'http://localhost:8000/api/server-info';
  private readonly SERVER_PORT = 8001;
  private readonly LOADING_MESSAGE = 'Carregando...';
  private readonly API_ERROR_MESSAGE = 'Falha na conexão com a API';

  // --- Estado da UI (Dados exibidos no template) ---
  public isPanelOpen: boolean = true;
  public serverAddress: string = this.LOADING_MESSAGE;
  public isLightMode: boolean = false;

  // --- Gerenciamento de Inscrições (Subscriptions) ---
  private subscriptions = new Subscription();


  // --- SEÇÃO 5: CONSTRUTOR E MÉTODOS DE CICLO DE VIDA ---

  /**
   * @param http Serviço do Angular para realizar requisições HTTP.
   * @param themeService Serviço que gerencia o estado do tema (claro/escuro).
   */
  constructor(
    private http: HttpClient,
    private themeService: ThemeService
  ) { }

  /**
   * Método de ciclo de vida do Angular, executado na inicialização do componente.
   * Inicia a busca pelo endereço do servidor e se inscreve nas alterações de tema.
   */
  ngOnInit(): void {
    this.fetchServerAddress();

    const themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      this.isLightMode = isLight;
    });
    this.subscriptions.add(themeSubscription);
  }

  /**
   * Método de ciclo de vida do Angular, executado na destruição do componente.
   * Garante que todas as inscrições (subscriptions) sejam canceladas para evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  // --- SEÇÃO 6: MÉTODOS PÚBLICOS (EVENT HANDLERS) ---

  /**
   * Alterna a visibilidade do painel lateral, invertendo o estado da propriedade `isPanelOpen`.
   * Este método é chamado por um evento de clique no template.
   */
  public togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }


  // --- SEÇÃO 7: MÉTODOS PRIVADOS ---

  /**
   * Realiza uma requisição HTTP GET para a API para obter o endereço IP do servidor.
   * Atualiza a propriedade `serverAddress` com o resultado ou com uma mensagem de erro.
   */
  private fetchServerAddress(): void {
    const serverInfoSubscription = this.http.get<ServerInfo>(this.API_URL).subscribe({
      next: (response) => {
        const hostname = response.server_ip;
        this.serverAddress = `http://${hostname}:${this.SERVER_PORT}`;
      },
      error: (err) => {
        console.error("Falha ao buscar o IP do servidor:", err);
        this.serverAddress = this.API_ERROR_MESSAGE;
      }
    });
    // Adiciona a inscrição ao gerenciador. Como é uma chamada HTTP, ela se completa
    // sozinha, mas adicionar aqui é uma boa prática para consistência.
    this.subscriptions.add(serverInfoSubscription);
  }
}