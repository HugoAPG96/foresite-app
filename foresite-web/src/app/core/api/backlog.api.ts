import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BacklogItem, PbiPriority, PbiStatus, PbiType } from '../models';

export interface BacklogPayload {
  type: PbiType;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority: PbiPriority;
  estimation?: number;
  status?: PbiStatus;
  responsableIds: string[];
  sprintId?: string | null;
  phaseId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dependencyId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BacklogApi {
  private http = inject(HttpClient);
  private url = (projectId: string) => `${environment.apiUrl}/projects/${projectId}/backlog`;

  list(projectId: string): Observable<BacklogItem[]> {
    return this.http.get<BacklogItem[]>(this.url(projectId));
  }
  create(projectId: string, payload: BacklogPayload): Observable<BacklogItem> {
    return this.http.post<BacklogItem>(this.url(projectId), payload);
  }
  update(projectId: string, itemId: string, patch: Partial<BacklogPayload>): Observable<BacklogItem> {
    return this.http.patch<BacklogItem>(`${this.url(projectId)}/${itemId}`, patch);
  }
  remove(projectId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(projectId)}/${itemId}`);
  }
}
