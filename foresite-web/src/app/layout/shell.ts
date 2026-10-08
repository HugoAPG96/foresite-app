import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ProjectStore } from '../core/project.store';
import { ProfileDialog } from '../features/profile/profile.dialog';
import { MembersDialog } from '../features/projects/members.dialog';
import { LogoComponent } from '../shared/logo';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatMenuModule, LogoComponent],
  template: `
    <header class="topbar">
      <button class="icon-btn menu-toggle" (click)="open.set(!open())" aria-label="Menú">
        <mat-icon>menu</mat-icon>
      </button>
      <a routerLink="/proyectos" class="brand" aria-label="Foresite — inicio"><app-logo [size]="34" /></a>
      <span class="spacer"></span>

      <button class="user-chip" [matMenuTriggerFor]="userMenu" aria-label="Menú de usuario">
        <span class="avatar">{{ auth.initials() }}</span>
        <span class="user-name">{{ auth.user()?.name }}</span>
        <mat-icon>expand_more</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu" xPosition="before">
        <div class="menu-profile">
          <span class="avatar big">{{ auth.initials() }}</span>
          <div>
            <div class="n">{{ auth.user()?.name }}</div>
            <div class="e">{{ auth.user()?.email }}</div>
          </div>
        </div>
        <button mat-menu-item (click)="openProfile()">
          <mat-icon>person</mat-icon>
          <span>Mi perfil</span>
        </button>
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </header>

    <div class="body">
      @if (open()) { <div class="scrim" (click)="open.set(false)"></div> }
      <aside class="sidebar" [class.open]="open()">
        @if (inProject()) {
          <a routerLink="/proyectos" class="back"><mat-icon>arrow_back</mat-icon> Proyectos</a>
          <div class="project-name" [title]="store.project()?.name ?? ''">
            {{ store.project()?.name ?? 'Cargando…' }}
          </div>
          <nav>
            @for (item of projectNav; track item.path) {
              <a [routerLink]="['/proyectos', store.projectId(), item.path]" routerLinkActive="active">
                <mat-icon>{{ item.icon }}</mat-icon>{{ item.label }}
              </a>
            }
          </nav>
          <button type="button" class="side-btn" (click)="openMembers()">
            <mat-icon>group</mat-icon>Integrantes
          </button>
        } @else {
          <nav>
            <a routerLink="/proyectos" routerLinkActive="active"><mat-icon>dashboard</mat-icon>Proyectos</a>
          </nav>
        }
      </aside>
      <main class="content"><router-outlet /></main>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100vh; }
    .topbar {
      height: var(--header-h); flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 0 20px;
      background: #fff; border-bottom: 1px solid var(--line); z-index: 5;
    }
    .brand { display: inline-flex; }
    .menu-toggle { display: none; }
    .user-chip {
      display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--line); background: #fff;
      border-radius: 999px; padding: 4px 10px 4px 4px; cursor: pointer; font: inherit; color: var(--ink);
    }
    .user-chip:hover { background: var(--surface); }
    .user-chip mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--ink-soft); }
    .user-name { font-size: 13px; font-weight: 500; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .menu-profile { display: flex; gap: 10px; align-items: center; padding: 12px 16px 10px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
    .menu-profile .n { font-weight: 600; font-size: 13.5px; }
    .menu-profile .e { font-size: 12px; color: var(--ink-soft); }
    .avatar.big { width: 36px; height: 36px; font-size: 13px; }

    .body { flex: 1; display: flex; min-height: 0; position: relative; }
    .sidebar {
      width: var(--sidebar-w); flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--line);
      padding: 16px 12px; overflow-y: auto;
    }
    .sidebar nav { display: flex; flex-direction: column; gap: 2px; }
    .sidebar nav a {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; color: var(--ink-soft);
      font-size: 13.5px; font-weight: 500;
    }
    .sidebar nav a mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .sidebar nav a:hover { background: #ececf3; color: var(--ink); }
    .sidebar nav a.active { background: var(--lavender); color: var(--purple); font-weight: 600; }
    .side-btn {
      display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 2px; padding: 9px 12px; border: 0;
      border-radius: 10px; background: transparent; color: var(--ink-soft); font: inherit; font-size: 13.5px;
      font-weight: 500; cursor: pointer; text-align: left;
    }
    .side-btn mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .side-btn:hover { background: #ececf3; color: var(--ink); }
    .back { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-soft); padding: 6px 8px; margin-bottom: 6px; }
    .back mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .back:hover { color: var(--purple); }
    .project-name { font-weight: 700; font-size: 15px; padding: 2px 12px 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .content { flex: 1; overflow-y: auto; min-width: 0; background: #fff; }
    .scrim { display: none; }

    @media (max-width: 900px) {
      .menu-toggle { display: inline-flex; }
      .user-name { display: none; }
      .sidebar { position: absolute; top: 0; bottom: 0; left: 0; z-index: 20; transform: translateX(-100%); transition: transform .2s; }
      .sidebar.open { transform: none; box-shadow: 4px 0 24px rgba(0,0,0,.12); }
      .scrim { display: block; position: absolute; inset: 0; background: rgba(20,20,30,.3); z-index: 15; }
    }
  `,
})
export class Shell {
  protected auth = inject(AuthService);
  protected store = inject(ProjectStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  protected open = signal(false);
  protected readonly projectNav = [
    { path: 'dashboard', label: 'Dashboard', icon: 'speed' },
    { path: 'tareas', label: 'Tareas', icon: 'checklist' },
    { path: 'backlog', label: 'Backlog', icon: 'list_alt' },
    { path: 'reportes', label: 'Reportes', icon: 'assessment' },
  ];
  protected inProject = computed(() => !!this.store.projectId());

  protected openProfile(): void {
    this.dialog.open(ProfileDialog, { autoFocus: 'first-tabbable' });
  }

  protected openMembers(): void {
    this.dialog.open(MembersDialog);
  }

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.open.set(false));
  }
}
