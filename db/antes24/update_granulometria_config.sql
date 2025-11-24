UPDATE tipo_ensayo SET config_calculos = '{
  "steps": [
    {
      "comment": "Calcular el peso total de la muestra",
      "formula": "sum(values(isObject(data.TablaTamices) ? data.TablaTamices : {}))",
      "inputs": { "data.TablaTamices": "data.datos_formulario.TablaTamices" },
      "output": "results.granulometria.pesoTotal"
    },
    {
      "comment": "Calcular el porcentaje retenido y acumulado para cada tamiz",
      "loop": {
        "source": "tableConfig.secciones[0].filas",
        "steps": [
          {
            "comment": "Peso retenido en el tamiz actual",
            "formula": "get(data.TablaTamices, item.key, 0)",
            "inputs": {
              "data.TablaTamices": "data.datos_formulario.TablaTamices",
              "item.key": "item.key"
            },
            "output": "results.granulometria.retenido.${item.key}"
          },
          {
            "comment": "Porcentaje retenido en el tamiz actual",
            "formula": "(get(results.granulometria.retenido, item.key, 0) / (results.granulometria.pesoTotal > 0 ? results.granulometria.pesoTotal : 1)) * 100",
            "inputs": {
              "results.granulometria.retenido": "results.granulometria.retenido",
              "item.key": "item.key",
              "results.granulometria.pesoTotal": "results.granulometria.pesoTotal"
            },
            "output": "results.granulometria.porcRetenido.${item.key}"
          },
          {
            "comment": "Porcentaje retenido acumulado",
            "formula": "get(results.granulometria.porcRetAcumulado, tableConfig.secciones[0].filas[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0)",
            "inputs": {
              "results.granulometria.porcRetAcumulado": "results.granulometria.porcRetAcumulado",
              "results.granulometria.porcRetenido": "results.granulometria.porcRetenido",
              "tableConfig.secciones[0].filas": "tableConfig.secciones[0].filas",
              "item.key": "item.key",
              "index": "index"
            },
            "output": "results.granulometria.porcRetAcumulado.${item.key}"
          },
          {
            "comment": "Porcentaje que pasa",
            "formula": "100 - get(results.granulometria.porcRetAcumulado, item.key, 0)",
            "inputs": {
              "results.granulometria.porcRetAcumulado": "results.granulometria.porcRetAcumulado",
              "item.key": "item.key"
            },
            "output": "results.granulometria.pasa.${item.key}"
          }
        ]
      }
    },
    {
        "comment": "Calcular D60, D30, D10",
        "engine": "calcularDx",
        "inputs": {
            "pasaValues": "results.granulometria.pasa",
            "tamices": "tableConfig.secciones[0].filas",
            "porcentaje": 60
        },
        "outputs": { "d60": "results.granulometria.d60" }
    },
    {
        "engine": "calcularDx",
        "inputs": {
            "pasaValues": "results.granulometria.pasa",
            "tamices": "tableConfig.secciones[0].filas",
            "porcentaje": 30
        },
        "outputs": { "d30": "results.granulometria.d30" }
    },
    {
        "engine": "calcularDx",
        "inputs": {
            "pasaValues": "results.granulometria.pasa",
            "tamices": "tableConfig.secciones[0].filas",
            "porcentaje": 10
        },
        "outputs": { "d10": "results.granulometria.d10" }
    },
    {
        "comment": "Calcular Coeficiente de Uniformidad (Cu)",
        "formula": "d10 > 0 ? d60 / d10 : 0",
        "inputs": { "d60": "results.granulometria.d60", "d10": "results.granulometria.d10" },
        "output": "results.granulometria.coefUniformidad"
    },
    {
        "comment": "Calcular Coeficiente de Curvatura (Cc)",
        "formula": "(d60 * d10) > 0 ? (d30^2) / (d60 * d10) : 0",
        "inputs": { "d30": "results.granulometria.d30", "d60": "results.granulometria.d60", "d10": "results.granulometria.d10" },
        "output": "results.granulometria.coefCurvatura"
    },
    {
        "comment": "Calcular porcentajes de finos, arena y grava",
        "formula": "get(results.granulometria.pasa, ''malla_200'', 0)",
        "inputs": { "results.granulometria.pasa": "results.granulometria.pasa" },
        "output": "results.granulometria.porcFinos"
    },
    {
        "formula": "get(results.granulometria.pasa, ''malla_4'', 0) - get(results.granulometria.pasa, ''malla_200'', 0)",
        "inputs": { "results.granulometria.pasa": "results.granulometria.pasa" },
        "output": "results.granulometria.porcArena"
    },
    {
        "formula": "100 - get(results.granulometria.pasa, ''malla_4'', 0)",
        "inputs": { "results.granulometria.pasa": "results.granulometria.pasa" },
        "output": "results.granulometria.porcGrava"
    },
    {
      "comment": "Clasificar suelos SUCS y AASHTO",
      "engine": "clasificarSuelos",
      "inputs": {
        "granulometria": "results.granulometria",
        "limites": "results.limites"
      },
      "outputs": {
        "clasificacionSUCS": "results.clasificacion.SUCS",
        "clasificacionAASHTO": "results.clasificacion.AASHTO",
        "indiceGrupo": "results.clasificacion.indiceGrupo"
      }
    },
    {
        "comment": "Generar datos para la curva granulométrica",
        "engine": "generarCurvaGranulometria",
        "inputs": {
            "pasa": "results.granulometria.pasa",
            "tamices": "tableConfig.secciones[0].filas"
        },
        "outputs": {
            "curva_granulometria": "results.curva_granulometria"
        }
    }
  ]
}' WHERE nombre_ensayo = 'Granulometría';
