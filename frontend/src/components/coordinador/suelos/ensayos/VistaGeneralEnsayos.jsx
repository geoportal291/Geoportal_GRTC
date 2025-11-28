import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import alertify from 'alertifyjs';
import { useAuth } from '../../../../data/contexts/AuthContext';
import ResultadosBrevesModal from './ResultadosBrevesModal'; // Import new modal
import './VistaGeneralEnsayos.css';
import './ResultadosBrevesModal.css'; // Import new modal's CSS

// ========== ImportModal (No changes) ==========
const ImportModal = ({ isOpen, onClose, onImport, loading, errors }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  const handleImportClick = () => {
    if (selectedFile) onImport(selectedFile);
    else alertify.warning('Por favor, selecciona un archivo Excel.');
  };

  if (!isOpen) return null;

  return (
    <div className="import-modal-overlay">
      <div className="import-modal-content">
        <h2>Importar Ensayos desde Excel</h2>
        <input
          type="file"
          className="form-control"
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
        />
        {loading && (
          <div className="loading-spinner-modal">
            <div className="loading-spinner"></div>
            <p>Validando archivo, por favor espera...</p>
          </div>
        )}
        {errors.length > 0 && (
          <div className="import-errors">
            <h4>Errores de Validación</h4>
            <ul>
              {errors.map((error, i) => (
                <li key={i}>
                  <strong>Hoja:</strong> {error.sheet}, <strong>Fila:</strong>{' '}
                  {error.row || 'N/A'} - {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={handleImportClick}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Validando...' : 'Subir y Validar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== ConfirmationModal (No changes) ==========
const ConfirmationModal = ({ isOpen, onClose, onConfirm, summary, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="import-modal-overlay">
      <div className="import-modal-content">
        <h2>Confirmar Importación</h2>
        <p>Se han detectado los siguientes cambios:</p>
        <ul>
          <li>
            <strong>Ensayos a crear:</strong> {summary?.ensayosParaCrear || 0}
          </li>
          <li>
            <strong>Ensayos a actualizar:</strong>{' '}
            {summary?.ensayosParaActualizar || 0}
          </li>
        </ul>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Confirmando...' : 'Confirmar Importación'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== VistaGeneralEnsayos ==========
const VistaGeneralEnsayos = ({ setLastTramoId }) => {
  const { tramoId } = useParams();
  const navigate = useNavigate();
  const { API_URL, getAuthHeaders, selectedProjectId } = useAuth(); // Get all from context

  const [ensayosAgrupados, setEnsayosAgrupados] = useState({});
  const [tramo, setTramo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [fileToImport, setFileToImport] = useState(null);
  const [selectedEnsayos, setSelectedEnsayos] = useState(new Set());
  const [currentTargetType, setCurrentTargetType] = useState(null);
  const [isResultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedAssayForResults, setSelectedAssayForResults] = useState(null);
  
  const [tramosList, setTramosList] = useState([]);

  const fetchTramosList = useCallback(async () => {
    setLoading(true);
    try {
        const headers = getAuthHeaders();
        const url = selectedProjectId
            ? `${API_URL}/progresivas?selectedProjectId=${selectedProjectId}`
            : `${API_URL}/progresivas`;
        const res = await axios.get(url, { headers });
        setTramosList(res.data);
    } catch (err) {
        if (err.message !== 'Token no proporcionado') {
            alertify.error('No se pudieron cargar los tramos.');
        }
    } finally {
        setLoading(false);
    }
  }, [API_URL, getAuthHeaders, selectedProjectId]);

  const fetchEnsayos = useCallback(async () => {
    if (!tramoId) return;
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const tiposEnsayoResponse = await axios.get(`${API_URL}/api/tipos-ensayo`, { headers });
      const allTiposEnsayo = tiposEnsayoResponse.data;

      const ensayosResponse = await axios.get(`${API_URL}/api/tramos/${tramoId}/ensayos`, { headers });
      const data = ensayosResponse.data || {};
      const ensayosDelTramo = data.ensayos || data.ensayosList || [];
      const tramoInfo = data.tramo || data.tramoInfo || {};

      const ensayosAgrupadosPorTipo = ensayosDelTramo.reduce((acc, ensayo) => {
        const key = ensayo.config_key || ensayo.tipo_ensayo_id;
        if (!acc[key]) {
          acc[key] = {
            ensayos: [],
            tipoEnsayoId: ensayo.tipo_ensayo_id,
            descripcion: ensayo.tipo_ensayo_descripcion || 'Sin tipo',
            configKey: ensayo.config_key,
          };
        }
        acc[key].ensayos.push(ensayo);
        return acc;
      }, {});

      const finalEnsayosAgrupados = {};
      allTiposEnsayo.forEach(tipo => {
        const key = tipo.config_key || tipo.id;
        finalEnsayosAgrupados[key] = {
          ensayos: ensayosAgrupadosPorTipo[key]?.ensayos || [],
          tipoEnsayoId: tipo.id,
          descripcion: tipo.descripcion,
          configKey: tipo.config_key,
        };
      });

      setEnsayosAgrupados(finalEnsayosAgrupados);
      setTramo(tramoInfo);
    } catch (err) {
      console.error('Error al obtener ensayos o tipos de ensayo:', err);
      alertify.error('Error al cargar los ensayos o tipos de ensayo del tramo.');
    } finally {
      setLoading(false);
    }
  }, [API_URL, tramoId, getAuthHeaders]);

  // Effect 1: Fetch initial data (tramos or ensayos)
  useEffect(() => {
    if (tramoId) {
      fetchEnsayos();
      if (setLastTramoId) {
        setLastTramoId(tramoId);
      }
    } else {
      // Only fetch the list if it hasn't been fetched yet
      if (tramosList.length === 0) {
          fetchTramosList();
      }
    }
  }, [tramoId, fetchEnsayos, fetchTramosList, setLastTramoId, tramosList.length]);

  // Effect 2: Handle navigation after the tramos list is loaded
  useEffect(() => {
    // If there's no tramoId, the list has been loaded, it's not currently loading, and the list is not empty
    if (!tramoId && !loading && tramosList.length > 0) {
      // Navigate to the first tramo in the list
      navigate(`/coordinador/suelos/ensayos/tramos/${tramosList[0].id}`);
    }
  }, [tramoId, loading, tramosList, navigate]);

    const handleShowResults = (e, ensayo) => {
    e.stopPropagation();
    setSelectedAssayForResults(ensayo);
    setResultsModalOpen(true);
  };

  // All other handler functions (handleSelectEnsayo, handleBulkDelete, etc.) remain the same
  const handleSelectEnsayo = useCallback((ensayoId) => {
    setSelectedEnsayos(prevSelected => {
      const newSelection = new Set(prevSelected);
      if (newSelection.has(ensayoId)) {
        newSelection.delete(ensayoId);
      } else {
        newSelection.add(ensayoId);
      }
      return newSelection;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    const idsToDelete = Array.from(selectedEnsayos);
    alertify.confirm(
        'Confirmar Eliminación Múltiple',
        `¿Estás seguro de que quieres eliminar ${idsToDelete.length} ensayos seleccionados? Esta acción no se puede deshacer.`,
        async () => {
            try {
                const headers = getAuthHeaders();
                await axios.post(`${API_URL}/api/ensayos/bulk-delete`, { ids: idsToDelete }, { headers });
                alertify.success(`${idsToDelete.length} ensayos eliminados correctamente.`);
                setSelectedEnsayos(new Set());
                fetchEnsayos();
            } catch (err) {
                console.error('Error en la eliminación múltiple:', err);
                alertify.error(err.response?.data?.error || 'Error al eliminar los ensayos.');
            }
        },
        () => {
            alertify.error('Eliminación cancelada.');
        }
    );
  }, [selectedEnsayos, API_URL, getAuthHeaders, fetchEnsayos]);

  const handleExportToExcel = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/tramos/${tramoId}/ensayos/export-excel`, {
        headers,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ensayos_tramo_${tramoId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alertify.success('Archivo Excel con todos los ensayos exportado correctamente.');
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      alertify.error('Error al exportar el archivo Excel.');
    }
  }, [API_URL, tramoId, getAuthHeaders]);

  const handleSpecificExport = useCallback(async (tipoEnsayoId, descripcion) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/tramos/${tramoId}/ensayos/export-excel/${tipoEnsayoId}`, {
        headers,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ensayos_${descripcion.replace(/ /g, '_')}_tramo_${tramoId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alertify.success(`Ensayos de ${descripcion} exportados correctamente.`);
    } catch (err) {
      console.error('Error al exportar Excel específico:', err);
      alertify.error(err.response?.data?.message || `Error al exportar ensayos de ${descripcion}.`);
    }
  }, [API_URL, tramoId, getAuthHeaders]);

  const openImportModal = (configKey) => {
    setCurrentTargetType(configKey);
    setImportModalOpen(true);
  };

  const executeImport = useCallback(async (file, isSimulation) => {
    const allEnsayos = Object.values(ensayosAgrupados).flatMap(g => g.ensayos);
    const proyectoId = allEnsayos.length > 0 ? allEnsayos[0].proyecto_id : null;
    if (!proyectoId) {
      alertify.error("No se pudo determinar el proyecto.");
      throw new Error("Proyecto no determinado.");
    }
    setImporting(true);
    setImportErrors([]);
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_URL}/api/proyectos/${proyectoId}/tramos/${tramoId}/ensayos/importar`;
    const params = { isSimulation, tipoEnsayoKey: currentTargetType };

    try {
      const headers = getAuthHeaders();
      const response = await axios.post(url, formData, { 
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }, 
        params 
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 400 && err.response.data.validationErrors) {
        setImportErrors(err.response.data.validationErrors);
        alertify.error('Se encontraron errores de validación en el archivo.');
      } else {
        console.error('Error al importar archivo:', err);
        alertify.error(err.response?.data?.error || 'Ocurrió un error durante la importación.');
      }
      throw err;
    } finally {
      setImporting(false);
    }
  }, [API_URL, tramoId, ensayosAgrupados, getAuthHeaders, currentTargetType]);

  const handleImportSimulation = useCallback(async (file) => {
    try {
      const data = await executeImport(file, true);
      setFileToImport(file);
      if (data.summary?.ensayosParaCrear > 0 || data.summary?.ensayosParaActualizar > 0) {
        setImportSummary(data.summary);
        setShowConfirmationModal(true);
      } else {
        alertify.warning('No se encontraron ensayos nuevos ni para actualizar en la hoja correspondiente del archivo.');
        setImportModalOpen(false);
      }
    } catch {}
  }, [executeImport]);

  const handleConfirmImport = useCallback(async () => {
    try {
      const data = await executeImport(fileToImport, false);
      alertify.success(data.message);
      setImportModalOpen(false);
      setShowConfirmationModal(false);
      setFileToImport(null);
      setImportSummary(null);
      setCurrentTargetType(null);
      fetchEnsayos();
    } catch {}
  }, [executeImport, fileToImport, fetchEnsayos]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // NEW: Render logic for when no tramoId is selected
  if (!tramoId) {
    return (
      <div className="vista-general-ensayos-container">
        <header className="vista-general-header">
          <h1>Seleccione un Tramo</h1>
        </header>
        <main className="tramos-list-container">
          {tramosList.length > 0 ? (
            <ul className="tramos-selection-list">
              {tramosList.map(t => (
                <li key={t.id}>
                  <Link to={`/coordinador/suelos/ensayos/tramos/${t.id}`}>
                    <i className="fas fa-road"></i>
                    <span>{t.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No se encontraron tramos.</p>
          )}
        </main>
      </div>
    );
  }

  // Original render logic for when a tramoId IS selected
  return (
    <>
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportSimulation}
        loading={importing}
        errors={importErrors}
      />
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmImport}
        summary={importSummary}
        loading={importing}
      />
      {isResultsModalOpen && (
        <ResultadosBrevesModal 
          ensayo={selectedAssayForResults} 
          onClose={() => setResultsModalOpen(false)} 
        />
      )}
      <div className="vista-general-ensayos-container">
        <header className="vista-general-header">
          <h1>Resumen de Ensayos: <span className="tramo-name">{tramo?.nombre || 'Cargando...'}</span></h1>
          <div>
            {selectedEnsayos.size > 0 ? (
              <button onClick={handleBulkDelete} className="btn btn-danger btn-expandable">
                <i className="fas fa-trash-alt"></i>
                <span className="btn-text">Eliminar ({selectedEnsayos.size})</span>
              </button>
            ) : (
              <>
                <button onClick={() => openImportModal(null)} className="btn btn-primary btn-expandable">
                  <i className="fas fa-file-import"></i>
                  <span className="btn-text">Importar Todo</span>
                </button>
                <button onClick={handleExportToExcel} className="btn btn-success btn-expandable">
                  <i className="fas fa-file-excel"></i>
                  <span className="btn-text">Exportar Todo</span>
                </button>
              </>
            )}
            <button onClick={() => navigate('/coordinador/suelos/ensayos/tramos')} className="btn btn-outline btn-expandable">
              <i className="fas fa-arrow-left"></i>
              <span className="btn-text">Volver a Tramos</span>
            </button>
          </div>
        </header>

        <main className="ensayos-grid">
          {Object.keys(ensayosAgrupados).length > 0 ? (
            Object.entries(ensayosAgrupados).map(([key, grupo]) => {
              return (
              <div className="card-ensayo-tipo" key={key}>
                <div className="card-header">
                  <h2>{grupo.descripcion}</h2>
                  <div className="header-actions">
                    <button onClick={() => openImportModal(grupo.configKey)} className="btn btn-primary btn-sm btn-expandable">
                      <i className="fas fa-file-import"></i>
                      <span className="btn-text">Importar</span>
                    </button>
                    <button onClick={() => handleSpecificExport(grupo.tipoEnsayoId, grupo.descripcion)} className="btn btn-success btn-sm btn-expandable">
                      <i className="fas fa-file-excel"></i>
                      <span className="btn-text">Exportar</span>
                    </button>
                    <span className="ensayo-count-badge">{grupo.ensayos.length} Ensayos</span>
                  </div>
                </div>
                <div className="card-content">
                  {grupo.ensayos.length > 0 ? (
                    grupo.ensayos.map(ensayo => (
                        <div 
                        className="mini-card-ensayo"
                        key={ensayo.id}
                        onClick={() => navigate(`/coordinador/suelos/ensayos/${ensayo.id}`)}
                      >
                        
                        <div className="mini-card-info-main">
                            <div className="mini-card-title">
                              <i className="fas fa-vial"></i>
                              <span>{ensayo.nombre_ensayo || ensayo.codigo_ensayo}</span>
                            </div>
                            <div className="mini-card-location-details">
                              <span><i className="fas fa-road"></i> {ensayo.progresiva_nombre || 'N/A'}</span>
                              <span><i className="fas fa-layer-group"></i> E: {ensayo.estrato_orden || 'N/A'}</span>
                              <span><i calssName="fas fa-map-marker-alt"></i> {ensayo.progresiva_descripcion || 'N/A'}</span>
                            </div>
                            <div className="mini-card-actions">
                              <button 
                                className="btn-results" 
                                title="Ver Resultados Breves"
                                onClick={(e) => handleShowResults(e, ensayo)}
                              >
                                <i className="fas fa-poll-h"></i>
                              </button>
                            </div>
                            <div className="mini-card-action-indicator">
                              <i className="fas fa-chevron-right"></i>
                            </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-ensayos-message">No hay ensayos de este tipo para este tramo.</p>
                  )}
                </div>
              </div>
              );
            })
          ) : (
            <p>No se encontraron tipos de ensayo configurados.</p>
          )}
        </main>
      </div>
    </>
  );
};

export default VistaGeneralEnsayos;