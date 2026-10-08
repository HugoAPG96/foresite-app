import { isOverdue, plannedFraction, taskProgress } from './metrics';
import { BacklogItem, Phase, Sprint, Task } from './models';
import { parseDate } from './util/dates';

export interface DeviationRow {
  label: string;
  /** % planificado a hoy */
  planned: number;
  /** % real */
  real: number;
  /** real - planificado (puntos porcentuales) */
  deviation: number;
  detail: string;
}

export interface PerformanceRow {
  userId: string;
  name: string;
  completed: number;
  pending: number;
  overdue: number;
  /** completadas / asignadas (0-100) */
  compliance: number;
}

const num = (v: unknown) => Number(v) || 0;

/** Desviación por fase del cronograma (avance de las tareas vs. lo planificado a hoy). */
export function phaseDeviation(phases: Phase[], tasks: Task[], today: Date): DeviationRow[] {
  return [...phases]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((ph) => {
      const own = tasks.filter((t) => t.phaseId === ph.id);
      if (!own.length) return null;
      let w = 0, real = 0, planned = 0;
      for (const t of own) {
        const weight = Math.max(1, num(t.durationDays));
        const s = parseDate(t.startDate), e = parseDate(t.endDate);
        w += weight;
        real += weight * taskProgress(t);
        planned += weight * (s && e ? plannedFraction(s, e, today) * 100 : 0);
      }
      const r = Math.round(real / w), p = Math.round(planned / w);
      return { label: ph.name, planned: p, real: r, deviation: r - p, detail: `${own.length} tareas` } as DeviationRow;
    })
    .filter((r): r is DeviationRow => r !== null);
}

/** Desviación por sprint, medida en puntos de historia completados (Done) vs. lo esperado por fechas. */
export function sprintDeviation(sprints: Sprint[], items: BacklogItem[], today: Date): DeviationRow[] {
  return [...sprints]
    .sort((a, b) => a.number - b.number)
    .map((sp) => {
      const own = items.filter((i) => i.sprintId === sp.id);
      const points = own.reduce((s, i) => s + num(i.estimation), 0);
      if (!own.length || points === 0) return null;
      const done = own.filter((i) => i.status === 'done').reduce((s, i) => s + num(i.estimation), 0);
      const s = parseDate(sp.startDate), e = parseDate(sp.endDate);
      const planned = s && e ? Math.round(plannedFraction(s, e, today) * 100) : 0;
      const real = Math.round((done / points) * 100);
      return { label: `Sprint ${sp.number}`, planned, real, deviation: real - planned, detail: `${done}/${points} pts` } as DeviationRow;
    })
    .filter((r): r is DeviationRow => r !== null);
}

export function performance(memberIds: string[], tasks: Task[], names: Map<string, string>, today: Date): PerformanceRow[] {
  const ids = new Set<string>([...memberIds, ...tasks.map((t) => t.responsibleId)]);
  return Array.from(ids)
    .map((userId) => {
      const own = tasks.filter((t) => t.responsibleId === userId);
      const completed = own.filter((t) => t.status === 'completada').length;
      const overdue = own.filter((t) => isOverdue(t, today)).length;
      const pending = own.length - completed - overdue;
      return {
        userId, name: names.get(userId) ?? 'Sin nombre', completed, pending, overdue,
        compliance: own.length ? Math.round((completed / own.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.completed - a.completed);
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  // BOM para que Excel respete los acentos
  const blob = new Blob(['\ufeff' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
