
UPDATE tipo_ensayo SET config_reporte_pdf = '{
  "config_key": "granulometria",
  "document": {
    "title": "Granulometría por tamizado",
    "subtitle": "Norma MTC E 107 / ASTM D422",
    "orientation": "portrait",
    "paperSize": "A4"
  },
  "header": {
    "title": "GOBIERNO REGIONAL CUSCO",
    "subtitle": "Gerencia Regional de Transportes y Comunicaciones Cusco",
    "subsubtitle": "SUB GERENCIA DE COBERTURA Y COMUNICACIONES",
    "department": "UNIDAD FUNCIONAL ESTUDIOS Y PROYECTOS",
    "laboratory": "Laboratorio de Mecánica de Suelos, Materiales y Pavimentos",
    "slogan": "«Año de la recuperación y consolidación de la economía peruana»",
    "logo_left_url": "/assets/logo_grtc.png",
    "logo_right_url": "/assets/logo_cusco.png"
  },
  "metadataFields": [
    { "label": "Proyecto", "source": "proyecto_nombre", "colSpan": 8, "highlight": true },
    { "label": "Ubicación", "fields": [
        { "sublabel": "Lugar", "source": "tramo_nombre", "width": "20%" },
        { "sublabel": "Distrito", "source": "distrito", "width": "15%" },
        { "sublabel": "Provincia", "source": "provincia", "width": "15%" },
        { "sublabel": "Dpto", "source": "departamento", "width": "10%" }
      ]
    },
    { "label": "Solicitante", "source": "solicitante", "colSpan": 3 },
    { "label": "Coordenadas", "fields": [
        { "sublabel": "E", "source": "longitud", "width": "25%" },
        { "sublabel": "N", "source": "latitud", "width": "25%" }
      ]
    },
    { "label": "Datos de Muestra", "fields": [
        { "sublabel": "Exploración", "source": "calicata", "width": "12%" },
        { "sublabel": "Progresiva", "source": "progresiva_codigo", "width": "15%", "format": "progresiva" },
        { "sublabel": "Estrato", "source": "estrato_orden", "width": "12%" },
        { "sublabel": "Lado", "source": "lado", "width": "12%" }
      ]
    },
    { "label": "Profundidad", "source": "profundidad", "colSpan": 3 },
    { "label": "Fecha Muestreo", "source": "fecha_muestreo", "colSpan": 3, "format": "fecha" }
  ],
  "pages": [
    {
      "layout": {
        "type": "grid",
        "columns": [
          {
            "width": "60%",
            "components": [
              {
                "type": "section_title",
                "text": "Granulometría por tamizado - MTC E 107"
              },
              {
                "type": "table_pesos",
                "fields": [
                  { "label": "Peso Total =", "source": "formData.peso_total", "format": "0.1", "suffix": " g" },
                  { "label": "Peso de muestra lavada =", "source": "formData.peso_muestra_lavada", "format": "0.1", "suffix": " g" },
                  { "label": "Peso de la Fracción Gruesa =", "source": "formData.peso_fraccion_gruesa", "format": "0.1", "suffix": " g" },
                  { "label": "Peso de fracción Fina =", "source": "resultados.peso_fraccion_fina", "format": "0.1", "suffix": " g", "highlight": true },
                  { "label": "Peso de la fracción Fina =", "source": "formData.peso_fraccion_fina", "format": "0.1", "suffix": " g" },
                  { "label": "Coeficiente =", "source": "resultados.coeficiente", "format": "0.02", "suffix": "" }
                ]
              },
              {
                "type": "table_tamices",
                "sourceTable": "granulometria",
                "columns": [
                  { "header": "Tamiz", "field": "label", "type": "label" },
                  { "header": "mm.", "field": "mm", "type": "number", "format": "0.000" },
                  { "header": "Masa (g)", "field": "masa", "type": "input", "format": "0.2" },
                  { "header": "% Ret Parcial", "field": "porcentaje_retenido", "type": "calculated", "format": "0.1", "result_config": { "path": "tables.granulometria.{row_key}.porcentaje_retenido" } },
                  { "header": "% Ret Acum.", "field": "acum_retenido_porcentaje", "type": "calculated", "format": "0.1", "result_config": { "path": "tables.granulometria.{row_key}.acum_retenido_porcentaje" } },
                  { "header": "% que Pasa", "field": "pasa", "type": "calculated", "format": "0.1", "highlight": true, "result_config": { "path": "tables.granulometria.{row_key}.pasa" } },
                  { "header": "Especificaciones", "field": "especificacion", "type": "spec" }
                ]
              }
            ]
          },
          {
            "width": "40%",
            "components": [
              {
                "type": "table_static",
                "title": "Tabla de clasificación SUCS",
                "widths": ["20%", "80%"],
                "headers": ["Simb", "NOMBRES TÍPICOS"],
                "rows": [
                  ["GW", "Gravas bien graduadas, mezclas grava-arena, pocos finos o sin finos."],
                  ["GP", "Gravas mal graduadas, mezclas grava-arena, pocos finos o sin finos."],
                  ["GM", "Gravas limosas, mezclas grava-arena-limo."],
                  ["GC", "Gravas arcillosas, mezclas grava-arena-arcilla."],
                  ["SW", "Arenas bien graduadas, arenas con grava, pocos finos o sin finos."],
                  ["SP", "Arenas mal graduadas, arenas con grava, pocos finos o sin finos."],
                  ["SM", "Arenas limosas, mezclas de arena y limo."],
                  ["SC", "Arenas arcillosas, mezclas de arena y arcilla."],
                  ["ML", "Limos inorgánicos y arenas muy finas, limos limpios, arenas finas, limosas o arcillosas, o limos arcillosos con ligera plasticidad."],
                  ["CL", "Arcillas inorgánicas de plasticidad baja a media, arcillas con grava, arcillas arenosas, arcillas limosas."],
                  ["OL", "Limos orgánicos y arcillas orgánicas limosas de baja plasticidad."],
                  ["MH", "Limos inorgánicos, suelos arenosos finos o limosos con mica o diatomeas, limos elásticos."],
                  ["CH", "Arcillas inorgánicas de plasticidad alta."],
                  ["OH", "Arcillas orgánicas de plasticidad media a elevada; limos orgánicos."],
                  ["PT", "Turba y otros suelos de alto contenido orgánico."]
                ]
              }
            ]
          }
        ]
      },
      "classificationBlock": {
        "subtables": [
          {
            "title": "Datos para la clasificación AASHTO",
            "fields": [
              { "header": "T.M. Nominal", "source": "resultados.calculated_values.sucs.tm_nominal" },
              { "header": "% pasa malla N° 10", "source": "resultados.calculated_values.sucs.pasa_10", "format": "0.1" },
              { "header": "% pasa malla N° 40", "source": "resultados.calculated_values.sucs.pasa_40", "format": "0.1" },
              { "header": "% pasa malla N° 200", "source": "resultados.calculated_values.sucs.pasa_200", "format": "0.1" }
            ]
          },
          {
            "title": "Datos para la clasificación SUCS",
            "fields": [
              { "header": "% Grava", "source": "resultados.calculated_values.sucs.porcentaje_grava", "format": "0.1" },
              { "header": "% Arena", "source": "resultados.calculated_values.sucs.porcentaje_arena", "format": "0.1" },
              { "header": "% Finos", "source": "resultados.calculated_values.sucs.porcentaje_finos", "format": "0.1" }
            ]
          }
        ],
        "finalClassification": {
          "banner": "ASTM D2487-17 y AASHTO M145-2000",
          "results": [
            { "label": "Clasificación SUCS:", "source": "resultados.calculated_values.sucs.clasificacion_sucs", "highlight": true },
            { "label": "Clasificación AASHTO:", "source": "resultados.calculated_values.aashto.clasificacion_aashto", "highlight": true }
          ],
          "coefficients": [
            { "label": "D 10", "source": "resultados.calculated_values.sucs.d10", "format": "0.02" },
            { "label": "D 30", "source": "resultados.calculated_values.sucs.d30", "format": "0.02" },
            { "label": "D 50", "source": "resultados.calculated_values.sucs.d50", "format": "0.02" },
            { "label": "D 60", "source": "resultados.calculated_values.sucs.d60", "format": "0.02" },
            { "label": "Cu", "source": "resultados.calculated_values.sucs.cu", "format": "0.02" },
            { "label": "Cc", "source": "resultados.calculated_values.sucs.cc", "format": "0.02" },
            { "label": "L. L.", "source": "resultados.calculated_values.sucs.ll", "format": "0" },
            { "label": "I. P.", "source": "resultados.calculated_values.sucs.ip", "format": "0" }
          ]
        }
      }
    },
    {
      "charts": [
        {
          "chartConfigKey": "granulometria_tendencia",
          "height": "95mm",
          "position": "after_layout"
        }
      ]
    }
  ],
  "signatures": [
    { "role": "ESP. ENSAYOS GEOTECNICOS" },
    { "role": "ESP. SUELOS Y PAVIMENTOS" },
    { "role": "SUPERVISOR" }
  ]
}
' WHERE config_key = 'granulometria';

