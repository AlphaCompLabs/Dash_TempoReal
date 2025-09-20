import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service.ts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  // A variável local agora apenas reflete o estado do serviço
  isLightMode = false;

  // 2. Injete o serviço no construtor
  constructor(private themeService: ThemeService) {
    // Ouve as mudanças de tema para atualizar o ícone (sol/lua)
    this.themeService.isLightMode$.subscribe(isLight => {
      this.isLightMode = isLight;
    });
  }

  // 3. O botão agora chama o método do serviço
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}