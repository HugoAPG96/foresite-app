import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:4200';

// Evidencia visual de TA-001. Solo se generan capturas cuando se pide
// explícitamente (CAPTURE_EVIDENCE=1); en CI no se escribe nada.
const EVIDENCE_DIR = path.resolve(__dirname, '../../evidence/TA-001');
const CAPTURE_EVIDENCE = !!process.env['CAPTURE_EVIDENCE'];

// Claves reales de sesión: `persistedSignal` guarda con el prefijo
// `foresite:v1:`, no con `auth:token` a secas.
// Nunca usar `localStorage.clear()` en los tests: en MOCK_MODE=true borraría
// también `auth:mockUsers` (la "base de datos" de usuarios registrados), que
// el mismo test necesita volver a consultar después.
const SESSION_KEYS = ['foresite:v1:auth:token', 'foresite:v1:auth:currentUser'];

async function limpiarSesion(page: Page) {
  await page.evaluate((keys) => {
    for (const key of keys) localStorage.removeItem(key);
  }, SESSION_KEYS);
}

async function capturar(page: Page, archivo: string) {
  if (!CAPTURE_EVIDENCE) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, archivo), fullPage: true });
}

test.describe('TA-001 — Autenticación E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await limpiarSesion(page);
  });

  test('Registro con datos válidos: la cuenta se crea y el usuario accede al sistema', async ({ page }) => {
    const email = `user-${Date.now()}@test.com`;
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });

    await capturar(page, 'TA-001-C01-registro-exitoso.png');
  });

  test('Registro con correo existente: muestra error y no crea la cuenta', async ({ page }) => {
    const email = `dup-${Date.now()}@test.com`;
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });

    await limpiarSesion(page);
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page.getByText('Ya existe una cuenta con ese correo.')).toBeVisible({ timeout: 10000 });

    await capturar(page, 'TA-001-C02-correo-existente.png');
  });

  test('Inicio de sesión con credenciales correctas: redirige a pantalla principal', async ({ page }) => {
    const email = `login-${Date.now()}@test.com`;
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });

    await limpiarSesion(page);
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });

    await capturar(page, 'TA-001-C03-login-exitoso.png');
  });

  test('Inicio de sesión con credenciales incorrectas: muestra error', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Correo').fill('noexiste@test.com');
    await page.getByLabel('Contraseña').fill('wrongpass');
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible({ timeout: 10000 });

    await capturar(page, 'TA-001-C04-login-incorrecto.png');
  });

  test('Edición de nombre: el cambio se guarda y se refleja en el sistema', async ({ page }) => {
    const email = `perfil-${Date.now()}@test.com`;
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Nombre Original');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });

    await page.goto(`${BASE}/perfil`);
    const inputNombre = page.locator('input:not([disabled])').last();
    await inputNombre.fill('Nombre Editado');
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText('Cambios guardados.')).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.locator('input:not([disabled])').last()).toHaveValue('Nombre Editado', { timeout: 10000 });

    await capturar(page, 'TA-001-C05-perfil-nombre-editado.png');
  });
});