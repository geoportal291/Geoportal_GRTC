import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeodinamicaInternaTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geodinamica_interna"
            title="Geodinámica Interna"
            subtitle="Análisis automático de Peligros Sísmicos y Tectónicos"
            projectData={projectData}
            kpiLabelOverride="Peligro Principal"
            targetProperties={['PELIGRO', 'peligro', 'NIVEL', 'nivel', 'RIESGO', 'riesgo', 'SISMO', 'sismo']}
        />
    );
};

export default GeodinamicaInternaTab;
