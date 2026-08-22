import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import alertify from "alertifyjs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/data/contexts/AuthContext";
import ResultadosBrevesModal from "./ResultadosBrevesModal";
import EnsayoDetalleModal from "./EnsayoDetalleModal";
import { getEnsayoCompletionStatus } from "./ensayos.estado.js";
import VisorGraficos from "./secciones/VisorGraficos.jsx";
import "./VistaGeneralEnsayos.css";
import "./ResultadosBrevesModal.css";
import "./ensayos.css";

const compressIds = (ids) => {
  if (!ids || ids.length === 0) return "";
  const sorted = [...ids].map(Number).sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      if (start === prev) {
        ranges.push(String(start));
      } else {
        ranges.push(`${start}-${prev}`);
      }
      start = current;
      prev = current;
    }
  }
  return ranges.join(",");
};

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
        <h2>Importar Ensayos</h2>
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

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  summary,
  loading,
  errors = [],
}) => {
  if (!isOpen) return null;
  return (
    <div className="import-modal-overlay">
      <div className="import-modal-content" style={{ maxWidth: "600px" }}>
        <h2>Confirmar Cambios</h2>
        {!loading ? (
          <>
            <ul>
              <li>Se crearán: {summary?.ensayosParaCrear || 0} ensayos</li>
              <li>
                Se actualizarán: {summary?.ensayosParaActualizar || 0} ensayos
              </li>
            </ul>
            {errors.length > 0 && (
              <div
                className="import-errors"
                style={{
                  marginTop: "15px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  textAlign: "left",
                  backgroundColor: "#f8d7da",
                  padding: "10px",
                  borderRadius: "5px",
                }}
              >
                <p
                  style={{
                    fontWeight: "bold",
                    color: "#721c24",
                    margin: "0 0 10px 0",
                    fontSize: "0.95em",
                  }}
                >
                  <i className="fas fa-exclamation-triangle"></i> Los siguientes
                  ensayos NO se crearán ni actualizarán por errores en el documento.
                  Corrige el archivo si deseas importarlos, o presiona Confirmar
                  para omitirlos e importar el resto:
                </p>
                {errors.map((err, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.85em",
                      color: "#721c24",
                      borderBottom: "1px solid #f5c6cb",
                      paddingBottom: "5px",
                      marginBottom: "5px",
                    }}
                  >
                    <strong>Hoja: {err.sheet}</strong> - {err.error}
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                onClick={onClose}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="btn btn-primary"
                disabled={loading}
              >
                Confirmar y Omitir Errores
              </button>
            </div>
          </>
        ) : (
          <div className="loading-spinner-modal" style={{ padding: "30px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="loading-spinner" style={{ width: "50px", height: "50px", borderWidth: "5px", marginBottom: "20px" }}></div>
            <p style={{ fontWeight: "600", fontSize: "1.1em", color: "#2c3e50", textAlign: "center", margin: 0 }}>
              Los ensayos identificados se están importando con éxito.
            </p>
            <p style={{ fontSize: "0.95em", color: "#7f8c8d", marginTop: "8px", textAlign: "center", marginBottom: 0 }}>
              Por favor, espere un momento...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const hasGroupChartsConfig = (graficosConfig) => {
  if (!graficosConfig) return false;
  if (Array.isArray(graficosConfig)) {
    return graficosConfig.some((chart) => chart?.scope === "group");
  }
  if (typeof graficosConfig === "object") {
    const aggregateCharts = Array.isArray(graficosConfig.aggregate_charts)
      ? graficosConfig.aggregate_charts
      : Array.isArray(graficosConfig.list_view_charts)
        ? graficosConfig.list_view_charts
        : [];
    const groupedCharts = Array.isArray(graficosConfig.charts)
      ? graficosConfig.charts.filter((chart) => chart?.scope === "group")
      : [];
    return [...groupedCharts, ...aggregateCharts].length > 0;
  }
  return false;
};

const EnsayosFullListModal = ({
  isOpen,
  onClose,
  grupo,
  onOpenEnsayo,
  handleShowResults,
  getEnsayoStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [activeTab, setActiveTab] = useState("listado");

  if (!isOpen || !grupo) return null;

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return (
        <i
          className="fas fa-sort"
          style={{ color: "#ccc", marginLeft: "5px" }}
        ></i>
      );
    return sortConfig.direction === "asc" ? (
      <i className="fas fa-sort-up" style={{ marginLeft: "5px" }}></i>
    ) : (
      <i className="fas fa-sort-down" style={{ marginLeft: "5px" }}></i>
    );
  };

  const sortedAndFiltered = [...grupo.ensayos]
    .filter((e) =>
      `${e.nombre_ensayo} ${e.codigo_ensayo} ${e.progresiva_nombre}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = "";
      let bValue = "";

      switch (sortConfig.key) {
        case "nombre":
          aValue = (a.nombre_ensayo || "").toLowerCase();
          bValue = (b.nombre_ensayo || "").toLowerCase();
          break;
        case "codigo":
          aValue = (a.codigo_ensayo || a.codigo_generado || "").toLowerCase();
          bValue = (b.codigo_ensayo || b.codigo_generado || "").toLowerCase();
          break;
        case "ubicacion":
          aValue = (
            a.progresiva_nombre ||
            a.cantera_nombre ||
            ""
          ).toLowerCase();
          bValue = (
            b.progresiva_nombre ||
            b.cantera_nombre ||
            ""
          ).toLowerCase();
          break;
        case "estrato":
          aValue = Number(a.estrato_orden) || 0;
          bValue = Number(b.estrato_orden) || 0;
          break;
        case "estado":
          aValue = getEnsayoStatus(a).toLowerCase();
          bValue = getEnsayoStatus(b).toLowerCase();
          break;
        default:
          break;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="full-list-modal-overlay" onClick={onClose}>
      <div
        className="full-list-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="full-list-modal-header">
          <h2>
            <i className="fas fa-list-ul"></i> {grupo.descripcion}
          </h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginRight: "10px", marginLeft: "auto" }}>
            <button
              className="btn-pdf-premium"
              type="button"
              onClick={() => {
                const completados = grupo.ensayos.filter(e => getEnsayoStatus(e) === "COMPLETADO");
                if (completados.length === 0) {
                  alertify.warning("No hay ensayos completados para generar un reporte.");
                  return;
                }
                const ids = compressIds(completados.map(c => c.id));
                window.open(`/coordinador/suelos/ensayos/consolidado/reporte?ids=${ids}`, "_blank");
              }}
              title="Generar reporte consolidado de ensayos completados"
            >
              <i className="fas fa-file-pdf"></i> Reporte Consolidado ({grupo.ensayos.filter(e => getEnsayoStatus(e) === "COMPLETADO").length} Completados)
            </button>
          </div>
          <button className="btn-close-modal" onClick={onClose} style={{ marginLeft: "0" }}>
            &times;
          </button>
        </div>
        <div className="full-list-modal-tabs">
          <button
            className={`full-list-tab ${activeTab === "listado" ? "active" : ""}`}
            onClick={() => setActiveTab("listado")}
            type="button"
          >
            Listado de Ensayos de {grupo.descripcion}
          </button>
          {hasGroupChartsConfig(grupo?.graficosConfig) && (
            <button
              className={`full-list-tab ${activeTab === "tendencia" ? "active" : ""}`}
              onClick={() => setActiveTab("tendencia")}
              type="button"
            >
              Gráfico de Tendencia
            </button>
          )}
        </div>
        {activeTab === "tendencia" &&
          hasGroupChartsConfig(grupo?.graficosConfig) && (
            <div className="trend-chart-panel">
              <div className="trend-chart-header">
                <h3>Tendencia del tipo</h3>
                <span>{grupo.ensayos.length} ensayos considerados</span>
              </div>
              <VisorGraficos
                graficosConfig={grupo.graficosConfig}
                tableConfig={grupo.tableConfig}
                scope="group"
                groupEnsayos={grupo.ensayos}
                calculationConfig={grupo.calculationConfig}
              />
            </div>
          )}
        {activeTab === "listado" && (
          <>
            <div className="modal-search-bar">
              <input
                type="text"
                className="modal-search-input"
                placeholder="🔍 Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="full-list-modal-body">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("nombre")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Nombre {getSortIcon("nombre")}
                    </th>
                    <th
                      onClick={() => handleSort("codigo")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Código {getSortIcon("codigo")}
                    </th>
                    <th
                      onClick={() => handleSort("ubicacion")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Ubicación {getSortIcon("ubicacion")}
                    </th>
                    <th
                      onClick={() => handleSort("estrato")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Estrato {getSortIcon("estrato")}
                    </th>
                    <th
                      onClick={() => handleSort("estado")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Estado {getSortIcon("estado")}
                    </th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFiltered.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => onOpenEnsayo(e)}
                      style={{ cursor: "pointer" }}
                    >
                      <td
                        className="assay-name"
                        style={{ fontWeight: "500", color: "#0d6efd" }}
                      >
                        {e.nombre_ensayo || "Sin nombre"}
                      </td>
                      <td
                        className="assay-code"
                        style={{ color: "#6c757d", fontSize: "0.9em" }}
                      >
                        {e.codigo_ensayo || e.codigo_generado || "-"}
                      </td>
                      <td>{e.progresiva_nombre || e.cantera_nombre}</td>
                      <td>E: {e.estrato_orden}</td>
                      <td>
                        <span
                          className={`status-badge-pill status-${getEnsayoStatus(e).toLowerCase().replace(" ", "-")}`}
                        >
                          {getEnsayoStatus(e)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            className="btn-results"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleShowResults(ev, e);
                            }}
                            style={{
                              background: "#f8f9fa",
                              border: "1px solid #ddd",
                              padding: "5px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            title="Ver Resultados / Editar"
                          >
                            <i className="fas fa-poll-h"></i>
                          </button>
                          
                          {getEnsayoStatus(e) === "COMPLETADO" && (
                            <button
                              className="btn-report-quick"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                window.open(`/coordinador/suelos/ensayos/${e.id}/reporte`, "_blank");
                              }}
                              style={{
                                background: "#f8f9fa",
                                border: "1px solid #ddd",
                                padding: "5px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                color: "#dc2626",
                                transition: "all 0.2s ease"
                              }}
                              title="Ver Reporte PDF"
                            >
                              <i className="fas fa-file-pdf"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const VistaGeneralEnsayos = ({ setLastTramoId }) => {
  const { tramoId } = useParams();
  const navigate = useNavigate();
  const { API_URL, getAuthHeaders, selectedProjectId } = useAuth();

  const [ensayosAgrupados, setEnsayosAgrupados] = useState({});
  const [tramo, setTramo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [fileToImport, setFileToImport] = useState(null);
  const [modalGrupo, setModalGrupo] = useState(null);
  const [currentTargetType, setCurrentTargetType] = useState(null);
  const [isResultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedAssayForResults, setSelectedAssayForResults] = useState(null);
  const [selectedAssayForDetail, setSelectedAssayForDetail] = useState(null);
  const [tramosList, setTramosList] = useState([]);
  const [activeObjectiveIndex, setActiveObjectiveIndex] = useState(0);

  const fetchTramosList = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(
        `${API_URL}/api/progresivas${selectedProjectId ? `?selectedProjectId=${selectedProjectId}` : ""}`,
        { headers },
      );
      setTramosList(res.data);
    } catch (err) {}
  }, [API_URL, getAuthHeaders, selectedProjectId]);

  const fetchEnsayos = useCallback(async () => {
    if (!tramoId) return;
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const tiposRes = await axios.get(`${API_URL}/api/tipos-ensayo`, {
        headers,
      });
      const ensayosRes = await axios.get(
        `${API_URL}/api/tramos/${tramoId}/ensayos`,
        { headers },
      );

      const allTipos = tiposRes.data;
      const data = ensayosRes.data || {};
      let ensayosList = data.ensayos || data.ensayosList || [];
      const tramoInfo = data.tramo || data.tramoInfo || {};

      ensayosList.sort((a, b) => {
        const progA = (a.progresiva_nombre || "").localeCompare(
          b.progresiva_nombre || "",
        );
        if (progA !== 0) return progA;
        return (Number(a.estrato_orden) || 0) - (Number(b.estrato_orden) || 0);
      });

      const agrupados = allTipos.reduce((acc, tipo) => {
        const key = tipo.config_key || tipo.id;
        const filtrados = ensayosList.filter((e) => {
          const eKey = e.config_key || e.tipo_ensayo_id;
          return eKey == key || e.tipo_ensayo == tipo.id;
        });

        acc[key] = {
          ensayos: filtrados,
          tipoEnsayoId: tipo.id,
          descripcion: tipo.descripcion,
          configKey: tipo.config_key,
          tableConfig: tipo.config_tabla || tipo.tableConfig || null,
          graficosConfig: tipo.config_graficos || tipo.graficosConfig || null,
          calculationConfig:
            tipo.config_calculos || tipo.calculationConfig || null,
        };
        return acc;
      }, {});

      setEnsayosAgrupados(agrupados);
      setTramo(tramoInfo);
      if (setLastTramoId) setLastTramoId(tramoId);
      sessionStorage.setItem("lastSelectedTramoId", tramoId);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [tramoId, API_URL, getAuthHeaders, setLastTramoId]);

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
    (ensayo) => {
      const st = getEnsayoStatus(ensayo);
      return st === "COMPLETADO" || st === "APROBADO";
    },
    [getEnsayoStatus],
  );

  useEffect(() => {
    tramoId ? fetchEnsayos() : fetchTramosList();
  }, [tramoId, fetchEnsayos, fetchTramosList]);

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
        `${API_URL}/api/proyectos/${selectedProjectId}/tramos/${tramoId}/ensayos/importar`,
        formData,
        {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
          params: { isSimulation: "true" },
        },
      );
      setImportSummary(res.data.summary);
      setImportErrors(res.data.errors || []);
      setFileToImport(file);
      setImportModalOpen(false);
      setShowConfirmationModal(true);
    } catch (err) {
      setImportErrors(
        err.response?.data?.details || [
          {
            sheet: "General",
            error: "Error de validación al procesar el archivo.",
          },
        ],
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

      await axios.post(
        `${API_URL}/api/proyectos/${selectedProjectId}/tramos/${tramoId}/ensayos/importar`,
        formData,
        {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
          params: { isSimulation: "false" },
        },
      );
      alertify.success("Importación exitosa.");
      setShowConfirmationModal(false);
      await fetchEnsayos();
    } catch (err) {
      alertify.error("Error al importar.");
    } finally {
      setImporting(false);
    }
  };

  const handleExportByType = async (e, tipoEnsayoId, descripcion) => {
    e.stopPropagation();
    setExporting(true);
    console.log(
      `[EXPORT DEBUG] Exportando tipo ${tipoEnsayoId} para tramo ${tramoId}. URL: ${API_URL}/api/tramos/${tramoId}/ensayos/export-excel/${tipoEnsayoId}`,
    );
    try {
      const resp = await axios.get(
        `${API_URL}/api/tramos/${tramoId}/ensayos/export-excel/${tipoEnsayoId}`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        },
      );
      console.log(
        `[EXPORT DEBUG] Recibido blob de tamaño: ${resp.data.size} bytes`,
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${descripcion.replace(/ /g, "_")}_Tramo_${tramoId}.xlsx`,
      );
      link.click();
      alertify.success(`Exportando ${descripcion}...`);
    } catch (err) {
      alertify.error("Error al exportar este tipo de ensayo.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    console.log(
      `[EXPORT DEBUG] Exportando todos los ensayos para tramo ${tramoId}`,
    );
    setExporting(true);
    try {
      const resp = await axios.get(
        `${API_URL}/api/tramos/${tramoId}/ensayos/export-excel`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        },
      );
      console.log(
        `[EXPORT DEBUG] Recibido blob total de tamaño: ${resp.data.size} bytes`,
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Todos_los_Ensayos_Tramo_${tramoId}.xlsx`);
      link.click();
      alertify.success("Exportando todos los ensayos...");
    } catch (err) {
      alertify.error("Error al exportar todos los ensayos.");
    } finally {
      setExporting(false);
    }
  };

  const handleShowResults = (ev, assay) => {
    ev.stopPropagation();
    setSelectedAssayForResults(assay);
    setResultsModalOpen(true);
  };

  const handleOpenEnsayo = (assay) => {
    setSelectedAssayForDetail(assay);
  };

  if (!tramoId)
    return <div className="loading-spinner">Seleccione un tramo...</div>;
  if (loading)
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Cargando Dashboard...</p>
      </div>
    );

  const total = Object.values(ensayosAgrupados).reduce(
    (a, g) => a + g.ensayos.length,
    0,
  );
  const aprobado = Object.values(ensayosAgrupados).reduce(
    (a, g) => a + g.ensayos.filter((e) => getEnsayoStatus(e) === "APROBADO").length,
    0,
  );
  const completado = Object.values(ensayosAgrupados).reduce(
    (a, g) => a + g.ensayos.filter((e) => getEnsayoStatus(e) === "COMPLETADO").length,
    0,
  );
  const enProgreso = Object.values(ensayosAgrupados).reduce(
    (a, g) => a + g.ensayos.filter((e) => {
      const st = getEnsayoStatus(e);
      return st === "EN PROGRESO" || st === "EN_PROGRESO" || st === "EN PROCESO";
    }).length,
    0,
  );
  const rechazado = Object.values(ensayosAgrupados).reduce(
    (a, g) => a + g.ensayos.filter((e) => {
      const st = getEnsayoStatus(e);
      return st === "RECHAZADO" || st === "INCOMPLETO";
    }).length,
    0,
  );
  const pendiente = total - aprobado - completado - enProgreso - rechazado;
  const done = aprobado + completado;
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
              <span className="tramo-highlight">
                {tramo?.nombre_tramo || "Tramo Principal"}
              </span>
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-main-action import btn-expandable-premium"
            onClick={() => {
              setCurrentTargetType(null);
              setImportModalOpen(true);
            }}
            title="Importar todos los ensayos (XLSX)"
          >
            <i className="fas fa-file-import"></i>
            <span className="btn-text">Importar Todo</span>
          </button>
          <button
            className="btn-main-action export btn-expandable-premium"
            onClick={handleExportAll}
            title="Exportar todos los ensayos a Excel"
          >
            <i className="fas fa-file-excel"></i>
            <span className="btn-text">Exportar Todo</span>
          </button>
          <button
            className="btn-main-action back btn-expandable-premium"
            onClick={() => navigate(-1)}
            title="Volver al panel anterior"
          >
            <i className="fas fa-arrow-left"></i>
            <span className="btn-text">Retroceder</span>
          </button>
        </div>
      </header>

      {/* Analítica */}
      <div className="resumen-analitico-container">
        <div className="resumen-analitico-layout">
          <div className="analitica-col doughnut-section">
            <div className="analitica-card-title">
              <i className="fas fa-chart-pie"></i> Avance General
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pendientes", value: pendiente, color: "#eab308" },
                      { name: "En Progreso", value: enProgreso, color: "#3b82f6" },
                      { name: "Completados", value: completado, color: "#10b981" },
                      { name: "Aprobados", value: aprobado, color: "#059669" },
                      { name: "Rechazados", value: rechazado, color: "#ef4444" },
                    ].filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    minAngle={15}
                    dataKey="value"
                  >
                    {[
                      { name: "Pendientes", value: pendiente, color: "#eab308" },
                      { name: "En Progreso", value: enProgreso, color: "#3b82f6" },
                      { name: "Completados", value: completado, color: "#10b981" },
                      { name: "Aprobados", value: aprobado, color: "#059669" },
                      { name: "Rechazados", value: rechazado, color: "#ef4444" },
                    ]
                      .filter((item) => item.value > 0)
                      .map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-labels">
                <div className="label-item">
                  <span className="dot" style={{ backgroundColor: "#eab308" }}></span> {pendiente} Pendientes
                </div>
                <div className="label-item">
                  <span className="dot" style={{ backgroundColor: "#3b82f6" }}></span> {enProgreso} En Progreso
                </div>
                <div className="label-item">
                  <span className="dot" style={{ backgroundColor: "#10b981" }}></span> {completado} Completados
                </div>
                <div className="label-item">
                  <span className="dot" style={{ backgroundColor: "#059669" }}></span> {aprobado} Aprobados
                </div>
                <div className="label-item">
                  <span className="dot" style={{ backgroundColor: "#ef4444" }}></span> {rechazado} Rechazados
                </div>
              </div>
            </div>
          </div>
          <div className="analitica-col">
            <div className="stat-card-premium">
              <div className="stat-header">
                <span className="stat-label">EFICIENCIA GLOBAL</span>
                <i className="fas fa-bolt stat-icon"></i>
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
            {(() => {
              const objectives = Object.values(ensayosAgrupados).map((g) => {
                const totalGrupo = g.ensayos.length;
                const hechosGrupo = g.ensayos.filter((e) => isDone(e)).length;
                const pendGrupo = totalGrupo - hechosGrupo;
                return {
                  desc: g.descripcion,
                  pend: pendGrupo,
                  hechos: hechosGrupo,
                  total: totalGrupo
                };
              });

              const safeIndex = activeObjectiveIndex < objectives.length ? activeObjectiveIndex : 0;

              return (
                <div className="stat-card-premium milestone-card carrusel-card">
                  <div className="stat-header">
                    <span className="stat-label">OBJETIVOS DE ENSAYOS</span>
                    <i className="fas fa-flag-checkered stat-icon"></i>
                  </div>
                  <div className="milestone-carrusel-wrapper">
                    {objectives.length > 0 ? (
                      <>
                        <button
                          className="carrusel-btn prev"
                          onClick={() => setActiveObjectiveIndex((prev) => (prev === 0 ? objectives.length - 1 : prev - 1))}
                          title="Objetivo anterior"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        
                        <div className="milestone-content carrusel-slide">
                          <div className="milestone-name">{objectives[safeIndex]?.desc}</div>
                          <div className="milestone-sub">
                            {objectives[safeIndex]?.pend > 0 ? (
                              <span className="objective-pending-label">
                                Faltan {objectives[safeIndex]?.pend} de {objectives[safeIndex]?.total} ensayos
                              </span>
                            ) : (
                              <span className="objective-completed-label">
                                <i className="fas fa-check-circle"></i> ¡Meta Lograda!
                              </span>
                            )}
                          </div>
                          
                          <div className="objective-mini-bar-container">
                            <div 
                              className="objective-mini-bar-fill" 
                              style={{ 
                                width: `${objectives[safeIndex]?.total > 0 ? (objectives[safeIndex]?.hechos / objectives[safeIndex]?.total) * 100 : 0}%`,
                                backgroundColor: objectives[safeIndex]?.pend > 0 ? "#54a0ca" : "#28a745"
                              }}
                            ></div>
                          </div>
                          
                          <div className="carrusel-dots">
                            {objectives.map((_, idx) => (
                              <span 
                                key={idx} 
                                className={`carrusel-dot ${idx === safeIndex ? 'active' : ''}`}
                                onClick={() => setActiveObjectiveIndex(idx)}
                              ></span>
                            ))}
                          </div>
                        </div>

                        <button
                          className="carrusel-btn next"
                          onClick={() => setActiveObjectiveIndex((prev) => (prev === objectives.length - 1 ? 0 : prev + 1))}
                          title="Siguiente objetivo"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </>
                    ) : (
                      <div className="milestone-content">
                        <div className="milestone-name">Sin objetivos configurados</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <main className="ensayos-grid">
        {Object.entries(ensayosAgrupados).map(([key, grupo], index) => {
          const accent = colors[index % colors.length];
          const hechosGrupo = grupo.ensayos.filter((e) => isDone(e)).length;
          const totalGrupo = grupo.ensayos.length;
          const pctGrupo =
            totalGrupo > 0 ? (hechosGrupo / totalGrupo) * 100 : 0;

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
                      {totalGrupo} ensayos
                    </span>
                    <span className="mini-progress-text">
                      {hechosGrupo}/{totalGrupo} completados
                    </span>
                    {grupo.ensayos.filter((e) => {
                      const st = getEnsayoStatus(e);
                      return st === "RECHAZADO" || st === "INCOMPLETO";
                    }).length > 0 && (
                      <span className="mini-rejected-badge">
                        <i className="fas fa-times-circle"></i> {
                          grupo.ensayos.filter((e) => {
                            const st = getEnsayoStatus(e);
                            return st === "RECHAZADO" || st === "INCOMPLETO";
                          }).length
                        } rechaz.
                      </span>
                    )}
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
                    <button
                      className="btn-card-action pdf"
                      onClick={(e) => {
                        e.stopPropagation();
                        const completados = grupo.ensayos.filter(e => isDone(e));
                        if (completados.length === 0) {
                          alertify.warning("No hay ensayos completados para generar un reporte.");
                          return;
                        }
                        const ids = compressIds(completados.map(c => c.id));
                        window.open(`/coordinador/suelos/ensayos/consolidado/reporte?ids=${ids}`, "_blank");
                      }}
                      title="Generar reporte consolidado de todos los ensayos completados"
                    >
                      <i className="fas fa-file-pdf"></i>
                    </button>
                  </div>
                  <i className="fas fa-chevron-right arrow-indicator"></i>
                </div>
              </div>

              <div className="card-progress-bar">
                <div
                  className="card-progress-fill"
                  style={{ width: `${pctGrupo}%` }}
                ></div>
              </div>

              <div className="card-content">
                {grupo.ensayos.slice(0, 5).map((e) => (
                  <div
                    className="mini-card-ensayo"
                    key={e.id}
                    onClick={() => handleOpenEnsayo(e)}
                  >
                    <div className="mini-card-horizontal-layout">
                      <div className="mini-card-main-data">
                        <i
                          className="fas fa-vial"
                          style={{ color: accent }}
                        ></i>
                        <span
                          className="mini-assay-code"
                          title={e.codigo_ensayo || e.codigo_generado}
                        >
                          {e.nombre_ensayo || "Sin nombre"}
                        </span>
                        <span className="mini-divider">|</span>
                        <span className="mini-location">
                          <i className="fas fa-road"></i> {e.progresiva_nombre}
                        </span>
                        <span className="mini-divider">|</span>
                        <span className="mini-estrato">
                          E: {e.estrato_orden}
                        </span>
                      </div>
                      <div className="mini-card-side-data">
                        <span
                          className={`status-badge-pill status-${getEnsayoStatus(e).toLowerCase().replace(" ", "-")}`}
                        >
                          {getEnsayoStatus(e)}
                        </span>
                        <button
                          className="btn-results-circle"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleShowResults(ev, e);
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

      {exporting && (
        <div className="loading-overlay dark">
          <div className="loading-spinner white"></div>
          <p className="loading-text-large">Generando archivo Excel...</p>
          <p className="loading-text-sub">
            Esto puede tardar unos segundos dependiendo de la cantidad de
            ensayos.
          </p>
        </div>
      )}

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
        errors={importErrors}
      />
      <EnsayosFullListModal
        isOpen={!!modalGrupo}
        onClose={() => setModalGrupo(null)}
        grupo={modalGrupo}
        onOpenEnsayo={handleOpenEnsayo}
        handleShowResults={handleShowResults}
        getEnsayoStatus={getEnsayoStatus}
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
        onSaved={fetchEnsayos}
      />
    </div>
  );
};

export default VistaGeneralEnsayos;
