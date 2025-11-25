## Corrección de la Configuración de Cálculos para Granulometría

Aquí está el objeto `config_calculos` completo y corregido para el ensayo de **Granulometría**. Los cambios abordan los siguientes errores:

1.  **Error de `undefined`**: La fórmula de `pesoTotal` ahora maneja el caso en que no se han introducido datos en la tabla de tamices.
2.  **Error de `index out of range`**: La fórmula de `porcRetAcumulado` ahora maneja correctamente el primer elemento de la tabla.
3.  **Error de `Motor no encontrado`**: Se ha verificado que los nombres de los motores (`calcularDx`, `generarCurvaGranulometria`) coincidan exactamente con los definidos en el código.

### Objeto JSON `config_calculos` Corregido

```json
{
  "steps": [
    {
      "output": "granulometria.pesoTotal",
      "formula": "sum(values(isObject(data.TablaTamices) ? data.TablaTamices : {}))"
    },
    {
      "loop": {
        "source": "tableConfig.granulometria.rows",
        "steps": [
          {
            "output": "granulometria.porcRetenido.${item.key}",
            "formula": "get(data.TablaTamices, item.key, 0) / results.granulometria.pesoTotal * 100"
          },
          {
            "output": "granulometria.porcRetAcumulado.${item.key}",
            "formula": "index === 0 ? get(results.granulometria.porcRetenido, item.key, 0) : get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0)"
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

Por favor, ejecuta este comando en tu base de datos para aplicar la configuración corregida.

```sql
UPDATE tipo_ensayo
SET config_calculos = '{
  "steps": [
    {
      "output": "granulometria.pesoTotal",
      "formula": "sum(values(isObject(data.TablaTamices) ? data.TablaTamices : {}))"
    },
    {
      "loop": {
        "source": "tableConfig.granulometria.rows",
        "steps": [
          {
            "output": "granulometria.porcRetenido.${item.key}",
            "formula": "get(data.TablaTamices, item.key, 0) / results.granulometria.pesoTotal * 100"
          },
          {
            "output": "granulometria.porcRetAcumulado.${item.key}",
            "formula": "index === 0 ? get(results.granulometria.porcRetenido, item.key, 0) : get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0)"
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
**Nota sobre el SQL:** Las comillas simples dentro del JSON deben escaparse duplicándolas (`''`) para que PostgreSQL lo interprete correctamente como una cadena literal.
