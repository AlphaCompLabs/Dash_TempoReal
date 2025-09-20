import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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
export class WelcomeComponent implements OnInit {
  
  // Controla a visibilidade do painel lateral (começa aberto)
  public isPanelOpen: boolean = true;
  
  // Armazena o endereço do servidor que será buscado na API
  public serverAddress: string = 'Carregando...';

  // Injetamos o HttpClient para fazer chamadas à API
  constructor(private http: HttpClient) { }

  // Quando o componente inicia, busca as informações do servidor
  ngOnInit(): void {
    // URL da sua API (ajuste se necessário)
    const apiUrl = 'http://localhost:8000/api/server-info';

    this.http.get<{server_ip: string}>(apiUrl).subscribe({
      next: (data) => {
        const hostname = data.server_ip;
        // Monta a URL completa para ser exibida no painel
        this.serverAddress = `http://${hostname}:8001`;
      },
      error: (err) => {
        console.error("Falha ao buscar IP do servidor:", err);
        this.serverAddress = "Falha na conexão com a API";
      }
    });
  }

  // Função para abrir/fechar o painel
  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }
}