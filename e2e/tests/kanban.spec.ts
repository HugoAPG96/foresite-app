import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:4200';

// Estado controlado y documentado (MOCK_MODE): un proyecto y un miembro,
// usuario ya autenticado. Ver evidence/TA-003/diagnostico.md.
const PROJECT_ID = 'e2e-ta003-project';
const MEMBER_ID = 'e2e-ta003-user';
const MEMBER_EMAIL = 'e2e.ta003.owner@foresite-e2e.test';

const EVIDENCE_DIR = path.resolve(__dirname, '../../evidence/TA-003');
const CAPTURE_EVIDENCE = !!process.env['CAPTURE_EVIDENCE'];

async function capturar(page: Page, archivo: string) {
  if (!CAPTURE_EVIDENCE) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, archivo), fullPage: true });
}

// Siembra el localStorage de MOCK_MODE una sola vez por contexto de navegador
// (el guard evita re-sembrar en cada reload, para poder probar persistencia).
async function sembrarEstado(page: Page) {
  await page.addInitScript(
    ([projectId, memberId, memberEmail]) => {
      if (localStorage.getItem('foresite:v1:seed:ta003')) return;
      localStorage.setItem('foresite:v1:seed:ta003', '1');
      localStorage.setItem('foresite:v1:auth:token', JSON.stringify('mock.e2e.ta003.token'));
      localStorage.setItem(
        'foresite:v1:auth:currentUser',
        JSON.stringify({ id: memberId, name: 'E2E Tester', email: memberEmail }),
      );
      localStorage.setItem(
        'foresite:v1:proyectos:mock',
        JSON.stringify([
          {
            id: projectId,
            nombre: 'E2E-TA003 Kanban',
            descripcion: 'Proyecto de prueba TA-003',
            avance: 0,
            estado: 'verde',
          },
        ]),
      );
      localStorage.setItem(
        'foresite:v1:miembros:mock',
        JSON.stringify({
          [projectId]: [
            { id: 'mem-1', role: null, usuario: { id: memberId, name: 'E2E Tester', email: memberEmail } },
          ],
        }),
      );
    },
    [PROJECT_ID, MEMBER_ID, MEMBER_EMAIL],
  );
}

async function abrirKanban(page: Page) {
  await sembrarEstado(page);
  await page.goto(`${BASE}/proyectos/${PROJECT_ID}/tareas`);
  await expect(page.locator('.kanban')).toBeVisible();
}

function columna(page: Page, id: 'pendiente' | 'progreso' | 'completada'): Locator {
  return page.locator(`.kanban__list#${id}`);
}

function tarjeta(page: Page, columnaId: 'pendiente' | 'progreso' | 'completada', titulo: string): Locator {
  return page.locator(`.kanban__list#${columnaId} .task-card`, { hasText: titulo });
}

