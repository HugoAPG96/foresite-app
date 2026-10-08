# TA-001 — Diagnóstico

## 1. Estado inicial

Las pruebas E2E de autenticación (`e2e/tests/auth.spec.ts`) usaban
`localStorage.clear()` en dos momentos:

- en el `beforeEach` de la suite, y
- **a mitad de dos pruebas** (registro con correo existente e inicio de sesión
  con credenciales correctas), para simular el cierre de sesión antes de volver
  a registrar/iniciar sesión.

Además, el `beforeEach` intentaba limpiar claves de sesión con nombres
inexistentes (`auth:token`, `auth:currentUser`), sin el prefijo real.

No existía evidencia formal de TA-001 (capturas, reporte, checklist ni
diagnóstico) ni una matriz oficial de criterios en el repositorio.

## 2. Problemas encontrados

1. `localStorage.clear()` destruía **todos** los datos de `localStorage`,
   incluido `auth:mockUsers`.
2. El `beforeEach` limpiaba claves equivocadas (sin el prefijo `foresite:v1:`),
   por lo que no limpiaba realmente la sesión.
3. Ausencia de evidencia visual/reporte/checklist por criterio.
4. No había una fuente oficial de criterios de aceptación de TA-001 en el repo.

## 3. Causa raíz

En `MOCK_MODE=true`, `AuthStore` guarda los usuarios registrados en
`localStorage` bajo la clave **`auth:mockUsers`** (`getMockUsers`/`saveMockUsers`,
sin prefijo). El token y el usuario actual se guardan con `persistedSignal`, que
aplica el prefijo **`foresite:v1:`** (`foresite:v1:auth:token`,
`foresite:v1:auth:currentUser`).

`localStorage.clear()` borraba **todo**, incluyendo `auth:mockUsers`. Por eso:

- *Registro con correo existente*: tras el `clear()` el segundo registro del
  mismo correo ya no encontraba el usuario mock y **no** mostraba el error
  esperado.
- *Inicio de sesión con credenciales correctas*: tras el `clear()` el login ya no
  encontraba el usuario mock y no redirigía.

Es decir, la prueba destruía el estado que ella misma necesitaba después.

## 4. Solución aplicada (en `e2e/tests/auth.spec.ts`)

- Se definió `SESSION_KEYS = ['foresite:v1:auth:token', 'foresite:v1:auth:currentUser']`
  (las claves reales, con el prefijo que usa `persistedSignal`).
- Se creó el helper `limpiarSesion(page)` que elimina **solo** esas claves,
  preservando `auth:mockUsers`.
- Se reemplazaron los `localStorage.clear()` (en `beforeEach` y a mitad de las
  dos pruebas) por `limpiarSesion(page)`.

Así cada prueba queda aislada respecto de la sesión (en Playwright ya hay un
contexto de navegador nuevo por prueba) sin destruir los usuarios mock.

Esta solución ya estaba aplicada y funcionando; en esta sesión **no** se volvió a
modificar la lógica funcional. Lo único añadido fue la captura de pantalla por
criterio, condicionada a `CAPTURE_EVIDENCE=1` (no altera ninguna aserción).

`front/src/app/core/config/api.config.ts` se usó con `MOCK_MODE=true` **de forma
temporal** para ejecutar las pruebas y se restauró exactamente a `false`
(sin cambios netos).

## 5. Validación

```text
TA-001: 5/5 pruebas PASS (11.8s)
comando: npx playwright test tests/auth.spec.ts --workers=1
```

Suite mock completa (equivalente a CI, `MOCK_MODE=true`):

```text
npx playwright test --workers=1  ->  7 passed, 4 skipped, 0 failed
```

Verificación en CI (GitHub Actions), run real:

```text
Workflow: E2E Tests
Run:      #10  (push, main, commit 80b598e)
URL:      https://github.com/HugoAPG96/foresite-app/actions/runs/37719411690
Estado:   success
Evidencia: TA-001-C07-github-actions.png
```

Capturas y reporte en `evidence/TA-001/`.

## 6. Criterios cubiertos

| ID | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| C01 | Registro con datos válidos | PASS | `TA-001-C01-registro-exitoso.png` |
| C02 | Registro con correo existente | PASS | `TA-001-C02-correo-existente.png` |
| C03 | Login con credenciales correctas | PASS | `TA-001-C03-login-exitoso.png` |
| C04 | Login con credenciales incorrectas | PASS | `TA-001-C04-login-incorrecto.png` |
| C05 | Edición de nombre de perfil | PASS | `TA-001-C05-perfil-nombre-editado.png` |
| C06 | Suite E2E automatizada | PASS | `playwright-report/` |
| C07 | CI (GitHub Actions) con `MOCK_MODE=true` | PASS | `TA-001-C07-github-actions.png` |
| C08 | Documentación y evidencia | PASS | `README.md`, `checklist.md`, este archivo |

## 7. Criterios no cubiertos

Ninguno. Los 8 criterios derivados quedaron con prueba y evidencia:

- C01–C05: ejecución E2E (5/5) con captura por criterio.
- C06: suite automatizada ejecutable.
- C07: run real de GitHub Actions en `success` (verificable y con captura).
- C08: documentación y evidencia en `evidence/TA-001/`.

## 8. Limitaciones

- La ejecución de TA-001 se hace con **`MOCK_MODE=true`** (frontend local sin
  backend). Por lo tanto **no** valida el backend real (Render/Neon) ni la
  seguridad de la API: valida el comportamiento del frontend y su lógica de
  sesión/almacenamiento en modo simulado.
- Las pruebas usan `@test.com` como dominio de correo de prueba; son datos
  locales del navegador (localStorage), no persistidos en ninguna base de datos.
- `auth.spec.ts` no verifica expiración/renovación de token ni expiración de
  sesión; quedan fuera del alcance de TA-001.
- El CI, en su estado actual, ejecuta solo la suite de `e2e/tests/` (auth + mock
  de TA-002). Las pruebas de TA-002 contra producción (`e2e/tests-prod/`) están
  deliberadamente fuera del config de CI para no escribir datos reales.
