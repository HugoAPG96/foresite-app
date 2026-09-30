import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../auth/auth.store';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly authStore = inject(AuthStore);

  email = signal('');
  nombre = signal('');
  guardando = signal(false);
  guardado = signal(false);

  constructor() {
    effect(() => {
      const user = this.authStore.currentUser();
      if (user) {
        this.nombre.set(user.name);
        this.email.set(user.email);
      }
    });
  }

  async guardar() {
    if (!this.nombre().trim()) return;
    this.guardando.set(true);
    this.guardado.set(false);
    const ok = await this.authStore.actualizarNombre(this.nombre().trim());
    this.guardando.set(false);
    this.guardado.set(ok);
  }
}
