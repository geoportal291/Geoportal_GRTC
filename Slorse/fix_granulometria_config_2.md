A continuación se presenta la configuración de cálculo corregida para el ensayo de **Granulometría**. El problema principal era que las rutas de `output` incluían incorrectamente el prefijo `results.`, lo que causaba que los datos se guardaran en una estructura anidada errónea (`results.results...`) y provocaba fallos en los cálculos posteriores.

### JSON Corregido (`config_calculos`)

```json
{
    "steps": [
        {
            "output": "granulometria.pesoTotal",
            "comment": "Calcular el peso total de la muestra",
            "formula": "sum(values(data.TablaTamices))"
        },
        {
            "loop": {
                "source": "tableConfig.granulometria.rows",
                "steps": [
                    {
                        "output": "granulometria.retenido.${item.key}",
                        "formula": "get(data.TablaTamices, item.key, 0)"
                    },
                    {
                        "output": "granulometria.porcRetenido.${item.key}",
                        "formula": "(get(results.granulometria.retenido, item.key, 0) / (results.granulometria.pesoTotal > 0 ? results.granulometria.pesoTotal : 1)) * 100"
                    },
                    {
                        "output": "granulometria.porcRetAcumulado.${item.key}",
                        "formula": "get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0)"
                    },
                    {
                        "output": "granulometria.pasa.${item.key}",
                        "formula": "100 - get(results.granulometria.porcRetAcumulado, item.key, 0)"
                    }
                ]
            }
        },
        {
            "engine": "interpolarDiametros",
            "inputs": {
                "pasa": "results.granulometria.pasa",
                "rows": "tableConfig.granulometria.rows"
            },
            "outputs": {
                "d60": "granulometria.d60",
                "d30": "granulometria.d30",
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
            "output": "granulometria.porcFinos",
            "formula": "get(results.granulometria.pasa, 'n200', 0)"
        },
        {
            "output": "granulometria.porcArena",
            "formula": "get(results.granulometria.pasa, 'n4', 0) - get(results.granulometria.pasa, 'n200', 0)"
        },
        {
            "output": "granulometria.porcGrava",
            "formula": "100 - get(results.granulometria.pasa, 'n4', 0)"
        },
        {
            "engine": "clasificarSuelos",
            "inputs": {
                "limites": "results.limites",
                "granulometria": "results.granulometria"
            },
            "outputs": {
                "clasificacionSUCS": "clasificacion.SUCS",
                "clasificacionAASHTO": "clasificacion.AASHTO",
                "indiceGrupo": "clasificacion.indiceGrupo"
            }
        },
        {
            "engine": "generarCurvaGranulometrica",
            "inputs": {
                "pasa": "results.granulometria.pasa",
                "rows": "tableConfig.granulometria.rows"
            },
            "outputs": {
                "curva_granulometria": "curva_granulometria"
            }
        }
    ]
}
```

### Sentencia SQL de Actualización

```sql
-- Reemplaza 'ID_DEL_TIPO_DE_ENSAYO_GRANULOMETRIA' con el ID correcto para 'Granulometría' en tu tabla tipo_ensayo.
UPDATE tipo_ensayo
SET config_calculos = '{
    "steps": [
        {
            "output": "granulometria.pesoTotal",
            "comment": "Calcular el peso total de la muestra",
            "formula": "sum(values(data.TablaTamices))"
        },
        {
            "loop": {
                "source": "tableConfig.granulometria.rows",
                "steps": [
                    {
                        "output": "granulometria.retenido.${item.key}",
                        "formula": "get(data.TablaTamices, item.key, 0)"
                    },
                    {
                        "output": "granulometria.porcRetenido.${item.key}",
                        "formula": "(get(results.granulometria.retenido, item.key, 0) / (results.granulometria.pesoTotal > 0 ? results.granulometria.pesoTotal : 1)) * 100"
                    },
                    {
                        "output": "granulometria.porcRetAcumulado.${item.key}",
                        "formula": "get(results.granulometria.porcRetAcumulado, tableConfig.granulometria.rows[index-1].key, 0) + get(results.granulometria.porcRetenido, item.key, 0)"
                    },
                    {
                        "output": "granulometria.pasa.${item.key}",
                        "formula": "100 - get(results.granulometria.porcRetAcumulado, item.key, 0)"
                    }
                ]
            }
        },
        {
            "engine": "interpolarDiametros",
            "inputs": {
                "pasa": "results.granulometria.pasa",
                "rows": "tableConfig.granulometria.rows"
            },
            "outputs": {
                "d60": "granulometria.d60",
                "d30": "granulometria.d30",
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
            "output": "granulometria.porcFinos",
            "formula": "get(results.granulometria.pasa, ''n200'', 0)"
        },
        {
            "output": "granulometria.porcArena",
            "formula": "get(results.granulometria.pasa, ''n4'', 0) - get(results.granulometria.pasa, ''n200'', 0)"
        },
        {
            "output": "granulometria.porcGrava",
            "formula": "100 - get(results.granulometria.pasa, ''n4'', 0)"
        },
        {
            "engine": "clasificarSuelos",
            "inputs": {
                "limites": "results.limites",
                "granulometria": "results.granulometria"
            },
            "outputs": {
                "clasificacionSUCS": "clasificacion.SUCS",
                "clasificacionAASHTO": "clasificacion.AASHTO",
                "indiceGrupo": "clasificacion.indiceGrupo"
            }
        },
        {
            "engine": "generarCurvaGranulometrica",
            "inputs": {
                "pasa": "results.granulometria.pasa",
                "rows": "tableConfig.granulometria.rows"
            },
            "outputs": {
                "curva_granulometria": "curva_granulometria"
            }
        }
    ]
}'
WHERE tipo_ensayo_id = ID_DEL_TIPO_DE_ENSAYO_GRANULOMETRIA;
```
