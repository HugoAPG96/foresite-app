import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import { BacklogApi } from '../../core/api/backlog.api';
import { PlanningApi } from '../../core/api/planning.api';
import { ProjectsApi } from '../../core/api/projects.api';
import { TasksApi } from '../../core/api/tasks.api';
import { UsersApi } from '../../core/api/users.api';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { FIBONACCI, PBI_TYPES, PRIORITIES, PbiPriority, PbiType, Project, pbiInfo } from '../../core/models';
import { formatDate, parseDate, toIsoDate } from '../../core/util/dates';

interface DraftPhase { tempId: string; name: string; }
interface DraftTask {
  tempId: string; title: string; phaseTempId: string; responsibleId: string; accountableId: string; start: Date; end: Date;
}
interface DraftItem {
  tempId: string; type: PbiType; title: string; priority: PbiPriority; estimation: number; responsableIds: string[];
}

const DEFAULT_PHASES = [
  'Planificación y gestión del proyecto', 'Análisis y diseño', 'Desarrollo backend',
  'Desarrollo frontend', 'Pruebas', 'Despliegue y cierre',
];

function dateRange(g: AbstractControl): ValidationErrors | null {
  const s = g.get('startDate')?.value as Date | null;
  const e = g.get('endDate')?.value as Date | null;
  return s && e && e < s ? { range: true } : null;
}
const uid = () => Math.random().toString(36).slice(2, 10);

