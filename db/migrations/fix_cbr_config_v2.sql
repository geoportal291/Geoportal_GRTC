-- Migración Configuración CBR V2 (Con Campos de Cabecera)
-- Añade inputs de fecha/hora/molde encima de las tablas específicas

UPDATE tipo_ensayo
SET 
  config_tabla = '{
  "tables": [
    {
      "key": "compactacion",
      "title": "Ensayo de Compactación CBR",
      "transposed": true,
      "transposed_header_label": "Variable",
      "fields": [
        {"key": "fecha", "type": "date", "label": "Fecha", "width": "25%"},
        {"key": "m1_molde", "type": "text", "label": "Molde Nº (M-1)", "width": "25%"},
        {"key": "m2_molde", "type": "text", "label": "Molde Nº (M-2)", "width": "25%"},
        {"key": "m3_molde", "type": "text", "label": "Molde Nº (M-3)", "width": "25%"}
      ],
      "headers": [
        {"key": "pm_sh", "label": "Peso Molde + Suelo Húmedo (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "pm", "label": "Peso del Molde (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "pt", "label": "Peso Tara (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "psh_t", "label": "Peso Suelo Húmedo + Tara (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "pss_t", "label": "Peso Suelo Seco + Tara (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "humedad", "label": "Contenido de Humedad (%)", "type": "calculated", "result_config": {"path": "tables.compactacion.{row_key}.humedad"}},
        {"key": "densidad_humeda", "label": "Densidad Húmeda (g/cm³)", "type": "calculated", "result_config": {"path": "tables.compactacion.{row_key}.densidad_humeda"}},
        {"key": "densidad_seca", "label": "Densidad Seca (g/cm³)", "type": "calculated", "result_config": {"path": "tables.compactacion.{row_key}.densidad_seca"}}
      ],
      "rows": [
        {"key": "m1_ns", "label": "M-1 No Saturado", "cell_overrides": {}},
        {"key": "m1_s", "label": "M-1 Saturado", "cell_overrides": {}},
        {"key": "m2_ns", "label": "M-2 No Saturado", "cell_overrides": {}},
        {"key": "m2_s", "label": "M-2 Saturado", "cell_overrides": {}},
        {"key": "m3_ns", "label": "M-3 No Saturado", "cell_overrides": {}},
        {"key": "m3_s", "label": "M-3 Saturado", "cell_overrides": {}}
      ]
    },
    {
      "key": "expansion",
      "title": "Ensayo de Expansión CBR",
      "transposed": true,
      "transposed_header_label": "Lectura",
      "fields": [
        {"key": "fecha", "type": "date", "label": "Fecha Inicio", "width": "50%"},
        {"key": "hora", "type": "time", "label": "Hora Inicio", "width": "50%"}
      ],
      "headers": [
        {"key": "lec_0h", "label": "Lectura 0 Hr (mm)", "type": "input", "input_config": {"type": "number"}},
        {"key": "lec_24h", "label": "Lectura 24 Hr (mm)", "type": "input", "input_config": {"type": "number"}},
        {"key": "lec_48h", "label": "Lectura 48 Hr (mm)", "type": "input", "input_config": {"type": "number"}},
        {"key": "lec_72h", "label": "Lectura 72 Hr (mm)", "type": "input", "input_config": {"type": "number"}},
        {"key": "lec_96h", "label": "Lectura 96 Hr (mm)", "type": "input", "input_config": {"type": "number"}},
        {"key": "expansion_mm", "label": "Expansión Total (mm)", "type": "calculated", "result_config": {"path": "tables.expansion.{row_key}.expansion_mm"}},
        {"key": "expansion_porc", "label": "Expansión (%)", "type": "calculated", "result_config": {"path": "tables.expansion.{row_key}.expansion_porc"}}
      ],
      "rows": [
        {"key": "m1_mm", "label": "Molde 1", "cell_overrides": {}},
        {"key": "m2_mm", "label": "Molde 2", "cell_overrides": {}},
        {"key": "m3_mm", "label": "Molde 3", "cell_overrides": {}}
      ]
    },
    {
      "key": "penetracion",
      "title": "Ensayo de Penetración CBR",
      "transposed": true,
      "transposed_header_label": "Penetración (mm)",
      "fields": [
        {"key": "fecha", "type": "date", "label": "Fecha", "width": "100%"}
      ],
      "headers": [
        {"key": "p0_64", "label": "0.64 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "p1_27", "label": "1.27 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "p1_91", "label": "1.91 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "p2_54", "label": "2.54 mm (0.1\")", "type": "input", "input_config": {"type": "number"}},
        {"key": "p3_18", "label": "3.18 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "p3_81", "label": "3.81 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "p5_08", "label": "5.08 mm (0.2\")", "type": "input", "input_config": {"type": "number"}},
        {"key": "p7_62", "label": "7.62 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "p10_16", "label": "10.16 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "p12_70", "label": "12.70 mm", "type": "input", "input_config": {"type": "number"}},
        {"key": "cbr_01", "label": "CBR al 0.1\" (%)", "type": "calculated", "result_config": {"path": "tables.penetracion.{row_key}.cbr_01"}},
        {"key": "cbr_02", "label": "CBR al 0.2\" (%)", "type": "calculated", "result_config": {"path": "tables.penetracion.{row_key}.cbr_02"}},
        {"key": "cbr_final", "label": "CBR Final (%)", "type": "calculated", "result_config": {"path": "tables.penetracion.{row_key}.cbr_final"}}
      ],
      "rows": [
        {"key": "m1_kg", "label": "Carga Molde 1 (kg)", "cell_overrides": {}},
        {"key": "m2_kg", "label": "Carga Molde 2 (kg)", "cell_overrides": {}},
        {"key": "m3_kg", "label": "Carga Molde 3 (kg)", "cell_overrides": {}}
      ]
    }
  ],
  "general_fields": {}
}'
WHERE id = 3;
