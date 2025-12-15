-- Migración de Configuración CBR a Formato Dinámico V2
-- Estructura: Tablas Transpuestas y Fórmulas Excel-Like

UPDATE tipo_ensayo
SET 
  config_tabla = '{
  "tables": [
    {
      "key": "compactacion",
      "title": "Ensayo de Compactación CBR",
      "transposed": true,
      "transposed_header_label": "Variable",
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
  "general_fields": {
    "fecha_ensayo": {"type": "date", "label": "Fecha de Ensayo", "width": "3"}
  }
}',
  config_calculos = '{
  "tables.compactacion.m1_ns.humedad": "= (tables.compactacion.m1_ns.psh_t - tables.compactacion.m1_ns.pss_t) > 0 ? ( (tables.compactacion.m1_ns.psh_t - tables.compactacion.m1_ns.pss_t) / (tables.compactacion.m1_ns.pss_t - tables.compactacion.m1_ns.pt) ) * 100 : 0",
  "tables.compactacion.m1_s.humedad": "= (tables.compactacion.m1_s.psh_t - tables.compactacion.m1_s.pss_t) > 0 ? ( (tables.compactacion.m1_s.psh_t - tables.compactacion.m1_s.pss_t) / (tables.compactacion.m1_s.pss_t - tables.compactacion.m1_s.pt) ) * 100 : 0",
  "tables.compactacion.m2_ns.humedad": "= (tables.compactacion.m2_ns.psh_t - tables.compactacion.m2_ns.pss_t) > 0 ? ( (tables.compactacion.m2_ns.psh_t - tables.compactacion.m2_ns.pss_t) / (tables.compactacion.m2_ns.pss_t - tables.compactacion.m2_ns.pt) ) * 100 : 0",
  "tables.compactacion.m2_s.humedad": "= (tables.compactacion.m2_s.psh_t - tables.compactacion.m2_s.pss_t) > 0 ? ( (tables.compactacion.m2_s.psh_t - tables.compactacion.m2_s.pss_t) / (tables.compactacion.m2_s.pss_t - tables.compactacion.m2_s.pt) ) * 100 : 0",
  "tables.compactacion.m3_ns.humedad": "= (tables.compactacion.m3_ns.psh_t - tables.compactacion.m3_ns.pss_t) > 0 ? ( (tables.compactacion.m3_ns.psh_t - tables.compactacion.m3_ns.pss_t) / (tables.compactacion.m3_ns.pss_t - tables.compactacion.m3_ns.pt) ) * 100 : 0",
  "tables.compactacion.m3_s.humedad": "= (tables.compactacion.m3_s.psh_t - tables.compactacion.m3_s.pss_t) > 0 ? ( (tables.compactacion.m3_s.psh_t - tables.compactacion.m3_s.pss_t) / (tables.compactacion.m3_s.pss_t - tables.compactacion.m3_s.pt) ) * 100 : 0",

  "const.volumen_molde": "= 2124", 
  "const.altura_inicial": "= 127",
  "const.carga_patron_01": "= 1360",
  "const.carga_patron_02": "= 2040",

  "tables.compactacion.m1_ns.densidad_humeda": "= (tables.compactacion.m1_ns.pm_sh - tables.compactacion.m1_ns.pm) / const.volumen_molde",
  "tables.compactacion.m1_ns.densidad_seca": "= tables.compactacion.m1_ns.densidad_humeda / (1 + (tables.compactacion.m1_ns.humedad / 100))",
  
  "tables.compactacion.m2_ns.densidad_humeda": "= (tables.compactacion.m2_ns.pm_sh - tables.compactacion.m2_ns.pm) / const.volumen_molde",
  "tables.compactacion.m2_ns.densidad_seca": "= tables.compactacion.m2_ns.densidad_humeda / (1 + (tables.compactacion.m2_ns.humedad / 100))",

  "tables.compactacion.m3_ns.densidad_humeda": "= (tables.compactacion.m3_ns.pm_sh - tables.compactacion.m3_ns.pm) / const.volumen_molde",
  "tables.compactacion.m3_ns.densidad_seca": "= tables.compactacion.m3_ns.densidad_humeda / (1 + (tables.compactacion.m3_ns.humedad / 100))",

  "tables.expansion.m1_mm.expansion_mm": "= tables.expansion.m1_mm.lec_96h - tables.expansion.m1_mm.lec_0h",
  "tables.expansion.m1_mm.expansion_porc": "= (tables.expansion.m1_mm.expansion_mm / const.altura_inicial) * 100",
  
  "tables.expansion.m2_mm.expansion_mm": "= tables.expansion.m2_mm.lec_96h - tables.expansion.m2_mm.lec_0h",
  "tables.expansion.m2_mm.expansion_porc": "= (tables.expansion.m2_mm.expansion_mm / const.altura_inicial) * 100",

  "tables.expansion.m3_mm.expansion_mm": "= tables.expansion.m3_mm.lec_96h - tables.expansion.m3_mm.lec_0h",
  "tables.expansion.m3_mm.expansion_porc": "= (tables.expansion.m3_mm.expansion_mm / const.altura_inicial) * 100",

  "tables.penetracion.m1_kg.cbr_01": "= (tables.penetracion.m1_kg.p2_54 / const.carga_patron_01) * 100",
  "tables.penetracion.m1_kg.cbr_02": "= (tables.penetracion.m1_kg.p5_08 / const.carga_patron_02) * 100",
  "tables.penetracion.m1_kg.cbr_final": "= max(tables.penetracion.m1_kg.cbr_01, tables.penetracion.m1_kg.cbr_02)",

  "tables.penetracion.m2_kg.cbr_01": "= (tables.penetracion.m2_kg.p2_54 / const.carga_patron_01) * 100",
  "tables.penetracion.m2_kg.cbr_02": "= (tables.penetracion.m2_kg.p5_08 / const.carga_patron_02) * 100",
  "tables.penetracion.m2_kg.cbr_final": "= max(tables.penetracion.m2_kg.cbr_01, tables.penetracion.m2_kg.cbr_02)",

  "tables.penetracion.m3_kg.cbr_01": "= (tables.penetracion.m3_kg.p2_54 / const.carga_patron_01) * 100",
  "tables.penetracion.m3_kg.cbr_02": "= (tables.penetracion.m3_kg.p5_08 / const.carga_patron_02) * 100",
  "tables.penetracion.m3_kg.cbr_final": "= max(tables.penetracion.m3_kg.cbr_01, tables.penetracion.m3_kg.cbr_02)",

  "results.m1.densidad_seca": "= tables.compactacion.m1_ns.densidad_seca",
  "results.m1.cbr_final": "= tables.penetracion.m1_kg.cbr_final",
  "results.m1.expansion_porc": "= tables.expansion.m1_mm.expansion_porc",

  "results.m2.densidad_seca": "= tables.compactacion.m2_ns.densidad_seca",
  "results.m2.cbr_final": "= tables.penetracion.m2_kg.cbr_final",
  "results.m2.expansion_porc": "= tables.expansion.m2_mm.expansion_porc",

  "results.m3.densidad_seca": "= tables.compactacion.m3_ns.densidad_seca",
  "results.m3.cbr_final": "= tables.penetracion.m3_kg.cbr_final",
  "results.m3.expansion_porc": "= tables.expansion.m3_mm.expansion_porc"
}',
  results_config = '{
  "groups": [
    {
      "title": "Resultados Molde 1 (56 golpes)",
      "fields": [
        {"name": "results.m1.densidad_seca", "label": "Densidad Seca (g/cm³)", "digits": 3},
        {"name": "results.m1.cbr_final", "label": "CBR (%)", "digits": 1},
        {"name": "results.m1.expansion_porc", "label": "Expansión (%)", "digits": 2}
      ]
    },
    {
      "title": "Resultados Molde 2 (25 golpes)",
      "fields": [
        {"name": "results.m2.densidad_seca", "label": "Densidad Seca (g/cm³)", "digits": 3},
        {"name": "results.m2.cbr_final", "label": "CBR (%)", "digits": 1},
        {"name": "results.m2.expansion_porc", "label": "Expansión (%)", "digits": 2}
      ]
    },
    {
      "title": "Resultados Molde 3 (12 golpes)",
      "fields": [
        {"name": "results.m3.densidad_seca", "label": "Densidad Seca (g/cm³)", "digits": 3},
        {"name": "results.m3.cbr_final", "label": "CBR (%)", "digits": 1},
        {"name": "results.m3.expansion_porc", "label": "Expansión (%)", "digits": 2}
      ]
    }
  ]
}'
WHERE descripcion ILIKE '%CBR%';
