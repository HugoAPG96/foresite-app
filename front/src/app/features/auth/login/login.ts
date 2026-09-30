import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  public fb = inject(FormBuilder);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    email:['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  async onSubmit(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return ;
    }

    this.errorMessage.set(null);
    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.authStore.login({ email: email!, password: password! });
      this.router.navigate(['/proyectos']);
    } catch {
      this.errorMessage.set('Correo o contraseña incorrectos.');
    } finally {
      this.loading.set(false);
    }
  }

}
