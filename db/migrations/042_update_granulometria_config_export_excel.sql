-- Actualiza la configuración de EXPORTACIÓN A EXCEL para el ensayo de Granulometría (ID=1).
UPDATE tipo_ensayo
SET config_export_excel = $$
{
  "layout": "tabla_simple",
  "tablas": [
    {
      "titulo": "Análisis Granulométrico",
      "headers": [
        {"key": "general_fields.peso_total", "width": 20, "header": "Peso Total (g)"},
        {"key": "general_fields.peso_fraccion_fina", "width": 25, "header": "Peso Fracción Fina (g)"},
        {"key": "general_fields.gradacion", "width": 25, "header": "Gradación"},
        {"key": "tables.granulometria.t3.retenido", "width": 10, "header": "3\""},
        {"key": "tables.granulometria.t2_5.retenido", "width": 10, "header": "2 1/2\""},
        {"key": "tables.granulometria.t2.retenido", "width": 10, "header": "2\""},
        {"key": "tables.granulometria.t1_5.retenido", "width": 10, "header": "1 1/2\""},
        {"key": "tables.granulometria.t1.retenido", "width": 10, "header": "1\""},
        {"key": "tables.granulometria.t3_4.retenido", "width": 10, "header": "3/4\""},
        {"key": "tables.granulometria.t1_2.retenido", "width": 10, "header": "1/2\""},
        {"key": "tables.granulometria.t3_8.retenido", "width": 10, "header": "3/8\""},
        {"key": "tables.granulometria.t1_4.retenido", "width": 10, "header": "1/4\""},
        {"key": "tables.granulometria.n4.retenido", "width": 10, "header": "N° 4"},
        {"key": "tables.granulometria.n8.retenido", "width": 10, "header": "N° 8"},
        {"key": "tables.granulometria.n10.retenido", "width": 10, "header": "N° 10"},
        {"key": "tables.granulometria.n16.retenido", "width": 10, "header": "N° 16"},
        {"key": "tables.granulometria.n20.retenido", "width": 10, "header": "N° 20"},
        {"key": "tables.granulometria.n30.retenido", "width": 10, "header": "N° 30"},
        {"key": "tables.granulometria.n40.retenido", "width": 10, "header": "N° 40"},
        {"key": "tables.granulometria.n50.retenido", "width": 10, "header": "N° 50"},
        {"key": "tables.granulometria.n60.retenido", "width": 10, "header": "N° 60"},
        {"key": "tables.granulometria.n100.retenido", "width": 10, "header": "N° 100"},
        {"key": "tables.granulometria.n140.retenido", "width": 10, "header": "N° 140"},
        {"key": "tables.granulometria.n200.retenido", "width": 10, "header": "N° 200"},
        {"key": "granulometria.display_peso_fraccion_fina", "width": 15, "header": "Peso Fracción Fina (<200)"},
        {"key": "granulometria.porcRet.fondo", "width": 15, "header": "% Ret. Fondo"},
        {"key": "granulometria.acum.fondo", "width": 15, "header": "% Acum. Fondo"},
        {"key": "granulometria.pasa.fondo", "width": 15, "header": "% Pasa Fondo"},
        {"key": "granulometria.totalRetenido", "width": 15, "header": "Total Retenido (g)"},
        {"key": "granulometria.porcRet.total", "width": 15, "header": "% Ret. Total"},
        {"key": "granulometria.acum.total", "width": 15, "header": "% Acum. Total"},
        {"key": "granulometria.pasa.total", "width": 15, "header": "% Pasa Total"},
        {"key": "granulometria.D10", "width": 10, "header": "D10"},
        {"key": "granulometria.D30", "width": 10, "header": "D30"},
        {"key": "granulometria.D60", "width": 10, "header": "D60"},
        {"key": "granulometria.coef_uniformidad", "width": 10, "header": "Cu"},
        {"key": "granulometria.coef_curvatura", "width": 10, "header": "Cc"},
        {"key": "granulometria.porc_grava", "width": 10, "header": "% Grava"},
        {"key": "granulometria.porc_arena", "width": 10, "header": "% Arena"},
        {"key": "granulometria.porc_finos", "width": 10, "header": "% Finos"}
      ]
    }
  ],
  "sheetName": "Granulometría"
}
$$::jsonb
WHERE id = 1;