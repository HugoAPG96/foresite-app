import { Injectable, WritableSignal } from '@angular/core';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { persistedSignal } from '../../core/storage/persisted-signal';
import { ColumnaTarea, Tarea } from './tarea.model';

// Mock por ahora — cuando exista el endpoint de tareas de Miguel, esto pasa
// a poblarse con HttpClient y `mover()` termina llamando a un PATCH que
// actualiza el estado de la tarea en el backend.
const PENDIENTE_MOCK: Tarea[] = [
  { id: 'HU-08', titulo: 'Diseñar matriz RACI', responsable: 'Renzo', fechaInicio: '01/10', fechaFin: '03/10', prioridad: 'Media', vencida: false },
  { id: 'HU-11', titulo: 'Definir modelo de riesgos', responsable: 'Hugo', fechaInicio: '02/10', fechaFin: '05/10', prioridad: 'Baja', vencida: false },
];

const PROGRESO_MOCK: Tarea[] = [
  { id: 'HU-05', titulo: 'Endpoint de autenticación', responsable: 'Miguel', fechaInicio: '28/09', fechaFin: '04/10', prioridad: 'Alta', vencida: false },
  { id: 'HU-06', titulo: 'Wizard paso 1 (Acta)', responsable: 'Renzo', fechaInicio: '29/09', fechaFin: '12/09', prioridad: 'Media', vencida: true },
];

const COMPLETADA_MOCK: Tarea[] = [
  { id: 'HU-01', titulo: 'Setup del proyecto Angular', responsable: 'Renzo', fechaInicio: '20/09', fechaFin: '21/09', prioridad: 'Baja', vencida: false },
  { id: 'HU-02', titulo: 'Setup del backend NestJS', responsable: 'Miguel', fechaInicio: '20/09', fechaFin: '22/09', prioridad: 'Media', vencida: false },
  { id: 'HU-03', titulo: 'Deploy inicial en Render/Vercel', responsable: 'Hugo', fechaInicio: '22/09', fechaFin: '23/09', prioridad: 'Baja', vencida: false },
];

@Injectable({ providedIn: 'root' })
export class TareasStore {
  private readonly _pendiente = persistedSignal<Tarea[]>('tareas:pendiente', PENDIENTE_MOCK);
  private readonly _progreso = persistedSignal<Tarea[]>('tareas:progreso', PROGRESO_MOCK);
  private readonly _completada = persistedSignal<Tarea[]>('tareas:completada', COMPLETADA_MOCK);

  readonly pendiente = this._pendiente.asReadonly();
  readonly progreso = this._progreso.asReadonly();
  readonly completada = this._completada.asReadonly();

  private readonly columnas: Record<ColumnaTarea, WritableSignal<Tarea[]>> = {
    pendiente: this._pendiente,
    progreso: this._progreso,
    completada: this._completada,
  };

  get todas(): Tarea[] {
    return [...this._pendiente(), ...this._progreso(), ...this._completada()];
  }

  agregarTarea() {
    const numero = this.todas.length + 1;
    const nueva: Tarea = {
      id: `HU-${String(numero).padStart(2, '0')}`,
      titulo: 'Nueva tarea',
      responsable: '',
      fechaInicio: '',
      fechaFin: '',
      prioridad: 'Media',
      vencida: false,
    };
    this._pendiente.set([...this._pendiente(), nueva]);
  }

  mover(origen: ColumnaTarea, destino: ColumnaTarea, indicePrevio: number, indiceActual: number) {
    const columnaOrigen = this.columnas[origen];
    const arrayOrigen = [...columnaOrigen()];

    if (origen === destino) {
      moveItemInArray(arrayOrigen, indicePrevio, indiceActual);
      columnaOrigen.set(arrayOrigen);
      return;
    }

    const columnaDestino = this.columnas[destino];
    const arrayDestino = [...columnaDestino()];
    transferArrayItem(arrayOrigen, arrayDestino, indicePrevio, indiceActual);
    columnaOrigen.set(arrayOrigen);
    columnaDestino.set(arrayDestino);
  }
}
