```json
{
  "steps": [
    {
      "loop": {
        "source": "tableConfig.limite_liquido.rows",
        "steps": [
          {
            "output": "results.limites.humedad.${item.id}",
            "formula": "(get(data.datos_formulario.TablaLimiteLiquido.psst, item.id, 0) - get(data.datos_formulario.TablaLimiteLiquido.tara, item.id, 0)) > 0 ? ((get(data.datos_formulario.TablaLimiteLiquido.psht, item.id, 0) - get(data.datos_formulario.TablaLimiteLiquido.psst, item.id, 0)) / (get(data.datos_formulario.TablaLimiteLiquido.psst, item.id, 0) - get(data.datos_formulario.TablaLimiteLiquido.tara, item.id, 0))) * 100 : 0"
          }
        ]
      },
      "comment": "Calcular humedad para cada punto del Límite Líquido"
    },
    {
      "engine": "generarPuntosLL",
      "inputs": {
        "data": "data.datos_formulario.TablaLimiteLiquido",
        "humedad": "results.limites.humedad"
      },
      "comment": "Generar el array de puntos para el cálculo de LL",
      "outputs": {
        "puntosLL": "results.limites.puntosLL"
      }
    },
    {
      "engine": "calcularLimiteLiquido",
      "inputs": {
        "puntosLL": "results.limites.puntosLL"
      },
      "comment": "Calcular el Límite Líquido por interpolación",
      "outputs": {
        "limiteLiquido": "results.limites.limiteLiquido"
      }
    },
    {
      "loop": {
        "source": "tableConfig.limite_plastico.rows",
        "steps": [
          {
            "output": "results.limites.humedad_plast.${item.id}",
            "formula": "(get(data.datos_formulario.TablaLimitePlastico.psst_plast, item.id, 0) - get(data.datos_formulario.TablaLimitePlastico.tara_plast, item.id, 0)) > 0 ? ((get(data.datos_formulario.TablaLimitePlastico.psht_plast, item.id, 0) - get(data.datos_formulario.TablaLimitePlastico.psst_plast, item.id, 0)) / (get(data.datos_formulario.TablaLimitePlastico.psst_plast, item.id, 0) - get(data.datos_formulario.TablaLimitePlastico.tara_plast, item.id, 0))) * 100 : 0"
          }
        ]
      },
      "comment": "Calcular humedad para cada punto del Límite Plástico"
    },
    {
      "output": "results.limites.limitePlastico",
      "comment": "Calcular el Límite Plástico (promedio)",
      "formula": "mean(values(isObject(results.limites.humedad_plast) ? results.limites.humedad_plast : {}))"
    },
    {
      "inputs": {
        "results.limites.limiteLiquido": "results.limites.limiteLiquido",
        "results.limites.limitePlastico": "results.limites.limitePlastico"
      },
      "output": "results.limites.indicePlasticidad",
      "comment": "Calcular el Índice de Plasticidad",
      "formula": "results.limites.limiteLiquido - results.limites.limitePlastico"
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
      "engine": "generarCurvaFluidez",
      "inputs": {
        "data": "data.datos_formulario.TablaLimiteLiquido",
        "humedad": "results.limites.humedad"
      },
      "comment": "Generar datos para la curva de fluidez",
      "outputs": {
        "curva_fluidez": "results.curva_fluidez"
      }
    }
  ]
}
```

```sql
-- Reemplaza 'ID_DEL_TIPO_DE_ENSAYO_LIMITES' con el ID correcto para 'Límites de Consistencia' en tu tabla tipo_ensayo.
UPDATE tipo_ensayo
SET config_calculos = '{
  "steps": [
    {
      "loop": {
        "source": "tableConfig.limite_liquido.rows",
        "steps": [
          {
            "output": "results.limites.humedad.${item.id}",
            "formula": "(get(data.datos_formulario.TablaLimiteLiquido.psst, item.id, 0) - get(data.datos_formulario.TablaLimiteLiquido.tara, item.id, 0)) > 0 ? ((get(data.datos_formulario.TablaLimiteLiquido.psht, item.id, 0) - get(data.datos_formulario.TablaLimiteLiquido.psst, item.id, 0)) / (get(data.datos_formulario.TablaLimiteLiquido.psst, item.id, 0) - get(data.datos_formulario.TablaLimiteLiquido.tara, item.id, 0))) * 100 : 0"
          }
        ]
      },
      "comment": "Calcular humedad para cada punto del Límite Líquido"
    },
    {
      "engine": "generarPuntosLL",
      "inputs": {
        "data": "data.datos_formulario.TablaLimiteLiquido",
        "humedad": "results.limites.humedad"
      },
      "comment": "Generar el array de puntos para el cálculo de LL",
      "outputs": {
        "puntosLL": "results.limites.puntosLL"
      }
    },
    {
      "engine": "calcularLimiteLiquido",
      "inputs": {
        "puntosLL": "results.limites.puntosLL"
      },
      "comment": "Calcular el Límite Líquido por interpolación",
      "outputs": {
        "limiteLiquido": "results.limites.limiteLiquido"
      }
    },
    {
      "loop": {
        "source": "tableConfig.limite_plastico.rows",
        "steps": [
          {
            "output": "results.limites.humedad_plast.${item.id}",
            "formula": "(get(data.datos_formulario.TablaLimitePlastico.psst_plast, item.id, 0) - get(data.datos_formulario.TablaLimitePlastico.tara_plast, item.id, 0)) > 0 ? ((get(data.datos_formulario.TablaLimitePlastico.psht_plast, item.id, 0) - get(data.datos_formulario.TablaLimitePlastico.psst_plast, item.id, 0)) / (get(data.datos_formulario.TablaLimitePlastico.psst_plast, item.id, 0) - get(data.datos_formulario.TablaLimitePlastico.tara_plast, item.id, 0))) * 100 : 0"
          }
        ]
      },
      "comment": "Calcular humedad para cada punto del Límite Plástico"
    },
    {
      "output": "results.limites.limitePlastico",
      "comment": "Calcular el Límite Plástico (promedio)",
      "formula": "mean(values(isObject(results.limites.humedad_plast) ? results.limites.humedad_plast : {}))"
    },
    {
      "inputs": {
        "results.limites.limiteLiquido": "results.limites.limiteLiquido",
        "results.limites.limitePlastico": "results.limites.limitePlastico"
      },
      "output": "results.limites.indicePlasticidad",
      "comment": "Calcular el Índice de Plasticidad",
      "formula": "results.limites.limiteLiquido - results.limites.limitePlastico"
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
      "engine": "generarCurvaFluidez",
      "inputs": {
        "data": "data.datos_formulario.TablaLimiteLiquido",
        "humedad": "results.limites.humedad"
      },
      "comment": "Generar datos para la curva de fluidez",
      "outputs": {
        "curva_fluidez": "results.curva_fluidez"
      }
    }
  ]
}'
WHERE tipo_ensayo_id = ID_DEL_TIPO_DE_ENSAYO_LIMITES;
```
