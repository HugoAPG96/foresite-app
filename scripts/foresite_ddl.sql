-- ==========================================================
-- Foresite — Script DDL (PostgreSQL / Neon)
-- IDs como VARCHAR(36), generados en la aplicación con
-- crypto.randomUUID() (NestJS), no con DEFAULT de la base de
-- datos — evita depender de extensiones (uuid-ossp/pgcrypto)
-- que Neon no siempre permite activar. Ver BaseEntity en el
-- backend para el detalle de esta decisión.
-- ==========================================================

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE users (
    id            VARCHAR(36) PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- projects
-- ---------------------------------------------------------
CREATE TABLE projects (
    id           VARCHAR(36) PRIMARY KEY,
    name         VARCHAR(120) NOT NULL,
    objective    TEXT,
    scope        TEXT,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    health_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    semaforo     VARCHAR(10) NOT NULL DEFAULT 'verde'
                 CHECK (semaforo IN ('verde', 'ambar', 'rojo')),
    created_by   VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_projects_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_projects_created_by ON projects(created_by);

-- ---------------------------------------------------------
-- project_members
-- ---------------------------------------------------------
CREATE TABLE project_members (
    id         VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(60),

    CONSTRAINT uq_project_members UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- ---------------------------------------------------------
-- phases
-- ---------------------------------------------------------
CREATE TABLE phases (
    id          VARCHAR(36) PRIMARY KEY,
    project_id  VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_phases_project ON phases(project_id);

-- ---------------------------------------------------------
-- sprints
-- ---------------------------------------------------------
CREATE TABLE sprints (
    id         VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number     INT NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,

    CONSTRAINT uq_sprints_project_number UNIQUE (project_id, number),
    CONSTRAINT chk_sprints_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_sprints_project ON sprints(project_id);

-- ---------------------------------------------------------
-- backlog_items
-- (se crea antes que tasks porque tasks.backlog_item_id la referencia)
-- ---------------------------------------------------------
CREATE TABLE backlog_items (
    id                   VARCHAR(36) PRIMARY KEY,
    project_id           VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id             VARCHAR(36) REFERENCES phases(id) ON DELETE SET NULL,
    sprint_id            VARCHAR(36) REFERENCES sprints(id) ON DELETE SET NULL,
    type                 VARCHAR(10) NOT NULL
                         CHECK (type IN ('epica', 'hu', 'spike', 'bug', 'enabler')),
    code                 VARCHAR(10) NOT NULL,
    title                VARCHAR(160) NOT NULL,
    description          TEXT,
    acceptance_criteria  TEXT,
    priority             VARCHAR(10) NOT NULL DEFAULT 'media'
                         CHECK (priority IN ('alta', 'media', 'baja')),
    estimation           NUMERIC(5,2) NOT NULL DEFAULT 0,
    status               VARCHAR(20) NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open', 'doing', 'in_progress', 'done')),
    start_date           DATE,
    end_date             DATE,
    dependency_id        VARCHAR(36) REFERENCES backlog_items(id) ON DELETE SET NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_backlog_items_project_code UNIQUE (project_id, code)
);

CREATE INDEX idx_backlog_items_project ON backlog_items(project_id);
CREATE INDEX idx_backlog_items_sprint ON backlog_items(sprint_id);
CREATE INDEX idx_backlog_items_phase ON backlog_items(phase_id);

-- ---------------------------------------------------------
-- backlog_item_responsables (N:M — el backlog admite varios responsables)
-- ---------------------------------------------------------
CREATE TABLE backlog_item_responsables (
    id              VARCHAR(36) PRIMARY KEY,
    backlog_item_id VARCHAR(36) NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
    user_id         VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_backlog_item_responsables UNIQUE (backlog_item_id, user_id)
);

CREATE INDEX idx_bir_backlog_item ON backlog_item_responsables(backlog_item_id);
CREATE INDEX idx_bir_user ON backlog_item_responsables(user_id);

-- ---------------------------------------------------------
-- tasks (Cronograma RACI)
-- ---------------------------------------------------------
CREATE TABLE tasks (
    id                VARCHAR(36) PRIMARY KEY,
    project_id        VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id          VARCHAR(36) NOT NULL REFERENCES phases(id) ON DELETE RESTRICT,
    backlog_item_id   VARCHAR(36) REFERENCES backlog_items(id) ON DELETE SET NULL,
    code              VARCHAR(10) NOT NULL,
    title             VARCHAR(160) NOT NULL,
    responsible_id    VARCHAR(36) NOT NULL REFERENCES users(id),
    accountable_id    VARCHAR(36) NOT NULL REFERENCES users(id),
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    duration_days     INT NOT NULL,
    percent_complete  NUMERIC(5,2) NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                      CHECK (status IN ('pendiente', 'en_progreso', 'completada')),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tasks_project_code UNIQUE (project_id, code),
    CONSTRAINT chk_tasks_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_phase ON tasks(phase_id);
CREATE INDEX idx_tasks_backlog_item ON tasks(backlog_item_id);
CREATE INDEX idx_tasks_responsible ON tasks(responsible_id);

-- ---------------------------------------------------------
-- task_consulted (N:M — "Consultado" del RACI, puede ser varias personas)
-- ---------------------------------------------------------
CREATE TABLE task_consulted (
    id      VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_task_consulted UNIQUE (task_id, user_id)
);

CREATE INDEX idx_task_consulted_task ON task_consulted(task_id);

-- ---------------------------------------------------------
-- task_informed (N:M — "Informado" del RACI, puede ser varias personas)
-- ---------------------------------------------------------
CREATE TABLE task_informed (
    id      VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_task_informed UNIQUE (task_id, user_id)
);

CREATE INDEX idx_task_informed_task ON task_informed(task_id);

-- ---------------------------------------------------------
-- risks
-- ---------------------------------------------------------
CREATE TABLE risks (
    id                      VARCHAR(36) PRIMARY KEY,
    project_id              VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description             TEXT NOT NULL,
    probability             VARCHAR(10) NOT NULL CHECK (probability IN ('alto', 'medio', 'bajo')),
    impact                  VARCHAR(10) NOT NULL CHECK (impact IN ('alto', 'medio', 'bajo')),
    severity                VARCHAR(10) NOT NULL CHECK (severity IN ('alto', 'medio', 'bajo')),
    mitigation              TEXT NOT NULL,
    owner_id                VARCHAR(36) NOT NULL REFERENCES users(id),
    linked_task_id          VARCHAR(36) REFERENCES tasks(id) ON DELETE SET NULL,
    linked_backlog_item_id  VARCHAR(36) REFERENCES backlog_items(id) ON DELETE SET NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'activo'
                            CHECK (status IN ('activo', 'mitigado', 'cerrado')),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risks_project ON risks(project_id);
CREATE INDEX idx_risks_status ON risks(status);
