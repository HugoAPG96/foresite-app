import { Component, computed, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ReportesStore } from './reportes.store';

@Component({
  selector: 'app-reportes',
  imports: [MatTabsModule, MatIconModule, MatTableModule, BaseChartDirective],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes {
  private store = inject(ReportesStore);

  resumen = this.store.resumen;
  desempeno = this.store.desempeno;
  desviacion = this.store.desviacion;

  desempenoColumns = ['nombre', 'completadas', 'pendientes', 'atrasadas'];

  desviacionChartType = 'bar' as const;

  desviacionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  desviacionChartData = computed<ChartConfiguration['data']>(() => {
    const { sprints, planificado, real } = this.store.desviacion();
    return {
      labels: sprints,
      datasets: [
        { label: 'Planificado', data: planificado, backgroundColor: '#fcd34d' },
        { label: 'Real', data: real, backgroundColor: '#f59e0b' },
      ],
    };
  });
}
