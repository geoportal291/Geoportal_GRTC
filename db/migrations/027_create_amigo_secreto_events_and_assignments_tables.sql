-- db/migrations/027_create_amigo_secreto_events_and_assignments_tables.sql

-- Tabla para almacenar las asignaciones del sorteo
-- Referenciará la tabla 'amigo_secreto_eventos' existente
CREATE TABLE IF NOT EXISTS amigo_secreto_asignaciones (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES amigo_secreto_eventos(id) ON DELETE CASCADE,
    dador_usuario_id INTEGER NOT NULL REFERENCES usuariost(id) ON DELETE CASCADE,
    receptor_usuario_id INTEGER NOT NULL REFERENCES usuariost(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    
    -- Asegurar que un dador solo tenga una asignación por evento
    UNIQUE(evento_id, dador_usuario_id),
    -- Asegurar que un receptor solo sea asignado una vez por evento
    UNIQUE(evento_id, receptor_usuario_id)
);

COMMENT ON TABLE amigo_secreto_asignaciones IS 'Almacena los pares de dador-receptor para cada evento de amigo secreto.';
COMMENT ON COLUMN amigo_secreto_asignaciones.dador_usuario_id IS 'El usuario que da el regalo.';
COMMENT ON COLUMN amigo_secreto_asignaciones.receptor_usuario_id IS 'El usuario que recibe el regalo.';