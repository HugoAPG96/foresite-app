import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },

  { path: 'registro', loadComponent: () => import('./features/auth/registro/registro').then(m => m.Registro) },

  {
    path: '',
    loadComponent: () => import('./layout/admin-layout/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard],
    children: [
      { path: 'proyecto/nuevo', loadChildren: () => import('./features/proyectos/proyecto-wizard/proyecto-wizard.routes').then(m => m.PROYECTO_WIZARD_ROUTES) },
      { path: 'proyectos', loadComponent: () => import('./features/proyectos/proyectos-list/proyectos-list').then(m => m.ProyectosList) },
      { path: 'perfil', loadComponent: () => import('./features/perfil/perfil').then(m => m.Perfil) },
      {
        path: 'proyectos/:id',
        loadComponent: () => import('./features/proyectos/proyecto-contexto/proyecto-contexto').then(m => m.ProyectoContexto),
        children: [
          { path: '', redirectTo: 'tareas', pathMatch: 'full' },
          { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
          { path: 'tareas', loadComponent: () => import('./features/tareas/tareas').then(m => m.Tareas) },
          { path: 'backlog', loadComponent: () => import('./features/backlog/backlog').then(m => m.Backlog) },
          { path: 'riesgos', loadComponent: () => import('./features/riesgos/riesgos').then(m => m.Riesgos) },
          { path: 'reportes', loadComponent: () => import('./features/reportes/reportes').then(m => m.Reportes) },
          { path: 'miembros', loadComponent: () => import('./features/miembros/miembros-list/miembros-list').then(m => m.MiembrosList) },
        ],
      },
    ],
  },
];
