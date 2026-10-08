import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, MOCK_MODE } from '../../core/config/api.config';
import { persistedSignal } from '../../core/storage/persisted-signal';
import {
  COLUMNA_TO_STATUS,
  ColumnaTarea,
  PRIORIDAD_UI_TO_API,
  STATUS_TO_COLUMNA,
  Tarea,
  TaskApiResponse,
  mapTareaFromApi,
} from './tarea.model';

export interface CrearTareaPayload {
  title: string;
  responsibleId: string;
  startDate: string;
  endDate: string;
  priority: Tarea['prioridad'];
}

export interface ActualizarTareaPayload {
  title?: string;
  responsibleId?: string;
  startDate?: string;
  endDate?: string;
  priority?: Tarea['prioridad'];
}

@Injectable({ providedIn: 'root' })
export class TareasStore {
  private readonly http = inject(HttpClient);

  private readonly _pendienteMock = persistedSignal<Tarea[]>('tareas:mock:pendiente', []);
  private readonly _progresoMock = persistedSignal<Tarea[]>('tareas:mock:progreso', []);
  private readonly _completadaMock = persistedSignal<Tarea[]>('tareas:mock:completada', []);

  private readonly _pendiente = signal<Tarea[]>([]);
  private readonly _progreso = signal<Tarea[]>([]);
  private readonly _completada = signal<Tarea[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly pendiente = this._pendiente.asReadonly();
  readonly progreso = this._progreso.asReadonly();
  readonly completada = this._completada.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly columnas: Record<ColumnaTarea, WritableSignal<Tarea[]>> = {
    pendiente: this._pendiente,
    progreso: this._progreso,
    completada: this._completada,
  };

  get todas(): Tarea[] {
    return [...this._pendiente(), ...this._progreso(), ...this._completada()];
  }

  async load(projectId: string): Promise<void> {
    if (MOCK_MODE) {
      this._pendiente.set(this._pendienteMock());
      this._progreso.set(this._progresoMock());
      this._completada.set(this._completadaMock());
      return;
    }

    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<TaskApiResponse[]>(`${API_BASE_URL}/projects/${projectId}/tasks`),
      );
      const porEstado: Record<ColumnaTarea, Tarea[]> = { pendiente: [], progreso: [], completada: [] };
      res.forEach(t => porEstado[STATUS_TO_COLUMNA[t.status]].push(mapTareaFromApi(t)));
      this._pendiente.set(porEstado.pendiente);
      this._progreso.set(porEstado.progreso);
      this._completada.set(porEstado.completada);
    } catch {
      this._error.set('No se pudieron cargar las tareas.');
    } finally {
      this._loading.set(false);
    }
  }

  async crear(projectId: string, payload: CrearTareaPayload): Promise<boolean> {
    if (MOCK_MODE) {
      const nueva: Tarea = {
        id: crypto.randomUUID(),
        codigo: `HU-${String(this.todas.length + 1).padStart(2, '0')}`,
        titulo: payload.title,
        responsableId: payload.responsibleId,
        fechaInicio: payload.startDate,
        fechaFin: payload.endDate,
        prioridad: payload.priority,
        vencida: false,
      };
      this._pendienteMock.set([...this._pendienteMock(), nueva]);
      this._pendiente.set(this._pendienteMock());
      return true;
    }

    this._error.set(null);
    try {
      const body = {
        title: payload.title,
        responsibleId: payload.responsibleId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        priority: PRIORIDAD_UI_TO_API[payload.priority],
      };
      const res = await firstValueFrom(
        this.http.post<TaskApiResponse>(`${API_BASE_URL}/projects/${projectId}/tasks`, body),
      );
      this._pendiente.set([...this._pendiente(), mapTareaFromApi(res)]);
      return true;
    } catch {
      this._error.set('No se pudo crear la tarea.');
      return false;
    }
  }

  async actualizar(projectId: string, id: string, cambios: ActualizarTareaPayload): Promise<boolean> {
    const columna = this.columnaDe(id);

    if (MOCK_MODE) {
      if (!columna) return true;
      const col = this.mockSignalDe(columna);
      const actualizada = col().map(t => (t.id === id ? { ...t, ...this.aTareaParcial(cambios) } : t));
      col.set(actualizada);
      this.columnas[columna].set(actualizada);
      return true;
    }

    this._error.set(null);
    try {
      const body: Record<string, unknown> = {};
      if (cambios.title !== undefined) body['title'] = cambios.title;
      if (cambios.responsibleId !== undefined) body['responsibleId'] = cambios.responsibleId;
      if (cambios.startDate !== undefined) body['startDate'] = cambios.startDate;
      if (cambios.endDate !== undefined) body['endDate'] = cambios.endDate;
      if (cambios.priority !== undefined) body['priority'] = PRIORIDAD_UI_TO_API[cambios.priority];

      const res = await firstValueFrom(
        this.http.patch<TaskApiResponse>(`${API_BASE_URL}/projects/${projectId}/tasks/${id}`, body),
      );
      if (columna) {
        const col = this.columnas[columna];
        col.set(col().map(t => (t.id === id ? mapTareaFromApi(res) : t)));
      }
      return true;
    } catch {
      this._error.set('No se pudo actualizar la tarea.');
      return false;
    }
  }

  mover(projectId: string, origen: ColumnaTarea, destino: ColumnaTarea, indicePrevio: number, indiceActual: number) {
    const columnaOrigen = this.columnas[origen];
    const arrayOrigen = [...columnaOrigen()];

    if (origen === destino) {
      moveItemInArray(arrayOrigen, indicePrevio, indiceActual);
      columnaOrigen.set(arrayOrigen);
      this.persistirMovimientoMock();
      return;
    }

    const columnaDestino = this.columnas[destino];
    const arrayDestino = [...columnaDestino()];
    const tarea = arrayOrigen[indicePrevio];
    transferArrayItem(arrayOrigen, arrayDestino, indicePrevio, indiceActual);
    columnaOrigen.set(arrayOrigen);
    columnaDestino.set(arrayDestino);

    if (MOCK_MODE) {
      this.persistirMovimientoMock();
      return;
    }

    firstValueFrom(
      this.http.patch(`${API_BASE_URL}/projects/${projectId}/tasks/${tarea.id}`, {
        status: COLUMNA_TO_STATUS[destino],
      }),
    ).catch(() => {
      // Revertir si el backend rechaza el cambio de estado
      columnaDestino.set(columnaDestino().filter(t => t.id !== tarea.id));
      columnaOrigen.set([...columnaOrigen(), tarea]);
      this._error.set('No se pudo mover la tarea.');
    });
  }

  // En modo simulado no hay backend: se refleja el movimiento en las señales
  // persistidas para que sobreviva a un reload (antes se perdía).
  private persistirMovimientoMock() {
    if (!MOCK_MODE) return;
    this._pendienteMock.set(this._pendiente());
    this._progresoMock.set(this._progreso());
    this._completadaMock.set(this._completada());
  }

  private columnaDe(id: string): ColumnaTarea | null {
    for (const key of Object.keys(this.columnas) as ColumnaTarea[]) {
      if (this.columnas[key]().some(t => t.id === id)) return key;
    }
    return null;
  }

  private mockSignalDe(columna: ColumnaTarea): WritableSignal<Tarea[]> {
    return columna === 'pendiente' ? this._pendienteMock : columna === 'progreso' ? this._progresoMock : this._completadaMock;
  }

  private aTareaParcial(cambios: ActualizarTareaPayload): Partial<Tarea> {
    const parcial: Partial<Tarea> = {};
    if (cambios.title !== undefined) parcial.titulo = cambios.title;
    if (cambios.responsibleId !== undefined) parcial.responsableId = cambios.responsibleId;
    if (cambios.startDate !== undefined) parcial.fechaInicio = cambios.startDate;
    if (cambios.endDate !== undefined) parcial.fechaFin = cambios.endDate;
    if (cambios.priority !== undefined) parcial.prioridad = cambios.priority;
    return parcial;
  }
}
