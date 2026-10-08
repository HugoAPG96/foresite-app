# TA-001 — Autenticación y perfil

## Resultado

```text
Criterios evaluados: 8
PASS: 8
NO CUBIERTO: 0
PENDIENTE: 0
BLOQUEADO: 0
```

Estado: **TA-001 CONCLUIDA** (todos los criterios con prueba y evidencia).

> Matriz completa y detalle por criterio: `checklist.md`.

## Alcance

TA-001 valida el flujo de autenticación y perfil del frontend:

- registro de una cuenta nueva y acceso al sistema;
- rechazo de registro con correo ya existente;
- inicio de sesión con credenciales correctas;
- inicio de sesión con credenciales incorrectas;
- edición del nombre de perfil y su persistencia tras recargar;
- ejecución automatizada (Playwright) y en CI (GitHub Actions).

## Matriz de evidencias

| ID | Criterio | Resultado | Test / validación | Evidencia |
| --- | --- | --- | --- | --- |
| C01 | Registro con datos válidos | PASS | `auth.spec.ts` › "Registro con datos válidos…" | `TA-001-C01-registro-exitoso.png` |
| C02 | Registro con correo existente | PASS | `auth.spec.ts` › "Registro con correo existente…" | `TA-001-C02-correo-existente.png` |
| C03 | Login con credenciales correctas | PASS | `auth.spec.ts` › "Inicio de sesión con credenciales correctas…" | `TA-001-C03-login-exitoso.png` |
| C04 | Login con credenciales incorrectas | PASS | `auth.spec.ts` › "Inicio de sesión con credenciales incorrectas…" | `TA-001-C04-login-incorrecto.png` |
| C05 | Edición de nombre de perfil | PASS | `auth.spec.ts` › "Edición de nombre…" | `TA-001-C05-perfil-nombre-editado.png` |
| C06 | Suite E2E automatizada | PASS | `npx playwright test tests/auth.spec.ts` → 5 passed | `playwright-report/` |
| C07 | CI (GitHub Actions) con `MOCK_MODE=true` | PASS | workflow `E2E Tests`, run #10 (push `80b598e`) → `success` | `TA-001-C07-github-actions.png` |
| C08 | Documentación y evidencia | PASS | `README.md` + `diagnostico.md` + capturas + reporte | `evidence/TA-001/` |

## Ejecución

```bash
cd e2e
npx playwright test tests/auth.spec.ts --workers=1
```

```text
Playwright
Resultado: 5 passed (11.8s)
```

Para regenerar las capturas:

```powershell
$env:CAPTURE_EVIDENCE="1"
npx playwright test tests/auth.spec.ts --workers=1 --trace=on
```

Las capturas solo se generan cuando `CAPTURE_EVIDENCE=1`; en CI no se escribe nada.

## Reporte

```text
evidence/TA-001/playwright-report/index.html
evidence/TA-001/traces/   (5 traces)
```

## CI (criterio C07)

Workflow: `.github/workflows/e2e.yml` (`E2E Tests`, push/PR a `main`).

- Fuerza `MOCK_MODE=true` con `sed` (no usa backend ni Neon).
- Ejecuta `npx playwright test` sobre `e2e/` (testDir `./tests`).
- **No** ejecuta `tests-prod/` (las pruebas contra producción de TA-002 viven en
  `e2e/tests-prod/`, fuera del config por defecto de CI).
- Sube el artefacto `playwright-report`.

Verificación local equivalente (misma config y `MOCK_MODE=true`):

```text
npx playwright test --workers=1  ->  7 passed, 4 skipped, 0 failed
```

Verificación remota (run real):

```text
Workflow: E2E Tests
Run:      #10  (event=push, branch=main, commit=80b598e)
URL:      https://github.com/HugoAPG96/foresite-app/actions/runs/37719411690
Estado:   success (57s; job `e2e` 53s, todos los pasos OK)
Evidencia: TA-001-C07-github-actions.png
```

## Conclusión

**TA-001 CONCLUIDA**: 8/8 criterios evaluados con prueba y evidencia
(7 funcionales/documentación + CI en GitHub Actions en `SUCCESS`). No se modificó
la lógica funcional de las pruebas: solo se añadió la captura de pantalla por
criterio, condicionada a `CAPTURE_EVIDENCE`.
