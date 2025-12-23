-- Query to identify items without an Entregable assigned
-- Replace [PROJECT_ID] with the actual project ID (e.g., 291)

SELECT 'Alcantarillas' as Tabla, count(*) as Cantidad_Sin_Asignar 
FROM alcantarillas 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Badenes', count(*) 
FROM badenes 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Puentes', count(*) 
FROM puentes 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Muros', count(*) 
FROM muros 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Senales Informativas', count(*) 
FROM senales_informativas 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Senales Preventivas', count(*) 
FROM senales_preventivas 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Hitos Kilometricos', count(*) 
FROM hitos_kilometricos 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Zonas Criticas', count(*) 
FROM zonas_criticas 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291
UNION ALL
SELECT 'Interferencias Electricas', count(*) 
FROM interferencias_electricas 
WHERE (entregable IS NULL OR entregable = '') AND id_proyecto = 291;
