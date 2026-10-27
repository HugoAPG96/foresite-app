# Foresite — gestión de proyectos de software

Aplicación web para planificar proyectos de software: acta de constitución, matriz RACI, backlog, tablero Kanban, cronograma, riesgos, dashboard y reportes. Pensada para equipos pequeños que hoy trabajan con hojas de cálculo y pierden visibilidad del estado real.

**Producción:** https://foresite-app-navy.vercel.app

**Equipo:** 3 personas (frontend, backend y aseguramiento de calidad).
**Estado:** frontend en Vercel, API en NestJS y base PostgreSQL en Neon. El backend corre en el plan gratuito de Render, así que el primer acceso del día puede tardar cerca de un minuto en despertar. Para probar solo la interfaz está el **modo simulado**, sin API ni base de datos, que es el mismo que usan las pruebas en CI.

---

## Funcionalidades

- **Autenticación** con JWT: registro, login y perfil.
- **Creación guiada de proyectos en 4 pasos**: acta de constitución → cronograma RACI → product backlog → dashboard.
- **Tablero Kanban** con columnas Pendiente / En progreso / Completada, prioridad, responsable y fecha; vista alternativa de cronograma.
- **Backlog** con épicas, historias de usuario, spikes, bugs y enablers.
- **Riesgos** con detección y proyección de retraso.
- **Miembros** por proyecto, con roles.
- **Dashboard y reportes** con gráficos (Chart.js).
- **Modo simulado** (`MOCK_MODE`) para correr la app y las pruebas sin backend.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Angular 21, Angular Material, TypeScript, Chart.js |
| Backend | NestJS 10, TypeORM, PostgreSQL (Neon), Passport + JWT, bcrypt, Swagger |
| Pruebas | Playwright (E2E), Vitest (unitarias) |
| CI/CD | GitHub Actions, Vercel |

## Estructura

```
foresite-app/
├── front/         # SPA Angular
├── backend/       # API REST NestJS
├── e2e/           # Suites de Playwright
├── evidence/      # Evidencia por historia de usuario (capturas, checklist, trazas)
├── diagramas/     # Diagramas PlantUML (arquitectura, secuencia, modelo de datos)
└── .github/workflows/e2e.yml
```

## Cómo correrlo

### Solo frontend, en modo simulado (recomendado para probar la UI)

```bash
cd front
npm install
# front/src/app/core/config/api.config.ts → export const MOCK_MODE = true;
npm start            # http://localhost:4200
```

En modo simulado no se llama a la API: el registro y el login aceptan cualquier correo válido y los proyectos se guardan en `localStorage`. Los proyectos de ejemplo vienen precargados.

### Stack completo

```bash
# 1. API
cd backend
cp .env.example .env      # DATABASE_URL y JWT_SECRET son obligatorios
npm install
npm run migration:run
npm run start:dev         # http://localhost:3000 · Swagger en /api

# 2. Frontend (con MOCK_MODE = false y API_BASE_URL apuntando a la API)
cd ../front
npm install
npm start
```

## Pruebas

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

Las suites cubren autenticación, creación y listado de proyectos, y el tablero Kanban (columnas, alta de tarea, edición, drag & drop, cambio de vista y persistencia). El workflow de GitHub Actions activa el modo simulado antes de correr, así que **CI nunca escribe en la base de datos de producción**.

Para ver el reporte: `npx playwright show-report`.

## Decisiones de arquitectura

- **Frontend y API separados**: dos despliegues independientes permiten probar la UI contra un backend simulado y documentar la API con Swagger sin acoplarla al cliente. El costo es más configuración (CORS, variables de entorno, dos pipelines).
- **Modo simulado en CI**: las pruebas E2E no necesitan base de datos, son deterministas y rápidas. El costo es mantener el mock; por eso el flujo real se cubre con pruebas aparte (`tests-prod/`).
- **Evidencia por criterio de aceptación**: cada historia se cierra con captura, checklist, diagnóstico, traza de Playwright y enlace al run de CI, en `evidence/TA-00x/`.

## Limitaciones conocidas

- La interfaz está pensada para escritorio; todavía no es responsive.
- El backend gratuito puede tardar hasta un minuto en responder el primer acceso del día.
- Sin pruebas de integración de la API (solo E2E y unitarias).

## Equipo

Proyecto de tres personas. Aporte de [Hugo Peralta](https://github.com/HugoAPG96) (20 de 35 commits): autenticación en modo simulado, tres suites E2E con Playwright, CI en GitHub Actions, configuración de despliegue y documentación de evidencias.
