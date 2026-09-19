import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NuevoProyectoStore } from '../../nuevo-proyecto.store';
import { BacklogStore } from '../../../../backlog/backlog.store';
import { ItemDialog } from '../../../../backlog/item-dialog/item-dialog';

@Component({
  selector: 'app-paso-backlog',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './paso-backlog.html',
  styleUrl: './paso-backlog.scss',
})
export class PasoBacklog {
  private dialog = inject(MatDialog);
  private proyectoStore = inject(NuevoProyectoStore);
  private backlogStore = inject(BacklogStore);

  columns = ['id', 'tipo', 'titulo', 'prioridad', 'estimacion', 'responsable'];

  items = this.backlogStore.items;

  abrirNuevoItem() {
    const ref = this.dialog.open(ItemDialog, {
      data: {
        integrantes: this.proyectoStore.integrantes(),
        fases: this.proyectoStore.fases().map(f => f.nombre),
      },
    });

    ref.afterClosed().subscribe(resultado => {
      if (resultado) this.backlogStore.agregarItem(resultado);
    });
  }
}
