// Importe OnInit, Component e AGORA o HttpClient
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Importe o HttpClient

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  public ftpAddress: string = 'Carregando...'; // Valor inicial
  public httpAddress: string = 'Carregando...';

  // Injetamos o HttpClient no construtor para poder usá-lo
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // A URL da sua API. Ajuste a porta se for diferente.
    const apiUrl = 'http://localhost:8000/api/server-info';

    // Faz a chamada HTTP para o backend
    this.http.get<{server_ip: string}>(apiUrl).subscribe({
      // Se a chamada for bem-sucedida
      next: (data) => {
        const hostname = data.server_ip;
        console.log("IP recebido da API:", hostname);
        
        this.ftpAddress = `ftp://${hostname}:2121`;
        this.httpAddress = `${hostname}:8001`;
      },
      // Se ocorrer um erro
      error: (err) => {
        console.error("Falha ao buscar IP do servidor:", err);
        this.ftpAddress = "Erro ao conectar";
        this.httpAddress = "Erro ao conectar";
      }
    });
  }
}