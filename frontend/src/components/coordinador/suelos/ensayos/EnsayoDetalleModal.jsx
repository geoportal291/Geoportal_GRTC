import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import EnsayoDetallePanel from './EnsayoDetallePanel.jsx';
import './EnsayoDetalleModal.css';

const getEnsayoLabel = (ensayo, index) =>
  ensayo?.nombre_ensayo
  || ensayo?.codigo_ensayo
  || ensayo?.tipo_ensayo_descripcion
  || `Ensayo ${index + 1}`;

export default function EnsayoDetalleModal({
  isOpen,
  ensayos = [],
  initialEnsayoId = null,
  showEnsayoTabs = false,
  onClose,
  onSaved = null
}) {
  const normalizedEnsayos = useMemo(
    () => (Array.isArray(ensayos) ? ensayos.filter(Boolean) : []),
    [ensayos]
  );

  const fallbackEnsayoId = normalizedEnsayos[0]?.id ?? null;
  const [activeEnsayoId, setActiveEnsayoId] = useState(initialEnsayoId || fallbackEnsayoId);

  useEffect(() => {
    if (!isOpen) return;
    setActiveEnsayoId(initialEnsayoId || fallbackEnsayoId);
  }, [isOpen, initialEnsayoId, fallbackEnsayoId]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !activeEnsayoId) {
    return null;
  }

  const activeEnsayo = normalizedEnsayos.find((ensayo) => ensayo.id === activeEnsayoId) || normalizedEnsayos[0] || null;
  const shouldShowTabs = showEnsayoTabs && normalizedEnsayos.length > 1;

  return createPortal(
    <div className="ensayo-detalle-modal-overlay" onClick={onClose}>
      <div className="ensayo-detalle-modal-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="ensayo-detalle-modal-topbar">
          <div className="ensayo-detalle-modal-topbar-copy">
            <span className="ensayo-detalle-modal-kicker">Ensayo</span>
            <h3>{activeEnsayo?.nombre_ensayo || activeEnsayo?.codigo_ensayo || 'Detalle de Ensayo'}</h3>
          </div>
          <button type="button" className="ensayo-detalle-modal-close" onClick={onClose} aria-label="Cerrar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {shouldShowTabs && (
          <div className="ensayo-detalle-assay-tabs">
            {normalizedEnsayos.map((ensayo, index) => (
              <button
                key={ensayo.id}
                type="button"
                className={`ensayo-detalle-assay-tab ${activeEnsayoId === ensayo.id ? 'active' : ''}`}
                onClick={() => setActiveEnsayoId(ensayo.id)}
              >
                <span className="ensayo-detalle-assay-tab-label">{getEnsayoLabel(ensayo, index)}</span>
                {ensayo?.tipo_ensayo_descripcion && (
                  <span className="ensayo-detalle-assay-tab-meta">{ensayo.tipo_ensayo_descripcion}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="ensayo-detalle-modal-body">
          <EnsayoDetallePanel
            ensayoId={activeEnsayoId}
            initialEnsayoDetails={activeEnsayo}
            modalMode
            onClose={onClose}
            onSaved={onSaved}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
