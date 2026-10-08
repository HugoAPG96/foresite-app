# Evidencias — TA-002 (E2E contra el sistema REAL desplegado)

EP-002 · HU-004 (gestión de proyectos) · HU-005 (gestión de miembros)

**Entorno probado:** Vercel (front) → `https://foresite-app.vercel.app`
**API real:** Render → `https://foresite-app.onrender.com`
**Base de datos:** Neon (PostgreSQL)
**Última ejecución:** 2026-10-07 21:51 (local) / 2026-10-08 02:51 UTC
**Ejecutor:** Playwright (`chromium`), `workers=1`, escenario serial.

> El bundle desplegado fue verificado: usa `https://foresite-app.onrender.com` y
> tiene `MOCK_MODE` compilado en `false` (sistema real, no mock).

## Resultado

```text
Criterios evaluados: 6
PASS: 6
NO CUBIERTO: 0
BLOQUEADO: 0
```

Estado: **TA-002 CONCLUIDA**.

Matriz completa y detalle por criterio: `checklist.md`.

## Matriz de criterios

| Criterio | Descripción | Resultado | Evidencia |
| --- | --- | --- | --- |
| C01 | Crear proyecto (wizard) y verlo en el listado | PASS | `TA-002-C01-creacion-proyecto.png` |
| C02 | La lista muestra solo proyectos con acceso (propios o miembro) | PASS | `TA-002-C02-listado-proyectos.png` |
| C03 | Agregar miembro registrado y verlo en la lista | PASS | `TA-002-C03-miembro-registrado.png` |
| C04 | Correo no registrado muestra error y no se agrega | PASS | `TA-002-C04-correo-no-registrado.png` |
| C05 | Usuario sin acceso no puede ver/gestionar el proyecto | PASS | `TA-002-C05-usuario-sin-acceso.png` |
| C06 | Usuario agregado obtiene acceso | PASS | `TA-002-C06-acceso-miembro.png` |

## Ejecución

```bash
cd e2e
npx playwright test tests-prod/projects.prod.spec.ts --config playwright.prod.config.ts
```

```text
6 passed (1.1m)
```

Reporte HTML: `evidence/TA-002/playwright-report/index.html`
Traces: `evidence/TA-002/traces/`

## Usuarios y datos de prueba creados (SIN contraseñas)

Última ejecución (timestamp `1791427892195`):

| Tipo | Identificador |
| --- | --- |
| Usuario A (propietario) | `e2e.ta002.owner.1791427892195@foresite-e2e.test` |
| Usuario B (miembro) | `e2e.ta002.member.1791427892195@foresite-e2e.test` |
| Correo no registrado (solo intento, no crea usuario) | `e2e.ta002.unregistered.1791427892195@foresite-e2e.test` |
| Proyecto compartido | `E2E-TA002 shared 1791427892195` |
| Proyecto creado por el wizard | `E2E-TA002 wizard 1791427892195` |

Ejecución anterior (timestamp `1791426605046`) — datos que **también persisten**:

- `e2e.ta002.owner.1791426605046@foresite-e2e.test`
- `e2e.ta002.member.1791426605046@foresite-e2e.test`
- `E2E-TA002 shared 1791426605046`
- `E2E-TA002 wizard 1791426605046`

> La API **no** expone borrado de usuarios/proyectos, por eso los datos de prueba
> quedan registrados de forma permanente. No se ejecuta ninguna operación
> destructiva ni SQL directo sobre Neon.

## CI/CD (transversal)

El workflow `.github/workflows/e2e.yml` (`E2E Tests`) ejecuta la suite de
`e2e/tests/` (mock/controlado: TA-001 + mock de TA-002) con `MOCK_MODE=true`.

- **No** ejecuta `e2e/tests-prod/` (testDir del config de CI es `./tests`), por lo
  que **no** escribe datos reales en Neon desde CI.
- Verificación local equivalente (`MOCK_MODE=true`):

```text
npx playwright test              -> 7 passed, 4 skipped, 0 failed
npx playwright test tests/auth.spec.ts -> 5 passed
```

- Verificación remota (GitHub Actions): **pendiente** (se cierra tras el push;
  ver `TA-002-ci-github-actions.png` y el run en `checklist.md`).

## Conclusión

**TA-002 concluida funcionalmente** (6/6 criterios con prueba real contra el
sistema desplegado y evidencia visual). El cierre formal queda pendiente de la
verificación del workflow de GitHub Actions (criterio transversal CI).
