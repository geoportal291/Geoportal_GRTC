ALTER TABLE zonas_criticas
ADD COLUMN numero_seguimiento INTEGER DEFAULT 1;

-- If 'tipo' was missing or needed changes, we would do it here, but it exists.
-- Adding comment to verify connection.
COMMENT ON COLUMN zonas_criticas.numero_seguimiento IS '1 for Left Zone (B-G), 2 for Right Zone (L-P)';
