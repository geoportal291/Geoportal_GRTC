CREATE TABLE alcantarillas_graficos (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    image_index VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add an index for faster lookups by project and index
CREATE INDEX idx_alcantarillas_graficos_proyecto_id ON alcantarillas_graficos(proyecto_id);
CREATE INDEX idx_alcantarillas_graficos_image_index ON alcantarillas_graficos(image_index);