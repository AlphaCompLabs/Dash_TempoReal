/**
 * =====================================================================================
 * COMPONENTE PRINCIPAL DA PÁGINA (HOME)
 * Versão: 1.0.0
 *
 * Autor: Equipe Frontend
 * Descrição: Este é um componente de layout ou "container". Sua única
 * responsabilidade é organizar e renderizar os principais blocos da
 * interface do usuário (Header, Sidebar, MainChart, Footer) em uma única
 * página coesa. Ele não possui lógica de negócios própria.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---

// Importações do Core do Angular
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importações dos componentes estruturais da aplicação
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { MainChartComponent } from '../../components/main-chart/main-chart.component';

// --- SEÇÃO 1: METADADOS DO COMPONENTE ---
/**
 * O decorador @Component define esta classe como um componente Angular standalone.
 * - standalone: true -> Indica que o componente gerencia suas próprias dependências.
 * - imports: Array com os módulos e outros componentes necessários para que o
 * template deste componente funcione corretamente.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    // NOTA: HeaderComponent está comentado e não será renderizado.
    // HeaderComponent,
    SidebarComponent,
    MainChartComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

// --- SEÇÃO 2: DEFINIÇÃO DA CLASSE DO COMPONENTE ---
/**
 * A classe HomeComponent atua como o controlador para a página principal.
 * Neste caso, a classe está vazia porque sua função é puramente estrutural,
 * sendo o seu template (`home.component.html`) o responsável por organizar
 * os componentes importados.
 */
export class HomeComponent {
  // Nenhuma lógica de componente é necessária aqui.
}