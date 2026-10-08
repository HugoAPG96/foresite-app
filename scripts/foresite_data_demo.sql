-- ==========================================================================
-- Foresite — Datos iniciales de DEMOSTRACIÓN (PostgreSQL)
-- ==========================================================================
-- Carga 2 proyectos completos listos para una demo:
--   1) Foresite   — datos reales de los documentos A1–A5 (equipo, fechas, RACI de 8 fases / 41 tareas,
--                   backlog de 3 sprints de ≤ 21 pts, riesgos del acta).
--   2) ReparaYa   — proyecto ficticio de demostración (equipo de 4, 6 fases / 17 tareas, 4 sprints).
--
-- Requisitos: base creada con Foresite_DDL_PostgreSQL.sql (tipos de PBI: ep, hu, sp, en, ta, rn, do, bu).
--
-- Cuentas de acceso (contraseña de todas: Foresite2026). El correo se guarda tal cual: iniciar sesión
-- distingue mayúsculas y minúsculas (usar la "N" mayúscula en los códigos):
--   N00344830@upn.pe       Miguel Azcarate  — director de ambos proyectos
--   N00345390@upn.pe       Renzo Candiotti  — integrante
--   N00272526@upn.pe       Hugo Peralta     — integrante
--   ana@foresite.demo      Ana Torres       — integrante de ReparaYa (ficticia)
--   walter@upn.pe          Walter Cueva     — Product Owner; figura como Consultado/Informado en el RACI de
--                                             Foresite y NO es integrante (no cuenta en la carga ni en la
--                                             participación del equipo)
--
-- Uso:   psql "$DATABASE_URL" -f Foresite_Datos_Demo.sql
-- El script es re-ejecutable: borra primero los datos demo (ids fijos) y los vuelve a cargar.
-- Los indicadores del dashboard dependen de la fecha actual: ver al final cómo desplazar las fechas.
-- ==========================================================================

BEGIN;

-- 0. Limpieza previa (solo ids de este script) -------------------------------

