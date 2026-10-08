import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PlanningApi } from '../../core/api/planning.api';
import { errorMessage } from '../../core/errors';
import { Sprint } from '../../core/models';
import { toIsoDate } from '../../core/util/dates';

function dateRange(g: AbstractControl): ValidationErrors | null {
  const s = g.get('startDate')?.value as Date | null;
  const e = g.get('endDate')?.value as Date | null;
  return s && e && e < s ? { range: true } : null;
}

@Component({
  selector: 'app-sprint-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  template: `
    <h2 mat-dialog-title>Nuevo sprint</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form" style="min-width: min(460px, 82vw)">
        <mat-form-field appearance="outline">
          <mat-label>N° de sprint</mat-label>
          <input matInput type="number" min="0" step="1" formControlName="number" />
          @if (form.controls.number.hasError('required')) { <mat-error>Ingresa el número</mat-error> }
          @else if (form.controls.number.hasError('min')) { <mat-error>Debe ser 0 o mayor</mat-error> }
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Inicio</mat-label>
            <input matInput [matDatepicker]="s" formControlName="startDate" readonly (click)="s.open()" />
            <mat-datepicker-toggle matIconSuffix [for]="s" /><mat-datepicker #s />
            @if (form.controls.startDate.hasError('required')) { <mat-error>Selecciona la fecha</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fin</mat-label>
            <input matInput [matDatepicker]="e" formControlName="endDate" readonly (click)="e.open()" />
            <mat-datepicker-toggle matIconSuffix [for]="e" /><mat-datepicker #e />
            @if (form.controls.endDate.hasError('required')) { <mat-error>Selecciona la fecha</mat-error> }
          </mat-form-field>
        </div>
        @if (form.hasError('range')) { <div class="hint-line err">La fecha de fin no puede ser anterior al inicio.</div> }
        @if (error()) { <div class="hint-line err">{{ error() }}</div> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
        <button type="submit" class="btn" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Crear sprint' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class SprintDialog {
  private fb = inject(FormBuilder);
  private api = inject(PlanningApi);
  private ref = inject<MatDialogRef<SprintDialog, Sprint>>(MatDialogRef);
  private data = inject<{ projectId: string; nextNumber: number }>(MAT_DIALOG_DATA);

  protected form = this.fb.nonNullable.group(
    {
      number: [this.data.nextNumber, [Validators.required, Validators.min(0)]],
      startDate: [null as Date | null, [Validators.required]],
      endDate: [null as Date | null, [Validators.required]],
    },
    { validators: dateRange },
  );
  protected saving = signal(false);
  protected error = signal<string | null>(null);

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createSprint(this.data.projectId, { number: Number(v.number), startDate: toIsoDate(v.startDate!), endDate: toIsoDate(v.endDate!) })
      .subscribe({
        next: (sp) => this.ref.close(sp),
        error: (err) => {
          this.error.set(errorMessage(err));
          this.saving.set(false);
        },
      });
  }
}
