-- Migración Configuración Proctor V2 (Corregida)
-- 1. Reordena inputs de datos_entrada (Molde primero, luego Molde+Suelo) para evitar errores de signo.
-- 2. Añade campos calculados visibles: Peso Suelo Compactado y Densidad Húmeda.
-- 3. Usa regresion_cuadratica() para el cálculo final.

UPDATE tipo_ensayo
SET 
  config_tabla = '{
  "tables": [
    {
      "key": "datos_entrada",
      "title": "Datos de Entrada (Peso y Volumen)",
      "transposed": true,
      "transposed_header_label": "Detalle",
      "fields": [
        {"key": "fecha", "type": "date", "label": "Fecha", "width": "25%"},
        {"key": "codigo_molde", "type": "text", "label": "Código Molde", "width": "25%"},
        {"key": "volumen_molde", "type": "number", "label": "Volumen Molde (cm³)", "width": "25%", "defaultValue": 944},
        {"key": "peso_martillo", "type": "number", "label": "Peso Martillo (kg)", "width": "25%", "defaultValue": 2.5}
      ],
      "headers": [
        {"key": "peso_molde", "label": "Peso del Molde (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "peso_molde_suelo", "label": "Peso del Molde + Suelo Húmedo (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "peso_suelo_compactado", "label": "Peso Suelo Compactado (g)", "type": "calculated", "result_config": {"path": "tables.datos_entrada.{row_key}.peso_suelo_compactado"}},
        {"key": "densidad_humeda", "label": "Densidad Húmeda (g/cm³)", "type": "calculated", "result_config": {"path": "tables.datos_entrada.{row_key}.densidad_humeda"}}
      ],
      "rows": [
        {"key": "m1", "label": "M - 1", "cell_overrides": {}},
        {"key": "m2", "label": "M - 2", "cell_overrides": {}},
        {"key": "m3", "label": "M - 3", "cell_overrides": {}},
        {"key": "m4", "label": "M - 4", "cell_overrides": {}}
      ]
    },
    {
      "key": "calculo_humedad",
      "title": "Cálculo de Contenido de Humedad",
      "transposed": true,
      "transposed_header_label": "Detalle",
      "fields": [],
      "headers": [
        {"key": "capsula_nro", "label": "CÁPSULA Nro.", "type": "input", "input_config": {"type": "text"}},
        {"key": "peso_capsula", "label": "Peso Cápsula (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "pc_sh", "label": "Peso Cap. + Suelo Húmedo (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "pc_ss", "label": "Peso Cap. + Suelo Seco (g)", "type": "input", "input_config": {"type": "number"}},
        {"key": "peso_agua", "label": "Peso del Agua (g)", "type": "calculated", "result_config": {"path": "tables.calculo_humedad.{row_key}.peso_agua"}},
        {"key": "peso_seco", "label": "Peso del Suelo Seco (g)", "type": "calculated", "result_config": {"path": "tables.calculo_humedad.{row_key}.peso_seco"}},
        {"key": "humedad", "label": "Humedad (%)", "type": "calculated", "result_config": {"path": "tables.calculo_humedad.{row_key}.humedad"}},
        {"key": "densidad_seca", "label": "Densidad Seca (g/cm³)", "type": "calculated", "result_config": {"path": "tables.calculo_humedad.{row_key}.densidad_seca"}}
      ],
      "rows": [
        {"key": "m1", "label": "M - 1", "cell_overrides": {}},
        {"key": "m2", "label": "M - 2", "cell_overrides": {}},
        {"key": "m3", "label": "M - 3", "cell_overrides": {}},
        {"key": "m4", "label": "M - 4", "cell_overrides": {}}
      ]
    }
  ],
  "general_fields": {}
}',
  config_calculos = '{
  "const.volumen": "= tables.datos_entrada.volumen_molde ? tables.datos_entrada.volumen_molde : 944",

  "tables.datos_entrada.m1.peso_suelo_compactado": "= tables.datos_entrada.m1.peso_molde_suelo - tables.datos_entrada.m1.peso_molde",
  "tables.datos_entrada.m1.densidad_humeda": "= (const.volumen > 0) ? tables.datos_entrada.m1.peso_suelo_compactado / const.volumen : 0",
  "tables.calculo_humedad.m1.peso_agua": "= tables.calculo_humedad.m1.pc_sh - tables.calculo_humedad.m1.pc_ss",
  "tables.calculo_humedad.m1.peso_seco": "= tables.calculo_humedad.m1.pc_ss - tables.calculo_humedad.m1.peso_capsula",
  "tables.calculo_humedad.m1.humedad": "= (tables.calculo_humedad.m1.peso_seco > 0) ? (tables.calculo_humedad.m1.peso_agua / tables.calculo_humedad.m1.peso_seco) * 100 : 0",
  "tables.calculo_humedad.m1.densidad_seca": "= tables.datos_entrada.m1.densidad_humeda / (1 + (tables.calculo_humedad.m1.humedad / 100))",

  "tables.datos_entrada.m2.peso_suelo_compactado": "= tables.datos_entrada.m2.peso_molde_suelo - tables.datos_entrada.m2.peso_molde",
  "tables.datos_entrada.m2.densidad_humeda": "= (const.volumen > 0) ? tables.datos_entrada.m2.peso_suelo_compactado / const.volumen : 0",
  "tables.calculo_humedad.m2.peso_agua": "= tables.calculo_humedad.m2.pc_sh - tables.calculo_humedad.m2.pc_ss",
  "tables.calculo_humedad.m2.peso_seco": "= tables.calculo_humedad.m2.pc_ss - tables.calculo_humedad.m2.peso_capsula",
  "tables.calculo_humedad.m2.humedad": "= (tables.calculo_humedad.m2.peso_seco > 0) ? (tables.calculo_humedad.m2.peso_agua / tables.calculo_humedad.m2.peso_seco) * 100 : 0",
  "tables.calculo_humedad.m2.densidad_seca": "= tables.datos_entrada.m2.densidad_humeda / (1 + (tables.calculo_humedad.m2.humedad / 100))",

  "tables.datos_entrada.m3.peso_suelo_compactado": "= tables.datos_entrada.m3.peso_molde_suelo - tables.datos_entrada.m3.peso_molde",
  "tables.datos_entrada.m3.densidad_humeda": "= (const.volumen > 0) ? tables.datos_entrada.m3.peso_suelo_compactado / const.volumen : 0",
  "tables.calculo_humedad.m3.peso_agua": "= tables.calculo_humedad.m3.pc_sh - tables.calculo_humedad.m3.pc_ss",
  "tables.calculo_humedad.m3.peso_seco": "= tables.calculo_humedad.m3.pc_ss - tables.calculo_humedad.m3.peso_capsula",
  "tables.calculo_humedad.m3.humedad": "= (tables.calculo_humedad.m3.peso_seco > 0) ? (tables.calculo_humedad.m3.peso_agua / tables.calculo_humedad.m3.peso_seco) * 100 : 0",
  "tables.calculo_humedad.m3.densidad_seca": "= tables.datos_entrada.m3.densidad_humeda / (1 + (tables.calculo_humedad.m3.humedad / 100))",

  "tables.datos_entrada.m4.peso_suelo_compactado": "= tables.datos_entrada.m4.peso_molde_suelo - tables.datos_entrada.m4.peso_molde",
  "tables.datos_entrada.m4.densidad_humeda": "= (const.volumen > 0) ? tables.datos_entrada.m4.peso_suelo_compactado / const.volumen : 0",
  "tables.calculo_humedad.m4.peso_agua": "= tables.calculo_humedad.m4.pc_sh - tables.calculo_humedad.m4.pc_ss",
  "tables.calculo_humedad.m4.peso_seco": "= tables.calculo_humedad.m4.pc_ss - tables.calculo_humedad.m4.peso_capsula",
  "tables.calculo_humedad.m4.humedad": "= (tables.calculo_humedad.m4.peso_seco > 0) ? (tables.calculo_humedad.m4.peso_agua / tables.calculo_humedad.m4.peso_seco) * 100 : 0",
  "tables.calculo_humedad.m4.densidad_seca": "= tables.datos_entrada.m4.densidad_humeda / (1 + (tables.calculo_humedad.m4.humedad / 100))",

  "results.curva": "= regresion_cuadratica([tables.calculo_humedad.m1.humedad, tables.calculo_humedad.m2.humedad, tables.calculo_humedad.m3.humedad, tables.calculo_humedad.m4.humedad], [tables.calculo_humedad.m1.densidad_seca, tables.calculo_humedad.m2.densidad_seca, tables.calculo_humedad.m3.densidad_seca, tables.calculo_humedad.m4.densidad_seca])",
  
  "results.maxima_densidad_seca": "= results.curva.y",
  "results.humedad_optima": "= results.curva.x"
}',
  results_config = '{
  "groups": [
    {
      "title": "Resultados Principales del Proctor Modificado",
      "fields": [
        {"name": "results.maxima_densidad_seca", "label": "Máxima Densidad Seca (MDS) (g/cm³)", "digits": 3},
        {"name": "results.humedad_optima", "label": "Humedad Óptima (OCH) (%)", "digits": 2}
      ],
      "data_source_key": null 
    }
  ]
}'
WHERE descripcion ILIKE '%Proctor%';
