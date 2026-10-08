export interface Tarea {
  id: string;
  codigo: string;
  titulo: string;
  responsableId: string;
  fechaInicio: string;
  fechaFin: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  vencida: boolean;
}

export type ColumnaTarea = 'pendiente' | 'progreso' | 'completada';

export interface TaskApiResponse {
  id: string;
  projectId: string;
  phaseId: string | null;
  backlogItemId: string | null;
  code: string;
  title: string;
  responsibleId: string;
  accountableId: string | null;
  startDate: string;
  endDate: string;
  durationDays: number;
  percentComplete: number | string;
  status: 'pendiente' | 'en_progreso' | 'completada';
  priority: 'alta' | 'media' | 'baja';
  createdAt: string;
}

export const STATUS_TO_COLUMNA: Record<TaskApiResponse['status'], ColumnaTarea> = {
  pendiente: 'pendiente',
  en_progreso: 'progreso',
  completada: 'completada',
};

export const COLUMNA_TO_STATUS: Record<ColumnaTarea, TaskApiResponse['status']> = {
  pendiente: 'pendiente',
  progreso: 'en_progreso',
  completada: 'completada',
};

const PRIORIDAD_API_TO_UI: Record<TaskApiResponse['priority'], Tarea['prioridad']> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const PRIORIDAD_UI_TO_API: Record<Tarea['prioridad'], TaskApiResponse['priority']> = {
  Alta: 'alta',
  Media: 'media',
  Baja: 'baja',
};

export function mapTareaFromApi(t: TaskApiResponse): Tarea {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    id: t.id,
    codigo: t.code,
    titulo: t.title,
    responsableId: t.responsibleId,
    fechaInicio: t.startDate,
    fechaFin: t.endDate,
    prioridad: PRIORIDAD_API_TO_UI[t.priority],
    vencida: t.status !== 'completada' && t.endDate < hoy,
  };
}
