export type NivelRiesgo = 'bajo' | 'medio' | 'alto';

// 1 = bajo, 2 = medio, 3 = alto — coordenadas dentro de la matriz 3x3.
export type Escala = 1 | 2 | 3;

export interface Riesgo {
  id: string;
  descripcion: string;
  mitigacion: string;
  responsable: string;
  probabilidad: Escala;
  impacto: Escala;
}

export interface CeldaMatriz {
  nivel: NivelRiesgo;
  cantidad: number;
}

// Nivel de severidad por combinación (fila = impacto, de alto a bajo;
// columna = probabilidad, de bajo a alto). Es la misma heurística estándar
// de matrices de riesgo 3x3 que se enseña en gestión de proyectos.
const NIVELES_BASE: NivelRiesgo[][] = [
  ['medio', 'alto', 'alto'],
  ['bajo', 'medio', 'alto'],
  ['bajo', 'bajo', 'medio'],
];

export function nivelDe(probabilidad: Escala, impacto: Escala): NivelRiesgo {
  const fila = 3 - impacto; // impacto 3 (alto) -> fila 0
  const columna = probabilidad - 1; // probabilidad 1 (bajo) -> columna 0
  return NIVELES_BASE[fila][columna];
}

export function badgeDe(nivel: NivelRiesgo): 'danger' | 'warning' | 'success' {
  if (nivel === 'alto') return 'danger';
  if (nivel === 'medio') return 'warning';
  return 'success';
}
