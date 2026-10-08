# TA-002 — Diagnóstico (E2E contra el sistema desplegado REAL)

EP-002 · HU-004 (gestión de proyectos) · HU-005 (gestión de miembros)

---

## 1. Estado inicial

- `e2e/tests/projects.spec.ts` (TA-002 original) estaba escrito contra una UI
  antigua (modal + botón "Guardar") y **fallaba**: buscaba un botón
  `Guardar/Crear/Aceptar` inexistente y un botón modal "agregar miembro" que
  tampoco existe.
- El flujo real de alta es un wizard: `Nuevo proyecto → Acta → RACI → Backlog →
  Finalizar`. La gestión de miembros es `/proyectos/:id/miembros` con formulario
  inline.
- `MOCK_MODE` no modela permisos ni validación de correo, por lo que el mock no
  puede demostrar C02, C04, C05 ni C06.

## 2. Limitaciones detectadas en el mock

`front/src/app/features/**` en `MOCK_MODE=true`:

- `ProyectosStore.load()` devuelve una lista **global** (`_proyectosMock`) más 3
  proyectos semilla, para cualquier usuario → **no hay aislamiento por usuario**
  (bloquea C02/C05/C06).
- `MiembrosStore.agregar()` **siempre** devuelve éxito y agrega el miembro, sin
  validar que el correo exista → **no hay validación** (bloquea C04).
- No existe modelo de permisos; el `authGuard` solo verifica sesión, no
  pertenencia al proyecto.

El backend real **sí** implementa esas reglas: `findAllByUser`, `assertAccess`
(404 si no es dueño ni miembro), `assertOwner` (403), `addByEmail` (404 si el
correo no está registrado).

## 3. Por qué se validó contra producción

C02/C04/C05/C06 exigen reglas de negocio reales (aislamiento, validación,
permisos). El mock no puede representarlas y **no se fabricaron assertions**. Se
optó por validar contra el sistema desplegado real (Vercel→Render→Neon), que ya
está funcional, usando una configuración E2E separada
(`e2e/playwright.prod.config.ts`, sin `webServer`) y una suite separada
(`e2e/tests-prod/projects.prod.spec.ts`). El spec de mock (`e2e/tests/`) se
conservó para CI.

## 4. Cómo se validaron las reglas reales de acceso

Escenario controlado serial con dos usuarios de prueba (uno propietario, uno
miembro). Cada criterio se comprueba con **observación real**:

| Criterio | Validación |
| --- | --- |
| C01 | Alta por el wizard en la UI y verificación de aparición en el listado |
| C02 | UI de B sin el proyecto **+** `GET /projects` de B no incluye el id |
| C03 | A agrega el correo de B por la UI; B aparece en la lista de miembros |
| C04 | A agrega un correo inexistente; aparece el mensaje real del backend y el correo no queda en la lista; el formulario sigue usable |
| C05 | B navega a `/proyectos/:id` → la app redirige a `/proyectos`; `GET /projects/:id` de B → **404** |
| C06 | Tras ser agregado, el proyecto aparece para B y entra a `/proyectos/:id/tareas` |

## 5. Causa / solución de los problemas encontrados

- **Causa raíz del fallo original:** el spec apuntaba a una UI inexistente.
  **Solución:** reescribir los escenarios contra el wizard y el formulario de
  miembros reales.
- **Causa raíz de la cobertura incompleta en mock:** `MOCK_MODE` no modela
  permisos/validación. **Solución:** mover C02/C04/C05/C06 a la suite de
  producción. No se modificó el mock ni el backend.
- **Ningún cambio de producción/backend/CI fue necesario.**

## 6. Resultado final

```text
Playwright producción: 6/6 PASS (1.1m)
CI/mock (equivalente): 7 passed, 4 skipped, 0 failed
TA-001: 5/5 PASS (no se rompe)
```

Reporte: `evidence/TA-002/playwright-report/index.html` · Traces: `evidence/TA-002/traces/`.

## 7. Limitaciones conocidas

- **Datos persistentes en Neon:** la suite crea usuarios/proyectos de prueba
  (dominio reservado `@foresite-e2e.test`, prefijo `E2E-TA002`). La API no tiene
  endpoint de borrado, por lo que **no se eliminan**. No se ejecutan operaciones
  destructivas ni SQL directo. Identificadores documentados en `README.md`.
- **CI:** los tests de producción **no** deben correr en GitHub Actions (crearían
  datos reales en cada ejecución). El workflow ejecuta solo el entorno mock
  (`e2e/tests/`) y no toca Neon. Si se quisiera automatizar, se requiere un
  entorno/BD de pruebas dedicado (fuera de alcance).
- **Serialidad:** C01–C06 comparten dos usuarios y un proyecto de escenario;
  orden explícito `C01 → C02/C05 → C03/C04 → C06`. No están pensados para
  ejecutarse aislados individualmente (flujo controlado permitido y documentado).
- **Registro por API en la preparación:** los usuarios de prueba se registran vía
  la API real (mismo endpoint que usa la app) para hacer la preparación
  determinista; el registro por UI está cubierto por TA-001 y C01 crea el
  proyecto por la UI.
