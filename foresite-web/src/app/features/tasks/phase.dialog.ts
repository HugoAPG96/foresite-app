import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PlanningApi } from '../../core/api/planning.api';
import { errorMessage } from '../../core/errors';
import { Phase } from '../../core/models';

@Component({
  selector: 'app-phase-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Nueva fase</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form" style="min-width: min(420px, 80vw)">
        <mat-form-field appearance="outline">
          <mat-label>Nombre de la fase</mat-label>
          <input matInput formControlName="name" placeholder="Ej. Desarrollo backend" />
          @if (form.controls.name.hasError('required')) { <mat-error>El nombre es obligatorio</mat-error> }
          @else if (form.controls.name.hasError('maxlength')) { <mat-error>Máximo 120 caracteres</mat-error> }
        </mat-form-field>
        @if (error()) { <div class="hint-line err">{{ error() }}</div> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
        <button type="submit" class="btn" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Crear fase' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class PhaseDialog {
  private fb = inject(FormBuilder);
  private api = inject(PlanningApi);
  private ref = inject<MatDialogRef<PhaseDialog, Phase>>(MatDialogRef);
  private data = inject<{ projectId: string }>(MAT_DIALOG_DATA);

  protected form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(120)]] });
  protected saving = signal(false);
  protected error = signal<string | null>(null);

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.saving.set(true);
    this.api.createPhase(this.data.projectId, this.form.getRawValue().name.trim()).subscribe({
      next: (phase) => this.ref.close(phase),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
