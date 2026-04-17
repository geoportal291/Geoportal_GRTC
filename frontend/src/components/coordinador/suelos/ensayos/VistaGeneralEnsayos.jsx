import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import alertify from 'alertifyjs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../../../data/contexts/AuthContext';
import ResultadosBrevesModal from './ResultadosBrevesModal';
import './VistaGeneralEnsayos.css';
import './ResultadosBrevesModal.css';

// ========== ImportModal ==========
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
        <h2>Importar Ensayos</h2>
        <input type="file" className="form-control" accept=".xlsx" onChange={handleFileChange} />
        {loading && <div className="loading-spinner-modal"><div className="loading-spinner"></div><p>Validando...</p></div>}
        {errors.length > 0 && (
          <div className="import-errors">
            {errors.map((err, i) => <div key={i}>Hoja: {err.sheet} - {err.error}</div>)}
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>Cancelar</button>
          <button onClick={handleImportClick} className="btn btn-primary" disabled={loading}>Validar y Subir</button>
        </div>
      </div>
    </div>
  );
};

// ========== ConfirmationModal ==========
const ConfirmationModal = ({ isOpen, onClose, onConfirm, summary, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="import-modal-overlay">
      <div className="import-modal-content">
        <h2>Confirmar Cambios</h2>
        <ul>
          <li>Crear: {summary?.ensayosParaCrear || 0}</li>
          <li>Actualizar: {summary?.ensayosParaActualizar || 0}</li>
        </ul>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline">Cancelar</button>
          <button onClick={onConfirm} className="btn btn-primary" disabled={loading}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

// ========== EnsayosFullListModal ==========
const EnsayosFullListModal = ({ isOpen, onClose, grupo, navigate, handleShowResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  if (!isOpen || !grupo) return null;
  const filtered = grupo.ensayos.filter(e => `${e.nombre_ensayo} ${e.codigo_ensayo} ${e.progresiva_nombre}`.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="full-list-modal-overlay" onClick={onClose}>
      <div className="full-list-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="full-list-modal-header">
          <h2><i className="fas fa-list-ul"></i> {grupo.descripcion}</h2>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-search-bar">
          <input type="text" className="modal-search-input" placeholder="🔍 Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
        </div>
        <div className="full-list-modal-body">
          <table className="compact-table">
            <thead>
              <tr><th>Código</th><th>Ubicación</th><th>Estrato</th><th>Estado</th><th style={{textAlign:'center'}}>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} onClick={() => navigate(`/coordinador/suelos/ensayos/${e.id}`)} style={{cursor:'pointer'}}>
                  <td className="assay-code">{e.nombre_ensayo || e.codigo_ensayo}</td>
                  <td>{e.progresiva_nombre || e.cantera_nombre}</td>
                  <td>E: {e.estrato_orden}</td>
                  <td>
                    <span className={`status-badge-pill status-${(e.estado || 'pendiente').toLowerCase().replace(' ', '-')}`}>
                      {e.estado || 'PENDIENTE'}
                    </span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button className="btn-results" onClick={(ev) => { ev.stopPropagation(); handleShowResults(ev, e); }} style={{background:'#f8f9fa', border:'1px solid #ddd', padding:'5px 8px', borderRadius:'4px', cursor: 'pointer'}}>
                      <i className="fas fa-poll-h"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ========== VistaGeneralEnsayos ==========
const VistaGeneralEnsayos = ({ setLastTramoId }) => {
  const { tramoId } = useParams();
  const navigate = useNavigate();
  const { API_URL, getAuthHeaders, selectedProjectId } = useAuth();

  const [ensayosAgrupados, setEnsayosAgrupados] = useState({});
  const [tramo, setTramo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [fileToImport, setFileToImport] = useState(null);
  const [modalGrupo, setModalGrupo] = useState(null);
  const [currentTargetType, setCurrentTargetType] = useState(null);
  const [isResultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedAssayForResults, setSelectedAssayForResults] = useState(null);
  const [tramosList, setTramosList] = useState([]);

  const fetchTramosList = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/progresivas${selectedProjectId ? `?selectedProjectId=${selectedProjectId}` : ''}`, { headers });
      setTramosList(res.data);
    } catch (err) { console.error(err); }
  }, [API_URL, getAuthHeaders, selectedProjectId]);

  const fetchEnsayos = useCallback(async () => {
    if (!tramoId) return;
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const tiposRes = await axios.get(`${API_URL}/api/tipos-ensayo`, { headers });
      const ensayosRes = await axios.get(`${API_URL}/api/tramos/${tramoId}/ensayos`, { headers });
      
      const allTipos = tiposRes.data;
      const data = ensayosRes.data || {};
      const ensayosList = data.ensayos || data.ensayosList || [];
      const tramoInfo = data.tramo || data.tramoInfo || {};

      const agrupados = allTipos.reduce((acc, tipo) => {
        const key = tipo.config_key || tipo.id;
        acc[key] = {
          ensayos: ensayosList.filter(e => (e.config_key || e.tipo_ensayo_id) === key),
          tipoEnsayoId: tipo.id,
          descripcion: tipo.descripcion,
          configKey: tipo.config_key
        };
        return acc;
      }, {});

      setEnsayosAgrupados(agrupados);
      setTramo(tramoInfo);
      if (setLastTramoId) setLastTramoId(tramoId);
      sessionStorage.setItem('lastSelectedTramoId', tramoId);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tramoId, API_URL, getAuthHeaders, setLastTramoId]);

  useEffect(() => { tramoId ? fetchEnsayos() : fetchTramosList(); }, [tramoId, fetchEnsayos, fetchTramosList]);

  const handleImportFile = async (file) => {
    setImporting(true);
    setImportErrors([]);
    try {
      const headers = getAuthHeaders();
      const formData = new FormData();
      formData.append('file', file);
      if (currentTargetType) formData.append('configKey', currentTargetType);
      formData.append('isSimulation', true);
      const res = await axios.post(`${API_URL}/api/tramos/${tramoId}/importar-ensayos`, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      setImportSummary(res.data.summary);
      setFileToImport(file);
      setImportModalOpen(false);
      setShowConfirmationModal(true);
    } catch (err) { setImportErrors(err.response?.data?.errors || [{ error: 'Error de validación.' }]); }
    finally { setImporting(false); }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const headers = getAuthHeaders();
      const formData = new FormData();
      formData.append('file', fileToImport);
      if (currentTargetType) formData.append('configKey', currentTargetType);
      formData.append('isSimulation', false);
      await axios.post(`${API_URL}/api/tramos/${tramoId}/importar-ensayos`, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      alertify.success('Importación exitosa.');
      setShowConfirmationModal(false);
      fetchEnsayos();
    } catch (err) { alertify.error('Error al importar.'); }
    finally { setImporting(false); }
  };

  const handleExportAll = async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/tramos/${tramoId}/exportar-ensayos`, { headers: getAuthHeaders(), responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Ensayos_Tramo_${tramoId}.xlsx`); link.click();
    } catch (err) { alertify.error('Error al exportar.'); }
  };

  const handleShowResults = (e, ensayo) => { e.stopPropagation(); setSelectedAssayForResults(ensayo); setResultsModalOpen(true); };

  if (!tramoId) return <div className="loading-spinner">Seleccione un tramo...</div>;
  if (loading) return <div className="loading-overlay"><div className="loading-spinner"></div><p>Cargando Dashboard...</p></div>;

  const total = Object.values(ensayosAgrupados).reduce((a, g) => a + g.ensayos.length, 0);
  const done = Object.values(ensayosAgrupados).reduce((a, g) => a + g.ensayos.filter(e => e.datos_formulario && Object.keys(e.datos_formulario).length > 0).length, 0);
  const colors = ['#54a0ca', '#28a745', '#fd7e14', '#6f42c1', '#17a2b8', '#dc3545', '#6610f2', '#e83e8c'];

  return (
    <div className="vista-general-ensayos-container">
      <header className="vista-general-header-premium">
        <div className="header-title-section">
          <i className="fas fa-microscope main-icon"></i>
          <div className="title-text">
            <h1>Panel de Control de Ensayos</h1>
            <p>Monitoreo analítico: <span className="tramo-highlight">{tramo?.nombre_tramo || 'Tramo Principal'}</span></p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-expandable" onClick={() => { setCurrentTargetType(null); setImportModalOpen(true); }}>
            <i className="fas fa-file-import"></i> <span className="btn-text">Importar Excel</span>
          </button>
          <button className="btn btn-success btn-expandable" onClick={handleExportAll}>
            <i className="fas fa-file-excel"></i> <span className="btn-text">Exportar Todo</span>
          </button>
          <button className="btn btn-back-circle" onClick={() => navigate(-1)} title="Volver">
            <i className="fas fa-arrow-left"></i>
          </button>
        </div>
      </header>

      {/* Analítica */}
      <div className="resumen-analitico-container">
        <div className="resumen-analitico-layout">
          <div className="analitica-col doughnut-section">
            <div className="analitica-card-title"><i className="fas fa-chart-pie"></i> Avance General</div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart><Pie data={[{name:'Hecho', value:done},{name:'Pend', value:total-done}]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value"><Cell fill="#28a745" /><Cell fill="#ffc107" /></Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="chart-labels">
                <div className="label-item"><span className="dot dot-success"></span> {done} Hechos</div>
                <div className="label-item"><span className="dot dot-warning"></span> {total - done} Pend.</div>
              </div>
            </div>
          </div>
          <div className="analitica-col">
            <div className="stat-card-premium">
               <div className="stat-header"><span className="stat-label">EFICIENCIA GLOBAL</span><i className="fas fa-bolt stat-icon"></i></div>
               <div className="stat-value-large">{total > 0 ? ((done/total)*100).toFixed(1) : 0}%</div>
               <div className="progress-bar-container"><div className="progress-bar-fill" style={{width:`${total>0?(done/total)*100:0}%`}}></div></div>
            </div>
          </div>
          <div className="analitica-col">
            <div className="stat-card-premium milestone-card">
              <div className="stat-header"><span className="stat-label">PRÓXIMO OBJETIVO</span><i className="fas fa-flag-checkered stat-icon"></i></div>
              <div className="milestone-content">
                {(() => {
                  const items = Object.values(ensayosAgrupados).map(g=>({desc:g.descripcion, pend:g.ensayos.length - g.ensayos.filter(e=>e.datos_formulario && Object.keys(e.datos_formulario).length>0).length})).filter(i=>i.pend>0).sort((a,b)=>a.pend-b.pend);
                  return items[0] ? <><div className="milestone-name">{items[0].desc}</div><div className="milestone-sub">Faltan {items[0].pend} ensayos</div></> : <div className="milestone-name">Meta lograda</div>;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="ensayos-grid">
        {Object.entries(ensayosAgrupados).map(([key, grupo], index) => {
          const accent = colors[index % colors.length];
          return (
            <div className="card-ensayo-tipo" key={key} style={{ '--accent-color': accent }}>
              <div className="card-header" onClick={() => setModalGrupo(grupo)}>
                <h2>{grupo.descripcion}</h2>
                <div className="header-actions">
                  <span className="ensayo-count-badge">{grupo.ensayos.length}</span>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
              <div className="card-content">
                {grupo.ensayos.slice(0, 5).map(e => (
                  <div className="mini-card-ensayo" key={e.id} onClick={() => navigate(`/coordinador/suelos/ensayos/${e.id}`)}>
                    <div className="mini-card-horizontal-layout">
                      <div className="mini-card-main-data">
                        <i className="fas fa-vial" style={{color:accent}}></i>
                        <span className="mini-assay-code">{e.nombre_ensayo || e.codigo_ensayo}</span>
                        <span className="mini-divider">|</span>
                        <span className="mini-location"><i className="fas fa-road"></i> {e.progresiva_nombre}</span>
                        <span className="mini-divider">|</span>
                        <span className="mini-estrato">E: {e.estrato_orden}</span>
                      </div>
                      <div className="mini-card-side-data">
                        <span className={`status-badge-pill status-${(e.estado || 'pendiente').toLowerCase().replace(' ', '-')}`}>
                          {e.estado || 'PENDIENTE'}
                        </span>
                        <button className="btn-results-circle" onClick={(ev) => { ev.stopPropagation(); handleShowResults(ev, e); }} title="Ver Resultados">
                          <i className="fas fa-poll-h"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {grupo.ensayos.length > 5 && <div className="preview-limit-notice" onClick={() => setModalGrupo(grupo)}>+ {grupo.ensayos.length - 5} más de {grupo.descripcion}</div>}
              </div>
            </div>
          );
        })}
      </main>

      <ImportModal isOpen={isImportModalOpen} onClose={()=>setImportModalOpen(false)} onImport={handleImportFile} loading={importing} errors={importErrors} />
      <ConfirmationModal isOpen={showConfirmationModal} onClose={()=>setShowConfirmationModal(false)} onConfirm={confirmImport} summary={importSummary} loading={importing} />
      <EnsayosFullListModal isOpen={!!modalGrupo} onClose={()=>setModalGrupo(null)} grupo={modalGrupo} navigate={navigate} handleShowResults={handleShowResults} />
      {isResultsModalOpen && <ResultadosBrevesModal isOpen={isResultsModalOpen} onClose={()=>setResultsModalOpen(false)} ensayo={selectedAssayForResults} />}
    </div>
  );
};

export default VistaGeneralEnsayos;