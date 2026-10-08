import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskStatus } from '../models';

export interface TaskPayload {
  phaseId: string;
  backlogItemId?: string | null;
  title: string;
  responsibleId: string;
  accountableId: string;
  consultedIds?: string[];
  informedIds?: string[];
  startDate: string;
  endDate: string;
}

export type TaskPatch = Partial<TaskPayload> & { percentComplete?: number; status?: TaskStatus };

@Injectable({ providedIn: 'root' })
export class TasksApi {
  private http = inject(HttpClient);
  private url = (projectId: string) => `${environment.apiUrl}/projects/${projectId}/tasks`;

  list(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(this.url(projectId));
  }
  create(projectId: string, payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(this.url(projectId), payload);
  }
  update(projectId: string, taskId: string, patch: TaskPatch): Observable<Task> {
    return this.http.patch<Task>(`${this.url(projectId)}/${taskId}`, patch);
  }
  remove(projectId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(projectId)}/${taskId}`);
  }
}
