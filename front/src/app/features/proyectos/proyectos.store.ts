import { Injectable } from '@angular/core';
import { persistedSignal } from '../../core/storage/persisted-signal';
import { Proyecto } from './proyecto.model';

// Hoy la data es mock. Cuando el backend (NestJS) esté listo, este es el
// ÚNICO archivo que cambia: en vez de `signal([...])` inicial, se llama
// a un HttpClient.get(...) y se hace `.set()` con la respuesta. Ningún
// componente que consume este store necesita tocarse.
const PROYECTOS_MOCK: Proyecto[] = [
  { nombre: 'ReparaYa', descripcion: 'Plataforma de solicitudes de mantenimiento', avance: 62, estado: 'ambar' },
  { nombre: 'App de delivery UNI', descripcion: 'Pedidos internos entre facultades', avance: 88, estado: 'verde' },
  { nombre: 'Portal de matrículas', descripcion: 'Rediseño del flujo de matrícula online', avance: 34, estado: 'ambar' },
];

@Injectable({ providedIn: 'root' })
export class ProyectosStore {
  private readonly _proyectos = persistedSignal<Proyecto[]>('proyectos', PROYECTOS_MOCK);

  readonly proyectos = this._proyectos.asReadonly();

  agregar(proyecto: Proyecto) {
    this._proyectos.set([...this._proyectos(), proyecto]);
  }
}
