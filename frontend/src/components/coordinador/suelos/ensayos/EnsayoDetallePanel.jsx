import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import alertify from 'alertifyjs';
import './ensayos.css';
import './VistaGeneralEnsayos.css';
import EnsayoFormulario from './EnsayoFormulario.jsx';
import VisorResultados from './secciones/VisorResultados.jsx';
import VisorGraficos from './secciones/VisorGraficos.jsx';
import { calcularResultados } from './ensayos.calculos.js';

Chart.register(...registerables);

const stripGeneralFieldDefaults = (currentTableConfig) => {
  if (!currentTableConfig?.general_fields?.length) return currentTableConfig;

  return {
    ...currentTableConfig,
    general_fields: currentTableConfig.general_fields.map(({ defaultValue, ...field }) => field)
  };
};

const normalizeEnsayoConfig = (cfg) => {
  if (!cfg || typeof cfg !== 'object') return cfg;

  let tableConfig = cfg.tableConfig;

  if (cfg.config_key === 'proctor') {
    tableConfig = stripGeneralFieldDefaults(tableConfig);
  }

  return {
    ...cfg,
    tableConfig,
    formConfig: tableConfig,
    calculationConfig: cfg.calculationConfig
  };
};

const formatProgresiva = (codigo) => {
  if (!codigo) return 'N/A';
  const code = codigo.includes('-') ? codigo.split('-')[1] : codigo;
  return code.length < 3 ? code : `${code.slice(0, -3)}+${code.slice(-3)}`;
};

