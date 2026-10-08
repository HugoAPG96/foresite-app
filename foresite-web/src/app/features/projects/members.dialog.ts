import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectsApi } from '../../core/api/projects.api';
import { errorMessage } from '../../core/errors';
import { ProjectStore } from '../../core/project.store';
import { initialsOf } from '../../shared/util';

/** Integrantes del proyecto. Solo el Scrum Master (creador) puede agregar por correo. */
@Component({
  selector: 'app-members-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Integrantes del proyecto</h2>
    <mat-dialog-content style="min-width: min(460px, 82vw)">
      <ul class="members">
        @for (m of store.members(); track m.id) {
          <li>
            <span class="avatar">{{ ini(m.name) }}</span>
            <div class="who">
              <b>{{ m.name }}</b>
              <span class="muted small">{{ m.email }}</span>
            </div>
            @if (m.id === store.project()?.createdBy) { <span class="badge purple">Scrum Master</span> }
          </li>
        }
      </ul>

      @if (store.isOwner()) {
        <form [formGroup]="form" (ngSubmit)="add()" novalidate class="add">
          <div class="label">Agregar integrante</div>
          <div class="line">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Correo del usuario registrado</mat-label>
              <input matInput type="email" formControlName="email" placeholder="correo@upn.pe" autocomplete="off" />
              @if (form.controls.email.hasError('required')) { <mat-error>Ingresa un correo</mat-error> }
              @else if (form.controls.email.hasError('email')) { <mat-error>Correo no válido</mat-error> }
            </mat-form-field>
            <button type="submit" class="btn" [disabled]="saving()">{{ saving() ? 'Agregando…' : 'Agregar' }}</button>
          </div>
          @if (error()) { <div class="hint-line err" role="alert">{{ error() }}</div> }
        </form>
      } @else {
        <div class="hint-line">Solo el Scrum Master del proyecto puede agregar integrantes.</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" class="btn ghost" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .members { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .members li { display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-bottom: 1px solid var(--line); }
    .who { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .who span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .label { font-size: 12px; font-weight: 600; color: var(--ink-soft); margin-bottom: 6px; }
    .line { display: flex; gap: 10px; align-items: flex-start; }
    .line mat-form-field { flex: 1; }
    .line .btn { margin-top: 6px; }
    .hint-line { margin-top: 8px; }
  `,
})
export class MembersDialog {
  protected store = inject(ProjectStore);
  private api = inject(ProjectsApi);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  protected form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  protected saving = signal(false);
  protected error = signal<string | null>(null);
  protected ini = initialsOf;

  add(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const id = this.store.projectId();
    if (!id) return;
    this.saving.set(true);
    this.error.set(null);
    this.api.addMember(id, this.form.getRawValue().email.trim()).subscribe({
      next: (user) => {
        this.store.members.update((list) => [...list, user]);
        this.form.reset({ email: '' });
        this.saving.set(false);
        this.snack.open(`${user.name} se agregó al proyecto`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
