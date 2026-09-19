import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProyectosStore } from '../proyectos.store';

@Component({
  selector: 'app-proyectos-list',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './proyectos-list.html',
  styleUrl: './proyectos-list.scss',
})
export class ProyectosList {
  private store = inject(ProyectosStore);

  proyectos = this.store.proyectos;
}
