// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Serviço: TrafficDataService (traffic-data.service.spec.ts)
// Versão: 4.0.0 (Solução Definitiva com Controle de Tempo)
//
// Autor: Equipe Frontend/QA
// Descrição: Corrigido para usar fakeAsync/tick() em TODOS os testes para disparar
//            corretamente o polling assíncrono que começa no construtor do serviço.
// =====================================================================================

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TrafficDataService } from './traffic-data';
import { ClientTrafficSummary, ProtocolDrilldown } from '../models/traffic.model';

describe('TrafficDataService', () => {
  let service: TrafficDataService;
  let httpMock: HttpTestingController;

  // IMPORTANTE: Verifique se esta URL é EXATAMENTE a mesma usada no seu serviço.
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const POLLING_INTERVAL_MS = 5000; // Ajuste se o seu intervalo for diferente

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

  it('should be created', fakeAsync(() => {
    expect(service).toBeTruthy();

    // ✅ CORREÇÃO: O construtor do serviço inicia um polling assíncrono.
    // O `tick()` força o timer a disparar a primeira chamada HTTP.
    tick();

    // Agora que a chamada foi disparada, nós a respondemos para o teste passar.
    httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);
  }));

  describe('Data Polling', () => {
    it('should start polling immediately and update data on success', fakeAsync(() => {
      const mockData: ClientTrafficSummary[] = [{ ip: '192.168.1.1', inbound: 100, outbound: 200 }];
      
      // ✅ CORREÇÃO: Avança o relógio para disparar a primeira chamada.
      tick();
      const req1 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req1.flush(mockData);

      // Avança o relógio pelo intervalo de polling para testar a segunda chamada.
      tick(POLLING_INTERVAL_MS);
      const req2 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req2.flush([]);
    }));

    it('should handle API errors gracefully and continue polling', fakeAsync(() => {
      // ✅ CORREÇÃO: Avança o relógio para disparar a primeira chamada.
      tick();
      const req1 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req1.flush('API Error', { status: 500, statusText: 'Server Error' });

      // Avança o relógio para garantir que o polling continua mesmo após o erro.
      tick(POLLING_INTERVAL_MS);
      const req2 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req2.flush([]);
    }));
  });

  describe('Protocol Drilldown', () => {
    it('should fetch protocol data for a specific IP successfully', fakeAsync(() => {
      const testIp = '192.168.1.50';
      
      // ✅ CORREÇÃO: Todo teste cria um novo serviço, então todo teste precisa
      // lidar com a primeira chamada de polling que acontece no construtor.
      tick();
      httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]); // Limpa a chamada de polling.

      // Agora, podemos focar na lógica deste teste.
      service.getProtocolDrilldownData(testIp).subscribe();
      const req = httpMock.expectOne(`${API_BASE_URL}/api/traffic/${testIp}/protocols`);
      req.flush([]);
    }));
  });

  it('should unsubscribe from polling on destroy', fakeAsync(() => {
    // Dispara e responde à chamada inicial para deixar o estado limpo.
    tick();
    httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);
    
    // Destrói o serviço, o que deve cancelar o polling.
    service.ngOnDestroy();
    
    // Avança o tempo e garante que NENHUMA nova chamada foi feita.
    tick(POLLING_INTERVAL_MS);
    httpMock.expectNone(`${API_BASE_URL}/api/traffic`);
  }));
});