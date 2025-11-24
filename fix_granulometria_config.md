  # Corrección de Configuración para Ensayo de Granulometría

Este archivo contiene el JSON corregido para la columna `config_calculos` del tipo de ensayo de Granulometría, junto con un comando SQL `UPDATE` que puedes usar para aplicar el cambio directamente en tu base de datos.

---

### **JSON Corregido para `config_calculos`**

Copia y pega este JSON completo en la columna `config_calculos` del registro de Granulometría en tu tabla `tipo_ensayo`.

```json
{
  "steps": [
    {
      "inputs": {
        "data.TablaTamices": "data.datos_formulario.TablaTamices"
      },
      "output": "results.granulometria.pesoTotal",
      "comment": "Calcular el peso total de la muestra",
      "formula": "sum(values(isObject(data.TablaTamices) ? data.TablaTamices : {}))"
    },
    {
      "loop": {
        "steps": [
          {
            "inputs": {
              "item.key": "item.key",
              "data.TablaTamices": "data.datos_formulario.TablaTamices"
            },
            "output": "results.granulometria.retenido.${item.key}",
            "comment": "Peso retenido en el tamiz actual",
            "formula": "get(data.TablaTamices, item.key, 0)"
          },
          {
            "inputs": {
              "item.key": "item.key",
              "results.granulometria.retenido": "results.granulometria.retenido",
              "results.granulometria.pesoTotal": "results.granulometria.pesoTotal"
            },
            "output": "results.granulometria.porcRetenido.${item.key}",
            "comment": "Porcentaje retenido en el tamiz actual",
            "formula": "(get(results.granulometria.retenido, item.key, 0) / (results.granulometria.pesoTotal > 0 ? results.granulometria.pesoTotal : 1)) * 100"
          },
          {
            "inputs": {
              "index": "index",
              "item.key": "item.key",
              "tableConfig.granulometria.rows": "tableConfig.granulometria.rows",
              "results.granulometria.porcRetenido": "results.granulometria.porcRetenido",
              "results.granulometria.porcRetAcumulado": "results.granulometria.porcRetAcumulado"
            },
            "output": "results.granulometria.porcRetAcumulado.${item.key}",
            "comment": "Porcentaje retenido acumulado",
            "formula": "get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0)"
          },
          {
            "inputs": {
              "item.key": "item.key",
              "results.granulometria.porcRetAcumulado": "results.granulometria.porcRetAcumulado"
            },
            "output": "results.granulometria.pasa.${item.key}",
            "comment": "Porcentaje que pasa",
            "formula": "100 - get(results.granulometria.porcRetAcumulado, item.key, 0)"
          }
        ],
        "source": "tableConfig.granulometria.rows"
      },
      "comment": "Calcular el porcentaje retenido y acumulado para cada tamiz"
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.pasa",
        "porcentaje": 60
      },
      "comment": "Calcular D60, D30, D10",
      "outputs": {
        "d60": "results.granulometria.d60"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.pasa",
        "porcentaje": 30
      },
      "outputs": {
        "d30": "results.granulometria.d30"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.pasa",
        "porcentaje": 10
      },
      "outputs": {
        "d10": "results.granulometria.d10"
      }
    },
    {
      "inputs": {
        "d10": "results.granulometria.d10",
        "d60": "results.granulometria.d60"
      },
      "output": "results.granulometria.coefUniformidad",
      "comment": "Calcular Coeficiente de Uniformidad (Cu)",
      "formula": "d10 > 0 ? d60 / d10 : 0"
    },
    {
      "inputs": {
        "d10": "results.granulometria.d10",
        "d30": "results.granulometria.d30",
        "d60": "results.granulometria.d60"
      },
      "output": "results.granulometria.coefCurvatura",
      "comment": "Calcular Coeficiente de Curvatura (Cc)",
      "formula": "(d60 * d10) > 0 ? (d30^2) / (d60 * d10) : 0"
    },
    {
      "inputs": {
        "results.granulometria.pasa": "results.granulometria.pasa"
      },
      "output": "results.granulometria.porcFinos",
      "comment": "Calcular porcentajes de finos, arena y grava",
      "formula": "get(results.granulometria.pasa, 'n200', 0)"
    },
    {
      "inputs": {
        "results.granulometria.pasa": "results.granulometria.pasa"
      },
      "output": "results.granulometria.porcArena",
      "formula": "get(results.granulometria.pasa, 'n4', 0) - get(results.granulometria.pasa, 'n200', 0)"
    },
    {
      "inputs": {
        "results.granulometria.pasa": "results.granulometria.pasa"
      },
      "output": "results.granulometria.porcGrava",
      "formula": "100 - get(results.granulometria.pasa, 'n4', 0)"
    },
    {
      "engine": "clasificarSuelos",
      "inputs": {
        "limites": "results.limites",
        "granulometria": "results.granulometria"
      },
      "comment": "Clasificar suelos SUCS y AASHTO",
      "outputs": {
        "indiceGrupo": "results.clasificacion.indiceGrupo",
        "clasificacionSUCS": "results.clasificacion.SUCS",
        "clasificacionAASHTO": "results.clasificacion.AASHTO"
      }
    },
    {
      "engine": "generarCurvaGranulometria",
      "inputs": {
        "pasa": "results.granulometria.pasa",
        "tamices": "tableConfig.granulometria.rows"
      },
      "comment": "Generar datos para la curva granulométrica",
      "outputs": {
        "curva_granulometria": "results.curva_granulometria"
      }
    }
  ]
}
```

---

