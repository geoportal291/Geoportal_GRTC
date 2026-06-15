import React from 'react';
import * as XLSX from 'xlsx';
import { MODULE_CONFIG } from '../trafficV2Utils';

const ExportMasterExcelButton = ({ stations = [], sections = [], extractedTrafficData = {}, projectName = 'Proyecto' }) => {
  
  const handleExport = () => {
    // 1. Preparar datos de Estaciones (IMDa y Clasificación)
    const stationsData = [];
    stations.forEach(station => {
      const data = extractedTrafficData[station.id];
      if (data) {
        // Solo incluir si el módulo está aprobado
        const statusConteo = data.moduleStatus?.['conteo_vehicular'];
        const isApproved = statusConteo === 'approved';
        
        stationsData.push({
          'ID Estación': station.id,
          'Nombre': station.nombre || '',
          'Coordenadas': station.coordenadas || '',
          'Estado QA/QC': isApproved ? 'Aprobado' : statusConteo === 'rejected' ? 'Rechazado' : 'Pendiente',
          'IMDa Estimado': isApproved ? data.imda || 0 : 'N/A',
          'Vehículo Dominante': isApproved ? data.dominantVehicle || 'N/A' : 'N/A',
          'V85 (Velocidad)': isApproved ? data.speedStats?.v85 || 'N/A' : 'N/A'
        });
      } else {
        stationsData.push({
          'ID Estación': station.id,
          'Nombre': station.nombre || '',
          'Coordenadas': station.coordenadas || '',
          'Estado QA/QC': 'Sin Datos',
          'IMDa Estimado': 'N/A',
          'Vehículo Dominante': 'N/A',
          'V85 (Velocidad)': 'N/A'
        });
      }
    });

    // 2. Preparar datos de Tramos (Velocidad y ESALs)
    const sectionsData = [];
    sections.forEach(section => {
      const data = extractedTrafficData[section.id];
      if (data) {
        const statusVelocidad = data.moduleStatus?.['encuesta_velocidad'];
        const isApproved = statusVelocidad === 'approved';
        
        sectionsData.push({
          'ID Tramo': section.id,
          'Nombre': section.nombre || '',
          'Estado QA/QC': isApproved ? 'Aprobado' : statusVelocidad === 'rejected' ? 'Rechazado' : 'Pendiente',
          'Velocidad Diseño': isApproved ? data.speedStats?.vDiseno || 'N/A' : 'N/A',
          'Velocidad V85': isApproved ? data.speedStats?.v85 || 'N/A' : 'N/A',
          'ESALs Proyectados': isApproved ? data.ejesEquivalentes?.tableData?.[1]?.[3] || 'N/A' : 'N/A' // Approx logic
        });
      } else {
        sectionsData.push({
          'ID Tramo': section.id,
          'Nombre': section.nombre || '',
          'Estado QA/QC': 'Sin Datos',
          'Velocidad Diseño': 'N/A',
          'Velocidad V85': 'N/A',
          'ESALs Proyectados': 'N/A'
        });
      }
    });

    // 3. Crear el libro de Excel
    const wb = XLSX.utils.book_new();
    
    // Hoja 1
    const wsStations = XLSX.utils.json_to_sheet(stationsData);
    XLSX.utils.book_append_sheet(wb, wsStations, 'Estaciones (IMDa)');
    
    // Hoja 2
    const wsSections = XLSX.utils.json_to_sheet(sectionsData);
    XLSX.utils.book_append_sheet(wb, wsSections, 'Tramos (Velocidad)');

    // 4. Descargar
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Master_Trafico_${projectName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
  };

  return (
    <button 
      onClick={handleExport}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1)',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
    >
      <i className="fas fa-file-excel"></i>
      Exportar Master Excel
    </button>
  );
};

export default ExportMasterExcelButton;
