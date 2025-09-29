/**
 * =====================================================================================
 * ARQUIVO DE TESTES UNITÁRIOS - TrafficDataService
 * Versão: 5.1.0 (Padronização e documentação completa)
 *
 * Autor: Equipe Frontend
 * Descrição: Este arquivo contém os testes unitários para o TrafficDataService,
 * garantindo que a lógica de polling, tratamento de erros e busca
 * de dados funcione conforme o esperado.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TrafficDataService } from './traffic-data';

// --- SEÇÃO 2: BLOCO PRINCIPAL DE TESTES ---
describe('TrafficDataService', () => {

  // --- SEÇÃO 2.1: SETUP E TEARDOWN ---
  let service: TrafficDataService;
  let httpMock: HttpTestingController;

  const API_BASE_URL = 'http://127.0.0.1:8000';
  const POLLING_INTERVAL_MS = 5000;

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

  afterAll(() => {
    jest.useRealTimers();
  });

  // --- SEÇÃO 2.2: TESTES GERAIS ---
  it('deve ser criado', () => {
    expect(service).toBeTruthy();
    // Avança o timer para a chamada inicial do polling
    jest.advanceTimersByTime(0);
    httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);
  });

  // --- SEÇÃO 2.3: TESTES DE POLLING DE DADOS ---
  describe('Data Polling', () => {
    it('deve iniciar o polling imediatamente e atualizar os dados com sucesso', () => {
      // Primeira chamada (imediata)
      jest.advanceTimersByTime(0);
      const req1 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req1.flush([{ ip: '1.1.1.1' }]);

      // Segunda chamada (após o intervalo)
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      const req2 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req2.flush([]);
    });

    it('deve lidar com erros da API e continuar o polling', () => {
      // Primeira chamada (resultando em erro)
      jest.advanceTimersByTime(0);
      const req1 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req1.flush('Error', { status: 500, statusText: 'Server Error' });

      // Segunda chamada (deve ocorrer mesmo após o erro)
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      const req2 = httpMock.expectOne(`${API_BASE_URL}/api/traffic`);
      req2.flush([]);
    });
  });

  // --- SEÇÃO 2.4: TESTES DE DRILLDOWN DE PROTOCOLO ---
  describe('Protocol Drilldown', () => {
    it('deve buscar os dados de protocolo para um IP específico com sucesso', () => {
      // Lida com a chamada inicial de polling para isolar o teste
      jest.advanceTimersByTime(0);
      httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);

      // Testa a lógica específica de drilldown
      const testIp = '192.168.1.50';
      service.getProtocolDrilldownData(testIp).subscribe();
      const req = httpMock.expectOne(`${API_BASE_URL}/api/traffic/${testIp}/protocols`);
      req.flush([]);
    });
  });

  // --- SEÇÃO 2.5: TESTES DE CICLO DE VIDA ---
  it('deve cancelar a inscrição do polling ao ser destruído', () => {
    // Lida com a chamada inicial
    jest.advanceTimersByTime(0);
    httpMock.expectOne(`${API_BASE_URL}/api/traffic`).flush([]);

    // Chama o método de destruição
    service.ngOnDestroy();

    // Avança o tempo e verifica que nenhuma nova chamada foi feita
    jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    httpMock.expectNone(`${API_BASE_URL}/api/traffic`);
  });
});
