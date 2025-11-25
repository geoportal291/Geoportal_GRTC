-- db/migrations/026_create_amigo_secreto_participantes_table.sql

CREATE TABLE IF NOT EXISTS amigo_secreto_participantes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuariost(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE amigo_secreto_participantes IS 'Almacena los usuarios que han sido seleccionados para participar en el evento Amigo Secreto.';
COMMENT ON COLUMN amigo_secreto_participantes.usuario_id IS 'ID del usuario participante.';

-- Opcional: Para empezar, se puede limpiar la tabla si ya existía de alguna prueba anterior.
TRUNCATE TABLE amigo_secreto_participantes RESTART IDENTITY;
