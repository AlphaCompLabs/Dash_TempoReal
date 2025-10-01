/*
# =====================================================================================
# SERVIDOR FRONTEND - TESTES DE UNIDADE PARA O COMPONENTE DE BOAS-VINDAS (WELCOME)
# Versão: 1.0.0
#
# Autor(es): Backend / QA
# Data: 2025-09-30
# Descrição: Este ficheiro contém os testes de unidade para o WelcomeComponent,
#            verificando a lógica de UI, a busca de dados da API, a subscrição
#            a serviços e o ciclo de vida do componente.
# =====================================================================================
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';

import { WelcomeComponent } from './welcome.component';
import { ThemeService } from '../../services/theme.service';

// Mock para o ThemeService para controlar o estado do tema nos testes
class MockThemeService {
  isLightMode$ = new BehaviorSubject<boolean>(false);
}

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let httpTestingController: HttpTestingController;
  let themeService: MockThemeService;
  const API_URL = 'http://localhost:8000/api/server-info';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Como o componente é standalone, ele é importado diretamente
      imports: [ WelcomeComponent, HttpClientTestingModule ],
      providers: [
        { provide: ThemeService, useClass: MockThemeService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    themeService = TestBed.inject(ThemeService) as unknown as MockThemeService;
  });

  afterEach(() => {
    // Garante que não há requisições HTTP pendentes entre os testes
    httpTestingController.verify();
  });

  it('deve ser criado', () => {
    // Dispara o ngOnInit, que faz a chamada HTTP
    fixture.detectChanges();
    // Responde à chamada para que o teste passe na verificação do afterEach
    httpTestingController.expectOne(API_URL).flush({ server_ip: '127.0.0.1' });
    expect(component).toBeTruthy();
  });

  it('deve ter o estado inicial correto antes do ngOnInit', () => {
    // Verifica o estado antes de qualquer detecção de alterações
    expect(component.isPanelOpen).toBe(true);
    expect(component.serverAddress).toBe('Carregando...');
    expect(component.isLightMode).toBe(false);

    // Dispara o ngOnInit e limpa a requisição para satisfazer o afterEach
    fixture.detectChanges();
    httpTestingController.expectOne(API_URL).flush({ server_ip: '127.0.0.1' });
  });

  it('deve buscar o IP do servidor e formatar o endereço com sucesso', () => {
    const mockServerIp = '192.168.1.100';
    const mockResponse = { server_ip: mockServerIp };

    // Dispara o ngOnInit
    fixture.detectChanges();

    const req = httpTestingController.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(component.serverAddress).toBe(`http://${mockServerIp}:8001`);
  });

  it('deve definir uma mensagem de erro se a busca pelo IP do servidor falhar', () => {
    fixture.detectChanges();

    const req = httpTestingController.expectOne(API_URL);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(component.serverAddress).toBe('Falha na conexão com a API');
  });

  it('deve reagir a mudanças de tema', () => {
    fixture.detectChanges(); // Dispara o ngOnInit
    httpTestingController.expectOne(API_URL).flush({ server_ip: '127.0.0.1' });
    
    expect(component.isLightMode).toBe(false); // Estado inicial

    // Simula a mudança para o modo claro
    themeService.isLightMode$.next(true);
    fixture.detectChanges();
    expect(component.isLightMode).toBe(true);

    // Simula a volta para o modo escuro
    themeService.isLightMode$.next(false);
    fixture.detectChanges();
    expect(component.isLightMode).toBe(false);
  });

  it('deve alternar a visibilidade do painel ao chamar togglePanel', () => {
    fixture.detectChanges();
    httpTestingController.expectOne(API_URL).flush({ server_ip: '127.0.0.1' });

    expect(component.isPanelOpen).toBe(true);
    component.togglePanel();
    expect(component.isPanelOpen).toBe(false);
    component.togglePanel();
    expect(component.isPanelOpen).toBe(true);
  });

  it('deve cancelar as subscrições ao ser destruído (ngOnDestroy)', () => {
    fixture.detectChanges();
    const req = httpTestingController.expectOne(API_URL);
    
    // Cria um spy no método `unsubscribe` da propriedade `subscriptions`
    const unsubscribeSpy = jest.spyOn((component as any).subscriptions, 'unsubscribe');
    
    // Chama o ngOnDestroy
    component.ngOnDestroy();
    
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    // Como a subscrição da chamada HTTP foi adicionada, ela deve ser cancelada
    expect(req.cancelled).toBe(true);
  });
});