UPDATE tipo_ensayo SET config_reporte_pdf = '{
  "config_key": "limites",
  "document": {
    "title": "Límites de Consistencia y Contenido de Humedad",
    "subtitle": "Norma MTC E 110 / ASTM D4318",
    "orientation": "portrait",
    "paperSize": "A4"
  },
  "header": {
    "title": "GOBIERNO REGIONAL CUSCO",
    "subtitle": "Gerencia Regional de Transportes y Comunicaciones Cusco",
    "subsubtitle": "SUB GERENCIA DE COBERTURA Y COMUNICACIONES",
    "department": "UNIDAD FUNCIONAL ESTUDIOS Y PROYECTOS",
    "laboratory": "Laboratorio de Mecánica de Suelos, Materiales y Pavimentos",
    "slogan": "«Año de la recuperación y consolidación de la economía peruana»",
    "logo_left_url": "/assets/logo_grtc.png",
    "logo_right_url": "/assets/logo_cusco.png"
  },
  "metadataFields": [
    { "label": "Proyecto", "source": "proyecto_nombre", "colSpan": 8, "highlight": true },
    { "label": "Ubicación", "fields": [
        { "sublabel": "Lugar", "source": "tramo_nombre", "width": "20%" },
        { "sublabel": "Distrito", "source": "distrito", "width": "15%" },
        { "sublabel": "Provincia", "source": "provincia", "width": "15%" },
        { "sublabel": "Dpto", "source": "departamento", "width": "10%" }
      ]
    },
    { "label": "Solicitante", "source": "solicitante", "colSpan": 3 },
    { "label": "Coordenadas", "fields": [
        { "sublabel": "E", "source": "longitud", "width": "25%" },
        { "sublabel": "N", "source": "latitud", "width": "25%" }
      ]
    },
    { "label": "Datos de Muestra", "fields": [
        { "sublabel": "Exploración", "source": "calicata", "width": "12%" },
        { "sublabel": "Progresiva", "source": "progresiva_codigo", "width": "15%", "format": "progresiva" },
        { "sublabel": "Estrato", "source": "estrato_orden", "width": "12%" },
        { "sublabel": "Lado", "source": "lado", "width": "12%" }
      ]
    },
    { "label": "Profundidad", "source": "profundidad", "colSpan": 3 },
    { "label": "Fecha Muestreo", "source": "fecha_muestreo", "colSpan": 3, "format": "fecha" }
  ],
  "signatures": [
    { "role": "ESP. ENSAYOS GEOTECNICOS" },
    { "role": "ESP. SUELOS Y PAVIMENTOS" },
    { "role": "SUPERVISOR" }
  ],
  "pages": [
    {
      "signatures": [
        { "role": "ESP. ENSAYOS GEOTECNICOS" },
        { "role": "ESP. SUELOS Y PAVIMENTOS" },
        { "role": "SUPERVISOR" }
      ],
      "layout": {
        "type": "grid",
        "columns": [
          {
            "width": "50%",
            "components": [
              {
                "type": "section_title",
                "text": "Límite Líquido - MTC E 110",
                "align": "center"
              },
              {
                "type": "table_generic",
                "sourceTable": "limite_liquido"
              },
              {
                "type": "table_pesos",
                "fields": [
                  { "label": "L.L.", "source": "resultados.calculated_values.finales.limite_liquido", "format": "0.02", "suffix": " %", "highlight": true }
                ]
              },
              {
                "type": "chart",
                "chartConfigKey": "determinacion_limite_liquido",
                "scope": "single",
                "title": "Determinación del Límite Líquido",
                "height": "50mm"
              }
            ]
          },
          {
            "width": "50%",
            "components": [
              {
                "type": "section_title",
                "text": "Límite Plástico - MTC E 111",
                "align": "center"
              },
              {
                "type": "table_generic",
                "sourceTable": "limite_plastico"
              },
              {
                "type": "table_pesos",
                "fields": [
                  { "label": "L.P.", "source": "resultados.calculated_values.finales.limite_plastico", "format": "0.02", "suffix": " %", "highlight": true }
                ]
              },
              {
                "type": "section_title",
                "text": "Índice de plasticidad - MTC E 111",
                "align": "center"
              },
              {
                "type": "table_pesos",
                "fields": [
                  { "label": "Límite Líquido (L.L.)", "source": "resultados.calculated_values.finales.limite_liquido", "format": "0.1", "suffix": " %", "highlight": true },
                  { "label": "Límite Plástico (L.P.)", "source": "resultados.calculated_values.finales.limite_plastico", "format": "0.1", "suffix": " %", "highlight": true },
                  { "label": "Índice de Plasticidad (I.P.)", "source": "resultados.calculated_values.finales.indice_plasticidad", "format": "0.1", "suffix": " %", "highlight": true }
                ]
              },
              {
                "type": "table_static",
                "widths": ["30%", "70%"],
                "headers": ["IP", "Descripción"],
                "rows": [
                  ["0 - 3", "No plástico"],
                  ["3 - 15", "Ligeramente plástico"],
                  ["15 - 30", "Baja plasticidad"],
                  ["> 30", "Alta plasticidad"]
                ]
              },
              {
                "type": "chart",
                "chartConfigKey": "carta_plasticidad",
                "scope": "single",
                "title": "CARTA DE PLASTICIDAD DE CASAGRANDE PARA SUELOS FINOS",
                "height": "45mm"
              }
            ]
          }
        ]
      }
    },
    {
      "document": {
        "title": "Contenido de Humedad",
        "subtitle": "Norma MTC E 108 / ASTM D2216"
      },
      "metadataFields": [
        { "label": "Proyecto", "source": "proyecto_nombre", "colSpan": 8, "highlight": true },
        { "label": "Ubicación", "fields": [
            { "sublabel": "Lugar", "source": "tramo_nombre", "width": "20%" },
            { "sublabel": "Distrito", "source": "distrito", "width": "15%" },
            { "sublabel": "Provincia", "source": "provincia", "width": "15%" },
            { "sublabel": "Dpto", "source": "departamento", "width": "10%" }
          ]
        },
        { "label": "Solicitante", "source": "solicitante", "colSpan": 3 },
        { "label": "Coordenadas", "fields": [
            { "sublabel": "E", "source": "longitud", "width": "25%" },
            { "sublabel": "N", "source": "latitud", "width": "25%" }
          ]
        },
        { "label": "Datos de Muestra", "fields": [
            { "sublabel": "Exploración", "source": "calicata", "width": "12%" },
            { "sublabel": "Progresiva", "source": "progresiva_codigo", "width": "15%", "format": "progresiva" },
            { "sublabel": "Estrato", "source": "estrato_orden", "width": "12%" },
            { "sublabel": "Lado", "source": "lado", "width": "12%" }
          ]
        },
        { "label": "Profundidad", "source": "profundidad", "colSpan": 3 },
        { "label": "Fecha Muestreo", "source": "fecha_muestreo", "colSpan": 3, "format": "fecha" }
      ],
      "layout": {
        "type": "grid",
        "columns": [
          {
            "width": "100%",
            "components": [
              {
                "type": "section_title",
                "text": "ENSAYO DE CONTENIDO DE HUMEDAD NATURAL - MTC E 108",
                "align": "center"
              },
              {
                "type": "table_generic",
                "sourceTable": "humedad_natural"
              },
              {
                "type": "table_pesos",
                "fields": [
                  { "label": "Contenido de humedad promedio (%)", "source": "resultados.calculated_values.finales.humedad_natural", "format": "0.02", "suffix": "", "highlight": true }
                ]
              },
              {
                "type": "chart",
                "chartConfigKey": "grafico_humedades",
                "scope": "single",
                "title": "GRÁFICO DE HUMEDADES",
                "height": "75mm"
              }
            ]
          }
        ]
      }
    }
  ]
}
' WHERE config_key = 'limites';

