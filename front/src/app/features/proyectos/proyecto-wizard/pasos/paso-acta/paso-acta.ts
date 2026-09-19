import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NuevoProyectoStore } from '../../nuevo-proyecto.store';

@Component({
  selector: 'app-paso-acta',
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './paso-acta.html',
  styleUrl: './paso-acta.scss',
})
export class PasoActa {
  private store = inject(NuevoProyectoStore);

  integrantes = this.store.integrantes;
  acta = this.store.acta;

  actualizar(campo: 'nombre' | 'objetivo' | 'alcance', valor: string) {
    this.store.actualizarActa({ [campo]: valor });
  }

  // El store guarda fechas como ISO string (para poder ir a localStorage);
  // el datepicker trabaja con Date, así que se convierte en la frontera.
  fechaInicio = computed(() => this.aDate(this.acta().fechaInicio));
  fechaLimite = computed(() => this.aDate(this.acta().fechaLimite));

  private aDate(iso: string | null): Date | null {
    return iso ? new Date(iso) : null;
  }

  actualizarFecha(campo: 'fechaInicio' | 'fechaLimite', valor: Date | null) {
    this.store.actualizarActa({ [campo]: valor ? valor.toISOString() : null });
  }

  agregandoIntegrante = signal(false);
  nuevoIntegrante = signal('');

  mostrarInputIntegrante() {
    this.agregandoIntegrante.set(true);
  }

  confirmarIntegrante() {
    this.store.agregarIntegrante(this.nuevoIntegrante());
    this.nuevoIntegrante.set('');
    this.agregandoIntegrante.set(false);
  }
}
