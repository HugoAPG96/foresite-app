import { effect, signal, WritableSignal } from '@angular/core';

// Prefijo con versión: si cambia la forma de los datos, subir a v2 evita
// que un localStorage viejo rompa la app.
const PREFIX = 'foresite:v1:';

function leer<T>(key: string, inicial: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? inicial : (JSON.parse(raw) as T);
  } catch {
    return inicial;
  }
}

function escribir<T>(key: string, valor: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(valor));
  } catch {
    // localStorage puede estar bloqueado o lleno; la app sigue funcionando en memoria.
  }
}

// Debe llamarse en un contexto de inyección (campo de un servicio o componente).
// Cuando llegue el backend, el store deja de usar esto y hace HttpClient.
export function persistedSignal<T>(key: string, inicial: T): WritableSignal<T> {
  const s = signal<T>(leer(key, inicial));
  effect(() => escribir(key, s()));
  return s;
}
