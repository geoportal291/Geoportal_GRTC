
-- Actualiza la configuración de exportación a Excel para el tipo de ensayo "Límites de Consistencia" (ID=2)
-- Esta configuración utiliza un transformador de datos personalizado para pivotar las muestras a un formato de tabla ancha.
UPDATE tipo_ensayo
SET config_export_excel = '{
  "sheetName": "Límites de Consistencia",
  "layout": "multi_tabla_vertical",
  "transformer": "pivotLimites",
  "tablas": [
    {
      "titulo": "Determinación de los Límites de Consistencia",
      "headers": [
        {
          "header": "Límite Líquido - Muestra 1",
          "subheaders": [
            { "header": "N° Recipiente", "key": "ll_recipiente_nro_1", "width": 12 },
            { "header": "N° Golpes", "key": "ll_n_golpes_1", "width": 10 },
            { "header": "P.H.R. (g)", "key": "ll_peso_suelo_humedo_recipiente_1", "width": 12 },
            { "header": "P.S.R. (g)", "key": "ll_peso_suelo_seco_recipiente_1", "width": 12 },
            { "header": "P. Agua (g)", "key": "ll_peso_agua_1", "width": 12 },
            { "header": "P. Recipiente (g)", "key": "ll_peso_recipiente_1", "width": 12 },
            { "header": "P.S.S. (g)", "key": "ll_peso_suelo_seco_1", "width": 12 },
            { "header": "Humedad (%)", "key": "ll_humedad_1", "width": 12 }
          ]
        },
        {
          "header": "Límite Líquido - Muestra 2",
          "subheaders": [
            { "header": "N° Recipiente", "key": "ll_recipiente_nro_2", "width": 12 },
            { "header": "N° Golpes", "key": "ll_n_golpes_2", "width": 10 },
            { "header": "P.H.R. (g)", "key": "ll_peso_suelo_humedo_recipiente_2", "width": 12 },
            { "header": "P.S.R. (g)", "key": "ll_peso_suelo_seco_recipiente_2", "width": 12 },
            { "header": "P. Agua (g)", "key": "ll_peso_agua_2", "width": 12 },
            { "header": "P. Recipiente (g)", "key": "ll_peso_recipiente_2", "width": 12 },
            { "header": "P.S.S. (g)", "key": "ll_peso_suelo_seco_2", "width": 12 },
            { "header": "Humedad (%)", "key": "ll_humedad_2", "width": 12 }
          ]
        },
        {
          "header": "Límite Líquido - Muestra 3",
          "subheaders": [
            { "header": "N° Recipiente", "key": "ll_recipiente_nro_3", "width": 12 },
            { "header": "N° Golpes", "key": "ll_n_golpes_3", "width": 10 },
            { "header": "P.H.R. (g)", "key": "ll_peso_suelo_humedo_recipiente_3", "width": 12 },
            { "header": "P.S.R. (g)", "key": "ll_peso_suelo_seco_recipiente_3", "width": 12 },
            { "header": "P. Agua (g)", "key": "ll_peso_agua_3", "width": 12 },
            { "header": "P. Recipiente (g)", "key": "ll_peso_recipiente_3", "width": 12 },
            { "header": "P.S.S. (g)", "key": "ll_peso_suelo_seco_3", "width": 12 },
            { "header": "Humedad (%)", "key": "ll_humedad_3", "width": 12 }
          ]
        },
        {
          "header": "Límite Plástico - Muestra 1",
          "subheaders": [
            { "header": "N° Recipiente", "key": "lp_recipiente_nro_1", "width": 12 },
            { "header": "P.H.R. (g)", "key": "lp_peso_suelo_humedo_recipiente_1", "width": 12 },
            { "header": "P.S.R. (g)", "key": "lp_peso_suelo_seco_recipiente_1", "width": 12 },
            { "header": "P. Agua (g)", "key": "lp_peso_agua_1", "width": 12 },
            { "header": "P. Recipiente (g)", "key": "lp_peso_recipiente_1", "width": 12 },
            { "header": "P.S.S. (g)", "key": "lp_peso_suelo_seco_1", "width": 12 },
            { "header": "Humedad (%)", "key": "lp_humedad_1", "width": 12 }
          ]
        },
        {
          "header": "Límite Plástico - Muestra 2",
          "subheaders": [
            { "header": "N° Recipiente", "key": "lp_recipiente_nro_2", "width": 12 },
            { "header": "P.H.R. (g)", "key": "lp_peso_suelo_humedo_recipiente_2", "width": 12 },
            { "header": "P.S.R. (g)", "key": "lp_peso_suelo_seco_recipiente_2", "width": 12 },
            { "header": "P. Agua (g)", "key": "lp_peso_agua_2", "width": 12 },
            { "header": "P. Recipiente (g)", "key": "lp_peso_recipiente_2", "width": 12 },
            { "header": "P.S.S. (g)", "key": "lp_peso_suelo_seco_2", "width": 12 },
            { "header": "Humedad (%)", "key": "lp_humedad_2", "width": 12 }
          ]
        },
        {
          "header": "Resultados",
          "subheaders": [
            { "header": "Límite Líquido (%)", "key": "limite_liquido", "width": 15 },
            { "header": "Límite Plástico (%)", "key": "limite_plastico", "width": 15 },
            { "header": "Índice de Plasticidad", "key": "indice_plasticidad", "width": 15 },
            { "header": "Índice de Fluidez", "key": "indice_fluidez", "width": 15 }
          ]
        }
      ]
    }
  ]
}'::jsonb
WHERE id = 2;
