# Foresite — Gestión de Proyectos de Software

Aplicación web para gestión de proyectos de software con detección de riesgos, predicción de retraso y reportes automáticos.

**Producción:** https://foresite-app.vercel.app

---

## Estructura del proyecto
foresite-app/
├── front/ # Aplicación Angular (UI)
├── backend/ # API REST con NestJS + PostgreSQL
├── e2e/ # Pruebas End-to-End con Playwright
├── .github/workflows/ # CI con GitHub Actions
└── README.md


> **Nota:** el equipo usa `backend/` en lugar de `back/` por claridad. Es la única diferencia con la nomenclatura sugerida.

---

## Requisitos previos

- **Node.js** v20 o superior
- **npm** v10 o superior
- **PostgreSQL** (se usa una instancia gestionada en Render)

Verifica tu versión:
```bash
node --version
npm --version