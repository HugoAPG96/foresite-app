import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Phase, Risk, Sprint } from '../models';

/** Fases del cronograma, sprints y lectura de riesgos (solo para el Health Score). */
@Injectable({ providedIn: 'root' })
export class PlanningApi {
  private http = inject(HttpClient);
  private url = (projectId: string, resource: string) => `${environment.apiUrl}/projects/${projectId}/${resource}`;

  phases(projectId: string): Observable<Phase[]> {
    return this.http.get<Phase[]>(this.url(projectId, 'phases'));
  }
  createPhase(projectId: string, name: string): Observable<Phase> {
    return this.http.post<Phase>(this.url(projectId, 'phases'), { name });
  }
  sprints(projectId: string): Observable<Sprint[]> {
    return this.http.get<Sprint[]>(this.url(projectId, 'sprints'));
  }
  createSprint(projectId: string, payload: { number: number; startDate: string; endDate: string }): Observable<Sprint> {
    return this.http.post<Sprint>(this.url(projectId, 'sprints'), payload);
  }
  risks(projectId: string): Observable<Risk[]> {
    return this.http.get<Risk[]>(this.url(projectId, 'risks'));
  }
}
