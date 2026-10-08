import { Project, Risk, Semaforo, Task } from './models';
import { diffDays, parseDate, startOfToday } from './util/dates';

/* ------------------------------------------------------------------
 * Motor de indicadores de Foresite (se calcula en el cliente a partir
 * de los datos que expone la API: proyecto, tareas, riesgos, miembros).
 *
 *  Health Score = 40 % avance + 30 % cumplimiento de fechas
 *               + 20 % riesgos + 10 % participación del equipo
 *
 *  - "Avance" se mide contra el plan: avance real / avance planificado
 *    (tope 100). Así un proyecto que va según lo previsto no aparece en
 *    ámbar solo porque aún está a mitad de camino.
 *  - La predicción de retraso es una heurística basada en la velocidad
 *    (SPI = avance real / avance planificado), no un modelo de ML.
 * ------------------------------------------------------------------ */

export interface Recommendation {
  level: 'info' | 'warn' | 'danger';
  text: string;
}

export interface Prediction {
  level: 'nodata' | 'ok' | 'warn' | 'danger';
  /** Probabilidad (0-100) de que el proyecto termine tarde. */
  probability: number;
  /** Días estimados de retraso (0 si va en camino). */
  delayDays: number;
  message: string;
}

export interface WorkloadRow {
  userId: string;
  name: string;
  count: number;
  /** % de las tareas activas del proyecto asignadas a esta persona. */
  pct: number;
}

export interface ProjectMetrics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  /** Avance real ponderado por duración (0-100). */
  progressPct: number;
  /** Avance planificado a hoy (0-100). */
  plannedPct: number;
  /** false si el proyecto aún no tiene tareas: no hay base para medir salud ni riesgo de retraso. */
  hasData: boolean;
  /** Componentes del Health Score (0-100 cada uno). */
  avanceScore: number;
  datesScore: number;
  riskScore: number;
  participationScore: number;
  healthScore: number;
  healthLabel: string;
  semaforo: Semaforo;
  daysLeft: number;
  activeRisks: number;
  prediction: Prediction;
  recommendations: Recommendation[];
  workload: WorkloadRow[];
}

