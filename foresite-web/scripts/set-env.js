/**
 * Inyecta la URL del backend en environment.ts al construir.
 * Uso (Vercel / CI):  API_URL=https://mi-api.onrender.com npm run build
 * Si API_URL no está definida, no toca nada.
 */
const fs = require('fs');
const path = require('path');

const apiUrl = (process.env.API_URL || '').trim().replace(/\/+$/, '');
if (!apiUrl) {
  console.log('[set-env] API_URL no definida: se usa la URL de src/environments/environment.ts');
  process.exit(0);
}
const file = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
const content = `/** Generado por scripts/set-env.js — no editar a mano en CI. */
export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
};
`;
fs.writeFileSync(file, content);
console.log('[set-env] apiUrl =', apiUrl);
