/*
# =====================================================================================
# SERVIDOR FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
# Versão: 3.0.1 (Padronização Segura de Código)
#
# Autor(es): Equipe Frontend 
# Data: 2025-09-30
# Descrição: Lógica do componente de rodapé (Footer). Responsável por buscar
#            dinamicamente o endereço do servidor para exibir nos links de FTP e HTTP.
# =====================================================================================
*/


// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


// --- SEÇÃO 2: TIPOS E INTERFACES ---

/**
 * Define a estrutura de dados esperada da resposta da API de informações do servidor.
 */
interface ServerInfo {
  server_ip: string;
}


// --- SEÇÃO 3: METADADOS DO COMPONENTE (@Component) ---
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
/**
 * Componente Footer que busca e exibe dinamicamente os endereços do servidor.
 */
export class FooterComponent implements OnInit {

  // --- SEÇÃO 4: PROPRIEDADES DA CLASSE ---

  /**
   * Endereço FTP completo, exibido no template. Inicia com um estado de "carregando".
   * @public
   */
  public ftpAddress: string = 'Carregando...';

  /**
   * Endereço HTTP completo, exibido no template. Inicia com um estado de "carregando".
   * @public
   */
  public httpAddress: string = 'Carregando...';

  /** URL da API para obter as informações do servidor. */
  private readonly API_URL = 'http://localhost:8000/api/server-info';

  /** Porta utilizada para o serviço FTP. */
  private readonly FTP_PORT = 2121;

  /** Porta utilizada para o serviço HTTP secundário. */
  private readonly HTTP_PORT = 8001;


  // --- SEÇÃO 5: CONSTRUTOR E INJEÇÃO DE DEPENDÊNCIAS ---

  /**
   * Inicializa o componente injetando o serviço HttpClient do Angular.
   * @param http Serviço para realizar requisições HTTP.
   */
  constructor(private http: HttpClient) { }


  // --- SEÇÃO 6: MÉTODOS DO CICLO DE VIDA (LIFECYCLE HOOKS) ---

  /**
   * Método executado quando o componente é inicializado.
   * Dispara a chamada para buscar o endereço do servidor.
   */
  ngOnInit(): void {
    this.fetchServerAddress();
  }


  // --- SEÇÃO 7: MÉTODOS PRIVADOS ---

  /**
   * Executa a requisição GET para a API, tratando as respostas de sucesso e erro.
   * Nota: Não é necessário fazer "unsubscribe" manualmente, pois as chamadas
   * do HttpClient do Angular são finitas e completam-se sozinhas após a resposta.
   * @private
   */
  private fetchServerAddress(): void {
    this.http.get<ServerInfo>(this.API_URL).subscribe({
      next: (response) => {
        const hostname = response.server_ip;
        console.info("IP do servidor recebido com sucesso:", hostname); // Trocado para console.info

        this.ftpAddress = `ftp://${hostname}:${this.FTP_PORT}`;
        this.httpAddress = `http://${hostname}:${this.HTTP_PORT}`;
      },
      error: (err) => {
        console.error("Falha ao buscar o IP do servidor. Verifique se o backend está em execução.", err);
        this.ftpAddress = "Erro de conexão";
        this.httpAddress = "Erro de conexão";
      }
    });
  }
}