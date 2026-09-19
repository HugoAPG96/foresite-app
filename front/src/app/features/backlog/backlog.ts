import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BacklogStore } from './backlog.store';
import { ItemDialog } from './item-dialog/item-dialog';
import { NuevoProyectoStore } from '../proyectos/proyecto-wizard/nuevo-proyecto.store';

@Component({
  selector: 'app-backlog',
  imports: [MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './backlog.html',
  styleUrl: './backlog.scss',
})
export class Backlog {
  private dialog = inject(MatDialog);
  private store = inject(BacklogStore);
  private proyectoStore = inject(NuevoProyectoStore);

  items = this.store.items;
  columns = ['id', 'tipo', 'titulo', 'prioridad', 'estimacion', 'responsable'];

  abrirNuevoItem() {
    const ref = this.dialog.open(ItemDialog, {
      data: {
        integrantes: this.proyectoStore.integrantes(),
        fases: this.proyectoStore.fases().map(f => f.nombre),
      },
    });

    ref.afterClosed().subscribe(resultado => {
      if (resultado) this.store.agregarItem(resultado);
    });
  }
}
