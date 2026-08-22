import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/data/contexts/AuthContext';
import DisenoGeometrico from './DisenoGeometrico';
import DisenoGeometricoExternal from './DisenoGeometricoExternal';
import './DisenoGeometricoModes.css';

const STORAGE_KEY = 'disenoGeometricoViewMode';

function ViewSelectionModal({ projectName, onSelect }) {
  return (
    <div className="dg-view-selection-overlay">
      <div className="dg-view-selection-card">
        <span className="dg-mode-kicker">Modulo de acceso</span>
        <h2>Diseno Geometrico</h2>
        <p>{projectName ? `Proyecto activo: ${projectName}` : 'Selecciona como deseas ingresar al modulo.'}</p>

        <div className="dg-view-selection-grid">
          <button type="button" className="dg-view-selection-option" onClick={() => onSelect('internal')}>
            <div className="dg-view-selection-icon">
              <i className="fas fa-pen-ruler"></i>
            </div>
            <strong>Vista interna</strong>
            <span>Editor completo para crear, corregir y administrar capas.</span>
          </button>

          <button type="button" className="dg-view-selection-option external" onClick={() => onSelect('external')}>
            <div className="dg-view-selection-icon">
              <i className="fas fa-earth-americas"></i>
            </div>
            <strong>Vista externa</strong>
            <span>Geoportal de consulta para visitantes, sin carga ni edicion de datos.</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DisenoGeometricoModule() {
  const { user, selectedProjectName } = useAuth();
  const roleId = Number(user?.rol_id);
  const roleName = String(user?.rol_nombre || user?.role || '').toUpperCase();
  const isForcedExternalUser = useMemo(
    () => roleId === 6 || roleName.includes('VISITANTE'),
    [roleId, roleName]
  );
  
  const [viewMode, setViewMode] = useState(null);

  useEffect(() => {
    if (isForcedExternalUser) {
      setViewMode('external');
    } else {
      setViewMode(null);
    }
  }, [isForcedExternalUser]);

  if (viewMode === 'external') {
    return (
      <DisenoGeometricoExternal
        canReturnToSelector={!isForcedExternalUser}
        onBack={() => setViewMode(null)}
        onSwitchMode={setViewMode}
      />
    );
  }

  if (viewMode === 'internal') {
    return (
      <div className="dg-internal-mode-wrap">
        <DisenoGeometrico onSwitchMode={setViewMode} />
      </div>
    );
  }

  return <ViewSelectionModal projectName={selectedProjectName} onSelect={setViewMode} />;
}
