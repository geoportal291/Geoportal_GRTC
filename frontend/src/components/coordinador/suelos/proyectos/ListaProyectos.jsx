import React from 'react';
import './GestorProyectos.css'; // Reutilizaremos los estilos

const ListaProyectos = ({ proyectos, onSelectProyecto, proyectoSeleccionado }) => {
    return (
        <div className="nav-links">
            {(proyectos && proyectos.length > 0) ? (
                proyectos.map(proyecto => (
                    <div 
                        key={proyecto.id}
                        className={`nav-item ${proyectoSeleccionado && proyectoSeleccionado.id === proyecto.id ? 'active' : ''}`}
                        onClick={() => onSelectProyecto(proyecto)}
                    >
                        {/* Icono y detalles del proyecto */}
                        <i className="fas fa-project-diagram"></i> {/* Icono genérico para proyecto */}
                        <span>{proyecto.nombre_tramo || 'Proyecto sin nombre'}</span>
                    </div>
                ))
            ) : (
                <p>No hay proyectos disponibles.</p>
            )}
        </div>
    );
};

export default ListaProyectos;
