export type Semaforo = 'verde' | 'ambar' | 'rojo';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  objective: string | null;
  scope: string | null;
  startDate: string;
  endDate: string;
  healthScore: number | string;
  semaforo: Semaforo;
  createdBy: string;
  createdAt: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  orderIndex: number;
}

export interface Sprint {
  id: string;
  projectId: string;
  number: number;
  startDate: string;
  endDate: string;
}

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface Task {
  id: string;
  projectId: string;
  phaseId: string;
  backlogItemId: string | null;
  code: string;
  title: string;
  responsibleId: string;
  accountableId: string;
  consultedIds: string[];
  informedIds: string[];
  startDate: string;
  endDate: string;
  durationDays: number;
  percentComplete: number | string;
  status: TaskStatus;
  createdAt: string;
}

export type PbiType = 'ep' | 'hu' | 'sp' | 'en' | 'ta' | 'rn' | 'do' | 'bu';
export type PbiPriority = 'alta' | 'media' | 'baja';
export type PbiStatus = 'open' | 'doing' | 'in_progress' | 'done';

export interface BacklogItem {
  id: string;
  projectId: string;
  phaseId: string | null;
  sprintId: string | null;
  type: PbiType;
  code: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: PbiPriority;
  estimation: number | string;
  status: PbiStatus;
  startDate: string | null;
  endDate: string | null;
  dependencyId: string | null;
  responsableIds: string[];
  createdAt: string;
}

export type RiskLevel = 'alto' | 'medio' | 'bajo';

/** Solo lectura: se usa para el componente "riesgos" del Health Score. */
export interface Risk {
  id: string;
  projectId: string;
  description: string;
  severity: RiskLevel;
  status: 'activo' | 'mitigado' | 'cerrado';
}

export interface PbiTypeInfo {
  value: PbiType;
  code: string;
  label: string;
  hint: string;
  /** HU usa formato Como/Quiero/Para + Dado/Cuando/Entonces; el resto, descripción puntual + checklist. */
  userStoryFormat: boolean;
}

export const PBI_TYPES: PbiTypeInfo[] = [
  { value: 'ep', code: 'EP', label: 'Épica', hint: 'Conjunto grande de trabajo que se divide en varias HU.', userStoryFormat: false },
  { value: 'hu', code: 'HU', label: 'Historia de usuario', hint: 'Funcionalidad con valor directo para el usuario.', userStoryFormat: true },
  { value: 'sp', code: 'SP', label: 'Spike', hint: 'Investigación acotada antes de estimar o construir.', userStoryFormat: false },
  { value: 'en', code: 'EN', label: 'Enabler', hint: 'Trabajo técnico habilitante (infraestructura, configuración).', userStoryFormat: false },
  { value: 'ta', code: 'TA', label: 'Tarea', hint: 'Unidad de trabajo puntual.', userStoryFormat: false },
  { value: 'rn', code: 'RN', label: 'Regla de negocio', hint: 'Condición o restricción que debe cumplir el sistema.', userStoryFormat: false },
  { value: 'do', code: 'DO', label: 'Documentación', hint: 'Entregable de documentación.', userStoryFormat: false },
  { value: 'bu', code: 'BU', label: 'Bug', hint: 'Defecto sobre funcionalidad existente.', userStoryFormat: false },
];

export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];
/** Capacidad máxima por sprint (acta de constitución). */
export const SPRINT_CAPACITY = 21;

export const PRIORITIES: { value: PbiPriority; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

export const PBI_STATUSES: { value: PbiStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'doing', label: 'Doing' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export const TASK_COLUMNS: { value: TaskStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' },
];

export function pbiInfo(type: PbiType): PbiTypeInfo {
  return PBI_TYPES.find((t) => t.value === type) ?? PBI_TYPES[1];
}
