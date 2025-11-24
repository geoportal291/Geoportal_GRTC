-- Paso 1: Encontrar el proceso que está bloqueando la tabla
-- Ejecuta esta consulta para identificar qué procesos están bloqueando a otros.
-- Fíjate en la columna `blocking_id`. Ese es el ID del proceso que está causando el problema.
SELECT
    activity.pid,
    activity.usename,
    activity.query,
    blocking.pid AS blocking_id,
    blocking.query AS blocking_query
FROM
    pg_stat_activity AS activity
JOIN
    pg_stat_activity AS blocking ON blocking.pid = ANY(pg_blocking_pids(activity.pid));

-- Paso 2: Detener el proceso de bloqueo
-- Reemplaza [PID_DEL_PROCESO_BLOQUEANTE] con el número que obtuviste en la columna `blocking_id` de la consulta anterior.
-- Por ejemplo, si el blocking_id es 1234, ejecuta: SELECT pg_terminate_backend(1234);
-- SELECT pg_terminate_backend([PID_DEL_PROCESO_BLOQUEANTE]);

-- Paso 3: Aplicar las correcciones a la base de datos
-- Después de detener el proceso de bloqueo, ejecuta las siguientes consultas.

-- Eliminar la restricción de clave foránea de la tabla progresiva_perfil_estratos
ALTER TABLE public.progresiva_perfil_estratos DROP CONSTRAINT progresiva_perfil_estratos_progresiva_id_fkey;

-- Volver a añadir la restricción con ON DELETE CASCADE
ALTER TABLE public.progresiva_perfil_estratos 
ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_fkey 
FOREIGN KEY (progresiva_id) 
REFERENCES public.progresivas(id) 
ON DELETE CASCADE;

-- Eliminar la restricción de clave foránea de la tabla progresivas (para la relación padre-hijo)
ALTER TABLE public.progresivas DROP CONSTRAINT progresivas_parent_id_fkey;

-- Volver a añadir la restricción con ON DELETE CASCADE
ALTER TABLE public.progresivas 
ADD CONSTRAINT progresivas_parent_id_fkey 
FOREIGN KEY (parent_id) 
REFERENCES public.progresivas(id) 
ON DELETE CASCADE;

-- Paso 4: Verificar conexiones activas (para depuración)
-- Ejecuta esta consulta para ver todas las conexiones activas y sus consultas.
-- Esto es útil si las operaciones de la base de datos se quedan "colgadas".
SELECT
    pid,
    usename,
    datname,
    client_addr,
    backend_start,
    state,
    query_start,
    query
FROM
    pg_stat_activity
WHERE
    datname = current_database() AND state = 'active';
