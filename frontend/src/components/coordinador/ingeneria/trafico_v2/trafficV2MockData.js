/**
 * Generador determinista de datos de tráfico para pruebas y fallback en el Geoportal V2.
 * Genera datos realistas y variados según el ID de la estación o tramo.
 */

// Función de hash simple para generar números pseudo-aleatorios consistentes basados en un ID
function getSeed(id) {
  const str = String(id || 'default');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Retorna un valor en un rango basado en el seed y un offset
function getVal(seed, min, max, offset = 0) {
  const finalSeed = seed + offset;
  const pseudoRandom = (Math.sin(finalSeed) + 1) / 2; // valor entre 0 y 1
  return Math.round(min + pseudoRandom * (max - min));
}

export function getMockTrafficData(entityId, entityType = 'station') {
  const seed = getSeed(entityId);
  const isStation = entityType === 'station';

  // 1. Variación Horaria (24 horas)
  const hourlyVariation = [];
  for (let h = 0; h < 24; h++) {
    // Patrón de tráfico típico: picos a las 8:00, 13:00 y 18:00
    let factor = 0.2; // base nocturna
    if (h >= 7 && h <= 9) factor = 0.85; // hora punta mañana
    else if (h >= 12 && h <= 14) factor = 0.75; // hora punta almuerzo
    else if (h >= 17 && h <= 19) factor = 0.95; // hora punta tarde
    else if (h >= 6 && h <= 21) factor = 0.55; // tráfico diurno regular

    const baseVolume = getVal(seed, 100, 300, h);
    const hourlyTotal = Math.round(baseVolume * factor);
    
    // Clasificación del flujo horario
    const ligeros = Math.round(hourlyTotal * 0.70);
    const buses = Math.round(hourlyTotal * 0.12);
    const camiones = Math.max(1, hourlyTotal - ligeros - buses);

    hourlyVariation.push({
      hora: `${String(h).padStart(2, '0')}:00`,
      Ligeros: ligeros,
      Buses: buses,
      Camiones: camiones,
      Total: hourlyTotal
    });
  }

  // 2. Clasificación Vehicular (IMDa consolidado)
  const totalIMDa = getVal(seed, 1200, 4500, 100);
  const classLigeros = Math.round(totalIMDa * getVal(seed, 60, 75, 101) / 100);
  const classBuses = Math.round(totalIMDa * getVal(seed, 8, 14, 102) / 100);
  const classC2 = Math.round(totalIMDa * getVal(seed, 6, 12, 103) / 100);
  const classC3Mas = Math.max(50, totalIMDa - classLigeros - classBuses - classC2);

  const vehicleClassification = [
    { name: 'Ligeros (Autos/SUVs)', value: classLigeros, fill: '#3b82f6' },
    { name: 'Buses (Omnibus)', value: classBuses, fill: '#10b981' },
    { name: 'Camiones C2 (2 Ejes)', value: classC2, fill: '#f59e0b' },
    { name: 'Camiones C3+ (Pesados)', value: classC3Mas, fill: '#ef4444' }
  ];

  // 3. Origen y Destino (Pares principales)
  const odPairs = [
    { pair: 'Lima - Huancayo', Pasajeros: getVal(seed, 25, 40, 201), Carga: getVal(seed, 30, 45, 202) },
    { pair: 'Huancayo - Lima', Pasajeros: getVal(seed, 20, 35, 203), Carga: getVal(seed, 25, 40, 204) },
    { pair: 'Jauja - Huancayo', Pasajeros: getVal(seed, 10, 20, 205), Carga: getVal(seed, 8, 15, 206) },
    { pair: 'Tarma - Lima', Pasajeros: getVal(seed, 8, 15, 207), Carga: getVal(seed, 10, 22, 208) },
    { pair: 'Otros Pares', Pasajeros: getVal(seed, 5, 12, 209), Carga: getVal(seed, 6, 12, 210) }
  ];

  // 4. Censo de Cargas (Peso por Eje en Toneladas vs Límite MTC)
  const loadSpectrum = [
    {
      tipo: 'Eje Simple Direccional',
      Medido: Number((getVal(seed, 50, 72, 301) / 10).toFixed(1)),
      Limite: 7.0,
      descripcion: 'Eje delantero de camión/bús'
    },
    {
      tipo: 'Eje Simple Posterior',
      Medido: Number((getVal(seed, 95, 122, 302) / 10).toFixed(1)),
      Limite: 11.0,
      descripcion: 'Eje motriz simple'
    },
    {
      tipo: 'Eje Doble (Tándem)',
      Medido: Number((getVal(seed, 160, 195, 303) / 10).toFixed(1)),
      Limite: 18.0,
      descripcion: 'Conjunto de doble eje'
    },
    {
      tipo: 'Eje Triple (Trídem)',
      Medido: Number((getVal(seed, 230, 265, 304) / 10).toFixed(1)),
      Limite: 25.0,
      descripcion: 'Conjunto de triple eje posterior'
    }
  ];

  // 5. Encuesta de Velocidad (Distribución)
  const speedDistribution = [
    { rango: '30-40 km/h', vehiculos: getVal(seed, 15, 35, 401) },
    { rango: '40-50 km/h', vehiculos: getVal(seed, 40, 85, 402) },
    { rango: '50-60 km/h', vehiculos: getVal(seed, 120, 190, 403) },
    { rango: '60-70 km/h', vehiculos: getVal(seed, 210, 310, 404) },
    { rango: '70-80 km/h', vehiculos: getVal(seed, 140, 220, 405) },
    { rango: '80-90 km/h', vehiculos: getVal(seed, 50, 110, 406) },
    { rango: '90-100 km/h', vehiculos: getVal(seed, 10, 35, 407) },
    { rango: '100+ km/h', vehiculos: getVal(seed, 2, 15, 408) }
  ];

  const vMedia = getVal(seed, 58, 64, 450);
  const v85 = getVal(seed, 74, 82, 451);
  const vDiseno = getVal(seed, 60, 80, 452) === 60 ? 60 : 70;

  // 6. Ejes Equivalentes (ESALs Acumulados Proyectados a 20 Años)
  const esalsProjection = [];
  const baseEsals = getVal(seed, 150000, 380000, 501);
  
  let acumuladoBajo = 0;
  let acumuladoMedio = 0;
  let acumuladoAlto = 0;

  for (let yr = 1; yr <= 20; yr++) {
    // Escenarios de tasas de crecimiento anual
    const factorBajo = Math.pow(1 + 0.025, yr - 1);
    const factorMedio = Math.pow(1 + 0.040, yr - 1);
    const factorAlto = Math.pow(1 + 0.055, yr - 1);

    acumuladoBajo += Math.round(baseEsals * factorBajo);
    acumuladoMedio += Math.round(baseEsals * factorMedio);
    acumuladoAlto += Math.round(baseEsals * factorAlto);

    // Solo guardamos años clave o todos para suavizar el gráfico
    esalsProjection.push({
      año: `Año ${yr}`,
      'Escenario Bajo (2.5%)': acumuladoBajo,
      'Escenario Medio (4.0%)': acumuladoMedio,
      'Escenario Alto (5.5%)': acumuladoAlto
    });
  }

  return {
    imda: totalIMDa,
    hourlyVariation,
    vehicleClassification,
    odPairs,
    loadSpectrum,
    speedDistribution,
    speedStats: {
      vMedia,
      v85,
      vDiseno
    },
    esalsProjection
  };
}
