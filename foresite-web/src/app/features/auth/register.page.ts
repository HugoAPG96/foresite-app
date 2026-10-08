import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { LogoComponent } from '../../shared/logo';

function sameAs(a: string, b: string) {
  return (group: AbstractControl): ValidationErrors | null =>
    group.get(a)?.value === group.get(b)?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, LogoComponent],
  template: `
    <div class="auth-wrap">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="logo-box"><app-logo [size]="52" [stacked]="true" /></div>
        <p class="tagline">Crea tu cuenta para empezar</p>
        @if (error()) { <div class="auth-banner err">{{ error() }}</div> }

        <mat-form-field appearance="outline">
          <mat-label>Nombre completo</mat-label>
          <input matInput formControlName="name" autocomplete="name" />
          @if (form.controls.name.hasError('required')) { <mat-error>El nombre es obligatorio</mat-error> }
          @else if (form.controls.name.hasError('maxlength')) { <mat-error>Máximo 120 caracteres</mat-error> }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Correo</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.hasError('required')) { <mat-error>El correo es obligatorio</mat-error> }
          @else if (form.controls.email.hasError('email')) { <mat-error>Ingresa un correo válido</mat-error> }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Contraseña</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          @if (form.controls.password.hasError('required')) { <mat-error>La contraseña es obligatoria</mat-error> }
          @else if (form.controls.password.hasError('minlength')) { <mat-error>Mínimo 6 caracteres</mat-error> }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Confirmar contraseña</mat-label>
          <input matInput type="password" formControlName="confirm" autocomplete="new-password" />
          @if (form.hasError('mismatch') && form.controls.confirm.touched) { <mat-error>Las contraseñas no coinciden</mat-error> }
        </mat-form-field>

        <button class="btn" type="submit" [disabled]="loading()">{{ loading() ? 'Creando cuenta…' : 'Crear cuenta' }}</button>
        <p class="alt">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </form>
    </div>
  `,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    },
    { validators: sameAs('password', 'confirm') },
  );
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { name, email, password } = this.form.getRawValue();
    this.auth.register(name.trim(), email.trim(), password).subscribe({
      next: () => this.router.navigate(['/proyectos']),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
