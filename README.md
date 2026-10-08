# Foresite

**Plataforma ligera de gestión de proyectos académicos con visión predictiva.**
Los estudiantes no solo registran tareas: Foresite calcula el avance, detecta riesgos, predice retrasos y genera reportes automáticos para exposiciones y entregables.

> Proyecto del curso **Administración de Proyectos de Software** (UPN).

---

## Contenido

- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Variables de entorno](#variables-de-entorno)
- [Datos de demostración](#datos-de-demostración)
- [Reglas de negocio e indicadores](#reglas-de-negocio-e-indicadores)
- [Seguridad y permisos](#seguridad-y-permisos)
- [API](#api)
- [Despliegue](#despliegue)
- [Equipo](#equipo)

---

## Funcionalidades

| Módulo | Qué ofrece |
|---|---|
| **Asistente "Nuevo proyecto"** | 4 pasos: Acta de constitución → Cronograma RACI → Product Backlog → Confirmación. Todo se arma como borrador y se crea al final. |
| **Dashboard** | Semáforo (verde / ámbar / rojo), % de avance, **Health Score**, predicción de retraso y recomendaciones. |
| **Tareas** | Cronograma RACI tabular (Responsable, A cargo, Consultado, Informado) agrupado por fase, y tablero **Kanban**. |
| **Backlog** | 8 tipos de ítem (EP, HU, SP, EN, TA, RN, DO, BU), estimación en Fibonacci, capacidad de 21 pts por sprint, varios responsables por ítem. |
| **Reportes** | Ejecutivo, Desviación y Desempeño, generados automáticamente a partir de los datos del proyecto. |
| **Equipo** | El Scrum Master agrega integrantes por correo; solo quienes pertenecen al proyecto pueden verlo. |
| **Perfil** | Cada usuario puede ver y editar el nombre de su perfil. |

> La matriz de riesgos queda **fuera del alcance del frontend** del MVP. El backend sí expone los riesgos y el Health Score los usa.

### Tipos de ítem del backlog

| Código | Tipo | Código | Tipo |
|---|---|---|---|
| EP | Épica | RN | Regla de negocio |
| HU | Historia de usuario | DO | Documentación |
| SP | Spike | BU | Bug |
| EN | Enabler | TA | Tarea |

Los códigos se autonumeran por proyecto y tipo (`HU-001`, `HU-002`…). Las tareas del cronograma se numeran por fase (`1.1`, `1.2`, `2.1`…).

---

## Arquitectura

```mermaid
flowchart LR
    U[Usuario] -->|HTTPS| FE[Angular SPA<br/>Vercel]
    FE -->|HTTPS · JSON + JWT| API[NestJS API<br/>Render]
    API -->|TypeORM| DB[(PostgreSQL<br/>Render)]
    GH[GitHub + Actions] -.->|deploy en push a main| FE
    GH -.->|deploy en push a main| API
```

- **Frontend** (`foresite-web`): SPA en Angular que calcula las métricas del dashboard en el cliente a partir de los datos que entrega la API.
- **Backend** (`foresite-api`): API REST modular por dominio (auth, users, projects, planning, tasks, backlog, risks), documentada con OpenAPI/Swagger.
- **Base de datos**: PostgreSQL desplegada en Render junto con la API.

---

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | Angular 20 (componentes *standalone* + signals), Angular Material y CDK (drag & drop, datepicker), RxJS |
| Backend | NestJS 10, TypeORM, Passport JWT, bcrypt, class-validator, Swagger/OpenAPI |
| Base de datos | PostgreSQL |
| Infraestructura | Vercel (frontend), Render (API + base de datos), GitHub + GitHub Actions (CI/CD) |

---

## Estructura del repositorio

```
foresite/
├── foresite-api/                 # Backend NestJS
│   └── src/
│       ├── common/               # BaseEntity, guards (ProjectAccessGuard), tipos
│       └── modules/
│           ├── auth/             # registro, login, JWT
│           ├── users/            # usuarios y perfil (/users/me)
│           ├── projects/         # proyectos e integrantes
│           ├── planning/         # fases y sprints
│           ├── tasks/            # cronograma RACI
│           ├── backlog/          # product backlog
│           └── risks/            # riesgos
└── foresite-web/                 # Frontend Angular
    └── src/app/
        ├── core/                 # modelos, API clients, store, métricas, reportes, auth
        ├── layout/               # shell (header + menú lateral)
        ├── shared/               # componentes reutilizables
        └── features/             # auth, projects, dashboard, tasks, backlog, reports, profile
```

> Si manejas cada parte en un repositorio propio, copia este README en ambos y conserva solo las secciones que apliquen.

---

## Puesta en marcha local

### Requisitos

- Node.js 20.19+ (o 22.12+) y npm
- PostgreSQL (probado con la versión 16)

### 1. Base de datos

Crea la base y carga el esquema (y, si quieres, los datos de demostración):

```bash
createdb foresite
psql -d foresite -f Foresite_DDL_PostgreSQL.sql
psql -d foresite -f Foresite_Datos_Demo.sql      # opcional
```

Para usar un esquema distinto de `public`, agrega a la URL de conexión
`?options=-c%20search_path%3Dmi_esquema` (o `&options=…` si ya hay parámetros) y ejecuta los scripts con `SET search_path TO mi_esquema;`.

### 2. Backend

```bash
cd foresite-api
cp .env.example .env        # completa DATABASE_URL y JWT_SECRET
npm install
npm run start:dev           # http://localhost:3000
```

La documentación interactiva de la API queda en **http://localhost:3000/docs**.

### 3. Frontend

```bash
cd foresite-web
npm install
npm start                   # http://localhost:4200
```

En desarrollo, el frontend usa `src/environments/environment.development.ts` (API en `http://localhost:3000`).

---

## Variables de entorno

### Backend (`foresite-api/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://user:pass@host/foresite` |
| `DB_SSL` | `true` solo con la URL **externa** de Render; `false` con la interna o en local | `false` |
| `DB_SYNCHRONIZE` | Crea/ajusta tablas automáticamente. Usar solo en desarrollo | `false` |
| `JWT_SECRET` | Secreto para firmar los tokens (largo y aleatorio) | — |
| `JWT_EXPIRES_IN` | Vigencia del token | `8h` |
| `CORS_ORIGIN` | URL(s) del frontend permitidas, separadas por coma | `https://foresite.vercel.app` |

### Frontend

| Variable | Cuándo | Descripción |
|---|---|---|
| `API_URL` | Al construir (`npm run build`) | URL pública de la API. `scripts/set-env.js` la escribe en `environment.ts`. |

```bash
API_URL=https://mi-api.onrender.com npm run build
```

> **Nunca subas el archivo `.env` ni credenciales al repositorio.**

---

## Datos de demostración

`Foresite_Datos_Demo.sql` carga dos proyectos completos (**Foresite** y **ReparaYa**) con integrantes, fases, sprints, tareas RACI, ítems de backlog y riesgos, listos para una demo. Los usuarios de ejemplo comparten la contraseña `Foresite2026`; sus correos están en el propio script.

Para que el Product Owner vea Foresite con el control de acceso, debe figurar como integrante del proyecto (el Scrum Master puede agregarlo por correo desde **Integrantes**).

---

## Reglas de negocio e indicadores

**Health Score** (0–100), ponderado:

| Componente | Peso | Criterio |
|---|---|---|
| Avance vs plan | 40 % | Avance real frente al planificado a la fecha |
| Cumplimiento de fechas | 30 % | Tareas dentro de plazo |
| Riesgos | 20 % | Penalización por riesgo activo: alto 15, medio 8, bajo 3 |
| Participación | 10 % | Integrantes con tareas asignadas |

**Semáforo:** verde ≥ 75 · ámbar 60–74 · rojo < 60. Baja un nivel si la predicción de retraso es "peligro". Sin tareas se muestra "Sin datos".

**Predicción de retraso:** se calcula con el SPI (índice de desempeño del cronograma).

**Backlog:** estimación en Fibonacci (1, 2, 3, 5, 8, 13, 21) con capacidad máxima de **21 puntos por sprint**.

---

## Seguridad y permisos

- Autenticación con **JWT**; contraseñas con **bcrypt**; validación de entrada con `class-validator` (se rechazan campos no declarados).
- **Scrum Master** = creador del proyecto. Solo él puede agregar integrantes (`403` para los demás).
- Agregar un integrante exige un **correo de usuario registrado** (`404` si no existe, `409` si ya pertenece).
- Solo el dueño o un integrante puede ver o crear tareas, backlog, riesgos, fases y sprints de un proyecto (`403` en otro caso).
- Las respuestas de usuarios nunca incluyen el hash de la contraseña.

---

## API

Documentación completa y probador en `/docs` (Swagger UI). Resumen:

| Recurso | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` |
| Usuarios | `GET /users` · `GET /users/me` · `PATCH /users/me` · `GET /users/:id` |
| Proyectos | `GET /projects` · `POST /projects` · `GET /projects/:id` |
| Integrantes | `GET /projects/:id/members` · `POST /projects/:id/members` |
| Planificación | `GET·POST /projects/:id/phases` · `GET·POST /projects/:id/sprints` |
| Tareas (RACI) | `GET·POST /projects/:id/tasks` · `PATCH·DELETE /projects/:id/tasks/:taskId` |
| Backlog | `GET·POST /projects/:id/backlog` · `PATCH·DELETE /projects/:id/backlog/:itemId` |
| Riesgos | `GET·POST /projects/:id/risks` |

Todas las rutas, salvo `auth`, requieren el encabezado `Authorization: Bearer <token>`.

---

## Despliegue

### Backend y base de datos (Render)

1. Crea la base **PostgreSQL** y un **Web Service** con el repositorio del backend.
   - Build: `npm install && npm run build`
   - Start: `npm run start:prod`
2. Define las variables de entorno. Con la URL **interna** de la base: `DB_SSL=false`.
3. Ejecuta el DDL en la base (una sola vez).

> El plan gratuito de Render **duerme el servicio** tras 15 min sin tráfico (la primera petición puede tardar ~50 s) y la **base gratuita expira a los 30 días**: haz un `pg_dump` antes de la sustentación.

### Frontend (Vercel)

1. Importa el repositorio del frontend (el `vercel.json` ya define la salida y la redirección de rutas).
2. Agrega la variable `API_URL` con la URL pública de la API.
3. En Render, configura `CORS_ORIGIN` con la URL de Vercel.

### CI/CD

GitHub Actions construye y despliega en cada *push* a `main`.

---

## Equipo

| Integrante | Rol |
|---|---|
| Miguel Azcarate | Director del proyecto · Backend |
| Renzo Candiotti | Frontend |
| Hugo Peralta | DevOps · QA |

Docente / Product Owner: **Walter Cueva**.
