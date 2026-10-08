import { test, expect } from '@playwright/test';
import type { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// TA-002 contra el sistema REAL desplegado: Vercel (front) -> Render (API) -> Neon.
//
// Estrategia: ESCENARIO CONTROLADO con dos usuarios de prueba. Se registran
// usuarios y se crea UN proyecto de prueba mediante la API real (mismo
// mecanismo que usa la app) en `beforeAll`, y cada test comprueba un criterio
// contra la UI real. El orden es explícito y necesario:
//   C01 (crea A) -> C02/C05 (B SIN acceso) -> C03/C04 (A agrega miembros) -> C06 (B CON acceso)
//
// Seguridad de datos:
//   - Solo se CREAN datos nuevos, claramente identificables (correos @foresite-e2e.test
//     y proyectos `E2E-TA002 ...`). Nunca se modifican/borran datos existentes.
//   - No se ejecuta SQL directo ni operaciones destructivas.
//   - La app no expone endpoints de borrado, por eso los datos de prueba quedan
//     registrados y se documentan en evidence/TA-002/README.md.
// ---------------------------------------------------------------------------

const API_URL = process.env['E2E_API_URL'] ?? 'https://foresite-app.onrender.com';
const API_PREFIX = ''; // el backend no usa prefijo global (/auth, /projects, ...)

const EVIDENCE_DIR = path.resolve(__dirname, '../../evidence/TA-002');
const CAPTURE_EVIDENCE = !!process.env['CAPTURE_EVIDENCE'];

async function capturar(page: Page, archivo: string) {
  if (!CAPTURE_EVIDENCE) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, archivo), fullPage: true });
}

async function uiLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).toHaveURL(/\/proyectos$/, { timeout: 60000 });
}

