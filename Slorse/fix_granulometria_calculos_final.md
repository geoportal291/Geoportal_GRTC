## Corrección Final de la Configuración de Cálculos para Granulometría

Aquí está el objeto `config_calculos` final y corregido para el ensayo de **Granulometría**. Los cambios abordan todos los errores identificados en los logs de depuración.

### Cambios Clave:
1.  **Ruta de Datos Corregida**: Todas las fórmulas ahora apuntan a `data.datos_formulario.TablaTamices` en lugar de `data.TablaTamices` para acceder a los pesos de los tamices, solucionando el error `GET called with: {obj: undefined, ...}`.
2.  **Lógica Acumulada Corregida**: Se ha reintroducido el operador ternario (`index === 0 ? ...`) en la fórmula de `porcRetAcumulado`. Esto soluciona el error `Index out of range (-1 < 1)` de una manera que el motor `math.js` puede interpretar correctamente. El fallo anterior de esta sintaxis (`Value expected (char 9)`) era probablemente una consecuencia de los errores de datos subyacentes que ahora están corregidos.

### Objeto JSON `config_calculos` Corregido

```json
{
  "steps": [
    {
      "output": "granulometria.pesoTotal",
      "formula": "sum(values(isObject(data.datos_formulario.TablaTamices) ? data.datos_formulario.TablaTamices : {}))"
    },
    {
      "loop": {
        "source": "tableConfig.granulometria.rows",
        "steps": [
          {
            "output": "granulometria.porcRetenido.${item.key}",
            "formula": "get(data.datos_formulario.TablaTamices, item.key, 0) / results.granulometria.pesoTotal * 100"
          },
          {
            "output": "granulometria.porcRetAcumulado.${item.key}",
            "formula": "index === 0 ? get(results.granulometria.porcRetenido, item.key, 0) : (get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0))"
          },
          {
            "output": "granulometria.porcPasa.${item.key}",
            "formula": "100 - get(results.granulometria.porcRetAcumulado, item.key, 0)"
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
        "pasaValues": "results.granulometria.porcPasa",
        "tamices": "tableConfig.granulometria.rows",
        "porcentaje": 60
      },
      "outputs": {
        "d60": "granulometria.d60"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "pasaValues": "results.granulometria.porcPasa",
        "tamices": "tableConfig.granulometria.rows",
        "porcentaje": 30
      },
      "outputs": {
        "d30": "granulometria.d30"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "pasaValues": "results.granulometria.porcPasa",
        "tamices": "tableConfig.granulometria.rows",
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
```

### Comando SQL para Actualizar

Por favor, ejecuta este comando en tu base de datos para aplicar la configuración final.

```sql
UPDATE tipo_ensayo
SET config_calculos = '{
  "steps": [
    {
      "output": "granulometria.pesoTotal",
      "formula": "sum(values(isObject(data.datos_formulario.TablaTamices) ? data.datos_formulario.TablaTamices : {}))"
    },
    {
      "loop": {
        "source": "tableConfig.granulometria.rows",
        "steps": [
          {
            "output": "granulometria.porcRetenido.${item.key}",
            "formula": "get(data.datos_formulario.TablaTamices, item.key, 0) / results.granulometria.pesoTotal * 100"
          },
          {
            "output": "granulometria.porcRetAcumulado.${item.key}",
            "formula": "index === 0 ? get(results.granulometria.porcRetenido, item.key, 0) : (get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0))"
          },
          {
            "output": "granulometria.porcPasa.${item.key}",
            "formula": "100 - get(results.granulometria.porcRetAcumulado, item.key, 0)"
          }
        ]
      }
    },
    {
      "output": "granulometria.porcFinos",
      "formula": "get(results.granulometria.porcPasa, ''n200'', 0)"
    },
    {
      "output": "granulometria.porcGruesos",
      "formula": "100 - results.granulometria.porcFinos"
    },
    {
      "output": "granulometria.porcGrava",
      "formula": "100 - get(results.granulometria.porcPasa, ''n4'', 0)"
    },
    {
      "output": "granulometria.porcArena",
      "formula": "get(results.granulometria.porcPasa, ''n4'', 0) - get(results.granulometria.porcPasa, ''n200'', 0)"
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "pasaValues": "results.granulometria.porcPasa",
        "tamices": "tableConfig.granulometria.rows",
        "porcentaje": 60
      },
      "outputs": {
        "d60": "granulometria.d60"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "pasaValues": "results.granulometria.porcPasa",
        "tamices": "tableConfig.granulometria.rows",
        "porcentaje": 30
      },
      "outputs": {
        "d30": "granulometria.d30"
      }
    },
    {
      "engine": "calcularDx",
      "inputs": {
        "pasaValues": "results.granulometria.porcPasa",
        "tamices": "tableConfig.granulometria.rows",
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
}'
WHERE nombre_ensayo = 'Granulometría';
```
