import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { performance, phaseDeviation, sprintDeviation, toCsv, downloadFile, DeviationRow } from '../../core/reports';
import { taskProgress } from '../../core/metrics';
import { ProjectStore } from '../../core/project.store';
import { formatDate, startOfToday } from '../../core/util/dates';
import { semaforoLabel } from '../../shared/util';

type Tab = 'ejecutivo' | 'desviacion' | 'desempeno';

@Component({
  selector: 'app-reports',
  imports: [MatIconModule],
  template: `
    @if (m(); as m) {
      <div class="page">
        <div class="page-header">
          <div>
            <h1>Reportes · {{ store.project()?.name }}</h1>
            <div class="sub">Generado el {{ today }} a partir de los datos actuales del proyecto</div>
          </div>
          <span class="spacer"></span>
          <button class="btn ghost no-print" (click)="print()"><mat-icon>print</mat-icon>Imprimir / PDF</button>
          <button class="btn no-print" (click)="exportCsv()"><mat-icon>download</mat-icon>Exportar CSV</button>
        </div>

        <div class="toolbar no-print">
          <div class="pill-tabs">
            <button [class.active]="tab() === 'ejecutivo'" (click)="tab.set('ejecutivo')">Ejecutivo</button>
            <button [class.active]="tab() === 'desviacion'" (click)="tab.set('desviacion')">Desviación</button>
            <button [class.active]="tab() === 'desempeno'" (click)="tab.set('desempeno')">Desempeño</button>
          </div>
        </div>

        @switch (tab()) {
          @case ('ejecutivo') {
            <div class="grid cols-4">
              <div class="metric"><div class="label">Avance</div><div class="value num">{{ m.progressPct }}%</div><div class="hint">Plan a hoy: {{ m.plannedPct }}%</div></div>
              <div class="metric">
                <div class="label">Health score</div>
                <div class="value num">{{ m.healthScore }}</div>
                <div class="hint"><span class="badge" [class]="m.semaforo">{{ label(m.semaforo) }}</span> {{ m.healthLabel }}</div>
              </div>
              <div class="metric">
                <div class="label">Cronograma</div>
                <div class="value num" [style.color]="m.prediction.delayDays > 0 ? 'var(--amber)' : 'var(--teal)'">
                  {{ m.prediction.level === 'nodata' ? '—' : m.prediction.delayDays > 0 ? '+' + m.prediction.delayDays + ' d' : 'En fecha' }}
                </div>
                <div class="hint">{{ m.overdue }} {{ m.overdue === 1 ? 'tarea atrasada' : 'tareas atrasadas' }}</div>
              </div>
              <div class="metric"><div class="label">Riesgos activos</div><div class="value num">{{ m.activeRisks }}</div><div class="hint">componente del Health Score</div></div>
            </div>

            <div class="alert" [class]="m.prediction.level" style="margin-top:14px">
              <mat-icon>insights</mat-icon>
              <div><div class="title">Predicción de retraso</div><div class="text">{{ m.prediction.message }}</div></div>
            </div>

            <div class="card" style="margin-top:14px">
              <h3>Avance por fase del cronograma</h3>
              @for (r of phaseRows(); track r.label) {
                <div class="line">
                  <span class="lbl">{{ r.label }} <span class="muted small">· {{ r.detail }}</span></span>
                  <span class="bar" [class]="r.real >= r.planned ? 'verde' : 'ambar'"><span [style.width.%]="r.real"></span></span>
                  <b class="num">{{ r.real }}%</b>
                </div>
              } @empty { <div class="muted small">Aún no hay tareas en el cronograma.</div> }
            </div>

            <div class="card" style="margin-top:14px">
              <h3>Recomendaciones</h3>
              @for (r of m.recommendations; track r.text) { <p class="rec">• {{ r.text }}</p> }
            </div>
          }

          @case ('desviacion') {
            <div class="toolbar no-print">
              <div class="chips">
                <button class="chip-btn" [class.active]="devBy() === 'fase'" (click)="devBy.set('fase')">Por fase</button>
                <button class="chip-btn" [class.active]="devBy() === 'sprint'" (click)="devBy.set('sprint')">Por sprint (puntos)</button>
              </div>
            </div>
            <div class="card">
              <h3>Planificado vs. real {{ devBy() === 'fase' ? 'por fase' : 'por sprint' }}</h3>
              <div class="legend small muted">
                <span><i class="sw neutral"></i>Planificado</span><span><i class="sw real"></i>Real</span>
              </div>
              @for (r of devRows(); track r.label) {
                <div class="dev">
                  <div class="dl"><b>{{ r.label }}</b><span class="muted small">{{ r.detail }}</span></div>
                  <div class="pair">
                    <div class="bar neutral"><span [style.width.%]="r.planned"></span></div>
                    <div class="bar" [class]="r.deviation < 0 ? 'ambar' : 'verde'"><span [style.width.%]="r.real"></span></div>
                  </div>
                  <div class="dv num">
                    <span class="small muted">{{ r.planned }}% → {{ r.real }}%</span>
                    <b [style.color]="r.deviation < 0 ? 'var(--coral)' : 'var(--teal)'">{{ r.deviation > 0 ? '+' : '' }}{{ r.deviation }} pp</b>
                  </div>
                </div>
              } @empty {
                <div class="empty">
                  {{ devBy() === 'fase' ? 'No hay tareas agrupadas por fase.' : 'No hay ítems con puntos asignados a un sprint con fechas.' }}
                </div>
              }
              @if (devRows().length) {
                <div class="total">
                  Desviación acumulada:
                  <b [style.color]="m.progressPct - m.plannedPct < 0 ? 'var(--coral)' : 'var(--teal)'">
                    {{ m.progressPct - m.plannedPct > 0 ? '+' : '' }}{{ m.progressPct - m.plannedPct }} pp
                  </b>
                  <span class="muted small"> (real {{ m.progressPct }}% vs. plan {{ m.plannedPct }}%)</span>
                </div>
              }
            </div>
          }

          @case ('desempeno') {
            <div class="table-wrap">
              <table class="t">
                <thead><tr><th>Integrante</th><th>Completadas</th><th>Pendientes</th><th>Atrasadas</th><th>Cumplimiento</th></tr></thead>
                <tbody>
                  @for (r of perfRows(); track r.userId) {
                    <tr>
                      <td><b>{{ r.name }}</b></td>
                      <td class="num">{{ r.completed }}</td>
                      <td class="num">{{ r.pending }}</td>
                      <td class="num" [style.color]="r.overdue ? 'var(--coral)' : null">{{ r.overdue }}</td>
                      <td class="nowrap"><span class="pct"><span class="bar" [class]="r.compliance >= 70 ? 'verde' : r.compliance >= 40 ? 'ambar' : 'rojo'"><span [style.width.%]="r.compliance"></span></span><b class="num">{{ r.compliance }}%</b></span></td>
                    </tr>
                  } @empty { <tr><td colspan="5" class="empty">No hay tareas asignadas todavía.</td></tr> }
                </tbody>
              </table>
            </div>
          }
        }
      </div>
    }
  `,
  styles: `
    .toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
    .line { display: grid; grid-template-columns: minmax(160px, 1.2fr) 2fr 52px; align-items: center; gap: 14px; margin: 10px 0; font-size: 13px; }
    .line .num { text-align: right; }
    .rec { font-size: 13px; margin: 6px 0; }
    .legend { display: flex; gap: 16px; margin-bottom: 12px; }
    .sw { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; }
    .sw.neutral { background: #b9b9c3; } .sw.real { background: #2fa88f; }
    .dev { display: grid; grid-template-columns: minmax(130px, 1fr) 3fr minmax(110px, 1fr); gap: 14px; align-items: center; padding: 10px 0; border-top: 1px solid var(--line); }
    .dev:first-of-type { border-top: none; }
    .dl { display: flex; flex-direction: column; gap: 2px; }
    .pair { display: flex; flex-direction: column; gap: 5px; }
    .pair .bar { height: 9px; }
    .dv { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .total { border-top: 1px solid var(--line); margin-top: 8px; padding-top: 12px; font-size: 13px; }
    .pct { display: inline-flex; align-items: center; gap: 10px; }
    .pct .bar { width: 110px; }
    td.empty { text-align: center; color: var(--ink-soft); padding: 28px; }
    @media (max-width: 760px) { .dev, .line { grid-template-columns: 1fr; } .dv { align-items: flex-start; } }
  `,
})
export class ReportsPage {
  protected store = inject(ProjectStore);
  protected m = this.store.metrics;
  protected tab = signal<Tab>('ejecutivo');
  protected devBy = signal<'fase' | 'sprint'>('fase');
  protected label = semaforoLabel;
  protected today = formatDateToday();

