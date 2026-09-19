import { Injectable, signal } from '@angular/core';

export interface EstadisticaTareas {
  label: string;
  value: number;
  icon: string;
}

export interface CargaIntegrante {
  nombre: string;
  tareas: number;
}

export interface ProyectoResumen {
  nombre: string;
  sprint: string;
  avance: number;
  enRiesgo: boolean;
}

export interface Prediccion {
  probabilidad: number;
  diasRetraso: number;
}

export interface Alerta {
  tipo: 'warning' | 'danger';
  mensaje: string;
}

export interface PlanificadoVsReal {
  semanas: string[];
  planificado: number[];
  real: number[];
}

const PROYECTO_MOCK: ProyectoResumen = { nombre: 'ReparaYa', sprint: 'Sprint 2', avance: 62, enRiesgo: true };

const PREDICCION_MOCK: Prediccion = { probabilidad: 75, diasRetraso: 5 };

const STATS_MOCK: EstadisticaTareas[] = [
  { label: 'Completadas', value: 24, icon: 'check_circle' },
  { label: 'Pendientes', value: 12, icon: 'schedule' },
  { label: 'Atrasadas', value: 5, icon: 'error' },
];

const ALERTAS_MOCK: Alerta[] = [
  { tipo: 'warning', mensaje: 'Miguel y Hugo concentran el 60% de tareas — riesgo de cuello de botella.' },
  { tipo: 'danger', mensaje: '3 tareas de la fase RACI están atrasadas más de 2 días.' },
];

const CARGA_EQUIPO_MOCK: CargaIntegrante[] = [
  { nombre: 'Miguel', tareas: 14 },
  { nombre: 'Hugo', tareas: 11 },
  { nombre: 'Renzo', tareas: 8 },
];

// Avance ACUMULADO de tareas completadas, planificado vs. real, por semana.
// Cuando exista el endpoint de métricas, este array sale de ahí tal cual.
const PLANIFICADO_VS_REAL_MOCK: PlanificadoVsReal = {
  semanas: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  planificado: [10, 22, 34, 41],
  real: [8, 17, 24, 29],
};

// Cuando el backend calcule la predicción de retraso de verdad (el
// diferenciador del curso), este store deja de tener PREDICCION_MOCK y
// pasa a pedirle el número al endpoint de predicción de Miguel.
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly _proyecto = signal<ProyectoResumen>(PROYECTO_MOCK);
  private readonly _prediccion = signal<Prediccion>(PREDICCION_MOCK);
  private readonly _stats = signal<EstadisticaTareas[]>(STATS_MOCK);
  private readonly _alertas = signal<Alerta[]>(ALERTAS_MOCK);
  private readonly _cargaEquipo = signal<CargaIntegrante[]>(CARGA_EQUIPO_MOCK);
  private readonly _planificadoVsReal = signal<PlanificadoVsReal>(PLANIFICADO_VS_REAL_MOCK);

  readonly proyecto = this._proyecto.asReadonly();
  readonly prediccion = this._prediccion.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly alertas = this._alertas.asReadonly();
  readonly cargaEquipo = this._cargaEquipo.asReadonly();
  readonly planificadoVsReal = this._planificadoVsReal.asReadonly();
}
