import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeotecniaMurosCimentacionesTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geotecnia_muros_cimentaciones"
            title="Geotecnia de Muros y Cimentaciones"
            subtitle="Análisis automático de Muros y Capacidad Portante"
            projectData={projectData}
            kpiLabelOverride="Tipo de Muro"
            targetProperties={['MURO', 'muro', 'TIPO_MURO', 'tipo_muro', 'MATERIAL', 'material', 'CAPACIDAD', 'capacidad']}
        />
    );
};

export default GeotecniaMurosCimentacionesTab;





