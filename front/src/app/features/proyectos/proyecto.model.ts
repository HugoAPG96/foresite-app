export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  avance: number;
  estado: 'verde' | 'ambar' | 'rojo';
}

export interface CreateProyectoPayload {
  name: string;
  objective?: string;
  scope?: string;
  startDate: string;
  endDate: string;
}

export interface ProjectApiResponse {
  id: string;
  name: string;
  objective: string | null;
  scope: string | null;
  startDate: string;
  endDate: string;
  // TypeORM/pg devuelve las columnas `numeric` como string (ej. "0.00") para
  // no perder precisión, aunque la entidad del backend la tipe como number.
  healthScore: number | string;
  semaforo: 'verde' | 'ambar' | 'rojo';
  createdBy: string;
  createdAt: string;
}

export function mapProyectoFromApi(p: ProjectApiResponse): Proyecto {
  return {
    id: p.id,
    nombre: p.name,
    descripcion: p.objective ?? '',
    avance: Number(p.healthScore) || 0,
    estado: p.semaforo,
  };
}
