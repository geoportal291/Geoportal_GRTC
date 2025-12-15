-- Migración Configuración Exportación Excel V1
-- Actualiza config_export_excel para CBR, Límites, Granulometría y Proctor
-- usando los JSONs proporcionados pro el usuario.

-- 1. CBR
UPDATE tipo_ensayo
SET config_export_excel = '[
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Ensayo de Compactación CBR",
        "headers": [
          {
            "header": "Datos Generales",
            "subheaders": [
              {"key": "ensayo_de_compactacion_cbr.fecha", "width": 12, "header": "Fecha"},
              {"key": "ensayo_de_compactacion_cbr.m1_molde", "width": 12, "header": "Nº Molde"}
            ]
          },
          {
            "header": "Molde 1",
            "subheaders": [
              {"key": "ensayo_de_compactacion_cbr.m1_molde", "width": 12, "header": "Nº Molde"},
              {"key": "ensayo_de_compactacion_cbr.pm_sh.m1_ns", "width": 15, "header": "P.M.+S.H. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pm_sh.m1_s", "width": 15, "header": "P.M.+S.H. (S)"},
              {"key": "ensayo_de_compactacion_cbr.pm.m1_ns", "width": 15, "header": "Peso Molde (g) (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pm.m1_s", "width": 15, "header": "Peso Molde (g) (S)"},
              {"key": "ensayo_de_compactacion_cbr.pt.m1_ns", "width": 15, "header": "P.T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pt.m1_s", "width": 15, "header": "P.T. (S)"},
              {"key": "ensayo_de_compactacion_cbr.psh_t.m1_ns", "width": 15, "header": "P.S.H.+T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.psh_t.m1_s", "width": 15, "header": "P.S.H.+T. (S)"},
              {"key": "ensayo_de_compactacion_cbr.pss_t.m1_ns", "width": 15, "header": "P.S.S.+T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pss_t.m1_s", "width": 15, "header": "P.S.S.+T. (S)"}
            ]
          },
          {
            "header": "Molde 2",
            "subheaders": [
              {"key": "ensayo_de_compactacion_cbr.m2_molde", "width": 12, "header": "Nº Molde"},
              {"key": "ensayo_de_compactacion_cbr.pm_sh.m2_ns", "width": 15, "header": "P.M.+S.H. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pm_sh.m2_s", "width": 15, "header": "P.M.+S.H. (S)"},
              {"key": "ensayo_de_compactacion_cbr.pm.m2_ns", "width": 15, "header": "Peso Molde (g) (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pm.m2_s", "width": 15, "header": "Peso Molde (g) (S)"},
              {"key": "ensayo_de_compactacion_cbr.pt.m2_ns", "width": 15, "header": "P.T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pt.m2_s", "width": 15, "header": "P.T. (S)"},
              {"key": "ensayo_de_compactacion_cbr.psh_t.m2_ns", "width": 15, "header": "P.S.H.+T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.psh_t.m2_s", "width": 15, "header": "P.S.H.+T. (S)"},
              {"key": "ensayo_de_compactacion_cbr.pss_t.m2_ns", "width": 15, "header": "P.S.S.+T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pss_t.m2_s", "width": 15, "header": "P.S.S.+T. (S)"}
            ]
          },
          {
            "header": "Molde 3",
            "subheaders": [
              {"key": "ensayo_de_compactacion_cbr.m3_molde", "width": 12, "header": "Nº Molde"},
              {"key": "ensayo_de_compactacion_cbr.pm_sh.m3_ns", "width": 15, "header": "P.M.+S.H. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pm_sh.m3_s", "width": 15, "header": "P.M.+S.H. (S)"},
              {"key": "ensayo_de_compactacion_cbr.pm.m3_ns", "width": 15, "header": "Peso Molde (g) (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pm.m3_s", "width": 15, "header": "Peso Molde (g) (S)"},
              {"key": "ensayo_de_compactacion_cbr.pt.m3_ns", "width": 15, "header": "P.T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pt.m3_s", "width": 15, "header": "P.T. (S)"},
              {"key": "ensayo_de_compactacion_cbr.psh_t.m3_ns", "width": 15, "header": "P.S.H.+T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.psh_t.m3_s", "width": 15, "header": "P.S.H.+T. (S)"},
              {"key": "ensayo_de_compactacion_cbr.pss_t.m3_ns", "width": 15, "header": "P.S.S.+T. (NS)"},
              {"key": "ensayo_de_compactacion_cbr.pss_t.m3_s", "width": 15, "header": "P.S.S.+T. (S)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "CBR Compactacion"
  },
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Ensayo de Expansión CBR",
        "headers": [
          {
            "header": "Datos Generales",
            "subheaders": [
              {"key": "ensayo_de_expansion_cbr.fecha", "width": 12, "header": "Fecha"},
              {"key": "ensayo_de_expansion_cbr.hora", "width": 10, "header": "Hora"}
            ]
          },
          {
            "header": "Lecturas Molde (mm)",
            "subheaders": [
              {"key": "ensayo_de_expansion_cbr.lec_0h.m1_mm", "width": 12, "header": "Lec 0 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_24h.m1_mm", "width": 12, "header": "Lec 24 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_48h.m1_mm", "width": 12, "header": "Lec 48 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_72h.m1_mm", "width": 12, "header": "Lec 72 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_96h.m1_mm", "width": 12, "header": "Lec 96 Hr"}
            ]
          },
          {
            "header": "Lecturas Molde 2 (mm)",
            "subheaders": [
              {"key": "ensayo_de_expansion_cbr.lec_0h.m2_mm", "width": 12, "header": "Lec 0 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_24h.m2_mm", "width": 12, "header": "Lec 24 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_48h.m2_mm", "width": 12, "header": "Lec 48 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_72h.m2_mm", "width": 12, "header": "Lec 72 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_96h.m2_mm", "width": 12, "header": "Lec 96 Hr"}
            ]
          },
          {
            "header": "Lecturas Molde 3 (mm)",
            "subheaders": [
              {"key": "ensayo_de_expansion_cbr.lec_0h.m3_mm", "width": 12, "header": "Lec 0 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_24h.m3_mm", "width": 12, "header": "Lec 24 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_48h.m3_mm", "width": 12, "header": "Lec 48 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_72h.m3_mm", "width": 12, "header": "Lec 72 Hr"},
              {"key": "ensayo_de_expansion_cbr.lec_96h.m3_mm", "width": 12, "header": "Lec 96 Hr"}
            ]
          }
        ]
      }
    ],
    "sheetName": "CBR Expansión"
  },
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Ensayo de Penetración CBR",
        "headers": [
          {
            "header": "Lecturas Molde 1 (kg)",
            "subheaders": [
              {"key": "ensayo_de_penetracion_cbr.p0_00.m1_kg", "width": 12, "header": "Pen 0mm"},
              {"key": "ensayo_de_penetracion_cbr.p0_64.m1_kg", "width": 12, "header": "Pen 0.64mm"},
              {"key": "ensayo_de_penetracion_cbr.p1_27.m1_kg", "width": 12, "header": "Pen 1.27mm"},
              {"key": "ensayo_de_penetracion_cbr.p1_91.m1_kg", "width": 12, "header": "Pen 1.91mm"},
              {"key": "ensayo_de_penetracion_cbr.p2_54.m1_kg", "width": 12, "header": "Pen 2.54mm"},
              {"key": "ensayo_de_penetracion_cbr.p3_18.m1_kg", "width": 12, "header": "Pen 3.18mm"},
              {"key": "ensayo_de_penetracion_cbr.p3_81.m1_kg", "width": 12, "header": "Pen 3.81mm"},
              {"key": "ensayo_de_penetracion_cbr.p5_08.m1_kg", "width": 12, "header": "Pen 5.08mm"},
              {"key": "ensayo_de_penetracion_cbr.p6_35.m1_kg", "width": 12, "header": "Pen 6.35mm"},
              {"key": "ensayo_de_penetracion_cbr.p7_62.m1_kg", "width": 12, "header": "Pen 7.62mm"},
              {"key": "ensayo_de_penetracion_cbr.p10_16.m1_kg", "width": 12, "header": "Pen 10.16mm"},
              {"key": "ensayo_de_penetracion_cbr.p12_70.m1_kg", "width": 12, "header": "Pen 12.70mm"}
            ]
          },
          {
            "header": "Lecturas Molde 2 (kg)",
            "subheaders": [
              {"key": "ensayo_de_penetracion_cbr.p0_00.m1_kg", "width": 12, "header": "Pen 0mm"},
              {"key": "ensayo_de_penetracion_cbr.p0_64.m2_kg", "width": 12, "header": "Pen 0.64mm"},
              {"key": "ensayo_de_penetracion_cbr.p1_27.m2_kg", "width": 12, "header": "Pen 1.27mm"},
              {"key": "ensayo_de_penetracion_cbr.p1_91.m2_kg", "width": 12, "header": "Pen 1.91mm"},
              {"key": "ensayo_de_penetracion_cbr.p2_54.m2_kg", "width": 12, "header": "Pen 2.54mm"},
              {"key": "ensayo_de_penetracion_cbr.p3_18.m2_kg", "width": 12, "header": "Pen 3.18mm"},
              {"key": "ensayo_de_penetracion_cbr.p3_81.m2_kg", "width": 12, "header": "Pen 3.81mm"},
              {"key": "ensayo_de_penetracion_cbr.p5_08.m2_kg", "width": 12, "header": "Pen 5.08mm"},
              {"key": "ensayo_de_penetracion_cbr.p6_35.m2_kg", "width": 12, "header": "Pen 6.35mm"},
              {"key": "ensayo_de_penetracion_cbr.p7_62.m2_kg", "width": 12, "header": "Pen 7.62mm"},
              {"key": "ensayo_de_penetracion_cbr.p10_16.m2_kg", "width": 12, "header": "Pen 10.16mm"},
              {"key": "ensayo_de_penetracion_cbr.p12_70.m2_kg", "width": 12, "header": "Pen 12.70mm"}
            ]
          },
          {
            "header": "Lecturas Molde 3 (kg)",
            "subheaders": [
              {"key": "ensayo_de_penetracion_cbr.p0_00.m1_kg", "width": 12, "header": "Pen 0mm"},
              {"key": "ensayo_de_penetracion_cbr.p0_64.m3_kg", "width": 12, "header": "Pen 0.64mm"},
              {"key": "ensayo_de_penetracion_cbr.p1_27.m3_kg", "width": 12, "header": "Pen 1.27mm"},
              {"key": "ensayo_de_penetracion_cbr.p1_91.m3_kg", "width": 12, "header": "Pen 1.91mm"},
              {"key": "ensayo_de_penetracion_cbr.p2_54.m3_kg", "width": 12, "header": "Pen 2.54mm"},
              {"key": "ensayo_de_penetracion_cbr.p3_18.m3_kg", "width": 12, "header": "Pen 3.18mm"},
              {"key": "ensayo_de_penetracion_cbr.p3_81.m3_kg", "width": 12, "header": "Pen 3.81mm"},
              {"key": "ensayo_de_penetracion_cbr.p5_08.m3_kg", "width": 12, "header": "Pen 5.08mm"},
              {"key": "ensayo_de_penetracion_cbr.p6_35.m3_kg", "width": 12, "header": "Pen 6.35mm"},
              {"key": "ensayo_de_penetracion_cbr.p7_62.m3_kg", "width": 12, "header": "Pen 7.62mm"},
              {"key": "ensayo_de_penetracion_cbr.p10_16.m3_kg", "width": 12, "header": "Pen 10.16mm"},
              {"key": "ensayo_de_penetracion_cbr.p12_70.m3_kg", "width": 12, "header": "Pen 12.70mm"}
            ]
          }
        ]
      }
    ],
    "sheetName": "CBR Penetración"
  },
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Resultados Finales",
        "headers": [
          {
            "header": "Resultados Molde 1",
            "subheaders": [
              {"key": "m1.cbr_final", "width": 15, "header": "CBR Final (%)"},
              {"key": "m1.expansion_porc", "width": 15, "header": "% Expansión"},
              {"key": "m1.densidad_seca", "width": 15, "header": "Densidad Seca"},
              {"key": "m1.humedad_promedio", "width": 15, "header": "Humedad Promedio"}
            ]
          },
          {
            "header": "Resultados Molde 2",
            "subheaders": [
              {"key": "m2.cbr_final", "width": 15, "header": "CBR Final (%)"},
              {"key": "m2.expansion_porc", "width": 15, "header": "% Expansión"},
              {"key": "m2.densidad_seca", "width": 15, "header": "Densidad Seca"},
              {"key": "m2.humedad_promedio", "width": 15, "header": "Humedad Promedio"}
            ]
          },
          {
            "header": "Resultados Molde 3",
            "subheaders": [
              {"key": "m3.cbr_final", "width": 15, "header": "CBR Final (%)"},
              {"key": "m3.expansion_porc", "width": 15, "header": "% Expansión"},
              {"key": "m3.densidad_seca", "width": 15, "header": "Densidad Seca"},
              {"key": "m3.humedad_promedio", "width": 15, "header": "Humedad Promedio"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Resultados de CBR"
  }
]'
WHERE id = 3;

-- 2. Límites de Consistencia
UPDATE tipo_ensayo
SET config_export_excel = '[
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Determinación de los Límites de Consistencia",
        "headers": [
          {
            "header": "Límite Líquido - Muestra 1",
            "subheaders": [
              {"key": "limite_liquido.ll_codigo_1", "header": "N° Recipiente"},
              {"key": "limite_liquido.ll_golpes_1", "header": "N° Golpes"},
              {"key": "limite_liquido.ll_humedo_1", "header": "Recip. + húmedo (g)"},
              {"key": "limite_liquido.ll_seco_1", "header": "Recip. + seco (g)"},
              {"key": "limite_liquido.ll_tara_1", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Líquido - Muestra 2",
            "subheaders": [
              {"key": "limite_liquido.ll_codigo_2", "header": "N° Recipiente"},
              {"key": "limite_liquido.ll_golpes_2", "header": "N° Golpes"},
              {"key": "limite_liquido.ll_humedo_2", "header": "Recip. + húmedo (g)"},
              {"key": "limite_liquido.ll_seco_2", "header": "Recip. + seco (g)"},
              {"key": "limite_liquido.ll_tara_2", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Líquido - Muestra 3",
            "subheaders": [
              {"key": "limite_liquido.ll_codigo_3", "header": "N° Recipiente"},
              {"key": "limite_liquido.ll_golpes_3", "header": "N° Golpes"},
              {"key": "limite_liquido.ll_humedo_3", "header": "Recip. + húmedo (g)"},
              {"key": "limite_liquido.ll_seco_3", "header": "Recip. + seco (g)"},
              {"key": "limite_liquido.ll_tara_3", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Plástico - Muestra 1",
            "subheaders": [
              {"key": "limite_plastico.lp_codigo_1", "header": "N° Recipiente"},
              {"key": "limite_plastico.lp_humedo_1", "header": "Recip. + húmedo (g)"},
              {"key": "limite_plastico.lp_seco_1", "header": "Recip. + seco (g)"},
              {"key": "limite_plastico.lp_tara_1", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Plástico - Muestra 2",
            "subheaders": [
              {"key": "limite_plastico.lp_codigo_2", "header": "N° Recipiente"},
              {"key": "limite_plastico.lp_humedo_2", "header": "Recip. + húmedo (g)"},
              {"key": "limite_plastico.lp_seco_2", "header": "Recip. + seco (g)"},
              {"key": "limite_plastico.lp_tara_2", "header": "Peso recip. (g)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Límites"
  },
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Determinación de Humedad Natural",
        "headers": [
          {
            "header": "Muestra 1",
            "subheaders": [
              {"key": "humedad_natural.hn_codigo_1", "header": "Codigo Capsula"},
              {"key": "humedad_natural.hn_tara_1", "header": "Peso de Cápsula (g)"},
              {"key": "humedad_natural.hn_humedo_1", "header": "Peso Capsula + Suelo Humedo (g)"},
              {"key": "humedad_natural.hn_seco_1", "header": "Peso de la Capsula + Suelo Seco (g)"}
            ]
          },
          {
            "header": "Muestra 2",
            "subheaders": [
              {"key": "humedad_natural.hn_codigo_2", "header": "Codigo Capsula"},
              {"key": "humedad_natural.hn_tara_2", "header": "Peso de Cápsula (g)"},
              {"key": "humedad_natural.hn_humedo_2", "header": "Peso Capsula + Suelo Humedo (g)"},
              {"key": "humedad_natural.hn_seco_2", "header": "Peso de la Capsula + Suelo Seco (g)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Humedad Natural"
  }
]'
WHERE id = 2;

-- 3. Granulometría
UPDATE tipo_ensayo
SET config_export_excel = '{
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
        {"key": "tables.granulometria.n200.retenido", "width": 10, "header": "N° 200"}
      ]
    }
  ],
  "sheetName": "Granulometría"
}'
WHERE id = 1;

-- 4. Proctor
UPDATE tipo_ensayo
SET config_export_excel = '[
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Ensayo Proctor Modificado",
        "headers": [
          {
            "header": "Datos Generales",
            "subheaders": [
              {"key": "datos_entrada.fecha", "width": 12, "header": "Fecha"},
              {"key": "datos_entrada.codigo_molde", "width": 15, "header": "Código Molde"},
              {"key": "datos_entrada.volumen_molde", "width": 20, "header": "Volumen Molde (cm³)"},
              {"key": "datos_entrada.peso_martillo", "width": 20, "header": "Peso Martillo (kg)"}
            ]
          },
          {
            "header": "Muestra 1",
            "subheaders": [
              {"key": "datos_entrada.peso_molde_suelo.m1", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "datos_entrada.peso_molde.m1", "width": 22, "header": "Peso Molde (g)"},
              {"key": "calculo_humedad.capsula_nro.m1", "width": 15, "header": "Cápsula Nro."},
              {"key": "calculo_humedad.peso_capsula.m1", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "calculo_humedad.pc_sh.m1", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "calculo_humedad.pc_ss.m1", "width": 18, "header": "P.C. + S.S. (g)"}
            ]
          },
          {
            "header": "Muestra 2",
            "subheaders": [
              {"key": "datos_entrada.peso_molde_suelo.m2", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "datos_entrada.peso_molde.m2", "width": 22, "header": "Peso Molde (g)"},
              {"key": "calculo_humedad.capsula_nro.m2", "width": 15, "header": "Cápsula Nro."},
              {"key": "calculo_humedad.peso_capsula.m2", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "calculo_humedad.pc_sh.m2", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "calculo_humedad.pc_ss.m2", "width": 18, "header": "P.C. + S.S. (g)"}
            ]
          },
          {
            "header": "Muestra 3",
            "subheaders": [
              {"key": "datos_entrada.peso_molde_suelo.m3", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "datos_entrada.peso_molde.m3", "width": 22, "header": "Peso Molde (g)"},
              {"key": "calculo_humedad.capsula_nro.m3", "width": 15, "header": "Cápsula Nro."},
              {"key": "calculo_humedad.peso_capsula.m3", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "calculo_humedad.pc_sh.m3", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "calculo_humedad.pc_ss.m3", "width": 18, "header": "P.C. + S.S. (g)"}
            ]
          },
          {
            "header": "Muestra 4",
            "subheaders": [
              {"key": "datos_entrada.peso_molde_suelo.m4", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "datos_entrada.peso_molde.m4", "width": 22, "header": "Peso Molde (g)"},
              {"key": "calculo_humedad.capsula_nro.m4", "width": 15, "header": "Cápsula Nro."},
              {"key": "calculo_humedad.peso_capsula.m4", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "calculo_humedad.pc_sh.m4", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "calculo_humedad.pc_ss.m4", "width": 18, "header": "P.C. + S.S. (g)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Proctor"
  }
]'
WHERE id 4;
