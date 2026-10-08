import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TasksApi } from '../../core/api/tasks.api';
import { errorMessage } from '../../core/errors';
import { isOverdue, taskProgress } from '../../core/metrics';
import { Phase, Task, TASK_COLUMNS, TaskStatus } from '../../core/models';
import { ProjectStore } from '../../core/project.store';
import { formatDate, formatShort, startOfToday } from '../../core/util/dates';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { initialsOf } from '../../shared/util';
import { PhaseDialog } from './phase.dialog';
import { TaskDialog } from './task.dialog';

interface PhaseGroup {
  phase: Phase | null;
  title: string;
  tasks: Task[];
  progress: number;
}

@Component({
  selector: 'app-tasks',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, MatIconModule, MatMenuModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Tareas · {{ store.project()?.name }}</h1>
          <div class="sub">{{ store.tasks().length }} tareas en el cronograma</div>
        </div>
        <span class="spacer"></span>
        @if (view() === 'cronograma') {
          <button class="btn ghost" (click)="newPhase()"><mat-icon>create_new_folder</mat-icon>Nueva fase</button>
        }
        <button class="btn" (click)="openTask()"><mat-icon>add</mat-icon>Nueva tarea</button>
      </div>

      <div class="toolbar">
        <div class="pill-tabs">
          <button [class.active]="view() === 'kanban'" (click)="view.set('kanban')">Kanban</button>
          <button [class.active]="view() === 'cronograma'" (click)="view.set('cronograma')">Cronograma</button>
        </div>
        @if (view() === 'kanban') {
          <label class="filter">
            <span class="muted small">Responsable</span>
            <select [value]="filterUser()" (change)="filterUser.set($any($event.target).value)">
              <option value="">Todos</option>
              @for (u of store.people(); track u.id) { <option [value]="u.id">{{ u.name }}</option> }
            </select>
          </label>
        }
      </div>

      @if (!store.tasks().length) {
        <div class="card empty">
          <mat-icon>checklist</mat-icon>
          <p>Todavía no hay tareas. Crea la primera para empezar a medir el avance.</p>
          <p style="margin-top:14px"><button class="btn" (click)="openTask()"><mat-icon>add</mat-icon>Nueva tarea</button></p>
        </div>
      } @else if (view() === 'kanban') {
        <div class="board" cdkDropListGroup>
          @for (col of columns; track col.value) {
            <section class="col">
              <header>
                <span class="dot-col" [class]="col.value"></span>
                <b>{{ col.label }}</b>
                <span class="count">{{ grouped()[col.value].length }}</span>
              </header>
              <div class="list" cdkDropList [cdkDropListData]="col.value" (cdkDropListDropped)="drop($event)">
                @for (t of grouped()[col.value]; track t.id) {
                  <article class="kcard" cdkDrag [cdkDragData]="t" [class.late]="late(t)">
                    <div class="k-top">
                      <span class="code">{{ t.code }}</span>
                      <span class="spacer"></span>
                      <button class="icon-btn sm" [matMenuTriggerFor]="m" aria-label="Acciones"><mat-icon>more_vert</mat-icon></button>
                      <mat-menu #m="matMenu">
                        <button mat-menu-item (click)="openTask(t)"><mat-icon>edit</mat-icon>Editar</button>
                        <button mat-menu-item (click)="remove(t)"><mat-icon>delete_outline</mat-icon>Eliminar</button>
                      </mat-menu>
                    </div>
                    <h4>{{ t.title }}</h4>
                    <div class="phase muted small">{{ phaseName(t.phaseId) }}</div>
                    <div class="bar" [class]="barClass(t)"><span [style.width.%]="progress(t)"></span></div>
                    <div class="k-foot">
                      <span class="who" [title]="name(t.responsibleId)"><span class="avatar sm">{{ ini(name(t.responsibleId)) }}</span>{{ firstName(t.responsibleId) }}</span>
                      <span class="small" [class.red]="late(t)">
                        @if (late(t)) { Vencida · } {{ short(t.endDate) }}
                      </span>
                    </div>
                  </article>
                } @empty {
                  <div class="drop-hint small muted">Arrastra tareas aquí</div>
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <div class="table-wrap">
          <table class="t">
            <thead>
              <tr>
                <th>ID</th><th>Título de tarea</th><th>Responsable</th><th>A cargo</th><th>Consultado</th><th>Informado</th>
                <th>Inicio</th><th>Vencimiento</th><th>Días</th><th>% tarea</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (g of groups(); track g.title) {
                <tr class="phase">
                  <td colspan="9">{{ g.title }}</td>
                  <td class="num" colspan="2">{{ g.progress }}%</td>
                </tr>
                @for (t of g.tasks; track t.id) {
                  <tr>
                    <td class="nowrap"><b>{{ t.code }}</b></td>
                    <td class="wrap">{{ t.title }}</td>
                    <td class="nowrap">{{ name(t.responsibleId) }}</td>
                    <td class="nowrap">{{ name(t.accountableId) }}</td>
                    <td>{{ names(t.consultedIds) }}</td>
                    <td>{{ names(t.informedIds) }}</td>
                    <td class="nowrap">{{ fmt(t.startDate) }}</td>
                    <td class="nowrap" [class.red]="late(t)">{{ fmt(t.endDate) }}</td>
                    <td class="num">{{ t.durationDays }}</td>
                    <td class="nowrap">
                      <span class="pct">
                        <span class="bar" [class]="barClass(t)"><span [style.width.%]="progress(t)"></span></span>
                        <span class="num">{{ progress(t) }}%</span>
                      </span>
                    </td>
                    <td class="nowrap">
                      <button class="icon-btn" (click)="openTask(t)" aria-label="Editar"><mat-icon>edit</mat-icon></button>
                      <button class="icon-btn" (click)="remove(t)" aria-label="Eliminar"><mat-icon>delete_outline</mat-icon></button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; }
    .filter select { font: inherit; font-size: 13px; border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; background: #fff; }

    .board { display: grid; grid-template-columns: repeat(3, minmax(260px, 1fr)); gap: 14px; align-items: start; overflow-x: auto; }
    .col { background: var(--surface); border-radius: var(--radius); padding: 12px; min-width: 260px; }
    .col header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 13px; }
    .count { background: #fff; border-radius: 999px; padding: 0 8px; font-size: 11.5px; color: var(--ink-soft); }
    .dot-col { width: 9px; height: 9px; border-radius: 50%; background: #b9b9c3; }
    .dot-col.en_progreso { background: #e0a21c; }
    .dot-col.completada { background: #2fa88f; }
    .list { display: flex; flex-direction: column; gap: 8px; min-height: 90px; }
    .drop-hint { border: 1.5px dashed #d2d2da; border-radius: 10px; padding: 22px; text-align: center; }
    .kcard {
      background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 12px; cursor: grab;
      display: flex; flex-direction: column; gap: 6px;
    }
    .kcard.late { border-color: var(--coral); box-shadow: inset 0 0 0 1px var(--coral); }
    .kcard h4 { font-size: 13px; font-weight: 600; line-height: 1.35; }
    .k-top { display: flex; align-items: center; }
    .code { font-size: 11px; font-weight: 700; color: var(--purple); background: var(--lavender); border-radius: 6px; padding: 1px 7px; }
    .icon-btn.sm { width: 26px; height: 26px; }
    .k-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
    .who { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-soft); }
    .red { color: var(--coral); font-weight: 600; }
    .pct { display: inline-flex; align-items: center; gap: 8px; }
    .pct .bar { width: 56px; }
    .cdk-drag-preview { box-shadow: 0 10px 30px rgba(0,0,0,.18); border-radius: 10px; background: #fff; padding: 12px; font-size: 13px; }
    .cdk-drag-placeholder { opacity: .35; }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0, 0, 0.2, 1); }
    @media (max-width: 900px) { .board { grid-template-columns: repeat(3, 280px); } }
  `,
})
export class TasksPage {
  protected store = inject(ProjectStore);
  private api = inject(TasksApi);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  protected view = signal<'kanban' | 'cronograma'>('kanban');
  protected filterUser = signal('');
  protected columns = TASK_COLUMNS;
  private today = startOfToday();

  protected grouped = computed(() => {
    const user = this.filterUser();
    const out: Record<TaskStatus, Task[]> = { pendiente: [], en_progreso: [], completada: [] };
    for (const t of this.store.tasks()) {
      if (user && t.responsibleId !== user) continue;
      out[t.status].push(t);
    }
    return out;
  });

  protected groups = computed<PhaseGroup[]>(() => {
    const phases = [...this.store.phases()].sort((a, b) => a.orderIndex - b.orderIndex);
    const tasks = this.store.tasks();
    const build = (phase: Phase | null, title: string, list: Task[]): PhaseGroup => {
      const w = list.reduce((s, t) => s + Math.max(1, Number(t.durationDays) || 1), 0);
      const real = list.reduce((s, t) => s + Math.max(1, Number(t.durationDays) || 1) * taskProgress(t), 0);
      return { phase, title, tasks: list, progress: w ? Math.round(real / w) : 0 };
    };
    const groups = phases
      .map((ph) => build(ph, `${ph.orderIndex + 1}. ${ph.name}`, tasks.filter((t) => t.phaseId === ph.id)))
      .filter((g) => g.tasks.length);
    const known = new Set(phases.map((p) => p.id));
    const orphan = tasks.filter((t) => !known.has(t.phaseId));
    if (orphan.length) groups.push(build(null, 'Sin fase', orphan));
    return groups;
  });

  protected fmt = formatDate;
  protected short = formatShort;
  protected ini = initialsOf;
  protected progress = taskProgress;
  protected late = (t: Task) => isOverdue(t, this.today);
  protected barClass = (t: Task) => (this.late(t) ? 'rojo' : t.status === 'completada' ? 'verde' : '');

  protected name = (id: string) => this.store.names().get(id) ?? '—';
  protected firstName = (id: string) => this.name(id).split(' ')[0];
  protected names = (ids: string[] | undefined) => (ids?.length ? ids.map((i) => this.name(i)).join(', ') : '—');
  protected phaseName = (id: string) => this.store.phases().find((p) => p.id === id)?.name ?? 'Sin fase';

  openTask(task?: Task): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    this.dialog
      .open(TaskDialog, { data: { projectId, task }, width: '720px', maxHeight: '92vh', disableClose: true })
      .afterClosed()
      .subscribe((saved?: Task) => {
        if (saved) {
          this.snack.open(task ? 'Tarea actualizada' : 'Tarea creada', 'OK');
          this.store.reloadTasks();
        }
      });
  }

  newPhase(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    this.dialog
      .open(PhaseDialog, { data: { projectId } })
      .afterClosed()
      .subscribe((phase) => {
        if (phase) {
          this.snack.open('Fase creada', 'OK');
          this.store.reloadPhases();
        }
      });
  }

  /** Mover una tarjeta entre columnas actualiza el estado en el backend (con reversión si falla). */
  drop(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    if (event.previousContainer === event.container) return;
    const task = event.item.data;
    const status = event.container.data;
    const projectId = this.store.projectId();
    if (!projectId || task.status === status) return;

    const previous = this.store.tasks();
    const percent = status === 'completada' ? 100 : status === 'pendiente' ? 0 : Math.min(Number(task.percentComplete) || 0, 99) || 10;
    this.store.tasks.set(
      previous.map((t) => (t.id === task.id ? { ...t, status, percentComplete: percent } : t)),
    );
    this.api.update(projectId, task.id, { status, percentComplete: percent }).subscribe({
      next: () => this.store.reloadTasks(),
      error: (err) => {
        this.store.tasks.set(previous);
        this.snack.open(errorMessage(err, 'No se pudo mover la tarea'), 'OK');
      },
    });
  }

  remove(task: Task): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    this.dialog
      .open(ConfirmDialog, {
        data: { title: 'Eliminar tarea', message: `¿Eliminar "${task.code} · ${task.title}"? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', danger: true },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.remove(projectId, task.id).subscribe({
          next: () => {
            this.snack.open('Tarea eliminada', 'OK');
            this.store.reloadTasks();
          },
          error: (err) => this.snack.open(errorMessage(err, 'No se pudo eliminar la tarea'), 'OK'),
        });
      });
  }
}
