-- Migration to create tables for the Amigo Secreto (Secret Santa) feature

BEGIN;

-- Table to store the overall state of a secret santa event
CREATE TABLE IF NOT EXISTS amigo_secreto_eventos (
    id SERIAL PRIMARY KEY,
    nombre_evento VARCHAR(255) NOT NULL,
    fecha_evento TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    es_sorteo_iniciado BOOLEAN DEFAULT FALSE NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table to store the assignments for each event
CREATE TABLE IF NOT EXISTS amigo_secreto_asignaciones (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES amigo_secreto_eventos(id) ON DELETE CASCADE,
    dador_usuario_id INTEGER NOT NULL REFERENCES usuariost(id) ON DELETE CASCADE,
    receptor_usuario_id INTEGER NOT NULL REFERENCES usuariost(id) ON DELETE CASCADE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evento_id, dador_usuario_id) -- A user can only give one gift per event
);

-- Insert a default event to work with
-- This simplifies the logic for now, as we'll always work with event ID 1
INSERT INTO amigo_secreto_eventos (id, nombre_evento)
VALUES (1, 'Amigo Secreto General')
ON CONFLICT (id) DO NOTHING;

COMMIT;
