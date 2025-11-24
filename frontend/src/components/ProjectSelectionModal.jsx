import React from 'react';
import { useAuth } from '../data/contexts/AuthContext';
import './ProjectSelectionModal.css'; // We will create this CSS file next

const ProjectSelectionModal = () => {
  const { assignedProjects, selectProject, showProjectSelectionModal } = useAuth();

  if (!showProjectSelectionModal || assignedProjects.length === 0) {
    return null;
  }

  return (
    <div className="project-selection-overlay">
      <div className="project-selection-modal">
        <h3>Selecciona un Proyecto</h3>
        <p>Tienes acceso a múltiples proyectos. Por favor, selecciona uno para continuar.</p>
        <div className="project-list">
          {assignedProjects.map((project) => (
            <button
              key={project.proyecto_id || project.id}
              className="project-item-btn"
              onClick={() => selectProject(project.proyecto_id || project.id, project.nombre_proyecto || project.proyecto_nom || project.nombre || project.nombre_tramo)}
            >
              {project.nombre_proyecto || project.proyecto_nom || project.nombre || project.nombre_tramo || 'NOMBRE NO DISPONIBLE'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectionModal;
