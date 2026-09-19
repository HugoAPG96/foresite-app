import { Component, inject, signal } from '@angular/core';
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
