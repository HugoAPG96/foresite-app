import { inject, Injectable } from '@angular/core';
import { persistedSignal } from '../../../core/storage/persisted-signal';
import { ProyectosStore } from '../proyectos.store';

export interface ActaDraft {
  nombre: string;
  objetivo: string;
  alcance: string;
  fechaInicio: string | null;
  fechaLimite: string | null;
}

const ACTA_VACIA: ActaDraft = { nombre: '', objetivo: '', alcance: '', fechaInicio: null, fechaLimite: null };

export interface TareaRaci {
  id: string;
  titulo: string;
  responsable: string;
  aCargo: string;
  consultado: string;
  informado: string;
  inicio: string;
  fin: string;
  editing: boolean;
}

export interface FaseRaci {
  nombre: string;
  tareas: TareaRaci[];
}

const INTEGRANTES_MOCK = ['Miguel', 'Hugo', 'Renzo'];

const FASES_MOCK: FaseRaci[] = [
  {
    nombre: '1. Planificación y gestión del proyecto',
    tareas: [
      {
        id: '1.1',
        titulo: 'Definición del alcance',
        responsable: 'Miguel',
        aCargo: 'Hugo',
        consultado: 'Renzo',
        informado: 'Todo el equipo',
        inicio: '14/09',
        fin: '16/09',
        editing: false,
      },
    ],
  },
];

// Estado compartido MIENTRAS se completa el wizard de "Nuevo proyecto".
// Acta (integrantes), RACI (fases/tareas) y Backlog (que necesita ambos para
// sus selects de Responsables y Fase) leen y escriben este mismo store.
// Al hacer clic en "Finalizar" en el paso de Backlog, esto es lo que se
// enviaría al backend como el proyecto recién creado.
@Injectable({ providedIn: 'root' })
export class NuevoProyectoStore {
  private readonly proyectosStore = inject(ProyectosStore);

  private readonly _acta = persistedSignal<ActaDraft>('wizard:acta', ACTA_VACIA);
  private readonly _integrantes = persistedSignal<string[]>('wizard:integrantes', INTEGRANTES_MOCK);
  private readonly _fases = persistedSignal<FaseRaci[]>('wizard:fases', FASES_MOCK);

  readonly acta = this._acta.asReadonly();
  readonly integrantes = this._integrantes.asReadonly();
  readonly fases = this._fases.asReadonly();

  actualizarActa(cambios: Partial<ActaDraft>) {
    this._acta.set({ ...this._acta(), ...cambios });
  }

  // Convierte el borrador del wizard en un proyecto de "Mis Proyectos" y
  // limpia el Acta para que el próximo proyecto empiece en blanco.
  // Con backend, aquí va el POST /proyectos con acta + fases + backlog.
  finalizar() {
    const { nombre, objetivo } = this._acta();
    this.proyectosStore.agregar({
      nombre: nombre.trim() || 'Nuevo proyecto',
      descripcion: objetivo.trim() || 'Sin objetivo definido',
      avance: 0,
      estado: 'verde',
    });
    this._acta.set(ACTA_VACIA);
  }

  agregarIntegrante(nombre: string) {
    const limpio = nombre.trim();
    if (!limpio || this._integrantes().includes(limpio)) return;
    this._integrantes.set([...this._integrantes(), limpio]);
  }

  agregarFase() {
    const numero = this._fases().length + 1;
    const nuevaFase: FaseRaci = {
      nombre: `${numero}. Nueva fase`,
      tareas: [this.crearTareaVacia(`${numero}.1`)],
    };
    this._fases.set([...this._fases(), nuevaFase]);
  }

  agregarTarea(faseIndex: number) {
    const fases = [...this._fases()];
    const fase = fases[faseIndex];
    const nuevoId = `${faseIndex + 1}.${fase.tareas.length + 1}`;
    fases[faseIndex] = { ...fase, tareas: [...fase.tareas, this.crearTareaVacia(nuevoId)] };
    this._fases.set(fases);
  }

  actualizarTarea(faseIndex: number, tareaIndex: number, cambios: Partial<TareaRaci>) {
    const fases = [...this._fases()];
    const tareas = [...fases[faseIndex].tareas];
    tareas[tareaIndex] = { ...tareas[tareaIndex], ...cambios };
    fases[faseIndex] = { ...fases[faseIndex], tareas };
    this._fases.set(fases);
  }

  confirmarTarea(faseIndex: number, tareaIndex: number) {
    this.actualizarTarea(faseIndex, tareaIndex, { editing: false });
  }

  editarTarea(faseIndex: number, tareaIndex: number) {
    this.actualizarTarea(faseIndex, tareaIndex, { editing: true });
  }

  eliminarTarea(faseIndex: number, tareaIndex: number) {
    const fases = [...this._fases()];
    const fase = fases[faseIndex];
    fases[faseIndex] = { ...fase, tareas: fase.tareas.filter((_, i) => i !== tareaIndex) };
    this._fases.set(fases);
  }

  private crearTareaVacia(id: string): TareaRaci {
    return { id, titulo: '', responsable: '', aCargo: '', consultado: '', informado: '', inicio: '', fin: '', editing: true };
  }
}
