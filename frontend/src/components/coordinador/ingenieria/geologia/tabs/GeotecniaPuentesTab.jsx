import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeotecniaPuentesTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geotecnia_puentes"
            title="Geotecnia de Puentes"
            subtitle="Análisis automático de Suelos de Cimentación"
            projectData={projectData}
            kpiLabelOverride="Tipo de Suelo"
            targetProperties={['TIPO_SUELO', 'tipo_suelo', 'MATERIAL', 'material', 'SUCS', 'sucs', 'CAPACIDAD', 'capacidad']}
        />
    );
};

export default GeotecniaPuentesTab;





