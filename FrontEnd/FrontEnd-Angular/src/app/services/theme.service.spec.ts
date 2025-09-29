// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Serviço: ThemeService (theme.service.spec.ts)
// Versão: 1.0.0
//
// Autor: Equipe Frontend/QA
// Descrição: Esta suíte de testes valida o comportamento do ThemeService.
//            Ela utiliza "spies" para simular o localStorage e o document.body,
//            garantindo que o serviço carrega o tema inicial corretamente,
//            alterna entre os modos claro/escuro e persiste o estado.
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

// --- SEÇÃO 1: DESCRIÇÃO DA SUÍTE DE TESTES ---
describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageSpy: jasmine.SpyObj<Storage>;
  let bodyClassListSpy: jasmine.SpyObj<DOMTokenList>;

  // --- SEÇÃO 2: CONFIGURAÇÃO DO AMBIENTE DE TESTE (beforeEach) ---
  beforeEach(() => {
    // 1. CRIAÇÃO DOS SPIES
    // Criamos um objeto falso que imita o localStorage
    const getItemSpy = spyOn(localStorage, 'getItem').and.callThrough();
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    
    // Criamos um objeto falso que imita o classList do body
    bodyClassListSpy = jasmine.createSpyObj('DOMTokenList', ['add', 'remove']);
    // Fazemos com que `document.body.classList` retorne nosso spy
    Object.defineProperty(document.body, 'classList', {
      value: bodyClassListSpy,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    
    // Limpa o localStorage antes de cada teste para garantir isolamento
    localStorage.clear();
  });

  // --- SEÇÃO 3: TESTES UNITÁRIOS ('it' blocks) ---

  it('should be created', () => {
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  it('should initialize in dark mode by default when no theme is saved', () => {
    // 1. AÇÃO: Instancia o serviço (o construtor será chamado)
    service = TestBed.inject(ThemeService);
    let isLight = false;
    service.isLightMode$.subscribe(value => isLight = value);

    // 2. VERIFICAÇÃO:
    expect(isLight).toBe(false);
    expect(document.body.classList.remove).toHaveBeenCalledWith('light');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should initialize in light mode when "light" is saved in localStorage', () => {
    // 1. PREPARAÇÃO: Simula o localStorage com o tema salvo
    localStorage.setItem('theme', 'light');

    // 2. AÇÃO: Instancia o serviço
    service = TestBed.inject(ThemeService);
    let isLight = false;
    service.isLightMode$.subscribe(value => isLight = value);
    
    // 3. VERIFICAÇÃO:
    expect(isLight).toBe(true);
    expect(document.body.classList.add).toHaveBeenCalledWith('light');
  });

  describe('toggleTheme', () => {
    it('should switch from dark to light mode', () => {
      // 1. PREPARAÇÃO: Garante que o serviço inicia em modo escuro
      localStorage.setItem('theme', 'dark');
      service = TestBed.inject(ThemeService);
      let isLight = false;
      service.isLightMode$.subscribe(value => isLight = value);
      
      // 2. AÇÃO: Chama o método para alternar o tema
      service.toggleTheme();

      // 3. VERIFICAÇÃO:
      expect(isLight).toBe(true);
      expect(document.body.classList.add).toHaveBeenCalledWith('light');
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should switch from light to dark mode', () => {
      // 1. PREPARAÇÃO: Garante que o serviço inicia em modo claro
      localStorage.setItem('theme', 'light');
      service = TestBed.inject(ThemeService);
      let isLight = true;
      service.isLightMode$.subscribe(value => isLight = value);

      // 2. AÇÃO: Chama o método para alternar o tema
      service.toggleTheme();

      // 3. VERIFICAÇÃO:
      expect(isLight).toBe(false);
      expect(document.body.classList.remove).toHaveBeenCalledWith('light');
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });
});
