-- Actualiza la config_calculos de Granulometría (ID=1) para usar get_nested_value Y el bypass para el error 'char 20'.
UPDATE tipo_ensayo
SET config_calculos = $$
{
    "version": "10.0-final",
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
            "expression": "vars.sumaRetenidos"
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
          "text": "3. INTERPOLACION PARA COEFICIENTES (D10, D30, D60)",
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
            "text": "4. DEBUG BYPASS: Descomponer cálculo de Coef. Curvatura",
            "type": "comment"
        },
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