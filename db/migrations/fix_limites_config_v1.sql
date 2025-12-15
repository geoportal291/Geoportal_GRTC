-- Corrige la configuración de la tabla para Límites de Consistencia
-- El error era que config_tabla contenía las fórmulas de cálculo en lugar de la definición de UI.

UPDATE tipo_ensayo
SET config_tabla = '{
  "tables": [
    {
      "key": "humedad_natural",
      "title": "Contenido de Humedad Natural",
      "transposed": true,
      "transposed_header_label": "Descripción",
      "headers": [
        {"key": "label", "label": "Descripción", "type": "static"},
        {"key": "1", "label": "Muestra 1", "type": "input", "input_config": {"type": "number"}},
        {"key": "2", "label": "Muestra 2", "type": "input", "input_config": {"type": "number"}}
      ],
      "rows": [
        {"key": "tara", "label": "Peso Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}}},
        {"key": "humedo", "label": "Peso Suelo Húmedo + Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}}},
        {"key": "seco", "label": "Peso Suelo Seco + Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}}},
        {"key": "agua", "label": "Peso del Agua (gr)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.agua"}}, "2": {"type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.agua"}}}},
        {"key": "suelo_seco", "label": "Peso Suelo Seco (gr)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.suelo_seco"}}, "2": {"type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.suelo_seco"}}}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.humedad"}}, "2": {"type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.humedad"}}}}
      ]
    },
    {
      "key": "limite_liquido",
      "title": "Límite Líquido",
      "transposed": true,
      "transposed_header_label": "Descripción",
      "headers": [
        {"key": "label", "label": "Descripción", "type": "static"},
        {"key": "1", "label": "Punto 1", "type": "input", "input_config": {"type": "number"}},
        {"key": "2", "label": "Punto 2", "type": "input", "input_config": {"type": "number"}},
        {"key": "3", "label": "Punto 3", "type": "input", "input_config": {"type": "number"}}
      ],
      "rows": [
        {"key": "golpes", "label": "Número de Golpes", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}, "3": {"type": "input"}}},
        {"key": "tara", "label": "Peso Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}, "3": {"type": "input"}}},
        {"key": "humedo", "label": "Peso Suelo Húmedo + Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}, "3": {"type": "input"}}},
        {"key": "seco", "label": "Peso Suelo Seco + Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}, "3": {"type": "input"}}},
        {"key": "agua", "label": "Peso del Agua (gr)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.1.agua"}}, "2": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.2.agua"}}, "3": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.3.agua"}}}},
        {"key": "suelo_seco", "label": "Peso Suelo Seco (gr)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.1.suelo_seco"}}, "2": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.2.suelo_seco"}}, "3": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.3.suelo_seco"}}}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.1.humedad"}}, "2": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.2.humedad"}}, "3": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.3.humedad"}}}},
        {"key": "ll_corregido", "label": "Límite Líquido Corregido (%)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.1.ll_corregido"}}, "2": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.2.ll_corregido"}}, "3": {"type": "calculated", "result_config": {"path": "tables.limite_liquido.3.ll_corregido"}}}}
      ]
    },
    {
      "key": "limite_plastico",
      "title": "Límite Plástico",
      "transposed": true,
      "transposed_header_label": "Descripción",
      "headers": [
        {"key": "label", "label": "Descripción", "type": "static"},
        {"key": "1", "label": "Muestra 1", "type": "input", "input_config": {"type": "number"}},
        {"key": "2", "label": "Muestra 2", "type": "input", "input_config": {"type": "number"}}
      ],
      "rows": [
        {"key": "tara", "label": "Peso Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}}},
        {"key": "humedo", "label": "Peso Suelo Húmedo + Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}}},
        {"key": "seco", "label": "Peso Suelo Seco + Tara (gr)", "cell_overrides": {"1": {"type": "input"}, "2": {"type": "input"}}},
        {"key": "agua", "label": "Peso del Agua (gr)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.limite_plastico.1.agua"}}, "2": {"type": "calculated", "result_config": {"path": "tables.limite_plastico.2.agua"}}}},
        {"key": "suelo_seco", "label": "Peso Suelo Seco (gr)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.limite_plastico.1.suelo_seco"}}, "2": {"type": "calculated", "result_config": {"path": "tables.limite_plastico.2.suelo_seco"}}}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "cell_overrides": {"1": {"type": "calculated", "result_config": {"path": "tables.limite_plastico.1.humedad"}}, "2": {"type": "calculated", "result_config": {"path": "tables.limite_plastico.2.humedad"}}}}
      ]
    }
  ]
}'
WHERE descripcion ILIKE '%Límites de Consistencia%' OR descripcion ILIKE '%Limites de Consistencia%';
