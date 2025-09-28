/**
 * =====================================================================================
 * COMPONENTE DE BOAS-VINDAS (WELCOME)
 * Versão: 2.2.2 (Com gerenciamento de tema para cores dinâmicas)
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service'; // Adicionado ThemeService

// --- SEÇÃO 1: INTERFACES E TIPOS DE DADOS ---
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
  public isPanelOpen: boolean = true;
  public serverAddress: string = 'Carregando...';
  private readonly API_URL = 'http://localhost:8000/api/server-info';
  private serverInfoSubscription!: Subscription;

  // --- Propriedades de Gerenciamento de Tema ---
  public isLightMode: boolean = false; // Estado atual do tema
  private themeSubscription!: Subscription; // Inscrição para o ThemeService

  // --- SEÇÃO 4: CICLO DE VIDA (LIFECYCLE HOOKS) ---

  constructor(
    private http: HttpClient,
    private themeService: ThemeService // Injeção do ThemeService
  ) { }

  ngOnInit(): void {
    this.fetchServerAddress();
    // Inscreve-se nas mudanças de tema para atualizar isLightMode
    this.themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      this.isLightMode = isLight;
    });
  }

  ngOnDestroy(): void {
    this.serverInfoSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe(); // Cancela a inscrição do tema
  }

  // --- SEÇÃO 5: LÓGICA PRIVADA DE DADOS ---

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

  // --- SEÇÃO 6: MÉTODOS PÚBLICOS (EVENT HANDLERS) ---

  public togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }
}