export interface MetricsInput {
  project: Project;
  tasks: Task[];
  risks: Risk[];
  /** ids de los integrantes del proyecto */
  memberIds: string[];
  /** id → nombre, para recomendaciones y carga de trabajo */
  names: Map<string, string>;
  today?: Date;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const num = (v: unknown) => Number(v) || 0;

export function taskProgress(t: Task): number {
  return t.status === 'completada' ? 100 : clamp(num(t.percentComplete), 0, 100);
}

export function isOverdue(t: Task, today: Date): boolean {
  if (t.status === 'completada') return false;
  const end = parseDate(t.endDate);
  return !!end && end < today;
}

/** Fracción (0-1) del plazo [start, end] transcurrida a la fecha `today`. */
export function plannedFraction(start: Date, end: Date, today: Date): number {
  const total = diffDays(start, end) + 1;
  const elapsed = diffDays(start, today) + 1;
  return clamp(elapsed / Math.max(1, total), 0, 1);
}

export function semaforoFor(health: number): Semaforo {
  if (health >= 75) return 'verde';
  if (health >= 60) return 'ambar';
  return 'rojo';
}

export function healthLabelFor(health: number): string {
  if (health >= 90) return 'Excelente';
  if (health >= 75) return 'Bueno';
  if (health >= 60) return 'En atención';
  return 'Crítico';
}

export function computeMetrics(input: MetricsInput): ProjectMetrics {
  const today = input.today ?? startOfToday();
  const { project, tasks, risks, memberIds, names } = input;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completada').length;
  const inProgress = tasks.filter((t) => t.status === 'en_progreso').length;
  const overdueTasks = tasks.filter((t) => isOverdue(t, today));
  const overdue = overdueTasks.length;
  const pending = total - completed;

  const pStart = parseDate(project.startDate) ?? today;
  const pEnd = parseDate(project.endDate) ?? today;
  const daysLeft = diffDays(today, pEnd);

  // --- avance real y planificado (ponderados por duración) ---
  let weightSum = 0;
  let realSum = 0;
  let plannedSum = 0;
  for (const t of tasks) {
    const w = Math.max(1, num(t.durationDays));
    const s = parseDate(t.startDate);
    const e = parseDate(t.endDate);
    weightSum += w;
    realSum += w * taskProgress(t);
    plannedSum += w * (s && e ? plannedFraction(s, e, today) * 100 : 0);
  }
  const progressPct = weightSum ? Math.round(realSum / weightSum) : 0;
  const plannedPct = weightSum
    ? Math.round(plannedSum / weightSum)
    : Math.round(plannedFraction(pStart, pEnd, today) * 100);

  // --- componentes del Health Score ---
  const avanceScore = plannedPct < 5 ? 100 : clamp(Math.round((progressPct / plannedPct) * 100), 0, 100);
  const datesScore = total ? Math.round(100 * (1 - overdue / total)) : 100;

  const activeRisks = risks.filter((r) => r.status === 'activo');
  const penalty = activeRisks.reduce((sum, r) => sum + (r.severity === 'alto' ? 15 : r.severity === 'medio' ? 8 : 3), 0);
  const riskScore = clamp(100 - penalty, 0, 100);

  const members = memberIds.length ? memberIds : Array.from(new Set(tasks.map((t) => t.responsibleId)));
  const activeUsers = new Set(
    tasks.filter((t) => t.status !== 'pendiente' || num(t.percentComplete) > 0).map((t) => t.responsibleId),
  );
  const participationScore =
    plannedPct < 5 || members.length === 0
      ? 100
      : Math.round((members.filter((m) => activeUsers.has(m)).length / members.length) * 100);

  const healthScore = Math.round(0.4 * avanceScore + 0.3 * datesScore + 0.2 * riskScore + 0.1 * participationScore);

  // --- carga de trabajo por integrante (tareas activas) ---
  const active = tasks.filter((t) => t.status !== 'completada');
  const counts = new Map<string, number>();
  active.forEach((t) => counts.set(t.responsibleId, (counts.get(t.responsibleId) ?? 0) + 1));
  members.forEach((m) => {
    if (!counts.has(m)) counts.set(m, 0);
  });
  const workload: WorkloadRow[] = Array.from(counts.entries())
    .map(([userId, count]) => ({
      userId,
      name: names.get(userId) ?? 'Sin nombre',
      count,
      pct: active.length ? Math.round((count / active.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const prediction = predict({ pStart, pEnd, today, progressPct, plannedPct, overdue, total });

  // Semáforo = salud del proyecto, bajado un nivel si la predicción de retraso es crítica
  // (evita mostrar "verde" en un proyecto que, según su velocidad, va a terminar tarde).
  const hasData = total > 0;
  let semaforo = semaforoFor(healthScore);
  if (hasData && prediction.level === 'danger' && semaforo === 'verde') semaforo = 'ambar';
  const healthLabel = !hasData
    ? 'Sin datos'
    : semaforo === 'rojo' ? 'Crítico'
    : semaforo === 'ambar' ? 'En atención'
    : healthScore >= 90 ? 'Excelente' : 'Bueno';

  const recommendations = buildRecommendations({
    pending, daysLeft, overdue, workload, activeCount: active.length,
    highRisks: activeRisks.filter((r) => r.severity === 'alto').length, total,
  });

  return {
    total, completed, inProgress, pending, overdue,
    progressPct, plannedPct, hasData,
    avanceScore, datesScore, riskScore, participationScore,
    healthScore,
    healthLabel,
    semaforo,
    daysLeft,
    activeRisks: activeRisks.length,
    prediction,
    recommendations,
    workload,
  };
}

function predict(a: {
  pStart: Date; pEnd: Date; today: Date; progressPct: number; plannedPct: number; overdue: number; total: number;
}): Prediction {
  const totalDays = Math.max(1, diffDays(a.pStart, a.pEnd) + 1);

  if (a.total === 0) {
    return { level: 'nodata', probability: 0, delayDays: 0, message: 'Aún no hay tareas para estimar el riesgo de retraso.' };
  }
  if (a.today > a.pEnd && a.progressPct < 100) {
    return {
      level: 'danger', probability: 100, delayDays: Math.abs(diffDays(a.today, a.pEnd)),
      message: `El proyecto superó su fecha límite con ${a.progressPct}% de avance.`,
    };
  }
  if (a.plannedPct < 5) {
    return { level: 'nodata', probability: 0, delayDays: 0, message: 'Aún no hay suficiente avance planificado para predecir el retraso.' };
  }

  const spi = a.progressPct / a.plannedPct;
  const overdueRatio = a.total ? a.overdue / a.total : 0;
  const projectedDays = totalDays / Math.max(spi, 0.1);
  const delayDays = Math.max(0, Math.round(Math.min(projectedDays, totalDays * 3) - totalDays));

  const probability = clamp(
    Math.round(spi < 1 ? (1 - spi) * 150 + overdueRatio * 60 + 10 : 10 - (spi - 1) * 40 + overdueRatio * 60),
    5, 95,
  );
  const level = probability >= 60 ? 'danger' : probability >= 30 ? 'warn' : 'ok';
  const message =
    spi < 0.98 && delayDays > 0
      ? `Existe un ${probability}% de probabilidad de que el proyecto termine ${delayDays} ${delayDays === 1 ? 'día' : 'días'} después de la fecha planificada.`
      : `El proyecto va en camino: ${100 - probability}% de probabilidad de terminar en la fecha planificada.`;
  return { level, probability, delayDays, message };
}

function buildRecommendations(a: {
  pending: number; daysLeft: number; overdue: number; workload: WorkloadRow[]; activeCount: number; highRisks: number; total: number;
}): Recommendation[] {
  const out: Recommendation[] = [];

  if (a.total === 0) {
    return [{ level: 'info', text: 'Agrega tareas al cronograma para activar las recomendaciones automáticas.' }];
  }
  if (a.overdue > 0) {
    out.push({
      level: 'danger',
      text: `Hay ${a.overdue} ${a.overdue === 1 ? 'tarea atrasada' : 'tareas atrasadas'}. Reprograma o prioriza su cierre esta semana.`,
    });
  }
  const top = a.workload[0];
  if (top && a.activeCount >= 3 && top.pct > 50) {
    out.push({
      level: 'warn',
      text: `${top.name} concentra el ${top.pct}% de las tareas activas. Existe riesgo de cuello de botella.`,
    });
  }
  if (a.pending > 0 && a.daysLeft >= 0) {
    const heavy = a.pending / Math.max(1, a.daysLeft) > 0.8;
    out.push({
      level: heavy ? 'warn' : 'info',
      text: `El proyecto tiene ${a.pending} ${a.pending === 1 ? 'tarea pendiente' : 'tareas pendientes'} y ${a.daysLeft === 1 ? 'queda 1 día' : `quedan ${a.daysLeft} días`}.`,
    });
  }
  if (a.highRisks > 0) {
    out.push({
      level: 'danger',
      text: `Hay ${a.highRisks} ${a.highRisks === 1 ? 'riesgo activo de severidad alta' : 'riesgos activos de severidad alta'}. Revisa su plan de mitigación.`,
    });
  }
  const idle = a.workload.filter((w) => w.count === 0);
  if (idle.length && a.activeCount > 0) {
    out.push({ level: 'info', text: `${idle.map((i) => i.name).join(', ')} no ${idle.length === 1 ? 'tiene' : 'tienen'} tareas activas: considera redistribuir carga.` });
  }
  if (!out.length) out.push({ level: 'info', text: 'Todo en orden: no hay alertas por el momento.' });
  return out.slice(0, 4);
}
