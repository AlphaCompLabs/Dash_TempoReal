/*
 # =====================================================================================
 # SERVIDOR FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
 # Versão: 2.0.0 (Padronização do Código)
 # Autor(es): Equipe Frontend
 # Data: 2025-09-29
 # Descrição: Lógica do componente de cabeçalho (Header). Responsável por
 #            exibir o logo e o botão de troca de tema, delegando a lógica
 #            para o ThemeService.
 # =====================================================================================
*/

// -----------------------------------------------------------------------------------------
//                                SEÇÃO 1 - IMPORTAÇÕES
// -----------------------------------------------------------------------------------------
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

// -----------------------------------------------------------------------------------------
//                               SEÇÃO 2 - COMPONENTE
// -----------------------------------------------------------------------------------------
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 3 - PROPRIEDADES
  // -----------------------------------------------------------------------------------------
  public isLightMode = false;
  private themeSubscription!: Subscription;

  // -----------------------------------------------------------------------------------------
  //                               SEÇÃO 4 - CONSTRUTOR
  // -----------------------------------------------------------------------------------------
  constructor(private themeService: ThemeService) { }

  // -----------------------------------------------------------------------------------------
  //                           SEÇÃO 5 - MÉTODOS DE CICLO DE VIDA
  // -----------------------------------------------------------------------------------------
  ngOnInit(): void {
    this.themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      this.isLightMode = isLight;
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // -----------------------------------------------------------------------------------------
  //                              SEÇÃO 6 - MÉTODOS PÚBLICOS
  // -----------------------------------------------------------------------------------------
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
