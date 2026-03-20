import React from 'react';
import GeologiaDynamicDashboard from './GeologiaDynamicDashboard';

const GeologiaEstructuralTab = ({ projectData }) => {
    return (
        <GeologiaDynamicDashboard 
            tabName="geologiaestructural"
            title="Geología Estructural"
            subtitle="Análisis automático de Fallas, Pliegues y Lineamientos"
            projectData={projectData}
            kpiLabelOverride="Estructura Predominante"
            targetProperties={['ESTRUCTURA', 'estructura', 'TIPO', 'tipo', 'FALLA', 'falla', 'PLIEGUE', 'pliegue']}
        />
    );
};

export default GeologiaEstructuralTab;





