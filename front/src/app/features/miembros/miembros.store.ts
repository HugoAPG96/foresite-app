import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, MOCK_MODE } from '../../core/config/api.config';
import { persistedSignal } from '../../core/storage/persisted-signal';
import { MemberApiResponse, mapMiembroFromApi, Miembro } from './miembro.model';

@Injectable({ providedIn: 'root' })
export class MiembrosStore {
  private readonly http = inject(HttpClient);

  // Solo se usa en MOCK_MODE: miembros "agregados" por proyecto, en localStorage.
  private readonly _miembrosMock = persistedSignal<Record<string, Miembro[]>>('miembros:mock', {});

  private readonly _miembros = signal<Miembro[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly miembros = this._miembros.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(projectId: string): Promise<void> {
    if (MOCK_MODE) {
      this._miembros.set(this._miembrosMock()[projectId] ?? []);
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<MemberApiResponse[]>(`${API_BASE_URL}/projects/${projectId}/members`),
      );
      this._miembros.set(res.map(mapMiembroFromApi));
    } catch {
      this._error.set('No se pudieron cargar los miembros.');
    } finally {
      this._loading.set(false);
    }
  }

  async agregar(projectId: string, email: string): Promise<boolean> {
    if (MOCK_MODE) {
      const nuevo: Miembro = {
        id: crypto.randomUUID(),
        role: null,
        usuario: { id: crypto.randomUUID(), name: email.split('@')[0], email },
      };
      const actuales = this._miembrosMock()[projectId] ?? [];
      this._miembrosMock.set({ ...this._miembrosMock(), [projectId]: [...actuales, nuevo] });
      this._miembros.set(this._miembrosMock()[projectId]);
      return true;
    }

    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<MemberApiResponse>(`${API_BASE_URL}/projects/${projectId}/members`, { email }),
      );
      this._miembros.set([...this._miembros(), mapMiembroFromApi(res)]);
      return true;
    } catch (e: any) {
      this._error.set(e?.error?.message ?? 'No se pudo agregar al miembro.');
      return false;
    }
  }
}
