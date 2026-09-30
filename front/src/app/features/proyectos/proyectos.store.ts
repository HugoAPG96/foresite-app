import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { CreateProyectoPayload, mapProyectoFromApi, ProjectApiResponse, Proyecto } from './proyecto.model';

@Injectable({ providedIn: 'root' })
export class ProyectosStore {
  private readonly http = inject(HttpClient);

  private readonly _proyectos = signal<Proyecto[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly proyectos = this._proyectos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(): Promise<void> {
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

  async crear(payload: CreateProyectoPayload): Promise<boolean> {
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<ProjectApiResponse>(`${API_BASE_URL}/projects`, payload),
      );
      this._proyectos.set([...this._proyectos(), mapProyectoFromApi(res)]);
      return true;
    } catch {
      this._error.set('No se pudo crear el proyecto.');
      return false;
    }
  }
}
