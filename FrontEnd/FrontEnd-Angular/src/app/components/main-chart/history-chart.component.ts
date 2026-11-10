/*
# =====================================================================================
# SERVIDOR FRONTEND - GRÁFICO DE HISTÓRICO (CHART.JS)
# Descrição: Só o <canvas> do histórico de tráfego. Fica separado do MainChartComponent
#            para o Chart.js ser baixado sob demanda (@defer no template do gráfico
#            principal) em vez de pesar no carregamento inicial. Dados, opções e a
#            lógica da legenda continuam no MainChartComponent.
# =====================================================================================
*/
import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart, ChartConfiguration, ChartType, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Legend, Tooltip
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip);

@Component({
  selector: 'app-history-chart',
  standalone: true,
  imports: [BaseChartDirective],
  // O Chart.js (responsive) mede o elemento pai do <canvas>: o host precisa ocupar o espaço.
  styles: [':host { display: block; width: 100%; height: 100%; }'],
  template: `<canvas baseChart class="chart" [data]="data" [options]="options" [type]="type"></canvas>`
})
export class HistoryChartComponent implements AfterViewInit {
  @Input({ required: true }) data!: ChartConfiguration['data'];
  @Input({ required: true }) options!: ChartConfiguration['options'];
  @Input() type: ChartType = 'line';
  /** Entrega a diretiva ao componente pai (atualização e sincronização da legenda). */
  @Output() ready = new EventEmitter<BaseChartDirective | undefined>();
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  ngAfterViewInit(): void {
    this.ready.emit(this.chart);
  }
}
