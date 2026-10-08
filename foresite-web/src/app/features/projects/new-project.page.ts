import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import { BacklogApi } from '../../core/api/backlog.api';
import { PlanningApi } from '../../core/api/planning.api';
import { ProjectsApi } from '../../core/api/projects.api';
import { TasksApi } from '../../core/api/tasks.api';
import { UsersApi } from '../../core/api/users.api';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { PBI_TYPES, PRIORITIES, PbiPriority, PbiType, Project, pbiInfo } from '../../core/models';
import { formatDate, toIsoDate } from '../../core/util/dates';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { PeopleSelect } from '../../shared/people-select';
import { BacklogDraftDialog, DraftItem, DraftPhase } from './backlog-draft.dialog';

interface DraftTask {
  tempId: string;
  phaseTempId: string;
  title: string;
  responsibleId: string;
  accountableId: string;
  consultedIds: string[];
  informedIds: string[];
  start: Date | null;
  end: Date | null;
}

/** Fila del cronograma que se está agregando o editando (solo una a la vez). */
interface RowEdit {
  draft: DraftTask;
  isNew: boolean;
  error: string | null;
}

const DEFAULT_PHASES = [
  'Planificación y gestión del proyecto', 'Análisis y diseño', 'Desarrollo backend',
  'Desarrollo frontend', 'Pruebas', 'Despliegue y cierre',
];

const STEP_LABELS = ['Acta de constitución', 'Cronograma RACI', 'Product Backlog', 'Confirmación'];

function dateRange(g: AbstractControl): ValidationErrors | null {
  const s = g.get('startDate')?.value as Date | null;
  const e = g.get('endDate')?.value as Date | null;
  return s && e && e < s ? { range: true } : null;
}
const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Asistente "Nuevo proyecto" (página completa). Todo se arma en el navegador como borrador y recién
 * al confirmar se crean, en orden, el proyecto, las fases, las tareas RACI y los ítems del backlog.
 */
