UPDATE tipo_ensayo
SET config_calculos = $$
{
  "version": 1,
  "steps": [
    {
      "id": "calculo_granulometria_base",
      "engine": "calcularGranulometria",
      "inputs": {
        "retenidos": "data.retenidos",
        "despuesLavado": "data.despuesLavado",
        "tamices": "tableConfig.granulometria.rows"
      },
      "outputs": {
        "porcRet": "granulometria.porcRet",
        "acum": "granulometria.acum",
        "pasa": "granulometria.pasa",
        "totalRetenido": "granulometria.totalRetenido",
        "retenidoMenor200": "granulometria.retenidoMenor200",
        "porcRetMenor200": "granulometria.porcRetMenor200",
        "acumMenor200": "granulometria.acumMenor200",
        "pasaMenor200": "granulometria.pasaMenor200",
        "totalPorcRetenido": "granulometria.totalPorcRetenido"
      }
    },
    {
      "id": "calculo_coeficientes",
      "engine": "calcularCoeficientes",
      "inputs": {
        "pasa": "results.granulometria.pasa",
        "tamices": "tableConfig.granulometria.rows"
      },
      "outputs": {
        "d10": "granulometria.d10",
        "d30": "granulometria.d30",
        "d60": "granulometria.d60",
        "coefUniformidad": "granulometria.coefUniformidad",
        "coefCurvatura": "granulometria.coefCurvatura"
      }
    },
    {
      "id": "calculo_porcentajes_material",
      "engine": "calcularPorcentajesMaterial",
      "inputs": {
        "pasaN200": "results.granulometria.pasa.n200",
        "acumN4": "results.granulometria.acum.n4"
      },
      "outputs": {
        "porcFinos": "granulometria.porcFinos",
        "porcGrava": "granulometria.porcGrava",
        "porcArena": "granulometria.porcArena"
      }
    },
    {
      "id": "calculo_limites",
      "engine": "calcularLimites",
      "inputs": {
        "data": "data"
      },
      "outputs": {
        "limites": "limites"
      }
    },
    {
      "id": "clasificacion_suelos",
      "engine": "clasificarSuelos",
      "inputs": {
        "granulometria": "results.granulometria",
        "limites": "results.limites"
      },
      "outputs": {
        "clasificacionSUCS": "clasificacion.clasificacionSUCS",
        "clasificacionAASHTO": "clasificacion.clasificacionAASHTO",
        "indiceGrupo": "clasificacion.indiceGrupo"
      }
    }
  ]
}
$$::jsonb
WHERE codigo = 'GRA';
