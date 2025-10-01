// =====================================================================================
// CLIENTE FRONTEND - TESTES UNITÁRIOS AUTOMATIZADOS
// Componente: FooterComponent (footer.component.spec.ts)
// Versão: 1.0.0
//
// Autor: Equipe Frontend/QA
// Descrição: Esta suíte de testes valida o comportamento do FooterComponent.
//            Ela utiliza o HttpClientTestingModule para simular (mockar) as
//            respostas da API, garantindo que o componente reage corretamente
//            a cenários de sucesso e de erro.
// =====================================================================================

// --- SEÇÃO 0: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';


import { FooterComponent } from './footer.component';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// --- SEÇÃO 1: DESCRIÇÃO DA SUÍTE DE TESTES ---
describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let httpMock: HttpTestingController;

  // --- SEÇÃO 2: CONFIGURAÇÃO DO AMBIENTE DE TESTE (beforeEach) ---
  /**
   * A função beforeEach é executada antes de cada teste ('it' block).
   * Ela configura o ambiente de teste do Angular, declarando o componente
   * a ser testado e importando os módulos necessários (neste caso, para simular HTTP).
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Como o componente é standalone, ele é importado diretamente.
      imports: [FooterComponent, HttpClientTestingModule]
    })
    .compileComponents();

    // Cria uma instância do componente e do seu ambiente de teste.
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    // Obtém o controlador para simular as requisições HTTP.
    httpMock = TestBed.inject(HttpTestingController);
  });

  /**
   * A função afterEach é executada após cada teste.
   * Usamo-la para verificar se não há requisições HTTP pendentes,
   * garantindo que cada teste é limpo e independente.
   */
  afterEach(() => {
    httpMock.verify();
  });

  // --- SEÇÃO 3: TESTES UNITÁRIOS ('it' blocks) ---

  it('should create', () => {
    // O teste mais simples: verifica se o componente foi criado com sucesso.
    expect(component).toBeTruthy();
  });

  it('should display "Carregando..." on initial state', () => {
    // Verifica se as propriedades públicas começam com o texto de carregamento
    // antes de qualquer chamada à API.
    expect(component.ftpAddress).toBe('Carregando...');
    expect(component.httpAddress).toBe('Carregando...');
  });

  it('should fetch server IP and format addresses on successful API call', () => {
    // Testa o "caminho feliz": a API responde com sucesso.
    const mockResponse = { server_ip: '192.168.1.150' };
    const apiUrl = 'http://localhost:8000/api/server-info';

    // 1. AÇÃO: Aciona o ngOnInit(), que chama a função fetchServerAddress().
    fixture.detectChanges();

    // 2. EXPECTATIVA: Espera que uma requisição GET para a URL correta tenha sido feita.
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');

    // 3. SIMULAÇÃO: Simula a resposta bem-sucedida da API, enviando os dados mockados.
    req.flush(mockResponse);

    // 4. VERIFICAÇÃO: Verifica se o componente atualizou suas propriedades
    // com os valores formatados corretamente.
    expect(component.ftpAddress).toBe('ftp://192.168.1.150:2121');
    expect(component.httpAddress).toBe('192.168.1.150:8001');
  });

  it('should display error message on failed API call', () => {
    // Testa o "caminho triste": a API falha.
    const apiUrl = 'http://localhost:8000/api/server-info';

    // 1. AÇÃO: Aciona o ngOnInit().
    fixture.detectChanges();

    // 2. EXPECTATIVA: Espera que a requisição tenha sido feita.
    const req = httpMock.expectOne(apiUrl);

    // 3. SIMULAÇÃO: Simula uma resposta de erro do servidor (ex: 500 Internal Server Error).
    req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

    // 4. VERIFICAÇÃO: Verifica se o componente atualizou suas propriedades
    // com a mensagem de erro definida no callback 'error'.
    expect(component.ftpAddress).toBe('Erro de conexão');
    expect(component.httpAddress).toBe('Erro de conexão');
  });
});
