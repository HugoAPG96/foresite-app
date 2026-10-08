# foresite-web

Frontend de **Foresite** — gestión de proyectos con visión predictiva (semáforo, Health Score, predicción de retraso y reportes automáticos).

Angular 20 · Angular Material + CDK · componentes standalone y signals · se conecta a la API `foresite-api` (NestJS).

## Requisitos

- Node.js 20.19+ (o 22.12+) y npm
- La API `foresite-api` corriendo, **con el parche `foresite-api-parche`** aplicado (ver `README-PARCHE.md`)

## Ejecutar en local

```bash
npm install
npm start            # http://localhost:4200  → usa environment.development.ts (API en http://localhost:3000)
```

## Entornos (local / producción)

| Archivo | Se usa en | `apiUrl` por defecto |
|---|---|---|
| `src/environments/environment.development.ts` | `ng serve`, `npm run build:dev` | `http://localhost:3000` |
| `src/environments/environment.ts` | `npm run build` (producción) | `https://foresite-api.onrender.com` |

Para apuntar a tu servicio de Render **sin editar archivos**, define `API_URL` al construir:

```bash
API_URL=https://mi-api.onrender.com npm run build
```

`scripts/set-env.js` (se ejecuta solo en `prebuild`) reescribe `environment.ts` con ese valor.

## Despliegue en Vercel

1. Importa el repositorio en Vercel (preset *Angular*; `vercel.json` ya define salida y rewrites para las rutas profundas).
2. En *Settings → Environment Variables* agrega `API_URL` = URL pública de tu API en Render.
3. En Render, define `CORS_ORIGIN` = URL de tu app en Vercel (p. ej. `https://foresite.vercel.app`).

> El plan gratuito de Render duerme el servicio tras 15 min sin tráfico: la primera petición puede tardar ~50 s. La pantalla de login lo avisa.

## Estructura

```
src/app/
├── core/        modelos, servicios de API, auth (JWT + interceptor + guards), store del proyecto, métricas y reportes
├── layout/      shell: header (logo, perfil, cerrar sesión) + menú lateral de dos niveles
├── shared/      logo, diálogo de confirmación, utilidades
└── features/
    ├── auth/        login y registro
    ├── projects/    lista de proyectos, wizard "Nuevo proyecto" (modal de 4 pasos)
    ├── dashboard/   semáforo, Health Score, predicción, recomendaciones, carga por integrante
    ├── tasks/       Kanban (drag & drop) y Cronograma RACI por fases + modales de tarea y fase
    ├── backlog/     tabla de 13 columnas, modales de ítem (8 tipos de PBI) y de sprint
    └── reports/     Ejecutivo, Desviación (por fase / por sprint) y Desempeño; CSV e impresión a PDF
```

## Cómo se calculan los indicadores

Se calculan en el cliente (`src/app/core/metrics.ts`) con los datos de la API:

- **Health Score** = 40 % avance + 30 % cumplimiento de fechas + 20 % riesgos + 10 % participación del equipo. El avance se mide **contra el plan** (avance real ÷ avance planificado a hoy).
- **Semáforo**: verde ≥ 75, ámbar 60–74, rojo < 60; baja un nivel si la predicción de retraso es crítica. Sin tareas muestra "Sin datos".
- **Predicción de retraso**: heurística basada en SPI (avance real ÷ planificado) y proporción de tareas atrasadas. No es un modelo de ML.
- **Riesgos**: no hay matriz ni módulo de riesgos (fuera de alcance); solo se lee la lista para el componente del 20 % y el conteo del dashboard.

## Convenciones

- Formularios de creación/edición: siempre en modal; fechas solo con calendario; validaciones de tipo, obligatoriedad y rangos de fechas.
- Escala de estimación Fibonacci (1, 2, 3, 5, 8, 13, 21) y capacidad de 21 puntos por sprint (aviso, no bloqueo).
