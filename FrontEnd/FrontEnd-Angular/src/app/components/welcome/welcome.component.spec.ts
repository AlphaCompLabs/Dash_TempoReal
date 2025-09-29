// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Componente: WelcomeComponent (welcome.component.spec.ts)
// Versão: 3.0.0 (Solução Definitiva com overrideComponent)
//
// Autor: Equipe Frontend/QA
// Descrição: Corrigido o conflito entre HttpClientModule (do componente standalone)
//            e HttpClientTestingModule usando TestBed.overrideComponent para remover
//            o módulo conflitante durante os testes.
// =====================================================================================

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject, Subscription } from 'rxjs';


// ✅ IMPORTANTE: Importar o módulo real para poder removê-lo
import { HttpClientModule } from '@angular/common/http'; 

import { WelcomeComponent } from './welcome.component';
import { ThemeService } from '../../services/theme.service';

const mockThemeService = {
  isLightMode$: new BehaviorSubject<boolean>(false),
};

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:8000/api/server-info';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeComponent, HttpClientTestingModule],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    })
    // ✅ A CORREÇÃO DEFINITIVA ESTÁ AQUI:
    .overrideComponent(WelcomeComponent, {
      // Remove o HttpClientModule importado pelo próprio componente
      remove: { imports: [HttpClientModule] }
    })
    .compileComponents();

    // A criação do fixture e do mock volta para o beforeEach
    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    httpMock.verify();
  });

  it('should create', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component).toBeTruthy();
    httpMock.expectOne(API_URL).flush({ server_ip: '0.0.0.0' });
    tick();
  }));

  it('should fetch server address successfully on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const req = httpMock.expectOne(API_URL);
    req.flush({ server_ip: '192.168.1.100' }); 
    tick();

    expect(component.serverAddress).toBe(`http://192.168.1.100:8001`);
  }));

  // O restante dos testes continua igual à versão 2.0.0, pois a lógica com fakeAsync/tick
  // já estava correta para controlar o fluxo de execução. O problema era apenas a configuração inicial.
  it('should handle API error when fetching server address', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    
    const req = httpMock.expectOne(API_URL);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    tick();
    
    expect(component.serverAddress).toBe('Falha na conexão com a API');
  }));

  it('should react to theme changes from ThemeService', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    
    httpMock.expectOne(API_URL).flush({ server_ip: '0.0.0.0' });
    tick();
    
    expect(component.isLightMode).toBe(false);

    mockThemeService.isLightMode$.next(true);
    tick();
    
    expect(component.isLightMode).toBe(true);
  }));

  it('should unsubscribe from all subscriptions on destroy', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const serverSubSpy = jest.spyOn(component['serverInfoSubscription'], 'unsubscribe');
    const themeSubSpy = jest.spyOn(component['themeSubscription'], 'unsubscribe');
    
    httpMock.expectOne(API_URL).flush({ server_ip: '127.0.0.1' });
    tick();

    fixture.destroy();

    expect(serverSubSpy).toHaveBeenCalled();
    expect(themeSubSpy).toHaveBeenCalled();
  }));
});