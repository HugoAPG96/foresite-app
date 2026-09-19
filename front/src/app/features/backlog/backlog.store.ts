import { Injectable, signal } from '@angular/core';
import { ItemBacklog, ItemBacklogForm, TipoBacklog } from './backlog-item.model';

const PREFIJOS: Record<TipoBacklog, string> = {
  Épica: 'EP',
  HU: 'HU',
  Spike: 'SP',
  Bug: 'BU',
  Enabler: 'EN',
};

const ITEMS_MOCK: ItemBacklog[] = [
  {
    id: 'EP-000',
    tipo: 'Épica',
    historiaUsuario: 'Inicio del proyecto',
    descripcion: '',
    criterios: '',
    prioridad: 'Alta',
    estimacion: 0,
    sprint: 'Sprint 0',
    fase: '1. Planificación y gestión del proyecto',
    responsables: ['Miguel', 'Hugo'],
    fechaInicio: '',
    fechaFin: '',
    dependencia: 'Ninguna',
  },
];

// Vive fuera del wizard porque el Backlog se sigue viendo y editando
// después de crear el proyecto (es su propia pantalla en el sidebar).
@Injectable({ providedIn: 'root' })
export class BacklogStore {
  private readonly _items = signal<ItemBacklog[]>(ITEMS_MOCK);

  readonly items = this._items.asReadonly();

  agregarItem(form: ItemBacklogForm) {
    const contador = this._items().filter(i => i.tipo === form.tipo).length + 1;
    const id = `${PREFIJOS[form.tipo]}-${String(contador).padStart(3, '0')}`;
    this._items.set([...this._items(), { ...form, id }]);
  }
}
