# TA-003 — Diagnóstico (Kanban)

## Estado inicial

- No existe matriz oficial de criterios de TA-003 en el repositorio (ver
  `checklist.md`). El alcance se reconstruyó de la documentación (`backend/README.md`
  y `diagramas/C4_Arquitectura.puml` mencionan "tareas (Kanban/Cronograma)") y de
  los commits `beace91` / `1cc488e` ("conecta el Kanban de tareas al backend real").
- Ya existía un tablero Kanban funcional:
  - Front: `front/src/app/features/tareas/` (`Tareas` + `TareasStore` + `TareaDialog`),
    con 3 columnas (Pendiente / En progreso / Completada), drag & drop con Angular
    CDK, alta/edición por diálogo y toggle Kanban/Cronograma.
  - Backend: `backend/src/modules/tasks/` con `GET/POST /projects/:projectId/tasks`
    y `PATCH /projects/:projectId/tasks/:id` (título, responsable, fechas,
    prioridad, estado), protegidos con `assertAccess` (dueño o miembro).
- No existía ninguna prueba E2E de TA-003.

## Diagnóstico

Se identificó **un problema real** y varias limitaciones:

1. **Bug en modo mock de `mover`:** `TareasStore.mover()` movía la tarjeta entre
   columnas visualmente, pero en `MOCK_MODE` no actualizaba las señales
   persistidas (`_pendienteMock`, `_progresoMock`, `_completadaMock`). Al recargar,
   el movimiento se perdía.
2. **`MOCK_MODE` no calcula `vencida`:** `crear()` en mock fija `vencida: false`;
   el indicador "Vencida" solo se calcula al mapear tareas del backend.
3. **No hay `DELETE /tasks`:** no se puede eliminar tareas (fuera del alcance
   reconstruido).
4. **Sin criterios oficiales:** no había forma de saber qué validar exactamente.

## Causa raíz

- Del bug de persistencia: el bloque `if (MOCK_MODE) return;` en `mover()` salía
  antes de sincronizar las señales persistidas, y el caso "misma columna" tampoco
  persistía. El modo simulado quedaba inconsistente con el backend (que sí
  persiste el cambio de estado vía `PATCH`).
- De la ausencia de cobertura: TA-003 nunca tuvo pruebas E2E ni evidencia.

## Solución

1. **Fix modo mock (solo `MOCK_MODE`):** se agregó `persistirMovimientoMock()`,
   invocado tras mover (mismo column y entre columnas). Refleja las columnas en
   las señales persistidas para que el movimiento sobreviva a un reload. No afecta
   la ruta de producción (`MOCK_MODE=false`).
2. **Suite E2E** `e2e/tests/kanban.spec.ts` (mock/controlado, corre en CI) con 7
   criterios (C01–C07) y captura de evidencia por criterio (`CAPTURE_EVIDENCE=1`).
   Usa un **estado controlado y documentado** sembrado en `localStorage`
   (`proyectos:mock`, `miembros:mock`, `auth:*`) para aislar la prueba del Kanban
   del flujo de creación de proyecto (ya cubierto por TA-002).
3. **Evidencia y documentación** en `evidence/TA-003/` (`checklist.md`,
   `README.md`, `diagnostico.md`, 7 capturas, reporte y traces).

No se modificó el backend, el CI ni la API de producción.

## Validación

```text
npx playwright test tests/kanban.spec.ts --workers=1   -> 7 passed
npx playwright test --workers=1 (CI/mock completo)     -> 14 passed, 4 skipped, 0 failed
npx playwright test tests/auth.spec.ts --workers=1     -> 5 passed (TA-001 intacta)
```

Reporte: `evidence/TA-003/playwright-report/index.html` · Traces: `evidence/TA-003/traces/`.

## Limitaciones

- **Validación en modo mock/controlado:** TA-003 se validó con `MOCK_MODE=true`
  (frontend local, sin backend) para que corra en CI sin escribir datos reales. No
  se ejecutó un E2E contra el backend real para tareas; los endpoints reales
  existen y aplican las mismas reglas (`assertAccess`, `PATCH status`), pero su
  persistencia real no se cubrió aquí para no generar datos persistentes en Neon
  (la API no expone borrado de tareas).
- **Estado sembrado:** las pruebas siembran claves internas de `MOCK_MODE`
  (prefijo `foresite:v1:`). Es un estado controlado y documentado; si cambian las
  claves/estructura del mock, la suite debe actualizarse.
- **Indicador "Vencida":** no cubierto (solo se calcula para tareas del backend;
  el mock no lo calcula).
- **Fuera de alcance reconstruido:** eliminar tareas, filtros, búsqueda, subtareas
  y etiquetas.
- **CI:** el workflow no ejecuta `tests-prod/`; TA-003 corre en el entorno mock.