@Component({
  selector: 'app-new-project-page',
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatIconModule,
    PeopleSelect,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Nuevo proyecto</h1>
          <div class="sub">Define el acta, el cronograma RACI y el backlog inicial. Todo se puede completar después.</div>
        </div>
        <span class="spacer"></span>
        <button type="button" class="btn ghost" (click)="cancel()" [disabled]="creating()">Cancelar</button>
      </div>

      <ol class="steps" aria-label="Pasos del asistente">
        @for (label of labels; track label; let i = $index) {
          <li [class.active]="step() === i" [class.done]="step() > i">
            <button type="button" (click)="goTo(i)" [disabled]="i > step() || creating()" [attr.aria-current]="step() === i ? 'step' : null">
              <span class="n">@if (step() > i) { <mat-icon>check</mat-icon> } @else { {{ i + 1 }} }</span>{{ label }}
            </button>
          </li>
        }
      </ol>

      <div class="panel">
        <!-- ================= Paso 1 · Acta de constitución ================= -->
        @if (step() === 0) {
          <form [formGroup]="acta" class="dialog-form acta" novalidate>
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
              <mat-hint>Tú (Scrum Master) siempre formas parte del proyecto. Después podrás agregar más por correo.</mat-hint>
            </mat-form-field>
          </form>
        }

        <!-- ================= Paso 2 · Cronograma RACI ================= -->
        @if (step() === 1) {
          <p class="lead">Define quién es Responsable, A cargo, Consultado e Informado por tarea.</p>

          @if (!phases().length) {
            <div class="empty-raci">
              <mat-icon>account_tree</mat-icon>
              <p>Aún no hay fases. Crea la primera o parte de una propuesta.</p>
              <div class="actions">
                <button type="button" class="btn ghost round" (click)="useDefaultPhases()">Usar fases sugeridas</button>
                <button type="button" class="btn round" (click)="addPhase()"><mat-icon>add</mat-icon>Agregar fase</button>
              </div>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="t raci">
                <thead>
                  <tr>
                    <th class="c-id">ID</th><th class="c-title">Título de tarea</th><th class="c-p">Responsable</th>
                    <th class="c-p">A cargo</th><th class="c-p">Consultado</th><th class="c-p">Informado</th>
                    <th class="c-d">Inicio</th><th class="c-d">Fin</th><th class="c-act">Acciones</th>
                  </tr>
                </thead>
                @for (ph of phases(); track ph.tempId; let pi = $index) {
                  <tbody>
                    <tr class="phase">
                      <td colspan="9">
                        <div class="ph">
                          @if (editPhaseId() === ph.tempId) {
                            <span class="ph-n">{{ pi + 1 }}.</span>
                            <input class="cell ph-input" [id]="'ph-' + ph.tempId" [value]="ph.name" maxlength="120"
                                   placeholder="Nombre de la fase" aria-label="Nombre de la fase" #pn
                                   (blur)="commitPhase(ph.tempId, pn.value)" (keydown.enter)="pn.blur()" />
                          } @else {
                            <b>{{ pi + 1 }}. {{ ph.name }}</b>
                            <button type="button" class="icon-btn sm" (click)="editPhase(ph.tempId)" aria-label="Renombrar fase"><mat-icon>edit</mat-icon></button>
                            <button type="button" class="icon-btn sm" (click)="removePhase(ph)" aria-label="Quitar fase"><mat-icon>delete_outline</mat-icon></button>
                          }
                        </div>
                      </td>
                    </tr>

                    @for (t of rowsOf(ph.tempId); track t.tempId; let ti = $index) {
                      @let r = row();
                      @if (r && r.draft.tempId === t.tempId) {
                        <tr class="edit">
                          <td class="c-id">{{ pi + 1 }}.{{ ti + 1 }}</td>
                          <td>
                            <input class="cell" [value]="r.draft.title" maxlength="160" placeholder="Título de la tarea" aria-label="Título de la tarea"
                                   (input)="setE('title', $any($event.target).value)" (keydown.enter)="confirmRow()" (keydown.escape)="cancelRow()" />
                          </td>
                          <td>
                            <select class="cell" aria-label="Responsable" (change)="setE('responsibleId', $any($event.target).value)">
                              <option value="" disabled [selected]="!r.draft.responsibleId">Respo.</option>
                              @for (m of members(); track m.id) { <option [value]="m.id" [selected]="m.id === r.draft.responsibleId">{{ first(m.name) }}</option> }
                            </select>
                          </td>
                          <td>
                            <select class="cell" aria-label="A cargo" (change)="setE('accountableId', $any($event.target).value)">
                              <option value="" disabled [selected]="!r.draft.accountableId">A cargo</option>
                              @for (m of members(); track m.id) { <option [value]="m.id" [selected]="m.id === r.draft.accountableId">{{ first(m.name) }}</option> }
                            </select>
                          </td>
                          <td><app-people-select [people]="members()" [value]="r.draft.consultedIds" placeholder="Cons." ariaLabel="Consultados" (changed)="setE('consultedIds', $event)" /></td>
                          <td><app-people-select [people]="members()" [value]="r.draft.informedIds" placeholder="Inform." ariaLabel="Informados" (changed)="setE('informedIds', $event)" /></td>
                          <td>
                            <input class="cell" [matDatepicker]="d1" [value]="r.draft.start" [max]="r.draft.end" readonly placeholder="dd/mm/aaaa"
                                   aria-label="Fecha de inicio" (click)="d1.open()" (dateChange)="setE('start', $event.value)" />
                            <mat-datepicker #d1 [startAt]="r.draft.start ?? actaStart()" />
                          </td>
                          <td>
                            <input class="cell" [matDatepicker]="d2" [value]="r.draft.end" [min]="r.draft.start" readonly placeholder="dd/mm/aaaa"
                                   aria-label="Fecha de fin" (click)="d2.open()" (dateChange)="setE('end', $event.value)" />
                            <mat-datepicker #d2 [startAt]="r.draft.end ?? r.draft.start ?? actaStart()" />
                          </td>
                          <td class="c-act">
                            <button type="button" class="icon-btn ok" (click)="confirmRow()" aria-label="Guardar tarea"><mat-icon>check</mat-icon></button>
                            <button type="button" class="icon-btn bad" (click)="cancelRow()" aria-label="Cancelar"><mat-icon>close</mat-icon></button>
                          </td>
                        </tr>
                        @if (r.error) { <tr class="row-err"><td></td><td colspan="8">{{ r.error }}</td></tr> }
                      } @else {
                        <tr>
                          <td class="c-id">{{ pi + 1 }}.{{ ti + 1 }}</td>
                          <td>{{ t.title }}</td>
                          <td [class.miss]="!t.responsibleId">{{ name(t.responsibleId) }}</td>
                          <td [class.miss]="!t.accountableId">{{ name(t.accountableId) }}</td>
                          <td>{{ names(t.consultedIds) }}</td>
                          <td>{{ names(t.informedIds) }}</td>
                          <td class="nowrap">{{ fmt(t.start) }}</td>
                          <td class="nowrap">{{ fmt(t.end) }}</td>
                          <td class="c-act">
                            <button type="button" class="icon-btn" (click)="editTask(t)" aria-label="Editar tarea"><mat-icon>edit</mat-icon></button>
                            <button type="button" class="icon-btn bad" (click)="removeTask(t)" aria-label="Quitar tarea"><mat-icon>close</mat-icon></button>
                          </td>
                        </tr>
                      }
                    }

                    <tr class="add">
                      <td colspan="9"><button type="button" class="link" (click)="startAdd(ph.tempId)"><mat-icon>add</mat-icon>Agregar tarea</button></td>
                    </tr>
                  </tbody>
                }
              </table>
            </div>
            <div class="below">
              <button type="button" class="btn ghost round" (click)="addPhase()"><mat-icon>add</mat-icon>Agregar fase</button>
              <span class="muted small">Integrantes precargados del acta · un solo Responsable y un solo A cargo por tarea.</span>
            </div>
          }
        }

        <!-- ================= Paso 3 · Product Backlog ================= -->
        @if (step() === 2) {
          <div class="bl-head">
            <p class="lead">Ítems del backlog: épicas, historias de usuario, spikes, bugs y enablers.</p>
            <button type="button" class="btn round" (click)="openItem()"><mat-icon>add</mat-icon>Agregar ítem</button>
          </div>

          <div class="quick">
            <span class="muted small">Agregado rápido</span>
            <select class="cell q-type" aria-label="Tipo" [value]="quickType()" (change)="quickType.set($any($event.target).value)">
              @for (t of types; track t.value) { <option [value]="t.value" [selected]="t.value === quickType()">{{ t.code }} · {{ t.label }}</option> }
            </select>
            <input class="cell q-title" placeholder="Título del ítem" aria-label="Título del ítem" maxlength="160" [value]="quickTitle()"
                   (input)="quickTitle.set($any($event.target).value)" (keydown.enter)="quickAdd()" />
            <select class="cell q-prio" aria-label="Prioridad" [value]="quickPriority()" (change)="quickPriority.set($any($event.target).value)">
              @for (p of priorities; track p.value) { <option [value]="p.value" [selected]="p.value === quickPriority()">{{ p.label }}</option> }
            </select>
            <button type="button" class="btn ghost" (click)="quickAdd()"><mat-icon>add</mat-icon>Agregar</button>
          </div>
          @if (quickError()) { <div class="hint-line err">{{ quickError() }}</div> }

          @if (items().length) {
            <div class="table-wrap">
              <table class="t bl">
                <thead>
                  <tr><th>Tipo · ID</th><th>Título</th><th>Fase</th><th>Prioridad</th><th>Estim.</th><th>Responsable</th><th class="c-act">Acciones</th></tr>
                </thead>
                <tbody>
                  @for (i of items(); track i.tempId) {
                    <tr>
                      <td class="nowrap">{{ typeLabel(i.type) }} · <b>{{ codes().get(i.tempId) }}</b></td>
                      <td class="wrap">{{ i.title }}</td>
                      <td>{{ phaseLabel(i.phaseTempId) }}</td>
                      <td><span class="badge" [class]="i.priority">{{ prioLabel(i.priority) }}</span></td>
                      <td class="num">{{ i.estimation || '—' }}</td>
                      <td>{{ names(i.responsableIds) }}</td>
                      <td class="c-act">
                        <button type="button" class="icon-btn" (click)="openItem(i)" aria-label="Editar ítem"><mat-icon>edit</mat-icon></button>
                        <button type="button" class="icon-btn bad" (click)="removeItem(i)" aria-label="Quitar ítem"><mat-icon>close</mat-icon></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="below"><span class="muted small">Tabla independiente del cronograma · descripción y criterios se editan al abrir cada ítem en “Backlog”.</span></div>
          } @else {
            <div class="empty-raci">
              <mat-icon>list_alt</mat-icon>
              <p>Aún no hay ítems. Puedes agregarlos ahora o más tarde desde “Backlog”.</p>
            </div>
          }
        }

        <!-- ================= Paso 4 · Confirmación ================= -->
        @if (step() === 3) {
          <div class="summary">
            <div class="s-item wide"><span class="muted small">Proyecto</span><b>{{ acta.controls.name.value || '—' }}</b></div>
            <div class="s-item"><span class="muted small">Periodo</span><b>{{ fmt(acta.controls.startDate.value) }} → {{ fmt(acta.controls.endDate.value) }}</b></div>
            <div class="s-item"><span class="muted small">Integrantes ({{ members().length }})</span><b>{{ memberNames() }}</b></div>
            <div class="s-item"><span class="muted small">Fases</span><b>{{ phases().length }}</b></div>
            <div class="s-item"><span class="muted small">Tareas RACI</span><b>{{ tasks().length }}</b></div>
            <div class="s-item"><span class="muted small">Ítems de backlog</span><b>{{ items().length }}</b></div>
            <div class="s-item"><span class="muted small">Puntos estimados</span><b>{{ totalPoints() }}</b></div>
          </div>
          @if (!tasks().length || !items().length) {
            <div class="hint-line warn">
              @if (!tasks().length) { Sin tareas: el dashboard mostrará “Sin datos” hasta que las agregues desde “Tareas”. }
              @if (!items().length) { Sin ítems: podrás crear el backlog desde “Backlog”. }
            </div>
          }
          @if (creating()) { <div class="hint-line">{{ progress() }}</div> }
          @if (error()) { <div class="hint-line err" role="alert">{{ error() }}</div> }
        }

        @if (stepError()) { <div class="hint-line err step-err" role="alert">{{ stepError() }}</div> }
      </div>

      <div class="nav">
        <button type="button" class="btn ghost round" (click)="back()" [disabled]="step() === 0 || creating()">
          <mat-icon>arrow_back</mat-icon>Atrás
        </button>
        <span class="spacer"></span>
        @if (step() < 3) {
          <button type="button" class="btn round" (click)="next()">Siguiente<mat-icon>arrow_forward</mat-icon></button>
        } @else {
          <button type="button" class="btn round" (click)="create()" [disabled]="creating()">
            <mat-icon>check</mat-icon>{{ creating() ? 'Creando…' : 'Crear proyecto' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .page { max-width: 1180px; }
    .steps { list-style: none; display: flex; gap: 8px; margin: 0 0 18px; padding: 0 0 14px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
    .steps button {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px 6px 8px; border: 0; border-radius: 999px;
      background: transparent; color: var(--ink-soft); font: inherit; font-size: 13.5px; font-weight: 500; cursor: pointer;
    }
    .steps button:disabled { cursor: default; opacity: .6; }
    .steps .n {
      display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%;
      background: #e8e8ef; color: var(--ink-soft); font-size: 12px; font-weight: 600;
    }
    .steps .n mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .steps li.active button { background: var(--lavender); color: var(--ink); font-weight: 600; }
    .steps li.active .n { background: var(--purple); color: #fff; }
    .steps li.done .n { background: var(--teal-bg); color: var(--teal); }
    .steps li.done button:not(:disabled):hover { background: var(--surface); }

    .panel { min-height: 280px; }
    .lead { color: var(--ink-soft); font-size: 13.5px; margin: 0 0 14px; }
    .acta { max-width: 760px; }
    .round { border-radius: 999px; }
    .nav { display: flex; gap: 8px; margin-top: 20px; }
    .below { display: flex; align-items: center; gap: 14px; margin-top: 14px; flex-wrap: wrap; }
    .step-err { margin-top: 12px; }

    .table-wrap table { min-width: 940px; }
    table.raci th, table.bl th { text-align: left; }
    .c-id { width: 52px; color: var(--ink-soft); white-space: nowrap; }
    .c-p { width: 116px; }
    .c-d { width: 124px; }
    .c-act { width: 80px; text-align: right; white-space: nowrap; }
    table.t tr.phase td { background: #eceef3; color: var(--ink); font-weight: 600; padding: 8px 10px; }
    .ph { display: flex; align-items: center; gap: 6px; min-height: 28px; }
    .ph-input { max-width: 420px; font-weight: 600; }
    .icon-btn.sm { width: 26px; height: 26px; }
    .icon-btn.sm mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .icon-btn.ok { color: var(--teal); }
    .icon-btn.bad:hover { color: var(--coral); }
    tr.edit td { padding: 6px 8px; vertical-align: middle; background: #fcfcff; }
    tr.row-err td { color: var(--coral); font-size: 12px; padding: 2px 10px 8px; border-top: none; background: #fcfcff; }
    td.miss { color: var(--coral); }
    tr.add td { padding: 4px 10px; }
    .link {
      display: inline-flex; align-items: center; gap: 4px; border: 0; background: transparent; color: var(--purple);
      font: inherit; font-size: 12.5px; font-weight: 500; cursor: pointer; padding: 4px 2px;
    }
    .link mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .link:hover { text-decoration: underline; }

    .cell {
      width: 100%; height: 32px; padding: 0 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff;
      color: var(--ink); font: inherit; font-size: 12.5px; box-sizing: border-box; min-width: 0;
    }
    .cell:focus-visible { outline: 2px solid var(--purple); outline-offset: 1px; }
    input.cell[readonly] { cursor: pointer; }

    .empty-raci {
      display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 36px 16px; text-align: center;
      border: 1.5px dashed #c9c9d3; border-radius: var(--radius); background: var(--surface); color: var(--ink-soft);
    }
    .empty-raci mat-icon { font-size: 30px; width: 30px; height: 30px; }
    .empty-raci p { margin: 0 0 8px; }
    .empty-raci .actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

    .bl-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .quick { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; flex-wrap: wrap; padding: 10px 12px; background: var(--surface); border-radius: 12px; }
    .q-type { width: 170px; } .q-title { flex: 1; min-width: 200px; } .q-prio { width: 100px; }
    table.bl { min-width: 760px; }

    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 4px 0 14px; }
    .s-item { background: var(--surface); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .s-item b { overflow-wrap: anywhere; }
    .s-item.wide { grid-column: 1 / -1; }
    @media (max-width: 700px) { .summary { grid-template-columns: 1fr 1fr; } }
  `,
})
export class NewProjectPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private projectsApi = inject(ProjectsApi);
  private planningApi = inject(PlanningApi);
  private tasksApi = inject(TasksApi);
  private backlogApi = inject(BacklogApi);
  protected users = inject(UsersApi);
  private auth = inject(AuthService);

  protected labels = STEP_LABELS;
  protected types = PBI_TYPES;
  protected priorities = PRIORITIES;

  protected step = signal(0);
  protected stepError = signal<string | null>(null);

  // ---- Paso 1
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
  private memberIdsSig = signal<string[]>(this.acta.controls.memberIds.value ?? []);

  /** Integrantes elegidos en el paso 1 (siempre incluye al usuario actual). */
  protected members = computed(() => {
    const ids = new Set(this.memberIdsSig());
    const me = this.auth.user();
    if (me) ids.add(me.id);
    const list = this.users.all().filter((u) => ids.has(u.id));
    if (me && !list.some((u) => u.id === me.id)) list.unshift({ id: me.id, name: me.name, email: me.email });
    return list;
  });
  protected memberNames = computed(() => this.members().map((m) => m.name).join(', '));

  // ---- Paso 2
  protected phases = signal<DraftPhase[]>([]);
  protected tasks = signal<DraftTask[]>([]);
  protected row = signal<RowEdit | null>(null);
  protected editPhaseId = signal<string | null>(null);

  // ---- Paso 3
  protected items = signal<DraftItem[]>([]);
  protected quickType = signal<PbiType>('hu');
  protected quickTitle = signal('');
  protected quickPriority = signal<PbiPriority>('media');
  protected quickError = signal<string | null>(null);

  /** Vista previa del código que asignará el servidor (por tipo, desde 001, en el orden de la lista). */
  protected codes = computed(() => {
    const counters = new Map<PbiType, number>();
    const out = new Map<string, string>();
    for (const i of this.items()) {
      const n = (counters.get(i.type) ?? 0) + 1;
      counters.set(i.type, n);
      out.set(i.tempId, `${pbiInfo(i.type).code}-${String(n).padStart(3, '0')}`);
    }
    return out;
  });
  protected totalPoints = computed(() => this.items().reduce((s, i) => s + i.estimation, 0));

  // ---- Paso 4
  protected creating = signal(false);
  protected progress = signal('');
  protected error = signal<string | null>(null);

  constructor() {
    if (!this.users.all().length) this.users.list().subscribe({ error: () => undefined });
    this.acta.controls.memberIds.valueChanges.subscribe((v) => this.memberIdsSig.set(v ?? []));
  }

  // ------------------------------------------------------------------ helpers de presentación
  protected first = (name: string) => name.split(' ')[0];
  protected name = (id: string) => {
    const u = this.members().find((m) => m.id === id);
    return u ? this.first(u.name) : '—';
  };
  protected names = (ids: string[]) => {
    if (!ids.length) return '—';
    const m = this.members();
    if (m.length > 1 && m.every((u) => ids.includes(u.id))) return 'Todo el equipo';
    return m.filter((u) => ids.includes(u.id)).map((u) => this.first(u.name)).join(', ') || '—';
  };
  protected fmt = (d: Date | null) => (d ? formatDate(toIsoDate(d)) : '—');
  protected actaStart = () => this.acta.controls.startDate.value ?? new Date();
  protected typeLabel = (t: PbiType) => pbiInfo(t).label;
  protected prioLabel = (p: PbiPriority) => this.priorities.find((x) => x.value === p)?.label ?? p;
  protected phaseLabel = (tempId: string | null) => {
    if (!tempId) return '—';
    const i = this.phases().findIndex((p) => p.tempId === tempId);
    return i < 0 ? '—' : `${i + 1}. ${this.phases()[i].name}`;
  };

  // ------------------------------------------------------------------ navegación
  goTo(i: number): void {
    if (i > this.step() || this.creating()) return;
    this.stepError.set(null);
    this.step.set(i);
  }

  back(): void {
    this.goTo(this.step() - 1);
  }

  next(): void {
    this.stepError.set(null);
    const s = this.step();
    if (s === 0) {
      if (this.acta.invalid) {
        this.acta.markAllAsTouched();
        return;
      }
      this.pruneMembers();
    } else if (s === 1) {
      if (this.row()) return this.stepError.set('Confirma (✓) o cancela (✕) la fila que estás editando antes de continuar.');
      if (this.tasks().some((t) => !t.responsibleId || !t.accountableId)) {
        return this.stepError.set('Hay tareas sin Responsable o A cargo (la persona ya no está en el equipo). Edítalas para continuar.');
      }
    }
    this.step.set(s + 1);
  }

  cancel(): void {
    const dirty = this.acta.dirty || this.phases().length || this.tasks().length || this.items().length;
    if (!dirty) {
      this.router.navigate(['/proyectos']);
      return;
    }
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: '¿Descartar el proyecto?',
          message: 'Se perderán los datos que ingresaste en este asistente.',
          confirmLabel: 'Descartar',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.router.navigate(['/proyectos']));
  }

  /** Si se quitó a alguien del equipo, se lo retira también de los roles ya asignados. */
  private pruneMembers(): void {
    const ids = new Set(this.members().map((m) => m.id));
    const keep = (list: string[]) => list.filter((id) => ids.has(id));
    this.tasks.update((l) =>
      l.map((t) => ({
        ...t,
        responsibleId: ids.has(t.responsibleId) ? t.responsibleId : '',
        accountableId: ids.has(t.accountableId) ? t.accountableId : '',
        consultedIds: keep(t.consultedIds),
        informedIds: keep(t.informedIds),
      })),
    );
    this.items.update((l) => l.map((i) => ({ ...i, responsableIds: keep(i.responsableIds) })));
  }

  // ------------------------------------------------------------------ fases
  addPhase(): void {
    if (this.pending()) return;
    const tempId = uid();
    this.phases.update((l) => [...l, { tempId, name: '' }]);
    this.editPhaseId.set(tempId);
    setTimeout(() => document.getElementById('ph-' + tempId)?.focus());
  }

  useDefaultPhases(): void {
    this.phases.set(DEFAULT_PHASES.map((name) => ({ tempId: uid(), name })));
  }

  editPhase(tempId: string): void {
    this.editPhaseId.set(tempId);
    setTimeout(() => (document.getElementById('ph-' + tempId) as HTMLInputElement | null)?.select());
  }

  commitPhase(tempId: string, value: string): void {
    if (this.editPhaseId() !== tempId) return;
    const idx = this.phases().findIndex((p) => p.tempId === tempId);
    const name = value.trim() || `Fase ${idx + 1}`;
    this.phases.update((l) => l.map((p) => (p.tempId === tempId ? { ...p, name } : p)));
    this.editPhaseId.set(null);
  }

  removePhase(ph: DraftPhase): void {
    if (this.pending()) return;
    const used = this.tasks().filter((t) => t.phaseTempId === ph.tempId).length;
    const linked = this.items().filter((i) => i.phaseTempId === ph.tempId).length;
    const doRemove = () => {
      this.phases.update((l) => l.filter((p) => p.tempId !== ph.tempId));
      this.tasks.update((l) => l.filter((t) => t.phaseTempId !== ph.tempId));
      this.items.update((l) => l.map((i) => (i.phaseTempId === ph.tempId ? { ...i, phaseTempId: null } : i)));
    };
    if (!used && !linked) return doRemove();
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: `¿Quitar la fase “${ph.name}”?`,
          message: `Se quitarán también ${used} ${used === 1 ? 'tarea' : 'tareas'}` +
            (linked ? ` y se desvincularán ${linked} ${linked === 1 ? 'ítem' : 'ítems'} del backlog.` : '.'),
          confirmLabel: 'Quitar',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => ok && doRemove());
  }

  // ------------------------------------------------------------------ tareas (filas editables)
  /** Tareas de una fase; si se está agregando una nueva en esa fase, se muestra al final. */
  rowsOf(phaseTempId: string): DraftTask[] {
    const list = this.tasks().filter((t) => t.phaseTempId === phaseTempId);
    const r = this.row();
    if (r?.isNew && r.draft.phaseTempId === phaseTempId) list.push(r.draft);
    return list;
  }

  /** Solo se edita una fila a la vez (o una fase). */
  private pending(): boolean {
    if (this.row() || this.editPhaseId()) {
      this.stepError.set('Termina de editar la fila (✓ o ✕) antes de continuar.');
      return true;
    }
    this.stepError.set(null);
    return false;
  }

  startAdd(phaseTempId: string): void {
    if (this.pending()) return;
    this.row.set({
      isNew: true,
      error: null,
      draft: {
        tempId: uid(), phaseTempId, title: '', responsibleId: '', accountableId: '',
        consultedIds: [], informedIds: [], start: null, end: null,
      },
    });
  }

  editTask(t: DraftTask): void {
    if (this.pending()) return;
    this.row.set({ isNew: false, error: null, draft: { ...t, consultedIds: [...t.consultedIds], informedIds: [...t.informedIds] } });
  }

  setE<K extends keyof DraftTask>(key: K, value: DraftTask[K]): void {
    this.row.update((r) => (r ? { ...r, error: null, draft: { ...r.draft, [key]: value } } : r));
  }

  confirmRow(): void {
    const r = this.row();
    if (!r) return;
    const d = r.draft;
    const fail = (error: string) => this.row.set({ ...r, error });
    if (!d.title.trim()) return fail('Escribe el título de la tarea.');
    if (!d.responsibleId) return fail('Selecciona el Responsable (R).');
    if (!d.accountableId) return fail('Selecciona quién está A cargo (A).');
    if (!d.start || !d.end) return fail('Selecciona las fechas de inicio y fin.');
    if (d.end < d.start) return fail('La fecha de fin no puede ser anterior a la de inicio.');
    const clean: DraftTask = { ...d, title: d.title.trim() };
    this.tasks.update((l) => (r.isNew ? [...l, clean] : l.map((t) => (t.tempId === clean.tempId ? clean : t))));
    this.row.set(null);
  }

  cancelRow(): void {
    this.row.set(null);
  }

  removeTask(t: DraftTask): void {
    if (this.row()?.draft.tempId === t.tempId) this.row.set(null);
    this.tasks.update((l) => l.filter((x) => x.tempId !== t.tempId));
  }

  // ------------------------------------------------------------------ backlog
  openItem(item?: DraftItem): void {
    this.dialog
      .open(BacklogDraftDialog, { data: { phases: this.phases(), members: this.members(), item } })
      .afterClosed()
      .subscribe((result: DraftItem | undefined) => {
        if (!result) return;
        this.items.update((l) => (item ? l.map((i) => (i.tempId === result.tempId ? result : i)) : [...l, result]));
      });
  }

  quickAdd(): void {
    const title = this.quickTitle().trim();
    if (!title) return this.quickError.set('Escribe el título del ítem.');
    this.quickError.set(null);
    this.items.update((l) => [...l, {
      tempId: uid(), type: this.quickType(), title, phaseTempId: null, priority: this.quickPriority(),
      estimation: 0, responsableIds: [],
    }]);
    this.quickTitle.set('');
  }

  removeItem(i: DraftItem): void {
    this.items.update((l) => l.filter((x) => x.tempId !== i.tempId));
  }

  // ------------------------------------------------------------------ creación
  /** Crea el proyecto y, en orden, sus fases, tareas e ítems de backlog. */
  create(): void {
    if (this.acta.invalid) {
      this.acta.markAllAsTouched();
      this.step.set(0);
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
    const phaseOrder = new Map(this.phases().map((p, i) => [p.tempId, i] as const));
    // Las tareas se crean agrupadas por fase y en el orden de la tabla, así el código "1.1, 1.2…" coincide.
    const tasks = [...this.tasks()].sort((x, y) => (phaseOrder.get(x.phaseTempId) ?? 0) - (phaseOrder.get(y.phaseTempId) ?? 0));

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
        return from(tasks).pipe(
          concatMap((t) => {
            const phaseId = phaseMap.get(t.phaseTempId);
            if (!phaseId) { failures++; return of(null); }
            return this.tasksApi.create(project.id, {
              phaseId, title: t.title, responsibleId: t.responsibleId, accountableId: t.accountableId,
              consultedIds: t.consultedIds, informedIds: t.informedIds,
              startDate: toIsoDate(t.start!), endDate: toIsoDate(t.end!),
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
              type: i.type, title: i.title, priority: i.priority, estimation: i.estimation,
              responsableIds: i.responsableIds, phaseId: i.phaseTempId ? phaseMap.get(i.phaseTempId) ?? null : null,
            }).pipe(catchError(() => { failures++; return of(null); })),
          ),
          toArray(),
        );
      }),
    ).subscribe({
      next: () => this.finish(project, failures),
      // El proyecto ya existe: se entra a él para completar lo que falte.
      error: () => this.finish(project, failures + 1),
    });
  }

  private finish(project: Project, failures: number): void {
    this.creating.set(false);
    this.snack.open(
      failures
        ? 'Proyecto creado, pero algunos elementos no se pudieron guardar. Revisa “Tareas” y “Backlog”.'
        : 'Proyecto creado correctamente',
      'OK',
    );
    this.router.navigate(['/proyectos', project.id, 'dashboard']);
  }
}
