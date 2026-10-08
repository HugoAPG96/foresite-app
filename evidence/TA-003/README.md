# TA-003 — Kanban

## Resultado

```text
Criterios evaluados: 7
PASS: 7
NO CUBIERTO: 0
BLOQUEADO: 0
```

Estado: **TA-003 concluida funcionalmente** (7/7 criterios con prueba y evidencia).
El cierre formal queda pendiente de la verificación del workflow de GitHub Actions
(criterio transversal CI).

> No existe una matriz oficial de criterios de TA-003 en el repositorio; los
> criterios se reconstruyeron del alcance implementado y se documentan en
> `checklist.md` (con su fuente).

## Matriz

| Criterio | Resultado | Prueba | Evidencia |
| --- | --- | --- | --- |
| C01 Tablero con columnas Pendiente / En progreso / Completada | PASS | `kanban.spec.ts › C01` | `TA-003-C01-tablero-columnas.png` |
| C02 Crear tarea → columna Pendiente | PASS | `kanban.spec.ts › C02` | `TA-003-C02-crear-tarea.png` |
| C03 Tarjeta muestra título, responsable y prioridad | PASS | `kanban.spec.ts › C03` | `TA-003-C03-tarjeta-datos.png` |
| C04 Editar tarea actualiza la tarjeta | PASS | `kanban.spec.ts › C04` | `TA-003-C04-editar-tarea.png` |
| C05 Mover tarjeta cambia de columna (drag & drop) | PASS | `kanban.spec.ts › C05` | `TA-003-C05-mover-tarjeta.png` |
| C06 Alternar vista Kanban / Cronograma | PASS | `kanban.spec.ts › C06` | `TA-003-C06-vista-cronograma.png` |
| C07 Persistencia tras recargar | PASS | `kanban.spec.ts › C07` | `TA-003-C07-persistencia.png` |

## Pruebas

```text
cd e2e
npx playwright test tests/kanban.spec.ts --workers=1     -> 7 passed
npx playwright test --workers=1 (CI/mock completo)       -> 14 passed, 4 skipped, 0 failed
npx playwright test tests/auth.spec.ts --workers=1       -> 5 passed (TA-001 intacta)
```

Las capturas se regeneran con `CAPTURE_EVIDENCE=1`.
Reporte HTML: `evidence/TA-003/playwright-report/index.html` · Traces: `evidence/TA-003/traces/`.

## CI/CD

El workflow `.github/workflows/e2e.yml` ejecuta `npx playwright test` con la
configuración por defecto (`testDir: ./tests`) y `MOCK_MODE=true`. Ahora incluye
`kanban.spec.ts` (TA-003), además de TA-001 y el mock de TA-002.

- **No** ejecuta `e2e/tests-prod/` → no escribe datos reales en Neon.
- Verificación remota: **pendiente** (se cierra tras el push; ver
  `TA-003-CI-github-actions.png` y el run en `checklist.md`).

## Conclusión

**TA-003 concluida funcionalmente**: 7/7 criterios con prueba E2E y evidencia
visual; regresión de TA-001/TA-002 verificada. Cierre formal pendiente del run de
GitHub Actions (CI transversal).
