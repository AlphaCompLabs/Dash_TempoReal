// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-welcome',
//   imports: [],
//   templateUrl: './welcome.component.html',
//   styleUrl: './welcome.component.css'
// })
// export class WelcomeComponent {

// }

import { Component } from '@angular/core';
// ✅ CORREÇÃO: Importamos 'NgClass' do CommonModule para que o [ngClass] funcione.
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  // ✅ CORREÇÃO: Adicionamos NgClass na lista de imports.
  imports: [CommonModule, NgClass],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  
  // ✅ CORREÇÃO: Adicionamos a propriedade 'isPanelOpen' que estava faltando.
  // O painel começa aberto por padrão.
  public isPanelOpen: boolean = true;

  /**
   * ✅ CORREÇÃO: Adicionamos a função 'togglePanel' que é chamada pelo botão no HTML.
   * Alterna o estado do painel entre aberto e fechado.
   */
  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }
}