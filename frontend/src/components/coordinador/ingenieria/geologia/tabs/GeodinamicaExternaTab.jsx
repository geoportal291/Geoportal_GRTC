import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeodinamicaExternaTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geodinamicaexterna"
            title="Geodinámica Externa (Detalle)"
            subtitle="Análisis automático de Deslizamientos y Huaycos"
            projectData={projectData}
            kpiLabelOverride="Peligro Predominante"
            targetProperties={['PELIGRO', 'peligro', 'TIPO_EVENT', 'tipo_event', 'FENOMENO', 'fenomeno', 'NIVEL', 'nivel']}
        />
    );
};

export default GeodinamicaExternaTab;





