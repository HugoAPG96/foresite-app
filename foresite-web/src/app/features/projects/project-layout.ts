import { Component, OnDestroy, effect, inject, input, untracked } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProjectStore } from '../../core/project.store';

/** Contenedor de las pantallas de un proyecto: carga el estado una sola vez y lo comparte con las rutas hijas. */
@Component({
  selector: 'app-project-layout',
  imports: [RouterOutlet, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (store.error()) {
      <div class="page">
        <div class="card empty">
          <mat-icon>error_outline</mat-icon>
          <p>{{ store.error() }}</p>
          <p style="margin-top:14px">
            <button class="btn" (click)="store.load(projectId())">Reintentar</button>
            <a class="btn ghost" routerLink="/proyectos" style="margin-left:8px">Volver a proyectos</a>
          </p>
        </div>
      </div>
    } @else if (!store.project()) {
      <div class="loading"><mat-spinner diameter="36" /><span class="muted">Cargando proyecto…</span></div>
    } @else {
      <router-outlet />
    }
  `,
  styles: `.loading { display:flex; flex-direction:column; align-items:center; gap:12px; padding:80px 0; }`,
})
export class ProjectLayout implements OnDestroy {
  protected store = inject(ProjectStore);
  readonly projectId = input.required<string>();

  constructor() {
    effect(() => {
      const id = this.projectId();
      untracked(() => this.store.load(id));
    });
  }

  ngOnDestroy(): void {
    this.store.reset();
  }
}
