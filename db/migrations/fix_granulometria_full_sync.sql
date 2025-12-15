-- Sincronización Completa de Granulometría (ID 1)
-- Este script actualiza TANTO la configuración de la tabla (Frontend) COMO la de cálculos (Backend)
-- para asegurar que ambas usen las mismas claves ('n4', 't3', etc.) que la importación de Excel.

-- 1. Actualizar CONFIG_TABLA (Frontend)
UPDATE tipo_ensayo
SET config_tabla = $$
{
  "tables": {
    "granulometria": {
      "rows": [
        {"tamiz": "3\"","key": "t3","mm": 76.2},
        {"tamiz": "2 1/2\"","key": "t2_5","mm": 63},
        {"tamiz": "2\"","key": "t2","mm": 50.8},
        {"tamiz": "1 1/2\"","key": "t1_5","mm": 38.1},
        {"tamiz": "1\"","key": "t1","mm": 25.4},
        {"tamiz": "3/4\"","key": "t3_4","mm": 19.1},
        {"tamiz": "1/2\"","key": "t1_2","mm": 12.5},
        {"tamiz": "3/8\"","key": "t3_8","mm": 9.5},
        {"tamiz": "1/4\"","key": "t1_4","mm": 6.3},
        {"tamiz": "N° 4","key": "n4","mm": 4.75},
        {"tamiz": "N° 8","key": "n8","mm": 2.36},
        {"tamiz": "N° 10","key": "n10","mm": 2},
        {"tamiz": "N° 16","key": "n16","mm": 1.18},
        {"tamiz": "N° 20","key": "n20","mm": 0.85},
        {"tamiz": "N° 30","key": "n30","mm": 0.6},
        {"tamiz": "N° 40","key": "n40","mm": 0.425},
        {"tamiz": "N° 50","key": "n50","mm": 0.3},
        {"tamiz": "N° 60","key": "n60","mm": 0.25},
        {"tamiz": "N° 100","key": "n100","mm": 0.15},
        {"tamiz": "N° 140","key": "n140","mm": 0.106},
        {"tamiz": "N° 200","key": "n200","mm": 0.075},
        {
            "tamiz": "<200", "key": "fondo", "mm": null,
            "cell_overrides": {
                "retenido": {
                    "type": "calculated",
                    "result_config": { "key": "granulometria.display_peso_fraccion_fina", "scope": "global" }
                },
                "porc_retenido": { "type": "calculated", "result_config": { "key": "granulometria.porcRet.fondo", "scope": "global" } },
                "porc_acum": { "type": "calculated", "result_config": { "key": "granulometria.acum.fondo", "scope": "global" } },
                "porc_pasa": { "type": "calculated", "result_config": { "key": "granulometria.pasa.fondo", "scope": "global" } }
            }
        },
        {
            "tamiz": "Total", "key": "total", "mm": null,
            "cell_overrides": {
                "retenido": {
                    "type": "calculated",
                    "result_config": { "key": "granulometria.totalRetenido", "scope": "global" }
                },
                "porc_retenido": { "type": "static", "static_text": "" },
                "porc_acum": { "type": "static", "static_text": "" },
                "porc_pasa": { "type": "static", "static_text": "" }
            }
        }
      ],
      "layout": {"width": "100%"},
      "headers": [
        {"key": "tamiz","type": "static","label": "Tamiz"},
        {"key": "mm","type": "static","label": "mm"},
        {"key": "retenido","type": "input","label": "Peso Retenido (g)","input_config": {"name": "retenido"}},
        {"key": "porc_retenido","type": "calculated","label": "% Ret.","result_config": {"key": "porcRet","group": "granulometria"}},
        {"key": "porc_acum","type": "calculated","label": "% Acum.","result_config": {"key": "acum","group": "granulometria"}},
        {"key": "porc_pasa","type": "calculated","label": "% Pasa","result_config": {"key": "pasa","group": "granulometria"}}
      ]
    }
  },
  "general_fields": {
    "title": "Datos Generales",
    "fields": [
      {"key": "peso_total","type": "number","label": "Peso Total (g)"},
      {"key": "peso_fraccion_fina","type": "number","label": "Peso Fracción Fina (g)"},
      {"key": "gradacion","type": "text","label": "Gradación"}
    ],
    "layout": {"width": "100%"}
  }
}
$$::jsonb
WHERE id = 1;

