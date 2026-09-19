export interface Tarea {
  id: string;
  titulo: string;
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  vencida: boolean;
}

export type ColumnaTarea = 'pendiente' | 'progreso' | 'completada';
