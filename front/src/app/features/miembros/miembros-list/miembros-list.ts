import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MiembrosStore } from '../miembros.store';
import { ProyectosStore } from '../../proyectos/proyectos.store';

@Component({
  selector: 'app-miembros-list',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  templateUrl: './miembros-list.html',
  styleUrl: './miembros-list.scss',
})
export class MiembrosList {
  private readonly store = inject(MiembrosStore);
  private readonly proyectosStore = inject(ProyectosStore);

  miembros = this.store.miembros;
  loading = this.store.loading;
  error = this.store.error;
  nuevoEmail = signal('');

  constructor() {
    // ProyectoContexto puede tardar en resolver `proyectoActual`; este effect
    // vuelve a correr solo cuando deja de ser null.
    effect(() => {
      const id = this.proyectosStore.proyectoActual()?.id;
      if (id) this.store.load(id);
    });
  }

  async agregar() {
    const email = this.nuevoEmail().trim();
    const id = this.proyectosStore.proyectoActual()?.id;
    if (!email || !id) return;
    const ok = await this.store.agregar(id, email);
    if (ok) this.nuevoEmail.set('');
  }
}
