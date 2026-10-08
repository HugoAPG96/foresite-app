import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardStore } from './dashboard.store';

@Component({
  selector: 'app-dashboard',
  imports: [MatIconModule, MatProgressBarModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private store = inject(DashboardStore);

  proyecto = this.store.proyecto;
  prediccion = this.store.prediccion;
  stats = this.store.stats;
  alertas = this.store.alertas;
  cargaEquipo = this.store.cargaEquipo;

  planificadoVsRealChartType = 'line' as const;

  planificadoVsRealChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  // `computed` deriva la data del gráfico del store — si el store cambia
  // (llega la data real del backend), esto se recalcula solo, sin tocar nada más.
  planificadoVsRealChartData = computed<ChartConfiguration['data']>(() => {
    const { semanas, planificado, real } = this.store.planificadoVsReal();
    return {
      labels: semanas,
      datasets: [
        { label: 'Planificado', data: planificado, borderColor: '#6b7280', borderDash: [6, 4], tension: 0.3 },
        { label: 'Real', data: real, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.3 },
      ],
    };
  });
}
