import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, User } from '../models';

export interface CreateProjectPayload {
  name: string;
  objective?: string;
  scope?: string;
  startDate: string;
  endDate: string;
  /** ids de los integrantes (el creador se agrega automáticamente) */
  memberIds?: string[];
}

@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/projects`;

  list(): Observable<Project[]> {
    return this.http.get<Project[]>(this.base);
  }
  get(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`);
  }
  create(payload: CreateProjectPayload): Observable<Project> {
    return this.http.post<Project>(this.base, payload);
  }
  members(id: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/${id}/members`);
  }
  /** Solo el Scrum Master. 404 si el correo no pertenece a un usuario registrado. */
  addMember(id: string, email: string): Observable<User> {
    return this.http.post<User>(`${this.base}/${id}/members`, { email });
  }
}