export default function EnsayoDetallePanel({
  ensayoId,
  initialEnsayoDetails = null,
  modalMode = false,
  onClose = null,
  onSaved = null
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [resultsConfig, setResultsConfig] = useState(null);
  const [tableConfig, setTableConfig] = useState(null);
  const [calculationConfig, setCalculationConfig] = useState(null);
  const [graficosConfig, setGraficosConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [resultados, setResultados] = useState({});
  const [infoGeneral, setInfoGeneral] = useState({});
  const [ensayoDetails, setEnsayoDetails] = useState(initialEnsayoDetails);
  const [activeTab, setActiveTab] = useState('formulario');

  const API_URL = process.env.REACT_APP_API_BASE ?? '';

  const applyGeneralFieldDefaults = useCallback((currentData, currentTableConfig) => {
    if (!currentTableConfig?.general_fields?.length) return currentData;

    const nextData = JSON.parse(JSON.stringify(currentData || {}));
    if (!nextData.general_fields || typeof nextData.general_fields !== 'object') {
      nextData.general_fields = {};
    }

    currentTableConfig.general_fields.forEach((field) => {
      const hasValue = nextData.general_fields[field.key] !== undefined
        && nextData.general_fields[field.key] !== null
        && nextData.general_fields[field.key] !== '';

      if (!hasValue && field.defaultValue !== undefined) {
        nextData.general_fields[field.key] = field.defaultValue;
      }
    });

    return nextData;
  }, []);

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

  const handleVolver = useCallback(() => {
    const { parent_type, tramo_id, progresiva_id, cantera_id, estrato_id } = ensayoDetails || {};
    if (parent_type === 'progresiva' && tramo_id && progresiva_id && estrato_id) {
      navigate('/coordinador/recoleccion-datos/gestor-tramos', { state: { tramoId: tramo_id, progresivaId: progresiva_id, estratoId: estrato_id } });
    } else if (parent_type === 'cantera' && tramo_id && cantera_id && estrato_id) {
      navigate('/coordinador/recoleccion-datos/gestor-canteras', { state: { tramoId: tramo_id, canteraId: cantera_id, estratoId: estrato_id } });
    } else {
      navigate('/coordinador/recoleccion-datos');
    }
  }, [ensayoDetails, navigate]);

  const handleGoToGeneral = useCallback(() => {
    if (ensayoDetails?.tramo_id) {
      navigate(`/coordinador/suelos/tramos/${ensayoDetails.tramo_id}/ensayos-generales`);
    }
  }, [ensayoDetails, navigate]);

  useEffect(() => {
    let ignore = false;

    const fetchEnsayoAndConfig = async () => {
      if (!ensayoId) {
        setError('ID de ensayo no proporcionado.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setActiveTab('formulario');
        const headers = getAuthHeaders();
        const response = await axios.get(`${API_URL}/api/ensayos/details/${ensayoId}?_=${new Date().getTime()}`, { headers });
        const data = response.data;
        if (!data) throw new Error('Ensayo no encontrado');
        if (ignore) return;

        setEnsayoDetails(data);

        let formDataObject = data.datos_ensayo || {};
        if (typeof formDataObject === 'string') {
          try {
            formDataObject = JSON.parse(formDataObject);
          } catch (e) {
            formDataObject = {};
          }
        }
        setFormData(formDataObject);

        if (data.parent_type === 'progresiva') {
          setInfoGeneral({ proyecto: data.proyecto_nombre, tramo: data.tramo_nombre, progresiva: data.progresiva_codigo, estrato: data.estrato_orden });
        } else if (data.parent_type === 'cantera') {
          setInfoGeneral({ proyecto: data.proyecto_nombre, tramo: data.tramo_nombre, cantera: data.cantera_codigo, estrato: data.estrato_orden });
        } else {
          setInfoGeneral({});
        }

        if (data.tipo_ensayo) {
          const configRes = await axios.get(`${API_URL}/api/config/ensayo-tipos/${data.tipo_ensayo}`, { headers });
          if (ignore) return;
          const cfg = normalizeEnsayoConfig(configRes.data);
          setFormConfig(cfg.formConfig);
          setResultsConfig(cfg.resultsConfig);
          setTableConfig(cfg.tableConfig);
          setCalculationConfig(cfg.calculationConfig);
          setGraficosConfig(cfg.graficosConfig);
          setFormData(prev => applyGeneralFieldDefaults(prev, cfg.tableConfig));
        }
      } catch (err) {
        if (!ignore) {
          setError('Error al cargar los datos del ensayo.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchEnsayoAndConfig();

    return () => {
      ignore = true;
    };
  }, [ensayoId, API_URL, getAuthHeaders, applyGeneralFieldDefaults]);

  useEffect(() => {
    if (!tableConfig?.general_fields?.length) return;
    setFormData(prev => applyGeneralFieldDefaults(prev, tableConfig));
  }, [tableConfig, applyGeneralFieldDefaults]);

  useEffect(() => {
    if (!calculationConfig || !formData || Object.keys(formData).length === 0) {
      setResultados({});
      return;
    }

    try {
      const resultadosCalculados = calcularResultados(calculationConfig, formData);
      setResultados(resultadosCalculados);
    } catch (err) {
      console.error('Error en el cálculo automático:', err);
      setResultados({ error: 'Error en el cálculo.' });
    }
  }, [formData, calculationConfig]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;

    const set = (obj, path, nextValue) => {
      const keys = path.split('.');
      let current = obj;
      for (let i = 0; i < keys.length - 1; i += 1) {
        if (current[keys[i]] === undefined || current[keys[i]] === null) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = nextValue;
      return obj;
    };

    setFormData(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      set(newState, name, val);
      return newState;
    });
  };

  const handleSaveEnsayo = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const payload = {
        datos_ensayo: formData,
        resultado: resultados,
        estrato_id: ensayoDetails?.estrato_id,
        nombre_ensayo: ensayoDetails?.nombre_ensayo,
        tipo_ensayo_id: ensayoDetails?.tipo_ensayo
      };

      await axios.put(`${API_URL}/api/ensayos/full-assay/${ensayoId}`, payload, { headers });
      alertify.success('Ensayo actualizado correctamente.');

      if (typeof onSaved === 'function') {
        onSaved();
      }
    } catch (err) {
      console.error('Error al guardar el ensayo:', err);
      alertify.error('Error al guardar el ensayo. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="ensayo-detail-loading">Cargando ensayo...</div>;

  if (error) {
    return (
      <div className="ensayos-layout-container error-container">
        <h3><i className="fas fa-exclamation-triangle"></i> Error</h3>
        <p>{error}</p>
        {!modalMode && (
          <button onClick={handleVolver} className="btn btn-primary">Volver</button>
        )}
      </div>
    );
  }

  return (
    <div className={`detalle-ensayo-container ${modalMode ? 'detalle-ensayo-container-modal' : ''}`}>
      {!modalMode && (
        <div className="ensayo-header-actions">
          <button onClick={handleVolver} className="btn btn-secondary btn-expandable">
            <i className="fas fa-arrow-left"></i>
            <span className="btn-text">Volver</span>
          </button>
          <button onClick={handleGoToGeneral} className="btn btn-info btn-expandable">
            <i className="fas fa-vials"></i>
            <span className="btn-text">Ensayos Generales</span>
          </button>
          <h2 className="ensayo-title">Detalles del Ensayo: {ensayoDetails?.nombre_ensayo}</h2>
        </div>
      )}

      {modalMode && (
        <div className="ensayo-modal-inline-header">
          <div className="ensayo-modal-inline-title-group">
            <h2 className="ensayo-title">{ensayoDetails?.nombre_ensayo}</h2>
            <span className="ensayo-modal-inline-subtitle">
              {ensayoDetails?.tipo_ensayo_descripcion || ensayoDetails?.tipo_ensayo_nombre || 'Ensayo'}
            </span>
          </div>
          <div className="ensayo-modal-inline-actions">
            {ensayoDetails?.tramo_id && (
              <button onClick={handleGoToGeneral} className="btn btn-info btn-sm">
                <i className="fas fa-vials"></i> Ensayos Generales
              </button>
            )}
            {typeof onClose === 'function' && (
              <button onClick={onClose} className="btn btn-secondary btn-sm">
                <i className="fas fa-times"></i> Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="info-panels-row mb-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header"><i className="fas fa-info-circle me-1"></i> Información General</div>
            <div className="card-body">
              <p><strong>Proyecto:</strong> {infoGeneral.proyecto || 'N/A'}</p>
              <p><strong>Tramo:</strong> {infoGeneral.tramo || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header"><i className="fas fa-map-marker-alt me-1"></i> Ubicación</div>
            <div className="card-body">
              {ensayoDetails?.parent_type === 'progresiva' ? (
                <>
                  <p><strong>Progresiva:</strong> {formatProgresiva(infoGeneral.progresiva)}</p>
                  <p><strong>Estrato:</strong> {infoGeneral.estrato}</p>
                </>
              ) : ensayoDetails?.parent_type === 'cantera' ? (
                <>
                  <p><strong>Cantera:</strong> {infoGeneral.cantera}</p>
                  <p><strong>Estrato:</strong> {infoGeneral.estrato}</p>
                </>
              ) : <p>Ubicación no disponible</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item"><button className={`nav-link ${activeTab === 'formulario' ? 'active' : ''}`} onClick={() => setActiveTab('formulario')}>Formulario</button></li>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'resultados' ? 'active' : ''}`} onClick={() => setActiveTab('resultados')}>Resultados</button></li>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'graficos' ? 'active' : ''}`} onClick={() => setActiveTab('graficos')}>Gráficos</button></li>
          </ul>
        </div>
        <div className="card-body">
          <div className="tab-content-container">
            <div className="tab-content-slider" style={{ transform: `translateX(-${activeTab === 'resultados' ? 100 : activeTab === 'graficos' ? 200 : 0}%)` }}>
              <div className="tab-panel">
                {formConfig && (
                  <EnsayoFormulario
                    data={formData}
                    onInputChange={handleInputChange}
                    resultados={resultados}
                    formConfig={formConfig}
                    tableConfig={tableConfig}
                  />
                )}
              </div>
              <div className="tab-panel"><VisorResultados config={resultsConfig} data={resultados} /></div>
              <div className="tab-panel">
                <VisorGraficos
                  graficosConfig={graficosConfig}
                  resultados={resultados}
                  formData={formData}
                  tableConfig={tableConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`d-grid mt-3 ${modalMode ? 'p-0' : 'p-3'}`}>
        <button type="button" className="btn btn-success" onClick={handleSaveEnsayo}>
          <i className="fas fa-save me-1"></i> Actualizar Ensayo
        </button>
      </div>
    </div>
  );
}
