
## Corrección Definitiva para Cálculos de Granulometría

Después de analizar el flujo de datos en `DetalleEnsayo.jsx`, se confirma que el objeto `data` pasado al motor de cálculo es una copia directa del estado `formData`, el cual se llena con el objeto `datos_ensayo` de la respuesta de la API. No existe una propiedad anidada `datos_formulario`.

El error `Cannot read properties of undefined (reading 'TablaTamices')` se debe a que la ruta en las fórmulas era incorrecta.

La solución es eliminar `datos_formulario` de todas las rutas de acceso en `config_calculos`.

### 1. `config_calculos` JSON Corregido

```json
{
  "version": 2,
  "calculos": [
    {
      "output": "granulometria.pesoTotal",
      "formula": "sum(values(isObject(data.TablaTamices) ? data.TablaTamices : {}))"
    },
    {
      "loop": {
        "source": "tableConfig.rows",
        "steps": [
          {
            "output": "granulometria.porcRetenido.${item.key}",
            "formula": "get(data.TablaTamices, item.key, 0) / results.granulometria.pesoTotal * 100"
          },
          {
            "output": "granulometria.porcRetAcumulado.${item.key}",
            "formula": "index === 0 ? get(results.granulometria.porcRetenido, item.key, 0) : (get(results.granulometria.porcRetenido, item.key, 0) + get(results.granulometria.porcRetAcumulado, tableConfig.rows[index-1].key, 0))"
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
      "output": "granulometria.d10",
      "formula": "interpolar(values(results.granulometria.porcPasa), map(tableConfig.rows, (row) => row.tamiz), 10)"
    },
    {
      "output": "granulometria.d30",
      "formula": "interpolar(values(results.granulometria.porcPasa), map(tableConfig.rows, (row) => row.tamiz), 30)"
    },
    {
      "output": "granulometria.d60",
      "formula": "interpolar(values(results.granulometria.porcPasa), map(tableConfig.rows, (row) => row.tamiz), 60)"
    },
    {
      "output": "granulometria.coefUniformidad",
      "formula": "results.granulometria.d10 > 0 ? results.granulometria.d60 / results.granulometria.d10 : 0"
    },
    {
      "output": "granulometria.coefCurvatura",
      "formula": "(results.granulometria.d60 * results.granulometria.d10) > 0 ? (results.granulometria.d30^2) / (results.granulometria.d60 * results.granulometria.d10) : 0"
    }
  ]
}
```

### 2. Script SQL para Actualizar la Base de Datos

Ejecuta esta sentencia SQL para aplicar la configuración corregida al ensayo de "Granulometría".

```sql
UPDATE tipo_ensayo
SET config_calculos = '{
  "version": 2,
  "calculos": [
    {
      "output": "granulometria.pesoTotal",
      "formula": "sum(values(isObject(data.TablaTamices) ? data.TablaTamices : {}))"
    },
    {
      "loop": {
        "source": "tableConfig.rows",
        "steps": [
          {
            "output": "granulometria.porcRetenido.${item.key}",
            "formula": "get(data.TablaTamices, item.key, 0) / results.granulometria.pesoTotal * 100"
          },
          {
            "output": "granulometria.porcRetAcumulado.${item.key}",
            "formula": "index === 0 ? get(results.granulometria.porcRetenido, item.key, 0) : (get(results.granulometria.porcRetenido, item.key, 0) + get(results.granulometria.porcRetAcumulado, tableConfig.rows[index-1].key, 0))"
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
      "output": "granulometria.d10",
      "formula": "interpolar(values(results.granulometria.porcPasa), map(tableConfig.rows, (row) => row.tamiz), 10)"
    },
    {
      "output": "granulometria.d30",
      "formula": "interpolar(values(results.granulometria.porcPasa), map(tableConfig.rows, (row) => row.tamiz), 30)"
    },
    {
      "output": "granulometria.d60",
      "formula": "interpolar(values(results.granulometria.porcPasa), map(tableConfig.rows, (row) => row.tamiz), 60)"
    },
    {
      "output": "granulometria.coefUniformidad",
      "formula": "results.granulometria.d10 > 0 ? results.granulometria.d60 / results.granulometria.d10 : 0"
    },
    {
      "output": "granulometria.coefCurvatura",
      "formula": "(results.granulometria.d60 * results.granulometria.d10) > 0 ? (results.granulometria.d30^2) / (results.granulometria.d60 * results.granulometria.d10) : 0"
    }
  ]
}'
WHERE nombre_ensayo = 'Granulometría';
```

Por favor, aplica este cambio en tu base de datos y prueba de nuevo. Esto debería resolver la cascada de errores de cálculo.
