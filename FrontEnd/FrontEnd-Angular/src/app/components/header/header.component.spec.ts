// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Componente: HeaderComponent (header.component.spec.ts)
// Versão: 1.0.1 (Corrigido)
//
// Autor: Equipe Frontend/QA
// Descrição: Corrigido o teste de 'unsubscribe' para garantir que o spy é
//            criado após a inicialização do componente.
// =====================================================================================

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subscription } from 'rxjs';
import { HeaderComponent } from './header.component';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';

const mockThemeService = {
  isLightMode$: new BehaviorSubject<boolean>(false),
  toggleTheme: () => {
    mockThemeService.isLightMode$.next(!mockThemeService.isLightMode$.value);
  }
};

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, CommonModule],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    mockThemeService.isLightMode$.next(false); // Reset
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to theme service on init and set initial mode to dark', () => {
    fixture.detectChanges();
    expect(component.isLightMode).toBe(false);
  });

  it('should update isLightMode to true when theme service emits true', () => {
    fixture.detectChanges();
    mockThemeService.isLightMode$.next(true);
    fixture.detectChanges();
    expect(component.isLightMode).toBe(true);
  });
  
  it('should call themeService.toggleTheme when the component toggleTheme method is called', () => {
    const toggleSpy = spyOn(themeService, 'toggleTheme').and.callThrough();
    component.toggleTheme();
    expect(toggleSpy).toHaveBeenCalled();
  });

  it('should unsubscribe from theme subscription on destroy', () => {
    // ngOnInit é chamado primeiro para criar a subscrição.
    fixture.detectChanges();

    // @ts-ignore: Acessamos a propriedade privada para o teste.
    const themeSub: Subscription = component.themeSubscription;
    const unsubscribeSpy = spyOn(themeSub, 'unsubscribe');
    
    // Agora que o spy está criado, destruímos o componente.
    fixture.destroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

