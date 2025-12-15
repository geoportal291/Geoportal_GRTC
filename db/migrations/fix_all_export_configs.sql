-- ACTUALIZACIÓN MAESTRA DE CONFIGURACIONES DE EXPORTACIÓN (Para corregir importación vacía)
-- Este script sobreescribe la configuración config_export_excel para todos los tipos de ensayo activos.

-- 1. GRANULOMETRÍA (ID 1)
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

-- 2. LÍMITES DE CONSISTENCIA (ID 2)
UPDATE tipo_ensayo
SET config_export_excel = $$
[
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Determinación de los Límites de Consistencia",
        "headers": [
          {
            "header": "Límite Líquido - Muestra 1",
            "subheaders": [
              {"key": "tables.limite_liquido.1.codigo", "header": "N° Recipiente"},
              {"key": "tables.limite_liquido.1.golpes", "header": "N° Golpes"},
              {"key": "tables.limite_liquido.1.humedo", "header": "Recip. + húmedo (g)"},
              {"key": "tables.limite_liquido.1.seco", "header": "Recip. + seco (g)"},
              {"key": "tables.limite_liquido.1.tara", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Líquido - Muestra 2",
            "subheaders": [
              {"key": "tables.limite_liquido.2.codigo", "header": "N° Recipiente"},
              {"key": "tables.limite_liquido.2.golpes", "header": "N° Golpes"},
              {"key": "tables.limite_liquido.2.humedo", "header": "Recip. + húmedo (g)"},
              {"key": "tables.limite_liquido.2.seco", "header": "Recip. + seco (g)"},
              {"key": "tables.limite_liquido.2.tara", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Líquido - Muestra 3",
            "subheaders": [
              {"key": "tables.limite_liquido.3.codigo", "header": "N° Recipiente"},
              {"key": "tables.limite_liquido.3.golpes", "header": "N° Golpes"},
              {"key": "tables.limite_liquido.3.humedo", "header": "Recip. + húmedo (g)"},
              {"key": "tables.limite_liquido.3.seco", "header": "Recip. + seco (g)"},
              {"key": "tables.limite_liquido.3.tara", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Plástico - Muestra 1",
            "subheaders": [
              {"key": "tables.limite_plastico.1.codigo", "header": "N° Recipiente"},
              {"key": "tables.limite_plastico.1.humedo", "header": "Recip. + húmedo (g)"},
              {"key": "tables.limite_plastico.1.seco", "header": "Recip. + seco (g)"},
              {"key": "tables.limite_plastico.1.tara", "header": "Peso recip. (g)"}
            ]
          },
          {
            "header": "Límite Plástico - Muestra 2",
            "subheaders": [
              {"key": "tables.limite_plastico.2.codigo", "header": "N° Recipiente"},
              {"key": "tables.limite_plastico.2.humedo", "header": "Recip. + húmedo (g)"},
              {"key": "tables.limite_plastico.2.seco", "header": "Recip. + seco (g)"},
              {"key": "tables.limite_plastico.2.tara", "header": "Peso recip. (g)"}
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
              {"key": "tables.humedad_natural.1.codigo", "header": "Codigo Capsula"},
              {"key": "tables.humedad_natural.1.tara", "header": "Peso de Cápsula (g)"},
              {"key": "tables.humedad_natural.1.humedo", "header": "Peso Capsula + Suelo Humedo (g)"},
              {"key": "tables.humedad_natural.1.seco", "header": "Peso de la Capsula + Suelo Seco (g)"}
            ]
          },
          {
            "header": "Muestra 2",
            "subheaders": [
              {"key": "tables.humedad_natural.2.codigo", "header": "Codigo Capsula"},
              {"key": "tables.humedad_natural.2.tara", "header": "Peso de Cápsula (g)"},
              {"key": "tables.humedad_natural.2.humedo", "header": "Peso Capsula + Suelo Humedo (g)"},
              {"key": "tables.humedad_natural.2.seco", "header": "Peso de la Capsula + Suelo Seco (g)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Humedad Natural"
  }
]
$$::jsonb
WHERE id = 2;

-- 3. CBR (ID 3)
UPDATE tipo_ensayo
SET config_export_excel = $$
[
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Ensayo de Compactación CBR",
        "headers": [
          {
            "header": "Datos Generales",
            "subheaders": [
              {"key": "tables.compactacion.fecha", "width": 12, "header": "Fecha"},
              {"key": "tables.compactacion.m1_molde", "width": 12, "header": "Nº Molde (M1)"},
              {"key": "tables.compactacion.m2_molde", "width": 12, "header": "Nº Molde (M2)"},
              {"key": "tables.compactacion.m3_molde", "width": 12, "header": "Nº Molde (M3)"}
            ]
          },
          {
            "header": "Molde 1",
            "subheaders": [
              {"key": "tables.compactacion.m1_ns.pm_sh", "width": 15, "header": "P.M.+S.H. (NS)"},
              {"key": "tables.compactacion.m1_s.pm_sh", "width": 15, "header": "P.M.+S.H. (S)"},
              {"key": "tables.compactacion.m1_ns.pm", "width": 15, "header": "Peso Molde (NS)"},
              {"key": "tables.compactacion.m1_s.pm", "width": 15, "header": "Peso Molde (S)"},
              {"key": "tables.compactacion.m1_ns.pt", "width": 15, "header": "P. Tara (NS)"},
              {"key": "tables.compactacion.m1_s.pt", "width": 15, "header": "P. Tara (S)"},
              {"key": "tables.compactacion.m1_ns.psh_t", "width": 15, "header": "P.S.H.+T. (NS)"},
              {"key": "tables.compactacion.m1_s.psh_t", "width": 15, "header": "P.S.H.+T. (S)"},
              {"key": "tables.compactacion.m1_ns.pss_t", "width": 15, "header": "P.S.S.+T. (NS)"},
              {"key": "tables.compactacion.m1_s.pss_t", "width": 15, "header": "P.S.S.+T. (S)"},
              {"key": "tables.compactacion.m1_ns.humedad", "width": 15, "header": "% Humedad (NS)"},
              {"key": "tables.compactacion.m1_s.humedad", "width": 15, "header": "% Humedad (S)"},
              {"key": "tables.compactacion.m1_ns.densidad_seca", "width": 15, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "Molde 2",
            "subheaders": [
              {"key": "tables.compactacion.m2_ns.pm_sh", "width": 15, "header": "P.M.+S.H. (NS)"},
              {"key": "tables.compactacion.m2_s.pm_sh", "width": 15, "header": "P.M.+S.H. (S)"},
              {"key": "tables.compactacion.m2_ns.pm", "width": 15, "header": "Peso Molde (NS)"},
              {"key": "tables.compactacion.m2_s.pm", "width": 15, "header": "Peso Molde (S)"},
              {"key": "tables.compactacion.m2_ns.pt", "width": 15, "header": "P. Tara (NS)"},
              {"key": "tables.compactacion.m2_s.pt", "width": 15, "header": "P. Tara (S)"},
              {"key": "tables.compactacion.m2_ns.psh_t", "width": 15, "header": "P.S.H.+T. (NS)"},
              {"key": "tables.compactacion.m2_s.psh_t", "width": 15, "header": "P.S.H.+T. (S)"},
              {"key": "tables.compactacion.m2_ns.pss_t", "width": 15, "header": "P.S.S.+T. (NS)"},
              {"key": "tables.compactacion.m2_s.pss_t", "width": 15, "header": "P.S.S.+T. (S)"}
            ]
          },
          {
            "header": "Molde 3",
            "subheaders": [
              {"key": "tables.compactacion.m3_ns.pm_sh", "width": 15, "header": "P.M.+S.H. (NS)"},
              {"key": "tables.compactacion.m3_s.pm_sh", "width": 15, "header": "P.M.+S.H. (S)"},
              {"key": "tables.compactacion.m3_ns.pm", "width": 15, "header": "Peso Molde (NS)"},
              {"key": "tables.compactacion.m3_s.pm", "width": 15, "header": "Peso Molde (S)"},
              {"key": "tables.compactacion.m3_ns.pt", "width": 15, "header": "P. Tara (NS)"},
              {"key": "tables.compactacion.m3_s.pt", "width": 15, "header": "P. Tara (S)"},
              {"key": "tables.compactacion.m3_ns.psh_t", "width": 15, "header": "P.S.H.+T. (NS)"},
              {"key": "tables.compactacion.m3_s.psh_t", "width": 15, "header": "P.S.H.+T. (S)"},
              {"key": "tables.compactacion.m3_ns.pss_t", "width": 15, "header": "P.S.S.+T. (NS)"},
              {"key": "tables.compactacion.m3_s.pss_t", "width": 15, "header": "P.S.S.+T. (S)"}
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
              {"key": "tables.expansion.fecha", "width": 12, "header": "Fecha"},
              {"key": "tables.expansion.hora", "width": 10, "header": "Hora"}
            ]
          },
          {
            "header": "Lecturas Molde 1 (mm)",
            "subheaders": [
              {"key": "tables.expansion.m1_mm.lec_0h", "width": 12, "header": "Lec 0 Hr"},
              {"key": "tables.expansion.m1_mm.lec_24h", "width": 12, "header": "Lec 24 Hr"},
              {"key": "tables.expansion.m1_mm.lec_48h", "width": 12, "header": "Lec 48 Hr"},
              {"key": "tables.expansion.m1_mm.lec_72h", "width": 12, "header": "Lec 72 Hr"},
              {"key": "tables.expansion.m1_mm.lec_96h", "width": 12, "header": "Lec 96 Hr"},
              {"key": "tables.expansion.m1_mm.expansion_porc", "width": 12, "header": "% Exp"}
            ]
          },
          {
            "header": "Lecturas Molde 2 (mm)",
            "subheaders": [
              {"key": "tables.expansion.m2_mm.lec_0h", "width": 12, "header": "Lec 0 Hr"},
              {"key": "tables.expansion.m2_mm.lec_24h", "width": 12, "header": "Lec 24 Hr"},
              {"key": "tables.expansion.m2_mm.lec_48h", "width": 12, "header": "Lec 48 Hr"},
              {"key": "tables.expansion.m2_mm.lec_72h", "width": 12, "header": "Lec 72 Hr"},
              {"key": "tables.expansion.m2_mm.lec_96h", "width": 12, "header": "Lec 96 Hr"},
              {"key": "tables.expansion.m2_mm.expansion_porc", "width": 12, "header": "% Exp"}
            ]
          },
          {
            "header": "Lecturas Molde 3 (mm)",
            "subheaders": [
              {"key": "tables.expansion.m3_mm.lec_0h", "width": 12, "header": "Lec 0 Hr"},
              {"key": "tables.expansion.m3_mm.lec_24h", "width": 12, "header": "Lec 24 Hr"},
              {"key": "tables.expansion.m3_mm.lec_48h", "width": 12, "header": "Lec 48 Hr"},
              {"key": "tables.expansion.m3_mm.lec_72h", "width": 12, "header": "Lec 72 Hr"},
              {"key": "tables.expansion.m3_mm.lec_96h", "width": 12, "header": "Lec 96 Hr"},
              {"key": "tables.expansion.m3_mm.expansion_porc", "width": 12, "header": "% Exp"}
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
              {"key": "tables.penetracion.m1_kg.p0_00", "width": 12, "header": "Pen 0mm"},
              {"key": "tables.penetracion.m1_kg.p0_64", "width": 12, "header": "Pen 0.64mm"},
              {"key": "tables.penetracion.m1_kg.p1_27", "width": 12, "header": "Pen 1.27mm"},
              {"key": "tables.penetracion.m1_kg.p1_91", "width": 12, "header": "Pen 1.91mm"},
              {"key": "tables.penetracion.m1_kg.p2_54", "width": 12, "header": "Pen 2.54mm"},
              {"key": "tables.penetracion.m1_kg.p3_18", "width": 12, "header": "Pen 3.18mm"},
              {"key": "tables.penetracion.m1_kg.p3_81", "width": 12, "header": "Pen 3.81mm"},
              {"key": "tables.penetracion.m1_kg.p5_08", "width": 12, "header": "Pen 5.08mm"},
              {"key": "tables.penetracion.m1_kg.p6_35", "width": 12, "header": "Pen 6.35mm"},
              {"key": "tables.penetracion.m1_kg.p7_62", "width": 12, "header": "Pen 7.62mm"},
              {"key": "tables.penetracion.m1_kg.p10_16", "width": 12, "header": "Pen 10.16mm"},
              {"key": "tables.penetracion.m1_kg.p12_70", "width": 12, "header": "Pen 12.70mm"},
              {"key": "tables.penetracion.m1_kg.cbr_01", "width": 15, "header": "CBR 0.1\""},
              {"key": "tables.penetracion.m1_kg.cbr_02", "width": 15, "header": "CBR 0.2\""}
            ]
          },
          {
            "header": "Lecturas Molde 2 (kg)",
            "subheaders": [
              {"key": "tables.penetracion.m2_kg.p0_00", "width": 12, "header": "Pen 0mm"},
              {"key": "tables.penetracion.m2_kg.p0_64", "width": 12, "header": "Pen 0.64mm"},
              {"key": "tables.penetracion.m2_kg.p1_27", "width": 12, "header": "Pen 1.27mm"},
              {"key": "tables.penetracion.m2_kg.p1_91", "width": 12, "header": "Pen 1.91mm"},
              {"key": "tables.penetracion.m2_kg.p2_54", "width": 12, "header": "Pen 2.54mm"},
              {"key": "tables.penetracion.m2_kg.cbr_01", "width": 15, "header": "CBR 0.1\""}
            ]
          },
          {
            "header": "Lecturas Molde 3 (kg)",
            "subheaders": [
              {"key": "tables.penetracion.m3_kg.p2_54", "width": 12, "header": "Pen 2.54mm"},
              {"key": "tables.penetracion.m3_kg.cbr_01", "width": 15, "header": "CBR 0.1\""}
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
              {"key": "tables.penetracion.m1_kg.cbr_final", "width": 15, "header": "CBR Final (%)"},
              {"key": "tables.expansion.m1_mm.expansion_porc", "width": 15, "header": "% Expansión"},
              {"key": "tables.compactacion.m1_ns.densidad_seca", "width": 15, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "Resultados Molde 2",
            "subheaders": [
              {"key": "tables.penetracion.m2_kg.cbr_final", "width": 15, "header": "CBR Final (%)"},
              {"key": "tables.expansion.m2_mm.expansion_porc", "width": 15, "header": "% Expansión"}
            ]
          },
          {
            "header": "Resultados Molde 3",
            "subheaders": [
              {"key": "tables.penetracion.m3_kg.cbr_final", "width": 15, "header": "CBR Final (%)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Resultados de CBR"
  }
]
$$::jsonb
WHERE id = 3;

-- 4. PROCTOR (ID 4)
UPDATE tipo_ensayo
SET config_export_excel = $$
[
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Ensayo Proctor Modificado",
        "headers": [
          {
            "header": "Datos Generales",
            "subheaders": [
              {"key": "tables.datos_entrada.fecha", "width": 12, "header": "Fecha"},
              {"key": "tables.datos_entrada.codigo_molde", "width": 15, "header": "Código Molde"},
              {"key": "tables.datos_entrada.volumen_molde", "width": 20, "header": "Volumen Molde (cm³)"},
              {"key": "tables.datos_entrada.peso_martillo", "width": 20, "header": "Peso Martillo (kg)"}
            ]
          },
          {
            "header": "Muestra 1",
            "subheaders": [
              {"key": "tables.datos_entrada.m1.peso_molde_suelo", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m1.peso_molde", "width": 22, "header": "Peso Molde (g)"},
              {"key": "tables.calculo_humedad.m1.capsula_nro", "width": 15, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m1.peso_capsula", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m1.pc_sh", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "tables.calculo_humedad.m1.pc_ss", "width": 18, "header": "P.C. + S.S. (g)"},
              {"key": "tables.datos_entrada.m1.densidad_humeda", "width": 18, "header": "Densidad Húmeda"},
              {"key": "tables.calculo_humedad.m1.humedad", "width": 18, "header": "Humedad (%)"},
              {"key": "tables.calculo_humedad.m1.densidad_seca", "width": 18, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "Muestra 2",
            "subheaders": [
              {"key": "tables.datos_entrada.m2.peso_molde_suelo", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m2.peso_molde", "width": 22, "header": "Peso Molde (g)"},
              {"key": "tables.calculo_humedad.m2.capsula_nro", "width": 15, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m2.peso_capsula", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m2.pc_sh", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "tables.calculo_humedad.m2.pc_ss", "width": 18, "header": "P.C. + S.S. (g)"}
            ]
          },
          {
            "header": "Muestra 3",
            "subheaders": [
              {"key": "tables.datos_entrada.m3.peso_molde_suelo", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m3.peso_molde", "width": 22, "header": "Peso Molde (g)"},
              {"key": "tables.calculo_humedad.m3.capsula_nro", "width": 15, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m3.peso_capsula", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m3.pc_sh", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "tables.calculo_humedad.m3.pc_ss", "width": 18, "header": "P.C. + S.S. (g)"}
            ]
          },
          {
            "header": "Muestra 4",
            "subheaders": [
              {"key": "tables.datos_entrada.m4.peso_molde_suelo", "width": 22, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m4.peso_molde", "width": 22, "header": "Peso Molde (g)"},
              {"key": "tables.calculo_humedad.m4.capsula_nro", "width": 15, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m4.peso_capsula", "width": 18, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m4.pc_sh", "width": 18, "header": "P.C. + S.H. (g)"},
              {"key": "tables.calculo_humedad.m4.pc_ss", "width": 18, "header": "P.C. + S.S. (g)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Proctor"
  }
]
$$::jsonb
WHERE id = 4;
