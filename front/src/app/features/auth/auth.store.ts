import { computed, Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { persistedSignal } from '../../core/storage/persisted-signal';
import { API_BASE_URL, MOCK_MODE } from '../../core/config/api.config';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);

  private readonly _token = persistedSignal<string | null>('auth:token', null);
  private readonly _currentUser = signal<CurrentUser | null>(null);

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    if (this._token() && !MOCK_MODE) {
      // Diferido: el interceptor HTTP inyecta AuthStore, y si esta llamada
      // se dispara de forma síncrona acá todavía no terminó de construirse
      // (NG0200, dependencia circular). Se espera a que termine el constructor.
      queueMicrotask(() => this.cargarUsuarioActual());
    }
  }

  async register(payload: RegisterPayload): Promise<void> {
    if (MOCK_MODE) {
      this._token.set(this.buildMockToken(payload.email));
      this._currentUser.set({ id: 'mock-user', name: payload.name, email: payload.email });
      return;
    }
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload),
    );
    this._token.set(res.accessToken);
    await this.cargarUsuarioActual();
  }

  async login(payload: LoginPayload): Promise<void> {
    if (MOCK_MODE) {
      this._token.set(this.buildMockToken(payload.email));
      this._currentUser.set({ id: 'mock-user', name: payload.email.split('@')[0], email: payload.email });
      return;
    }
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload),
    );
    this._token.set(res.accessToken);
    await this.cargarUsuarioActual();
  }

  logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
  }

  async actualizarNombre(name: string): Promise<boolean> {
    if (MOCK_MODE) {
      const actual = this._currentUser();
      if (actual) this._currentUser.set({ ...actual, name });
      return true;
    }
    try {
      const res = await firstValueFrom(
        this.http.patch<CurrentUser>(`${API_BASE_URL}/users/me`, { name }),
      );
      this._currentUser.set(res);
      return true;
    } catch {
      return false;
    }
  }

  private async cargarUsuarioActual(): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.get<CurrentUser>(`${API_BASE_URL}/users/me`));
      this._currentUser.set(res);
    } catch {
      // Token inválido/expirado; el authGuard redirige en el próximo intento de navegación.
    }
  }

  // En modo simulado no hay backend que emita un JWT real: cualquier
  // correo/contraseña que pase las validaciones del formulario "entra".
  private buildMockToken(email: string): string {
    return `mock.${btoa(email)}.token`;
  }
}
