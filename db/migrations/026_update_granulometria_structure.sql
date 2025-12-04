DO $$
DECLARE
    -- 1. Declarar variables
    v_tipo_ensayo_id INT;
    v_seccion_id INT;
    v_config_tabla JSONB;
BEGIN
    -- 2. Asignar directamente el ID 1 para Granulometría
    v_tipo_ensayo_id := 1;

    -- 3. Obtener el ID de la sección de 'CamposGenerales' para este tipo de ensayo
    SELECT id INTO v_seccion_id
    FROM formulario_secciones
    WHERE tipo_ensayo_id = v_tipo_ensayo_id AND componente_key = 'CamposGenerales';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró una sección de CamposGenerales para el tipo de ensayo ID %', v_tipo_ensayo_id;
    END IF;

    -- 4. Eliminar los campos generales antiguos de la sección
    RAISE NOTICE 'Eliminando campos generales antiguos de la sección ID %...', v_seccion_id;
    DELETE FROM formulario_campos
    WHERE seccion_id = v_seccion_id;

    -- 5. Insertar los nuevos campos generales
    RAISE NOTICE 'Insertando nuevos campos generales...';
    INSERT INTO formulario_campos (seccion_id, name, label, type, required, orden)
    VALUES
        (v_seccion_id, 'peso_total', 'Peso Total (g)', 'number', true, 10),
        (v_seccion_id, 'peso_fraccion_fina', 'Peso Fracción Fina', 'number', true, 20),
        (v_seccion_id, 'gradacion', 'Gradación', 'text', false, 30);

    -- 6. Obtener la configuración de tabla actual
    SELECT config_tabla INTO v_config_tabla FROM tipo_ensayo WHERE id = v_tipo_ensayo_id;

    -- 7. Reemplazar SOLAMENTE el array 'rows' con la nueva lista de tamices
    RAISE NOTICE 'Actualizando la lista de tamices en config_tabla...';
    v_config_tabla := jsonb_set(
        v_config_tabla,
        '{rows}',
        '[
            {"key": "t3", "label": "3\"", "mm": 76.2},
            {"key": "t2_5", "label": "2 1/2\"", "mm": 63},
            {"key": "t2", "label": "2\"", "mm": 50.8},
            {"key": "t1_5", "label": "1 1/2\"", "mm": 38.1},
            {"key": "t1", "label": "1\"", "mm": 25.4},
            {"key": "t3_4", "label": "3/4\"", "mm": 19.1},
            {"key": "t1_2", "label": "1/2\"", "mm": 12.5},
            {"key": "t3_8", "label": "3/8\"", "mm": 9.5},
            {"key": "t1_4", "label": "1/4\"", "mm": 6.3},
            {"key": "n4", "label": "N° 4", "mm": 4.75},
            {"key": "n8", "label": "N° 8", "mm": 2.36},
            {"key": "n10", "label": "N° 10", "mm": 2.00},
            {"key": "n16", "label": "N° 16", "mm": 1.18},
            {"key": "n20", "label": "N° 20", "mm": 0.85},
            {"key": "n30", "label": "N° 30", "mm": 0.600},
            {"key": "n40", "label": "N° 40", "mm": 0.425},
            {"key": "n50", "label": "N° 50", "mm": 0.300},
            {"key": "n60", "label": "N° 60", "mm": 0.250},
            {"key": "n100", "label": "N° 100", "mm": 0.150},
            {"key": "n140", "label": "N° 140", "mm": 0.106},
            {"key": "n200", "label": "N° 200", "mm": 0.075}
        ]'::JSONB
    );

    -- 8. Actualizar la columna config_tabla en la base de datos
    UPDATE tipo_ensayo
    SET config_tabla = v_config_tabla
    WHERE id = v_tipo_ensayo_id;

    RAISE NOTICE '¡Actualización completada para el ensayo de Granulometría!';
END $$;