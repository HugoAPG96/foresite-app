# TA-003 — Checklist maestro de criterios de aceptación (Kanban)

## Fuente de los criterios

No existe una **matriz oficial** de criterios de aceptación de TA-003 en el
repositorio. Búsqueda exhaustiva realizada (misma metodología que TA-001/TA-002):

- `README.md`, `backend/README.md`, `front/README.md`, `AGENTS.md`
- `diagramas/*.puml` (`C4_Arquitectura.puml` menciona "tareas (Kanban/Cronograma)")
- archivos `.md`, `.txt`, `.json`, `.puml` (excluyendo `node_modules`)
- historial completo de git (`git log --all`, `-S "TA-003"`, `-S "kanban"`)
- no existen `docs/`, backlog, EDT, historias de usuario ni export de Notion

El alcance de TA-003 se reconstruyó a partir de:

- `backend/README.md`: "`tasks/` — cronograma RACI (vistas Kanban y Cronograma)".
- `diagramas/C4_Arquitectura.puml`: el SPA incluye "tareas (Kanban/Cronograma)".
- commit `beace91 — "Conecta Tareas, Miembros y Perfil del front al backend real"`.
- commit `1cc488e — "Agrega miembros de proyecto y conecta el Kanban de tareas al backend real"`.
- implementación real: `front/src/app/features/tareas/**` + `backend/src/modules/tasks/**`.

> Si aparece una matriz oficial de TA-003, este checklist debe reconciliarse con
> ella. No se inventan criterios fuera del alcance implementado.

## Checklist

| ID | Criterio | Fuente | Implementación | Prueba | Evidencia | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | El tablero muestra las columnas Pendiente / En progreso / Completada | `tareas.html` / README tasks | `Tareas` + `tareas.html` | `kanban.spec.ts` › C01 | `TA-003-C01-tablero-columnas.png` | PASS |
| C02 | Crear una tarea la coloca en Pendiente | commit `beace91` / `tarea-dialog` | `TareaDialog` + `TareasStore.crear` | `kanban.spec.ts` › C02 | `TA-003-C02-crear-tarea.png` | PASS |
| C03 | La tarjeta muestra título, responsable y prioridad | `tareas.html` / `tarea.model` | `task-card` + `mapTareaFromApi` | `kanban.spec.ts` › C03 | `TA-003-C03-tarjeta-datos.png` | PASS |
| C04 | Editar una tarea actualiza la tarjeta | commit `beace91` / `tarea-dialog` | `TareasStore.actualizar` (PATCH) | `kanban.spec.ts` › C04 | `TA-003-C04-editar-tarea.png` | PASS |
| C05 | Mover una tarjeta cambia su columna (drag & drop) | `tareas.ts` (cdkDropList) | `TareasStore.mover` (PATCH status) | `kanban.spec.ts` › C05 | `TA-003-C05-mover-tarjeta.png` | PASS |
| C06 | Alternar entre vista Kanban y Cronograma | README tasks / `tareas.html` | `vista` toggle (`mat-button-toggle`) | `kanban.spec.ts` › C06 | `TA-003-C06-vista-cronograma.png` | PASS |
| C07 | Persistencia: la tarea y su columna se mantienen tras recargar | commit `beace91` | `persistedSignal` (mock) / `GET /tasks` (real) | `kanban.spec.ts` › C07 | `TA-003-C07-persistencia.png` | PASS |

## CI/CD (criterio transversal, no propio de TA-003)

CI/CD es transversal (EN-002 / `.github/workflows/e2e.yml`), no un criterio
específico de TA-003.

| ID | Criterio transversal | Validación | Evidencia | Resultado |
| --- | --- | --- | --- | --- |
| CI | GitHub Actions ejecuta TA-001 + TA-002 mock + TA-003 (mock), no `tests-prod/`, y no escribe en Neon | workflow `E2E Tests` + run remoto | `TA-003-CI-github-actions.png` + run URL | PENDIENTE |

## Resumen

```text
Criterios TA-003 evaluados: 7
PASS: 7
NO CUBIERTO: 0
BLOQUEADO: 0

CI/CD (transversal): PENDIENTE (verificación remota tras el push)
```

## Alcance no incluido (no forma parte de los criterios reconstruidos)

- Eliminación de tareas (el backend no expone `DELETE /tasks`).
- Filtros, búsqueda, WIP limits, subtareas, etiquetas.
- Indicador de "tarea vencida": existe en la UI para tareas del backend
  (`mapTareaFromApi` calcula `vencida`), pero `MOCK_MODE` no lo calcula; no se
  incluyó como criterio.
