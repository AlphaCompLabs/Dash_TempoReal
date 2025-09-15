import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  // A propriedade que o seu HTML precisa de encontrar
  public isDarkMode: boolean = false;

  constructor() { }

  ngOnInit(): void {
    // Ao iniciar o componente, verifica se já há um tema guardado no navegador
    // para manter a preferência do utilizador entre as visitas.
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark');
    }
  }

  /**
   * Esta função é chamada quando o botão de tema é clicado.
   */
  public toggleTheme(): void {
    // 1. Inverte o estado atual
    this.isDarkMode = !this.isDarkMode;

    // 2. Adiciona ou remove a classe 'dark' do elemento <body> do site
    if (this.isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Salva a preferência
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Salva a preferência
    }
  }
}
