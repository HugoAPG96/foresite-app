import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:4200';

test.describe('TA-001 — Autenticación E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
  });

  test('Registro con datos válidos: la cuenta se crea y el usuario accede al sistema', async ({ page }) => {
    const email = `user-${Date.now()}@test.com`;
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });
  });

  test('Registro con correo existente: muestra error y no crea la cuenta', async ({ page }) => {
    const email = `dup-${Date.now()}@test.com`;
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });

    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page.getByText('Ya existe una cuenta con ese correo.')).toBeVisible({ timeout: 10000 });
  });

  test('Inicio de sesión con credenciales correctas: redirige a pantalla principal', async ({ page }) => {
    const email = `login-${Date.now()}@test.com`;
    await page.goto(`${BASE}/registro`);
    await page.getByLabel('Nombre').fill('Hugo Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /registrarme/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });

    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('123456');
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });
  });

  test('Inicio de sesión con credenciales incorrectas: muestra error', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Correo').fill('noexiste@test.com');
    await page.getByLabel('Contraseña').fill('wrongpass');
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible({ timeout: 10000 });
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
  });
});