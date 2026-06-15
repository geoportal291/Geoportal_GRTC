import { useMemo } from 'react';

const AlertCard = ({ type, title, message, entityName }) => {
  const isCritical = type === 'critical';
  
  return (
    <article className="traffic-v2-insight-card" style={{ 
      borderLeft: `4px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
      background: isCritical ? '#fef2f2' : '#fffbeb',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 16px',
      marginBottom: '12px',
      borderRadius: '0 6px 6px 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isCritical ? '#b91c1c' : '#b45309' }}>
        <i className={`fas ${isCritical ? 'fa-skull-crossbones' : 'fa-exclamation-triangle'}`} style={{ fontSize: '1.2rem' }}></i>
        <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{entityName}:</span> {message}
      </p>
    </article>
  );
};

const SuccessCard = () => (
  <div style={{
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '24px', textAlign: 'center'
  }}>
    <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '2rem', marginBottom: '12px' }}></i>
    <h4 style={{ color: '#166534', margin: '0 0 8px 0' }}>Todo en orden</h4>
    <p style={{ color: '#15803d', fontSize: '0.9rem', margin: 0 }}>El sistema no ha detectado anomalías críticas en los tramos procesados.</p>
  </div>
);

const TrafficInsightPanel = ({ stations, sections, extractedTrafficData, className = '' }) => {
  
  const alerts = useMemo(() => {
    const generatedAlerts = [];
    
    if (!extractedTrafficData) return generatedAlerts;

    // Scan stations for anomalies
    stations.forEach(station => {
      const data = extractedTrafficData[station.id];
      if (!data) {
        // Missing data alert
        generatedAlerts.push({
          id: `missing-${station.id}`,
          type: 'warning',
          title: 'Datos Faltantes',
          entityName: station.nombre || station.id,
          message: 'No se han detectado archivos analíticos procesados para esta estación. Se recomienda cargar el Excel correspondiente.'
        });
        return;
      }

      // V85 vs V. Diseño (Speeding Risk)
      if (data.v85 && data.vDiseno && data.v85 > data.vDiseno) {
        const excess = data.v85 - data.vDiseno;
        generatedAlerts.push({
          id: `speed-${station.id}`,
          type: 'critical',
          title: 'Riesgo de Seguridad Vial',
          entityName: station.nombre || station.id,
          message: `La velocidad V85 (${data.v85} km/h) supera la velocidad de diseño (${data.vDiseno} km/h) por ${excess} km/h. Probable necesidad de señalización restrictiva o rompemuelles.`
        });
      }

      // Heavy Load Wear Risk
      if (data.classificationData) {
        let pesados = 0;
        let total = 0;
        data.classificationData.forEach((val, idx) => {
          total += val;
          if (idx > 5) pesados += val; // Buses and trucks
        });
        
        const pctPesados = total > 0 ? (pesados / total) * 100 : 0;
        
        if (pctPesados > 30) {
           generatedAlerts.push({
             id: `wear-${station.id}`,
             type: 'critical',
             title: 'Desgaste Acelerado de Pavimento',
             entityName: station.nombre || station.id,
             message: `Alta incidencia de vehículos pesados (${pctPesados.toFixed(1)}% de la composición total). Esto incrementará exponencialmente la proyección de ESALs.`
           });
        }
      }
    });

    // Sort alerts: critical first, then warnings
    return generatedAlerts.sort((a, b) => {
      if (a.type === 'critical' && b.type === 'warning') return -1;
      if (a.type === 'warning' && b.type === 'critical') return 1;
      return 0;
    });
  }, [stations, extractedTrafficData]);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <section className={`traffic-v2-panel ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="traffic-v2-panel-header" style={{ paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <i className="fas fa-radar" style={{ color: '#ef4444' }}></i>
            Action Center Automático
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Auditoría de riesgos en tiempo real basada en datos operativos.</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
         <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>{criticalCount}</span>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#991b1b', fontWeight: '600' }}>Críticos</span>
         </div>
         <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold', color: '#d97706' }}>{warningCount}</span>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#b45309', fontWeight: '600' }}>Advertencias</span>
         </div>
      </div>

      <div className="traffic-v2-insights" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {alerts.length === 0 ? (
          <SuccessCard />
        ) : (
          alerts.map(alert => (
            <AlertCard 
              key={alert.id}
              type={alert.type}
              title={alert.title}
              entityName={alert.entityName}
              message={alert.message}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default TrafficInsightPanel;