async function crearTarea(page: Page, titulo: string, inicio = '2026-03-01', fin = '2026-03-10') {
  await page.getByRole('button', { name: /nueva tarea/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título').fill(titulo);
  await dialog.getByLabel('Fecha inicio').fill(inicio);
  await dialog.getByLabel('Fecha fin').fill(fin);
  await dialog.getByRole('button', { name: /crear tarea/i }).click();
  await expect(tarjeta(page, 'pendiente', titulo)).toBeVisible();
}

// Drag & drop de Angular CDK: usa eventos de mouse reales con pasos.
async function arrastrar(page: Page, origen: Locator, destinoColumnaId: 'pendiente' | 'progreso' | 'completada') {
  const caja = await origen.boundingBox();
  const destino = await columna(page, destinoColumnaId).boundingBox();
  if (!caja || !destino) throw new Error('No se pudo calcular el area de drag & drop');
  const sx = caja.x + caja.width / 2;
  const sy = caja.y + caja.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 12, sy + 12, { steps: 5 });
  await page.mouse.move(destino.x + destino.width / 2, destino.y + 40, { steps: 20 });
  await page.mouse.up();
}

test.describe('TA-003 — Kanban E2E', () => {
  test('C01 — El tablero muestra las columnas Pendiente, En progreso y Completada', async ({ page }) => {
    await abrirKanban(page);

    await expect(page.locator('.kanban__column-title').filter({ hasText: 'Pendiente' })).toBeVisible();
    await expect(page.locator('.kanban__column-title').filter({ hasText: 'En progreso' })).toBeVisible();
    await expect(page.locator('.kanban__column-title').filter({ hasText: 'Completada' })).toBeVisible();

    await capturar(page, 'TA-003-C01-tablero-columnas.png');
  });

  test('C02 — Crear una tarea la coloca en la columna Pendiente', async ({ page }) => {
    await abrirKanban(page);
    const titulo = `E2E-TA003 crear ${Date.now()}`;

    await crearTarea(page, titulo);

    await expect(tarjeta(page, 'pendiente', titulo)).toBeVisible();
    await expect(tarjeta(page, 'progreso', titulo)).toHaveCount(0);

    await capturar(page, 'TA-003-C02-crear-tarea.png');
  });

  test('C03 — La tarjeta muestra título, responsable y prioridad', async ({ page }) => {
    await abrirKanban(page);
    const titulo = `E2E-TA003 datos ${Date.now()}`;

    await crearTarea(page, titulo);

    const card = tarjeta(page, 'pendiente', titulo);
    await expect(card.locator('.task-card__title')).toHaveText(titulo);
    await expect(card).toContainText('E2E Tester'); // responsable
    await expect(card).toContainText('Media'); // prioridad por defecto

    await capturar(page, 'TA-003-C03-tarjeta-datos.png');
  });

  test('C04 — Editar una tarea actualiza la tarjeta', async ({ page }) => {
    await abrirKanban(page);
    const titulo = `E2E-TA003 editar ${Date.now()}`;
    const nuevoTitulo = `${titulo} (editada)`;

    await crearTarea(page, titulo);
    await tarjeta(page, 'pendiente', titulo).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Título').fill(nuevoTitulo);
    await dialog.getByLabel('Prioridad').click();
    await page.getByRole('option', { name: 'Alta' }).click();
    await dialog.getByRole('button', { name: /guardar cambios/i }).click();

    const card = tarjeta(page, 'pendiente', nuevoTitulo);
    await expect(card).toBeVisible();
    await expect(card).toContainText('Alta');

    await capturar(page, 'TA-003-C04-editar-tarea.png');
  });

  test('C05 — Mover una tarjeta cambia su columna (drag & drop)', async ({ page }) => {
    await abrirKanban(page);
    const titulo = `E2E-TA003 mover ${Date.now()}`;

    await crearTarea(page, titulo);
    await arrastrar(page, tarjeta(page, 'pendiente', titulo), 'progreso');

    await expect(tarjeta(page, 'progreso', titulo)).toBeVisible();
    await expect(tarjeta(page, 'pendiente', titulo)).toHaveCount(0);

    await capturar(page, 'TA-003-C05-mover-tarjeta.png');
  });

  test('C06 — Alternar entre vista Kanban y Cronograma', async ({ page }) => {
    await abrirKanban(page);

    await page.getByRole('radio', { name: /cronograma/i }).click();
    await expect(page.locator('table.cronograma-table')).toBeVisible();
    await expect(page.locator('.kanban')).toHaveCount(0);

    await page.getByRole('radio', { name: /kanban/i }).click();
    await expect(page.locator('.kanban')).toBeVisible();

    await capturar(page, 'TA-003-C06-vista-cronograma.png');
  });

  test('C07 — Persistencia: la tarea y su columna se mantienen tras recargar', async ({ page }) => {
    await abrirKanban(page);
    const titulo = `E2E-TA003 persistir ${Date.now()}`;

    await crearTarea(page, titulo);
    await arrastrar(page, tarjeta(page, 'pendiente', titulo), 'progreso');
    await expect(tarjeta(page, 'progreso', titulo)).toBeVisible();

    await page.reload();
    await expect(page.locator('.kanban')).toBeVisible();
    await expect(tarjeta(page, 'progreso', titulo)).toBeVisible();
    await expect(tarjeta(page, 'pendiente', titulo)).toHaveCount(0);

    await capturar(page, 'TA-003-C07-persistencia.png');
  });
});
