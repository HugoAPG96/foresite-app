import { HttpErrorResponse } from '@angular/common/http';

/** Extrae un mensaje legible de un error HTTP de NestJS. */
export function errorMessage(err: unknown, fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor. Si usas Render gratuito, puede estar despertando: espera unos segundos y reintenta.';
    const body = err.error as { message?: string | string[] } | null;
    const msg = body?.message;
    if (Array.isArray(msg)) return msg.join(' · ');
    if (typeof msg === 'string' && msg) return msg;
    if (err.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
    if (err.status === 404) return 'No se encontró el recurso solicitado.';
  }
  return fallback;
}
