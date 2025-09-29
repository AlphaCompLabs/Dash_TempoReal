/*
 # =====================================================================================
 # SERVIDOR FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
 # Versão: 3.0.0 (Padronização do Código)
 # Autor(es): Equipe Frontend
 # Data: 2025-09-29
 # Descrição: Lógica do componente de rodapé (Footer). Responsável por buscar
 #            dinamicamente o endereço do servidor para exibir nos links de FTP e HTTP.
 # =====================================================================================
*/

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 1 - IMPORTAÇÕES
// -----------------------------------------------------------------------------------------
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 2 - INTERFACES
// -----------------------------------------------------------------------------------------
interface ServerInfoResponse {
  server_ip: string;
}

// -----------------------------------------------------------------------------------------
//                               SEÇÃO 3 - COMPONENTE
// -----------------------------------------------------------------------------------------
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 4 - PROPRIEDADES
  // -----------------------------------------------------------------------------------------
  public ftpAddress: string = 'Carregando...';
  public httpAddress: string = 'Carregando...';

  private readonly API_URL = 'http://localhost:8000/api/server-info';

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 5 - CONSTRUTOR
  // -----------------------------------------------------------------------------------------
  constructor(private http: HttpClient) { }

  // -----------------------------------------------------------------------------------------
  //                           SEÇÃO 6 - MÉTODOS DE CICLO DE VIDA
  // -----------------------------------------------------------------------------------------
  ngOnInit(): void {
    this.fetchServerAddress();
  }

  // -----------------------------------------------------------------------------------------
  //                             SEÇÃO 7 - MÉTODOS PRIVADOS
  // -----------------------------------------------------------------------------------------
  private fetchServerAddress(): void {
    this.http.get<ServerInfoResponse>(this.API_URL).subscribe({
      next: (response) => {
        const hostname = response.server_ip;
        console.log("IP do servidor recebido com sucesso:", hostname);

        this.ftpAddress = `ftp://${hostname}:2121`;
        this.httpAddress = `${hostname}:8001`;
      },
      error: (err) => {
        console.error("Falha ao buscar o IP do servidor. Verifique se o backend está em execução.", err);
        this.ftpAddress = "Erro de conexão";
        this.httpAddress = "Erro de conexão";
      }
    });
  }
}
