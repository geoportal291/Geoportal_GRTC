-- Semillas iniciales para el Diccionario NLP de Suelos
-- Mapea nombres de campo comunes a clasificaciones estándar y colores de alta calidad para el Visor 3D.

INSERT INTO public.suelos_diccionario_nlp (nombre_original_excel, clasificacion_sucs, clasificacion_aashto, color_hex_sugerido, es_verificado_por_humano)
VALUES 
-- GRAVAS (G) - Tonos Grises y Marrones Oscuros
('Grava bien graduada', 'GW', 'A-1-a', '#3E3E3E', true),
('Grava pobremente graduada', 'GP', 'A-1-a', '#4A4A4A', true),
('Grava limosa', 'GM', 'A-1-b', '#5D5D5A', true),
('Grava arcillosa', 'GC', 'A-2-4', '#5C4033', true),
('Piedra chancada', 'GP', 'A-1-a', '#696969', true),
('Boloneria', 'GP', 'A-1-a', '#2F2F2F', true),

-- ARENAS (S) - Tonos Amarillos y Ocres
('Arena bien graduada', 'SW', 'A-3', '#E9C46A', true),
('Arena pobremente graduada', 'SP', 'A-3', '#F4A261', true),
('Arena limosa', 'SM', 'A-2-4', '#D4A373', true),
('Arena arcillosa', 'SC', 'A-2-6', '#BC6C25', true),
('Arena de rio', 'SW', 'A-3', '#DEAB5D', true),

-- LIMOS (M) - Tonos Verdosos y Grisáceos
('Limo de baja plasticidad', 'ML', 'A-4', '#8E9AAF', true),
('Limo de alta plasticidad', 'MH', 'A-5', '#6B705C', true),
('Limo arcilloso', 'ML-CL', 'A-6', '#A5A58D', true),

-- ARCILLAS (C) - Tonos Rojizos y Cafés
('Arcilla de baja plasticidad', 'CL', 'A-6', '#B5838D', true),
('Arcilla de alta plasticidad', 'CH', 'A-7-6', '#6D597A', true),
('Arcilla limosa', 'CL-ML', 'A-4', '#E5989B', true),
('Tierra vegetal', 'OL', 'A-8', '#2D6A4F', true),
('Limo organico', 'OL', 'A-8', '#1B4332', true),

-- ROCA
('Roca sana', 'R', 'N/A', '#000000', true),
('Roca fracturada', 'R', 'N/A', '#1A1A1B', true),
('Basalto', 'R', 'N/A', '#121212', true)

ON CONFLICT (nombre_original_excel) DO UPDATE SET
    clasificacion_sucs = EXCLUDED.clasificacion_sucs,
    clasificacion_aashto = EXCLUDED.clasificacion_aashto,
    color_hex_sugerido = EXCLUDED.color_hex_sugerido,
    es_verificado_por_humano = EXCLUDED.es_verificado_por_humano;
