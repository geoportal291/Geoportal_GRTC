-- 031_create_invvial_excels_table.sql

CREATE TABLE invvial_excels (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL,
    excel_url VARCHAR(255) NOT NULL,
    entregable_num INTEGER NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by_user_id INTEGER,
    original_filename VARCHAR(255),
    CONSTRAINT fk_proyecto
        FOREIGN KEY(id_proyecto)
        REFERENCES proyectos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY(uploaded_by_user_id)
        REFERENCES usuariost(id)
        ON DELETE SET NULL
);

-- Adding a unique constraint to prevent duplicate entries for the same project and entregable number
ALTER TABLE invvial_excels
ADD CONSTRAINT uq_proyecto_entregable UNIQUE (id_proyecto, entregable_num);

COMMENT ON TABLE invvial_excels IS 'Stores URLs of Excel files related to invvial projects, uploaded via the system.';
COMMENT ON COLUMN invvial_excels.id IS 'Unique identifier for the Excel file record.';
COMMENT ON COLUMN invvial_excels.id_proyecto IS 'Foreign key to the projects table, linking the file to a specific project.';
COMMENT ON COLUMN invvial_excels.excel_url IS 'URL of the uploaded Excel file, typically stored on a cloud service like Vercel Blob.';
COMMENT ON COLUMN invvial_excels.entregable_num IS 'Identifier for the deliverable number (e.g., 1, 2, 3).';
COMMENT ON COLUMN invvial_excels.uploaded_at IS 'Timestamp of when the file was uploaded.';
COMMENT ON COLUMN invvial_excels.uploaded_by_user_id IS 'Foreign key to the users table, identifying who uploaded the file.';
COMMENT ON COLUMN invvial_excels.original_filename IS 'The original name of the uploaded file.';
