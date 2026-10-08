# TA-001 — Autenticación y perfil

## Resultado

```text
Criterios evaluados: 8
PASS: 7
NO CUBIERTO: 0
PENDIENTE (verificación remota de C07): 1
BLOQUEADO: 0
```

Estado: **TA-001 cerrada funcionalmente; C07 (GitHub Actions) pendiente de la
verificación remota del workflow** (ver sección CI).

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
| C07 | CI (GitHub Actions) con `MOCK_MODE=true` | PENDIENTE | workflow `E2E Tests` (`push`/`PR` a `main`) | run remoto |
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

Verificación remota: **pendiente** (se completa tras el push; ver estado en el
run de GitHub Actions y en el archivo de evidencia correspondiente).

## Conclusión

TA-001 queda validada funcionalmente (5/5) y documentada con checklist,
diagnóstico, capturas y reporte HTML. No se modificó la lógica funcional de las
pruebas: solo se añadió la captura de pantalla por criterio, condicionada a
`CAPTURE_EVIDENCE`.
