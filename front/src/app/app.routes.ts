import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },

  { path: 'registro', loadComponent: () => import('./features/auth/registro/registro').then(m => m.Registro) },

  {
    path: '',
    loadComponent: () => import('./layout/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: 'proyecto/nuevo', loadChildren: () => import('./features/proyectos/proyecto-wizard/proyecto-wizard.routes').then(m => m.PROYECTO_WIZARD_ROUTES) },
      { path: 'proyectos', loadComponent: () => import('./features/proyectos/proyectos-list/proyectos-list').then(m => m.ProyectosList) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'tareas', loadComponent: () => import('./features/tareas/tareas').then(m => m.Tareas) },
      { path: 'backlog', loadComponent: () => import('./features/backlog/backlog').then(m => m.Backlog) },
      { path: 'riesgos', loadComponent: () => import('./features/riesgos/riesgos').then(m => m.Riesgos) },
      { path: 'reportes', loadComponent: () => import('./features/reportes/reportes').then(m => m.Reportes) },
    ],
  },
];
