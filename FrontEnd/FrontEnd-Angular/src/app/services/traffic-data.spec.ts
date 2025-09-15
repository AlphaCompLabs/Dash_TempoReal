// /**
//  * =========================================================================
//  * TESTES UNITÁRIOS PARA O SERVIÇO DE DADOS DE TRÁFEGO
//  * Versão: 1.0.0
//  *
//  * Descrição: Este ficheiro contém os testes automatizados para o
//  * `TrafficDataService`. O objetivo é garantir que o serviço consegue
//  * buscar e processar os dados da API corretamente, além de gerir
//  * o estado de carregamento e de erros.
//  * =========================================================================
//  */

// import { TestBed } from '@angular/core/testing';
// // Importa as ferramentas para simular requisições HTTP
// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// import { TrafficDataService } from './traffic-data.service';
// import { ClientTrafficSummary, ProtocolDrilldown } from '../models/traffic.model';

// // O 'describe' agrupa os testes para o nosso serviço
// describe('TrafficDataService', () => {
//   let service: TrafficDataService;
//   let httpMock: HttpTestingController; // O controlador para simular o HTTP

//   // O 'beforeEach' é executado antes de cada teste ('it' block)
//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       imports: [
//         HttpClientTestingModule // Importa o módulo de teste HTTP
//       ],
//       providers: [
//         TrafficDataService
//       ]
//     });
//     // Injeta o serviço e o controlador de mock
//     service = TestBed.inject(TrafficDataService);
//     httpMock = TestBed.inject(HttpTestingController);
//   });

//   // O 'afterEach' é executado depois de cada teste para garantir que não há requisições pendentes
//   afterEach(() => {
//     httpMock.verify();
//   });

//   // Teste 1: Verifica se o serviço é criado com sucesso
//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });

//   // Teste 2: Testa a função principal de busca de dados
//   describe('getMainTrafficData', () => {
//     it('should fetch traffic data and update the trafficData$ observable', (done) => {
//       // 1. Prepara os dados falsos que a API "simulada" irá retornar
//       const mockTrafficData: ClientTrafficSummary[] = [
//         { ip: '192.168.1.10', inbound: 1000, outbound: 2000, name: 'PC-Joao' },
//         { ip: '192.168.1.15', inbound: 1500, outbound: 2500, name: 'PC-Maria' }
//       ];

//       // 2. Inscreve-se ao observable para verificar o resultado
//       service.trafficData$.subscribe(data => {
//         // Este código só será executado quando o polling (timer) fizer a primeira chamada
//         if (data.length > 0) {
//           expect(data.length).toBe(2);
//           expect(data[0].ip).toBe('192.168.1.10');
//           done(); // 'done' informa ao Jasmine que o teste assíncrono terminou
//         }
//       });

//       // 3. Simula a resposta da API
//       const req = httpMock.expectOne(`${service['API_BASE_URL']}/api/traffic`);
//       expect(req.request.method).toBe('GET');
//       req.flush(mockTrafficData); // Envia os dados falsos como resposta
//     });

//     it('should handle API errors gracefully', (done) => {
//         // Testa o que acontece quando a API dá um erro
//         service.error$.subscribe(error => {
//             if (error) {
//                 expect(error).toContain('Não foi possível carregar');
//                 done();
//             }
//         });

//         const req = httpMock.expectOne(`${service['API_BASE_URL']}/api/traffic`);
//         // Simula uma resposta de erro do servidor
//         req.flush('Erro no servidor', { status: 500, statusText: 'Internal Server Error' });
//     });
//   });

//   // Teste 3: Testa a função de drill down
//   describe('getProtocolDrilldownData', () => {
//     it('should fetch protocol data for a specific IP', () => {
//       const mockIp = '192.168.1.10';
//       const mockProtocolData: ProtocolDrilldown[] = [
//         { name: 'TCP', y: 3000 },
//         { name: 'UDP', y: 500 }
//       ];

//       // Chama a função e inscreve-se ao resultado
//       service.getProtocolDrilldownData(mockIp).subscribe(data => {
//         expect(data.length).toBe(2);
//         expect(data[0].name).toBe('TCP');
//       });

//       // Simula a resposta da API para o endpoint de drill down
//       const req = httpMock.expectOne(`${service['API_BASE_URL']}/api/traffic/${mockIp}/protocols`);
//       expect(req.request.method).toBe('GET');
//       req.flush(mockProtocolData);
//     });
//   });

// });