async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post(`${API_URL}${API_PREFIX}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok(), `login API ${email} -> ${res.status()}`).toBeTruthy();
  return (await res.json()).accessToken as string;
}

async function abrirMiembrosDelProyecto(page: Page, nombreProyecto: string) {
  await page.locator('.project-card', { hasText: nombreProyecto }).click();
  await expect(page).toHaveURL(/\/proyectos\/[^/]+\/tareas/, { timeout: 60000 });
  await page.getByRole('link', { name: 'Miembros' }).click();
  await expect(page).toHaveURL(/\/proyectos\/[^/]+\/miembros/, { timeout: 60000 });
}

test.describe.serial('TA-002 (sistema desplegado real) — Gestión de Proyectos y Equipo', () => {
  const stamp = Date.now();
  const password = 'E2eTa002!2026';

  const owner = { name: 'E2E TA002 Owner', email: `e2e.ta002.owner.${stamp}@foresite-e2e.test`, password };
  const member = { name: 'E2E TA002 Member', email: `e2e.ta002.member.${stamp}@foresite-e2e.test`, password };
  const unregisteredEmail = `e2e.ta002.unregistered.${stamp}@foresite-e2e.test`;

  const sharedProjectName = `E2E-TA002 shared ${stamp}`;
  const wizardProjectName = `E2E-TA002 wizard ${stamp}`;

  let projectId = '';

  test.beforeAll(async ({ playwright }) => {
    const api = await playwright.request.newContext({ baseURL: API_URL });

    const registrar = async (u: { name: string; email: string; password: string }) => {
      const res = await api.post(`${API_PREFIX}/auth/register`, { data: u });
      if (!res.ok()) throw new Error(`register ${u.email} -> ${res.status()} ${await res.text()}`);
      return (await res.json()).accessToken as string;
    };

    const ownerToken = await registrar(owner);
    await registrar(member);

    const pr = await api.post(`${API_PREFIX}/projects`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        name: sharedProjectName,
        objective: 'Proyecto de prueba E2E TA-002 (sistema desplegado real)',
        scope: 'Solo datos de prueba, identificables por el prefijo E2E-TA002',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
    });
    if (!pr.ok()) throw new Error(`create project -> ${pr.status()} ${await pr.text()}`);
    projectId = (await pr.json()).id as string;

    await api.dispose();
  });

  test('C01 — Crear proyecto por el wizard y verlo en el listado', async ({ page }) => {
    await uiLogin(page, owner.email, owner.password);

    await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
    await expect(page).toHaveURL(/\/proyecto\/nuevo\/acta/, { timeout: 60000 });
    await page.getByLabel('Nombre del proyecto').fill(wizardProjectName);

    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page).toHaveURL(/\/proyecto\/nuevo\/raci/, { timeout: 60000 });

    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page).toHaveURL(/\/proyecto\/nuevo\/backlog/, { timeout: 60000 });

    await page.getByRole('button', { name: 'Finalizar' }).click();
    await expect(page).toHaveURL(/\/proyectos$/, { timeout: 60000 });

    // El proyecto creado realmente aparece en el listado.
    await expect(page.locator('.project-card', { hasText: wizardProjectName })).toBeVisible({ timeout: 60000 });

    await capturar(page, 'TA-002-C01-creacion-proyecto.png');
  });

  test('C02 — El usuario B no ve el proyecto de A antes de ser miembro', async ({ page, request }) => {
    await uiLogin(page, member.email, member.password);

    // UI: el proyecto de A no aparece en el listado de B.
    await expect(page.locator('.project-card', { hasText: sharedProjectName })).toHaveCount(0);

    // API real: GET /projects de B no incluye el proyecto de A.
    const token = await apiLogin(request, member.email, member.password);
    const res = await request.get(`${API_URL}${API_PREFIX}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const proyectos = (await res.json()) as Array<{ id: string }>;
    expect(proyectos.some((p) => p.id === projectId)).toBeFalsy();

    await capturar(page, 'TA-002-C02-listado-proyectos.png');
  });

  test('C05 — El usuario B no puede acceder al proyecto de A', async ({ page, request }) => {
    await uiLogin(page, member.email, member.password);

    // La app redirige al listado cuando el proyecto no es accesible.
    await page.goto(`/proyectos/${projectId}`);
    await expect(page).toHaveURL(/\/proyectos$/, { timeout: 60000 });

    // API real: acceso directo al proyecto devuelve 404 (no filtra existencia).
    const token = await apiLogin(request, member.email, member.password);
    const res = await request.get(`${API_URL}${API_PREFIX}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(404);

    await capturar(page, 'TA-002-C05-usuario-sin-acceso.png');
  });

  test('C03 — Usuario A agrega a B (registrado) y aparece en la lista de miembros', async ({ page }) => {
    await uiLogin(page, owner.email, owner.password);
    await abrirMiembrosDelProyecto(page, sharedProjectName);

    await page.getByLabel('Correo del usuario a agregar').fill(member.email);
    await page.getByRole('button', { name: 'Agregar' }).click();

    // El miembro aparece realmente en la lista.
    await expect(page.locator('.miembros__list')).toContainText(member.email, { timeout: 60000 });

    await capturar(page, 'TA-002-C03-miembro-registrado.png');
  });

  test('C04 — Correo no registrado muestra error y no se agrega', async ({ page }) => {
    await uiLogin(page, owner.email, owner.password);
    await abrirMiembrosDelProyecto(page, sharedProjectName);

    await page.getByLabel('Correo del usuario a agregar').fill(unregisteredEmail);
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Mensaje real del backend (404): "No existe un usuario registrado con ese correo".
    await expect(page.getByText(/No existe un usuario registrado con ese correo/i)).toBeVisible({ timeout: 60000 });

    // El miembro inválido NO aparece en la lista.
    await expect(page.locator('.miembros__list')).not.toContainText(unregisteredEmail);

    // El flujo sigue usable: el formulario permanece disponible.
    await expect(page.getByLabel('Correo del usuario a agregar')).toBeVisible();

    await capturar(page, 'TA-002-C04-correo-no-registrado.png');
  });

  test('C06 — El usuario B obtiene acceso tras ser agregado como miembro', async ({ page }) => {
    await uiLogin(page, member.email, member.password);

    // Ahora el proyecto de A sí aparece en el listado de B.
    const card = page.locator('.project-card', { hasText: sharedProjectName });
    await expect(card).toBeVisible({ timeout: 60000 });
    await card.click();

    // Acceso permitido: entra al proyecto y ve sus recursos (Tareas/Miembros).
    await expect(page).toHaveURL(new RegExp(`/proyectos/${projectId}/tareas`), { timeout: 60000 });
    await expect(page.getByRole('link', { name: 'Miembros' })).toBeVisible();

    await capturar(page, 'TA-002-C06-acceso-miembro.png');
  });
});
