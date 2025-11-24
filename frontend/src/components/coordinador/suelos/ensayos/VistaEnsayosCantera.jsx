import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import alertify from 'alertifyjs';
import './VistaGeneralEnsayos.css'; // Re-use the same CSS

const VistaEnsayosCantera = () => {
  const navigate = useNavigate();
  const [ensayosAgrupados, setEnsayosAgrupados] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEnsayos, setSelectedEnsayos] = useState(new Set());
  
  const API_URL = process.env.REACT_APP_API_BASE || '';

  const getAuthHeaders = useCallback(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = userData?.token;
    if (!token) {
      alertify.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
      navigate('/login');
      throw new Error('Token no proporcionado');
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  const fetchCanteraEnsayos = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // 1. Fetch all assay types
      const tiposEnsayoResponse = await axios.get(`${API_URL}/api/tipos-ensayo`, { headers });
      const allTiposEnsayo = tiposEnsayoResponse.data;

      // 2. Fetch all assays from canteras
      const ensayosResponse = await axios.get(`${API_URL}/api/ensayos/canteras`, { headers });
      const ensayosDeCanteras = ensayosResponse.data || [];

      // Group assays by config_key or tipoEnsayoId
      const ensayosAgrupadosPorTipo = ensayosDeCanteras.reduce((acc, ensayo) => {
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

      // Create a final grouped structure including all assay types
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
    } catch (err) {
      console.error('Error al obtener ensayos de canteras:', err);
      alertify.error('Error al cargar los ensayos de canteras.');
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders]);

  useEffect(() => {
    fetchCanteraEnsayos();
  }, [fetchCanteraEnsayos]);

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
                fetchCanteraEnsayos();
            } catch (err) {
                console.error('Error en la eliminación múltiple:', err);
                alertify.error(err.response?.data?.error || 'Error al eliminar los ensayos.');
            }
        },
        () => {
            alertify.error('Eliminación cancelada.');
        }
    );
  }, [selectedEnsayos, API_URL, getAuthHeaders, fetchCanteraEnsayos]);


  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Cargando Resumen de Ensayos de Canteras...</p>
      </div>
    );
  }

  return (
    <div className="vista-general-ensayos-container">
      <header className="vista-general-header">
        <h1>Resumen de Ensayos: <span className="tramo-name">Canteras</span></h1>
        <div>
          {selectedEnsayos.size > 0 && (
            <button onClick={handleBulkDelete} className="btn btn-danger btn-expandable">
              <i className="fas fa-trash-alt"></i>
              <span className="btn-text">Eliminar ({selectedEnsayos.size})</span>
            </button>
          )}
          {/* Import/Export buttons can be added later with cantera-specific endpoints */}
        </div>
      </header>

      <main className="ensayos-grid">
        {Object.keys(ensayosAgrupados).length > 0 ? (
          Object.entries(ensayosAgrupados).map(([key, grupo]) => (
            <div className="card-ensayo-tipo" key={key}>
              <div className="card-header">
                <h2>{grupo.descripcion}</h2>
                <div className="header-actions">
                  <span className="ensayo-count-badge">{grupo.ensayos.length} Ensayos</span>
                </div>
              </div>
              <div className="card-content">
                {grupo.ensayos.length > 0 ? (
                  grupo.ensayos.map(ensayo => (
                    <div className={`mini-card-ensayo ${selectedEnsayos.has(ensayo.id) ? 'selected' : ''}`} key={ensayo.id}>
                      <div className="selection-checkbox">
                        <input 
                          type="checkbox"
                          checked={selectedEnsayos.has(ensayo.id)}
                          onChange={() => handleSelectEnsayo(ensayo.id)}
                        />
                      </div>
                      <div className="mini-card-title">
                        <i className="fas fa-vial"></i>
                        <span>{ensayo.nombre_ensayo || ensayo.codigo_ensayo}</span>
                      </div>
                      <div className="mini-card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/coordinador/suelos/ensayos/${ensayo.id}`)}>Ver Detalles</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-ensayos-message">No hay ensayos de este tipo para canteras.</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No se encontraron tipos de ensayo configurados.</p>
        )}
      </main>
    </div>
  );
};

export default VistaEnsayosCantera;