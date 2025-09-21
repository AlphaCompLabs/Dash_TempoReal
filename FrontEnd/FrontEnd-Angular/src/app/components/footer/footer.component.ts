// =====================================================================================
// CLIENTE FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
// Componente: FooterComponent (footer.component.ts)
// Versão: 3.0.0
//
// Autor: Equipe Frontend
// Descrição: Este componente renderiza o rodapé da aplicação. Sua principal
//            responsabilidade é buscar dinamicamente o endereço IP do servidor
//            backend para exibir os links de acesso aos serviços (FTP e HTTP).
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES ---
// Importações essenciais do framework Angular.
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Módulo para realizar requisições HTTP.

// --- SEÇÃO 1: INTERFACES E TIPOS DE DADOS ---
// Define a estrutura esperada da resposta da API para garantir a tipagem.
interface ServerInfoResponse {
  server_ip: string;
}

// --- SEÇÃO 2: METADADOS DO COMPONENTE (@Component) ---
/**
 * O decorador @Component associa metadados ao componente FooterComponent,
 * definindo seu seletor CSS, template HTML e arquivo de estilos.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})

// --- SEÇÃO 3: DEFINIÇÃO DA CLASSE E PROPRIEDADES ---
export class FooterComponent implements OnInit {

  // Propriedades públicas que serão exibidas no template HTML.
  // Seus valores iniciais indicam um estado de carregamento para o usuário.
  public ftpAddress: string = 'Carregando...';
  public httpAddress: string = 'Carregando...';

  /**
   * Constante privada para armazenar a URL do endpoint da API.
   * Centralizar a URL aqui facilita a manutenção caso ela mude no futuro.
   */
  private readonly API_URL = 'http://localhost:8000/api/server-info';

  /**
   * Construtor do componente, responsável pela Injeção de Dependência.
   * @param http - Instância do serviço HttpClient, injetada pelo Angular para
   * permitir a comunicação com o backend via HTTP.
   */
  constructor(private http: HttpClient) { }

  // --- SEÇÃO 4: LÓGICA DO COMPONENTE (CICLO DE VIDA) ---

  /**
   * Método do ciclo de vida do Angular, executado uma vez após a inicialização
   * do componente. É o local ideal para buscar dados iniciais.
   */
  ngOnInit(): void {
    this.fetchServerAddress();
  }

  /**
   * Realiza a chamada HTTP GET para o backend para obter o IP do servidor.
   * O método encapsula a lógica de requisição e atualização das propriedades.
   */
  private fetchServerAddress(): void {
    this.http.get<ServerInfoResponse>(this.API_URL).subscribe({
      /**
       * Callback 'next': executado quando a requisição é bem-sucedida.
       * @param response - O objeto de dados recebido da API, tipado com ServerInfoResponse.
       */
      next: (response) => {
        const hostname = response.server_ip;
        console.log("IP do servidor recebido com sucesso:", hostname);

        // Atualiza as propriedades com os endereços formatados para exibição.
        this.ftpAddress = `ftp://${hostname}:2121`;
        this.httpAddress = `${hostname}:8001`;
      },

      /**
       * Callback 'error': executado quando a requisição falha (ex: servidor offline).
       * @param err - O objeto de erro retornado pela requisição.
       */
      error: (err) => {
        console.error("Falha ao buscar o IP do servidor. Verifique se o backend está em execução.", err);
        
        // Informa o usuário sobre o erro diretamente na interface.
        this.ftpAddress = "Erro de conexão";
        this.httpAddress = "Erro de conexão";
      }
    });
  }
}