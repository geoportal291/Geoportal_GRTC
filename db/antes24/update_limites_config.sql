UPDATE tipo_ensayo SET config_calculos = '{
  "steps": [
    {
      "comment": "Calcular humedad para cada punto del Límite Líquido",
      "loop": {
        "source": "tableConfig.secciones[0].filas",
        "steps": [
          {
            "formula": "isFinite(item.phss) && isFinite(item.phst) && item.phst > 0 ? ((item.phss - item.phst) / item.phst) * 100 : 0",
            "inputs": {
              "item.phss": "item.phss",
              "item.phst": "item.phst"
            },
            "output": "results.limites.humedad.${item.key}"
          }
        ]
      }
    },
    {
        "comment": "Generar el array de puntos para el cálculo de LL",
        "engine": "generarPuntosLL",
        "inputs": {
            "data": "data.datos_formulario.TablaLimiteLiquido",
            "humedad": "results.limites.humedad"
        },
        "outputs": {
            "puntosLL": "results.limites.puntosLL"
        }
    },
    {
      "comment": "Calcular el Límite Líquido por interpolación",
      "engine": "calcularLimiteLiquido",
      "inputs": {
        "puntosLL": "results.limites.puntosLL"
      },
      "outputs": {
        "limiteLiquido": "results.limites.limiteLiquido"
      }
    },
    {
      "comment": "Calcular el Límite Plástico (promedio)",
      "formula": "mean(values(isObject(data.TablaLimitePlastico) ? data.TablaLimitePlastico : {}))",
      "inputs": {
        "data.TablaLimitePlastico": "data.datos_formulario.TablaLimitePlastico"
      },
      "output": "results.limites.limitePlastico"
    },
    {
      "comment": "Calcular el Índice de Plasticidad",
      "formula": "results.limites.limiteLiquido - results.limites.limitePlastico",
      "inputs": {
        "results.limites.limiteLiquido": "results.limites.limiteLiquido",
        "results.limites.limitePlastico": "results.limites.limitePlastico"
      },
      "output": "results.limites.indicePlasticidad"
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
        "comment": "Generar datos para la curva de fluidez",
        "engine": "generarCurvaFluidez",
        "inputs": {
            "data": "data.datos_formulario.TablaLimiteLiquido",
            "humedad": "results.limites.humedad"
        },
        "outputs": {
            "curva_fluidez": "results.curva_fluidez"
        }
    }
  ]
}' WHERE nombre_ensayo = 'Límites de Consistencia';
