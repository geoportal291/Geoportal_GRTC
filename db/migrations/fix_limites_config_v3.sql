-- Corrige la configuración de la tabla para Límites de Consistencia (V3 - Estilo MTC)
-- Se añaden campos para "Código de Recipiente" y se ajustan las etiquetas.

UPDATE tipo_ensayo
SET config_tabla = '{
  "tables": [
    {
      "key": "humedad_natural",
      "title": "ENSAYO DE HUMEDAD NATURAL - MTC E 108",
      "transposed": true,
      "transposed_header_label": "Ensayo",
      "headers": [
        {"key": "codigo", "label": "Código Cápsula", "type": "input", "input_config": {"type": "text"}},
        {"key": "tara", "label": "Peso de Cápsula (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "humedo", "label": "Peso Cápsula + Suelo Húmedo (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "seco", "label": "Peso Cápsula + Suelo Seco (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "agua", "label": "Peso del Agua (g)", "type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.agua"}},
        {"key": "suelo_seco", "label": "Peso del Suelo Seco (g)", "type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.suelo_seco"}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.humedad"}}
      ],
      "rows": [
        {
          "key": "1", 
          "label": "Muestra 1", 
          "cell_overrides": {
             "codigo": {"type": "input"}, "tara": {"type": "input"}, "humedo": {"type": "input"}, "seco": {"type": "input"}
          }
        },
        {
          "key": "2", 
          "label": "Muestra 2",
          "cell_overrides": {
             "codigo": {"type": "input"}, "tara": {"type": "input"}, "humedo": {"type": "input"}, "seco": {"type": "input"}
          }
        }
      ]
    },
    {
      "key": "limite_liquido",
      "title": "Límite Líquido - MTC E 110",
      "transposed": true,
      "transposed_header_label": "Ensayo",
      "headers": [
        {"key": "golpes", "label": "Nº de Golpes", "type": "input", "input_config": {"type": "number"}},
        {"key": "codigo", "label": "Cod. Recipiente", "type": "input", "input_config": {"type": "text"}},
        {"key": "tara", "label": "Peso del recipiente (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "humedo", "label": "Recip. + suelo húmedo (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "seco", "label": "Recip. + suelo seco (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "agua", "label": "Peso agua (g)", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.agua"}},
        {"key": "suelo_seco", "label": "Peso suelo seco (g)", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.suelo_seco"}},
        {"key": "humedad", "label": "% de Humedad", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.humedad"}},
        {"key": "ll_corregido", "label": "Límite Líquido Corregido (%)", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.ll_corregido"}}
      ],
      "rows": [
        {"key": "1", "label": "1", "cell_overrides": {}},
        {"key": "2", "label": "2", "cell_overrides": {}},
        {"key": "3", "label": "3", "cell_overrides": {}}
      ]
    },
    {
      "key": "limite_plastico",
      "title": "Límite Plástico - MTC E 111",
      "transposed": true,
      "transposed_header_label": "Ensayo",
      "headers": [
        {"key": "codigo", "label": "Cod. Recipiente", "type": "input", "input_config": {"type": "text"}},
        {"key": "tara", "label": "Peso del recipiente (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "humedo", "label": "Recip. + suelo húmedo (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "seco", "label": "Recip. + suelo seco (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "agua", "label": "Peso Agua (g)", "type": "calculated", "result_config": {"path": "tables.limite_plastico.{row_key}.agua"}},
        {"key": "suelo_seco", "label": "Peso Suelo seco (g)", "type": "calculated", "result_config": {"path": "tables.limite_plastico.{row_key}.suelo_seco"}},
        {"key": "humedad", "label": "% de Humedad", "type": "calculated", "result_config": {"path": "tables.limite_plastico.{row_key}.humedad"}}
      ],
      "rows": [
        {"key": "1", "label": "1", "cell_overrides": {}},
        {"key": "2", "label": "2", "cell_overrides": {}}
      ]
    }
  ]
}'
WHERE id = 2;
