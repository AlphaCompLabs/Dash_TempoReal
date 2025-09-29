// =====================================================================================
// Serviço: TrafficDataService (traffic-data.service.spec.ts)
// Versão: 5.0.1 (Sintaxe Corrigida)
//
// Autor: Equipe Frontend/QA
// Descrição: Adotada a abordagem jest.useFakeTimers() para garantir controle
//            explícito sobre o fluxo de tempo, resolvendo a instabilidade do tick()
//            e garantindo a execução correta dos testes de polling.
// =====================================================================================

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
// ✅ AJUSTE: Corrigido o caminho de importação para a convenção padrão.
import { TrafficDataService } from './traffic-data';

describe('TrafficDataService', () => {
  let service: TrafficDataService;
  let httpMock: HttpTestingController;

  const API_BASE_URL = 'http://127.0.0.1:8000';
  const POLLING_INTERVAL_MS = 5000;

  // Usamos o controle de timers do Jest
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TrafficDataService]
    });
    service = TestBed.inject(TrafficDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    service.ngOnDestroy();
    httpMock.verify();
  });
  
  // Limpamos os timers após todos os testes
  afterAll(() => {
    jest.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    // Avançamos o tempo explicitamente com o Jest
    jest.advanceTimersByTime(0);
    httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);
  });

  describe('Data Polling', () => {
    it('should start polling immediately and update data on success', () => {
      // Primeira chamada
      jest.advanceTimersByTime(0);
      const req1 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req1.flush([{ ip: '1.1.1.1' }]);

      // Segunda chamada (após o intervalo)
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      // Corrigida a URL incompleta.
      const req2 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req2.flush([]);
    });

    it('should handle API errors gracefully and continue polling', () => {
      // Primeira chamada (com erro)
      jest.advanceTimersByTime(0);
      //  Corrigida a URL incompleta.
      const req1 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req1.flush('Error', { status: 500, statusText: 'Server Error' });

      // Segunda chamada (deve acontecer mesmo após o erro)
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      //  Corrigida a URL incompleta.
      const req2 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req2.flush([]);
    });
  });

  describe('Protocol Drilldown', () => {
    it('should fetch protocol data for a specific IP successfully', () => {
      // Lida com a chamada inicial de polling para isolar o teste
      jest.advanceTimersByTime(0);
      //  Corrigida a URL incompleta.
      httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);
      
      // Testa a lógica específica deste 'it'
      const testIp = '192.168.1.50';
      service.getProtocolDrilldownData(testIp).subscribe();
      //  Corrigida a URL incompleta.
      const req = httpMock.expectOne(`${API_BASE_URL}/api/traffic/${testIp}/protocols`);
      req.flush([]);
    });
  });

  it('should unsubscribe from polling on destroy', () => {
    // Lida com a chamada inicial
    jest.advanceTimersByTime(0);
    //  Corrigida a URL incompleta.
    httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);
    
    // Testa o cancelamento da inscrição
    service.ngOnDestroy();
    
    // Avança o tempo e garante que NENHUMA nova chamada foi feita
    jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    // Corrigida a URL incompleta.
    httpMock.expectNone(`${API_BASE_URL}/api/traffic`);
  });
});
// 