-- 2. Actualizar CONFIG_CALCULOS (Backend)
UPDATE tipo_ensayo
SET config_calculos = $$
{
    "version": "12.0-final",
    "vars": {
        "pesoTotal": "get_nested_value(inputs.formData, 'general_fields.peso_total', 0)",
        "pesoFraccionFina": "get_nested_value(inputs.formData, 'general_fields.peso_fraccion_fina', 0)",
        "sumaRetenidos": 0
    },
    "steps": [
        {
            "text": "1. BUCLE: Calcular porcentajes para la fracción gruesa",
            "type": "comment"
        },
        {
            "type": "loop",
            "config": {
                "items": "inputs.tableConfig.tables.granulometria.rows",
                "itemVar": "tamiz",
                "prevItemVar": "prev_tamiz",
                "actions": [
                    {
                        "type": "expression",
                        "condition": "tamiz.mm != null",
                        "output": "vars.pesoRetenidoActual",
                        "expression": "get_nested_value(inputs.formData, concat('tables.granulometria.', tamiz.key, '.retenido'), 0)"
                    },
                    {
                        "type": "expression",
                        "condition": "tamiz.mm != null",
                        "output": "vars.sumaRetenidos",
                        "expression": "vars.sumaRetenidos + vars.pesoRetenidoActual"
                    },
                    {
                        "type": "expression",
                        "condition": "tamiz.mm != null",
                        "output": "results.granulometria.porcRet[tamiz.key]",
                        "expression": "vars.pesoTotal > 0 ? (vars.pesoRetenidoActual / vars.pesoTotal) * 100 : 0"
                    },
                    {
                        "type": "expression",
                        "condition": "tamiz.mm != null",
                        "output": "vars.acumAnterior",
                        "expression": "prev_tamiz != null ? get_nested_value(results.granulometria.acum, prev_tamiz.key, 0) : 0"
                    },
                    {
                        "type": "expression",
                        "condition": "tamiz.mm != null",
                        "output": "results.granulometria.acum[tamiz.key]",
                        "expression": "vars.acumAnterior + get_nested_value(results.granulometria.porcRet, tamiz.key, 0)"
                    },
                    {
                        "type": "expression",
                        "condition": "tamiz.mm != null",
                        "output": "results.granulometria.pasa[tamiz.key]",
                        "expression": "max(0, 100 - get_nested_value(results.granulometria.acum, tamiz.key, 100))"
                    }
                ]
            }
        },
        {
            "text": "2. AJUSTES POST-BUCLE Y CÁLCULOS FINALES",
            "type": "comment"
        },
        {
            "type": "expression",
            "output": "results.granulometria.totalRetenido",
            "expression": "vars.sumaRetenidos + vars.pesoFraccionFina"
        },
        {
            "type": "expression",
            "comment": "El % que pasa el tamiz 200 es el porcentaje de finos, se usa el valor medido para mayor precision",
            "output": "results.granulometria.pasa.n200",
            "expression": "vars.pesoTotal > 0 ? (vars.pesoFraccionFina / vars.pesoTotal) * 100 : 0"
        },
        {
            "type": "expression",
            "output": "results.granulometria.porc_finos",
            "expression": "get_nested_value(results, 'granulometria.pasa.n200', 0)"
        },
        {
            "type": "expression",
            "output": "results.granulometria.porc_grava",
            "expression": "get_nested_value(results, 'granulometria.acum.n4', 0)"
        },
        {
            "type": "expression",
            "output": "results.granulometria.porc_arena",
            "expression": "100 - get_nested_value(results, 'granulometria.porc_grava', 0) - get_nested_value(results, 'granulometria.porc_finos', 0)"
        },
        {
            "text": "3. CÁLCULOS PARA FILA '<200' (FONDO) Y 'TOTAL'",
            "type": "comment"
        },
        {
            "type": "expression",
            "output": "results.granulometria.display_peso_fraccion_fina",
            "expression": "vars.pesoFraccionFina"
        },
        {
            "type": "expression",
            "output": "results.granulometria.porcRet.fondo",
            "expression": "vars.pesoTotal > 0 ? (vars.pesoFraccionFina / vars.pesoTotal) * 100 : 0"
        },
        {
            "type": "expression",
            "output": "results.granulometria.acum.fondo",
            "expression": "get_nested_value(results.granulometria.acum, 'n200', 0) + get_nested_value(results.granulometria.porcRet, 'fondo', 0)"
        },
        {
            "type": "expression",
            "output": "results.granulometria.pasa.fondo",
            "expression": "0"
        },
        {
          "text": "4. INTERPOLACION PARA COEFICIENTES (D10, D30, D60)",
          "type": "comment"
        },
        {
          "type": "expression",
          "output": "vars.puntosCurva",
          "expression": "buildPoints(inputs.tableConfig.tables.granulometria.rows, results.granulometria.pasa)"
        },
        { "type": "engine", "config": { "name": "interpolate", "inputs": { "xKey": "'pasa'", "yKey": "'mm'", "points": "vars.puntosCurva", "targetX": 10, "logScaleY": true }, "output": "results.granulometria.D10" } },
        { "type": "engine", "config": { "name": "interpolate", "inputs": { "xKey": "'pasa'", "yKey": "'mm'", "points": "vars.puntosCurva", "targetX": 30, "logScaleY": true }, "output": "results.granulometria.D30" } },
        { "type": "engine", "config": { "name": "interpolate", "inputs": { "xKey": "'pasa'", "yKey": "'mm'", "points": "vars.puntosCurva", "targetX": 60, "logScaleY": true }, "output": "results.granulometria.D60" } },
        { "type": "expression", "output": "vars.d10_safe", "expression": "results.granulometria.D10 != null ? results.granulometria.D10 : 0" },
        { "type": "expression", "output": "vars.d30_safe", "expression": "results.granulometria.D30 != null ? results.granulometria.D30 : 0" },
        { "type": "expression", "output": "vars.d60_safe", "expression": "results.granulometria.D60 != null ? results.granulometria.D60 : 0" },
        { "type": "expression", "output": "results.granulometria.coef_uniformidad", "condition": "vars.d10_safe > 0", "expression": "vars.d60_safe / vars.d10_safe" },
        {
            "type": "expression",
            "output": "vars.debug_d30_squared",
            "expression": "pow(vars.d30_safe, 2)"
        },
        {
            "type": "expression",
            "output": "vars.debug_d10_x_d60",
            "expression": "vars.d10_safe * vars.d60_safe"
        },
        {
            "type": "expression",
            "output": "results.granulometria.coef_curvatura",
            "condition": "vars.debug_d10_x_d60 > 0",
            "expression": "vars.debug_d30_squared / vars.debug_d10_x_d60"
        }
    ]
}
$$::jsonb
WHERE id = 1;
