import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map, startWith } from 'rxjs';
import { BacklogApi, BacklogPayload } from '../../core/api/backlog.api';
import { errorMessage } from '../../core/errors';
import {
  BacklogItem, FIBONACCI, PBI_STATUSES, PBI_TYPES, PRIORITIES, PbiPriority, PbiStatus, PbiType, SPRINT_CAPACITY, pbiInfo,
} from '../../core/models';
import { ProjectStore } from '../../core/project.store';
import { parseDate, toIsoDate } from '../../core/util/dates';
import { SprintDialog } from './sprint.dialog';

export interface BacklogDialogData {
  projectId: string;
  item?: BacklogItem;
}

function dateRange(g: AbstractControl): ValidationErrors | null {
  const s = g.get('startDate')?.value as Date | null;
  const e = g.get('endDate')?.value as Date | null;
  return s && e && e < s ? { range: true } : null;
}

/** "Como X, quiero Y, para Z." → partes (tolera texto libre previo). */
function parseStory(text: string | null) {
  const m = /^Como (.*?), quiero (.*?), para (.*?)\.?$/is.exec((text ?? '').trim());
  return m ? { como: m[1], quiero: m[2], para: m[3] } : { como: '', quiero: (text ?? '').trim(), para: '' };
}
function parseCriteria(text: string | null) {
  const m = /^Dado que (.*?), cuando (.*?), entonces (.*?)\.?$/is.exec((text ?? '').trim());
  return m ? { dado: m[1], cuando: m[2], entonces: m[3] } : { dado: '', cuando: '', entonces: '' };
}
function parseChecklist(text: string | null): string {
  return (text ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*\[[ xX]\]\s*/, '').replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
    .join('\n');
}

