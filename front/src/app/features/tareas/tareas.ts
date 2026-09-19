import { Component, inject, signal } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TareasStore } from './tareas.store';
import { ColumnaTarea, Tarea } from './tarea.model';

@Component({
  selector: 'app-tareas',
  imports: [DragDropModule, MatButtonToggleModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './tareas.html',
  styleUrl: './tareas.scss',
})
export class Tareas {
  private store = inject(TareasStore);

  vista = signal<'kanban' | 'cronograma'>('kanban');

  columnas = {
    pendiente: 'Pendiente',
    progreso: 'En progreso',
    completada: 'Completada',
  };

  pendiente = this.store.pendiente;
  progreso = this.store.progreso;
  completada = this.store.completada;

  cronogramaColumns = ['id', 'titulo', 'responsable', 'fechaInicio', 'fechaFin'];

  get todasLasTareas(): Tarea[] {
    return this.store.todas;
  }

  agregarTarea() {
    this.store.agregarTarea();
  }

  drop(event: CdkDragDrop<Tarea[]>) {
    this.store.mover(
      event.previousContainer.id as ColumnaTarea,
      event.container.id as ColumnaTarea,
      event.previousIndex,
      event.currentIndex,
    );
  }
}
