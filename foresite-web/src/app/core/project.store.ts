import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { BacklogApi } from './api/backlog.api';
import { AuthService } from './auth.service';
import { PlanningApi } from './api/planning.api';
import { ProjectsApi } from './api/projects.api';
import { TasksApi } from './api/tasks.api';
import { UsersApi } from './api/users.api';
import { errorMessage } from './errors';
import { computeMetrics } from './metrics';
import { BacklogItem, Phase, Project, Risk, Sprint, Task, User } from './models';

/**
 * Estado del proyecto abierto. Todas las pantallas del proyecto (dashboard,
 * tareas, backlog, reportes) leen de aquí, así los indicadores se recalculan
 * automáticamente cuando cambia cualquier dato.
 */
@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private projectsApi = inject(ProjectsApi);
  private tasksApi = inject(TasksApi);
  private backlogApi = inject(BacklogApi);
  private planningApi = inject(PlanningApi);
  private usersApi = inject(UsersApi);
  private auth = inject(AuthService);

  readonly projectId = signal<string | null>(null);
  readonly project = signal<Project | null>(null);
  readonly tasks = signal<Task[]>([]);
  readonly backlog = signal<BacklogItem[]>([]);
  readonly phases = signal<Phase[]>([]);
  readonly sprints = signal<Sprint[]>([]);
  readonly members = signal<User[]>([]);
  readonly risks = signal<Risk[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** El Scrum Master es el creador del proyecto: solo él agrega integrantes. */
  readonly isOwner = computed(() => {
    const p = this.project();
    const u = this.auth.user();
    return !!p && !!u && p.createdBy === u.id;
  });

  /** id → nombre (integrantes + cualquier usuario conocido). */
  readonly names = computed(() => {
    const map = new Map<string, string>();
    this.usersApi.all().forEach((u) => map.set(u.id, u.name));
    this.members().forEach((u) => map.set(u.id, u.name));
    return map;
  });

  /** Personas asignables en los formularios: integrantes del proyecto o, si no hay, todos los usuarios. */
  readonly people = computed(() => (this.members().length ? this.members() : this.usersApi.all()));

  readonly metrics = computed(() => {
    const project = this.project();
    if (!project) return null;
    return computeMetrics({
      project,
      tasks: this.tasks(),
      risks: this.risks(),
      memberIds: this.members().map((m) => m.id),
      names: this.names(),
    });
  });

  load(projectId: string): void {
    if (this.projectId() !== projectId) this.reset();
    this.projectId.set(projectId);
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      project: this.projectsApi.get(projectId),
      tasks: this.tasksApi.list(projectId).pipe(catchError(() => of([] as Task[]))),
      backlog: this.backlogApi.list(projectId).pipe(catchError(() => of([] as BacklogItem[]))),
      phases: this.planningApi.phases(projectId).pipe(catchError(() => of([] as Phase[]))),
      sprints: this.planningApi.sprints(projectId).pipe(catchError(() => of([] as Sprint[]))),
      members: this.projectsApi.members(projectId).pipe(catchError(() => of([] as User[]))),
      risks: this.planningApi.risks(projectId).pipe(catchError(() => of([] as Risk[]))),
      users: this.usersApi.list().pipe(catchError(() => of([] as User[]))),
    }).subscribe({
      next: (r) => {
        this.project.set(r.project);
        this.tasks.set(r.tasks);
        this.backlog.set(r.backlog);
        this.phases.set(r.phases);
        this.sprints.set(r.sprints);
        this.members.set(r.members);
        this.risks.set(r.risks);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err, 'No se pudo cargar el proyecto.'));
        this.loading.set(false);
      },
    });
  }

  reloadTasks(): void {
    const id = this.projectId();
    if (id) this.tasksApi.list(id).subscribe((t) => this.tasks.set(t));
  }
  reloadBacklog(): void {
    const id = this.projectId();
    if (id) this.backlogApi.list(id).subscribe((b) => this.backlog.set(b));
  }
  reloadPhases(): void {
    const id = this.projectId();
    if (id) this.planningApi.phases(id).subscribe((p) => this.phases.set(p));
  }
  reloadSprints(): void {
    const id = this.projectId();
    if (id) this.planningApi.sprints(id).subscribe((s) => this.sprints.set(s));
  }

  reset(): void {
    this.projectId.set(null);
    this.project.set(null);
    this.tasks.set([]);
    this.backlog.set([]);
    this.phases.set([]);
    this.sprints.set([]);
    this.members.set([]);
    this.risks.set([]);
    this.error.set(null);
  }
}
