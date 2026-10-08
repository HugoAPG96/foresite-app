# TA-002 — Checklist maestro de criterios de aceptación

## Fuente de los criterios

No existe una **matriz oficial** de criterios de aceptación de TA-002 en el
repositorio. Búsqueda exhaustiva realizada (misma metodología que TA-001):

- `README.md`, `backend/README.md`, `front/README.md`, `AGENTS.md`
- `diagramas/*.puml`, `scripts/*.sql`
- archivos `.md`, `.txt`, `.json`, `.puml` (excluyendo `node_modules`)
- historial completo de git (`git log --all`, `-S "TA-002"`, `-S "criterio"`)
- no existen `docs/`, backlog, EDT, historias de usuario ni export de Notion
- no hay `.docx/.pdf/.xlsx/.csv`

Las únicas referencias a "TA-002" en el repo son los propios archivos de
evidencia. Por lo tanto, los criterios **C01–C06** son los declarados para
TA-002 (EP-002 · HU-004/HU-005) y se corresponden 1:1 con la suite de producción
`e2e/tests-prod/projects.prod.spec.ts`.

> Si aparece una matriz oficial de TA-002, este checklist debe reconciliarse con ella.
> No se inventan criterios adicionales.

## Checklist

| ID | Criterio de aceptación | Validación | Evidencia | Resultado |
| --- | --- | --- | --- | --- |
| C01 | Crear proyecto mediante el wizard y verlo en el listado | `projects.prod.spec.ts` › C01 (UI real) | `TA-002-C01-creacion-proyecto.png` | PASS |
| C02 | La lista muestra únicamente proyectos a los que el usuario tiene acceso (propios o como miembro) | `projects.prod.spec.ts` › C02 (UI + `GET /projects` de B no incluye el id) | `TA-002-C02-listado-proyectos.png` | PASS |
| C03 | Agregar miembro mediante correo registrado y verlo en la lista | `projects.prod.spec.ts` › C03 (UI real) | `TA-002-C03-miembro-registrado.png` | PASS |
| C04 | Intentar agregar correo no registrado: muestra error y el flujo no se rompe | `projects.prod.spec.ts` › C04 (mensaje real del backend) | `TA-002-C04-correo-no-registrado.png` | PASS |
| C05 | Segundo usuario sin acceso no puede ver/gestionar el proyecto | `projects.prod.spec.ts` › C05 (redirect UI + `GET /projects/:id` → 404) | `TA-002-C05-usuario-sin-acceso.png` | PASS |
| C06 | Tras ser agregado, el segundo usuario obtiene acceso | `projects.prod.spec.ts` › C06 (UI real) | `TA-002-C06-acceso-miembro.png` | PASS |

## CI/CD (criterio transversal, no propio de TA-002)

CI/CD es un requisito transversal del proyecto (EN-002 / `.github/workflows/e2e.yml`),
no un criterio específico de TA-002. Se documenta sin duplicar una exigencia inexistente.

| ID | Criterio transversal | Validación | Evidencia | Resultado |
| --- | --- | --- | --- | --- |
| CI | GitHub Actions ejecuta el entorno mock/controlado, no `tests-prod/`, y no escribe en Neon | workflow `E2E Tests` + run remoto | `TA-002-ci-github-actions.png` | PENDIENTE |

## Resumen

```text
Criterios TA-002 evaluados: 6
PASS: 6
NO CUBIERTO: 0
BLOQUEADO: 0

CI/CD (transversal): PENDIENTE (verificación remota tras el push)
```

## Nota sobre datos generados

La suite de producción crea datos **persistentes** en Neon (usuarios y proyectos
de prueba con dominio reservado `@foresite-e2e.test` y prefijo `E2E-TA002`).
La API no expone endpoints de borrado de usuarios/proyectos, por lo que **no se
eliminan** (no se ejecuta ninguna operación destructiva). Los identificadores de
cada ejecución quedan documentados en `README.md`.
