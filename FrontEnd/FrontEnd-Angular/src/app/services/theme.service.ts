/**
 * =====================================================================================
 * SERVIÇO DE GERENCIAMENTO DE TEMA (THEME SERVICE)
 * Versão: 1.1.0 (Refatorado com constantes e lógica centralizada)
 *
 * Autor: Equipe Frontend
 * Descrição: Este serviço gerencia o estado do tema da aplicação (claro/escuro).
 * Ele utiliza um BehaviorSubject para um gerenciamento de estado reativo,
 * permitindo que os componentes se inscrevam e reajam às mudanças de tema.
 * As preferências do usuário são salvas no localStorage.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// --- SEÇÃO 1: METADADOS DO SERVIÇO (@Injectable) ---
/**
 * O decorador @Injectable marca a classe como um serviço que pode ser injetado.
 * providedIn: 'root' faz com que o Angular crie uma única instância (singleton)
 * deste serviço, disponível para toda a aplicação.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  // --- SEÇÃO 2: DEFINIÇÃO DA CLASSE, CONSTANTES E PROPRIEDADES ---

  // --- Constantes para evitar "magic strings" ---
  private readonly THEME_STORAGE_KEY = 'theme';
  private readonly LIGHT_THEME_CLASS = 'light';
  private readonly LIGHT_THEME_VALUE = 'light';
  private readonly DARK_THEME_VALUE = 'dark';

  /**
   * BehaviorSubject que armazena o estado atual do tema.
   * Inicia com 'false' (dark mode) como padrão.
   * É privado para garantir que o estado só seja modificado através dos métodos do serviço.
   */
  private readonly isLightMode = new BehaviorSubject<boolean>(false);

  /**
   * Expõe o estado do tema como um Observable público (somente leitura).
   * Componentes podem se inscrever a 'isLightMode$' para reagir às mudanças
   * de tema de forma reativa.
   */
  public readonly isLightMode$ = this.isLightMode.asObservable();

  /**
   * O construtor é executado uma única vez quando o serviço é instanciado.
   * Sua função é carregar o tema salvo do localStorage, se existir.
   */
  constructor() {
    this.loadInitialTheme();
  }

  // --- SEÇÃO 3: MÉTODOS PÚBLICOS ---

  /**
   * Alterna o tema atual entre claro e escuro.
   * Este é o único método público que modifica o estado do tema.
   */
  public toggleTheme(): void {
    const newModeIsLight = !this.isLightMode.value;
    this.isLightMode.next(newModeIsLight);
    this.applyTheme(newModeIsLight);
  }

  // --- SEÇÃO 4: MÉTODOS PRIVADOS ---

  /**
   * Carrega o tema salvo no localStorage na inicialização do serviço.
   */
  private loadInitialTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
    const initialModeIsLight = savedTheme === this.LIGHT_THEME_VALUE;

    if (initialModeIsLight) {
      this.isLightMode.next(true);
    }
    // Aplica a classe ao body, mesmo que seja o tema escuro (para garantir consistência)
    this.applyTheme(initialModeIsLight);
  }

  /**
   * Centraliza a lógica de aplicar o tema.
   * Manipula a classe do `document.body` e salva a preferência no localStorage.
   * @param isLight Booleano que indica se o tema a ser aplicado é o claro.
   */
  private applyTheme(isLight: boolean): void {
    if (isLight) {
      document.body.classList.add(this.LIGHT_THEME_CLASS);
      localStorage.setItem(this.THEME_STORAGE_KEY, this.LIGHT_THEME_VALUE);
    } else {
      document.body.classList.remove(this.LIGHT_THEME_CLASS);
      localStorage.setItem(this.THEME_STORAGE_KEY, this.DARK_THEME_VALUE);
    }
  }
}