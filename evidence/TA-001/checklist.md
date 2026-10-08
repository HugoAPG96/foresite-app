# TA-001 — Checklist maestro de criterios de aceptación

## Fuente de los criterios

No se encontró una **matriz oficial** de criterios de aceptación de TA-001 en el
repositorio. Búsqueda exhaustiva realizada sobre:

- `README.md`, `backend/README.md`, `front/README.md`, `AGENTS.md`
- `diagramas/*.puml`, `scripts/*.sql`
- archivos `.md`, `.txt`, `.json`, `.puml` (excluyendo `node_modules`)
- historial completo de git (`git log --all`, `-S "TA-001"`, `-S "criterio"`)
- no existen `docs/`, backlog, EDT, historias de usuario ni export de Notion
- no hay `.docx/.pdf/.xlsx/.csv`

El único artefacto que define el alcance de TA-001 es el commit
`e5c0a61 — "TA-001: pruebas E2E de autenticación con Playwright + CI"` y su
suite `e2e/tests/auth.spec.ts`.

Por eso, los criterios se derivan así:

- **C01–C05**: 1:1 con los escenarios E2E implementados (comportamiento real probado).
- **C06–C08**: alcance declarado del commit de TA-001 (Playwright + CI) más
  documentación/evidencia (referidos explícitamente en el enunciado de la tarea).

> No se inventan criterios adicionales. Si aparece una matriz oficial de TA-001,
> este checklist debe reconciliarse con ella.

## Checklist

| ID | Criterio de aceptación | Qué exige | Cómo se valida | Evidencia | Resultado |
| --- | --- | --- | --- | --- | --- |
| C01 | Registro con datos válidos | Crear cuenta y acceder al sistema | `auth.spec.ts` › "Registro con datos válidos…" | `TA-001-C01-registro-exitoso.png` | PASS |
| C02 | Registro con correo existente | Mostrar error y no crear la cuenta | `auth.spec.ts` › "Registro con correo existente…" | `TA-001-C02-correo-existente.png` | PASS |
| C03 | Inicio de sesión con credenciales correctas | Redirigir a la pantalla principal | `auth.spec.ts` › "Inicio de sesión con credenciales correctas…" | `TA-001-C03-login-exitoso.png` | PASS |
| C04 | Inicio de sesión con credenciales incorrectas | Mostrar error | `auth.spec.ts` › "Inicio de sesión con credenciales incorrectas…" | `TA-001-C04-login-incorrecto.png` | PASS |
| C05 | Edición de nombre de perfil | Guardar el cambio y reflejarlo tras recargar | `auth.spec.ts` › "Edición de nombre…" | `TA-001-C05-perfil-nombre-editado.png` | PASS |
| C06 | Suite E2E automatizada ejecutable | Correr TA-001 de forma automatizada | `npx playwright test tests/auth.spec.ts` → 5 passed | `playwright-report/` | PASS |
| C07 | Ejecución en CI (GitHub Actions) | CI ejecuta TA-001 con `MOCK_MODE=true`, sin tocar backend/Neon | Workflow `E2E Tests` run #10 (push `80b598e`) → SUCCESS | `TA-001-C07-github-actions.png` + run URL | PASS |
| C08 | Documentación y evidencia trazable | README + diagnóstico + capturas + reporte | `README.md`, `diagnostico.md` | `evidence/TA-001/` | PASS |

## Clasificación (definiciones)

- **PASS**: existe prueba/evidencia real que demuestra cumplimiento.
- **NO CUBIERTO**: no existe evidencia suficiente.
- **BLOQUEADO**: no puede validarse por limitación técnica/de infraestructura.

## Resumen

```text
Total criterios: 8
PASS: 8
NO CUBIERTO: 0
PENDIENTE: 0
BLOQUEADO: 0
```

Todos los criterios tienen prueba y evidencia. El run de GitHub Actions que
cierra C07 es:
`https://github.com/HugoAPG96/foresite-app/actions/runs/37719411690`
(workflow `E2E Tests`, commit `80b598e`, conclusión `success`).
