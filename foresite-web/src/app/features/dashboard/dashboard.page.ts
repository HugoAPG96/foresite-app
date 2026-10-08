import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ProjectStore } from '../../core/project.store';
import { formatDate } from '../../core/util/dates';
import { initialsOf, semaforoLabel } from '../../shared/util';

@Component({
  selector: 'app-dashboard',
  imports: [MatIconModule, MatTooltipModule, RouterLink],
  template: `
    @if (m(); as m) {
      @if (store.project(); as p) {
        <div class="page">
          <div class="page-header">
            <div>
              <h1>{{ p.name }}</h1>
              <div class="sub">
                {{ fmt(p.startDate) }} → {{ fmt(p.endDate) }} ·
                @if (m.daysLeft >= 0) { {{ m.daysLeft }} {{ m.daysLeft === 1 ? 'día restante' : 'días restantes' }} }
                @else { venció hace {{ -m.daysLeft }} {{ m.daysLeft === -1 ? 'día' : 'días' }} }
              </div>
            </div>
            <span class="spacer"></span>
            @if (m.hasData) {
              <div class="status-pill" [class]="m.semaforo" matTooltip="Health Score: 40% avance + 30% fechas + 20% riesgos + 10% equipo">
                <span class="dot" [class]="m.semaforo"></span>
                {{ label(m.semaforo) }} · Health {{ m.healthScore }}
                <small>{{ m.healthLabel }}</small>
              </div>
            } @else {
              <div class="status-pill nodata"><span class="dot"></span>Sin datos · agrega tareas</div>
            }
          </div>

          <div class="grid cols-4">
            <div class="metric">
              <div class="label">Avance general</div>
              <div class="value num">{{ m.progressPct }}%</div>
              <div class="hint">Plan a hoy: {{ m.plannedPct }}%</div>
            </div>
            <div class="metric">
              <div class="label">Completadas</div>
              <div class="value num">{{ m.completed }}</div>
              <div class="hint">de {{ m.total }} {{ m.total === 1 ? 'tarea' : 'tareas' }}</div>
            </div>
            <div class="metric">
              <div class="label">Pendientes</div>
              <div class="value num">{{ m.pending }}</div>
              <div class="hint">{{ m.inProgress }} en progreso</div>
            </div>
            <div class="metric">
              <div class="label">Atrasadas</div>
              <div class="value num" [style.color]="m.overdue ? 'var(--coral)' : null">{{ m.overdue }}</div>
              <div class="hint">{{ m.overdue ? 'requieren atención' : 'todo al día' }}</div>
            </div>
          </div>

          <div class="stack">
            <div class="alert" [class]="m.prediction.level">
              <mat-icon>{{ m.prediction.level === 'ok' ? 'trending_up' : m.prediction.level === 'nodata' ? 'insights' : 'warning_amber' }}</mat-icon>
              <div>
                <div class="title">Predicción de retraso</div>
                <div class="text">{{ m.prediction.message }}</div>
              </div>
            </div>
            <div class="card recs">
              <h3>Recomendaciones automáticas</h3>
              @for (r of m.recommendations; track r.text) {
                <div class="rec" [class]="r.level">
                  <mat-icon>{{ r.level === 'danger' ? 'error_outline' : r.level === 'warn' ? 'lightbulb' : 'info' }}</mat-icon>
                  <span>{{ r.text }}</span>
                </div>
              }
            </div>
          </div>

          <div class="grid cols-2">
            <div class="card">
              <h3>Planificado vs. real</h3>
              <div class="cmp">
                <div class="row"><span>Planificado</span><b class="num">{{ m.plannedPct }}%</b></div>
                <div class="bar neutral"><span [style.width.%]="m.plannedPct"></span></div>
                <div class="row"><span>Real</span><b class="num">{{ m.progressPct }}%</b></div>
                <div class="bar" [class]="m.progressPct >= m.plannedPct ? 'verde' : 'ambar'"><span [style.width.%]="m.progressPct"></span></div>
                <div class="small muted dev">
                  Desviación:
                  <b [style.color]="m.progressPct - m.plannedPct < 0 ? 'var(--coral)' : 'var(--teal)'">
                    {{ m.progressPct - m.plannedPct > 0 ? '+' : '' }}{{ m.progressPct - m.plannedPct }} pp
                  </b>
                </div>
              </div>
            </div>

            <div class="card">
              <h3>Desglose del Health Score</h3>
              @for (c of components(); track c.label) {
                <div class="comp">
                  <div class="row"><span>{{ c.label }} <small class="muted">({{ c.weight }}%)</small></span><b class="num">{{ c.value }}</b></div>
                  <div class="bar" [class]="c.value >= 75 ? 'verde' : c.value >= 60 ? 'ambar' : 'rojo'"><span [style.width.%]="c.value"></span></div>
                </div>
              }
              <div class="small muted" style="margin-top:8px">Riesgos activos registrados: {{ m.activeRisks }}</div>
            </div>
          </div>

          <div class="grid cols-2">
            <div class="card">
              <h3>Carga de trabajo por integrante</h3>
              @for (w of m.workload; track w.userId) {
                <div class="comp">
                  <div class="row">
                    <span class="who"><span class="avatar sm">{{ ini(w.name) }}</span>{{ w.name }}</span>
                    <span class="small muted num">{{ w.count }} {{ w.count === 1 ? 'tarea' : 'tareas' }} · {{ w.pct }}%</span>
                  </div>
                  <div class="bar" [class]="w.pct > 50 ? 'rojo' : w.pct > 40 ? 'ambar' : ''"><span [style.width.%]="w.pct"></span></div>
                </div>
              } @empty {
                <div class="muted small">Aún no hay tareas asignadas.</div>
              }
            </div>

            <div class="card">
              <h3>Accesos rápidos</h3>
              <div class="quick">
                <a class="btn ghost" [routerLink]="['../tareas']"><mat-icon>checklist</mat-icon>Tareas</a>
                <a class="btn ghost" [routerLink]="['../backlog']"><mat-icon>list_alt</mat-icon>Backlog</a>
                <a class="btn ghost" [routerLink]="['../reportes']"><mat-icon>assessment</mat-icon>Reportes</a>
              </div>
              @if (p.objective) {
                <div class="obj"><div class="small muted">Objetivo</div><p>{{ p.objective }}</p></div>
              }
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: `
    .status-pill {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; font-weight: 600; font-size: 13px;
    }
    .status-pill small { font-weight: 500; opacity: .8; }
    .status-pill.verde { background: var(--teal-bg); color: var(--teal); }
    .status-pill.ambar { background: var(--amber-bg); color: var(--amber); }
    .status-pill.rojo { background: var(--coral-bg); color: var(--coral); }
    .status-pill.nodata { background: var(--surface); color: var(--ink-soft); }
    .recs h3 { margin-bottom: 4px; }
    .rec { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-top: 1px solid var(--line); font-size: 13px; }
    .rec:first-of-type { border-top: none; }
    .rec mat-icon { font-size: 19px; width: 19px; height: 19px; flex-shrink: 0; }
    .rec.danger mat-icon { color: var(--coral); }
    .rec.warn mat-icon { color: var(--amber); }
    .rec.info mat-icon { color: var(--ink-muted); }
    .stack { display: flex; flex-direction: column; gap: 10px; margin: 16px 0; }
    .grid.cols-2 { margin-top: 12px; }
    .row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin: 8px 0 5px; }
    .comp { margin-bottom: 10px; }
    .comp .row { margin: 0 0 5px; }
    .who { display: inline-flex; align-items: center; gap: 8px; }
    .dev { margin-top: 12px; }
    .quick { display: flex; gap: 8px; flex-wrap: wrap; }
    .quick .btn { text-decoration: none; }
    .obj { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--line); }
    .obj p { font-size: 13px; margin-top: 2px; }
  `,
})
export class DashboardPage {
  protected store = inject(ProjectStore);
  protected m = this.store.metrics;
  protected fmt = formatDate;
  protected ini = initialsOf;
  protected label = semaforoLabel;

  protected components = computed(() => {
    const m = this.store.metrics();
    if (!m) return [];
    return [
      { label: 'Avance vs. plan', weight: 40, value: m.avanceScore },
      { label: 'Cumplimiento de fechas', weight: 30, value: m.datesScore },
      { label: 'Riesgos', weight: 20, value: m.riskScore },
      { label: 'Participación del equipo', weight: 10, value: m.participationScore },
    ];
  });
}
