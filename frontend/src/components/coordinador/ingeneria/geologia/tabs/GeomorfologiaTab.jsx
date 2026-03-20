import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeomorfologiaTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geomorfologia"
            title="Geomorfología del Área"
            subtitle="Análisis automático de Formas del Relieve y Pendientes"
            projectData={projectData}
            kpiLabelOverride="Unidad Geomorfológica"
            targetProperties={['GEOMORFO', 'geomorfo', 'UNIDAD', 'unidad', 'RELIEVE', 'relieve']}
        />
    );
};

export default GeomorfologiaTab;





