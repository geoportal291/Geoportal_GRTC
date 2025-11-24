import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import alertify from 'alertifyjs';
import './ensayos.css';
import './VistaGeneralEnsayos.css'; // Importar estilos para botones
import EnsayoFormulario from './EnsayoFormulario.jsx';
import VisorResultados from './secciones/VisorResultados.jsx';
import VisorGraficos from './secciones/VisorGraficos.jsx';
import { calcularResultados } from './ensayos.calculos.js';

Chart.register(...registerables);

export default function DetalleEnsayo() {
  const navigate = useNavigate();
  const { ensayoId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [resultsConfig, setResultsConfig] = useState(null);
  const [tableConfig, setTableConfig] = useState(null);
  const [calculationConfig, setCalculationConfig] = useState(null);
  const [graficosConfig, setGraficosConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [infoGeneral, setInfoGeneral] = useState({});
  const [tipoEnsayoId, setTipoEnsayoId] = useState(null);
  const [ensayoDetails, setEnsayoDetails] = useState(null);

  // TEMPORAL: Nueva configuración para probar el motor de granulometría
  const newCalculationConfig = {
    version: "2.0",
    vars: {
      pesoSecoTotal: "get(inputs.formData, 'granulometria.peso_total_muestra', 0)"
    },
    steps: [
      {
        type: "expression",
        output: "results.granulometria.sum_retenido",
        expression: "sum(values(get(inputs.formData, 'granulometria.tamices', {})))"
      },
      {
        type: 'loop',
        description: "Calcular retenido, acumulado y % pasa para cada tamiz",
        config: {
          items: "inputs.tableConfig.granulometria.rows",
          itemVar: "tamiz",
          indexVar: "i",
          actions: [
            {
              type: "expression",
              output: "vars.prev_retenido_acum",
              expression: "i > 0 ? get(results, 'granulometria.retenido_acum.' + inputs.tableConfig.granulometria.rows[i-1].key, 0) : 0"
            },
            {
              type: "expression",
              output: "results.granulometria.retenido_acum[tamiz.key]",
              expression: "vars.prev_retenido_acum + get(inputs.formData, 'granulometria.tamices.' + tamiz.key, 0)"
            },
            {
              type: "expression",
              output: "results.granulometria.pasa[tamiz.key]",
              expression: "(1 - get(results, 'granulometria.retenido_acum.' + tamiz.key, 0) / vars.pesoSecoTotal) * 100"
            }
          ]
        }
      },
      {
        type: 'expression',
        output: 'results.granulometria.pasa.fondo',
        expression: '0'
      },
      {
        type: 'expression',
        output: 'vars.puntosCurva',
        expression: "map(inputs.tableConfig.granulometria.rows, row => ({ mm: row.mm, pasa: get(results.granulometria.pasa, row.key, 0) }))"
      },
      ...[10, 30, 60].map(d => ({
        type: 'engine',
        config: {
          name: 'interpolate',
          inputs: {
            points: "vars.puntosCurva",
            targetX: d,
            xKey: "'pasa'",
            yKey: "'mm'",
            logScaleX: false
          },
          output: `results.granulometria.D${d}`
        }
      })),
      {
        type: 'expression',
        output: 'results.granulometria.coef_uniformidad',
        condition: "get(results, 'granulometria.D10') > 0",
        expression: "get(results, 'granulometria.D60', 0) / get(results, 'granulometria.D10', 1)"
      },
      {
        type: 'expression',
        output: 'results.granulometria.coef_curvatura',
        condition: "get(results, 'granulometria.D10') > 0 && get(results, 'granulometria.D60') > 0",
        expression: "(get(results, 'granulometria.D30', 0)^2) / (get(results, 'granulometria.D10', 1) * get(results, 'granulometria.D60', 1))"
      },
    ]
  };

  const [resultados, setResultados] = useState({});
  const [activeTab, setActiveTab] = useState('formulario');

  const API_URL = process.env.REACT_APP_API_BASE ?? '';

  // === FUNCIONES AUXILIARES ===

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

  const handleVolver = () => {
    const { parent_type, tramo_id, progresiva_id, cantera_id, estrato_id } = ensayoDetails || {};

    if (parent_type === 'progresiva' && tramo_id && progresiva_id && estrato_id) {
      navigate('/coordinador/recoleccion-datos/gestor-tramos', {
        state: {
          tramoId: tramo_id,
          progresivaId: progresiva_id,
          estratoId: estrato_id
        }
      });
    } else if (parent_type === 'cantera' && tramo_id && cantera_id && estrato_id) {
      navigate('/coordinador/recoleccion-datos/gestor-canteras', {
        state: {
          tramoId: tramo_id,
          canteraId: cantera_id,
          estratoId: estrato_id
        }
      });
    } else {
      navigate('/coordinador/recoleccion-datos');
    }
  };

  const handleGoToGeneral = () => {
    if (ensayoDetails?.tramo_id) {
      navigate(`/coordinador/suelos/tramos/${ensayoDetails.tramo_id}/ensayos-generales`);
    }
  };

  // === CARGA DE DATOS DEL ENSAYO ===
  useEffect(() => {
    const fetchEnsayoAndConfig = async () => {
      if (!ensayoId) {
        setError("ID de ensayo no proporcionado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers = getAuthHeaders();
        const response = await axios.get(`${API_URL}/api/ensayos/details/${ensayoId}`, { headers });
        const data = response.data;

        if (!data) throw new Error('Ensayo no encontrado');

        setEnsayoDetails(data);
        setFormData(data.datos_ensayo || {});

        if (data.parent_type === 'progresiva') {
            setInfoGeneral({
                proyecto: data.proyecto_nombre || 'N/A',
                tramo: data.tramo_nombre || 'N/A',
                progresiva: data.progresiva_codigo || 'N/A',
                estrato: data.estrato_orden !== undefined ? `${data.estrato_orden}` : 'N/A',
            });
        } else if (data.parent_type === 'cantera') {
            setInfoGeneral({
                proyecto: data.proyecto_nombre || 'N/A',
                tramo: data.tramo_nombre || 'N/A',
                cantera: data.cantera_codigo || 'N/A',
                estrato: data.estrato_orden !== undefined ? `${data.estrato_orden}` : 'N/A',
            });
        }
        
        setTipoEnsayoId(data.tipo_ensayo);

        // Cargar configuración del tipo de ensayo
        if (data.tipo_ensayo) {
          const configRes = await axios.get(`${API_URL}/api/config/ensayo-tipos/${data.tipo_ensayo}`, { headers });
          const cfg = configRes.data;
          setFormConfig(cfg.formConfig);
          setResultsConfig(cfg.resultsConfig);
          setTableConfig(cfg.tableConfig);
          setCalculationConfig(cfg.calculationConfig);
          setGraficosConfig(cfg.graficosConfig);
        }

      } catch (err) {
        console.error('Error al cargar ensayo:', err);
        alertify.error('No se pudo cargar el ensayo.');
        setError('Error al cargar los datos del ensayo.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnsayoAndConfig();
  }, [ensayoId, API_URL, getAuthHeaders]);

  // === TRANSFORMADORES DE DATOS ===
  const transformers = useMemo(() => ({
    anidar_por_prefijo: (formData, params) => {
      const { prefix, target_key } = params;
      const transformed = { ...formData, [target_key]: {} };
      for (const key in formData) {
        if (key.startsWith(prefix)) {
          const newKey = key.substring(prefix.length);
          transformed[target_key][newKey] = formData[key];
        }
      }
      return transformed;
    }
  }), []);

  // === CÁLCULO AUTOMÁTICO DE RESULTADOS ===
  useEffect(() => {
    const configToUse = tipoEnsayoId === 1 ? newCalculationConfig : calculationConfig;

    // Pre-validation: Do not run calculations if configs are missing or if formData is null/empty.
    if (!tableConfig || !configToUse || !formData || Object.keys(formData).length === 0) {
      setResultados({}); // Reset results if there's nothing to calculate
      return;
    }

    try {
      // FIX: Wrap the form data in the structure expected by the calculation formulas ('data.datos_formulario.*')
      const calculationContext = {
        formData: formData,
        tableConfig: tableConfig
      };

      const resultadosCalculados = calcularResultados(configToUse, calculationContext);
      setResultados(resultadosCalculados);
    } catch (err) {
      console.error('Error en el cálculo automático:', err);
      // Set an error state in the results to give feedback to the user
      setResultados({ error: 'Error en el cálculo. Verifique los datos de entrada.' });
    }
  }, [formData, tableConfig, calculationConfig, tipoEnsayoId]);

  // === ACTUALIZAR DATOS DEL FORMULARIO ===
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;

    const set = (obj, path, value) => {
      const keys = Array.isArray(path) ? path : path.split('.');
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined || current[keys[i]] === null) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return obj;
    };

    setFormData(prev => {
        const newState = JSON.parse(JSON.stringify(prev)); // Copia profunda para evitar mutación
        set(newState, name, val);
        return newState;
    });
  };

  // === GUARDAR ENSAYO ===
  const handleSaveEnsayo = async () => {
    console.log('[Debug] Nombre de ensayo al guardar:', ensayoDetails?.nombre_ensayo);
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const payload = {
        ...formData,
        nombre_ensayo: ensayoDetails?.nombre_ensayo, // <-- FIX: Preserve existing name
        tipo_ensayo_id: tipoEnsayoId,
        estrato_id: ensayoDetails?.estrato_id
      };
      await axios.put(`${API_URL}/api/ensayos/full-assay/${ensayoId}`, payload, { headers });
      alertify.success('Ensayo actualizado correctamente.');
    } catch (err) {
      console.error('Error al guardar el ensayo:', err);
      alertify.error('Error al guardar el ensayo.');
    } finally {
      setLoading(false);
    }
  };

  const getTabIndex = (tab) => (tab === 'resultados' ? 1 : tab === 'graficos' ? 2 : 0);

  const formatProgresiva = (codigo) => {
    if (!codigo) return 'N/A';
    const code = codigo.includes('-') ? codigo.split('-')[1] : codigo;
    if (code.length < 3) return code;
    const km = code.slice(0, -3);
    const m = code.slice(-3);
    return `${km}+${m}`;
  };

  // === INTERFAZ ===
  if (loading) return <div>Cargando ensayo...</div>;
  if (error)
    return (
      <div className="ensayos-layout-container error-container">
        <h3><i className="fas fa-exclamation-triangle"></i> Error</h3>
        <p>{error}</p>
        <button onClick={handleVolver} className="btn btn-primary">Volver</button>
      </div>
    );

  return (
    <div className="detalle-ensayo-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando ensayo...</p>
        </div>
      )}

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

      <div className="info-panels-row mb-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header"><i className="fas fa-info-circle me-1"></i> Información General</div>
            <div className="card-body">
              <p><strong>Proyecto:</strong> {infoGeneral.proyecto}</p>
              <p><strong>Tramo:</strong> {infoGeneral.tramo}</p>
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
              ) : (
                <p>Ubicación no disponible</p>
              )}
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
            <div className="tab-content-slider" style={{ transform: `translateX(-${getTabIndex(activeTab) * 100}%)` }}>
              <div className="tab-panel">
                {formConfig && (
                  <EnsayoFormulario
                    data={formData}
                    onInputChange={handleInputChange}
                    resultados={resultados}
                    formConfig={{
                      secciones: (formConfig?.secciones || []).filter(s => s.componente_key !== 'VisorGraficos')
                    }}
                    tableConfig={tableConfig}
                  />
                )}
              </div>
              <div className="tab-panel"><VisorResultados config={resultsConfig} data={resultados} /></div>
              <div className="tab-panel"><VisorGraficos graficosConfig={graficosConfig} resultados={resultados} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-grid mt-3 p-3">
        <button type="button" className="btn btn-success" onClick={handleSaveEnsayo}>
          <i className="fas fa-save me-1"></i> Actualizar Ensayo
        </button>
      </div>
    </div>
  );
}
