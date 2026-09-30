import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, MOCK_MODE } from '../../core/config/api.config';
import { persistedSignal } from '../../core/storage/persisted-signal';
import { CreateProyectoPayload, mapProyectoFromApi, ProjectApiResponse, Proyecto } from './proyecto.model';

const PROYECTOS_MOCK: Proyecto[] = [
  { id: 'mock-1', nombre: 'ReparaYa', descripcion: 'Plataforma de solicitudes de mantenimiento', avance: 62, estado: 'ambar' },
  { id: 'mock-2', nombre: 'App de delivery UNI', descripcion: 'Pedidos internos entre facultades', avance: 88, estado: 'verde' },
  { id: 'mock-3', nombre: 'Portal de matrículas', descripcion: 'Rediseño del flujo de matrícula online', avance: 34, estado: 'ambar' },
];

@Injectable({ providedIn: 'root' })
export class ProyectosStore {
  private readonly http = inject(HttpClient);

  // Solo se usa en MOCK_MODE, para que los proyectos "creados" sobrevivan a un
  // reload mientras no hay backend. Con backend real, no se toca.
  private readonly _proyectosMock = persistedSignal<Proyecto[]>('proyectos:mock', PROYECTOS_MOCK);

  private readonly _proyectos = signal<Proyecto[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly proyectos = this._proyectos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Id del proyecto "activo" (dentro del cual está navegando el usuario).
  // Lo setea `ProyectoContexto` a partir de la URL — no se persiste porque
  // la URL ya es la fuente de verdad en cada carga.
  private readonly _proyectoActualId = signal<string | null>(null);
  readonly proyectoActual = computed(() =>
    this._proyectos().find(p => p.id === this._proyectoActualId()) ?? null,
  );

  seleccionar(id: string | null): void {
    this._proyectoActualId.set(id);
  }

  async load(): Promise<void> {
    if (MOCK_MODE) {
      this._proyectos.set(this._proyectosMock());
      return;
    }

    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<ProjectApiResponse[]>(`${API_BASE_URL}/projects`),
      );
      this._proyectos.set(res.map(mapProyectoFromApi));
    } catch {
      this._error.set('No se pudieron cargar los proyectos.');
    } finally {
      this._loading.set(false);
    }
  }

  async crear(payload: CreateProyectoPayload): Promise<Proyecto | null> {
    if (MOCK_MODE) {
      const nuevo: Proyecto = {
        id: crypto.randomUUID(),
        nombre: payload.name,
        descripcion: payload.objective ?? '',
        avance: 0,
        estado: 'verde',
      };
      this._proyectosMock.set([...this._proyectosMock(), nuevo]);
      this._proyectos.set(this._proyectosMock());
      return nuevo;
    }

    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<ProjectApiResponse>(`${API_BASE_URL}/projects`, payload),
      );
      const proyecto = mapProyectoFromApi(res);
      this._proyectos.set([...this._proyectos(), proyecto]);
      return proyecto;
    } catch {
      this._error.set('No se pudo crear el proyecto.');
      return null;
    }
  }
}
