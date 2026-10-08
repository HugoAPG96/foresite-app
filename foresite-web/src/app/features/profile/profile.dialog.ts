import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';

/** RF-26: ver y editar el nombre del perfil (el correo es solo lectura). */
@Component({
  selector: 'app-profile-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Mi perfil</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form" style="min-width: min(420px, 80vw)">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" autocomplete="name" />
          @if (form.controls.name.hasError('required')) { <mat-error>El nombre es obligatorio</mat-error> }
          @else if (form.controls.name.hasError('minlength')) { <mat-error>Mínimo 2 caracteres</mat-error> }
          @else if (form.controls.name.hasError('maxlength')) { <mat-error>Máximo 120 caracteres</mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Correo</mat-label>
          <input matInput [value]="auth.user()?.email ?? ''" readonly disabled />
        </mat-form-field>
        <div class="hint-line">El correo es tu identificador de acceso y no se puede cambiar.</div>
        @if (error()) { <div class="hint-line err">{{ error() }}</div> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
        <button type="submit" class="btn" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ProfileDialog {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<ProfileDialog>);
  private snack = inject(MatSnackBar);

  protected form = this.fb.nonNullable.group({
    name: [this.auth.user()?.name ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });
  protected saving = signal(false);
  protected error = signal<string | null>(null);

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const name = this.form.getRawValue().name.trim();
    if (name === this.auth.user()?.name) return this.ref.close();
    this.saving.set(true);
    this.error.set(null);
    this.auth.updateName(name).subscribe({
      next: () => {
        this.snack.open('Perfil actualizado', 'OK', { duration: 3000 });
        this.ref.close(true);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
