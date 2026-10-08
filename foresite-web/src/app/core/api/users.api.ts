import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  /** Cache de usuarios (para selects y para resolver nombres). */
  readonly all = signal<User[]>([]);

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base).pipe(tap((u) => this.all.set(u)));
  }

  get(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  /** RF-26: edita el nombre del perfil del usuario autenticado. */
  updateMe(name: string): Observable<User> {
    return this.http.patch<User>(`${this.base}/me`, { name }).pipe(
      // Mantiene al día el caché de nombres (selects, responsables…).
      tap((u) => this.all.update((list) => list.map((x) => (x.id === u.id ? { ...x, name: u.name } : x)))),
    );
  }
}
