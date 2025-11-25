-- Añade las columnas para el material pasante del tamiz 200 y el total retenido en la fracción gruesa
ALTER TABLE public.granulometria_ensayos
ADD COLUMN retenido_menor_200 NUMERIC(10, 2),
ADD COLUMN total_retenido NUMERIC(10, 2);
