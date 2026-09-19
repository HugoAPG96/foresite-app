export interface DesempenoIntegrante {
  nombre: string;
  completadas: number;
  pendientes: number;
  atrasadas: number;
}

export interface ResumenEjecutivo {
  avance: number;
  healthScore: number;
  diasRestantes: number;
  resumenTexto: string;
}

export interface DesviacionSprint {
  sprints: string[];
  planificado: number[];
  real: number[];
  desviacionAcumulada: number;
}
