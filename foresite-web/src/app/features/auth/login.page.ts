import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { LogoComponent } from '../../shared/logo';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, LogoComponent],
  template: `
    <div class="auth-wrap">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="logo-box"><app-logo [size]="52" [stacked]="true" /></div>
        <p class="tagline">Gestión de proyectos con visión predictiva</p>

        @if (expired) { <div class="auth-banner info">Tu sesión expiró. Inicia sesión nuevamente.</div> }
        @if (error()) { <div class="auth-banner err">{{ error() }}</div> }

        <mat-form-field appearance="outline">
          <mat-label>Correo</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" placeholder="nombre@correo.com" />
          @if (form.controls.email.hasError('required')) { <mat-error>El correo es obligatorio</mat-error> }
          @else if (form.controls.email.hasError('email')) { <mat-error>Ingresa un correo válido</mat-error> }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Contraseña</mat-label>
          <input matInput [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
          <button type="button" mat-icon-button matSuffix (click)="show.set(!show())" aria-label="Mostrar u ocultar contraseña">
            <mat-icon>{{ show() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) { <mat-error>La contraseña es obligatoria</mat-error> }
          @else if (form.controls.password.hasError('minlength')) { <mat-error>Mínimo 6 caracteres</mat-error> }
        </mat-form-field>

        <button class="btn" type="submit" [disabled]="loading()">
          {{ loading() ? 'Ingresando…' : 'Ingresar' }}
        </button>
        @if (slow()) {
          <p class="small muted" style="text-align:center;margin-top:10px">
            El servidor gratuito puede tardar hasta ~50 s en despertar. Gracias por esperar.
          </p>
        }
        <p class="alt">¿No tienes cuenta? <a routerLink="/registro">Regístrate</a></p>
      </form>
    </div>
  `,
})
export class LoginPage implements OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  protected expired = !!inject(ActivatedRoute).snapshot.queryParamMap.get('expired');

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  protected loading = signal(false);
  protected slow = signal(false);
  protected show = signal(false);
  protected error = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.timer = setTimeout(() => this.slow.set(true), 5000);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/proyectos']),
      error: (err) => {
        this.error.set(err?.status === 401 ? 'Correo o contraseña incorrectos.' : errorMessage(err));
        this.stop();
      },
    });
  }

  private stop(): void {
    clearTimeout(this.timer);
    this.loading.set(false);
    this.slow.set(false);
  }
  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
