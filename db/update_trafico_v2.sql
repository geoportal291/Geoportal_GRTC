-- ALTER TABLE para persistir datos extraídos de Excel en Tráfico V2
ALTER TABLE public.elementos_trafico ADD COLUMN datos_extraidos JSONB;
