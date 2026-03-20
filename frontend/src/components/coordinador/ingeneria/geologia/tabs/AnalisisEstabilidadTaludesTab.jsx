import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const AnalisisEstabilidadTaludesTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="analisis_estabilidad_taludes"
            title="Análisis de Estabilidad de Taludes"
            subtitle="Análisis automático de Taludes y Movimientos de Masa"
            projectData={projectData}
            kpiLabelOverride="Tipo de Talud"
            targetProperties={['TALUD', 'talud', 'ESTADO', 'estado', 'TIPO', 'tipo', 'MATERIAL', 'material']}
        />
    );
};

export default AnalisisEstabilidadTaludesTab;





