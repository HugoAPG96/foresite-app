import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'proyectos' },
      {
        path: 'proyectos',
        loadComponent: () => import('./features/projects/projects-list.page').then((m) => m.ProjectsListPage),
      },
      {
        path: 'proyectos/nuevo',
        loadComponent: () => import('./features/projects/new-project.page').then((m) => m.NewProjectPage),
      },
      {
        path: 'proyectos/:projectId',
        loadComponent: () => import('./features/projects/project-layout').then((m) => m.ProjectLayout),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage) },
          { path: 'tareas', loadComponent: () => import('./features/tasks/tasks.page').then((m) => m.TasksPage) },
          { path: 'backlog', loadComponent: () => import('./features/backlog/backlog.page').then((m) => m.BacklogPage) },
          { path: 'reportes', loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage) },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
