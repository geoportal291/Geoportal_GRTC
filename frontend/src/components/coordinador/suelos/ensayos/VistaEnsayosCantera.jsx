import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import alertify from "alertifyjs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../../../../data/contexts/AuthContext";
import ResultadosBrevesModal from "./ResultadosBrevesModal";
import EnsayoDetalleModal from "./EnsayoDetalleModal";
import { getEnsayoCompletionStatus } from "./ensayos.estado.js";
import "./VistaGeneralEnsayos.css";
import "./ResultadosBrevesModal.css";

// ========== ImportModal (Reutilizado) ==========
const ImportModal = ({ isOpen, onClose, onImport, loading, errors }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  const handleImportClick = () => {
    if (selectedFile) onImport(selectedFile);
    else alertify.warning("Por favor, selecciona un archivo Excel.");
  };
  if (!isOpen) return null;
  return (
    <div className="import-modal-overlay">
      <div className="import-modal-content">
        <h2>Importar Ensayos (Canteras)</h2>
        <input
          type="file"
          className="form-control"
          accept=".xlsx"
          onChange={handleFileChange}
        />
        {loading && (
          <div className="loading-spinner-modal">
            <div className="loading-spinner"></div>
            <p>Validando...</p>
          </div>
        )}
        {errors.length > 0 && (
          <div className="import-errors">
            {errors.map((err, i) => (
              <div key={i}>
                Hoja: {err.sheet} - {err.error}
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleImportClick}
            className="btn btn-primary"
            disabled={loading}
          >
            Validar y Subir
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== ConfirmationModal (Reutilizado) ==========
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  summary,
  loading,
}) => {
  if (!isOpen) return null;
  return (
    <div className="import-modal-overlay">
      <div className="import-modal-content">
        <h2>Confirmar Importación</h2>
        <ul>
          <li>Crear: {summary?.ensayosParaCrear || 0}</li>
          <li>Actualizar: {summary?.ensayosParaActualizar || 0}</li>
        </ul>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            disabled={loading}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== EnsayosFullListModal (Version Canteras) ==========
const EnsayosFullListModal = ({
  isOpen,
  onClose,
  grupo,
  onOpenEnsayo,
  handleShowResults,
  getEnsayoStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  if (!isOpen || !grupo) return null;
  const filteredEnsayos = grupo.ensayos.filter((ensayo) => {
    const searchStr =
      `${ensayo.nombre_ensayo} ${ensayo.codigo_ensayo} ${ensayo.cantera_nombre || ""} ${ensayo.progresiva_nombre || ""}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });
  return (
    <div className="full-list-modal-overlay" onClick={onClose}>
      <div
        className="full-list-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="full-list-modal-header">
          <h2>
            <i
              className="fas fa-list-ul"
              style={{ marginRight: "10px", color: "#54a0ca" }}
            ></i>{" "}
            {grupo.descripcion} (Canteras)
          </h2>
          <button className="btn-close-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-search-bar">
          <input
            type="text"
            className="modal-search-input"
            placeholder="🔍 Buscar por código, nombre o cantera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        <div className="full-list-modal-body">
          <table className="compact-table">
            <thead>
              <tr>
                <th>Código / Nombre</th>
                <th>Cantera / Ubicación</th>
                <th>Estrato</th>
                <th>Estado</th>
                <th style={{ textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnsayos.length > 0 ? (
                filteredEnsayos.map((ensayo) => (
                  <tr
                    key={ensayo.id}
                    onClick={() => onOpenEnsayo(ensayo)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="assay-code">
                      {ensayo.nombre_ensayo || ensayo.codigo_ensayo}
                    </td>
                    <td>
                      {ensayo.cantera_nombre ||
                        ensayo.progresiva_nombre ||
                        "N/A"}
                    </td>
                    <td>E: {ensayo.estrato_orden || "N/A"}</td>
                    <td>
                      <span
                        className={`status-badge-pill status-${getEnsayoStatus(ensayo).toLowerCase().replace(" ", "-")}`}
                      >
                        {getEnsayoStatus(ensayo)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-results"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowResults(e, ensayo);
                        }}
                        style={{
                          background: "#f8f9fa",
                          border: "1px solid #ddd",
                          padding: "5px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <i className="fas fa-poll-h"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "#888",
                    }}
                  >
                    No se encontraron ensayos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ========== VistaEnsayosCantera ==========
const VistaEnsayosCantera = () => {
  const navigate = useNavigate();
  const { API_URL, getAuthHeaders } = useAuth();

  const [ensayosAgrupados, setEnsayosAgrupados] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEnsayos, setSelectedEnsayos] = useState(new Set());
  const [modalGrupo, setModalGrupo] = useState(null);
  const [isResultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedAssayForResults, setSelectedAssayForResults] = useState(null);
  const [selectedAssayForDetail, setSelectedAssayForDetail] = useState(null);

  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [fileToImport, setFileToImport] = useState(null);
  const [currentTargetType, setCurrentTargetType] = useState(null);

  const fetchCanteraEnsayos = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const tiposRes = await axios.get(`${API_URL}/api/tipos-ensayo`, {
        headers,
      });
      const ensayosRes = await axios.get(`${API_URL}/api/ensayos/canteras`, {
        headers,
      });
      const allTipos = tiposRes.data;
      const ensayosDeCanteras = ensayosRes.data || [];
      const agrupados = allTipos.reduce((acc, tipo) => {
        const key = tipo.config_key || tipo.id;
        acc[key] = {
          ensayos: ensayosDeCanteras.filter(
            (e) => (e.config_key || e.tipo_ensayo_id) === key,
          ),
          tipoEnsayoId: tipo.id,
          descripcion: tipo.descripcion,
          configKey: tipo.config_key,
          tableConfig: tipo.config_tabla || tipo.tableConfig || null,
        };
        return acc;
      }, {});
      setEnsayosAgrupados(agrupados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders]);

  useEffect(() => {
    fetchCanteraEnsayos();
  }, [fetchCanteraEnsayos]);

  const getEnsayoStatus = useCallback(
    (ensayo) => {
      const grupo =
        ensayosAgrupados[
          ensayo.config_key || ensayo.tipo_ensayo_id || ensayo.tipo_ensayo
        ] || {};
      return getEnsayoCompletionStatus(ensayo, grupo.tableConfig);
    },
    [ensayosAgrupados],
  );

  const isDone = useCallback(
    (ensayo) => getEnsayoStatus(ensayo) === "COMPLETADO",
    [getEnsayoStatus],
  );

  const handleShowResults = (e, ensayo) => {
    e.stopPropagation();
    setSelectedAssayForResults(ensayo);
    setResultsModalOpen(true);
  };
  const handleOpenEnsayo = (ensayo) => {
    setSelectedAssayForDetail(ensayo);
  };

  const handleImportFile = async (file) => {
    setImporting(true);
    setImportErrors([]);
    try {
      const headers = getAuthHeaders();
      const formData = new FormData();
      formData.append("file", file);
      if (currentTargetType) formData.append("configKey", currentTargetType);
      formData.append("isSimulation", true);
      const res = await axios.post(
        `${API_URL}/api/ensayos/importar-canteras`,
        formData,
        { headers: { ...headers, "Content-Type": "multipart/form-data" } },
      );
      setImportSummary(res.data.summary);
      setFileToImport(file);
      setImportModalOpen(false);
      setShowConfirmationModal(true);
    } catch (err) {
      setImportErrors(
        err.response?.data?.errors || [{ error: "Error de validación." }],
      );
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const headers = getAuthHeaders();
      const formData = new FormData();
      formData.append("file", fileToImport);
      if (currentTargetType) formData.append("configKey", currentTargetType);
      formData.append("isSimulation", false);
      await axios.post(`${API_URL}/api/ensayos/importar-canteras`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      alertify.success("Importación exitosa.");
      setShowConfirmationModal(false);
      fetchCanteraEnsayos();
    } catch (err) {
      alertify.error("Error al importar.");
    } finally {
      setImporting(false);
    }
  };

  const handleExportByType = async (e, tipoEnsayoId, descripcion) => {
    e.stopPropagation();
    try {
      const resp = await axios.get(
        `${API_URL}/api/ensayos/canteras/exportar-tipo/${tipoEnsayoId}`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${descripcion.replace(/ /g, "_")}_Canteras.xlsx`,
      );
      link.click();
      alertify.success(`Exportando ${descripcion}...`);
    } catch (err) {
      console.error(err);
      alertify.error("Error al exportar este tipo de ensayo.");
    }
  };

  const handleExportAll = async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/ensayos/canteras/exportar`, {
        headers: getAuthHeaders(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Ensayos_Canteras_Total.xlsx");
      link.click();
    } catch (err) {
      alertify.error("Error al exportar.");
    }
  };

  if (loading)
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Analizando Canteras...</p>
      </div>
    );

  const total = Object.values(ensayosAgrupados).reduce(
    (a, g) => a + g.ensayos.length,
    0,
  );
  const done = Object.values(ensayosAgrupados).reduce(
    (a, g) => a + g.ensayos.filter((e) => isDone(e)).length,
    0,
  );
  const colors = [
    "#54a0ca",
    "#28a745",
    "#fd7e14",
    "#6f42c1",
    "#17a2b8",
    "#dc3545",
    "#6610f2",
    "#e83e8c",
  ];

  return (
    <div className="vista-general-ensayos-container">
      <header className="vista-general-header-premium">
        <div className="header-title-section">
          <i className="fas fa-microscope main-icon"></i>
          <div className="title-text">
            <h1>Panel de Control de Ensayos</h1>
            <p>
              Monitoreo analítico:{" "}
              <span className="tramo-highlight">Canteras Totales</span>
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-main-action import"
            onClick={() => {
              setCurrentTargetType(null);
              setImportModalOpen(true);
            }}
            title="Importar todos los ensayos (XLSX)"
          >
            <i className="fas fa-file-import"></i>
          </button>
          <button
            className="btn-main-action export"
            onClick={handleExportAll}
            title="Exportar todos los ensayos a Excel"
          >
            <i className="fas fa-file-excel"></i>
          </button>
          <button
            className="btn-main-action back"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        </div>
      </header>

      {/* Dashboard Superior */}
      <div className="resumen-analitico-container">
        <div className="resumen-analitico-layout">
          <div className="analitica-col doughnut-section">
            <div className="analitica-card-title">
              <i className="fas fa-chart-pie"></i> Avance Canteras
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Hecho", value: done },
                      { name: "Pend", value: total - done },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#28a745" />
                    <Cell fill="#ffc107" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-labels">
                <div className="label-item">
                  <span className="dot dot-success"></span> {done} Hechos
                </div>
                <div className="label-item">
                  <span className="dot dot-warning"></span> {total - done} Pend.
                </div>
              </div>
            </div>
          </div>
          <div className="analitica-col">
            <div className="stat-card-premium">
              <div className="stat-header">
                <span className="stat-label">EFICIENCIA CANTERAS</span>
                <i className="fas fa-mountain stat-icon"></i>
              </div>
              <div className="stat-value-large">
                {total > 0 ? ((done / total) * 100).toFixed(1) : 0}%
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="analitica-col">
            <div className="stat-card-premium milestone-card">
              <div className="stat-header">
                <span className="stat-label">PRÓXIMO HITO</span>
                <i className="fas fa-flag-checkered stat-icon"></i>
              </div>
              <div className="milestone-content">
                {(() => {
                  const h = Object.values(ensayosAgrupados)
                    .map((g) => ({
                      desc: g.descripcion,
                      p:
                        g.ensayos.length -
                        g.ensayos.filter((e) => isDone(e)).length,
                    }))
                    .filter((i) => i.p > 0)
                    .sort((a, b) => a.p - b.p)[0];
                  return h ? (
                    <>
                      <div className="milestone-name">{h.desc}</div>
                      <div className="milestone-sub">Faltan {h.p} ensayos</div>
                    </>
                  ) : (
                    <div className="milestone-name">Completado</div>
                  );
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
            <div
              className="card-ensayo-tipo"
              key={key}
              style={{ "--accent-color": accent }}
            >
              <div className="card-header" onClick={() => setModalGrupo(grupo)}>
                <div className="header-info">
                  <h2>{grupo.descripcion}</h2>
                  <div className="header-subtitle">
                    <span className="ensayo-count-badge">
                      {grupo.ensayos.length} ensayos
                    </span>
                  </div>
                </div>
                <div className="header-actions-main">
                  <div className="action-buttons-group">
                    <button
                      className="btn-card-action import"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTargetType(key);
                        setImportModalOpen(true);
                      }}
                      title="Importar este tipo"
                    >
                      <i className="fas fa-upload"></i>
                    </button>
                    <button
                      className="btn-card-action export"
                      onClick={(e) =>
                        handleExportByType(
                          e,
                          grupo.tipoEnsayoId,
                          grupo.descripcion,
                        )
                      }
                      title="Exportar este tipo"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                  <i className="fas fa-chevron-right arrow-indicator"></i>
                </div>
              </div>
              <div className="card-content">
                {grupo.ensayos.slice(0, 5).map((ensayo) => (
                  <div
                    className="mini-card-ensayo"
                    key={ensayo.id}
                    onClick={() => handleOpenEnsayo(ensayo)}
                  >
                    <div className="mini-card-horizontal-layout">
                      <div className="mini-card-main-data">
                        <i
                          className="fas fa-vial"
                          style={{ color: accent }}
                        ></i>
                        <span className="mini-assay-code">
                          {ensayo.nombre_ensayo || ensayo.codigo_ensayo}
                        </span>
                        <span className="mini-divider">|</span>
                        <span className="mini-location">
                          <i className="fas fa-mountain"></i>{" "}
                          {ensayo.cantera_nombre?.substring(0, 20) || "Cantera"}
                        </span>
                        <span className="mini-divider">|</span>
                        <span className="mini-estrato">
                          E: {ensayo.estrato_orden || "N/A"}
                        </span>
                      </div>
                      <div className="mini-card-side-data">
                        <span
                          className={`status-badge-pill status-${getEnsayoStatus(ensayo).toLowerCase().replace(" ", "-")}`}
                        >
                          {getEnsayoStatus(ensayo)}
                        </span>
                        <button
                          className="btn-results-circle"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowResults(e, ensayo);
                          }}
                          title="Ver Resultados"
                        >
                          <i className="fas fa-poll-h"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {grupo.ensayos.length > 5 && (
                  <div
                    className="preview-limit-notice"
                    onClick={() => setModalGrupo(grupo)}
                  >
                    + {grupo.ensayos.length - 5} más de {grupo.descripcion}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <EnsayosFullListModal
        isOpen={!!modalGrupo}
        onClose={() => setModalGrupo(null)}
        grupo={modalGrupo}
        onOpenEnsayo={handleOpenEnsayo}
        handleShowResults={handleShowResults}
        getEnsayoStatus={getEnsayoStatus}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportFile}
        loading={importing}
        errors={importErrors}
      />
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={confirmImport}
        summary={importSummary}
        loading={importing}
      />
      {isResultsModalOpen && (
        <ResultadosBrevesModal
          isOpen={isResultsModalOpen}
          onClose={() => setResultsModalOpen(false)}
          ensayo={selectedAssayForResults}
        />
      )}
      <EnsayoDetalleModal
        isOpen={!!selectedAssayForDetail}
        ensayos={selectedAssayForDetail ? [selectedAssayForDetail] : []}
        initialEnsayoId={selectedAssayForDetail?.id ?? null}
        showEnsayoTabs={false}
        onClose={() => setSelectedAssayForDetail(null)}
        onSaved={fetchCanteraEnsayos}
      />
    </div>
  );
};

export default VistaEnsayosCantera;
