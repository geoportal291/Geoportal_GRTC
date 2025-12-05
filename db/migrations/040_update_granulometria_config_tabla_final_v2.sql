-- Actualiza la config_tabla de Granulometría (ID=1) para configurar la visualización de las filas 'fondo' y 'total'.
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