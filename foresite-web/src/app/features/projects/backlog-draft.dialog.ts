import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { FIBONACCI, PBI_TYPES, PRIORITIES, PbiPriority, PbiType, User, pbiInfo } from '../../core/models';

export interface DraftPhase {
  tempId: string;
  name: string;
}

/** Ítem del backlog que aún no se envió al servidor (borrador del asistente). */
export interface DraftItem {
  tempId: string;
  type: PbiType;
  title: string;
  phaseTempId: string | null;
  priority: PbiPriority;
  estimation: number;
  responsableIds: string[];
}

export interface BacklogDraftData {
  phases: DraftPhase[];
  members: User[];
  item?: DraftItem;
}

const uid = () => Math.random().toString(36).slice(2, 10);

@Component({
  selector: 'app-backlog-draft-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Editar ítem' : 'Agregar ítem' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form" style="min-width: min(560px, 84vw)">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="type">
              @for (t of types; track t.value) { <mat-option [value]="t.value">{{ t.code }} · {{ t.label }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="priority">
              @for (p of priorities; track p.value) { <mat-option [value]="p.value">{{ p.label }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="hint-line">{{ hint() }}</div>

        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" placeholder="Ej. Como vendedor quiero registrar una venta" />
          @if (form.controls.title.hasError('required')) { <mat-error>El título es obligatorio</mat-error> }
          @else if (form.controls.title.hasError('maxlength')) { <mat-error>Máximo 160 caracteres</mat-error> }
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Fase del cronograma</mat-label>
            <mat-select formControlName="phaseTempId">
              <mat-option [value]="''">Sin fase</mat-option>
              @for (p of data.phases; track p.tempId; let i = $index) { <mat-option [value]="p.tempId">{{ i + 1 }}. {{ p.name }}</mat-option> }
            </mat-select>
            @if (!data.phases.length) { <mat-hint>Agrega fases en el paso anterior para vincularlas</mat-hint> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Estimación (pts)</mat-label>
            <mat-select formControlName="estimation">
              <mat-option [value]="0">Sin estimar</mat-option>
              @for (f of fibonacci; track f) { <mat-option [value]="f">{{ f }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Responsables</mat-label>
          <mat-select formControlName="responsableIds" multiple>
            @for (u of data.members; track u.id) { <mat-option [value]="u.id">{{ u.name }}</mat-option> }
          </mat-select>
          <mat-hint>La descripción y los criterios de aceptación se completan luego en “Backlog”.</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
        <button type="submit" class="btn">{{ data.item ? 'Guardar' : 'Agregar ítem' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class BacklogDraftDialog {
  protected data = inject<BacklogDraftData>(MAT_DIALOG_DATA);
  private ref = inject<MatDialogRef<BacklogDraftDialog, DraftItem>>(MatDialogRef);
  private fb = inject(FormBuilder);

  protected types = PBI_TYPES;
  protected priorities = PRIORITIES;
  protected fibonacci = FIBONACCI;

  protected form = this.fb.nonNullable.group({
    type: [(this.data.item?.type ?? 'hu') as PbiType],
    priority: [(this.data.item?.priority ?? 'media') as PbiPriority],
    title: [this.data.item?.title ?? '', [Validators.required, Validators.maxLength(160)]],
    phaseTempId: [this.data.item?.phaseTempId ?? ''],
    estimation: [this.data.item?.estimation ?? 0],
    responsableIds: [this.data.item?.responsableIds ?? ([] as string[])],
  });

  private type = toSignal(
    this.form.controls.type.valueChanges.pipe(startWith(this.form.controls.type.value), map((v) => v)),
    { initialValue: this.form.controls.type.value },
  );
  protected hint = () => pbiInfo(this.type()).hint;

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    this.ref.close({
      tempId: this.data.item?.tempId ?? uid(),
      type: v.type,
      title: v.title.trim(),
      phaseTempId: v.phaseTempId || null,
      priority: v.priority,
      estimation: Number(v.estimation) || 0,
      responsableIds: v.responsableIds,
    });
  }
}