@Component({
  selector: 'app-new-project-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Nuevo proyecto</h2>
    <mat-dialog-content class="wiz">
      <mat-stepper linear #stepper [orientation]="'horizontal'">
        <!-- ============ Paso 1 · Acta de constitución ============ -->
        <mat-step [stepControl]="acta" label="Acta">
          <form [formGroup]="acta" class="dialog-form" novalidate>
            <div class="step-title">Acta de constitución</div>
            <mat-form-field appearance="outline">
              <mat-label>Nombre del proyecto</mat-label>
              <input matInput formControlName="name" />
              @if (acta.controls.name.hasError('required')) { <mat-error>El nombre es obligatorio</mat-error> }
              @else if (acta.controls.name.hasError('maxlength')) { <mat-error>Máximo 120 caracteres</mat-error> }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Objetivo del proyecto</mat-label>
              <textarea matInput rows="2" formControlName="objective"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Alcance</mat-label>
              <textarea matInput rows="2" formControlName="scope" placeholder="Qué incluye y qué queda fuera"></textarea>
            </mat-form-field>
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio</mat-label>
                <input matInput [matDatepicker]="a1" formControlName="startDate" readonly (click)="a1.open()" />
                <mat-datepicker-toggle matIconSuffix [for]="a1" /><mat-datepicker #a1 />
                @if (acta.controls.startDate.hasError('required')) { <mat-error>Selecciona la fecha de inicio</mat-error> }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fecha límite</mat-label>
                <input matInput [matDatepicker]="a2" formControlName="endDate" readonly (click)="a2.open()" />
                <mat-datepicker-toggle matIconSuffix [for]="a2" /><mat-datepicker #a2 />
                @if (acta.controls.endDate.hasError('required')) { <mat-error>Selecciona la fecha límite</mat-error> }
              </mat-form-field>
            </div>
            @if (acta.hasError('range')) { <div class="hint-line err">La fecha límite no puede ser anterior a la de inicio.</div> }
            <mat-form-field appearance="outline">
              <mat-label>Integrantes del equipo</mat-label>
              <mat-select formControlName="memberIds" multiple>
                @for (u of users.all(); track u.id) { <mat-option [value]="u.id">{{ u.name }} · {{ u.email }}</mat-option> }
              </mat-select>
              <mat-hint>Tú siempre formas parte del proyecto.</mat-hint>
            </mat-form-field>
          </form>
          <div class="nav"><span class="spacer"></span><button class="btn" matStepperNext (click)="acta.markAllAsTouched()">Continuar<mat-icon>arrow_forward</mat-icon></button></div>
        </mat-step>

        <!-- ============ Paso 2 · Cronograma RACI ============ -->
        <mat-step label="Cronograma RACI" optional>
          <div class="dialog-form">
            <div class="step-title">Cronograma RACI</div>
            <div class="hint-line">Define las fases y las tareas principales. Podrás completar Consultado/Informado y más tareas luego, desde “Tareas”.</div>

            <div class="label">Fases</div>
            <div class="phase-add">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Nueva fase</mat-label>
                <input matInput [formControl]="phaseName" (keydown.enter)="$event.preventDefault(); addPhase()" />
              </mat-form-field>
              <button type="button" class="btn ghost" (click)="addPhase()"><mat-icon>add</mat-icon>Agregar</button>
              <button type="button" class="btn ghost" (click)="useDefaultPhases()" [disabled]="phases().length > 0">Usar fases sugeridas</button>
            </div>
            <div class="chips" style="margin:8px 0 14px">
              @for (p of phases(); track p.tempId; let i = $index) {
                <span class="chip-btn active">{{ i + 1 }}. {{ p.name }}
                  <mat-icon class="x" (click)="removePhase(p.tempId)">close</mat-icon></span>
              } @empty { <span class="muted small">Aún no hay fases.</span> }
            </div>

            <div class="label">Agregar tarea</div>
            <form [formGroup]="taskForm" novalidate>
              <mat-form-field appearance="outline">
                <mat-label>Título de la tarea</mat-label>
                <input matInput formControlName="title" />
                @if (taskForm.controls.title.hasError('maxlength')) { <mat-error>Máximo 160 caracteres</mat-error> }
              </mat-form-field>
              <div class="row three">
                <mat-form-field appearance="outline">
                  <mat-label>Fase</mat-label>
                  <mat-select formControlName="phaseTempId">
                    @for (p of phases(); track p.tempId) { <mat-option [value]="p.tempId">{{ p.name }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Responsable (R)</mat-label>
                  <mat-select formControlName="responsibleId">
                    @for (u of members(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>A cargo (A)</mat-label>
                  <mat-select formControlName="accountableId">
                    @for (u of members(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Inicio</mat-label>
                  <input matInput [matDatepicker]="t1" formControlName="start" readonly (click)="t1.open()" />
                  <mat-datepicker-toggle matIconSuffix [for]="t1" /><mat-datepicker #t1 />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Vencimiento</mat-label>
                  <input matInput [matDatepicker]="t2" formControlName="end" readonly (click)="t2.open()" />
                  <mat-datepicker-toggle matIconSuffix [for]="t2" /><mat-datepicker #t2 />
                </mat-form-field>
              </div>
              @if (taskError()) { <div class="hint-line err">{{ taskError() }}</div> }
              <button type="button" class="btn ghost" (click)="addTask()"><mat-icon>add</mat-icon>Agregar tarea</button>
            </form>

            @if (tasks().length) {
              <div class="table-wrap" style="margin-top:12px">
                <table class="t">
                  <thead><tr><th>Título</th><th>Fase</th><th>R</th><th>A</th><th>Inicio</th><th>Fin</th><th></th></tr></thead>
                  <tbody>
                    @for (t of tasks(); track t.tempId) {
                      <tr>
                        <td>{{ t.title }}</td><td>{{ phaseLabel(t.phaseTempId) }}</td>
                        <td>{{ userName(t.responsibleId) }}</td><td>{{ userName(t.accountableId) }}</td>
                        <td class="nowrap">{{ iso(t.start) }}</td><td class="nowrap">{{ iso(t.end) }}</td>
                        <td><button class="icon-btn" type="button" (click)="removeTask(t.tempId)" aria-label="Quitar"><mat-icon>close</mat-icon></button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div class="nav">
            <button class="btn ghost" matStepperPrevious><mat-icon>arrow_back</mat-icon>Atrás</button>
            <span class="spacer"></span>
            <button class="btn" matStepperNext>Continuar<mat-icon>arrow_forward</mat-icon></button>
          </div>
        </mat-step>

        <!-- ============ Paso 3 · Product backlog ============ -->
        <mat-step label="Backlog" optional>
          <div class="dialog-form">
            <div class="step-title">Product backlog</div>
            <div class="hint-line">Agrega los primeros ítems. El detalle (Como/Quiero/Para, criterios, sprint, fechas) se completa luego en “Backlog”.</div>
            <form [formGroup]="itemForm" novalidate>
              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo</mat-label>
                  <mat-select formControlName="type">
                    @for (t of types; track t.value) { <mat-option [value]="t.value">{{ t.code }} · {{ t.label }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Título</mat-label>
                  <input matInput formControlName="title" />
                  @if (itemForm.controls.title.hasError('maxlength')) { <mat-error>Máximo 160 caracteres</mat-error> }
                </mat-form-field>
              </div>
              <div class="row three">
                <mat-form-field appearance="outline">
                  <mat-label>Prioridad</mat-label>
                  <mat-select formControlName="priority">
                    @for (p of priorities; track p.value) { <mat-option [value]="p.value">{{ p.label }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Estimación (pts)</mat-label>
                  <mat-select formControlName="estimation">
                    <mat-option [value]="0">0</mat-option>
                    @for (f of fibonacci; track f) { <mat-option [value]="f">{{ f }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Responsables</mat-label>
                  <mat-select formControlName="responsableIds" multiple>
                    @for (u of members(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
                  </mat-select>
                </mat-form-field>
              </div>
              @if (itemError()) { <div class="hint-line err">{{ itemError() }}</div> }
              <button type="button" class="btn ghost" (click)="addItem()"><mat-icon>add</mat-icon>Agregar ítem</button>
            </form>

            @if (items().length) {
              <div class="table-wrap" style="margin-top:12px">
                <table class="t">
                  <thead><tr><th>Tipo</th><th>Título</th><th>Prioridad</th><th>Pts</th><th>Responsables</th><th></th></tr></thead>
                  <tbody>
                    @for (i of items(); track i.tempId) {
                      <tr>
                        <td><span class="badge" [class]="i.type">{{ code(i.type) }}</span></td><td>{{ i.title }}</td>
                        <td><span class="badge" [class]="i.priority">{{ i.priority }}</span></td><td class="num">{{ i.estimation }}</td>
                        <td>{{ userNames(i.responsableIds) }}</td>
                        <td><button class="icon-btn" type="button" (click)="removeItem(i.tempId)" aria-label="Quitar"><mat-icon>close</mat-icon></button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div class="nav">
            <button class="btn ghost" matStepperPrevious><mat-icon>arrow_back</mat-icon>Atrás</button>
            <span class="spacer"></span>
            <button class="btn" matStepperNext>Continuar<mat-icon>arrow_forward</mat-icon></button>
          </div>
        </mat-step>

        <!-- ============ Paso 4 · Confirmación ============ -->
        <mat-step label="Confirmación">
          <div class="dialog-form">
            <div class="step-title">Confirmación</div>
            <div class="summary">
              <div class="s-item"><span class="muted small">Proyecto</span><b>{{ acta.controls.name.value || '—' }}</b></div>
              <div class="s-item"><span class="muted small">Periodo</span><b>{{ iso(acta.controls.startDate.value) }} → {{ iso(acta.controls.endDate.value) }}</b></div>
              <div class="s-item"><span class="muted small">Integrantes</span><b>{{ members().length }}</b></div>
              <div class="s-item"><span class="muted small">Fases</span><b>{{ phases().length }}</b></div>
              <div class="s-item"><span class="muted small">Tareas RACI</span><b>{{ tasks().length }}</b></div>
              <div class="s-item"><span class="muted small">Ítems de backlog</span><b>{{ items().length }}</b></div>
            </div>
            @if (creating()) { <div class="hint-line">{{ progress() }}</div> }
            @if (error()) { <div class="hint-line err">{{ error() }}</div> }
          </div>
          <div class="nav">
            <button class="btn ghost" matStepperPrevious [disabled]="creating()"><mat-icon>arrow_back</mat-icon>Atrás</button>
            <span class="spacer"></span>
            <button class="btn" (click)="create()" [disabled]="creating()">
              <mat-icon>check</mat-icon>{{ creating() ? 'Creando…' : 'Crear proyecto' }}
            </button>
          </div>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>
    <mat-dialog-actions align="start">
      <button class="btn ghost" mat-dialog-close [disabled]="creating()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .wiz { padding-top: 0 !important; }
    .step-title { font-size: 15px; font-weight: 600; margin: 8px 0 12px; }
    .nav { display: flex; gap: 8px; margin-top: 14px; }
    .phase-add { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
    .phase-add mat-form-field { flex: 1; min-width: 200px; }
    .phase-add .btn { margin-top: 4px; }
    .chip-btn { display: inline-flex; align-items: center; gap: 4px; cursor: default; }
    .chip-btn .x { font-size: 15px; width: 15px; height: 15px; cursor: pointer; margin-left: 2px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 8px 0 12px; }
    .s-item { background: var(--surface); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 2px; }
    @media (max-width: 700px) { .summary { grid-template-columns: 1fr 1fr; } }
  `,
})
export class NewProjectDialog {
  private fb = inject(FormBuilder);
  private ref = inject<MatDialogRef<NewProjectDialog, Project>>(MatDialogRef);
  private projectsApi = inject(ProjectsApi);
  private planningApi = inject(PlanningApi);
  private tasksApi = inject(TasksApi);
  private backlogApi = inject(BacklogApi);
  protected users = inject(UsersApi);
  private auth = inject(AuthService);

  protected types = PBI_TYPES;
  protected priorities = PRIORITIES;
  protected fibonacci = FIBONACCI;
  protected iso = (d: Date | null) => (d ? formatDate(toIsoDate(d)) : '—');
  protected code = (t: PbiType) => pbiInfo(t).code;

  protected acta = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(120)]],
      objective: [''],
      scope: [''],
      startDate: [null as Date | null, [Validators.required]],
      endDate: [null as Date | null, [Validators.required]],
      memberIds: [[this.auth.user()?.id ?? ''].filter(Boolean) as string[]],
    },
    { validators: dateRange },
  );

  protected phaseName = this.fb.nonNullable.control('', [Validators.maxLength(120)]);
  protected phases = signal<DraftPhase[]>([]);
  protected taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.maxLength(160)]],
    phaseTempId: [''],
    responsibleId: [''],
    accountableId: [''],
    start: [null as Date | null],
    end: [null as Date | null],
  });
  protected tasks = signal<DraftTask[]>([]);
  protected taskError = signal<string | null>(null);

  protected itemForm = this.fb.nonNullable.group({
    type: ['hu' as PbiType],
    title: ['', [Validators.maxLength(160)]],
    priority: ['media' as PbiPriority],
    estimation: [0],
    responsableIds: [[] as string[]],
  });
  protected items = signal<DraftItem[]>([]);
  protected itemError = signal<string | null>(null);

  protected creating = signal(false);
  protected progress = signal('');
  protected error = signal<string | null>(null);

  /** Integrantes elegidos en el paso 1 (siempre incluye al usuario actual). */
  protected members = computed(() => {
    const ids = new Set(this.memberIdsSig());
    const me = this.auth.user();
    if (me) ids.add(me.id);
    const known = this.users.all();
    const list = known.filter((u) => ids.has(u.id));
    if (me && !list.some((u) => u.id === me.id)) list.unshift({ id: me.id, name: me.name, email: me.email });
    return list;
  });
  private memberIdsSig = signal<string[]>(this.acta.controls.memberIds.value ?? []);

  constructor() {
    if (!this.users.all().length) this.users.list().subscribe({ error: () => undefined });
    this.acta.controls.memberIds.valueChanges.subscribe((v) => this.memberIdsSig.set(v ?? []));
  }

  protected userName = (id: string) => this.members().find((u) => u.id === id)?.name ?? '—';
  protected userNames = (ids: string[]) => (ids.length ? ids.map((i) => this.userName(i)).join(', ') : '—');
  protected phaseLabel = (tempId: string) => this.phases().find((p) => p.tempId === tempId)?.name ?? '—';

  addPhase(): void {
    const name = this.phaseName.value.trim();
    if (!name) return;
    this.phases.update((l) => [...l, { tempId: uid(), name }]);
    this.phaseName.reset('');
  }
  useDefaultPhases(): void {
    this.phases.set(DEFAULT_PHASES.map((name) => ({ tempId: uid(), name })));
  }
  removePhase(tempId: string): void {
    this.phases.update((l) => l.filter((p) => p.tempId !== tempId));
    this.tasks.update((l) => l.filter((t) => t.phaseTempId !== tempId));
  }

  addTask(): void {
    const v = this.taskForm.getRawValue();
    this.taskError.set(null);
    if (!v.title?.trim()) return this.taskError.set('Escribe el título de la tarea.');
    if (!v.phaseTempId) return this.taskError.set('Selecciona la fase (agrega una fase primero si no hay).');
    if (!v.responsibleId || !v.accountableId) return this.taskError.set('Selecciona el responsable (R) y quién aprueba (A).');
    if (!v.start || !v.end) return this.taskError.set('Selecciona las fechas de inicio y vencimiento.');
    if (v.end < v.start) return this.taskError.set('El vencimiento no puede ser anterior al inicio.');
    this.tasks.update((l) => [...l, {
      tempId: uid(), title: v.title!.trim(), phaseTempId: v.phaseTempId!, responsibleId: v.responsibleId!,
      accountableId: v.accountableId!, start: v.start!, end: v.end!,
    }]);
    this.taskForm.patchValue({ title: '', start: null, end: null });
  }
  removeTask(tempId: string): void {
    this.tasks.update((l) => l.filter((t) => t.tempId !== tempId));
  }

  addItem(): void {
    const v = this.itemForm.getRawValue();
    this.itemError.set(null);
    if (!v.title?.trim()) return this.itemError.set('Escribe el título del ítem.');
    if (!v.responsableIds?.length) return this.itemError.set('Asigna al menos un responsable.');
    this.items.update((l) => [...l, {
      tempId: uid(), type: v.type!, title: v.title!.trim(), priority: v.priority!, estimation: Number(v.estimation) || 0,
      responsableIds: v.responsableIds!,
    }]);
    this.itemForm.patchValue({ title: '', estimation: 0 });
  }
  removeItem(tempId: string): void {
    this.items.update((l) => l.filter((i) => i.tempId !== tempId));
  }

  /** Crea el proyecto y, en orden, sus fases, tareas e ítems de backlog. */
  create(): void {
    if (this.acta.invalid) {
      this.acta.markAllAsTouched();
      this.error.set('Revisa el Acta de constitución: faltan datos obligatorios.');
      return;
    }
    const a = this.acta.getRawValue();
    this.creating.set(true);
    this.error.set(null);
    this.progress.set('Creando el proyecto…');

    this.projectsApi.create({
      name: a.name.trim(),
      objective: a.objective?.trim() || undefined,
      scope: a.scope?.trim() || undefined,
      startDate: toIsoDate(a.startDate!),
      endDate: toIsoDate(a.endDate!),
      memberIds: this.members().map((m) => m.id),
    }).subscribe({
      next: (project) => this.populate(project),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.creating.set(false);
      },
    });
  }

  private populate(project: Project): void {
    let failures = 0;
    const phaseMap = new Map<string, string>();

    this.progress.set('Creando fases…');
    from(this.phases()).pipe(
      concatMap((ph) =>
        this.planningApi.createPhase(project.id, ph.name).pipe(
          map((real) => phaseMap.set(ph.tempId, real.id)),
          catchError(() => { failures++; return of(null); }),
        ),
      ),
      toArray(),
      concatMap(() => {
        this.progress.set('Creando tareas del cronograma…');
        return from(this.tasks()).pipe(
          concatMap((t) => {
            const phaseId = phaseMap.get(t.phaseTempId);
            if (!phaseId) { failures++; return of(null); }
            return this.tasksApi.create(project.id, {
              phaseId, title: t.title, responsibleId: t.responsibleId, accountableId: t.accountableId,
              startDate: toIsoDate(t.start), endDate: toIsoDate(t.end),
            }).pipe(catchError(() => { failures++; return of(null); }));
          }),
          toArray(),
        );
      }),
      concatMap(() => {
        this.progress.set('Creando ítems del backlog…');
        return from(this.items()).pipe(
          concatMap((i) =>
            this.backlogApi.create(project.id, {
              type: i.type, title: i.title, priority: i.priority, estimation: i.estimation, responsableIds: i.responsableIds,
            }).pipe(catchError(() => { failures++; return of(null); })),
          ),
          toArray(),
        );
      }),
    ).subscribe({
      next: () => {
        this.creating.set(false);
        this.ref.close(project);
        if (failures) console.warn(`[Foresite] ${failures} elemento(s) no se pudieron crear; puedes agregarlos desde Tareas/Backlog.`);
      },
      error: () => {
        // El proyecto ya existe: se entra a él para completar lo que falte.
        this.creating.set(false);
        this.ref.close(project);
      },
    });
  }
}
