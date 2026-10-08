import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TasksApi, TaskPatch } from '../../core/api/tasks.api';
import { errorMessage } from '../../core/errors';
import { Task, TASK_COLUMNS, TaskStatus } from '../../core/models';
import { ProjectStore } from '../../core/project.store';
import { durationDays, parseDate, toIsoDate } from '../../core/util/dates';
import { PhaseDialog } from './phase.dialog';

export interface TaskDialogData {
  projectId: string;
  task?: Task;
  /** Para "Agregar tarea a este ítem" desde el backlog */
  backlogItemId?: string;
}

function dateRange(group: AbstractControl): ValidationErrors | null {
  const s = group.get('startDate')?.value as Date | null;
  const e = group.get('endDate')?.value as Date | null;
  return s && e && e < s ? { range: true } : null;
}

@Component({
  selector: 'app-task-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ editing ? 'Editar tarea' : 'Nueva tarea' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form" style="min-width: min(640px, 84vw)">
        <mat-form-field appearance="outline">
          <mat-label>Título de la tarea</mat-label>
          <input matInput formControlName="title" />
          @if (form.controls.title.hasError('required')) { <mat-error>El título es obligatorio</mat-error> }
          @else if (form.controls.title.hasError('maxlength')) { <mat-error>Máximo 160 caracteres</mat-error> }
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Fase</mat-label>
            <mat-select formControlName="phaseId">
              @for (ph of store.phases(); track ph.id) { <mat-option [value]="ph.id">{{ ph.orderIndex + 1 }}. {{ ph.name }}</mat-option> }
            </mat-select>
            @if (form.controls.phaseId.hasError('required')) { <mat-error>Selecciona una fase</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Ítem del backlog (opcional)</mat-label>
            <mat-select formControlName="backlogItemId">
              <mat-option [value]="null">— Ninguno —</mat-option>
              @for (b of store.backlog(); track b.id) { <mat-option [value]="b.id">{{ b.code }} · {{ b.title }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        @if (!store.phases().length) {
          <div class="hint-line warn">
            Aún no hay fases en el cronograma.
            <a href="javascript:void(0)" (click)="newPhase()">Crear la primera fase</a>
          </div>
        } @else {
          <div class="hint-line"><a href="javascript:void(0)" (click)="newPhase()">+ Nueva fase</a></div>
        }

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Responsable (R)</mat-label>
            <mat-select formControlName="responsibleId">
              @for (u of options(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
            </mat-select>
            @if (form.controls.responsibleId.hasError('required')) { <mat-error>Selecciona un responsable</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>A cargo / aprueba (A)</mat-label>
            <mat-select formControlName="accountableId">
              @for (u of options(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
            </mat-select>
            @if (form.controls.accountableId.hasError('required')) { <mat-error>Selecciona quién aprueba</mat-error> }
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Consultado (C)</mat-label>
            <mat-select formControlName="consultedIds" multiple>
              @for (u of options(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Informado (I)</mat-label>
            <mat-select formControlName="informedIds" multiple>
              @for (u of options(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Fecha de inicio</mat-label>
            <input matInput [matDatepicker]="dpS" formControlName="startDate" readonly (click)="dpS.open()" />
            <mat-datepicker-toggle matIconSuffix [for]="dpS" />
            <mat-datepicker #dpS />
            @if (form.controls.startDate.hasError('required')) { <mat-error>Selecciona la fecha de inicio</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha de vencimiento</mat-label>
            <input matInput [matDatepicker]="dpE" formControlName="endDate" readonly (click)="dpE.open()" />
            <mat-datepicker-toggle matIconSuffix [for]="dpE" />
            <mat-datepicker #dpE />
            @if (form.controls.endDate.hasError('required')) { <mat-error>Selecciona la fecha de vencimiento</mat-error> }
          </mat-form-field>
        </div>
        @if (form.hasError('range')) { <div class="hint-line err">La fecha de vencimiento no puede ser anterior a la de inicio.</div> }
        @else if (duration() > 0) {
          <div class="hint-line">Duración: <b>{{ duration() }} {{ duration() === 1 ? 'día' : 'días' }}</b></div>
        }
        @if (afterProjectEnd()) {
          <div class="hint-line warn">La fecha de vencimiento supera la fecha límite del proyecto.</div>
        }

        @if (editing) {
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="status">
                @for (c of columns; track c.value) { <mat-option [value]="c.value">{{ c.label }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>% completado</mat-label>
              <input matInput type="number" min="0" max="100" step="5" formControlName="percentComplete" />
              @if (form.controls.percentComplete.hasError('min') || form.controls.percentComplete.hasError('max')) {
                <mat-error>Ingresa un valor entre 0 y 100</mat-error>
              }
              @if (form.controls.percentComplete.hasError('required')) { <mat-error>Ingresa el porcentaje</mat-error> }
            </mat-form-field>
          </div>
        }
        @if (error()) { <div class="hint-line err">{{ error() }}</div> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
        <button type="submit" class="btn" [disabled]="saving()">
          {{ saving() ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tarea' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class TaskDialog {
  private fb = inject(FormBuilder);
  private api = inject(TasksApi);
  private dialog = inject(MatDialog);
  private ref = inject<MatDialogRef<TaskDialog, Task>>(MatDialogRef);
  protected data = inject<TaskDialogData>(MAT_DIALOG_DATA);
  protected store = inject(ProjectStore);

  protected editing = !!this.data.task;
  protected columns = TASK_COLUMNS;
  protected saving = signal(false);
  protected error = signal<string | null>(null);

  protected form = this.fb.nonNullable.group(
    {
      title: [this.data.task?.title ?? '', [Validators.required, Validators.maxLength(160)]],
      phaseId: [this.data.task?.phaseId ?? (this.store.phases()[0]?.id ?? ''), [Validators.required]],
      backlogItemId: [this.data.task?.backlogItemId ?? this.data.backlogItemId ?? (null as string | null)],
      responsibleId: [this.data.task?.responsibleId ?? '', [Validators.required]],
      accountableId: [this.data.task?.accountableId ?? '', [Validators.required]],
      consultedIds: [this.data.task?.consultedIds ?? ([] as string[])],
      informedIds: [this.data.task?.informedIds ?? ([] as string[])],
      startDate: [parseDate(this.data.task?.startDate) as Date | null, [Validators.required]],
      endDate: [parseDate(this.data.task?.endDate) as Date | null, [Validators.required]],
      status: [(this.data.task?.status ?? 'pendiente') as TaskStatus],
      percentComplete: [Number(this.data.task?.percentComplete ?? 0), [Validators.required, Validators.min(0), Validators.max(100)]],
    },
    { validators: dateRange },
  );

  private values = toSignal(this.form.valueChanges.pipe(startWith(this.form.value), map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  protected duration = computed(() => {
    const v = this.values();
    return v.startDate && v.endDate && v.endDate >= v.startDate ? durationDays(v.startDate, v.endDate) : 0;
  });
  /** Integrantes del proyecto + personas ya vinculadas a la tarea (p. ej. el Product Owner como Consultado, que no es integrante). */
  protected options = computed(() => {
    const list = [...this.store.people()].map((u) => ({ id: u.id, name: u.name }));
    const known = new Set(list.map((u) => u.id));
    const t = this.data.task;
    const extra = [t?.responsibleId, t?.accountableId, ...(t?.consultedIds ?? []), ...(t?.informedIds ?? [])];
    for (const id of extra) {
      if (id && !known.has(id)) {
        known.add(id);
        list.push({ id, name: this.store.names().get(id) ?? 'Usuario' });
      }
    }
    return list;
  });
  protected afterProjectEnd = computed(() => {
    const end = parseDate(this.store.project()?.endDate);
    const v = this.values().endDate;
    return !!end && !!v && v > end;
  });

  newPhase(): void {
    this.dialog
      .open(PhaseDialog, { data: { projectId: this.data.projectId } })
      .afterClosed()
      .subscribe((phase) => {
        if (phase) {
          this.store.reloadPhases();
          this.store.phases.update((list) => [...list, phase]);
          this.form.controls.phaseId.setValue(phase.id);
        }
      });
  }

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const v = this.form.getRawValue();

    const base = {
      phaseId: v.phaseId,
      backlogItemId: v.backlogItemId || null,
      title: v.title.trim(),
      responsibleId: v.responsibleId,
      accountableId: v.accountableId,
      consultedIds: v.consultedIds,
      informedIds: v.informedIds,
      startDate: toIsoDate(v.startDate!),
      endDate: toIsoDate(v.endDate!),
    };

    this.saving.set(true);
    this.error.set(null);

    let request;
    if (this.editing) {
      // Mantiene coherentes el estado y el porcentaje.
      let status = v.status;
      let pct = Number(v.percentComplete);
      if (status === 'completada') pct = 100;
      else if (pct >= 100) { pct = 100; status = 'completada'; }
      else if (pct > 0 && status === 'pendiente') status = 'en_progreso';
      const patch: TaskPatch = { ...base, status, percentComplete: pct };
      request = this.api.update(this.data.projectId, this.data.task!.id, patch);
    } else {
      request = this.api.create(this.data.projectId, base);
    }

    request.subscribe({
      next: (task) => this.ref.close(task),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
