import React from 'react';
import './GestorProyectos.css';

const ReportesProyecto = ({ proyectoId }) => {
    return (
        <div style={{ padding: '25px', textAlign: 'center' }}>
            <h2>Generación de Reportes para el Proyecto {proyectoId}</h2>
            <p>Aquí se generarán y gestionarán los reportes del proyecto.</p>
            {/* Lógica para reportes */}
        </div>
    );
};

export default ReportesProyecto;
