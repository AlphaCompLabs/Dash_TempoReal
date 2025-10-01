// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Serviço: ThemeService (theme.service.spec.ts)
// Versão: 2.0.0 (Corrigido para Jest)
//
// Autor: Equipe Frontend/QA
// Descrição: Suíte de testes convertida para usar a sintaxe do Jest,
//            removendo todas as referências ao Jasmine. Utiliza jest.spyOn e jest.fn
//            para simular dependências externas como localStorage e document.body.
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

// --- SEÇÃO 1: DESCRIÇÃO DA SUÍTE DE TESTES ---
describe('ThemeService', () => {
  let service: ThemeService;
  // Não usamos mais os tipos do Jasmine
  let setItemSpy: jest.SpyInstance;
  let bodyClassListSpy: {
    add: jest.Mock;
    remove: jest.Mock;
  };

  // --- SEÇÃO 2: CONFIGURAÇÃO DO AMBIENTE DE TESTE (beforeEach) ---
  beforeEach(() => {
    // 1. CRIAÇÃO DOS ESPIÕES (SPIES) COM JEST
    
    // Simula o localStorage em memória para não depender do real
    let store: { [key: string]: any } = {};
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key]);
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {store[key] = value;});
    jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      store = {};
    });

    //  Substitui `jasmine.createSpyObj` por um objeto com `jest.fn()`
    bodyClassListSpy = {
      add: jest.fn(),
      remove: jest.fn(),
    };
    
    // Define a propriedade 'classList' do document.body para retornar nosso espião
    Object.defineProperty(document.body, 'classList', {
      value: bodyClassListSpy,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    
    // Limpa o localStorage simulado antes de cada teste
    localStorage.clear();
  });

  // Adiciona um hook para limpar os mocks após cada teste
  afterEach(() => {
    jest.restoreAllMocks(); // Restaura todos os espiões para o estado original
  });

  // --- SEÇÃO 3: TESTES UNITÁRIOS ('it' blocks) ---

  it('should be created', () => {
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  it('should initialize in dark mode by default when no theme is saved', () => {
    service = TestBed.inject(ThemeService);
    let isLight = true; // Inicia com valor oposto para garantir que a subscrição funcione
    service.isLightMode$.subscribe(value => isLight = value);

    expect(isLight).toBe(false);
    expect(bodyClassListSpy.remove).toHaveBeenCalledWith('light');
    // Verifica se a função de salvar foi chamada, em vez de ler o valor
    expect(setItemSpy).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should initialize in light mode when "light" is saved in localStorage', () => {
    localStorage.setItem('theme', 'light');
    service = TestBed.inject(ThemeService);
    let isLight = false;
    service.isLightMode$.subscribe(value => isLight = value);
    
    expect(isLight).toBe(true);
    expect(bodyClassListSpy.add).toHaveBeenCalledWith('light');
  });

  describe('toggleTheme', () => {
    it('should switch from dark to light mode', () => {
      localStorage.setItem('theme', 'dark');
      service = TestBed.inject(ThemeService);
      
      service.toggleTheme();
      
      let isLight = false;
      service.isLightMode$.subscribe(value => isLight = value);

      expect(isLight).toBe(true);
      expect(bodyClassListSpy.add).toHaveBeenCalledWith('light');
      expect(setItemSpy).toHaveBeenCalledWith('theme', 'light');
    });

    it('should switch from light to dark mode', () => {
      localStorage.setItem('theme', 'light');
      service = TestBed.inject(ThemeService);
      
      service.toggleTheme();

      let isLight = true;
      service.isLightMode$.subscribe(value => isLight = value);

      expect(isLight).toBe(false);
      expect(bodyClassListSpy.remove).toHaveBeenCalledWith('light');
      expect(setItemSpy).toHaveBeenCalledWith('theme', 'dark');
    });
  });
});