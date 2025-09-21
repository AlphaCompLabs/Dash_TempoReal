// =====================================================================================
// CLIENTE FRONTEND - DASHBOARD DE ANÁLISE DE TRÁFEGO
// Componente: HeaderComponent (header.component.ts)
// Versão: 1.0.0
//
// Autor: Equipe Frontend
// Descrição: Este componente renderiza o cabeçalho da aplicação. Ele exibe o
//            título e contém o botão que permite ao usuário alternar entre o
//            tema claro (light) e escuro (dark), delegando a lógica para o ThemeService.
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { Component, OnInit, OnDestroy } from '@angular/core'; // Adicionado OnDestroy para o ciclo de vida
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs'; // Importado para tipar a inscrição do Observable
import { ThemeService } from '../../services/theme.service'; // OBS: A extensão .ts não é usada em imports

// --- SEÇÃO 1: METADADOS DO COMPONENTE (@Component) ---
/**
 * O decorador @Component define este como um componente Angular standalone.
 * - selector: como usar este componente em outro HTML (<app-header>).
 * - standalone: indica que o componente gerencia suas próprias dependências.
 * - imports: dependências necessárias para o template (ex: ngIf, ngFor).
 * - templateUrl/styleUrls: arquivos de template e estilo associados.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

// --- SEÇÃO 2: DEFINIÇÃO DA CLASSE E PROPRIEDADES ---
export class HeaderComponent implements OnInit, OnDestroy {

  /**
   * Controla qual ícone (sol/lua) deve ser exibido no template.
   * Seu valor é um reflexo direto do estado atual mantido no ThemeService.
   */
  public isLightMode = false;

  /**
   * Armazena a referência da inscrição ao Observable 'isLightMode$'.
   * É crucial para que possamos nos "desinscrever" (unsubscribe) quando o
   * componente for destruído, evitando vazamentos de memória.
   */
  private themeSubscription!: Subscription;

  /**
   * O construtor é usado primariamente para a injeção de dependências.
   * @param themeService - Instância do serviço que gerencia o estado do tema.
   */
  constructor(private themeService: ThemeService) { }

  // --- SEÇÃO 3: MÉTODOS DO CICLO DE VIDA (LIFECYCLE HOOKS) ---

  /**
   * ngOnInit é executado uma vez quando o componente é inicializado.
   * É o local ideal para iniciar a escuta de Observables que viverão
   * durante todo o ciclo de vida do componente.
   */
  ngOnInit(): void {
    this.themeSubscription = this.themeService.isLightMode$.subscribe(isLight => {
      this.isLightMode = isLight;
    });
  }

  /**
   * ngOnDestroy é executado imediatamente antes de o componente ser destruído.
   * É fundamental para "limpar" recursos, como inscrições em Observables,
   * prevenindo vazamentos de memória na aplicação.
   */
  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // --- SEÇÃO 4: MÉTODOS PÚBLICOS (ACIONADOS PELO TEMPLATE) ---

  /**
   * Alterna o tema da aplicação. Este método é chamado pelo evento de clique
   * no botão do template. Ele não contém a lógica, apenas a delega
   * para o método correspondente no serviço centralizado (ThemeService).
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}