/**
 * =====================================================================================
 * COMPONENTE RAIZ DA APLICAÇÃO (APP ROOT)
 * Versão: 1.0.0
 *
 * Autor: Equipe Frontend
 * Descrição: Este é o componente raiz (root) de toda a aplicação Angular.
 * Ele serve como o container principal onde todos os outros componentes e
 * visualizações são renderizados. Sua tag <app-root> é o ponto de entrada
 * no arquivo index.html.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---

// Importações do Core e Roteamento do Angular
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Importações dos componentes principais da aplicação
import { HeaderComponent } from './components/header/header.component';
import { WelcomeComponent } from './components/welcome/welcome.component';

// --- SEÇÃO 1: METADADOS DO COMPONENTE ---
/**
 * O decorador @Component define esta classe como o componente raiz da aplicação.
 * - selector: 'app-root' -> O nome da tag HTML usada para instanciar este componente.
 * - standalone: true -> Indica que o componente gerencia suas próprias dependências.
 * - imports: Array com os módulos e componentes necessários para o funcionamento
 * do seu template, como o RouterOutlet para habilitar a navegação.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    WelcomeComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

// --- SEÇÃO 2: DEFINIÇÃO DA CLASSE DO COMPONENTE ---
/**
 * A classe AppComponent é o controlador principal da aplicação.
 * Propriedades definidas aqui podem ser usadas em seu template (app.component.html).
 */
export class AppComponent {
  /**
   * O título da aplicação.
   * Pode ser utilizado no template para fins de exibição ou metadados.
   */
  title = 'Netvision';
}