-- Actualiza config_export_excel de CBR (id = 3) y Proctor (id = 4)
-- para alinearlo con la estructura actual de config_tabla/config_calculos.

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
              {"key": "tables.compactacion.m1_molde", "width": 14, "header": "Molde N° M-1"},
              {"key": "tables.compactacion.m2_molde", "width": 14, "header": "Molde N° M-2"},
              {"key": "tables.compactacion.m3_molde", "width": 14, "header": "Molde N° M-3"}
            ]
          },
          {
            "header": "M-1 No Saturado",
            "subheaders": [
              {"key": "tables.compactacion.m1_ns.pm_sh", "width": 16, "header": "P. Molde + Suelo Húmedo"},
              {"key": "tables.compactacion.m1_ns.pm", "width": 14, "header": "P. Molde"},
              {"key": "tables.compactacion.m1_ns.pt", "width": 14, "header": "P. Tara"},
              {"key": "tables.compactacion.m1_ns.psh_t", "width": 16, "header": "P. Suelo Húmedo + Tara"},
              {"key": "tables.compactacion.m1_ns.pss_t", "width": 16, "header": "P. Suelo Seco + Tara"},
              {"key": "tables.compactacion.m1_ns.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.compactacion.m1_ns.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.compactacion.m1_ns.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "M-1 Saturado",
            "subheaders": [
              {"key": "tables.compactacion.m1_s.pm_sh", "width": 16, "header": "P. Molde + Suelo Húmedo"},
              {"key": "tables.compactacion.m1_s.pm", "width": 14, "header": "P. Molde"},
              {"key": "tables.compactacion.m1_s.pt", "width": 14, "header": "P. Tara"},
              {"key": "tables.compactacion.m1_s.psh_t", "width": 16, "header": "P. Suelo Húmedo + Tara"},
              {"key": "tables.compactacion.m1_s.pss_t", "width": 16, "header": "P. Suelo Seco + Tara"},
              {"key": "tables.compactacion.m1_s.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.compactacion.m1_s.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.compactacion.m1_s.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "M-2 No Saturado",
            "subheaders": [
              {"key": "tables.compactacion.m2_ns.pm_sh", "width": 16, "header": "P. Molde + Suelo Húmedo"},
              {"key": "tables.compactacion.m2_ns.pm", "width": 14, "header": "P. Molde"},
              {"key": "tables.compactacion.m2_ns.pt", "width": 14, "header": "P. Tara"},
              {"key": "tables.compactacion.m2_ns.psh_t", "width": 16, "header": "P. Suelo Húmedo + Tara"},
              {"key": "tables.compactacion.m2_ns.pss_t", "width": 16, "header": "P. Suelo Seco + Tara"},
              {"key": "tables.compactacion.m2_ns.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.compactacion.m2_ns.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.compactacion.m2_ns.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "M-2 Saturado",
            "subheaders": [
              {"key": "tables.compactacion.m2_s.pm_sh", "width": 16, "header": "P. Molde + Suelo Húmedo"},
              {"key": "tables.compactacion.m2_s.pm", "width": 14, "header": "P. Molde"},
              {"key": "tables.compactacion.m2_s.pt", "width": 14, "header": "P. Tara"},
              {"key": "tables.compactacion.m2_s.psh_t", "width": 16, "header": "P. Suelo Húmedo + Tara"},
              {"key": "tables.compactacion.m2_s.pss_t", "width": 16, "header": "P. Suelo Seco + Tara"},
              {"key": "tables.compactacion.m2_s.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.compactacion.m2_s.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.compactacion.m2_s.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "M-3 No Saturado",
            "subheaders": [
              {"key": "tables.compactacion.m3_ns.pm_sh", "width": 16, "header": "P. Molde + Suelo Húmedo"},
              {"key": "tables.compactacion.m3_ns.pm", "width": 14, "header": "P. Molde"},
              {"key": "tables.compactacion.m3_ns.pt", "width": 14, "header": "P. Tara"},
              {"key": "tables.compactacion.m3_ns.psh_t", "width": 16, "header": "P. Suelo Húmedo + Tara"},
              {"key": "tables.compactacion.m3_ns.pss_t", "width": 16, "header": "P. Suelo Seco + Tara"},
              {"key": "tables.compactacion.m3_ns.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.compactacion.m3_ns.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.compactacion.m3_ns.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "M-3 Saturado",
            "subheaders": [
              {"key": "tables.compactacion.m3_s.pm_sh", "width": 16, "header": "P. Molde + Suelo Húmedo"},
              {"key": "tables.compactacion.m3_s.pm", "width": 14, "header": "P. Molde"},
              {"key": "tables.compactacion.m3_s.pt", "width": 14, "header": "P. Tara"},
              {"key": "tables.compactacion.m3_s.psh_t", "width": 16, "header": "P. Suelo Húmedo + Tara"},
              {"key": "tables.compactacion.m3_s.pss_t", "width": 16, "header": "P. Suelo Seco + Tara"},
              {"key": "tables.compactacion.m3_s.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.compactacion.m3_s.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.compactacion.m3_s.densidad_seca", "width": 14, "header": "Densidad Seca"}
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
              {"key": "tables.expansion.fecha", "width": 12, "header": "Fecha Inicio"},
              {"key": "tables.expansion.hora", "width": 10, "header": "Hora Inicio"}
            ]
          },
          {
            "header": "Molde 1",
            "subheaders": [
              {"key": "tables.expansion.m1_mm.lec_0h", "width": 12, "header": "Lectura 0 Hr"},
              {"key": "tables.expansion.m1_mm.lec_24h", "width": 12, "header": "Lectura 24 Hr"},
              {"key": "tables.expansion.m1_mm.lec_48h", "width": 12, "header": "Lectura 48 Hr"},
              {"key": "tables.expansion.m1_mm.lec_72h", "width": 12, "header": "Lectura 72 Hr"},
              {"key": "tables.expansion.m1_mm.lec_96h", "width": 12, "header": "Lectura 96 Hr"},
              {"key": "tables.expansion.m1_mm.expansion_mm", "width": 14, "header": "Expansión Total (mm)"},
              {"key": "tables.expansion.m1_mm.expansion_porc", "width": 12, "header": "Expansión (%)"}
            ]
          },
          {
            "header": "Molde 2",
            "subheaders": [
              {"key": "tables.expansion.m2_mm.lec_0h", "width": 12, "header": "Lectura 0 Hr"},
              {"key": "tables.expansion.m2_mm.lec_24h", "width": 12, "header": "Lectura 24 Hr"},
              {"key": "tables.expansion.m2_mm.lec_48h", "width": 12, "header": "Lectura 48 Hr"},
              {"key": "tables.expansion.m2_mm.lec_72h", "width": 12, "header": "Lectura 72 Hr"},
              {"key": "tables.expansion.m2_mm.lec_96h", "width": 12, "header": "Lectura 96 Hr"},
              {"key": "tables.expansion.m2_mm.expansion_mm", "width": 14, "header": "Expansión Total (mm)"},
              {"key": "tables.expansion.m2_mm.expansion_porc", "width": 12, "header": "Expansión (%)"}
            ]
          },
          {
            "header": "Molde 3",
            "subheaders": [
              {"key": "tables.expansion.m3_mm.lec_0h", "width": 12, "header": "Lectura 0 Hr"},
              {"key": "tables.expansion.m3_mm.lec_24h", "width": 12, "header": "Lectura 24 Hr"},
              {"key": "tables.expansion.m3_mm.lec_48h", "width": 12, "header": "Lectura 48 Hr"},
              {"key": "tables.expansion.m3_mm.lec_72h", "width": 12, "header": "Lectura 72 Hr"},
              {"key": "tables.expansion.m3_mm.lec_96h", "width": 12, "header": "Lectura 96 Hr"},
              {"key": "tables.expansion.m3_mm.expansion_mm", "width": 14, "header": "Expansión Total (mm)"},
              {"key": "tables.expansion.m3_mm.expansion_porc", "width": 12, "header": "Expansión (%)"}
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
            "header": "Datos Generales",
            "subheaders": [
              {"key": "tables.penetracion.fecha", "width": 12, "header": "Fecha"}
            ]
          },
          {
            "header": "Molde 1",
            "subheaders": [
              {"key": "tables.penetracion.m1_kg.p0_64", "width": 12, "header": "0.64 mm"},
              {"key": "tables.penetracion.m1_kg.p1_27", "width": 12, "header": "1.27 mm"},
              {"key": "tables.penetracion.m1_kg.p1_91", "width": 12, "header": "1.91 mm"},
              {"key": "tables.penetracion.m1_kg.p2_54", "width": 12, "header": "2.54 mm"},
              {"key": "tables.penetracion.m1_kg.p3_18", "width": 12, "header": "3.18 mm"},
              {"key": "tables.penetracion.m1_kg.p3_81", "width": 12, "header": "3.81 mm"},
              {"key": "tables.penetracion.m1_kg.p5_08", "width": 12, "header": "5.08 mm"},
              {"key": "tables.penetracion.m1_kg.p7_62", "width": 12, "header": "7.62 mm"},
              {"key": "tables.penetracion.m1_kg.p10_16", "width": 12, "header": "10.16 mm"},
              {"key": "tables.penetracion.m1_kg.p12_70", "width": 12, "header": "12.70 mm"},
              {"key": "tables.penetracion.m1_kg.cbr_01", "width": 12, "header": "CBR 0.1\" (%)"},
              {"key": "tables.penetracion.m1_kg.cbr_02", "width": 12, "header": "CBR 0.2\" (%)"},
              {"key": "tables.penetracion.m1_kg.cbr_final", "width": 12, "header": "CBR Final (%)"}
            ]
          },
          {
            "header": "Molde 2",
            "subheaders": [
              {"key": "tables.penetracion.m2_kg.p0_64", "width": 12, "header": "0.64 mm"},
              {"key": "tables.penetracion.m2_kg.p1_27", "width": 12, "header": "1.27 mm"},
              {"key": "tables.penetracion.m2_kg.p1_91", "width": 12, "header": "1.91 mm"},
              {"key": "tables.penetracion.m2_kg.p2_54", "width": 12, "header": "2.54 mm"},
              {"key": "tables.penetracion.m2_kg.p3_18", "width": 12, "header": "3.18 mm"},
              {"key": "tables.penetracion.m2_kg.p3_81", "width": 12, "header": "3.81 mm"},
              {"key": "tables.penetracion.m2_kg.p5_08", "width": 12, "header": "5.08 mm"},
              {"key": "tables.penetracion.m2_kg.p7_62", "width": 12, "header": "7.62 mm"},
              {"key": "tables.penetracion.m2_kg.p10_16", "width": 12, "header": "10.16 mm"},
              {"key": "tables.penetracion.m2_kg.p12_70", "width": 12, "header": "12.70 mm"},
              {"key": "tables.penetracion.m2_kg.cbr_01", "width": 12, "header": "CBR 0.1\" (%)"},
              {"key": "tables.penetracion.m2_kg.cbr_02", "width": 12, "header": "CBR 0.2\" (%)"},
              {"key": "tables.penetracion.m2_kg.cbr_final", "width": 12, "header": "CBR Final (%)"}
            ]
          },
          {
            "header": "Molde 3",
            "subheaders": [
              {"key": "tables.penetracion.m3_kg.p0_64", "width": 12, "header": "0.64 mm"},
              {"key": "tables.penetracion.m3_kg.p1_27", "width": 12, "header": "1.27 mm"},
              {"key": "tables.penetracion.m3_kg.p1_91", "width": 12, "header": "1.91 mm"},
              {"key": "tables.penetracion.m3_kg.p2_54", "width": 12, "header": "2.54 mm"},
              {"key": "tables.penetracion.m3_kg.p3_18", "width": 12, "header": "3.18 mm"},
              {"key": "tables.penetracion.m3_kg.p3_81", "width": 12, "header": "3.81 mm"},
              {"key": "tables.penetracion.m3_kg.p5_08", "width": 12, "header": "5.08 mm"},
              {"key": "tables.penetracion.m3_kg.p7_62", "width": 12, "header": "7.62 mm"},
              {"key": "tables.penetracion.m3_kg.p10_16", "width": 12, "header": "10.16 mm"},
              {"key": "tables.penetracion.m3_kg.p12_70", "width": 12, "header": "12.70 mm"},
              {"key": "tables.penetracion.m3_kg.cbr_01", "width": 12, "header": "CBR 0.1\" (%)"},
              {"key": "tables.penetracion.m3_kg.cbr_02", "width": 12, "header": "CBR 0.2\" (%)"},
              {"key": "tables.penetracion.m3_kg.cbr_final", "width": 12, "header": "CBR Final (%)"}
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
        "titulo": "Resultados Finales de CBR",
        "headers": [
          {
            "header": "Molde 1",
            "subheaders": [
              {"key": "tables.compactacion.m1_ns.densidad_seca", "width": 14, "header": "Densidad Seca NS"},
              {"key": "tables.compactacion.m1_s.densidad_seca", "width": 14, "header": "Densidad Seca S"},
              {"key": "tables.expansion.m1_mm.expansion_porc", "width": 12, "header": "Expansión (%)"},
              {"key": "tables.penetracion.m1_kg.cbr_final", "width": 12, "header": "CBR Final (%)"}
            ]
          },
          {
            "header": "Molde 2",
            "subheaders": [
              {"key": "tables.compactacion.m2_ns.densidad_seca", "width": 14, "header": "Densidad Seca NS"},
              {"key": "tables.compactacion.m2_s.densidad_seca", "width": 14, "header": "Densidad Seca S"},
              {"key": "tables.expansion.m2_mm.expansion_porc", "width": 12, "header": "Expansión (%)"},
              {"key": "tables.penetracion.m2_kg.cbr_final", "width": 12, "header": "CBR Final (%)"}
            ]
          },
          {
            "header": "Molde 3",
            "subheaders": [
              {"key": "tables.compactacion.m3_ns.densidad_seca", "width": 14, "header": "Densidad Seca NS"},
              {"key": "tables.compactacion.m3_s.densidad_seca", "width": 14, "header": "Densidad Seca S"},
              {"key": "tables.expansion.m3_mm.expansion_porc", "width": 12, "header": "Expansión (%)"},
              {"key": "tables.penetracion.m3_kg.cbr_final", "width": 12, "header": "CBR Final (%)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Resultados de CBR"
  }
]
$$
WHERE id = 3;

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
              {"key": "tables.datos_entrada.volumen_molde", "width": 16, "header": "Volumen Molde (cm³)"},
              {"key": "tables.datos_entrada.peso_martillo", "width": 16, "header": "Peso Martillo (kg)"}
            ]
          },
          {
            "header": "Muestra 1",
            "subheaders": [
              {"key": "tables.datos_entrada.m1.peso_molde", "width": 16, "header": "Peso Molde (g)"},
              {"key": "tables.datos_entrada.m1.peso_molde_suelo", "width": 18, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m1.peso_suelo_compactado", "width": 18, "header": "Peso Suelo Compactado (g)"},
              {"key": "tables.datos_entrada.m1.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.calculo_humedad.m1.capsula_nro", "width": 14, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m1.peso_capsula", "width": 16, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m1.pc_sh", "width": 16, "header": "P. Cap. + Suelo Húmedo"},
              {"key": "tables.calculo_humedad.m1.pc_ss", "width": 16, "header": "P. Cap. + Suelo Seco"},
              {"key": "tables.calculo_humedad.m1.peso_agua", "width": 14, "header": "Peso Agua (g)"},
              {"key": "tables.calculo_humedad.m1.peso_seco", "width": 14, "header": "Peso Suelo Seco (g)"},
              {"key": "tables.calculo_humedad.m1.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.calculo_humedad.m1.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "Muestra 2",
            "subheaders": [
              {"key": "tables.datos_entrada.m2.peso_molde", "width": 16, "header": "Peso Molde (g)"},
              {"key": "tables.datos_entrada.m2.peso_molde_suelo", "width": 18, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m2.peso_suelo_compactado", "width": 18, "header": "Peso Suelo Compactado (g)"},
              {"key": "tables.datos_entrada.m2.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.calculo_humedad.m2.capsula_nro", "width": 14, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m2.peso_capsula", "width": 16, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m2.pc_sh", "width": 16, "header": "P. Cap. + Suelo Húmedo"},
              {"key": "tables.calculo_humedad.m2.pc_ss", "width": 16, "header": "P. Cap. + Suelo Seco"},
              {"key": "tables.calculo_humedad.m2.peso_agua", "width": 14, "header": "Peso Agua (g)"},
              {"key": "tables.calculo_humedad.m2.peso_seco", "width": 14, "header": "Peso Suelo Seco (g)"},
              {"key": "tables.calculo_humedad.m2.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.calculo_humedad.m2.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "Muestra 3",
            "subheaders": [
              {"key": "tables.datos_entrada.m3.peso_molde", "width": 16, "header": "Peso Molde (g)"},
              {"key": "tables.datos_entrada.m3.peso_molde_suelo", "width": 18, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m3.peso_suelo_compactado", "width": 18, "header": "Peso Suelo Compactado (g)"},
              {"key": "tables.datos_entrada.m3.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.calculo_humedad.m3.capsula_nro", "width": 14, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m3.peso_capsula", "width": 16, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m3.pc_sh", "width": 16, "header": "P. Cap. + Suelo Húmedo"},
              {"key": "tables.calculo_humedad.m3.pc_ss", "width": 16, "header": "P. Cap. + Suelo Seco"},
              {"key": "tables.calculo_humedad.m3.peso_agua", "width": 14, "header": "Peso Agua (g)"},
              {"key": "tables.calculo_humedad.m3.peso_seco", "width": 14, "header": "Peso Suelo Seco (g)"},
              {"key": "tables.calculo_humedad.m3.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.calculo_humedad.m3.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          },
          {
            "header": "Muestra 4",
            "subheaders": [
              {"key": "tables.datos_entrada.m4.peso_molde", "width": 16, "header": "Peso Molde (g)"},
              {"key": "tables.datos_entrada.m4.peso_molde_suelo", "width": 18, "header": "Peso Molde + Suelo (g)"},
              {"key": "tables.datos_entrada.m4.peso_suelo_compactado", "width": 18, "header": "Peso Suelo Compactado (g)"},
              {"key": "tables.datos_entrada.m4.densidad_humeda", "width": 14, "header": "Densidad Húmeda"},
              {"key": "tables.calculo_humedad.m4.capsula_nro", "width": 14, "header": "Cápsula Nro."},
              {"key": "tables.calculo_humedad.m4.peso_capsula", "width": 16, "header": "Peso Cápsula (g)"},
              {"key": "tables.calculo_humedad.m4.pc_sh", "width": 16, "header": "P. Cap. + Suelo Húmedo"},
              {"key": "tables.calculo_humedad.m4.pc_ss", "width": 16, "header": "P. Cap. + Suelo Seco"},
              {"key": "tables.calculo_humedad.m4.peso_agua", "width": 14, "header": "Peso Agua (g)"},
              {"key": "tables.calculo_humedad.m4.peso_seco", "width": 14, "header": "Peso Suelo Seco (g)"},
              {"key": "tables.calculo_humedad.m4.humedad", "width": 12, "header": "Humedad (%)"},
              {"key": "tables.calculo_humedad.m4.densidad_seca", "width": 14, "header": "Densidad Seca"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Proctor"
  },
  {
    "layout": "multi_tabla_vertical",
    "tablas": [
      {
        "titulo": "Resultados Principales del Proctor Modificado",
        "headers": [
          {
            "header": "Resultados",
            "subheaders": [
              {"key": "results.maxima_densidad_seca", "width": 18, "header": "Máxima Densidad Seca (g/cm³)"},
              {"key": "results.humedad_optima", "width": 18, "header": "Humedad Óptima (%)"}
            ]
          }
        ]
      }
    ],
    "sheetName": "Resultados Proctor"
  }
]
$$
WHERE id = 4;
