-- Corrige la configuración de la tabla para Límites de Consistencia (V2)
-- Estructura de datos: Filas = Muestras, Columnas = Propiedades.
-- Visualización: Transpuesta (Propiedades en filas, Muestras en columnas).
-- Esto alinea los datos con las fórmulas existentes (tables.tabla.MUESTRA.PROPIEDAD).

UPDATE tipo_ensayo
SET config_tabla = '{
  "tables": [
    {
      "key": "humedad_natural",
      "title": "Contenido de Humedad Natural",
      "transposed": true,
      "transposed_header_label": "Descripción",
      "headers": [
        {"key": "tara", "label": "Peso Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "humedo", "label": "Peso Suelo Húmedo + Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "seco", "label": "Peso Suelo Seco + Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "agua", "label": "Peso del Agua (gr)", "type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.agua"}},
        {"key": "suelo_seco", "label": "Peso Suelo Seco (gr)", "type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.suelo_seco"}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "type": "calculated", "result_config": {"path": "tables.humedad_natural.{row_key}.humedad"}}
      ],
      "rows": [
        {
          "key": "1", 
          "label": "Muestra 1", 
          "cell_overrides": {
             "tara": {"type": "input"}, "humedo": {"type": "input"}, "seco": {"type": "input"}
          }
        },
        {
          "key": "2", 
          "label": "Muestra 2",
          "cell_overrides": {
             "tara": {"type": "input"}, "humedo": {"type": "input"}, "seco": {"type": "input"}
          }
        }
      ]
    },
    {
      "key": "limite_liquido",
      "title": "Límite Líquido",
      "transposed": true,
      "transposed_header_label": "Descripción",
      "headers": [
        {"key": "golpes", "label": "Número de Golpes", "type": "input", "input_config": {"type": "number"}},
        {"key": "tara", "label": "Peso Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "humedo", "label": "Peso Suelo Húmedo + Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "seco", "label": "Peso Suelo Seco + Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "agua", "label": "Peso del Agua (gr)", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.agua"}},
        {"key": "suelo_seco", "label": "Peso Suelo Seco (gr)", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.suelo_seco"}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.humedad"}},
        {"key": "ll_corregido", "label": "Límite Líquido Corregido (%)", "type": "calculated", "result_config": {"path": "tables.limite_liquido.{row_key}.ll_corregido"}}
      ],
      "rows": [
        {"key": "1", "label": "Punto 1", "cell_overrides": {}},
        {"key": "2", "label": "Punto 2", "cell_overrides": {}},
        {"key": "3", "label": "Punto 3", "cell_overrides": {}}
      ]
    },
    {
      "key": "limite_plastico",
      "title": "Límite Plástico",
      "transposed": true,
      "transposed_header_label": "Descripción",
      "headers": [
        {"key": "tara", "label": "Peso Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "humedo", "label": "Peso Suelo Húmedo + Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "seco", "label": "Peso Suelo Seco + Tara (gr)", "type": "input", "input_config": {"type": "number"}},
        {"key": "agua", "label": "Peso del Agua (gr)", "type": "calculated", "result_config": {"path": "tables.limite_plastico.{row_key}.agua"}},
        {"key": "suelo_seco", "label": "Peso Suelo Seco (gr)", "type": "calculated", "result_config": {"path": "tables.limite_plastico.{row_key}.suelo_seco"}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "type": "calculated", "result_config": {"path": "tables.limite_plastico.{row_key}.humedad"}}
      ],
      "rows": [
        {"key": "1", "label": "Muestra 1", "cell_overrides": {}},
        {"key": "2", "label": "Muestra 2", "cell_overrides": {}}
      ]
    }
  ]
}'
WHERE id = 2 AND (descripcion ILIKE '%Límites de Consistencia%' OR descripcion ILIKE '%Limites de Consistencia%');
