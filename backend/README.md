# foresite-api

API REST del proyecto **Foresite** — plataforma de gestión de proyectos de software que, además de registrar tareas, detecta riesgos, predice retrasos y genera reportes automáticos para exposiciones y entregables.

Proyecto académico del curso Administración de Proyectos de Software (UPN).

## Stack

| Capa | Tecnología |
|---|---|
| Runtime / Framework | Node.js + NestJS |
| Base de datos | PostgreSQL (Neon) |
| ORM | TypeORM |
| Autenticación | JWT (Passport.js) + bcrypt |
| Documentación de API | OpenAPI / Swagger (`@nestjs/swagger`) |
| Despliegue | Render (API) vía GitHub Actions |

## Arquitectura

Módulos organizados por dominio, cada uno con la misma estructura interna (controller / service / module / dto / entities), siguiendo el enfoque modular de NestJS en lugar de arquitectura hexagonal — la complejidad extra de puertos y adaptadores no se justifica para el alcance y plazo de este proyecto.

```
src/
├── main.ts                  # bootstrap: Swagger, CORS, ValidationPipe
├── app.module.ts             # módulo raíz, arma todos los módulos de dominio
├── config/
│   └── typeorm.config.ts     # conexión a PostgreSQL (Neon)
├── common/                   # decorators, guards, filters e interceptors compartidos
└── modules/
    ├── auth/                 # login, registro, estrategia y guard JWT
    │   ├── dto/
    │   ├── strategies/
    │   ├── guards/
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   └── auth.service.ts
    ├── users/                 # usuarios (soporta a auth)
    ├── projects/               # proyectos: acta, dashboard, health score
    ├── tasks/                  # cronograma RACI (vistas Kanban y Cronograma)
    ├── backlog/                # product backlog (épicas, HU, spikes, bugs, enablers)
    └── risks/                  # riesgos: matriz probabilidad x impacto, mitigación
```

Cada módulo de dominio sigue el mismo patrón que `projects/`:

```
<modulo>/
├── dto/                # contratos de entrada, validados con class-validator
├── entities/            # entidades TypeORM (esquema físico de la tabla)
├── <modulo>.controller.ts
├── <modulo>.module.ts
└── <modulo>.service.ts
```

## Requisitos

- Node.js 20+
- Una base de datos PostgreSQL (se recomienda [Neon](https://neon.tech), tiene capa gratuita)

## Puesta en marcha

```bash
npm install
cp .env.example .env
# completar DATABASE_URL y JWT_SECRET en .env
npm run start:dev
```

La API queda disponible en `http://localhost:3000` y la documentación OpenAPI en `http://localhost:3000/docs`.

## Autenticación

- `POST /auth/register` — crea una cuenta y devuelve un JWT
- `POST /auth/login` — autentica y devuelve un JWT

El resto de rutas requieren el header `Authorization: Bearer <token>`. En Swagger, usa el botón **Authorize** para pegar el token una sola vez y probar todos los endpoints protegidos.

## Variables de entorno

Ver `.env.example`. En producción (Render), configúralas como variables de entorno del servicio — nunca subas el archivo `.env` real al repositorio (ya está en `.gitignore`).

## Despliegue

El despliegue a Render se dispara automáticamente vía GitHub Actions en cada `push` a `main` (ver `.github/workflows/backend.yml` en la raíz del monorepo).

## Modelo de datos

El modelo de datos físico completo (tablas, relaciones 1:N y N:M) está documentado en `Foresite_Modelo_Datos_Fisico.puml`, junto a la especificación de interfaces UX/UI del proyecto.
