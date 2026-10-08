const DAY_MS = 24 * 60 * 60 * 1000;

/** Convierte 'yyyy-MM-dd' (o ISO) a Date LOCAL a medianoche (evita el corrimiento de zona horaria). */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Date → 'yyyy-MM-dd' usando los componentes locales. */
export function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Diferencia en días enteros (b - a). */
export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Duración inclusiva en días (14/09 → 16/09 = 3). */
export function durationDays(start: Date, end: Date): number {
  return Math.max(1, diffDays(start, end) + 1);
}

/** 'yyyy-MM-dd' → 'dd/MM/yyyy' */
export function formatDate(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** 'yyyy-MM-dd' → 'dd/MM' */
export function formatShort(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
