import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BacklogApi } from '../../core/api/backlog.api';
import { errorMessage } from '../../core/errors';
import { taskProgress } from '../../core/metrics';
import { BacklogItem, PBI_STATUSES, PBI_TYPES, PbiStatus, PbiType, SPRINT_CAPACITY, Task, pbiInfo } from '../../core/models';
import { ProjectStore } from '../../core/project.store';
import { formatShort } from '../../core/util/dates';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { initialsOf } from '../../shared/util';
import { TaskDialog } from '../tasks/task.dialog';
import { BacklogDialog } from './backlog.dialog';
import { SprintDialog } from './sprint.dialog';

@Component({
  selector: 'app-backlog',
  imports: [MatIconModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Product Backlog · {{ store.project()?.name }}</h1>
          <div class="sub">{{ store.backlog().length }} ítems · capacidad de {{ capacity }} puntos por sprint</div>
        </div>
        <span class="spacer"></span>
        <button class="btn ghost" (click)="newSprint()"><mat-icon>flag</mat-icon>Nuevo sprint</button>
        <button class="btn" (click)="openItem()"><mat-icon>add</mat-icon>Nuevo ítem</button>
      </div>

      @if (sprintLoads().length) {
        <div class="loads">
          @for (s of sprintLoads(); track s.id) {
            <div class="load" [class.over]="s.points > capacity">
              <div class="row">
                <b>Sprint {{ s.number }}</b>
                <span class="num">{{ s.points }}/{{ capacity }} pts</span>
              </div>
              <div class="bar" [class]="s.points > capacity ? 'rojo' : s.points >= capacity * 0.85 ? 'ambar' : ''">
                <span [style.width.%]="Math.min(100, (s.points / capacity) * 100)"></span>
              </div>
              <div class="small muted">{{ s.done }} pts completados</div>
            </div>
          }
        </div>
      }

      <div class="filters">
        <div class="chips">
          <button class="chip-btn" [class.active]="!filterType()" (click)="filterType.set(null)">Todos</button>
          @for (t of types; track t.value) {
            <button class="chip-btn" [class.active]="filterType() === t.value" [title]="t.label" (click)="filterType.set(t.value)">{{ t.code }}</button>
          }
        </div>
        <label class="filter">
          <span class="muted small">Sprint</span>
          <select [value]="filterSprint()" (change)="filterSprint.set($any($event.target).value)">
            <option value="">Todos</option>
            <option value="none">Sin sprint</option>
            @for (s of store.sprints(); track s.id) { <option [value]="s.id">Sprint {{ s.number }}</option> }
          </select>
        </label>
      </div>

      @if (!store.backlog().length) {
        <div class="card empty">
          <mat-icon>list_alt</mat-icon>
          <p>El backlog está vacío. Agrega la primera épica o historia de usuario.</p>
          <p style="margin-top:14px"><button class="btn" (click)="openItem()"><mat-icon>add</mat-icon>Nuevo ítem</button></p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="t">
            <thead>
              <tr>
                <th></th><th>Tipo · ID</th><th>Título</th><th>Descripción</th><th>Criterios de aceptación</th><th>Prioridad</th>
                <th>Estim.</th><th>Responsables</th><th>Sprint</th><th>Fase</th><th>Status</th><th>Inicio</th><th>Fin</th><th>Dependencia</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (i of filtered(); track i.id) {
                <tr class="clickable" (click)="toggle(i.id)">
                  <td class="nowrap"><mat-icon class="chev">{{ expanded() === i.id ? 'expand_more' : 'chevron_right' }}</mat-icon></td>
                  <td class="nowrap"><span class="badge" [class]="i.type">{{ code(i.type) }}</span> <b>{{ i.code }}</b></td>
                  <td class="wrap"><b>{{ i.title }}</b></td>
                  <td class="wrap clamp">{{ i.description || '—' }}</td>
                  <td class="wrap clamp">{{ i.acceptanceCriteria || '—' }}</td>
                  <td class="nowrap"><span class="badge" [class]="i.priority">{{ cap(i.priority) }}</span></td>
                  <td class="num nowrap">{{ num(i.estimation) }}</td>
                  <td>
                    <span class="avatars">
                      @for (id of i.responsableIds; track id) { <span class="avatar sm" [title]="name(id)">{{ ini(name(id)) }}</span> }
                      @empty { — }
                    </span>
                  </td>
                  <td class="nowrap">{{ sprintLabel(i.sprintId) }}</td>
                  <td class="nowrap">{{ phaseName(i.phaseId) }}</td>
                  <td class="nowrap" (click)="$event.stopPropagation()">
                    <select class="status" [class]="i.status" [value]="i.status" (change)="setStatus(i, $any($event.target).value)" [attr.aria-label]="'Status de ' + i.code">
                      @for (s of statuses; track s.value) { <option [value]="s.value" [selected]="s.value === i.status">{{ s.label }}</option> }
                    </select>
                  </td>
                  <td class="nowrap">{{ short(i.startDate) }}</td>
                  <td class="nowrap">{{ short(i.endDate) }}</td>
                  <td class="nowrap">{{ depCode(i.dependencyId) }}</td>
                  <td class="nowrap" (click)="$event.stopPropagation()">
                    <button class="icon-btn" (click)="openItem(i)" aria-label="Editar"><mat-icon>edit</mat-icon></button>
                    <button class="icon-btn" (click)="remove(i)" aria-label="Eliminar"><mat-icon>delete_outline</mat-icon></button>
                  </td>
                </tr>
                @if (expanded() === i.id) {
                  <tr class="detail">
                    <td></td>
                    <td colspan="14">
                      <div class="linked">
                        <div class="lh">
                          <b>Tareas vinculadas del cronograma</b>
                          <span class="muted small">{{ tasksOf(i.id).length }} {{ tasksOf(i.id).length === 1 ? 'tarea' : 'tareas' }}
                            @if (tasksOf(i.id).length) { · avance {{ itemProgress(i.id) }}% }</span>
                          <span class="spacer"></span>
                          <button class="btn ghost" (click)="addTask(i)"><mat-icon>add</mat-icon>Agregar tarea a este ítem</button>
                        </div>
                        @for (t of tasksOf(i.id); track t.id) {
                          <div class="lt">
                            <span class="code">{{ t.code }}</span>
                            <span class="title">{{ t.title }}</span>
                            <span class="muted small">{{ name(t.responsibleId) }}</span>
                            <span class="badge" [class]="t.status">{{ statusLabel(t) }}</span>
                            <span class="num small">{{ progress(t) }}%</span>
                          </div>
                        } @empty {
                          <div class="muted small">Este ítem aún no tiene tareas en el cronograma.</div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr><td colspan="15" class="empty">No hay ítems con los filtros seleccionados.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .loads { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .load { background: var(--surface); border-radius: var(--radius); padding: 12px 14px; }
    .load.over { background: var(--coral-bg); }
    .load .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .filters { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
    .filter { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; }
    .filter select, select.status { font: inherit; font-size: 12.5px; border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; background: #fff; }
    select.status { font-weight: 600; }
    select.status.done { background: var(--teal-bg); color: var(--teal); border-color: transparent; }
    select.status.doing, select.status.in_progress { background: var(--amber-bg); color: var(--amber); border-color: transparent; }
    .chev { font-size: 20px; width: 20px; height: 20px; color: var(--ink-muted); vertical-align: middle; }
    .clamp { display: table-cell; }
    .clamp { white-space: pre-line; }
    td.clamp { max-width: 260px; color: var(--ink-soft); }
    .avatars { display: inline-flex; }
    .avatars .avatar { margin-left: -5px; border: 2px solid #fff; }
    .avatars .avatar:first-child { margin-left: 0; }
    tr.detail td { background: #fafafe; }
    .linked { padding: 4px 0 8px; }
    .lh { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .lt { display: flex; align-items: center; gap: 12px; padding: 7px 10px; background: #fff; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 6px; }
    .lt .title { flex: 1; }
    .code { font-size: 11px; font-weight: 700; color: var(--purple); background: var(--lavender); border-radius: 6px; padding: 1px 7px; }
    td.empty { text-align: center; color: var(--ink-soft); padding: 28px; }
  `,
})
export class BacklogPage {
  protected store = inject(ProjectStore);
  private api = inject(BacklogApi);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  protected Math = Math;
  protected types = PBI_TYPES;
  protected statuses = PBI_STATUSES;
  protected capacity = SPRINT_CAPACITY;
  protected expanded = signal<string | null>(null);
  protected filterType = signal<PbiType | null>(null);
  protected filterSprint = signal('');

  protected filtered = computed(() => {
    const type = this.filterType();
    const sprint = this.filterSprint();
    return this.store.backlog().filter((i) => {
      if (type && i.type !== type) return false;
      if (sprint === 'none') return !i.sprintId;
      if (sprint) return i.sprintId === sprint;
      return true;
    });
  });

  protected sprintLoads = computed(() =>
    [...this.store.sprints()]
      .sort((a, b) => a.number - b.number)
      .map((s) => {
        const own = this.store.backlog().filter((i) => i.sprintId === s.id);
        return {
          id: s.id,
          number: s.number,
          points: own.reduce((sum, i) => sum + (Number(i.estimation) || 0), 0),
          done: own.filter((i) => i.status === 'done').reduce((sum, i) => sum + (Number(i.estimation) || 0), 0),
        };
      }),
  );

  protected num = (v: unknown) => Number(v) || 0;
  protected short = formatShort;
  protected ini = initialsOf;
  protected progress = taskProgress;
  protected code = (t: PbiType) => pbiInfo(t).code;
  protected cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  protected name = (id: string) => this.store.names().get(id) ?? '—';
  protected sprintLabel = (id: string | null) => {
    const s = this.store.sprints().find((x) => x.id === id);
    return s ? `Sprint ${s.number}` : '—';
  };
  protected phaseName = (id: string | null) => this.store.phases().find((p) => p.id === id)?.name ?? '—';
  protected depCode = (id: string | null) => this.store.backlog().find((b) => b.id === id)?.code ?? '—';
  protected statusLabel = (t: Task) => (t.status === 'en_progreso' ? 'En progreso' : this.cap(t.status));

  protected tasksOf = (itemId: string) => this.store.tasks().filter((t) => t.backlogItemId === itemId);
  protected itemProgress = (itemId: string) => {
    const list = this.tasksOf(itemId);
    return list.length ? Math.round(list.reduce((s, t) => s + taskProgress(t), 0) / list.length) : 0;
  };

  toggle(id: string): void {
    this.expanded.update((cur) => (cur === id ? null : id));
  }

  openItem(item?: BacklogItem): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    this.dialog
      .open(BacklogDialog, { data: { projectId, item }, width: '780px', maxHeight: '92vh', disableClose: true })
      .afterClosed()
      .subscribe((saved?: BacklogItem) => {
        if (saved) {
          this.snack.open(item ? 'Ítem actualizado' : 'Ítem creado', 'OK');
          this.store.reloadBacklog();
        }
      });
  }

  newSprint(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    const next = Math.max(-1, ...this.store.sprints().map((s) => s.number)) + 1;
    this.dialog
      .open(SprintDialog, { data: { projectId, nextNumber: next } })
      .afterClosed()
      .subscribe((sp) => {
        if (sp) {
          this.snack.open(`Sprint ${sp.number} creado`, 'OK');
          this.store.reloadSprints();
        }
      });
  }

  /** "Agregar tarea a este ítem": abre el formulario de tarea con el ítem ya vinculado. */
  addTask(item: BacklogItem): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    this.dialog
      .open(TaskDialog, { data: { projectId, backlogItemId: item.id }, width: '720px', maxHeight: '92vh', disableClose: true })
      .afterClosed()
      .subscribe((task) => {
        if (task) {
          this.snack.open('Tarea creada y vinculada', 'OK');
          this.store.reloadTasks();
        }
      });
  }

  setStatus(item: BacklogItem, status: PbiStatus): void {
    const projectId = this.store.projectId();
    if (!projectId || item.status === status) return;
    const previous = this.store.backlog();
    this.store.backlog.set(previous.map((b) => (b.id === item.id ? { ...b, status } : b)));
    this.api.update(projectId, item.id, { status }).subscribe({
      error: (err) => {
        this.store.backlog.set(previous);
        this.snack.open(errorMessage(err, 'No se pudo cambiar el status'), 'OK');
      },
    });
  }

  remove(item: BacklogItem): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    this.dialog
      .open(ConfirmDialog, {
        data: { title: 'Eliminar ítem', message: `¿Eliminar "${item.code} · ${item.title}"? Las tareas vinculadas se conservarán sin ítem.`, confirmLabel: 'Eliminar', danger: true },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.remove(projectId, item.id).subscribe({
          next: () => {
            this.snack.open('Ítem eliminado', 'OK');
            this.store.reloadBacklog();
            this.store.reloadTasks();
          },
          error: (err) => this.snack.open(errorMessage(err, 'No se pudo eliminar el ítem'), 'OK'),
        });
      });
  }
}
