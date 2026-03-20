import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeologiaTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geologia_local"
            title="Dashboard Geológico"
            subtitle="Análisis automático de Formaciones y Unidades"
            projectData={projectData}
            kpiLabelOverride="Unidad Predominante"
            targetProperties={['UNIDAD', 'LITOLOGIA', 'unidad', 'litologia', 'Unidad', 'Litologia']}
        />
    );
};

export default GeologiaTab;





