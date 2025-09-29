// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Componente: SidebarComponent (sidebar.component.spec.ts)
// Versão: 1.0.0
//
// Autor: Equipe Frontend/QA
// Descrição: Esta suíte de testes valida o comportamento do SidebarComponent.
//            Ela simula os Observables dos serviços (TrafficDataService, ThemeService)
//            para testar os dois modos de operação: Geral e Foco (Drill-down),
//            garantindo que os cálculos e a renderização reajam corretamente
//            às mudanças de estado.
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { SidebarComponent } from './sidebar.component';
import { TrafficDataService } from '../../services/traffic-data';
import { ThemeService } from '../../services/theme.service';
import { ClientTrafficSummary, ProtocolDrilldown } from '../../models/traffic.model';

// --- SEÇÃO 1: CRIAÇÃO DOS MOCKS E DADOS DE TESTE ---

// --- Dados Mockados ---
const mockAllClients: ClientTrafficSummary[] = [
  { ip: '192.168.1.10', inbound: 10240, outbound: 20480 }, // Total: 30 KB
  { ip: '192.168.1.20', inbound: 51200, outbound: 51200 }, // Total: 100 KB - Top Talker
];

const mockSelectedClient: ClientTrafficSummary = {
  ip: '192.168.1.20', inbound: 51200, outbound: 51200
};

const mockProtocolData: ProtocolDrilldown[] = [
  { name: 'HTTPS', inbound: 40000, outbound: 40000, y: 80000 }, // Top Protocol
  { name: 'DNS', inbound: 11200, outbound: 11200, y: 22400 }
];

// --- Mocks dos Serviços ---
// Usamos BehaviorSubject para poder emitir novos valores durante os testes.
const mockTrafficService = {
  trafficData$: new BehaviorSubject<ClientTrafficSummary[]>(mockAllClients),
  isDrillDownActive$: new BehaviorSubject<boolean>(false),
  selectedClientData$: new BehaviorSubject<ClientTrafficSummary | null>(null),
  getProtocolDrilldownData: (ip: string) => of(mockProtocolData)
};

const mockThemeService = {
  isLightMode$: new BehaviorSubject<boolean>(false) // Começa em modo escuro
};


// --- SEÇÃO 2: DESCRIÇÃO DA SUÍTE DE TESTES ---
describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  // --- SEÇÃO 3: CONFIGURAÇÃO DO AMBIENTE DE TESTE (beforeEach) ---
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        // Fornecemos as versões falsas dos serviços.
        { provide: TrafficDataService, useValue: mockTrafficService },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;

    // Resetamos os mocks para o estado inicial antes de cada teste
    mockTrafficService.trafficData$.next(mockAllClients);
    mockTrafficService.isDrillDownActive$.next(false);
    mockTrafficService.selectedClientData$.next(null);
    mockThemeService.isLightMode$.next(false);
  });

  // --- SEÇÃO 4: TESTES UNITÁRIOS ('it' blocks) ---

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Testes para o MODO GERAL
  describe('General Mode', () => {
    it('should process global data correctly on init', () => {
      // 1. AÇÃO: Inicia o componente.
      fixture.detectChanges();

      // 2. VERIFICAÇÃO:
      expect(component.isDrillDownMode).toBe(false);
      expect(component.activeClients).toBe(2);
      expect(component.topTalker).toBe('192.168.1.20'); // O cliente com maior tráfego
      expect(component.totalDownload).toBe('60 Kb'); // 10240 + 51200 = 61440 bytes
      expect(component.topProtocol).toBe('N/A');
    });

    it('should reset to defaults when no client data is received', () => {
      // 1. SIMULAÇÃO: O serviço emite um array vazio.
      mockTrafficService.trafficData$.next([]);
      fixture.detectChanges();

      // 2. VERIFICAÇÃO:
      expect(component.activeClients).toBe(0);
      expect(component.topTalker).toBe('N/A');
      expect(component.totalDownload).toBe('0 Mb'); // Valor padrão do reset
    });
  });

  // Testes para o MODO DE FOCO (Drill-down)
  describe('Focus (Drill-Down) Mode', () => {
    it('should switch to focus mode and process specific client data', () => {
      // 1. AÇÃO: Simula a ativação do modo de foco.
      mockTrafficService.isDrillDownActive$.next(true);
      mockTrafficService.selectedClientData$.next(mockSelectedClient);
      fixture.detectChanges();

      // 2. VERIFICAÇÃO:
      expect(component.isDrillDownMode).toBe(true);
      expect(component.activeClients).toBe(1);
      expect(component.topTalker).toBe('192.168.1.20');
      expect(component.totalDownload).toBe('50 Kb'); // 51200 bytes
      expect(component.topProtocol).toBe('HTTPS'); // O protocolo com maior tráfego
    });
  });

  // Testes para as Funções Utilitárias
  describe('Utility Functions', () => {
    it('should format bytes correctly', () => {
      // @ts-ignore: Acessando método privado para teste
      const formatBytes = component.formatBytes.bind(component);
      expect(formatBytes(512)).toBe('512 Bytes');
      expect(formatBytes(1536)).toBe('1.5 Kb');
      expect(formatBytes(1048576)).toBe('1 Mb');
    });

    it('should update sidebar styles for light theme', () => {
      // 1. AÇÃO: Ativa o modo claro.
      mockThemeService.isLightMode$.next(true);
      fixture.detectChanges();

      // 2. VERIFICAÇÃO:
      const expectedColor = '#d4d4d4';
      // @ts-ignore: Acessando propriedade para teste
      expect(component.sidebarStyleObject['background-color']).toBe(expectedColor);
    });
  });
});