@Component({
  selector: 'app-backlog-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule],
  template: `
    <h2 mat-dialog-title>{{ editing ? 'Editar ítem del backlog' : 'Nuevo ítem del backlog' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form" style="min-width: min(700px, 86vw)">
        <div class="label">Tipo</div>
        <div class="chips" role="radiogroup" aria-label="Tipo de ítem">
          @for (t of types; track t.value) {
            <button type="button" class="chip-btn" role="radio" [attr.aria-checked]="type() === t.value"
                    [class.active]="type() === t.value" [title]="t.hint" (click)="setType(t.value)">
              {{ t.code }} · {{ t.label }}
            </button>
          }
        </div>
        <div class="hint-line" style="margin-top:6px">{{ info().hint }}</div>

        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" />
          @if (form.controls.title.hasError('required')) { <mat-error>El título es obligatorio</mat-error> }
          @else if (form.controls.title.hasError('maxlength')) { <mat-error>Máximo 160 caracteres</mat-error> }
        </mat-form-field>

        @if (info().userStoryFormat) {
          <div class="label">Historia de usuario</div>
          <div class="row three">
            <mat-form-field appearance="outline">
              <mat-label>Como…</mat-label>
              <input matInput formControlName="como" placeholder="rol / usuario" />
              @if (form.controls.como.hasError('required')) { <mat-error>Indica el rol</mat-error> }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Quiero…</mat-label>
              <input matInput formControlName="quiero" placeholder="funcionalidad" />
              @if (form.controls.quiero.hasError('required')) { <mat-error>Indica lo que quiere</mat-error> }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Para…</mat-label>
              <input matInput formControlName="para" placeholder="beneficio" />
              @if (form.controls.para.hasError('required')) { <mat-error>Indica el beneficio</mat-error> }
            </mat-form-field>
          </div>
          <div class="label">Criterios de aceptación</div>
          <div class="row three">
            <mat-form-field appearance="outline">
              <mat-label>Dado que…</mat-label>
              <input matInput formControlName="dado" placeholder="contexto" />
              @if (form.controls.dado.hasError('required')) { <mat-error>Indica el contexto</mat-error> }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Cuando…</mat-label>
              <input matInput formControlName="cuando" placeholder="acción" />
              @if (form.controls.cuando.hasError('required')) { <mat-error>Indica la acción</mat-error> }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Entonces…</mat-label>
              <input matInput formControlName="entonces" placeholder="resultado" />
              @if (form.controls.entonces.hasError('required')) { <mat-error>Indica el resultado</mat-error> }
            </mat-form-field>
          </div>
        } @else {
          <mat-form-field appearance="outline">
            <mat-label>Descripción puntual</mat-label>
            <textarea matInput rows="2" formControlName="description"></textarea>
            @if (form.controls.description.hasError('required')) { <mat-error>La descripción es obligatoria</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Checklist (un criterio por línea)</mat-label>
            <textarea matInput rows="3" formControlName="checklist" placeholder="Criterio 1&#10;Criterio 2"></textarea>
          </mat-form-field>
        }

        <div class="row three">
          <mat-form-field appearance="outline">
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="priority">
              @for (p of priorities; track p.value) { <mat-option [value]="p.value">{{ p.label }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Estimación (puntos)</mat-label>
            <mat-select formControlName="estimation">
              <mat-option [value]="0">0 (sin puntos)</mat-option>
              @for (f of fibonacci; track f) { <mat-option [value]="f">{{ f }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Sprint</mat-label>
            <mat-select formControlName="sprintId">
              <mat-option [value]="null">— Sin sprint —</mat-option>
              @for (s of store.sprints(); track s.id) { <mat-option [value]="s.id">Sprint {{ s.number }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="hint-line">
          @if (sprintLoad(); as l) {
            <span [class.warn]="l.total > capacity">Carga del sprint: <b>{{ l.total }}/{{ capacity }} pts</b>
              @if (l.total > capacity) { — supera la capacidad del sprint. }
            </span> ·
          }
          <a href="javascript:void(0)" (click)="newSprint()">+ Nuevo sprint</a>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Fase</mat-label>
            <mat-select formControlName="phaseId">
              <mat-option [value]="null">— Sin fase —</mat-option>
              @for (ph of store.phases(); track ph.id) { <mat-option [value]="ph.id">{{ ph.orderIndex + 1 }}. {{ ph.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Responsables</mat-label>
            <mat-select formControlName="responsableIds" multiple>
              @for (u of store.people(); track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
            </mat-select>
            @if (form.controls.responsableIds.hasError('required')) { <mat-error>Asigna al menos un responsable</mat-error> }
          </mat-form-field>
        </div>

        <div class="row three">
          <mat-form-field appearance="outline">
            <mat-label>Fecha de inicio</mat-label>
            <input matInput [matDatepicker]="s" formControlName="startDate" readonly (click)="s.open()" />
            <mat-datepicker-toggle matIconSuffix [for]="s" /><mat-datepicker #s />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha de fin</mat-label>
            <input matInput [matDatepicker]="e" formControlName="endDate" readonly (click)="e.open()" />
            <mat-datepicker-toggle matIconSuffix [for]="e" /><mat-datepicker #e />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Dependencia</mat-label>
            <mat-select formControlName="dependencyId">
              <mat-option [value]="null">— Ninguna —</mat-option>
              @for (b of dependencyOptions(); track b.id) { <mat-option [value]="b.id">{{ b.code }} · {{ b.title }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        @if (form.hasError('range')) { <div class="hint-line err">La fecha de fin no puede ser anterior a la de inicio.</div> }

        @if (editing) {
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (s of statuses; track s.value) { <mat-option [value]="s.value">{{ s.label }}</mat-option> }
            </mat-select>
          </mat-form-field>
        }
        @if (error()) { <div class="hint-line err">{{ error() }}</div> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
        <button type="submit" class="btn" [disabled]="saving()">{{ saving() ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear ítem' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class BacklogDialog {
  private fb = inject(FormBuilder);
  private api = inject(BacklogApi);
  private dialog = inject(MatDialog);
  private ref = inject<MatDialogRef<BacklogDialog, BacklogItem>>(MatDialogRef);
  protected data = inject<BacklogDialogData>(MAT_DIALOG_DATA);
  protected store = inject(ProjectStore);

  protected editing = !!this.data.item;
  protected types = PBI_TYPES;
  protected priorities = PRIORITIES;
  protected statuses = PBI_STATUSES;
  protected fibonacci = FIBONACCI;
  protected capacity = SPRINT_CAPACITY;
  protected saving = signal(false);
  protected error = signal<string | null>(null);

  private story = parseStory(this.data.item?.type === 'hu' ? this.data.item.description : null);
  private criteria = parseCriteria(this.data.item?.type === 'hu' ? this.data.item.acceptanceCriteria : null);

  protected form = this.fb.nonNullable.group(
    {
      type: [(this.data.item?.type ?? 'hu') as PbiType],
      title: [this.data.item?.title ?? '', [Validators.required, Validators.maxLength(160)]],
      como: [this.story.como],
      quiero: [this.story.quiero],
      para: [this.story.para],
      dado: [this.criteria.dado],
      cuando: [this.criteria.cuando],
      entonces: [this.criteria.entonces],
      description: [this.data.item && this.data.item.type !== 'hu' ? (this.data.item.description ?? '') : ''],
      checklist: [this.data.item && this.data.item.type !== 'hu' ? parseChecklist(this.data.item.acceptanceCriteria) : ''],
      priority: [(this.data.item?.priority ?? 'media') as PbiPriority],
      estimation: [Number(this.data.item?.estimation ?? 0)],
      sprintId: [this.data.item?.sprintId ?? (null as string | null)],
      phaseId: [this.data.item?.phaseId ?? (null as string | null)],
      responsableIds: [this.data.item?.responsableIds ?? ([] as string[]), [Validators.required]],
      startDate: [parseDate(this.data.item?.startDate) as Date | null],
      endDate: [parseDate(this.data.item?.endDate) as Date | null],
      dependencyId: [this.data.item?.dependencyId ?? (null as string | null)],
      status: [(this.data.item?.status ?? 'open') as PbiStatus],
    },
    { validators: dateRange },
  );

  private values = toSignal(this.form.valueChanges.pipe(startWith(this.form.value), map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  protected type = computed(() => this.values().type);
  protected info = computed(() => pbiInfo(this.type()));

  protected dependencyOptions = computed(() => this.store.backlog().filter((b) => b.id !== this.data.item?.id));

  /** Puntos del sprint elegido (incluye este ítem) para avisar si se supera la capacidad de 21. */
  protected sprintLoad = computed(() => {
    const v = this.values();
    if (!v.sprintId) return null;
    const others = this.store.backlog()
      .filter((b) => b.sprintId === v.sprintId && b.id !== this.data.item?.id)
      .reduce((s, b) => s + (Number(b.estimation) || 0), 0);
    return { total: others + (Number(v.estimation) || 0) };
  });

  constructor() {
    this.applyValidators(this.form.controls.type.value);
  }

  setType(t: PbiType): void {
    this.form.controls.type.setValue(t);
    this.applyValidators(t);
  }

  /** HU exige Como/Quiero/Para y Dado/Cuando/Entonces; el resto exige descripción puntual. */
  private applyValidators(t: PbiType): void {
    const c = this.form.controls;
    const hu = pbiInfo(t).userStoryFormat;
    for (const ctl of [c.como, c.quiero, c.para, c.dado, c.cuando, c.entonces]) {
      ctl.setValidators(hu ? [Validators.required, Validators.maxLength(200)] : []);
      ctl.updateValueAndValidity({ emitEvent: false });
    }
    c.description.setValidators(hu ? [] : [Validators.required, Validators.maxLength(500)]);
    c.description.updateValueAndValidity({ emitEvent: false });
  }

  newSprint(): void {
    const next = Math.max(-1, ...this.store.sprints().map((s) => s.number)) + 1;
    this.dialog
      .open(SprintDialog, { data: { projectId: this.data.projectId, nextNumber: next } })
      .afterClosed()
      .subscribe((sp) => {
        if (sp) {
          this.store.sprints.update((l) => [...l, sp]);
          this.form.controls.sprintId.setValue(sp.id);
        }
      });
  }

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    const hu = pbiInfo(v.type).userStoryFormat;

    const description = hu
      ? `Como ${v.como.trim()}, quiero ${v.quiero.trim()}, para ${v.para.trim()}.`
      : v.description.trim();
    const acceptanceCriteria = hu
      ? `Dado que ${v.dado.trim()}, cuando ${v.cuando.trim()}, entonces ${v.entonces.trim()}.`
      : v.checklist.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `- [ ] ${l}`).join('\n');

    const payload: BacklogPayload = {
      type: v.type,
      title: v.title.trim(),
      description,
      acceptanceCriteria,
      priority: v.priority,
      estimation: Number(v.estimation) || 0,
      responsableIds: v.responsableIds,
      sprintId: v.sprintId || null,
      phaseId: v.phaseId || null,
      startDate: v.startDate ? toIsoDate(v.startDate) : null,
      endDate: v.endDate ? toIsoDate(v.endDate) : null,
      dependencyId: v.dependencyId || null,
      ...(this.editing ? { status: v.status } : {}),
    };

    this.saving.set(true);
    this.error.set(null);
    const req = this.editing
      ? this.api.update(this.data.projectId, this.data.item!.id, payload)
      : this.api.create(this.data.projectId, payload);
    req.subscribe({
      next: (item) => this.ref.close(item),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
