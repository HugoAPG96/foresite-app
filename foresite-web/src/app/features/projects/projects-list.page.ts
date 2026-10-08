import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PlanningApi } from '../../core/api/planning.api';
import { ProjectsApi } from '../../core/api/projects.api';
import { TasksApi } from '../../core/api/tasks.api';
import { UsersApi } from '../../core/api/users.api';
import { errorMessage } from '../../core/errors';
import { ProjectMetrics, computeMetrics } from '../../core/metrics';
import { Project, Risk, Task, User } from '../../core/models';
import { formatDate } from '../../core/util/dates';
import { initialsOf, semaforoLabel } from '../../shared/util';

interface ProjectCard {
  project: Project;
  metrics: ProjectMetrics;
  members: User[];
}

@Component({
  selector: 'app-projects-list',
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Mis proyectos</h1>
          <div class="sub">Elige un proyecto para ver su dashboard o crea uno nuevo.</div>
        </div>
        <span class="spacer"></span>
        <button class="btn" (click)="newProject()"><mat-icon>add</mat-icon>Nuevo proyecto</button>
      </div>

      @if (loading()) {
        <div class="grid cols-3">
          @for (n of [1, 2, 3]; track n) { <div class="card skeleton"></div> }
        </div>
      } @else if (error()) {
        <div class="card empty">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <p style="margin-top:14px"><button class="btn" (click)="load()">Reintentar</button></p>
        </div>
      } @else {
        <div class="grid cols-3">
          @for (c of cards(); track c.project.id) {
            <a class="card project" [routerLink]="['/proyectos', c.project.id, 'dashboard']">
              <div class="top">
                <h3>{{ c.project.name }}</h3>
                @if (c.metrics.hasData) {
                  <span class="badge" [class]="c.metrics.semaforo">
                    <span class="dot" [class]="c.metrics.semaforo"></span>{{ label(c.metrics.semaforo) }}
                  </span>
                } @else {
                  <span class="badge"><span class="dot"></span>Sin datos</span>
                }
              </div>
              <div class="muted small">{{ fmt(c.project.startDate) }} → {{ fmt(c.project.endDate) }}</div>

              <div class="progress">
                <div class="row small"><span class="muted">Avance</span><b class="num">{{ c.metrics.progressPct }}%</b></div>
                <div class="bar" [class]="c.metrics.hasData ? c.metrics.semaforo : 'neutral'"><span [style.width.%]="c.metrics.progressPct"></span></div>
              </div>

              <div class="foot">
                <span class="muted small">
                  {{ c.metrics.completed }}/{{ c.metrics.total }} {{ c.metrics.total === 1 ? 'tarea' : 'tareas' }} · Health {{ c.metrics.hasData ? c.metrics.healthScore : '—' }}
                </span>
                <span class="avatars">
                  @for (m of c.members.slice(0, 4); track m.id) { <span class="avatar sm" [title]="m.name">{{ ini(m.name) }}</span> }
                  @if (c.members.length > 4) { <span class="avatar sm more">+{{ c.members.length - 4 }}</span> }
                </span>
              </div>
            </a>
          }
          <button class="card new" (click)="newProject()">
            <mat-icon>add</mat-icon>
            <span>Crear proyecto</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .card.project { display: flex; flex-direction: column; gap: 10px; color: inherit; transition: box-shadow .15s, border-color .15s; }
    .card.project:hover { border-color: var(--purple); box-shadow: 0 6px 20px rgba(108, 79, 209, .12); }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .top h3 { margin: 0; font-size: 15px; }
    .progress .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .avatars { display: inline-flex; }
    .avatars .avatar { margin-left: -4px; border: 2px solid #fff; width: 26px; height: 26px; font-size: 10px; }
    .avatars .avatar:first-child { margin-left: 0; }
    .avatar.more { background: var(--surface); color: var(--ink-soft); }
    .card.new {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 140px;
      border: 1.5px dashed #c9c9d3; background: var(--surface); color: var(--ink-soft); cursor: pointer; font: inherit;
    }
    .card.new:hover { border-color: var(--purple); color: var(--purple); background: var(--lavender); }
    .skeleton { height: 150px; background: linear-gradient(90deg, #f3f3f7 25%, #fafafd 50%, #f3f3f7 75%); background-size: 200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { to { background-position: -200% 0; } }
  `,
})
export class ProjectsListPage {
  private projectsApi = inject(ProjectsApi);
  private tasksApi = inject(TasksApi);
  private planningApi = inject(PlanningApi);
  private usersApi = inject(UsersApi);
  private router = inject(Router);

  protected cards = signal<ProjectCard[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  protected fmt = formatDate;
  protected ini = initialsOf;
  protected label = semaforoLabel;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.usersApi.list().pipe(catchError(() => of([] as User[]))).subscribe();

    this.projectsApi.list().subscribe({
      next: (projects) => {
        if (!projects.length) {
          this.cards.set([]);
          this.loading.set(false);
          return;
        }
        forkJoin(
          projects.map((project) =>
            forkJoin({
              tasks: this.tasksApi.list(project.id).pipe(catchError(() => of([] as Task[]))),
              risks: this.planningApi.risks(project.id).pipe(catchError(() => of([] as Risk[]))),
              members: this.projectsApi.members(project.id).pipe(catchError(() => of([] as User[]))),
            }),
          ),
        ).subscribe((results) => {
          this.cards.set(
            projects.map((project, i) => {
              const { tasks, risks, members } = results[i];
              const names = new Map(members.map((m) => [m.id, m.name] as const));
              const metrics = computeMetrics({ project, tasks, risks, memberIds: members.map((m) => m.id), names });
              return { project, metrics, members };
            }),
          );
          this.loading.set(false);
        });
      },
      error: (err) => {
        this.error.set(errorMessage(err, 'No se pudieron cargar tus proyectos.'));
        this.loading.set(false);
      },
    });
  }

  newProject(): void {
    this.router.navigate(['/proyectos', 'nuevo']);
  }
}
