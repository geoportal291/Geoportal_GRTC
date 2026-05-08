import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import alertify from 'alertifyjs';
import EnsayoDetallePanel from './EnsayoDetallePanel.jsx';
import './EnsayoDetalleModal.css';

const getEnsayoLabel = (ensayo, index) => {
  const tipo = ensayo?.tipo_ensayo_descripcion || 'Ensayo';
  const identificador = ensayo?.codigo_ensayo ? ` (${ensayo.codigo_ensayo})` : ` ${index + 1}`;
  return `${tipo}${identificador}`;
};

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveEnsayoId(initialEnsayoId || fallbackEnsayoId);
    setHasUnsavedChanges(false);
  }, [isOpen, initialEnsayoId, fallbackEnsayoId]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const confirmDiscardChanges = useCallback((callback) => {
    if (!hasUnsavedChanges) {
      callback();
      return;
    }

    alertify.confirm(
      'Cambios sin guardar',
      'Hay cambios sin guardar en este ensayo. ¿Deseas salir y perder esos cambios?',
      () => {
        setHasUnsavedChanges(false);
        callback();
      },
      () => {}
    );
  }, [hasUnsavedChanges]);

  const handleRequestClose = useCallback(() => {
    confirmDiscardChanges(() => {
      if (typeof onClose === 'function') {
        onClose();
      }
    });
  }, [confirmDiscardChanges, onClose]);

  const handleAssayTabChange = useCallback((nextEnsayoId) => {
    if (nextEnsayoId === activeEnsayoId) return;

    confirmDiscardChanges(() => {
      setActiveEnsayoId(nextEnsayoId);
    });
  }, [activeEnsayoId, confirmDiscardChanges]);

  if (!isOpen || !activeEnsayoId) {
    return null;
  }

  const activeEnsayo = normalizedEnsayos.find((ensayo) => ensayo.id === activeEnsayoId) || normalizedEnsayos[0] || null;
  const shouldShowTabs = showEnsayoTabs && normalizedEnsayos.length > 1;

  return createPortal(
    <div className="ensayo-detalle-modal-overlay" onClick={handleRequestClose}>
      <div className="ensayo-detalle-modal-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="ensayo-detalle-modal-topbar">
          <div className="ensayo-detalle-modal-topbar-copy">
            <span className="ensayo-detalle-modal-kicker">Ensayo</span>
            <h3>{activeEnsayo?.nombre_ensayo || activeEnsayo?.codigo_ensayo || 'Detalle de Ensayo'}</h3>
          </div>
          <button type="button" className="ensayo-detalle-modal-close" onClick={handleRequestClose} aria-label="Cerrar">
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
                onClick={() => handleAssayTabChange(ensayo.id)}
              >
                <span className="ensayo-detalle-assay-tab-label">{getEnsayoLabel(ensayo, index)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="ensayo-detalle-modal-body">
          <EnsayoDetallePanel
            ensayoId={activeEnsayoId}
            initialEnsayoDetails={activeEnsayo}
            modalMode
            onClose={handleRequestClose}
            onSaved={onSaved}
            onDirtyStateChange={setHasUnsavedChanges}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
