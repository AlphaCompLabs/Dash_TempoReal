import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // BehaviorSubject guarda o estado atual (false = dark, true = light)
  // e notifica os "ouvintes" (componentes) sobre mudanças.
  private isLightMode = new BehaviorSubject<boolean>(false);
  
  // Expondo o estado como um Observable para que os componentes possam se inscrever
  public isLightMode$ = this.isLightMode.asObservable();

  constructor() {
    // Ao iniciar, verifica se há um tema salvo no navegador
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightMode.next(true);
      document.body.classList.add('light');
    }
  }

  toggleTheme(): void {
    // Inverte o estado atual
    const newMode = !this.isLightMode.value;
    this.isLightMode.next(newMode);

    // Atualiza a classe no body e salva a preferência
    if (newMode) {
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }
}