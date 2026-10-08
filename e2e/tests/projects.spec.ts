import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:4200';
const PASSWORD = '123456';

// e2e/tests -> ../../evidence/TA-002 (raíz del repo)
const EVIDENCE_DIR = path.resolve(__dirname, '../../evidence/TA-002');

// Las capturas solo se generan cuando se pide explícitamente (no en CI).
const CAPTURE_EVIDENCE = !!process.env['CAPTURE_EVIDENCE'];

async function capturar(page: Page, archivo: string) {
  if (!CAPTURE_EVIDENCE) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, archivo), fullPage: true });
}

async function registrarse(page: Page, nombre: string, email: string) {
  await page.goto(`${BASE}/registro`);
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: /registrarme/i }).click();
  await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });
}

async function iniciarSesion(page: Page, email: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });
}

async function cerrarSesion(page: Page) {
  await page.getByRole('button', { name: 'Cuenta' }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
}

// Recorre el wizard real de alta: Acta -> RACI -> Backlog -> Finalizar.
async function crearProyecto(page: Page, nombre: string) {
  await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
  await expect(page).toHaveURL(/\/proyecto\/nuevo\/acta/, { timeout: 10000 });
  await page.getByLabel('Nombre del proyecto').fill(nombre);

  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(/\/proyecto\/nuevo\/raci/, { timeout: 10000 });

  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(/\/proyecto\/nuevo\/backlog/, { timeout: 10000 });

  await page.getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/proyectos/, { timeout: 10000 });
}

async function abrirMiembrosDelProyecto(page: Page, nombre: string) {
  await page.locator('.project-card', { hasText: nombre }).click();
  await expect(page).toHaveURL(/\/proyectos\/.+\/tareas/, { timeout: 10000 });
  await page.getByRole('link', { name: 'Miembros' }).click();
  await expect(page).toHaveURL(/\/proyectos\/.+\/miembros/, { timeout: 10000 });
}

test.describe('TA-002 — Gestión de Proyectos y Equipo E2E', () => {
  let ownerEmail: string;

  test.beforeEach(async ({ page }) => {
    // Usuario nuevo y único por prueba: cada test es independiente y no
    // depende del orden ni de datos creados por otra prueba.
    ownerEmail = `owner-${Date.now()}@test.com`;
    await registrarse(page, 'Usuario Proyectos', ownerEmail);
  });

  test('C01 — Crear un proyecto mediante el wizard y verlo en el listado', async ({ page }) => {
    const nombre = `Proyecto C01 ${Date.now()}`;

    await crearProyecto(page, nombre);

    // Debe comprobarse que el proyecto aparece realmente en el listado.
    await expect(page.locator('.project-card', { hasText: nombre })).toBeVisible({ timeout: 10000 });

    await capturar(page, 'TA-002-C01-creacion-proyecto.png');
  });

  test('C03 — Agregar un miembro registrado y verlo en el listado', async ({ page }) => {
    const nombre = `Proyecto C03 ${Date.now()}`;
    const memberEmail = `member-${Date.now()}@test.com`;

    // Este test necesita un segundo usuario registrado. Lo crea explícitamente
    // dentro del mismo test y vuelve a la sesión del dueño (sin dependencias).
    await registrarse(page, 'Usuario Miembro', memberEmail);
    await cerrarSesion(page);
    await iniciarSesion(page, ownerEmail);

    await crearProyecto(page, nombre);
    await abrirMiembrosDelProyecto(page, nombre);

    await page.getByLabel('Correo del usuario a agregar').fill(memberEmail);
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Debe comprobarse que el miembro aparece realmente en la lista.
    await expect(page.locator('.miembros__list')).toContainText(memberEmail, { timeout: 10000 });

    await capturar(page, 'TA-002-C03-miembro-registrado.png');
  });

  // ---------------------------------------------------------------------------
  // Criterios NO CUBIERTOS por limitaciones reales de MOCK_MODE (ver
  // evidence/TA-002/diagnostico.md §8). Se declaran como skip explícito para
  // que queden trazables en el reporte; NO se inventan assertions.
  // ---------------------------------------------------------------------------

  test.skip(
    'C02 — Visibilidad: solo proyectos propios o donde es miembro (NO CUBIERTO: MOCK_MODE no filtra por usuario)',
    () => {},
  );

  test.skip(
    'C04 — Correo no registrado muestra error (NO CUBIERTO: MOCK_MODE no valida el correo)',
    () => {},
  );

  test.skip(
    'C05 — Usuario sin acceso no ve/gestiona el proyecto (NO CUBIERTO: MOCK_MODE no modela permisos)',
    () => {},
  );

  test.skip(
    'C06 — Usuario agregado obtiene acceso (NO CUBIERTO: MOCK_MODE no modela permisos)',
    () => {},
  );
});
