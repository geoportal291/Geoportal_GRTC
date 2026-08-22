import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TrafficProjectFunnel = ({ stations, extractedTrafficData, className = '' }) => {

  const { progressData, matrixData, stats } = useMemo(() => {
    let totalModules = 0;
    let completedModules = 0;
    const matrix = [];

    stations.forEach(station => {
      const data = extractedTrafficData && extractedTrafficData[station.id] ? extractedTrafficData[station.id] : null;
      
      const hasConteo = data && data.imda > 0;
      const conteoStatus = hasConteo ? (data.moduleStatus?.conteo_vehicular || 'pending') : 'missing';
      
      const hasClasificacion = data && data.classificationData && data.classificationData.length > 0;
      const clasifStatus = hasClasificacion ? (data.moduleStatus?.encuesta_origen_destino || 'pending') : 'missing';
      
      const hasVelocidad = data && data.v85 > 0;
      const velocidadStatus = hasVelocidad ? (data.moduleStatus?.encuesta_velocidad || 'pending') : 'missing';
      
      // Contabilizar para el progreso global (solo los aprobados o extraídos)
      totalModules += 3;
      if (hasConteo) completedModules++;
      if (hasClasificacion) completedModules++;
      if (hasVelocidad) completedModules++;

      matrix.push({
        id: station.id,
        nombre: station.nombre || station.id,
        modules: [
          { name: 'Conteo Base (IMDa)', status: conteoStatus },
          { name: 'Clasif. Vehicular', status: clasifStatus },
          { name: 'Velocidad Operativa', status: velocidadStatus }
        ]
      });
    });

    const percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    
    const chartData = [
      { name: 'Completado', value: completedModules, fill: '#10b981' }, // Verde
      { name: 'Pendiente', value: totalModules - completedModules, fill: '#e2e8f0' } // Gris
    ];

    return { 
      progressData: chartData, 
      matrixData: matrix,
      stats: { percent, completedModules, totalModules }
    };
  }, [stations, extractedTrafficData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '4px', fontSize: '0.85rem' }}>
          <strong>{payload[0].name}:</strong> {payload[0].value} módulos
        </div>
      );
    }
    return null;
  };

  return (
    <section className={`traffic-v2-panel ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="traffic-v2-panel-header" style={{ paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <i className="fas fa-th-large" style={{ color: '#3b82f6' }}></i>
            Matriz de Cobertura de Módulos
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Auditoría detallada del estado de procesamiento de datos por cada estación operativa.</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Lado Izquierdo: Radial Progress */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Texto en el centro del Donut */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>
                {stats.percent}%
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginTop: '4px' }}>
                PROCESADO
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', color: '#475569' }}>
            <strong>{stats.completedModules}</strong> de <strong>{stats.totalModules}</strong> módulos extraídos
          </div>
        </div>

        {/* Lado Derecho: La Matriz */}
        <div style={{ flex: 1, minWidth: '300px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold' }}>Estación de Control</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold', textAlign: 'center' }}>Conteo Base</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold', textAlign: 'center' }}>Clasificación</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold', textAlign: 'center' }}>Velocidad</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, index) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>{row.nombre}</td>
                  {row.modules.map((mod, i) => {
                    let iconClass = 'fa-minus';
                    let bgColor = '#f1f5f9';
                    let color = '#94a3b8';
                    
                    if (mod.status === 'approved') {
                      iconClass = 'fa-check';
                      bgColor = '#dcfce7';
                      color = '#16a34a';
                    } else if (mod.status === 'pending') {
                      iconClass = 'fa-clock';
                      bgColor = '#fefce8';
                      color = '#ca8a04';
                    } else if (mod.status === 'rejected') {
                      iconClass = 'fa-times';
                      bgColor = '#fee2e2';
                      color = '#dc2626';
                    }

                    return (
                      <td key={i} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div 
                          title={`Estado: ${mod.status}`}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: bgColor, color: color }}
                        >
                          <i className={`fas ${iconClass}`} style={{ fontSize: '0.85rem' }}></i>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {matrixData.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No hay estaciones registradas en el proyecto.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </section>
  );
};

export default TrafficProjectFunnel;
