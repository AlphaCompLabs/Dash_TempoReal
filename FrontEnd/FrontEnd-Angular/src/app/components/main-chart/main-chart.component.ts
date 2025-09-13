// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-main-chart',
//   imports: [],
//   templateUrl: './main-chart.component.html',
//   styleUrl: './main-chart.component.css'
// })
// export class MainChartComponent {

// }

// Precisamos importar OnInit para usar o hook do ciclo de vida
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NetworkClient {
  ip: string;
  name: string;
  downloadValue: number;
  uploadValue: number;
}

@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrl: './main-chart.component.css',
  standalone: true,
  imports: [ CommonModule]
})
// MODIFICADO: Adicionamos 'implements OnInit'
export class MainChartComponent implements OnInit {

  // MODIFICADO: Este valor agora será calculado dinamicamente.
  // O valor inicial 25 serve como um padrão antes do cálculo.
  public maxChartValue: number = 25;

  // NOVO: Esta propriedade vai guardar os rótulos para o eixo Y (ex: [25, 20, 15...])
  public yAxisLabels: number[] = [];

  public networkClients: NetworkClient[] = [
    { ip: '192.168.1.100', name: 'Desktop-01', downloadValue: 7, uploadValue: 3 }, // Total 10
    { ip: '192.168.1.101', name: 'Notebook-RH', downloadValue: 18, uploadValue: 6 }, // Total 24
    { ip: '192.168.1.102', name: 'Servidor-Files', downloadValue: 8.25, uploadValue: 6.75 }, // Total 15
    { ip: '192.168.1.105', name: 'Celular-CEO', downloadValue: 2, uploadValue: 8 }, // Total 10
    { ip: '192.168.1.112', name: 'Tablet-Vendas', downloadValue: 4, uploadValue: 1 }, // Total 5
  ];

  constructor() { }

  // NOVO: O método ngOnInit é o lugar ideal para fazer cálculos
  // quando o componente é inicializado.
  ngOnInit(): void {
    this.setupChartScale();
  }
  get hasClients(): boolean {
    return this.networkClients && this.networkClients.length > 0; 
  }

  // NOVO: Criamos uma função dedicada para toda a lógica do eixo Y.
  private setupChartScale(): void {
    if (!this.hasClients) {
      // zera as escalas, não precisamos de labels aqui
      this.maxChartValue = 0;
      this.yAxisLabels = [];
      return;
    }

    const maxValue = Math.max(...this.networkClients.map(c => c.downloadValue + c.uploadValue));
    this.maxChartValue = Math.ceil(maxValue / 5) * 5;
    if (this.maxChartValue === 0) this.maxChartValue = 5;

    const step = this.maxChartValue / 5;
    this.yAxisLabels = Array.from({ length: 6 }, (_, i) => this.maxChartValue - (i * step));
  }

  /**
   * NENHUMA MUDANÇA NECESSÁRIA AQUI!
   * Esta função já usa `this.maxChartValue`, então ela se adaptará automaticamente.
   */
  calculateTotalHeight(client: NetworkClient): number {
    const total = client.downloadValue + client.uploadValue;
    return Math.min((total / this.maxChartValue) * 100, 100);
  }

  /**
   * NENHUMA MUDANÇA NECESSÁRIA AQUI!
   */
  calculateDownloadRatio(client: NetworkClient): number {
    const total = client.downloadValue + client.uploadValue;
    if (total === 0) return 0;
    return (client.downloadValue / total) * 100;
  }

  /**
   * NENHUMA MUDANÇA NECESSÁRIA AQUI!
   */
  calculateUploadRatio(client: NetworkClient): number {
    const total = client.downloadValue + client.uploadValue;
    if (total === 0) return 0;
    return (client.uploadValue / total) * 100;
  }
}

