UPDATE tipo_ensayo
SET config_calculos = $$
{
  "version": 3,
  "steps": [
    {
      "loop": {
        "items": "tableConfig.granulometria.rows",
        "steps": [
          {
            "output": "granulometria.porcRet.${item.key}",
            "formula": "pesoTotal > 0 ? (retenido / pesoTotal) * 100 : 0"
          },
          {
            "output": "granulometria.porcAcum.${item.key}",
            "formula": "get(results.granulometria.porcRet, item.key, 0) + (prevItem ? get(results.granulometria.porcAcum, prevItem.key, 0) : 0)"
          },
          {
            "output": "granulometria.porcPasa.${item.key}",
            "formula": "100 - get(results.granulometria.porcAcum, item.key, 0)"
          }
        ]
      }
    },
    {
      "output": "granulometria.porcFinos",
      "formula": "get(results.granulometria.porcPasa, 'n200', 0)"
    },
    {
      "output": "granulometria.porcGruesos",
      "formula": "100 - results.granulometria.porcFinos"
    },
    {
      "output": "granulometria.porcGrava",
      "formula": "100 - get(results.granulometria.porcPasa, 'n4', 0)"
    },
    {
      "output": "granulometria.porcArena",
      "formula": "get(results.granulometria.porcPasa, 'n4', 0) - get(results.granulometria.porcPasa, 'n200', 0)"
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.porcPasa",
        "porcentaje": 60
      },
      "outputs": {
        "d60": "granulometria.d60"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.porcPasa",
        "porcentaje": 30
      },
      "outputs": {
        "d30": "granulometria.d30"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.porcPasa",
        "porcentaje": 10
      },
      "outputs": {
        "d10": "granulometria.d10"
      }
    },
    {
      "output": "granulometria.coefUniformidad",
      "formula": "results.granulometria.d10 > 0 ? results.granulometria.d60 / results.granulometria.d10 : 0"
    },
    {
      "output": "granulometria.coefCurvatura",
      "formula": "(results.granulometria.d60 * results.granulometria.d10) > 0 ? (results.granulometria.d30^2) / (results.granulometria.d60 * results.granulometria.d10) : 0"
    },
    {
      "engine": "generarCurvaGranulometria",
      "inputs": {
        "pasa": "results.granulometria.porcPasa",
        "tamices": "tableConfig.granulometria.rows"
      },
      "outputs": {
        "curva_granulometria": "curva_granulometria"
      }
    }
  ]
}
$$::jsonb
WHERE codigo = 'GRA';
