import React from 'react';
import './GestorProyectos.css';

const GraficosProyecto = ({ proyectoId }) => {
    return (
        <div style={{ padding: '25px', textAlign: 'center' }}>
            <h2>Análisis Gráfico de Suelos para el Proyecto {proyectoId}</h2>
            <p>Aquí se mostrarán los gráficos dinámicos.</p>
            {/* Integrar Chart.js o similar aquí */}
        </div>
    );
};

export default GraficosProyecto;
