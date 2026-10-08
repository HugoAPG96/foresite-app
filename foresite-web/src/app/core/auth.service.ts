import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from './models';
import { UsersApi } from './api/users.api';

interface JwtPayload {
  sub: string;
  email: string;
  exp?: number;
}

const TOKEN_KEY = 'foresite.token';

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private usersApi = inject(UsersApi);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.token());

  readonly initials = computed(() => {
    const name = this.user()?.name?.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  });

  /** Se ejecuta al iniciar la app: valida el token guardado y carga el perfil. */
  async init(): Promise<void> {
    const token = this.token();
    if (!token) return;
    const payload = decodeJwt(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      this.clear();
      return;
    }
    await firstValueFrom(this.loadUser());
  }

  login(email: string, password: string): Observable<User | null> {
    return this.http
      .post<{ accessToken: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => this.setToken(res.accessToken)),
        switchMap(() => this.loadUser()),
      );
  }

  register(name: string, email: string, password: string): Observable<User | null> {
    return this.http
      .post<{ accessToken: string }>(`${environment.apiUrl}/auth/register`, { name, email, password })
      .pipe(
        tap((res) => this.setToken(res.accessToken)),
        switchMap(() => this.loadUser()),
      );
  }

  /** RF-26: edita el nombre del perfil y actualiza el usuario en sesión. */
  updateName(name: string): Observable<User> {
    return this.usersApi.updateMe(name).pipe(
      map((u) => ({ id: u.id, name: u.name, email: u.email })),
      tap((u) => this.user.set(u)),
    );
  }

  logout(): void {
    this.clear();
    this.router.navigate(['/login']);
  }

  /** Limpia la sesión sin navegar (lo usa el interceptor ante un 401). */
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  private loadUser(): Observable<User | null> {
    const payload = this.token() ? decodeJwt(this.token()!) : null;
    if (!payload) return of(null);
    return this.usersApi.get(payload.sub).pipe(
      map((u) => ({ id: u.id, name: u.name, email: u.email })),
      // Si el endpoint falla, el perfil se arma con los datos del token.
      catchError(() => of({ id: payload.sub, name: payload.email.split('@')[0], email: payload.email })),
      tap((u) => this.user.set(u)),
    );
  }
}
