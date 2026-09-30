import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../features/auth/auth.store';
import { ProyectosStore } from '../../features/proyectos/proyectos.store';
import { MOCK_MODE } from '../../core/config/api.config';

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
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private proyectosStore = inject(ProyectosStore);

  mockMode = MOCK_MODE;

  // "Proyectos" siempre visible; el resto solo aparece dentro de un proyecto.
  navItems = computed(() => {
    const base = [{ path: '/proyectos', icon: 'folder_open', label: 'Proyectos' }];
    const actual = this.proyectosStore.proyectoActual();
    if (!actual) return base;

    const p = `/proyectos/${actual.id}`;
    return [
      ...base,
      { path: `${p}/dashboard`, icon: 'dashboard', label: 'Dashboard' },
      { path: `${p}/tareas`, icon: 'checklist', label: 'Tareas' },
      { path: `${p}/backlog`, icon: 'view_list', label: 'Backlog' },
      { path: `${p}/riesgos`, icon: 'warning', label: 'Riesgos' },
      { path: `${p}/reportes`, icon: 'bar_chart', label: 'Reportes' },
      { path: `${p}/miembros`, icon: 'group', label: 'Miembros' },
    ];
  });

  toolbarTitle = computed(() => this.proyectosStore.proyectoActual()?.nombre ?? 'Foresite');

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