UPDATE tipo_ensayo SET config_reporte_pdf = '{
  "config_key": "cbr",
  "document": {
    "title": "Ensayo Valor de Soporte de Suelos - CBR",
    "subtitle": "Norma MTC E 132 / ASTM D1883",
    "orientation": "portrait",
    "paperSize": "A4"
  },
  "header": {
    "title": "GOBIERNO REGIONAL CUSCO",
    "subtitle": "Gerencia Regional de Transportes y Comunicaciones Cusco",
    "subsubtitle": "SUB GERENCIA DE COBERTURA Y COMUNICACIONES",
    "department": "UNIDAD FUNCIONAL ESTUDIOS Y PROYECTOS",
    "laboratory": "Laboratorio de Mecánica de Suelos, Materiales y Pavimentos",
    "slogan": "«Año de la recuperación y consolidación de la economía peruana»",
    "logo_left_url": "/assets/logo_grtc.png",
    "logo_right_url": "/assets/logo_cusco.png"
  },
  "metadataFields": [
    { "label": "Proyecto", "source": "proyecto_nombre", "colSpan": 8, "highlight": true },
    { "label": "Ubicación", "fields": [
        { "sublabel": "Lugar", "source": "tramo_nombre", "width": "20%" },
        { "sublabel": "Distrito", "source": "distrito", "width": "15%" },
        { "sublabel": "Provincia", "source": "provincia", "width": "15%" },
        { "sublabel": "Dpto", "source": "departamento", "width": "10%" }
      ]
    },
    { "label": "Solicitante", "source": "solicitante", "colSpan": 3 },
    { "label": "Coordenadas", "fields": [
        { "sublabel": "E", "source": "longitud", "width": "25%" },
        { "sublabel": "N", "source": "latitud", "width": "25%" }
      ]
    },
    { "label": "Datos de Muestra", "fields": [
        { "sublabel": "Exploración", "source": "calicata", "width": "12%" },
        { "sublabel": "Progresiva", "source": "progresiva_codigo", "width": "15%", "format": "progresiva" },
        { "sublabel": "Estrato", "source": "estrato_orden", "width": "12%" },
        { "sublabel": "Lado", "source": "lado", "width": "12%" }
      ]
    },
    { "label": "Profundidad", "source": "profundidad", "colSpan": 3 },
    { "label": "Fecha Muestreo", "source": "fecha_muestreo", "colSpan": 3, "format": "fecha" }
  ],
  "signatures": [
    { "role": "ESP. ENSAYOS GEOTECNICOS" },
    { "role": "ESP. SUELOS Y PAVIMENTOS" },
    { "role": "SUPERVISOR" }
  ],
  "pages": [
    {
      "layout": {
        "type": "grid",
        "columns": [
          {
            "width": "35%",
            "components": [
              {
                "type": "section_title",
                "text": "Datos del Molde"
              },
              {
                "type": "table_generic",
                "sourceTable": "datos_molde"
              },
              {
                "type": "section_title",
                "text": "Datos de Compactación"
              },
              {
                "type": "table_generic",
                "sourceTable": "datos_compactacion"
              },
              {
                "type": "section_title",
                "text": "Cápsula N° (Humedad)"
              },
              {
                "type": "table_generic",
                "sourceTable": "capsula_humedad"
              },
              {
                "type": "section_title",
                "text": "Datos de Absorción"
              },
              {
                "type": "table_generic",
                "sourceTable": "datos_absorcion"
              },
              {
                "type": "section_title",
                "text": "Cte. Dial Expansión"
              },
              {
                "type": "table_generic",
                "sourceTable": "expansion"
              }
            ]
          },
          {
            "width": "65%",
            "components": [
              {
                "type": "section_title",
                "text": "Penetración",
                "align": "center"
              },
              {
                "type": "table_generic",
                "sourceTable": "penetracion"
              }
            ]
          }
        ]
      },
      "charts": [
        {
          "chartConfigKey": "cbr_esfuerzo_penetracion",
          "title": "Curva de Esfuerzo a la Penetración",
          "height": "65mm",
          "position": "after_layout"
        },
        {
          "chartConfigKey": "cbr_densidad_cbr",
          "title": "Gráfica del C.B.R.",
          "height": "65mm",
          "position": "after_layout"
        }
      ]
    }
  ]
}
' WHERE config_key = 'cbr';

