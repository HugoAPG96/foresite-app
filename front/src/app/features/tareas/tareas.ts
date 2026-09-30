import { Component, effect, inject, signal } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { TareasStore } from './tareas.store';
import { ColumnaTarea, Tarea } from './tarea.model';
import { TareaDialog } from './tarea-dialog/tarea-dialog';
import { MiembrosStore } from '../miembros/miembros.store';
import { ProyectosStore } from '../proyectos/proyectos.store';

@Component({
  selector: 'app-tareas',
  imports: [DragDropModule, MatButtonToggleModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './tareas.html',
  styleUrl: './tareas.scss',
})
export class Tareas {
  private store = inject(TareasStore);
  private miembrosStore = inject(MiembrosStore);
  private proyectosStore = inject(ProyectosStore);
  private dialog = inject(MatDialog);

  vista = signal<'kanban' | 'cronograma'>('kanban');

  columnas = {
    pendiente: 'Pendiente',
    progreso: 'En progreso',
    completada: 'Completada',
  };

  pendiente = this.store.pendiente;
  progreso = this.store.progreso;
  completada = this.store.completada;
  miembros = this.miembrosStore.miembros;
  proyecto = this.proyectosStore.proyectoActual;

  cronogramaColumns = ['codigo', 'titulo', 'responsable', 'fechaInicio', 'fechaFin'];

  constructor() {
    effect(() => {
      const id = this.proyectosStore.proyectoActual()?.id;
      if (id) {
        this.miembrosStore.load(id);
        this.store.load(id);
      }
    });
  }

  get todasLasTareas(): Tarea[] {
    return this.store.todas;
  }

  nombreDe(responsableId: string): string {
    return this.miembros().find(m => m.usuario?.id === responsableId)?.usuario?.name ?? '(sin asignar)';
  }

  abrirTarea(tarea?: Tarea) {
    const projectId = this.proyectosStore.proyectoActual()?.id;
    if (!projectId) return;

    const ref = this.dialog.open(TareaDialog, { data: { miembros: this.miembros(), tarea } });
    ref.afterClosed().subscribe(async resultado => {
      if (!resultado) return;
      if (tarea) {
        await this.store.actualizar(projectId, tarea.id, resultado);
      } else {
        await this.store.crear(projectId, resultado);
      }
    });
  }

  drop(event: CdkDragDrop<Tarea[]>) {
    const projectId = this.proyectosStore.proyectoActual()?.id;
    if (!projectId) return;
    this.store.mover(
      projectId,
      event.previousContainer.id as ColumnaTarea,
      event.container.id as ColumnaTarea,
      event.previousIndex,
      event.currentIndex,
    );
  }
}