DELETE FROM risks WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM task_informed WHERE task_id IN (SELECT id FROM tasks WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002'));
DELETE FROM task_consulted WHERE task_id IN (SELECT id FROM tasks WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002'));
DELETE FROM tasks WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM backlog_item_responsables WHERE backlog_item_id IN (SELECT id FROM backlog_items WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002'));
UPDATE backlog_items SET dependency_id = NULL WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM backlog_items WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM sprints WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM phases WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM project_members WHERE project_id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM projects WHERE id IN ('b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
DELETE FROM users WHERE id IN ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000005');

-- 1. Usuarios -----------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, created_at) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Miguel Azcarate', 'N00344830@upn.pe', '$2b$10$SCQSEwXgLgvxVa9bBe.x9ukSR1ulgprZ3H9F2z1WmD33HFaD5DWEq', '2026-09-07 08:00:00'),
  ('a1000000-0000-4000-8000-000000000002', 'Renzo Candiotti', 'N00345390@upn.pe', '$2b$10$SCQSEwXgLgvxVa9bBe.x9ukSR1ulgprZ3H9F2z1WmD33HFaD5DWEq', '2026-09-07 08:00:00'),
  ('a1000000-0000-4000-8000-000000000003', 'Hugo Peralta', 'N00272526@upn.pe', '$2b$10$SCQSEwXgLgvxVa9bBe.x9ukSR1ulgprZ3H9F2z1WmD33HFaD5DWEq', '2026-09-07 08:00:00'),
  ('a1000000-0000-4000-8000-000000000004', 'Walter Cueva', 'walter@upn.pe', '$2b$10$SCQSEwXgLgvxVa9bBe.x9ukSR1ulgprZ3H9F2z1WmD33HFaD5DWEq', '2026-09-07 08:00:00'),
  ('a1000000-0000-4000-8000-000000000005', 'Ana Torres', 'ana@foresite.demo', '$2b$10$SCQSEwXgLgvxVa9bBe.x9ukSR1ulgprZ3H9F2z1WmD33HFaD5DWEq', '2026-09-07 08:00:00');

-- 2. Proyectos ----------------------------------------------------------------
INSERT INTO projects (id, name, objective, scope, start_date, end_date, health_score, semaforo, created_by, created_at) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'Foresite', 'Desarrollar una aplicación web ligera de gestión de proyectos de software que permita dar seguimiento a tareas, visualizar métricas de avance, anticipar riesgos de retraso y generar reportes automáticos.', 'Incluye: login con JWT, proyectos, tareas Kanban y cronograma RACI, dashboard con semáforo, indicador predictivo, reporte semanal y despliegue continuo. No incluye: app móvil, integraciones externas, notificaciones ni roles avanzados.', '2026-09-07', '2026-10-09', 72.0, 'ambar', 'a1000000-0000-4000-8000-000000000001', '2026-09-07 08:30:00'),
  ('b1000000-0000-4000-8000-000000000002', 'ReparaYa', 'Plataforma inteligente de gestión ciudadana de infraestructura pública: los ciudadanos reportan incidencias y la municipalidad las prioriza y atiende.', 'Incluye: reporte con foto y ubicación, seguimiento del estado, panel del funcionario, notificaciones y mapa de incidencias. No incluye: app móvil nativa ni pagos.', '2026-09-14', '2026-11-20', 88.0, 'verde', 'a1000000-0000-4000-8000-000000000001', '2026-09-14 08:30:00');

-- 3. Integrantes ---------------------------------------------------------------
INSERT INTO project_members (id, project_id, user_id, role) VALUES
  ('10000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Director'),
  ('10000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'Desarrollo frontend'),
  ('10000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', 'DevOps y QA'),
  ('10000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Director'),
  ('10000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'Desarrollo frontend'),
  ('10000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'DevOps y QA'),
  ('10000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000005', 'Product Owner');

-- 4. Fases del cronograma -----------------------------------------------------
INSERT INTO phases (id, project_id, name, order_index) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Inicio y planificación del proyecto', 0),  -- 1
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'Gestión de requisitos', 1),  -- 2
  ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'Diseño de la solución', 2),  -- 3
  ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'Gestión de configuración y ambientes', 3),  -- 4
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 'Desarrollo del producto', 4),  -- 5
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 'Pruebas y aseguramiento de calidad', 5),  -- 6
  ('c1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'Despliegue y transición', 6),  -- 7
  ('c1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000001', 'Cierre del proyecto', 7),  -- 8
  ('c2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'Planificación y gestión', 0),  -- ReparaYa 1
  ('c2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'Análisis y diseño', 1),  -- ReparaYa 2
  ('c2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 'Desarrollo backend', 2),  -- ReparaYa 3
  ('c2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'Desarrollo frontend', 3),  -- ReparaYa 4
  ('c2000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'Pruebas', 4),  -- ReparaYa 5
  ('c2000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'Despliegue y cierre', 5);  -- ReparaYa 6

-- 5. Sprints ------------------------------------------------------------------
INSERT INTO sprints (id, project_id, number, start_date, end_date) VALUES
  ('d1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 0, '2026-09-07', '2026-09-13'),
  ('d1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 1, '2026-09-14', '2026-09-25'),
  ('d1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 2, '2026-09-28', '2026-10-09'),
  ('d2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 0, '2026-09-14', '2026-09-18'),
  ('d2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 1, '2026-09-21', '2026-10-02'),
  ('d2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 2, '2026-10-05', '2026-10-16'),
  ('d2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 3, '2026-10-19', '2026-10-30');

-- 6. Product backlog (las dependencias apuntan a ítems ya insertados) ---------
-- Foresite
INSERT INTO backlog_items (id, project_id, phase_id, sprint_id, type, code, title, description, acceptance_criteria, priority, estimation, status, start_date, end_date, dependency_id, created_at) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'ep', 'EP-000', 'Inicio del proyecto (Sprint 0)', 'Fase de inicio: definir alcance, arquitectura, roles, convenciones del backlog y diseño base antes de programar. No consume capacidad de desarrollo.', E'- [x] Perfil del proyecto actualizado a 4 semanas\n- [x] Acta, RACI y backlog aprobados por el equipo\n- [x] Wireframes disponibles para el Sprint 1', 'alta', 0, 'done', '2026-09-07', '2026-09-13', NULL, '2026-09-07 09:00:00'),  -- EP-000 · 0 pts · done
  ('e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'do', 'DO-001', 'Perfil del proyecto actualizado', 'Actualizar el perfil: plazo, herramientas (Vercel, Render, GitHub), objetivos e indicadores de logro.', E'- [x] Menciones al plazo anterior reemplazadas\n- [x] Indicadores alineados con las HU del backlog\n- [x] Revisado por los tres integrantes', 'alta', 0, 'done', '2026-09-07', '2026-09-11', 'e1000000-0000-4000-8000-000000000001', '2026-09-07 09:01:00'),  -- DO-001 · 0 pts · done
  ('e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'do', 'DO-002', 'Acta de constitución y business case', 'Redactar el acta de constitución y el business case con alcance, criterios de éxito y riesgos iniciales.', E'- [x] Acta firmada por el Product Owner\n- [x] Business case con costos y beneficios', 'alta', 0, 'done', '2026-09-07', '2026-09-13', 'e1000000-0000-4000-8000-000000000001', '2026-09-07 09:02:00'),  -- DO-002 · 0 pts · done
  ('e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'do', 'DO-003', 'Matriz RACI y cronograma', 'Definir roles y responsabilidades por actividad y el cronograma por fases.', E'- [x] Un solo A por actividad\n- [x] Cronograma con fechas por fase', 'alta', 0, 'done', '2026-09-07', '2026-09-13', 'e1000000-0000-4000-8000-000000000001', '2026-09-07 09:03:00'),  -- DO-003 · 0 pts · done
  ('e1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001', 'do', 'DO-004', 'Product Backlog, convenciones y Definition of Done', 'Documentar tipos de PBI (EP, HU, SP, EN, TA, RN, DO, BU), formatos, escala Fibonacci y capacidad de 21 puntos por sprint.', E'- [x] Tipos y formatos documentados\n- [x] Escala Fibonacci y capacidad por sprint definidas\n- [x] DoD acordada', 'alta', 0, 'done', '2026-09-07', '2026-09-13', 'e1000000-0000-4000-8000-000000000001', '2026-09-07 09:04:00'),  -- DO-004 · 0 pts · done
  ('e1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000001', 'ta', 'TA-000', 'Wireframes de las 5 pantallas', 'Diseñar los wireframes de baja fidelidad de las pantallas principales.', E'- [x] Login\n- [x] Proyectos\n- [x] Tareas (Kanban)\n- [x] Dashboard\n- [x] Reportes', 'media', 0, 'done', '2026-09-07', '2026-09-13', 'e1000000-0000-4000-8000-000000000001', '2026-09-07 09:05:00'),  -- TA-000 · 0 pts · done
  ('e1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002', 'hu', 'HU-001', 'Registro e inicio de sesión', 'Como usuario nuevo, quiero registrarme e iniciar sesión con correo y contraseña, para acceder a mis proyectos de forma segura.', 'Dado que el usuario ingresa un correo y contraseña válidos, cuando presiona "Ingresar", entonces el sistema lo autentica y muestra su lista de proyectos.', 'alta', 3, 'done', '2026-09-14', '2026-09-18', NULL, '2026-09-07 09:06:00'),  -- HU-001 · 3 pts · done
  ('e1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002', 'hu', 'HU-002', 'Crear proyecto e incorporar miembros', 'Como líder del equipo, quiero crear un proyecto con su fecha de entrega e incorporar integrantes, para organizar el trabajo desde el inicio.', 'Dado que el líder completa nombre, fechas e integrantes, cuando confirma la creación, entonces el proyecto aparece en su lista con el equipo asignado.', 'alta', 3, 'done', '2026-09-16', '2026-09-22', 'e1000000-0000-4000-8000-000000000007', '2026-09-07 09:07:00'),  -- HU-002 · 3 pts · done
  ('e1000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002', 'hu', 'HU-003', 'Gestionar tareas del proyecto', 'Como integrante del equipo, quiero crear, editar, eliminar y asignar tareas con fecha límite, para mantener el cronograma al día.', 'Dado que el integrante completa el formulario de tarea, cuando guarda los cambios, entonces la tarea queda registrada con su responsable y fechas.', 'alta', 5, 'done', '2026-09-17', '2026-09-24', 'e1000000-0000-4000-8000-000000000008', '2026-09-07 09:08:00'),  -- HU-003 · 5 pts · done
  ('e1000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002', 'hu', 'HU-004', 'Tablero Kanban con arrastrar y soltar', 'Como integrante del equipo, quiero mover las tareas entre Pendiente, En progreso y Completada, para actualizar el estado sin abrir formularios.', 'Dado que el integrante arrastra una tarjeta a otra columna, cuando suelta la tarjeta, entonces el estado de la tarea se actualiza y se guarda.', 'alta', 5, 'done', '2026-09-21', '2026-09-25', 'e1000000-0000-4000-8000-000000000009', '2026-09-07 09:09:00'),  -- HU-004 · 5 pts · done
  ('e1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002', 'sp', 'SP-001', 'Spike: Angular CDK drag and drop', 'Investigar la viabilidad de Angular CDK para el tablero; alternativa: cambio de estado por selector.', E'- [x] Prototipo funcional con CDK\n- [x] Decisión documentada', 'media', 2, 'done', '2026-09-14', '2026-09-18', NULL, '2026-09-07 09:10:00'),  -- SP-001 · 2 pts · done
  ('e1000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002', 'en', 'EN-001', 'Pipeline de CI/CD en GitHub Actions', 'Automatizar build, pruebas y despliegue a Vercel (frontend) y Render (API y base de datos).', E'- [x] Build y pruebas en cada pull request\n- [x] Despliegue automático al hacer merge a main', 'media', 3, 'done', '2026-09-14', '2026-09-18', NULL, '2026-09-07 09:11:00'),  -- EN-001 · 3 pts · done
  ('e1000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000003', 'hu', 'HU-005', 'Dashboard de avance, vencidas y velocidad', 'Como líder del equipo, quiero ver el avance, las tareas vencidas y la velocidad del equipo en un dashboard, para detectar desvíos a tiempo.', 'Dado que el proyecto tiene tareas con fechas y estados, cuando el líder abre el dashboard, entonces ve los indicadores actualizados automáticamente.', 'alta', 5, 'in_progress', '2026-09-28', '2026-10-05', 'e1000000-0000-4000-8000-000000000009', '2026-09-07 09:12:00'),  -- HU-005 · 5 pts · in_progress
  ('e1000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000003', 'hu', 'HU-006', 'Indicador predictivo de riesgo de retraso', 'Como líder del equipo, quiero ver la probabilidad de que el proyecto termine tarde, para tomar decisiones antes de que el atraso ocurra.', 'Dado que el proyecto tiene velocidad histórica y tareas pendientes, cuando el líder abre el dashboard, entonces el sistema muestra la probabilidad y los días estimados de retraso.', 'alta', 5, 'doing', '2026-09-28', '2026-10-06', 'e1000000-0000-4000-8000-000000000013', '2026-09-07 09:13:00'),  -- HU-006 · 5 pts · doing
  ('e1000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000003', 'hu', 'HU-007', 'Reporte semanal automático', 'Como líder del equipo, quiero recibir un reporte de estado generado sin intervención manual, para informar a los interesados sin armar el reporte a mano.', 'Dado que hay datos del proyecto en la semana, cuando se ejecuta la generación del reporte, entonces el reporte queda disponible en menos de 5 segundos.', 'media', 5, 'open', '2026-10-05', '2026-10-08', 'e1000000-0000-4000-8000-000000000014', '2026-09-07 09:14:00'),  -- HU-007 · 5 pts · open
  ('e1000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000003', 'hu', 'HU-008', 'Historial de reportes descargable', 'Como líder del equipo, quiero consultar y descargar los reportes anteriores, para compartirlos con los interesados.', 'Dado que existen reportes generados, cuando el líder abre el historial, entonces puede descargar cualquier reporte.', 'media', 1, 'open', '2026-10-06', '2026-10-08', 'e1000000-0000-4000-8000-000000000015', '2026-09-07 09:15:00'),  -- HU-008 · 1 pts · open
  ('e1000000-0000-4000-8000-000000000017', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000003', 'bu', 'BU-001', 'El semáforo no se actualiza al mover una tarea', 'Al mover una tarjeta a Completada el semáforo del dashboard conserva el valor anterior hasta recargar.', E'- [ ] Recalcular el semáforo al cambiar de estado\n- [ ] Prueba E2E que cubra el caso', 'alta', 1, 'open', '2026-10-06', '2026-10-07', NULL, '2026-09-07 09:16:00'),  -- BU-001 · 1 pts · open
  ('e1000000-0000-4000-8000-000000000018', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000003', 'ta', 'TA-001', 'Pruebas E2E con Playwright', 'Automatizar los flujos críticos: login, crear proyecto, mover tarea y ver el dashboard.', E'- [ ] 4 flujos críticos automatizados\n- [ ] Ejecución en el pipeline de CI', 'media', 2, 'open', '2026-10-05', '2026-10-08', NULL, '2026-09-07 09:17:00'),  -- TA-001 · 2 pts · open
  ('e1000000-0000-4000-8000-000000000019', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000003', 'do', 'DO-005', 'Manual de usuario y README técnico', 'Redactar el manual de usuario y el README técnico para la entrega final.', E'- [ ] Manual con capturas de las 5 pantallas\n- [ ] README con instalación y despliegue', 'baja', 2, 'open', '2026-10-05', '2026-10-09', NULL, '2026-09-07 09:18:00');  -- DO-005 · 2 pts · open

-- ReparaYa
INSERT INTO backlog_items (id, project_id, phase_id, sprint_id, type, code, title, description, acceptance_criteria, priority, estimation, status, start_date, end_date, dependency_id, created_at) VALUES
  ('e2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'ep', 'EP-000', 'Inicio del proyecto (Sprint 0)', 'Definir alcance, arquitectura y plan de trabajo antes de programar.', E'- [x] Alcance aprobado\n- [x] Plan y RACI definidos', 'alta', 0, 'done', '2026-09-14', '2026-09-18', NULL, '2026-09-14 09:00:00'),  -- EP-000 · 0 pts · done
  ('e2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'do', 'DO-001', 'Perfil y alcance del proyecto', 'Documentar problema, objetivos y alcance de la plataforma ciudadana.', E'- [x] Problema y objetivos redactados\n- [x] Alcance incluye / no incluye', 'alta', 0, 'done', '2026-09-14', '2026-09-16', 'e2000000-0000-4000-8000-000000000001', '2026-09-14 09:01:00'),  -- DO-001 · 0 pts · done
  ('e2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'ta', 'TA-000', 'Plan de proyecto y matriz RACI', 'Elaborar el cronograma por fases y asignar responsables.', E'- [x] Cronograma por fases\n- [x] RACI revisado', 'media', 0, 'done', '2026-09-16', '2026-09-18', 'e2000000-0000-4000-8000-000000000001', '2026-09-14 09:02:00'),  -- TA-000 · 0 pts · done
  ('e2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000002', 'en', 'EN-001', 'Base de datos y autenticación', 'Preparar la base de datos y el esquema de autenticación de ciudadanos y funcionarios.', E'- [x] Esquema creado\n- [x] Login con JWT', 'alta', 5, 'done', '2026-09-21', '2026-09-28', NULL, '2026-09-14 09:03:00'),  -- EN-001 · 5 pts · done
  ('e2000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000002', 'rn', 'RN-001', 'Todo reporte debe tener foto y ubicación', 'Un reporte ciudadano solo se acepta si incluye al menos una foto y una ubicación válida.', E'- [x] Validación en API\n- [x] Mensaje de error claro', 'alta', 1, 'done', '2026-09-28', '2026-09-30', 'e2000000-0000-4000-8000-000000000004', '2026-09-14 09:04:00'),  -- RN-001 · 1 pts · done
  ('e2000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000002', 'sp', 'SP-001', 'Spike: servicio de mapas y geolocalización', 'Comparar opciones de mapas gratuitas y su límite de uso.', E'- [x] Comparativa de 3 opciones\n- [x] Decisión documentada', 'media', 2, 'done', '2026-09-21', '2026-09-25', NULL, '2026-09-14 09:05:00'),  -- SP-001 · 2 pts · done
  ('e2000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000002', 'hu', 'HU-001', 'Reportar una incidencia con foto y ubicación', 'Como ciudadano, quiero reportar una incidencia de infraestructura con foto y ubicación, para que la municipalidad la atienda.', 'Dado que el ciudadano completó foto, ubicación y descripción, cuando envía el reporte, entonces el sistema lo registra con estado "Pendiente".', 'alta', 5, 'done', '2026-09-28', '2026-10-02', 'e2000000-0000-4000-8000-000000000004', '2026-09-14 09:06:00'),  -- HU-001 · 5 pts · done
  ('e2000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000002', 'hu', 'HU-002', 'Consultar el estado de mi reporte', 'Como ciudadano, quiero consultar el estado de mis reportes, para saber si fueron atendidos.', 'Dado que el ciudadano inició sesión, cuando abre "Mis reportes", entonces ve el estado actualizado de cada reporte.', 'media', 3, 'done', '2026-09-30', '2026-10-02', 'e2000000-0000-4000-8000-000000000007', '2026-09-14 09:07:00'),  -- HU-002 · 3 pts · done
  ('e2000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000003', 'hu', 'HU-003', 'Priorizar y asignar reportes', 'Como funcionario, quiero priorizar y asignar los reportes a una cuadrilla, para atender primero lo más urgente.', 'Dado que existen reportes pendientes, cuando el funcionario asigna una prioridad y una cuadrilla, entonces el reporte cambia a "Asignado".', 'alta', 8, 'in_progress', '2026-10-05', '2026-10-14', 'e2000000-0000-4000-8000-000000000007', '2026-09-14 09:08:00'),  -- HU-003 · 8 pts · in_progress
  ('e2000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000003', 'hu', 'HU-004', 'Notificar al ciudadano cuando cambia el estado', 'Como ciudadano, quiero recibir una notificación cuando cambie el estado de mi reporte, para estar informado sin consultar la app.', 'Dado que un funcionario cambia el estado de un reporte, cuando se guarda el cambio, entonces el ciudadano recibe una notificación.', 'media', 5, 'doing', '2026-10-07', '2026-10-16', 'e2000000-0000-4000-8000-000000000009', '2026-09-14 09:09:00'),  -- HU-004 · 5 pts · doing
  ('e2000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000003', 'bu', 'BU-001', 'Fallo al subir fotos de más de 5 MB', 'La carga de fotos pesadas devuelve error en el formulario de reporte.', E'- [ ] Reducir tamaño en el cliente\n- [ ] Mensaje de error claro', 'alta', 2, 'open', '2026-10-08', '2026-10-12', 'e2000000-0000-4000-8000-000000000007', '2026-09-14 09:10:00'),  -- BU-001 · 2 pts · open
  ('e2000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000004', 'hu', 'HU-005', 'Mapa de incidencias por zona', 'Como funcionario, quiero ver las incidencias en un mapa por zona, para planificar las rutas de atención.', 'Dado que hay reportes con ubicación, cuando el funcionario abre el mapa, entonces ve las incidencias agrupadas por zona.', 'media', 8, 'open', '2026-10-19', '2026-10-28', 'e2000000-0000-4000-8000-000000000009', '2026-09-14 09:11:00'),  -- HU-005 · 8 pts · open
  ('e2000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000004', 'hu', 'HU-006', 'Reportes de atención por distrito', 'Como jefe de obras, quiero ver estadísticas de atención por distrito, para evaluar el desempeño del servicio.', 'Dado que hay reportes atendidos, cuando el jefe abre el reporte, entonces ve el tiempo promedio de atención por distrito.', 'media', 5, 'open', '2026-10-19', '2026-10-28', 'e2000000-0000-4000-8000-000000000009', '2026-09-14 09:12:00'),  -- HU-006 · 5 pts · open
  ('e2000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000005', 'd2000000-0000-4000-8000-000000000004', 'ta', 'TA-001', 'Pruebas de usabilidad con 3 ciudadanos', 'Probar el flujo de reporte con tres ciudadanos externos y registrar hallazgos.', E'- [ ] 3 sesiones realizadas\n- [ ] Hallazgos priorizados', 'media', 3, 'open', '2026-10-26', '2026-10-30', NULL, '2026-09-14 09:13:00'),  -- TA-001 · 3 pts · open
  ('e2000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000006', 'd2000000-0000-4000-8000-000000000004', 'do', 'DO-002', 'Manual de usuario', 'Manual para ciudadanos y funcionarios con capturas.', E'- [ ] Guía del ciudadano\n- [ ] Guía del funcionario', 'baja', 2, 'open', '2026-10-26', '2026-10-30', NULL, '2026-09-14 09:14:00');  -- DO-002 · 2 pts · open

-- 7. Responsables del backlog (varios por ítem) --------------------------------
INSERT INTO backlog_item_responsables (id, backlog_item_id, user_id) VALUES
  ('11000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000008', 'e1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000009', 'e1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000010', 'e1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000011', 'e1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000012', 'e1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000013', 'e1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000014', 'e1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000015', 'e1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000016', 'e1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000017', 'e1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000018', 'e1000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000019', 'e1000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000020', 'e1000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000021', 'e1000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000022', 'e1000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000023', 'e1000000-0000-4000-8000-000000000019', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000024', 'e2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000025', 'e2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000026', 'e2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000027', 'e2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000005'),
  ('11000000-0000-4000-8000-000000000028', 'e2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000005'),
  ('11000000-0000-4000-8000-000000000029', 'e2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000030', 'e2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000031', 'e2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000032', 'e2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000033', 'e2000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000034', 'e2000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000035', 'e2000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000036', 'e2000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000005'),
  ('11000000-0000-4000-8000-000000000037', 'e2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000038', 'e2000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000039', 'e2000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000040', 'e2000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000041', 'e2000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000042', 'e2000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000005');

-- 8. Tareas del cronograma RACI -------------------------------------------------
INSERT INTO tasks (id, project_id, phase_id, backlog_item_id, code, title, responsible_id, accountable_id, start_date, end_date, duration_days, percent_complete, status, created_at) VALUES
  ('f1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', '1.1', 'Definición del alcance y objetivos del proyecto', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-11', 5, 100, 'completada', '2026-09-07 09:30:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003', '1.2', 'Elaboración del acta de constitución del proyecto', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:31:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000004', '1.3', 'Definición de roles y responsabilidades (matriz RACI)', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:32:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', NULL, '1.4', 'Planificación de sprints y cronograma', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:33:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', NULL, '1.5', 'Identificación de riesgos y supuestos', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:34:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', NULL, '1.6', 'Seguimiento semanal del proyecto (planificación, revisión y retrospectiva de sprint)', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-09', 26, 70, 'en_progreso', '2026-09-07 09:35:00'),  -- en_progreso 70%
  ('f1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', NULL, '2.1', 'Levantamiento de requisitos funcionales y no funcionales', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-11', 5, 100, 'completada', '2026-09-07 09:36:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000005', '2.2', 'Elaboración y priorización del Product Backlog', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:37:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', NULL, '2.3', 'Estimación del esfuerzo y capacidad por sprint', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:38:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', NULL, '2.4', 'Validación de requisitos con el Product Owner', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-18', 5, 80, 'en_progreso', '2026-09-07 09:39:00'),  -- en_progreso 80%
  ('f1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', NULL, '2.5', 'Gestión de cambios en los requisitos', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-09', 26, 60, 'en_progreso', '2026-09-07 09:40:00'),  -- en_progreso 60%
  ('f1000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', NULL, '3.1', 'Diseño de la arquitectura de la solución', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:41:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', NULL, '3.2', 'Diseño de la base de datos', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-18', 5, 100, 'completada', '2026-09-07 09:42:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000006', '3.3', 'Diseño de interfaces de usuario (wireframes)', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-07', '2026-09-13', 7, 100, 'completada', '2026-09-07 09:43:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', NULL, '3.4', 'Definición de estándares y convenciones técnicas', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-18', 5, 100, 'completada', '2026-09-07 09:44:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', NULL, '4.1', 'Configuración del repositorio y control de versiones', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-18', 5, 100, 'completada', '2026-09-07 09:45:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000017', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000012', '4.2', 'Configuración de la integración continua', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-18', 5, 100, 'completada', '2026-09-07 09:46:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000018', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', NULL, '4.3', 'Preparación de ambientes en la nube (frontend, backend y base de datos)', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-18', 5, 100, 'completada', '2026-09-07 09:47:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000019', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', NULL, '4.4', 'Administración de accesos, credenciales y variables de entorno', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-09', 26, 60, 'en_progreso', '2026-09-07 09:48:00'),  -- en_progreso 60%
  ('f1000000-0000-4000-8000-000000000020', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000010', '5.1', 'Desarrollo del frontend (interfaz web)', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-09', 26, 40, 'en_progreso', '2026-09-07 09:49:00'),  -- en_progreso 40%
  ('f1000000-0000-4000-8000-000000000021', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000014', '5.2', 'Desarrollo del backend (API) y base de datos', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-09', 26, 45, 'en_progreso', '2026-09-07 09:50:00'),  -- en_progreso 45%
  ('f1000000-0000-4000-8000-000000000022', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000011', '5.3', 'Investigaciones técnicas (spikes)', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-02', 19, 90, 'en_progreso', '2026-09-07 09:51:00'),  -- en_progreso 90%
  ('f1000000-0000-4000-8000-000000000023', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', NULL, '5.4', 'Revisión de código y aprobación de cambios', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-09', 26, 50, 'en_progreso', '2026-09-07 09:52:00'),  -- en_progreso 50%
  ('f1000000-0000-4000-8000-000000000024', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000013', '5.5', 'Integración frontend – backend', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-21', '2026-10-09', 19, 30, 'en_progreso', '2026-09-07 09:53:00'),  -- en_progreso 30%
  ('f1000000-0000-4000-8000-000000000025', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000009', '5.6', 'Incremento del Sprint 1: gestión de proyectos y tareas', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-25', 12, 100, 'completada', '2026-09-07 09:54:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000026', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000013', '5.7', 'Incremento del Sprint 2: dashboard predictivo y reportes', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-28', '2026-10-09', 12, 35, 'en_progreso', '2026-09-07 09:55:00'),  -- en_progreso 35%
  ('f1000000-0000-4000-8000-000000000027', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', NULL, '6.1', 'Elaboración del plan de pruebas y matriz de trazabilidad', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-18', 5, 100, 'completada', '2026-09-07 09:56:00'),  -- completada 100%
  ('f1000000-0000-4000-8000-000000000028', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', NULL, '6.2', 'Diseño de casos de prueba', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-25', 12, 85, 'en_progreso', '2026-09-07 09:57:00'),  -- en_progreso 85%
  ('f1000000-0000-4000-8000-000000000029', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000018', '6.3', 'Ejecución de pruebas funcionales y de extremo a extremo', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-21', '2026-10-09', 19, 25, 'en_progreso', '2026-09-07 09:58:00'),  -- en_progreso 25%
  ('f1000000-0000-4000-8000-000000000030', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', NULL, '6.4', 'Pruebas no funcionales (rendimiento, usabilidad y seguridad)', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-09', 5, 20, 'en_progreso', '2026-09-07 09:59:00'),  -- en_progreso 20%
  ('f1000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000017', '6.5', 'Gestión de defectos', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-21', '2026-10-09', 19, 35, 'en_progreso', '2026-09-07 10:00:00'),  -- en_progreso 35%
  ('f1000000-0000-4000-8000-000000000032', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', NULL, '6.6', 'Informes de pruebas por sprint', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-25', '2026-10-09', 15, 25, 'en_progreso', '2026-09-07 10:01:00'),  -- en_progreso 25%
  ('f1000000-0000-4000-8000-000000000033', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', NULL, '6.7', 'Validación del usuario / aceptación del Product Owner', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-25', '2026-10-09', 15, 10, 'en_progreso', '2026-09-07 10:02:00'),  -- en_progreso 10%
  ('f1000000-0000-4000-8000-000000000034', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000007', NULL, '7.1', 'Despliegue continuo de los incrementos', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-10-09', 26, 50, 'en_progreso', '2026-09-07 10:03:00'),  -- en_progreso 50%
  ('f1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000007', NULL, '7.2', 'Liberación de la versión final a producción', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-09', 5, 0, 'pendiente', '2026-09-07 10:04:00'),  -- pendiente 0%
  ('f1000000-0000-4000-8000-000000000036', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000007', NULL, '7.3', 'Verificación del despliegue en producción', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-09', 5, 0, 'pendiente', '2026-09-07 10:05:00'),  -- pendiente 0%
  ('f1000000-0000-4000-8000-000000000037', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000008', NULL, '8.1', 'Documentación técnica del sistema', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-09', 5, 15, 'en_progreso', '2026-09-07 10:06:00'),  -- en_progreso 15%
  ('f1000000-0000-4000-8000-000000000038', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000008', 'e1000000-0000-4000-8000-000000000019', '8.2', 'Manual de usuario', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-09', 5, 0, 'pendiente', '2026-09-07 10:07:00'),  -- pendiente 0%
  ('f1000000-0000-4000-8000-000000000039', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000008', NULL, '8.3', 'Informe final de calidad', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-09', 5, 0, 'pendiente', '2026-09-07 10:08:00'),  -- pendiente 0%
  ('f1000000-0000-4000-8000-000000000040', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000008', NULL, '8.4', 'Presentación y sustentación final', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-09', 5, 0, 'pendiente', '2026-09-07 10:09:00'),  -- pendiente 0%
  ('f1000000-0000-4000-8000-000000000041', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000008', NULL, '8.5', 'Retrospectiva y lecciones aprendidas', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-10-09', '2026-10-09', 1, 0, 'pendiente', '2026-09-07 10:10:00'),  -- pendiente 0%
  ('f2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000002', '1.1', 'Definición del alcance del proyecto', 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', '2026-09-14', '2026-09-16', 3, 100, 'completada', '2026-09-14 09:30:00'),  -- ReparaYa completada 100%
  ('f2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000003', '1.2', 'Plan de proyecto y matriz RACI', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000005', '2026-09-16', '2026-09-18', 3, 100, 'completada', '2026-09-14 09:31:00'),  -- ReparaYa completada 100%
  ('f2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', NULL, '1.3', 'Seguimiento semanal y retrospectivas', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000005', '2026-09-21', '2026-11-20', 61, 40, 'en_progreso', '2026-09-14 09:32:00'),  -- ReparaYa en_progreso 40%
  ('f2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', NULL, '2.1', 'Levantamiento de requerimientos', 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', '2026-09-17', '2026-09-23', 7, 100, 'completada', '2026-09-14 09:33:00'),  -- ReparaYa completada 100%
  ('f2000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', NULL, '2.2', 'Redacción de historias de usuario', 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', '2026-09-21', '2026-09-25', 5, 100, 'completada', '2026-09-14 09:34:00'),  -- ReparaYa completada 100%
  ('f2000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', NULL, '2.3', 'Diseño de wireframes', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-23', '2026-09-30', 8, 100, 'completada', '2026-09-14 09:35:00'),  -- ReparaYa completada 100%
  ('f2000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000004', '2.4', 'Arquitectura y modelo de datos', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-24', '2026-09-30', 7, 100, 'completada', '2026-09-14 09:36:00'),  -- ReparaYa completada 100%
  ('f2000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'e2000000-0000-4000-8000-000000000009', '3.1', 'Servicio de reportes ciudadanos', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-09-28', '2026-10-09', 12, 70, 'en_progreso', '2026-09-14 09:37:00'),  -- ReparaYa en_progreso 70%
  ('f2000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'e2000000-0000-4000-8000-000000000010', '3.2', 'Servicio de notificaciones', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-16', 12, 25, 'en_progreso', '2026-09-14 09:38:00'),  -- ReparaYa en_progreso 25%
  ('f2000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'e2000000-0000-4000-8000-000000000012', '3.3', 'Integración con servicio de mapas', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-10-12', '2026-10-23', 12, 0, 'pendiente', '2026-09-14 09:39:00'),  -- ReparaYa pendiente 0%
  ('f2000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'e2000000-0000-4000-8000-000000000007', '4.1', 'Formulario de reporte con foto y ubicación', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-28', '2026-10-07', 10, 85, 'en_progreso', '2026-09-14 09:40:00'),  -- ReparaYa en_progreso 85%
  ('f2000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'e2000000-0000-4000-8000-000000000009', '4.2', 'Panel del funcionario', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-10-05', '2026-10-20', 16, 20, 'en_progreso', '2026-09-14 09:41:00'),  -- ReparaYa en_progreso 20%
  ('f2000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 'e2000000-0000-4000-8000-000000000012', '4.3', 'Mapa de incidencias por zona', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-10-19', '2026-10-30', 12, 0, 'pendiente', '2026-09-14 09:42:00'),  -- ReparaYa pendiente 0%
  ('f2000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000005', NULL, '5.1', 'Pruebas funcionales y de integración', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-10-19', '2026-10-30', 12, 0, 'pendiente', '2026-09-14 09:43:00'),  -- ReparaYa pendiente 0%
  ('f2000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000005', 'e2000000-0000-4000-8000-000000000014', '5.2', 'Pruebas de usabilidad con ciudadanos', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000005', '2026-11-02', '2026-11-06', 5, 0, 'pendiente', '2026-09-14 09:44:00'),  -- ReparaYa pendiente 0%
  ('f2000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000006', NULL, '6.1', 'Despliegue en producción', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', '2026-11-09', '2026-11-13', 5, 0, 'pendiente', '2026-09-14 09:45:00'),  -- ReparaYa pendiente 0%
  ('f2000000-0000-4000-8000-000000000017', 'b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000006', 'e2000000-0000-4000-8000-000000000015', '6.2', 'Documentación final y sustentación', 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', '2026-11-16', '2026-11-20', 5, 0, 'pendiente', '2026-09-14 09:46:00');  -- ReparaYa pendiente 0%

-- 9. Consultados (C) e Informados (I) del RACI ---------------------------------
INSERT INTO task_consulted (id, task_id, user_id) VALUES
  ('12000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000015', 'f1000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000018', 'f1000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000019', 'f1000000-0000-4000-8000-000000000019', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000020', 'f1000000-0000-4000-8000-000000000020', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000021', 'f1000000-0000-4000-8000-000000000021', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000022', 'f1000000-0000-4000-8000-000000000022', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000023', 'f1000000-0000-4000-8000-000000000023', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000024', 'f1000000-0000-4000-8000-000000000024', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000025', 'f1000000-0000-4000-8000-000000000025', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000026', 'f1000000-0000-4000-8000-000000000026', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000027', 'f1000000-0000-4000-8000-000000000027', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000028', 'f1000000-0000-4000-8000-000000000028', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000029', 'f1000000-0000-4000-8000-000000000029', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000030', 'f1000000-0000-4000-8000-000000000030', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000031', 'f1000000-0000-4000-8000-000000000031', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000032', 'f1000000-0000-4000-8000-000000000032', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000033', 'f1000000-0000-4000-8000-000000000033', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000034', 'f1000000-0000-4000-8000-000000000034', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000035', 'f1000000-0000-4000-8000-000000000035', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000036', 'f1000000-0000-4000-8000-000000000036', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000037', 'f1000000-0000-4000-8000-000000000037', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000038', 'f1000000-0000-4000-8000-000000000038', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000039', 'f1000000-0000-4000-8000-000000000039', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000040', 'f1000000-0000-4000-8000-000000000040', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000041', 'f1000000-0000-4000-8000-000000000041', 'a1000000-0000-4000-8000-000000000004'),
  ('12000000-0000-4000-8000-000000000042', 'f2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('12000000-0000-4000-8000-000000000043', 'f2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000005'),
  ('12000000-0000-4000-8000-000000000044', 'f2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000005'),
  ('12000000-0000-4000-8000-000000000045', 'f2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002'),
  ('12000000-0000-4000-8000-000000000046', 'f2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000002'),
  ('12000000-0000-4000-8000-000000000047', 'f2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000005'),
  ('12000000-0000-4000-8000-000000000048', 'f2000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000003'),
  ('12000000-0000-4000-8000-000000000049', 'f2000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000003'),
  ('12000000-0000-4000-8000-000000000050', 'f2000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000003'),
  ('12000000-0000-4000-8000-000000000051', 'f2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000001'),
  ('12000000-0000-4000-8000-000000000052', 'f2000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000005'),
  ('12000000-0000-4000-8000-000000000053', 'f2000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000005'),
  ('12000000-0000-4000-8000-000000000054', 'f2000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000005'),
  ('12000000-0000-4000-8000-000000000055', 'f2000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000002'),
  ('12000000-0000-4000-8000-000000000056', 'f2000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000005'),
  ('12000000-0000-4000-8000-000000000057', 'f2000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000001'),
  ('12000000-0000-4000-8000-000000000058', 'f2000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000001');

INSERT INTO task_informed (id, task_id, user_id) VALUES
  ('13000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000015', 'f1000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000018', 'f1000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000019', 'f1000000-0000-4000-8000-000000000019', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000020', 'f1000000-0000-4000-8000-000000000020', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000021', 'f1000000-0000-4000-8000-000000000021', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000022', 'f1000000-0000-4000-8000-000000000022', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000023', 'f1000000-0000-4000-8000-000000000023', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000024', 'f1000000-0000-4000-8000-000000000024', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000025', 'f1000000-0000-4000-8000-000000000025', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000026', 'f1000000-0000-4000-8000-000000000026', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000027', 'f1000000-0000-4000-8000-000000000027', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000028', 'f1000000-0000-4000-8000-000000000028', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000029', 'f1000000-0000-4000-8000-000000000029', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000030', 'f1000000-0000-4000-8000-000000000030', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000031', 'f1000000-0000-4000-8000-000000000031', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000032', 'f1000000-0000-4000-8000-000000000032', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000033', 'f1000000-0000-4000-8000-000000000033', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000034', 'f1000000-0000-4000-8000-000000000034', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000035', 'f1000000-0000-4000-8000-000000000035', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000036', 'f1000000-0000-4000-8000-000000000036', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000037', 'f1000000-0000-4000-8000-000000000037', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000038', 'f1000000-0000-4000-8000-000000000038', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000039', 'f1000000-0000-4000-8000-000000000039', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000040', 'f1000000-0000-4000-8000-000000000040', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000041', 'f1000000-0000-4000-8000-000000000041', 'a1000000-0000-4000-8000-000000000004'),
  ('13000000-0000-4000-8000-000000000042', 'f2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000043', 'f2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000044', 'f2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000045', 'f2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000046', 'f2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000047', 'f2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000048', 'f2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000049', 'f2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000050', 'f2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000051', 'f2000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000052', 'f2000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000005'),
  ('13000000-0000-4000-8000-000000000053', 'f2000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000054', 'f2000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000005'),
  ('13000000-0000-4000-8000-000000000055', 'f2000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000005'),
  ('13000000-0000-4000-8000-000000000056', 'f2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000057', 'f2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000005'),
  ('13000000-0000-4000-8000-000000000058', 'f2000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000059', 'f2000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000060', 'f2000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000001'),
  ('13000000-0000-4000-8000-000000000061', 'f2000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000003'),
  ('13000000-0000-4000-8000-000000000062', 'f2000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000005'),
  ('13000000-0000-4000-8000-000000000063', 'f2000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000001'),
  ('13000000-0000-4000-8000-000000000064', 'f2000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000065', 'f2000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000066', 'f2000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000005'),
  ('13000000-0000-4000-8000-000000000067', 'f2000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000002'),
  ('13000000-0000-4000-8000-000000000068', 'f2000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000003');

-- 10. Riesgos --------------------------------------------------------------------
INSERT INTO risks (id, project_id, description, probability, impact, severity, mitigation, owner_id, linked_task_id, linked_backlog_item_id, status, created_at) VALUES
  ('14000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Disponibilidad reducida de algún integrante por trabajo o estudios', 'alto', 'alto', 'alto', 'Ítems de 1 a 3 puntos que se puedan reasignar; seguimiento en la reunión semanal.', 'a1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000006', NULL, 'activo', '2026-09-14 10:00:00'),
  ('14000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'El cron interno no se ejecuta porque el backend gratuito se duerme', 'alto', 'medio', 'alto', 'Disparar la generación del reporte desde un workflow programado de GitHub Actions.', 'a1000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000021', 'e1000000-0000-4000-8000-000000000015', 'activo', '2026-09-14 10:00:00'),
  ('14000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'Arranque en frío de Render afecta los tiempos objetivo', 'medio', 'medio', 'medio', 'Medir con el servicio activo, documentar la limitación y despertar el servicio antes de la demo.', 'a1000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000034', NULL, 'activo', '2026-09-14 10:00:00'),
  ('14000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'Subestimación del tablero Kanban con arrastrar y soltar', 'medio', 'bajo', 'bajo', 'Spike de Angular CDK en la primera semana; alternativa por selector de estado.', 'a1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000022', 'e1000000-0000-4000-8000-000000000011', 'mitigado', '2026-09-14 10:00:00'),
  ('14000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'Retraso en el acceso a datos de la municipalidad', 'medio', 'alto', 'alto', 'Usar datos simulados mientras se confirma el acceso y acordar un contacto técnico.', 'a1000000-0000-4000-8000-000000000005', 'f2000000-0000-4000-8000-000000000010', NULL, 'activo', '2026-09-14 10:00:00'),
  ('14000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'Fotos pesadas degradan el rendimiento de la carga', 'bajo', 'medio', 'bajo', 'Comprimir en el cliente antes de subir; límite de 5 MB por foto.', 'a1000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000011', 'e2000000-0000-4000-8000-000000000011', 'mitigado', '2026-09-14 10:00:00');

COMMIT;

-- ==========================================================================
-- OPCIONAL — desplazar las fechas de un proyecto N días (para que el dashboard muestre un avance
-- coherente el día de la demo). Ejemplo: mover Foresite 7 días hacia adelante. Ejecutar por separado.
-- ==========================================================================
-- BEGIN;
-- UPDATE projects      SET start_date = start_date + 7, end_date = end_date + 7 WHERE id = 'b1000000-0000-4000-8000-000000000001';
-- UPDATE sprints       SET start_date = start_date + 7, end_date = end_date + 7 WHERE project_id = 'b1000000-0000-4000-8000-000000000001';
-- UPDATE tasks         SET start_date = start_date + 7, end_date = end_date + 7 WHERE project_id = 'b1000000-0000-4000-8000-000000000001';
-- UPDATE backlog_items SET start_date = start_date + 7, end_date = end_date + 7 WHERE project_id = 'b1000000-0000-4000-8000-000000000001';
-- COMMIT;
