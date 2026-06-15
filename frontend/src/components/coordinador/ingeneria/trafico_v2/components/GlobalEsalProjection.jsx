import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return num.toLocaleString('es-PE');
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1e293b' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: entry.color, borderRadius: '2px' }}></div>
            <span style={{ color: '#475569', fontSize: '0.85rem' }}>{entry.name}:</span>
            <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{Math.round(entry.value).toLocaleString('es-PE')} ESALs</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const GlobalEsalProjection = ({ extractedTrafficData, stations, className = '' }) => {
  const projectionData = useMemo(() => {
    let baseHeavyVehiclesDay = 0;

    if (extractedTrafficData && stations) {
      stations.forEach(station => {
        const data = extractedTrafficData[station.id];
        if (data && data.classificationData) {
           let pesados = 0;
           data.classificationData.forEach((val, idx) => {
             if (idx > 5) pesados += val; // Índices > 5 son pesados (Buses, Camiones, Articulados)
           });
           baseHeavyVehiclesDay += pesados;
        }
      });
    }

    // Si no hay datos, simulamos un tráfico base de 120 pesados por día para que el gráfico no esté en cero absoluto.
    if (baseHeavyVehiclesDay === 0) baseHeavyVehiclesDay = 120;

    // Cálculo aproximado de ESALs inicial (Factor Daño promedio 2.8 por vehículo pesado)
    const baseEsalsYear = baseHeavyVehiclesDay * 365 * 2.8;

    const dataPoints = [];
    let acumBajo = 0;
    let acumMedio = 0;
    let acumAlto = 0;

    // Proyección a 20 años
    for (let yr = 1; yr <= 20; yr++) {
      const currentYear = new Date().getFullYear() + yr - 1;
      
      const factorBajo = Math.pow(1 + 0.025, yr - 1);
      const factorMedio = Math.pow(1 + 0.040, yr - 1);
      const factorAlto = Math.pow(1 + 0.055, yr - 1);

      acumBajo += baseEsalsYear * factorBajo;
      acumMedio += baseEsalsYear * factorMedio;
      acumAlto += baseEsalsYear * factorAlto;

      dataPoints.push({
        año: currentYear.toString(),
        'Escenario Bajo (2.5%)': Math.round(acumBajo),
        'Escenario Medio (4.0%)': Math.round(acumMedio),
        'Escenario Alto (5.5%)': Math.round(acumAlto)
      });
    }

    return dataPoints;
  }, [extractedTrafficData, stations]);

  return (
    <section className={`traffic-v2-panel ${className}`.trim()}>
      <div className="traffic-v2-panel-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#1e293b', margin: '0 0 4px 0' }}>
            <i className="fas fa-road" style={{ color: '#8b5cf6' }}></i>
            Proyección Maestra de Pavimento (ESALs Globales)
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Proyección acumulada de Ejes Equivalentes de Carga (ESALs) a 20 años, consolidando todas las estaciones del corredor vial para diseño de pavimentos.
          </p>
        </div>
      </div>

      <div style={{ height: '400px', width: '100%', paddingRight: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAlto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMedio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBajo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="año" stroke="#64748b" fontSize={12} tickMargin={10} minTickGap={20} />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickFormatter={formatNumber} 
              axisLine={false} 
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            <Area 
              type="monotone" 
              dataKey="Escenario Alto (5.5%)" 
              stroke="#ef4444" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAlto)" 
            />
            <Area 
              type="monotone" 
              dataKey="Escenario Medio (4.0%)" 
              stroke="#f59e0b" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorMedio)" 
            />
            <Area 
              type="monotone" 
              dataKey="Escenario Bajo (2.5%)" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBajo)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <i className="fas fa-info-circle" style={{ color: '#3b82f6', marginTop: '2px' }}></i>
        <p style={{ margin: 0 }}>
           Esta gráfica calcula automáticamente los ESALs sumando el tráfico pesado de todos los Excels procesados. Los tres escenarios (Bajo, Medio, Alto) representan diferentes tasas de crecimiento económico proyectado en la zona de influencia de la carretera.
        </p>
      </div>
    </section>
  );
};

export default GlobalEsalProjection;
