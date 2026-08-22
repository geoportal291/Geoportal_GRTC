import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import alertify from 'alertifyjs';
import './SeleccionarEstratosModal.css';
import { getTiposDeEnsayo } from '@/api/ensayosAPI'; // Import the new API function
import AssayTypeSelector from './AssayTypeSelector'; // Import the new AssayTypeSelector component
import { cn } from '@/lib/utils';

const SeleccionarEstratosModal = ({ isOpen, onClose, data, onConfirm }) => {
  const [selectedEstratos, setSelectedEstratos] = useState({});
  const [tiposDeEnsayoOptions, setTiposDeEnsayoOptions] = useState([]);
  const [selectedTiposDeEnsayo, setSelectedTiposDeEnsayo] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset states on open
      setSelectedEstratos({});
      setSelectedTiposDeEnsayo([]);

      const fetchTipos = async () => {
        setIsLoading(true);
        try {
          const data = await getTiposDeEnsayo();
          const options = data.map(tipo => ({ value: tipo.id, label: tipo.descripcion }));
          setTiposDeEnsayoOptions(options);
        } catch (error) {
          alertify.error('Error al cargar los tipos de ensayo.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTipos();
    }
  }, [isOpen]);

  const allEstratosKeys = useMemo(() => {
    if (!data || !data.reconstructedSubProgresivas) return [];
    const keys = [];
    data.reconstructedSubProgresivas.forEach(progresiva => {
      if (progresiva.estratos_perfil) {
        progresiva.estratos_perfil.forEach((_, estratoIndex) => {
          keys.push(`${progresiva.codigo}-${estratoIndex}`);
        });
      }
    });
    return keys;
  }, [data]);

  const allSelected = allEstratosKeys.length > 0 && allEstratosKeys.every(key => selectedEstratos[key]);

  const handleSelectToggleAll = () => {
    if (allSelected) {
      setSelectedEstratos({});
    } else {
      const newSelected = {};
      allEstratosKeys.forEach(key => {
        newSelected[key] = true;
      });
      setSelectedEstratos(newSelected);
    }
  };

  const handleToggleEstrato = (progresivaCodigo, estratoIndex) => {
    const key = `${progresivaCodigo}-${estratoIndex}`;
    setSelectedEstratos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCancel = () => {
    alertify.confirm(
      'Cancelar Importación',
      '¿Está seguro de que desea cancelar la importación?',
      () => {
        onClose();
        alertify.message('Importación cancelada.');
      },
      () => {
        // User clicked 'No', do nothing.
      }
    ).set('labels', { ok: 'Sí', cancel: 'No' });
  };

  const handleConfirmClick = () => {
    const seleccionEstratos = Object.keys(selectedEstratos).filter(key => selectedEstratos[key]);
    const seleccionEnsayoIds = selectedTiposDeEnsayo.map(tipo => tipo.value);

    if (seleccionEstratos.length > 0 && seleccionEnsayoIds.length === 0) {
      alertify.error('Por favor, seleccione al menos un tipo de ensayo para crear.');
      return;
    }

    if (seleccionEstratos.length === 0) {
      alertify.confirm(
        'Sin Selección de Estratos',
        'No ha seleccionado ningún estrato. ¿Desea continuar con la importación de todas formas (sin crear ensayos)?',
        () => onConfirm([], []),
        () => alertify.message('Operación cancelada.')
      ).set('labels', { ok: 'Sí, continuar', cancel: 'No, volver' });
    } else {
      onConfirm(seleccionEstratos, seleccionEnsayoIds);
    }
  };

  const maxEstratos = useMemo(() => {
    if (!data || !data.reconstructedSubProgresivas) return 0;
    return Math.max(0, ...data.reconstructedSubProgresivas.map(p => p.estratos_perfil?.length || 0));
  }, [data]);

  if (!isOpen || !data) return null;

  const { reconstructedSubProgresivas = [] } = data;

  return ReactDOM.createPortal(
    <div className="overlay" onClick={handleCancel}>
      <div className="seleccionar-estratos-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="progresivas-form">
          <h3>Selección para Creación Automática de Ensayos</h3>

          <div className="modal-scroll-content">
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ marginBottom: '8px', display: 'block' }}>1. Seleccione los tipos de ensayo a crear</label>
              {isLoading ? (
                <p>Cargando tipos de ensayo...</p>
              ) : (
                <AssayTypeSelector
                  options={tiposDeEnsayoOptions}
                  selected={selectedTiposDeEnsayo}
                  onChange={setSelectedTiposDeEnsayo}
                />
              )}
            </div>

            <div className="form-group">
              <label style={{ marginBottom: '8px', display: 'block' }}>2. Seleccione los estratos donde se crearán los ensayos</label>

              {selectedTiposDeEnsayo.length === 0 && (
                <p className="text-sm text-red-500 mb-2 font-semibold">
                  ↑ Primero seleccione al menos un tipo de ensayo para habilitar esta sección.
                </p>
              )}

              <div className={cn(selectedTiposDeEnsayo.length === 0 && "opacity-50 pointer-events-none")}>
                <div className="modal-toolbar">
                  <button type="button" className="btn-secondary" onClick={handleSelectToggleAll}>
                    {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                  </button>
                </div>
                <div className="estratos-selection-container excel-table-container">
                  {reconstructedSubProgresivas.length > 0 ? (
                    <table className="excel-style-table">
                      <thead>
                        <tr>
                          <th className="progresiva-column">Progresiva</th>
                          {[...Array(maxEstratos)].map((_, i) => (
                            <th key={i}>Estrato {i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reconstructedSubProgresivas.map((progresiva, progIndex) => (
                          <tr key={progIndex}>
                            <td className="progresiva-column">{progresiva.nombre}</td>
                            {[...Array(maxEstratos)].map((_, estratoIndex) => {
                              const estrato = progresiva.estratos_perfil?.[estratoIndex];
                              if (!estrato) {
                                return <td key={estratoIndex} className="empty-cell"></td>;
                              }
                              const key = `${progresiva.codigo}-${estratoIndex}`;
                              const isSelected = !!selectedEstratos[key];
                              return (
                                <td
                                  key={estratoIndex}
                                  className={`estrato-cell ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleToggleEstrato(progresiva.codigo, estratoIndex)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleEstrato(progresiva.codigo, estratoIndex)}
                                    className="estrato-checkbox"
                                  />
                                  <div className="estrato-cell-info">
                                    <span>{estrato.descripcion}</span>
                                    <small>({estrato.profundidad_inicial}m - {estrato.profundidad_final}m)</small>
                                    {estrato.nlp_clasificacion_sucs && (
                                      <span style={{
                                        backgroundColor: estrato.nlp_color_hex || '#CCC',
                                        color: '#fff',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        marginTop: '4px',
                                        display: 'inline-block',
                                        textShadow: '0px 0px 2px rgba(0,0,0,0.8)'
                                      }}>
                                        {estrato.nlp_clasificacion_sucs}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>El archivo no contiene progresivas con estratos definidos.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="close-btn" onClick={handleCancel}>Cancelar</button>
            <button type="button" className="submit-btn" onClick={handleConfirmClick}>
              {`Confirmar e Importar`}
            </button>
          </div>        </div>
      </div>
    </div>,
    document.body
  );
};

export default SeleccionarEstratosModal;
