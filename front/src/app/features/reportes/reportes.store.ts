import { Injectable, signal } from '@angular/core';
import { DesempenoIntegrante, DesviacionSprint, ResumenEjecutivo } from './reporte.model';

const RESUMEN_MOCK: ResumenEjecutivo = {
  avance: 62,
  healthScore: 68,
  diasRestantes: 12,
  resumenTexto:
    'El equipo avanza al 62% del proyecto con un health score de 68/100. La fase RACI ' +
    'concentra el mayor riesgo de atraso; se recomienda redistribuir tareas antes del ' +
    'cierre del sprint 2.',
};

const DESEMPENO_MOCK: DesempenoIntegrante[] = [
  { nombre: 'Miguel', completadas: 18, pendientes: 4, atrasadas: 2 },
  { nombre: 'Hugo', completadas: 15, pendientes: 5, atrasadas: 1 },
  { nombre: 'Renzo', completadas: 12, pendientes: 3, atrasadas: 2 },
];

const DESVIACION_MOCK: DesviacionSprint = {
  sprints: ['Sprint 0', 'Sprint 1'],
  planificado: [30, 70],
  real: [28, 62],
  desviacionAcumulada: -8,
};

@Injectable({ providedIn: 'root' })
export class ReportesStore {
  private readonly _resumen = signal<ResumenEjecutivo>(RESUMEN_MOCK);
  private readonly _desempeno = signal<DesempenoIntegrante[]>(DESEMPENO_MOCK);
  private readonly _desviacion = signal<DesviacionSprint>(DESVIACION_MOCK);

  readonly resumen = this._resumen.asReadonly();
  readonly desempeno = this._desempeno.asReadonly();
  readonly desviacion = this._desviacion.asReadonly();
}
