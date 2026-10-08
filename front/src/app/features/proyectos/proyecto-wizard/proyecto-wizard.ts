import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-proyecto-wizard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './proyecto-wizard.html',
  styleUrl: './proyecto-wizard.scss',
})
export class ProyectoWizard {
  pasos = [
    { path: 'acta', label: 'Acta de constitución' },
    { path: 'raci', label: 'Cronograma RACI' },
    { path: 'backlog', label: 'Product Backlog' },
  ];

  // "Dashboard" no es una ruta del wizard — es el destino al que se llega
  // al hacer clic en "Finalizar" desde el paso de Backlog.
  destino = 'Dashboard';
}
