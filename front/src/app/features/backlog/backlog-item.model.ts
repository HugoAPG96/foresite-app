export type TipoBacklog = 'Épica' | 'HU' | 'Spike' | 'Bug' | 'Enabler';

export interface ItemBacklogForm {
  tipo: TipoBacklog;
  historiaUsuario: string;
  descripcion: string;
  criterios: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estimacion: number;
  sprint: string;
  fase: string;
  responsables: string[];
  fechaInicio: string;
  fechaFin: string;
  dependencia: string;
}

export interface ItemBacklog extends ItemBacklogForm {
  id: string;
}
