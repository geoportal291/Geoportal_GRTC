-- Migración para añadir campos de contenido de humedad a las tablas de límites

-- Añadir campos para contenido de humedad a la tabla de límite líquido
ALTER TABLE public.limite_liquido_ensayos
ADD COLUMN ll_ensayo1_contenido_humedad NUMERIC(10, 2),
ADD COLUMN ll_ensayo2_contenido_humedad NUMERIC(10, 2),
ADD COLUMN ll_ensayo3_contenido_humedad NUMERIC(10, 2);

-- Añadir campos para contenido de humedad a la tabla de límite plástico
ALTER TABLE public.limite_plastico_ensayos
ADD COLUMN lp_ensayo1_contenido_humedad NUMERIC(10, 2),
ADD COLUMN lp_ensayo2_contenido_humedad NUMERIC(10, 2);

-- Opcional: Añadir también las columnas para los resultados de LL, LP e IP si no existen
-- Descomenta las siguientes líneas si estas columnas no están en la tabla principal 'ensayos' o en sus propias tablas
-- ALTER TABLE public.limite_liquido_ensayos ADD COLUMN ll_resultado NUMERIC(10, 2);
-- ALTER TABLE public.limite_plastico_ensayos ADD COLUMN lp_resultado NUMERIC(10, 2);
-- ALTER TABLE public.limite_plastico_ensayos ADD COLUMN ip_resultado NUMERIC(10, 2);