UPDATE tipo_ensayo SET config_reporte_pdf = '{
  "config_key": "proctor",
  "document": {
    "title": "Ensayo de Proctor Modificado",
    "subtitle": "Norma MTC E 115",
    "paperSize": "A4",
    "orientation": "portrait"
  },
  "header": {
    "title": "GOBIERNO REGIONAL CUSCO",
    "slogan": "«Año de la recuperación y consolidación de la economía peruana»",
    "subtitle": "Gerencia Regional de Transportes y Comunicaciones Cusco",
    "department": "UNIDAD FUNCIONAL ESTUDIOS Y PROYECTOS",
    "laboratory": "Laboratorio de Mecánica de Suelos, Materiales y Pavimentos",
    "subsubtitle": "SUB GERENCIA DE COBERTURA Y COMUNICACIONES",
    "logo_left_url": "/assets/logo_grtc.png",
    "logo_right_url": "/assets/logo_cusco.png"
  },
  "metadataFields": [
    {
      "label": "Proyecto",
      "source": "proyecto_nombre",
      "colSpan": 8,
      "highlight": true
    },
    {
      "label": "Ubicación",
      "fields": [
        {
          "width": "20%",
          "source": "tramo_nombre",
          "sublabel": "Lugar"
        },
        {
          "width": "15%",
          "source": "distrito",
          "sublabel": "Distrito"
        },
        {
          "width": "15%",
          "source": "provincia",
          "sublabel": "Provincia"
        },
        {
          "width": "10%",
          "source": "departamento",
          "sublabel": "Dpto"
        }
      ]
    },
    {
      "label": "Solicitante",
      "source": "solicitante",
      "colSpan": 3
    },
    {
      "label": "Coordenadas",
      "fields": [
        {
          "width": "25%",
          "source": "longitud",
          "sublabel": "E"
        },
        {
          "width": "25%",
          "source": "latitud",
          "sublabel": "N"
        }
      ]
    },
    {
      "label": "Datos de Muestra",
      "fields": [
        {
          "width": "12%",
          "source": "calicata",
          "sublabel": "Exploración"
        },
        {
          "width": "15%",
          "format": "progresiva",
          "source": "progresiva_codigo",
          "sublabel": "Progresiva"
        },
        {
          "width": "12%",
          "source": "estrato_orden",
          "sublabel": "Estrato"
        },
        {
          "width": "12%",
          "source": "lado",
          "sublabel": "Lado"
        }
      ]
    },
    {
      "label": "Profundidad",
      "source": "profundidad",
      "colSpan": 3
    },
    {
      "label": "Fecha Muestreo",
      "format": "fecha",
      "source": "fecha_muestreo",
      "colSpan": 3
    }
  ],
  "signatures": [
    {
      "role": "ESP. ENSAYOS GEOTECNICOS"
    },
    {
      "role": "ESP. SUELOS Y PAVIMENTOS"
    },
    {
      "role": "SUPERVISOR"
    }
  ],
  "pages": [
    {
      "layout": {
        "type": "sequential",
        "components": [
          {
            "text": "Compactación Proctor Modificado - MTC E 115",
            "type": "section_title",
            "align": "center"
          },
          {
            "type": "grid",
            "columns": [
              {
                "width": "50%",
                "components": [
                  {
                    "text": "Detalles del molde:",
                    "type": "section_title"
                  },
                  {
                    "type": "table_pesos",
                    "fields": [
                      {
                        "label": "Código del molde =",
                        "source": "formData.general_fields.codigo_molde"
                      },
                      {
                        "label": "Diámetro =",
                        "source": "formData.general_fields.diametro_cm",
                        "suffix": " cm"
                      },
                      {
                        "label": "Altura =",
                        "source": "formData.general_fields.altura_cm",
                        "suffix": " cm"
                      },
                      {
                        "label": "Volumen =",
                        "source": "formData.general_fields.volumen_cm3",
                        "suffix": " cm³"
                      }
                    ]
                  }
                ]
              },
              {
                "width": "50%",
                "components": [
                  {
                    "text": "Detalles de Ensayo:",
                    "type": "section_title"
                  },
                  {
                    "type": "table_pesos",
                    "fields": [
                      {
                        "label": "Número de golpes/capa =",
                        "source": "formData.general_fields.golpes_por_capa"
                      },
                      {
                        "label": "Número de capas =",
                        "source": "formData.general_fields.numero_capas"
                      },
                      {
                        "label": "Masa del martillo =",
                        "source": "formData.general_fields.masa_martillo_lb",
                        "suffix": " lb"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "text": "Datos de ensayo",
            "type": "section_title"
          },
          {
            "type": "table_generic",
            "sourceTable": "datos_ensayo"
          },
          {
            "text": "Cálculo de la humedad",
            "type": "section_title"
          },
          {
            "type": "table_generic",
            "sourceTable": "calculo_humedad"
          },
          {
            "type": "chart",
            "height": "65mm",
            "chartConfigKey": "curva_compactacion"
          },
          {
            "type": "table_pesos",
            "fields": [
              {
                "label": "Máxima Densidad Seca =",
                "format": "0.3",
                "source": "results.maxima_densidad_seca",
                "suffix": " g/cm³",
                "highlight": true
              },
              {
                "label": "Humedad Óptima =",
                "format": "0.1",
                "source": "results.humedad_optima",
                "suffix": " %",
                "highlight": true
              }
            ]
          }
        ]
      }
    }
  ]
}
' WHERE config_key = 'proctor';

UPDATE tipo_ensayo SET config_graficos = '[
  {
    "id": "determinacion_limite_liquido",
    "type": "line",
    "title": "",
    "height": 340,
    "x_axis": {
      "max": 50,
      "min": 10,
      "type": "logarithmic",
      "label": "Número de Golpes"
    },
    "y_axis": {
      "max": 35,
      "min": 25,
      "type": "linear",
      "label": "% de Humedad"
    },
    "datasets": [
      {
        "id": "linea_fluidez",
        "fill": false,
        "label": "Línea de Fluidez (Regresión)",
        "x_key": "x",
        "y_key": "y",
        "source": {
          "type": "array",
          "data_key": "resultados.resultados.regresion_ll.puntos_recta"
        },
        "tension": 0,
        "showLine": true,
        "borderDash": [7, 4],
        "borderColor": "#dc2626",
        "borderWidth": 2,
        "pointRadius": 0
      },
      {
        "id": "puntos_ensayo",
        "label": "Puntos de Ensayo",
        "points": [
          {"x_key": "tables.limite_liquido.1.golpes", "y_key": "tables.limite_liquido.1.humedad"},
          {"x_key": "tables.limite_liquido.2.golpes", "y_key": "tables.limite_liquido.2.humedad"},
          {"x_key": "tables.limite_liquido.3.golpes", "y_key": "tables.limite_liquido.3.humedad"}
        ],
        "showLine": false,
        "borderColor": "#1e40af",
        "pointRadius": 6,
        "backgroundColor": "#1e40af"
      },
      {
        "id": "punto_ll",
        "label": "Límite Líquido (25 golpes)",
        "points": [
          {"x": 25, "y_key": "resultados.resultados.regresion_ll.ll_25"}
        ],
        "showLine": false,
        "borderColor": "#059669",
        "pointRadius": 9,
        "backgroundColor": "#059669"
      }
    ],
    "reference_lines": [
      {
        "axis": "x",
        "label": "25 Golpes",
        "value": 25,
        "borderDash": [5, 5],
        "borderColor": "rgba(5, 150, 105, 0.5)"
      }
    ]
  },
  {
    "id": "grafico_humedades",
    "type": "bar",
    "title": "",
    "height": 340,
    "x_axis": {
      "type": "category",
      "label": "",
      "tick_values": ["M-I", "M-II"]
    },
    "y_axis": {
      "max": 10,
      "min": 0,
      "type": "linear",
      "label": "Contenido de humedad (%)"
    },
    "datasets": [
      {
        "label": "M-I",
        "points": [
          {"x": "M-I", "y_key": "tables.humedad_natural.1.humedad"}
        ],
        "borderColor": "#475569",
        "borderWidth": 1.5,
        "backgroundColor": "rgba(100,116,139,0.90)"
      },
      {
        "label": "M-II",
        "points": [
          {"x": "M-II", "y_key": "tables.humedad_natural.2.humedad"}
        ],
        "borderColor": "#64748b",
        "borderWidth": 1.5,
        "backgroundColor": "rgba(148,163,184,0.90)"
      }
    ]
  },
  {
    "id": "carta_plasticidad",
    "type": "scatter",
    "title": "",
    "height": 360,
    "x_axis": {
      "max": 100,
      "min": 0,
      "type": "linear",
      "label": "Límite Líquido (LL)"
    },
    "y_axis": {
      "max": 60,
      "min": 0,
      "type": "linear",
      "label": "Índice de Plasticidad (IP)"
    },
    "datasets": [
      {
        "label": "Muestra",
        "points": [
          {
            "x_key": "calculated_values.finales.limite_liquido",
            "y_key": "calculated_values.finales.indice_plasticidad"
          }
        ],
        "showLine": false,
        "borderColor": "#7c3aed",
        "pointRadius": 8,
        "backgroundColor": "#7c3aed",
        "pointHoverRadius": 10
      },
      {
        "fill": false,
        "label": "Línea A",
        "points": [
          {"x": 20, "y": 0},
          {"x": 100, "y": 58.4}
        ],
        "showLine": true,
        "borderDash": [8, 5],
        "borderColor": "#475569",
        "borderWidth": 2,
        "pointRadius": 0,
        "backgroundColor": "rgba(71,85,105,0.12)"
      }
    ],
    "decorations": {
      "topBands": [
        {"end": 0.42, "label": "Limos (M)", "start": 0.08},
        {"end": 0.92, "label": "Arcillas (C)", "start": 0.42}
      ]
    }
  }
]'
WHERE config_key = 'limites';

