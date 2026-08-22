import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeotecniaCanterasTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geotecnia_canteras"
            title="Geotecnia de Canteras"
            subtitle="Análisis automático de Materiales y Calicatas"
            projectData={projectData}
            kpiLabelOverride="Material Predominante"
            targetProperties={['MATERIAL', 'material', 'TIPO_SUELO', 'tipo_suelo', 'SUCS', 'sucs', 'AASHTO', 'aashto', 'USO', 'uso']}
        />
    );
};

export default GeotecniaCanterasTab;





