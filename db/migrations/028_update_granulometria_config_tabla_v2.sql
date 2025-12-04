DO $$
DECLARE
    v_config JSONB;
BEGIN
    -- Obtener la configuración actual para Granulometría (ID=1)
    RAISE NOTICE 'Obteniendo config_tabla actual para tipo_ensayo_id=1...';
    SELECT config_tabla INTO v_config FROM tipo_ensayo WHERE id = 1;

    -- Paso 1: Actualizar el título de los campos generales
    RAISE NOTICE 'Actualizando título de campos generales...';
    v_config := jsonb_set(
        v_config,
        '{general_fields,title}',
        '"Datos Generales"'::JSONB
    );

    -- Paso 2: Actualizar la lista de campos en la sección de campos generales
    RAISE NOTICE 'Reemplazando la lista de campos generales...';
    v_config := jsonb_set(
        v_config,
        '{general_fields,fields}',
        '[{ "key": "peso_total", "type": "number", "label": "Peso Total (g)" }, { "key": "peso_fraccion_fina", "type": "number", "label": "Peso Fracción Fina (g)" }, { "key": "gradacion", "type": "text", "label": "Gradación" }]'::JSONB
    );

    -- Paso 3: Actualizar la lista de tamices (rows) en la tabla de granulometría
    RAISE NOTICE 'Reemplazando la lista de tamices (rows)...';
    v_config := jsonb_set(
        v_config,
        '{tables,granulometria,rows}',
        '[{ "tamiz": "3\"", "key": "t3", "mm": 76.2 }, { "tamiz": "2 1/2\"", "key": "t2_5", "mm": 63 }, { "tamiz": "2\"", "key": "t2", "mm": 50.8 }, { "tamiz": "1 1/2\"", "key": "t1_5", "mm": 38.1 }, { "tamiz": "1\"", "key": "t1", "mm": 25.4 }, { "tamiz": "3/4\"", "key": "t3_4", "mm": 19.1 }, { "tamiz": "1/2\"", "key": "t1_2", "mm": 12.5 }, { "tamiz": "3/8\"", "key": "t3_8", "mm": 9.5 }, { "tamiz": "1/4\"", "key": "t1_4", "mm": 6.3 }, { "tamiz": "N° 4", "key": "n4", "mm": 4.75 }, { "tamiz": "N° 8", "key": "n8", "mm": 2.36 }, { "tamiz": "N° 10", "key": "n10", "mm": 2.00 }, { "tamiz": "N° 16", "key": "n16", "mm": 1.18 }, { "tamiz": "N° 20", "key": "n20", "mm": 0.850 }, { "tamiz": "N° 30", "key": "n30", "mm": 0.600 }, { "tamiz": "N° 40", "key": "n40", "mm": 0.425 }, { "tamiz": "N° 50", "key": "n50", "mm": 0.300 }, { "tamiz": "N° 60", "key": "n60", "mm": 0.250 }, { "tamiz": "N° 100", "key": "n100", "mm": 0.150 }, { "tamiz": "N° 140", "key": "n140", "mm": 0.106 }, { "tamiz": "N° 200", "key": "n200", "mm": 0.075 }, { "tamiz": "<200", "key": "fondo", "mm": null, "cell_overrides": { "retenido": { "type": "static", "static_text": "---" } } }, { "tamiz": "Total", "key": "total", "mm": null, "porc_acum": {"type": "static", "static_text": ""}, "porc_pasa": {"type": "static", "static_text": ""}, "porc_retenido": {"type": "static", "static_text": ""}, "cell_overrides": { "retenido": { "type": "calculated", "result_config": { "key": "granulometria.totalRetenido", "scope": "global" } } } }]'::JSONB
    );

    -- Aplicar la configuración final y actualizada a la base de datos
    RAISE NOTICE 'Aplicando configuración final a la base de datos...';
    UPDATE tipo_ensayo SET config_tabla = v_config WHERE id = 1;

    RAISE NOTICE '¡Actualización de config_tabla para Granulometría (ID=1) completada!';
END $$
