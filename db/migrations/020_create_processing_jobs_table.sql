-- db/migrations/020_create_processing_jobs_table.sql

CREATE TABLE processing_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(255) NOT NULL,
    project_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    payload JSONB,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processing_jobs_updated_at
BEFORE UPDATE ON processing_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN processing_jobs.job_type IS 'Type of the job, e.g., ''graphics_excel_processing''';
COMMENT ON COLUMN processing_jobs.status IS 'Current status of the job (pending, processing, completed, failed)';
COMMENT ON COLUMN processing_jobs.payload IS 'Data required for the job, e.g., { "fileUrl": "..." }';
COMMENT ON COLUMN processing_jobs.result IS 'Result of the job, e.g., { "message": "..." } or { "error": "..." }';

