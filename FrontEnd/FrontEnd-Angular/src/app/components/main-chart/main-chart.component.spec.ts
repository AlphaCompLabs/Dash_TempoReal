// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Componente: MainChartComponent (main-chart.component.spec.ts)
// Versão: 1.0.1 (Corrigido)
//
// Autor: Equipe Frontend/QA
// Descrição: Corrigido o valor do mock de dados para garantir que o teste de
//            escala para 'MB' passe de forma consistente.
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { MainChartComponent } from './main-chart.component';
import { TrafficDataService } from '../../services/traffic-data';
import { ClientTrafficSummary } from '../../models/traffic.model';


// --- SEÇÃO 1: CRIAÇÃO DO MOCK DO SERVIÇO E DADOS DE TESTE ---

// O valor do cliente 'top talker' foi aumentado para > 1MB.
const mockApiData: ClientTrafficSummary[] = [
  { ip: '192.168.1.5', inbound: 1000, outbound: 2000 },
  { ip: '192.168.1.2', inbound: 1048576, outbound: 524288 }, // Total: 1.5MB - Top Talker
  { ip: '192.168.1.3', inbound: 1500, outbound: 2500 }, { ip: '192.168.1.4', inbound: 1400, outbound: 2400 },
  { ip: '192.168.1.6', inbound: 1300, outbound: 2300 }, { ip: '192.168.1.7', inbound: 1200, outbound: 2200 },
  { ip: '192.168.1.8', inbound: 1100, outbound: 2100 }, { ip: '192.168.1.9', inbound: 1000, outbound: 2000 },
  { ip: '192.168.1.10', inbound: 900, outbound: 1900 }, { ip: '192.168.1.11', inbound: 800, outbound: 1800 },
  { ip: '192.168.1.12', inbound: 1, outbound: 1 },
];

const mockTrafficService = {
  trafficData$: of(mockApiData),
  getProtocolDrilldownData: (ip: string) => of([]),
  setDrillDownState: (state: boolean) => {},
  setSelectedClient: (client: ClientTrafficSummary | null) => {}
};

describe('MainChartComponent', () => {
  let component: MainChartComponent;
  let fixture: ComponentFixture<MainChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainChartComponent],
      providers: [
        { provide: TrafficDataService, useValue: mockTrafficService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should sort clients by total traffic and limit to the top 10', () => {
    fixture.detectChanges();
    expect(component.networkClients.length).toBe(10);
    expect(component.networkClients[0].ip).toBe('192.168.1.2');
    const smallestClient = component.networkClients.find(c => c.ip === '192.168.1.12');
    expect(smallestClient).toBeUndefined();
  });

  it('should trigger green ping animation when data is received', fakeAsync(() => {
    fixture.detectChanges();
    expect(component.pingState).toBe('green');
    tick(1000);
    expect(component.pingState).toBe('idle');
  }));

  it('should set main filter, recalculate scale, and toggle correctly', () => {
    const setupScaleSpy = jest.spyOn(component as any, 'setupChartScale');
    fixture.detectChanges(); // Call ngOnInit to initialize data
    setupScaleSpy.mockClear(); // Reset spy after initial call in ngOnInit

    component.setMainFilter('download');
    expect(component.activeMainFilter).toBe('download');
    expect(setupScaleSpy).toHaveBeenCalledTimes(1);

    component.setMainFilter('download');
    expect(component.activeMainFilter).toBe('all');
    expect(setupScaleSpy).toHaveBeenCalledTimes(2);
  });

  it('should calculate chart scale correctly, identifying MB as the unit', () => {
    fixture.detectChanges();
    // A expectativa agora vai ser satisfeita.
    expect(component.chartUnit).toBe('MB');
    // 1.5MB arredondado para cima é 2.
    expect(component.maxChartValue).toBe(2);
  });
  
  it('should format bytes into the correct units', () => {
    // @ts-ignore: Acessando método privado para teste
    expect(component.formatBytes(500)).toBe('500 Bytes');
    // @ts-ignore
    expect(component.formatBytes(2048)).toBe('2 KB');
    // @ts-ignore
    expect(component.formatBytes(1572864)).toBe('1.5 MB');
  });
});
