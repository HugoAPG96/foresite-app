import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);
    try {
      const { nombre, email, password } = this.form.getRawValue();
      await this.authStore.register({ name: nombre!, email: email!, password: password! });
      this.router.navigate(['/proyectos']);
    } catch (err: any) {
      this.errorMessage.set(
        err?.status === 409 ? 'Ya existe una cuenta con ese correo.' : 'No se pudo crear la cuenta.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
