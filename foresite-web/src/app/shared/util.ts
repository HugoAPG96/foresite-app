export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function semaforoLabel(s: 'verde' | 'ambar' | 'rojo'): string {
  return s === 'verde' ? 'Verde' : s === 'ambar' ? 'Ámbar' : 'Rojo';
}
