import { computed, Injectable, inject } from '@angular/core';
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

interface AuthResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);

  private readonly _token = persistedSignal<string | null>('auth:token', null);

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  async register(payload: RegisterPayload): Promise<void> {
    if (MOCK_MODE) {
      this._token.set(this.buildMockToken(payload.email));
      return;
    }
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload),
    );
    this._token.set(res.accessToken);
  }

  async login(payload: LoginPayload): Promise<void> {
    if (MOCK_MODE) {
      this._token.set(this.buildMockToken(payload.email));
      return;
    }
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload),
    );
    this._token.set(res.accessToken);
  }

  logout(): void {
    this._token.set(null);
  }

  // En modo simulado no hay backend que emita un JWT real: cualquier
  // correo/contraseña que pase las validaciones del formulario "entra".
  private buildMockToken(email: string): string {
    return `mock.${btoa(email)}.token`;
  }
}
