
-- Tabla para el historial de acciones en proyectos
CREATE TABLE public.proyecto_historial (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL,
    accion VARCHAR(100) NOT NULL, -- e.g., 'ASIGNACION_USUARIO', 'DESASIGNACION_USUARIO', 'CREACION_PROYECTO'
    actor_id INTEGER NOT NULL, -- ID del usuario que realizó la acción
    fecha TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    detalles TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES public.usuariost(id) ON DELETE RESTRICT
);
