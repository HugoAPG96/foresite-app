import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RiesgosStore } from './riesgos.store';
import { badgeDe, nivelDe } from './riesgo.model';

@Component({
  selector: 'app-riesgos',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './riesgos.html',
  styleUrl: './riesgos.scss',
})
export class Riesgos {
  private store = inject(RiesgosStore);

  matriz = this.store.matriz;
  riesgos = this.store.riesgos;

  badgeDe = badgeDe;
  nivelDe = nivelDe;

  agregarRiesgo() {
    this.store.agregarRiesgo();
  }
}
