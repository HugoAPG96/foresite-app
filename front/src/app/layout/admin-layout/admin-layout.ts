import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  navItems = [
    { path: '/proyectos', icon: 'folder_open', label: 'Proyectos' },
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/tareas', icon: 'checklist', label: 'Tareas' },
    { path: '/backlog', icon: 'view_list', label: 'Backlog' },
    { path: '/riesgos', icon: 'warning', label: 'Riesgos' },
    { path: '/reportes', icon: 'bar_chart', label: 'Reportes' },
  ];
}