### **Comando SQL para Actualizar (PostgreSQL)**

**¡IMPORTANTE!** Reemplaza `EL_ID_DE_TU_TIPO_DE_ENSAYO` con el ID numérico correcto del tipo de ensayo de Granulometría en tu tabla `tipo_ensayo`.

```sql
UPDATE tipo_ensayo
SET config_calculos = '{
  "steps": [
    {
      "inputs": {
        "data.TablaTamices": "data.datos_formulario.TablaTamices"
      },
      "output": "results.granulometria.pesoTotal",
      "comment": "Calcular el peso total de la muestra",
      "formula": "sum(values(isObject(data.TablaTamices) ? data.TablaTamices : {}))"
    },
    {
      "loop": {
        "steps": [
          {
            "inputs": {
              "item.key": "item.key",
              "data.TablaTamices": "data.datos_formulario.TablaTamices"
            },
            "output": "results.granulometria.retenido.${item.key}",
            "comment": "Peso retenido en el tamiz actual",
            "formula": "get(data.TablaTamices, item.key, 0)"
          },
          {
            "inputs": {
              "item.key": "item.key",
              "results.granulometria.retenido": "results.granulometria.retenido",
              "results.granulometria.pesoTotal": "results.granulometria.pesoTotal"
            },
            "output": "results.granulometria.porcRetenido.${item.key}",
            "comment": "Porcentaje retenido en el tamiz actual",
            "formula": "(get(results.granulometria.retenido, item.key, 0) / (results.granulometria.pesoTotal > 0 ? results.granulometria.pesoTotal : 1)) * 100"
          },
          {
            "inputs": {
              "index": "index",
              "item.key": "item.key",
              "tableConfig.granulometria.rows": "tableConfig.granulometria.rows",
              "results.granulometria.porcRetenido": "results.granulometria.porcRetenido",
              "results.granulometria.porcRetAcumulado": "results.granulometria.porcRetAcumulado"
            },
            "output": "results.granulometria.porcRetAcumulado.${item.key}",
            "comment": "Porcentaje retenido acumulado",
            "formula": "get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0)"
          },
          {
            "inputs": {
              "item.key": "item.key",
              "results.granulometria.porcRetAcumulado": "results.granulometria.porcRetAcumulado"
            },
            "output": "results.granulometria.pasa.${item.key}",
            "comment": "Porcentaje que pasa",
            "formula": "100 - get(results.granulometria.porcRetAcumulado, item.key, 0)"
          }
        ],
        "source": "tableConfig.granulometria.rows"
      },
      "comment": "Calcular el porcentaje retenido y acumulado para cada tamiz"
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.pasa",
        "porcentaje": 60
      },
      "comment": "Calcular D60, D30, D10",
      "outputs": {
        "d60": "results.granulometria.d60"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.pasa",
        "porcentaje": 30
      },
      "outputs": {
        "d30": "results.granulometria.d30"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "tamices": "tableConfig.granulometria.rows",
        "pasaValues": "results.granulometria.pasa",
        "porcentaje": 10
      },
      "outputs": {
        "d10": "results.granulometria.d10"
      }
    },
    {
      "inputs": {
        "d10": "results.granulometria.d10",
        "d60": "results.granulometria.d60"
      },
      "output": "results.granulometria.coefUniformidad",
      "comment": "Calcular Coeficiente de Uniformidad (Cu)",
      "formula": "d10 > 0 ? d60 / d10 : 0"
    },
    {
      "inputs": {
        "d10": "results.granulometria.d10",
        "d30": "results.granulometria.d30",
        "d60": "results.granulometria.d60"
      },
      "output": "results.granulometria.coefCurvatura",
      "comment": "Calcular Coeficiente de Curvatura (Cc)",
      "formula": "(d60 * d10) > 0 ? (d30^2) / (d60 * d10) : 0"
    },
    {
      "inputs": {
        "results.granulometria.pasa": "results.granulometria.pasa"
      },
      "output": "results.granulometria.porcFinos",
      "comment": "Calcular porcentajes de finos, arena y grava",
      "formula": "get(results.granulometria.pasa, ''n200'', 0)"
    },
    {
      "inputs": {
        "results.granulometria.pasa": "results.granulometria.pasa"
      },
      "output": "results.granulometria.porcArena",
      "formula": "get(results.granulometria.pasa, ''n4'', 0) - get(results.granulometria.pasa, ''n200'', 0)"
    },
    {
      "inputs": {
        "results.granulometria.pasa": "results.granulometria.pasa"
      },
      "output": "results.granulometria.porcGrava",
      "formula": "100 - get(results.granulometria.pasa, ''n4'', 0)"
    },
    {
      "engine": "clasificarSuelos",
      "inputs": {
        "limites": "results.limites",
        "granulometria": "results.granulometria"
      },
      "comment": "Clasificar suelos SUCS y AASHTO",
      "outputs": {
        "indiceGrupo": "results.clasificacion.indiceGrupo",
        "clasificacionSUCS": "results.clasificacion.SUCS",
        "clasificacionAASHTO": "results.clasificacion.AASHTO"
      }
    },
    {
      "engine": "generarCurvaGranulometria",
      "inputs": {
        "pasa": "results.granulometria.pasa",
        "tamices": "tableConfig.granulometria.rows"
      },
      "comment": "Generar datos para la curva granulométrica",
      "outputs": {
        "curva_granulometria": "results.curva_granulometria"
      }
    }
  ]
}'::jsonb
WHERE id = EL_ID_DE_TU_TIPO_DE_ENSAYO;
```