  private day = startOfToday();

  protected phaseRows = computed(() => phaseDeviation(this.store.phases(), this.store.tasks(), this.day));
  protected devRows = computed<DeviationRow[]>(() =>
    this.devBy() === 'fase'
      ? this.phaseRows()
      : sprintDeviation(this.store.sprints(), this.store.backlog(), this.day),
  );
  protected perfRows = computed(() =>
    performance(this.store.members().map((u) => u.id), this.store.tasks(), this.store.names(), this.day),
  );

  print(): void {
    window.print();
  }

  exportCsv(): void {
    const m = this.m();
    const project = this.store.project();
    if (!m || !project) return;
    const base = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (this.tab() === 'ejecutivo') {
      const rows: (string | number)[][] = [
        ['Avance real (%)', m.progressPct], ['Avance planificado (%)', m.plannedPct], ['Health score', m.healthScore],
        ['Semáforo', semaforoLabel(m.semaforo)], ['Tareas completadas', m.completed], ['Tareas pendientes', m.pending],
        ['Tareas atrasadas', m.overdue], ['Riesgos activos', m.activeRisks], ['Predicción', m.prediction.message],
      ];
      downloadFile(`${base}-reporte-ejecutivo.csv`, toCsv(['Indicador', 'Valor'], rows));
    } else if (this.tab() === 'desviacion') {
      downloadFile(
        `${base}-reporte-desviacion-${this.devBy()}.csv`,
        toCsv(['Grupo', 'Planificado (%)', 'Real (%)', 'Desviación (pp)', 'Detalle'],
          this.devRows().map((r) => [r.label, r.planned, r.real, r.deviation, r.detail])),
      );
    } else {
      downloadFile(
        `${base}-reporte-desempeno.csv`,
        toCsv(['Integrante', 'Completadas', 'Pendientes', 'Atrasadas', 'Cumplimiento (%)'],
          this.perfRows().map((r) => [r.name, r.completed, r.pending, r.overdue, r.compliance])),
      );
    }
  }
}

function formatDateToday(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
