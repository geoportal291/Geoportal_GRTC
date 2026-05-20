import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import alertify from "alertifyjs";
import { calcularResultados } from "./ensayos.calculos.js";
import VisorGraficos from "./secciones/VisorGraficos.jsx";
import "./EnsayoReporteImprimible.css";

// Helper para formatear progresiva
const formatProgresiva = (codigo) => {
  if (!codigo) return "N/A";
  const code = codigo.includes("-") ? codigo.split("-")[1] : codigo;
  return code.length < 3 ? code : `${code.slice(0, -3)}+${code.slice(-3)}`;
};

// Helper para formatear la fecha en español largo
const formatFechaEsp = (fechaStr) => {
  if (!fechaStr) return "N/A";
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    const opciones = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const formateada = fecha.toLocaleDateString("es-ES", opciones);
    return formateada.charAt(0).toUpperCase() + formateada.slice(1);
  } catch (e) {
    return fechaStr;
  }
};

// Helper robusto para obtener valores anidados de forma segura (dot-notation)
const getNested = (obj, path, defaultValue = "") => {
  if (typeof path !== 'string' || !path) return defaultValue;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  if (current === undefined || current === null || current === "") return defaultValue;
  return current;
};

export default function EnsayoReporteImprimible() {
  const { ensayoId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ensayoDetails, setEnsayoDetails] = useState(null);
  const [tableConfig, setTableConfig] = useState(null);
  const [graficosConfig, setGraficosConfig] = useState(null);
  const [reportConfig, setReportConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [resultados, setResultados] = useState({});
  const [calculating, setCalculating] = useState(false);

  const API_URL = process.env.REACT_APP_API_BASE ?? "";

  const getAuthHeaders = useCallback(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const token = userData?.token;
    if (!token) {
      alertify.error("Sesión expirada. Inicie sesión nuevamente.");
      navigate("/login");
      throw new Error("Token no proporcionado");
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  useEffect(() => {
    let ignore = false;

    const fetchAllData = async () => {
      if (!ensayoId) {
        setError("ID de ensayo no proporcionado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const headers = getAuthHeaders();

        // 1. Obtener detalles del ensayo
        const detailsRes = await axios.get(
          `${API_URL}/api/ensayos/details/${ensayoId}?_=${new Date().getTime()}`,
          { headers }
        );
        const data = detailsRes.data;
        if (!data) throw new Error("Ensayo no encontrado");
        if (ignore) return;

        setEnsayoDetails(data);

        let formDataObject = data.datos_ensayo || {};
        if (typeof formDataObject === "string") {
          try {
            formDataObject = JSON.parse(formDataObject);
          } catch (e) {
            formDataObject = {};
          }
        }
        setFormData(formDataObject);

        // 2. Obtener la configuración del tipo de ensayo
        if (data.tipo_ensayo) {
          const configRes = await axios.get(
            `${API_URL}/api/config/ensayo-tipos/${data.tipo_ensayo}`,
            { headers }
          );
          if (ignore) return;
          const cfg = configRes.data;
          
          console.log("[DEBUG PDF] --- CARGANDO CONFIGURACIONES DE DB ---");
          console.log("[DEBUG PDF] tableConfig:", cfg.tableConfig);
          console.log("[DEBUG PDF] graficosConfig:", cfg.graficosConfig);
          console.log("[DEBUG PDF] reportConfig:", data.config_reporte_pdf || cfg.reportConfig || cfg.config_reporte_pdf);
          console.log("[DEBUG PDF] formData:", formDataObject);

          setTableConfig(cfg.tableConfig);
          setGraficosConfig(cfg.graficosConfig);
          
          // Soporta múltiples variantes de asignación de reportConfig de la base de datos
          setReportConfig(data.config_reporte_pdf || cfg.reportConfig || cfg.config_reporte_pdf);

          // 3. Ejecutar los cálculos en caliente para garantizar la fidelidad absoluta de resultados
          if (cfg.calculationConfig && formDataObject) {
            setCalculating(true);
            try {
              const normalizedData = { ...formDataObject };
              if (!normalizedData.tables) {
                normalizedData.tables = { ...formDataObject };
              }
              const calculatedRes = calcularResultados(cfg.calculationConfig, normalizedData);
              console.log("[DEBUG PDF] RESULTADOS CALCULADOS AL VUELO:", calculatedRes);
              setResultados(calculatedRes || {});
            } catch (err) {
              console.error("Error al recalcular en reporte:", err);
              console.log("[DEBUG PDF] FALLARON CALCULOS, USANDO RESULTADOS DE DB:", data.resultado);
              setResultados(data.resultado || {});
            } finally {
              setCalculating(false);
            }
          } else {
            console.log("[DEBUG PDF] NO HAY CALCULATION CONFIG, USANDO RESULTADOS DE DB:", data.resultado);
            setResultados(data.resultado || {});
          }
        }
      } catch (err) {
        console.error("Error al cargar datos del reporte:", err);
        if (!ignore) {
          setError("Error al recuperar la información del ensayo.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      ignore = true;
    };
  }, [ensayoId, API_URL, getAuthHeaders]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="reporte-loading-screen">
        <div className="spinner"></div>
        <p>Generando vista de impresión de alta fidelidad...</p>
      </div>
    );
  }

  if (error || !ensayoDetails) {
    return (
      <div className="reporte-error-container">
        <h3><i className="fas fa-exclamation-triangle"></i> Error</h3>
        <p>{error || "No se pudieron cargar los detalles del ensayo."}</p>
        <button onClick={() => window.close()} className="btn btn-secondary">Cerrar Pestaña</button>
      </div>
    );
  }

  // Helper para buscar de forma flexible dot-notation en formData, resultados o metadatos
  const getSourceValue = (source, format) => {
    if (!source) return "N/A";
    
    let val = null;

    if (source.startsWith("formData.")) {
      const cleanPath = source.replace("formData.", "");
      val = getNested(formData, cleanPath, null);
    } else if (source.startsWith("resultados.")) {
      const cleanPath = source.replace("resultados.", "");
      val = getNested(resultados, cleanPath, null);
    } else {
      // Intentar en metadatos del ensayo
      val = getNested(ensayoDetails, source, null);
      
      // Intentar en resultados
      if (val === null || val === undefined || val === "") {
        val = getNested(resultados, source, null);
      }
      
      // Intentar en formData
      if (val === null || val === undefined || val === "") {
        val = getNested(formData, source, null);
      }
    }

    if (val === null || val === undefined || val === "") {
      if (source === "profundidad") {
        const min = ensayoDetails.estrato_profundidad_min ?? "0.00";
        const max = ensayoDetails.estrato_profundidad_max ?? "0.00";
        return `${Number(min).toFixed(2)} - ${Number(max).toFixed(2)} m`;
      }
      return "N/A";
    }

    if (format === "progresiva") {
      return formatProgresiva(val);
    }
    if (format === "fecha") {
      return formatFechaEsp(val);
    }

    if (typeof val === "number" || (!isNaN(Number(val)) && String(val).trim() !== "")) {
      if (format !== undefined && format !== null) {
        const decimals = String(format).includes(".") ? String(format).split(".")[1].length : 0;
        return Number(val).toFixed(decimals);
      }
    }
    return val;
  };

  // Coordenadas dinámicas de respaldo
  let coordE = "N/A";
  let coordN = "N/A";
  if (ensayoDetails.coordenadas) {
    const coords = String(ensayoDetails.coordenadas);
    const matchE = coords.match(/E:\s*(\d+(\.\d+)?)/i);
    const matchN = coords.match(/N:\s*(\d+(\.\d+)?)/i);
    if (matchE) coordE = matchE[1];
    if (matchN) coordN = matchN[1];
  } else if (ensayoDetails.longitud && ensayoDetails.latitud) {
    coordE = Number(ensayoDetails.longitud).toFixed(6);
    coordN = Number(ensayoDetails.latitud).toFixed(6);
  }

  // --- RENDERS DE COMPONENTES DINÁMICOS DE REPORTES ---

  // Renderizado dinámico de Metadatos
  const renderMetadata = (fields) => {
    if (!fields) {
      // Fallback genérico inteligente de alta calidad basado en campos reales
      return (
        <table className="table-metadata">
          <tbody>
            <tr>
              <td className="meta-label" style={{ width: "12%" }}>Proyecto:</td>
              <td className="meta-value value-highlight" colSpan="7">
                {ensayoDetails.proyecto_nombre || "ESTUDIO DE MECÁNICA DE SUELOS"}
              </td>
            </tr>
            <tr>
              <td className="meta-label">Ubicación:</td>
              <td className="meta-sublabel" style={{ width: "8%" }}>Lugar:</td>
              <td className="meta-value" style={{ width: "20%" }}>{ensayoDetails.tramo_nombre || "N/A"}</td>
              <td className="meta-sublabel" style={{ width: "8%" }}>Distrito:</td>
              <td className="meta-value" style={{ width: "15%" }}>{ensayoDetails.distrito || "N/A"}</td>
              <td className="meta-sublabel" style={{ width: "8%" }}>Provincia:</td>
              <td className="meta-value" style={{ width: "15%" }}>{ensayoDetails.provincia || "N/A"}</td>
              <td className="meta-sublabel" style={{ width: "8%" }}>Dpto:</td>
              <td className="meta-value">{ensayoDetails.departamento || "N/A"}</td>
            </tr>
            <tr>
              <td className="meta-label">Solicitante:</td>
              <td className="meta-value" colSpan="3">{ensayoDetails.solicitante || "GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES"}</td>
              <td className="meta-label" colSpan="2">Coordenadas:</td>
              <td className="meta-value" colSpan="2" style={{ fontWeight: "600" }}>E: {coordE} | N: {coordN}</td>
            </tr>
            <tr>
              <td className="meta-label" rowSpan="2">Datos de la muestra:</td>
              <td className="meta-sublabel">Exploración:</td>
              <td className="meta-value">{ensayoDetails.calicata || "C-1"}</td>
              <td className="meta-sublabel">Progresiva:</td>
              <td className="meta-value">{formatProgresiva(ensayoDetails.progresiva_codigo)}</td>
              <td className="meta-sublabel">Estrato:</td>
              <td className="meta-value">{ensayoDetails.estrato_orden || "E-1"}</td>
              <td className="meta-sublabel">Lado:</td>
              <td className="meta-value">{ensayoDetails.lado || "N/A"}</td>
            </tr>
            <tr>
              <td className="meta-sublabel">Profundidad:</td>
              <td className="meta-value" colSpan="3">{ensayoDetails.estrato_profundidad_min ?? "0.00"} - {ensayoDetails.estrato_profundidad_max ?? "1.00"} m</td>
              <td className="meta-sublabel" colSpan="2">Fecha Muestreo:</td>
              <td className="meta-value" colSpan="2">{formatFechaEsp(ensayoDetails.fecha_muestreo || ensayoDetails.fecha || ensayoDetails.created_at)}</td>
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <table className="table-metadata">
        <tbody>
          {fields.map((field, idx) => {
            if (field.fields) {
              return (
                <tr key={idx}>
                  <td className="meta-label" style={{ width: "12%" }}>{field.label}:</td>
                  {field.fields.map((sub, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <td className="meta-sublabel" style={{ width: "8%" }}>{sub.sublabel}:</td>
                      <td className="meta-value" style={{ width: sub.width }}>
                        {getSourceValue(sub.source, sub.format)}
                      </td>
                    </React.Fragment>
                  ))}
                  {field.fields.length < 3 && <td colSpan={(3 - field.fields.length) * 2}></td>}
                </tr>
              );
            } else {
              return (
                <tr key={idx}>
                  <td className="meta-label" style={{ width: "12%" }}>{field.label}:</td>
                  <td 
                    className={`meta-value ${field.highlight ? "value-highlight" : ""}`} 
                    colSpan={field.colSpan || 7}
                  >
                    {getSourceValue(field.source, field.format)}
                  </td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    );
  };

  // Helper para particionar arrays (usado por table_pesos)
  const chunkArray = (arr, size) => {
    if (!arr) return [];
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  // Renderizador dinámico y universal para CUALQUIER tabla técnica del sistema
  const renderTableGeneric = (comp, key) => {
    const sourceTable = comp.sourceTable;
    let tblCfg;
    if (Array.isArray(tableConfig?.tables)) {
      tblCfg = tableConfig.tables.find(t => t.table_key === sourceTable || t.key === sourceTable);
    } else {
      tblCfg = tableConfig?.tables?.[sourceTable];
    }
    
    if (!tblCfg) {
      return (
        <div key={key} className="reporte-error-msg" style={{ fontSize: "10px", color: "#e11d48", padding: "10px", border: "1px dashed #f43f5e", margin: "10px 0" }}>
          <i className="fas fa-exclamation-circle"></i> Cargando estructura de tabla: <strong>{sourceTable}</strong>...
        </div>
      );
    }

    const rawHeaders = tblCfg.headers || [];
    const rows = tblCfg.rows || [];
    const isTransposed = tblCfg.transposed || false;
    const headerGroups = tblCfg.header_groups || [];

    // Filtrar headers que ya estén definidos en campos del grupo 'fields' superior
    const fieldKeys = new Set((tblCfg.fields || []).map(f => f.key));
    const headers = rawHeaders.filter(h => !fieldKeys.has(h.key));

    const groupedSecondRowHeaders = (() => {
      if (isTransposed || headerGroups.length === 0) return headers;

      const secondRow = [];
      let headerIndex = 0;

      headerGroups.forEach((group) => {
        const span = group.colspan || 1;
        const groupHeaders = headers.slice(headerIndex, headerIndex + span);
        if ((group.rowspan || 1) === 1) {
          secondRow.push(...groupHeaders);
        }
        headerIndex += span;
      });

      if (headerIndex < headers.length) {
        secondRow.push(...headers.slice(headerIndex));
      }

      return secondRow;
    })();

    // Extraedor de valor y formato de celda de sólo lectura
    const renderCellStatic = (cellConfig, rowData) => {
      const { type, digits } = cellConfig;
      const override = rowData.cell_overrides ? rowData.cell_overrides[cellConfig.key] : null;
      const finalType = override?.type || type;
      const finalDigits = override?.digits ?? digits;

      const rowKey = rowData?.key || rowData?.id;
      const colKey = cellConfig.key;

      if (finalType === 'static') {
        return isTransposed ? rowData.label : rowData[colKey];
      }

      if (finalType === 'input') {
        const tableKey = tblCfg.key || sourceTable;
        const fieldName = `tables.${tableKey}.${rowKey}.${colKey}`;
        const val = getNested(formData, fieldName, '');
        
        if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) {
          return Number(val).toFixed(Number.isInteger(finalDigits) ? finalDigits : 2);
        }
        return val;
      }

      if (finalType === 'calculated') {
        const resultConfig = override?.result_config || cellConfig.result_config;
        if (!resultConfig || !resultConfig.path) return "-";
        
        const { path: resultPath } = resultConfig;
        const finalResultKey = resultPath.replace('{row_key}', rowKey);
        
        // Buscar el valor en base a dot-notation en resultados
        const val = getNested(resultados, finalResultKey, null);

        if (val !== null && val !== undefined && val !== "") {
          if (typeof val === 'number' && isFinite(val)) {
            return val.toFixed(Number.isInteger(finalDigits) ? finalDigits : 2);
          }
          if (typeof val === 'object' && val.error) {
            return "-";
          }
          return val;
        }
        return "-";
      }

      return null;
    };

    return (
      <div key={key} className="table-generic-wrapper" style={{ marginBottom: "10px" }}>
        {/* Renderizado de Campos de Cabecera Específicos de la Tabla (si existen) */}
        {tblCfg.fields && tblCfg.fields.length > 0 && (
          <div className="pesos-assay-container" style={{ marginBottom: "6px", padding: "4px 8px" }}>
            <table className="table-pesos" style={{ width: "100%" }}>
              <tbody>
                {chunkArray(tblCfg.fields, 2).map((rowFields, rIdx) => (
                  <tr key={rIdx}>
                    {rowFields.map((field, fIdx) => {
                      const fieldName = `tables.${tblCfg.key || sourceTable}.${field.key}`;
                      const rawVal = getNested(formData, fieldName, '');
                      let val = rawVal;
                      if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val)) && field.type === 'number') {
                        const step = field.input_config?.step || "0.01";
                        const dec = step.includes('.') ? step.split('.')[1].length : 2;
                        val = Number(val).toFixed(dec);
                      }
                      return (
                        <React.Fragment key={fIdx}>
                          <td className="peso-lbl" style={{ fontSize: "8.5px" }}>{field.label}:</td>
                          <td className="peso-val" style={{ fontSize: "8.5px", fontWeight: "700", textAlign: "right", paddingRight: "10px" }}>{val}</td>
                        </React.Fragment>
                      );
                    })}
                    {rowFields.length === 1 && <td colSpan="2"></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabla física reutilizando los estilos refinados de .table-tamices */}
        <table className="table-tamices" style={{ width: "100%" }}>
          <thead>
            {isTransposed ? (
              <tr>
                <th style={{ backgroundColor: "var(--cusco-blue-light)", color: "var(--cusco-blue-dark)" }}>
                  {tblCfg.transposed_header_label || 'Propiedad'}
                </th>
                {rows.map(row => (
                  <th key={row.id || row.key} style={{ backgroundColor: "var(--cusco-blue-light)", color: "var(--cusco-blue-dark)" }}>
                    {row.label || `Muestra ${row.id}`}
                  </th>
                ))}
              </tr>
            ) : (
              <>
                {headerGroups.length > 0 && (
                  <tr>
                    {headerGroups.map((group, index) => (
                      <th
                        key={`${group.label || 'group'}-${index}`}
                        colSpan={group.colspan || 1}
                        rowSpan={group.rowspan || 1}
                        className={group.className || ''}
                        style={{ backgroundColor: "var(--cusco-blue-light)", color: "var(--cusco-blue-dark)" }}
                      >
                        {group.label}
                      </th>
                    ))}
                  </tr>
                )}
                <tr>
                  {groupedSecondRowHeaders.map(header => (
                    <th key={header.key} style={{ width: header.width, backgroundColor: "var(--cusco-blue-light)", color: "var(--cusco-blue-dark)" }}>
                      {header.label}
                    </th>
                  ))}
                </tr>
              </>
            )}
          </thead>
          <tbody>
            {isTransposed ? (
              headers.map(header => {
                const headerKey = header.key;
                return (
                  <tr key={headerKey}>
                    <td className="tamiz-name" style={{ backgroundColor: "#fbfcfd", padding: "2.5px 6px" }}>{header.label}</td>
                    {rows.map(row => (
                      <td key={`${headerKey}-${row.id || row.key}`} className="tamiz-val align-right" style={{ padding: "2.5px 6px" }}>
                        {renderCellStatic(header, row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              rows.map(row => {
                const rowKey = row.key || row.id;
                return (
                  <tr key={rowKey} className={rowKey === "pass_200" || rowKey === "total" ? "row-special" : ""}>
                    {headers.map(header => (
                      <td 
                        key={`${rowKey}-${header.key}`} 
                        className={`tamiz-val ${header.key === "label" || header.key === "tamiz" ? "tamiz-name" : "align-right"}`}
                        style={{ padding: "2.5px 6px" }}
                      >
                        {renderCellStatic(header, row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizado dinámico del Bloque de Clasificación SUCS/AASHTO
  const renderClassificationBlock = (blockConfig) => {
    if (!blockConfig) return null;

    const { subtables, finalClassification } = blockConfig;

    return (
      <section className="reporte-classification-block">
        <div className="grid-classification-subtables">
          {subtables.map((subtable, sIdx) => (
            <div key={sIdx} className="subtable-wrapper">
              <div className="subtable-title">{subtable.title}</div>
              <table className="table-class-res">
                <thead>
                  <tr>
                    {subtable.fields.map((f, fIdx) => (
                      <th key={fIdx}>{f.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {subtable.fields.map((f, fIdx) => (
                      <td key={fIdx}>{getSourceValue(f.source, f.format)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {finalClassification && (
          <>
            <div className="final-classification-banner">
              {finalClassification.banner || "Clasificación General del Suelo"}
            </div>
            <table className="table-final-results">
              <tbody>
                {finalClassification.results && (
                  <tr>
                    {finalClassification.results.map((res, rIdx) => (
                      <React.Fragment key={rIdx}>
                        <td className="lbl-f">{res.label}</td>
                        <td className="val-f val-bold">{getSourceValue(res.source, res.format)}</td>
                      </React.Fragment>
                    ))}
                  </tr>
                )}
                {finalClassification.coefficients && (
                  <>
                    <tr>
                      {finalClassification.coefficients.map((coef, cIdx) => (
                        <td key={cIdx} className="lbl-f-sm">{coef.label}</td>
                      ))}
                    </tr>
                    <tr>
                      {finalClassification.coefficients.map((coef, cIdx) => (
                        <td key={cIdx} className="val-f-sm">{getSourceValue(coef.source, coef.format)}</td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
    );
  };

  // Orquestador dinámico de Renderizado de Componentes por Layout
  const renderComponent = (comp, key) => {
    switch (comp.type) {
      case "section_title":
        return (
          <div key={key} className="section-title-banner" style={{ textAlign: comp.align || "left" }}>
            {comp.text}
          </div>
        );

      case "grid":
        return (
          <div key={key} className="reporte-grid-dinamico" style={{ display: "flex", gap: comp.gap || "10px", width: "100%", marginBottom: "10px" }}>
            {comp.columns.map((col, cIdx) => (
              <div key={cIdx} className="reporte-col-dinamica" style={{ width: col.width }}>
                {col.components.map((childComp, childIdx) => renderComponent(childComp, `${key}-${cIdx}-${childIdx}`))}
              </div>
            ))}
          </div>
        );

      case "table_pesos":
        return (
          <div key={key} className="pesos-assay-container">
            {comp.title && <div className="pesos-title">{comp.title}</div>}
            <table className="table-pesos">
              <tbody>
                {chunkArray(comp.fields, 2).map((rowFields, rIdx) => (
                  <tr key={rIdx}>
                    {rowFields.map((f, fIdx) => (
                      <React.Fragment key={fIdx}>
                        <td className="peso-lbl">{f.label}</td>
                        <td className={f.highlight ? "peso-val-highlight" : "peso-val"}>
                          {getSourceValue(f.source, f.format)}{f.suffix || ""}
                        </td>
                      </React.Fragment>
                    ))}
                    {rowFields.length === 1 && <td colSpan="2"></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "table_tamices":
      case "table_generic":
        return renderTableGeneric(comp, key);

      case "chart":
        return (
          <div key={key} className="reporte-chart-container-wrapper" style={{ height: comp.height || "60mm", margin: "4px 0", width: "100%" }}>
            {comp.title && <div className="chart-header-title">{comp.title}</div>}
            <div className="reporte-chart-body" style={{ width: "100%", height: "calc(100% - 24px)" }}>
              <VisorGraficos
                graficosConfig={graficosConfig}
                resultados={resultados}
                formData={formData}
                tableConfig={tableConfig}
                isPrintMode={true}
                targetChartId={comp.chartConfigKey || comp.id}
              />
            </div>
          </div>
        );

      case "table_static":
        return (
          <div key={key} className="table-generic-wrapper" style={{ marginBottom: "10px" }}>
            {comp.title && (
              <div className="section-title-banner" style={{ textAlign: "center", marginBottom: "4px" }}>
                {comp.title}
              </div>
            )}
            <table className="table-tamices" style={{ width: "100%" }}>
              {comp.headers && (
                <thead>
                  <tr>
                    {comp.headers.map((h, hIdx) => (
                      <th 
                        key={hIdx} 
                        style={{ 
                          backgroundColor: "var(--cusco-blue-light)", 
                          color: "var(--cusco-blue-dark)",
                          width: comp.widths ? comp.widths[hIdx] : "auto"
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {comp.rows && comp.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td 
                        key={cIdx} 
                        className={cIdx === 0 ? "tamiz-name" : "tamiz-val"}
                        style={{ 
                          padding: "2.5px 6px", 
                          textAlign: cIdx === 0 ? "left" : "right"
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );



      default:
        return null;
    }
  };

  // Helper de Autogeneración inteligente de layout secuencial si no viene de base de datos
  const getAutogeneratedLayout = () => {
    if (!tableConfig?.tables) return null;
    const comps = [];
    Object.keys(tableConfig.tables).forEach((tableKey) => {
      const tbl = tableConfig.tables[tableKey];
      comps.push({
        type: "section_title",
        text: tbl.title || tbl.label || tableKey.replace(/_/g, " ").toUpperCase()
      });
      comps.push({
        type: "table_generic",
        sourceTable: tableKey
      });
    });
    return {
      type: "sequential",
      components: comps
    };
  };

  const pages = reportConfig?.pages || [{
    document: reportConfig?.document,
    header: reportConfig?.header,
    metadataFields: reportConfig?.metadataFields,
    layout: reportConfig?.layout || getAutogeneratedLayout(),
    classificationBlock: reportConfig?.classificationBlock,
    charts: reportConfig?.charts,
    signatures: reportConfig?.signatures
  }];

  return (
    <div className="reporte-a4-page-container">
      {/* Botones de acción flotantes (ocultos al imprimir) */}
      <div className="reporte-action-bar no-print">
        <button onClick={() => window.close()} className="btn-reporte btn-danger-reporte">
          <i className="fas fa-times"></i> Cerrar
        </button>
        <button onClick={handlePrint} className="btn-reporte btn-success-reporte">
          <i className="fas fa-print"></i> Imprimir / Guardar PDF
        </button>
      </div>

      {pages.map((page, pageIndex) => {
        const currentHeader = page.header || reportConfig?.header;
        const currentMetadata = page.metadataFields || reportConfig?.metadataFields;
        const currentSignatures = page.signatures || reportConfig?.signatures;

        return (
          <div key={pageIndex} className="reporte-a4-sheet" style={{ pageBreakAfter: "always" }}>
            {/* ENCABEZADO OFICIAL DINÁMICO */}
            <header className="reporte-header-container">
              <div className="header-logo-left">
                {currentHeader?.logo_left_url && (
                  <img src={currentHeader.logo_left_url} alt="Logo" className="svg-logo" />
                )}
              </div>
              
              <div className="header-text-center">
                {currentHeader?.title && <h1>{currentHeader.title}</h1>}
                {currentHeader?.subtitle && <h2>{currentHeader.subtitle}</h2>}
                {currentHeader?.subsubtitle && <h3>{currentHeader.subsubtitle}</h3>}
                {currentHeader?.department && <h4>{currentHeader.department}</h4>}
                {currentHeader?.laboratory && <h5>{currentHeader.laboratory}</h5>}
                {currentHeader?.slogan && <p className="header-slogan">{currentHeader.slogan}</p>}
              </div>

              <div className="header-logo-right">
                {currentHeader?.logo_right_url && (
                  <img src={currentHeader.logo_right_url} alt="Logo Derecho" className="svg-logo" />
                )}
              </div>
            </header>

            {/* FRANJA DE CÓDIGO */}
            {(!page.hideCodeBanner && !reportConfig?.hideCodeBanner) && (
              <div className="reporte-code-banner">
                <div className="code-label">{page.codeBannerLabel || reportConfig?.codeBannerLabel || "CÓDIGO"}</div>
                <div className="code-value">{ensayoDetails.codigo_ensayo || ensayoDetails.codigo_generado || `ENS-${ensayoDetails.id}`}</div>
              </div>
            )}

            {/* FICHA TÉCNICA - DATOS DEL PROYECTO Y MUESTRA */}
            <section className="reporte-metadata-section">
              {renderMetadata(currentMetadata)}
            </section>

            {/* CONTENIDO PRINCIPAL DEL ENSAYO */}
            <main className="reporte-main-content">
              {page.layout ? (
                page.layout.type === "grid" ? (
                  <div className="reporte-grid-dinamico" style={{ display: "flex", gap: "10px" }}>
                    {page.layout.columns.map((col, cIdx) => (
                      <div key={cIdx} className="reporte-col-dinamica" style={{ width: col.width }}>
                        {col.components.map((comp, compIdx) => renderComponent(comp, `${pageIndex}-${cIdx}-${compIdx}`))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reporte-secuencial-dinamico">
                    {page.layout.components.map((comp, compIdx) => renderComponent(comp, `${pageIndex}-${compIdx}`))}
                  </div>
                )
              ) : (
                (!page.classificationBlock && (!page.charts || page.charts.length === 0)) && (
                  <div className="reporte-error-msg" style={{ textAlign: "center", padding: "30px", border: "1px dashed var(--cusco-gray-light)" }}>
                    No se ha podido estructurar el diseño de visualización para esta página.
                  </div>
                )
              )}

              {/* TABLAS DE CLASIFICACIÓN AASHTO, SUCS Y COEFICIENTES */}
              {renderClassificationBlock(page.classificationBlock)}

              {/* GRÁFICOS DINÁMICOS */}
              {page.charts && graficosConfig && (
                <div className="reporte-charts-grid" style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  {page.charts.map((chart, chartIdx) => {
                    if (chart.position === "after_layout") {
                      return (
                        <section 
                          key={chartIdx} 
                          className="reporte-chart-container-wrapper" 
                          style={{ 
                            height: chart.height || "60mm", 
                            flex: 1,
                            marginTop: "0px"
                          }}
                        >
                          <div className="chart-header-title">
                            {String(chart.title || chart.chartConfigKey).replace(/_/g, " ").toUpperCase()}
                          </div>
                          <div className="reporte-chart-body">
                            <VisorGraficos
                              graficosConfig={graficosConfig}
                              resultados={resultados}
                              formData={formData}
                              tableConfig={tableConfig}
                              isPrintMode={true}
                              targetChartId={chart.chartConfigKey}
                              scope={chart.scope || "group"}
                              groupEnsayos={[{
                                id: ensayoDetails?.id || "print-1",
                                datos_formulario: formData,
                                resultado: resultados
                              }]}
                            />
                          </div>
                        </section>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </main>

            {/* PIE DE PÁGINA: OBSERVACIONES Y FIRMAS */}
            <footer className="reporte-footer-container">
              {currentMetadata?.observations && (
                <div className="reporte-observaciones">
                  <div className="obs-title">{currentMetadata.observations.label || "Observaciones :"}</div>
                  <div className="obs-text">{formData.observaciones || currentMetadata.observations.fallback || ""}</div>
                </div>
              )}

              <div className="reporte-firmas-grid">
                {currentSignatures && currentSignatures.map((sig, sIdx) => (
                  <div key={sIdx} className="firma-box">
                    <div className="firma-line"></div>
                    <div className="firma-cargo">{sig.role}</div>
                    <div className="firma-subtext">{sig.nameLabel || "NOMBRE:"} __________________________________</div>
                    <div className="firma-subtext">{sig.signatureLabel || "FIRMA:"} ___________________________________</div>
                  </div>
                ))}
              </div>
            </footer>
          </div>
        );
      })}
    </div>
  );
}
