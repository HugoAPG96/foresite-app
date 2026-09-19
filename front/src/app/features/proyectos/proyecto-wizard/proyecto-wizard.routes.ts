import { Routes } from '@angular/router';

export const PROYECTO_WIZARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./proyecto-wizard').then(m => m.ProyectoWizard),
    children: [
      { path: '', redirectTo: 'acta', pathMatch: 'full' },
      { path: 'acta', loadComponent: () => import('./pasos/paso-acta/paso-acta').then(m => m.PasoActa) },
      { path: 'raci', loadComponent: () => import('./pasos/paso-raci/paso-raci').then(m => m.PasoRaci) },
      { path: 'backlog', loadComponent: () => import('./pasos/paso-backlog/paso-backlog').then(m => m.PasoBacklog) },
    ],
  },
];
