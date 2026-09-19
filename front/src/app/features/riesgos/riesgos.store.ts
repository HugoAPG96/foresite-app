import { computed, Injectable, signal } from '@angular/core';
import { CeldaMatriz, nivelDe, Riesgo } from './riesgo.model';

const RIESGOS_MOCK: Riesgo[] = [
  {
    id: 'RN-01',
    descripcion: 'Cuello de botella por concentración de tareas en 2 integrantes',
    mitigacion: 'Redistribuir HU pendientes del sprint 3 entre todo el equipo',
    responsable: 'Hugo',
    probabilidad: 3,
    impacto: 3,
  },
  {
    id: 'RN-02',
    descripcion: 'Retraso en integración de API de predicción',
    mitigacion: 'Definir contrato de datos mock mientras se termina el backend',
    responsable: 'Miguel',
    probabilidad: 2,
    impacto: 2,
  },
  {
    id: 'RN-03',
    descripcion: 'Dependencia de plan gratuito de Render (cold starts)',
    mitigacion: 'Agregar un ping periódico o aceptar el delay en la demo',
    responsable: 'Hugo',
    probabilidad: 1,
    impacto: 1,
  },
  {
    id: 'RN-04',
    descripcion: 'Retraso en la API externa de la municipalidad',
    mitigacion: 'Usar datos simulados mientras se confirma acceso',
    responsable: 'Hugo',
    probabilidad: 2,
    impacto: 3,
  },
];

@Injectable({ providedIn: 'root' })
export class RiesgosStore {
  private readonly _riesgos = signal<Riesgo[]>(RIESGOS_MOCK);

  readonly riesgos = this._riesgos.asReadonly();

  // Matriz 3x3 derivada de los riesgos activos: cada celda sabe su nivel
  // (para el color) y cuántos riesgos caen exactamente en esa combinación
  // de probabilidad x impacto (para el número que se muestra dentro).
  readonly matriz = computed<CeldaMatriz[][]>(() => {
    const riesgos = this._riesgos();
    const filas: CeldaMatriz[][] = [];

    for (let impacto = 3; impacto >= 1; impacto--) {
      const fila: CeldaMatriz[] = [];
      for (let probabilidad = 1; probabilidad <= 3; probabilidad++) {
        const cantidad = riesgos.filter(r => r.probabilidad === probabilidad && r.impacto === impacto).length;
        fila.push({ nivel: nivelDe(probabilidad as 1 | 2 | 3, impacto as 1 | 2 | 3), cantidad });
      }
      filas.push(fila);
    }

    return filas;
  });

  agregarRiesgo() {
    const numero = this._riesgos().length + 1;
    const nuevo: Riesgo = {
      id: `RN-${String(numero).padStart(2, '0')}`,
      descripcion: 'Nuevo riesgo',
      mitigacion: '',
      responsable: '',
      probabilidad: 2,
      impacto: 2,
    };
    this._riesgos.set([...this._riesgos(), nuevo]);
  }
}
