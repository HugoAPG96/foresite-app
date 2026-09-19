import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NuevoProyectoStore } from '../../nuevo-proyecto.store';

@Component({
  selector: 'app-paso-raci',
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './paso-raci.html',
  styleUrl: './paso-raci.scss',
})
export class PasoRaci {
  private store = inject(NuevoProyectoStore);

  fases = this.store.fases;
  integrantes = this.store.integrantes;

  // "Todo el equipo" es una opción válida para Informado además de cada integrante individual.
  opcionesInformado = () => [...this.integrantes(), 'Todo el equipo'];

  agregarFase() {
    this.store.agregarFase();
  }

  agregarTarea(faseIndex: number) {
    this.store.agregarTarea(faseIndex);
  }

  actualizarCampo(faseIndex: number, tareaIndex: number, campo: string, valor: string) {
    this.store.actualizarTarea(faseIndex, tareaIndex, { [campo]: valor });
  }

  confirmarTarea(faseIndex: number, tareaIndex: number) {
    this.store.confirmarTarea(faseIndex, tareaIndex);
  }

  editarTarea(faseIndex: number, tareaIndex: number) {
    this.store.editarTarea(faseIndex, tareaIndex);
  }

  eliminarTarea(faseIndex: number, tareaIndex: number) {
    this.store.eliminarTarea(faseIndex, tareaIndex);
  }
}
