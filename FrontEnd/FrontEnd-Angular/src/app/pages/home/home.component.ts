/*
# =====================================================================================
# SERVIDOR FRONTEND - COMPONENTE DE PÁGINA (HOME)
# Versão: 1.0.1 (Padronização de Documentação e Estrutura)
#
# Autor(es): Equipe Frontend
# Data: 2025-09-30
# Descrição: Este é um componente de layout ("container") cuja única
#            responsabilidade é organizar e renderizar os principais blocos da
#            interface (Sidebar, MainChart, Footer) em uma página coesa.
#            Ele não possui lógica de negócios própria.
# =====================================================================================
*/

// --- SEÇÃO 1: IMPORTAÇÕES ---

// Core do Angular
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Componentes estruturais da aplicação
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { MainChartComponent } from '../../components/main-chart/main-chart.component';
// import { HeaderComponent } from '../../components/header/header.component';

// --- SEÇÃO 2: METADADOS DO COMPONENTE ---
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    // NOTA: O HeaderComponent está atualmente desativado nesta visualização.
    // Para ativá-lo, descomente a importação acima e a tag no array de imports.
    // HeaderComponent,
    SidebarComponent,
    MainChartComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

// --- SEÇÃO 3: DEFINIÇÃO DA CLASSE DO COMPONENTE ---
/**
 * Atua como o controlador para a página principal 'Home'.
 *
 * A classe do componente está vazia, pois sua função é puramente estrutural.
 * O template (`home.component.html`) é o responsável por organizar os
 * componentes importados no layout da página.
 */
export class HomeComponent {
  // Nenhuma lógica de TypeScript é necessária neste componente.
}