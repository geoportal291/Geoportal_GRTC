import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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

export default function EnsayoReporteImprimible() {
  const { ensayoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ensayoDetails, setEnsayoDetails] = useState(null);
  const [tableConfig, setTableConfig] = useState(null);
  const [graficosConfig, setGraficosConfig] = useState(null);
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
          
          setTableConfig(cfg.tableConfig);
          setGraficosConfig(cfg.graficosConfig);

          // 3. Ejecutar los cálculos en caliente para garantizar la fidelidad absoluta
          if (cfg.calculationConfig && formDataObject) {
            setCalculating(true);
            try {
              // Normalizar formData para el motor de cálculo
              const normalizedData = { ...formDataObject };
              if (!normalizedData.tables) {
                normalizedData.tables = { ...formDataObject };
              }
              const calculatedRes = calcularResultados(cfg.calculationConfig, normalizedData);
              setResultados(calculatedRes || {});
            } catch (err) {
              console.error("Error al recalcular en reporte:", err);
              setResultados(data.resultado || {});
            } finally {
              setCalculating(false);
            }
          } else {
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

  // Extraer valores para facilitar maquetación
  const hasGranulometria = ensayoDetails.tipo_ensayo === "granulometria" || 
                           String(ensayoDetails.tipo_ensayo_nombre).toLowerCase().includes("granulo");

  // Obtener mallas e iterar dinámicamente
  const granulometriaTableDef = tableConfig?.tables?.granulometria || {};
  const mallasRows = granulometriaTableDef?.rows || [];
  const granulometriaData = formData?.tables?.granulometria || formData?.granulometria || {};

  // Formatear coordenadas
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

      <div className="reporte-a4-sheet">
        {/* ENCABEZADO OFICIAL */}
        <header className="reporte-header-container">
          <div className="header-logo-left">
            {/* Logo GRTC en vector SVG de alta resolución */}
            <svg viewBox="0 0 100 100" className="svg-logo">
              <path d="M10 20 L90 20 L90 35 L50 65 L10 35 Z" fill="#1e3a8a" />
              <path d="M20 30 L80 30 L80 38 L50 60 L20 38 Z" fill="#2563eb" />
              <circle cx="50" cy="45" r="12" fill="#ffffff" />
              <path d="M43 45 L50 35 L57 45 Z" fill="#dc2626" />
              <text x="50" y="85" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">GRTC</text>
            </svg>
          </div>
          
          <div className="header-text-center">
            <h1>GOBIERNO REGIONAL CUSCO</h1>
            <h2>Gerencia Regional de Transportes y Comunicaciones Cusco</h2>
            <h3>SUB GERENCIA DE COBERTURA Y COMUNICACIONES</h3>
            <h4>UNIDAD FUNCIONAL ESTUDIOS Y PROYECTOS</h4>
            <h5>Laboratorio de Mecánica de Suelos, Materiales y Pavimentos</h5>
            <p className="header-slogan">«Año de la recuperación y consolidación de la economía peruana»</p>
          </div>

          <div className="header-logo-right">
            {/* Logo de Cusco en vector SVG */}
            <svg viewBox="0 0 100 100" className="svg-logo">
              <rect x="15" y="15" width="70" height="70" rx="10" fill="#dc2626" />
              <circle cx="50" cy="50" r="25" fill="#facc15" />
              <polygon points="50,30 55,45 70,45 58,55 62,70 50,60 38,70 42,55 30,45 45,45" fill="#ffffff" />
              <text x="50" y="93" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#dc2626">CUSCO</text>
            </svg>
          </div>
        </header>

        {/* FRANJA DE CÓDIGO */}
        <div className="reporte-code-banner">
          <div className="code-label">CÓDIGO</div>
          <div className="code-value">{ensayoDetails.codigo_ensayo || ensayoDetails.codigo_generado || `ENS-${ensayoDetails.id}`}</div>
        </div>

        {/* FICHA TÉCNICA - DATOS DEL PROYECTO Y MUESTRA */}
        <section className="reporte-metadata-section">
          <table className="table-metadata">
            <tbody>
              <tr>
                <td className="meta-label" style={{ width: "12%" }}>Proyecto:</td>
                <td className="meta-value value-highlight" colSpan="7">
                  {ensayoDetails.proyecto_nombre || "MEJORAMIENTO DEL SERVICIO DE TRANSITABILIDAD VIAL INTERURBANA"}
                </td>
              </tr>
              <tr>
                <td className="meta-label">Ubicación:</td>
                <td className="meta-sublabel" style={{ width: "8%" }}>Lugar:</td>
                <td className="meta-value" style={{ width: "20%" }}>{ensayoDetails.tramo_nombre || "grtc a"}</td>
                <td className="meta-sublabel" style={{ width: "8%" }}>Distrito:</td>
                <td className="meta-value" style={{ width: "15%" }}>{ensayoDetails.distrito || "Paccaretambo"}</td>
                <td className="meta-sublabel" style={{ width: "8%" }}>Provincia:</td>
                <td className="meta-value" style={{ width: "15%" }}>{ensayoDetails.provincia || "Paruro"}</td>
                <td className="meta-sublabel" style={{ width: "8%" }}>Dpto:</td>
                <td className="meta-value">{ensayoDetails.departamento || "Cusco"}</td>
              </tr>
              <tr>
                <td className="meta-label">Solicitante:</td>
                <td className="meta-value" colSpan="3">{ensayoDetails.solicitante || "Unidad Funcional de Estudios - GRTC"}</td>
                <td className="meta-label" colSpan="2">Coordenadas:</td>
                <td className="meta-value" colSpan="2" style={{ fontWeight: "600" }}>E: {coordE} | N: {coordN}</td>
              </tr>
              <tr>
                <td className="meta-label" rowSpan="2">Datos de la muestra:</td>
                <td className="meta-sublabel">Exploración:</td>
                <td className="meta-value">{ensayoDetails.calicata || "C-3"}</td>
                <td className="meta-sublabel">Progresiva:</td>
                <td className="meta-value">{formatProgresiva(ensayoDetails.progresiva_codigo)}</td>
                <td className="meta-sublabel">Estrato:</td>
                <td className="meta-value">{ensayoDetails.estrato_orden || "E-1"}</td>
                <td className="meta-sublabel">Lado:</td>
                <td className="meta-value">{ensayoDetails.lado || "Izquierda"}</td>
              </tr>
              <tr>
                <td className="meta-sublabel">Profundidad:</td>
                <td className="meta-value" colSpan="3">{ensayoDetails.estrato_profundidad_min ?? "0.00"} - {ensayoDetails.estrato_profundidad_max ?? "0.15"} m</td>
                <td className="meta-sublabel" colSpan="2">Fecha Muestreo:</td>
                <td className="meta-value" colSpan="2">{formatFechaEsp(ensayoDetails.fecha_muestreo || ensayoDetails.fecha || ensayoDetails.created_at)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* CONTENIDO PRINCIPAL DEL ENSAYO */}
        <main className="reporte-main-content">
          {hasGranulometria ? (
            <div className="reporte-grid-granulometria">
              {/* COLUMNA IZQUIERDA: ENSAYO Y TAMICES */}
              <div className="reporte-col-left">
                <div className="section-title-banner">
                  Granulometría por tamizado - MTC E 107
                </div>

                {/* Sub-bloque de pesos */}
                <div className="pesos-assay-container">
                  <div className="pesos-title">Datos del Ensayo:</div>
                  <table className="table-pesos">
                    <tbody>
                      <tr>
                        <td className="peso-lbl">Peso Total =</td>
                        <td className="peso-val">{formData.peso_total ? Number(formData.peso_total).toFixed(1) : "0.0"} g</td>
                        <td className="peso-lbl">Peso de muestra lavada =</td>
                        <td className="peso-val">{formData.peso_muestra_lavada ? Number(formData.peso_muestra_lavada).toFixed(1) : "0.0"} g</td>
                      </tr>
                      <tr>
                        <td className="peso-lbl">Peso de la Fracción Gruesa =</td>
                        <td className="peso-val">{formData.peso_fraccion_gruesa ? Number(formData.peso_fraccion_gruesa).toFixed(1) : "0.0"} g</td>
                        <td className="peso-lbl">Peso de fracción Fina =</td>
                        <td className="peso-val-highlight">{resultados.peso_fina_calculado ? Number(resultados.peso_fina_calculado).toFixed(1) : "0.0"} g</td>
                      </tr>
                      <tr>
                        <td className="peso-lbl">Peso de la fracción Fina =</td>
                        <td className="peso-val">{formData.peso_fraccion_fina ? Number(formData.peso_fraccion_fina).toFixed(1) : "0.0"} g</td>
                        <td className="peso-lbl">Coeficiente =</td>
                        <td className="peso-val">{resultados.coeficiente ? Number(resultados.coeficiente).toFixed(2) : "0.00"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tabla de Tamices */}
                <table className="table-tamices">
                  <thead>
                    <tr>
                      <th colSpan="2">Malla</th>
                      <th rowSpan="2">Masa<br />(g)</th>
                      <th rowSpan="2">% Ret<br />Parcial</th>
                      <th rowSpan="2">% Ret<br />Acum.</th>
                      <th rowSpan="2">% que<br />Pasa</th>
                      <th rowSpan="2">Especificaciones</th>
                    </tr>
                    <tr>
                      <th>Tamiz</th>
                      <th>mm.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mallasRows.map((row) => {
                      const rowData = granulometriaData[row.key] || {};
                      const masaVal = rowData.masa !== undefined ? Number(rowData.masa).toFixed(2) : "";
                      
                      // Extraer del resultado de cálculos
                      const resRowData = resultados.tables?.granulometria?.[row.key] || {};
                      const retParcial = resRowData.ret_parcial !== undefined ? Number(resRowData.ret_parcial).toFixed(1) : "";
                      const retAcum = resRowData.ret_acum !== undefined ? Number(resRowData.ret_acum).toFixed(1) : "";
                      const porcPasa = resRowData.porc_pasa !== undefined ? Number(resRowData.porc_pasa).toFixed(1) : 
                                       (resRowData.pasa !== undefined ? Number(resRowData.pasa).toFixed(1) : "");

                      return (
                        <tr key={row.key} className={row.key === "pass_200" || row.key === "total" ? "row-special" : ""}>
                          <td className="tamiz-name">{row.label}</td>
                          <td className="tamiz-mm">{row.mm ? Number(row.mm).toFixed(3) : ""}</td>
                          <td className="tamiz-val align-right">{masaVal}</td>
                          <td className="tamiz-val align-right">{retParcial}</td>
                          <td className="tamiz-val align-right">{retAcum}</td>
                          <td className="tamiz-val-pasa align-right">{porcPasa}</td>
                          <td className="tamiz-spec">{rowData.especificacion || ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* COLUMNA DERECHA: TABLA SUCS DE REFERENCIA */}
              <div className="reporte-col-right">
                <div className="section-title-banner text-center">
                  Tabla de clasificación SUCS
                </div>
                <table className="table-sucs-ref">
                  <thead>
                    <tr>
                      <th style={{ width: "20%" }}>Simb</th>
                      <th>NOMBRES TÍPICOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="sucs-simb">GW</td><td className="sucs-desc">Gravas bien graduadas, mezclas grava-arena, pocos finos o sin finos.</td></tr>
                    <tr><td className="sucs-simb">GP</td><td className="sucs-desc">Gravas mal graduadas, mezclas grava-arena, pocos finos o sin finos.</td></tr>
                    <tr><td className="sucs-simb">GM</td><td className="sucs-desc">Gravas limosas, mezclas grava-arena-limo.</td></tr>
                    <tr><td className="sucs-simb">GC</td><td className="sucs-desc">Gravas arcillosas, mezclas grava-arena-arcilla.</td></tr>
                    <tr><td className="sucs-simb">SW</td><td className="sucs-desc">Arenas bien graduadas, arenas con grava, pocos finos o sin finos.</td></tr>
                    <tr><td className="sucs-simb">SP</td><td className="sucs-desc">Arenas mal graduadas, arenas con grava, pocos finos o sin finos.</td></tr>
                    <tr><td className="sucs-simb">SM</td><td className="sucs-desc">Arenas limosas, mezclas de arena y limo.</td></tr>
                    <tr><td className="sucs-simb">SC</td><td className="sucs-desc">Arenas arcillosas, mezclas de arena y arcilla.</td></tr>
                    <tr><td className="sucs-simb">ML</td><td className="sucs-desc">Limos inorgánicos y arenas muy finas, limos limpios, arenas finas, limosas o arcillosas, o limos arcillosos con ligera plasticidad.</td></tr>
                    <tr><td className="sucs-simb">CL</td><td className="sucs-desc">Arcillas inorgánicas de plasticidad baja a media, arcillas con grava, arcillas arenosas, arcillas limosas.</td></tr>
                    <tr><td className="sucs-simb">OL</td><td className="sucs-desc">Limos orgánicos y arcillas orgánicas limosas de baja plasticidad.</td></tr>
                    <tr><td className="sucs-simb">MH</td><td className="sucs-desc">Limos inorgánicos, suelos arenosos finos o limosos con mica o diatomeas, limos elásticos.</td></tr>
                    <tr><td className="sucs-simb">CH</td><td className="sucs-desc">Arcillas inorgánicas de plasticidad alta.</td></tr>
                    <tr><td className="sucs-simb">OH</td><td className="sucs-desc">Arcillas orgánicas de plasticidad media a elevada; limos orgánicos.</td></tr>
                    <tr><td className="sucs-simb">PT</td><td className="sucs-desc">Turba y otros suelos de alto contenido orgánico.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="reporte-non-granulometria">
              <h4>Detalles del Ensayo de Suelos</h4>
              <p>Formato de reporte para este tipo de ensayo en desarrollo.</p>
            </div>
          )}

          {/* TABLAS DE CLASIFICACIÓN AASHTO, SUCS Y COEFICIENTES */}
          {hasGranulometria && (
            <section className="reporte-classification-block">
              <div className="grid-classification-subtables">
                {/* AASHTO */}
                <div className="subtable-wrapper">
                  <div className="subtable-title">Datos para la clasificación AASHTO</div>
                  <table className="table-class-res">
                    <thead>
                      <tr>
                        <th>T.M. Nominal</th>
                        <th>% pasa malla N° 10</th>
                        <th>% pasa malla N° 40</th>
                        <th>% pasa malla N° 200</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{resultados.tm_nominal || "-"}</td>
                        <td>{resultados.pasa_10 !== undefined ? Number(resultados.pasa_10).toFixed(1) : "-"}</td>
                        <td>{resultados.pasa_40 !== undefined ? Number(resultados.pasa_40).toFixed(1) : "-"}</td>
                        <td>{resultados.pasa_200 !== undefined ? Number(resultados.pasa_200).toFixed(1) : "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* SUCS */}
                <div className="subtable-wrapper">
                  <div className="subtable-title">Datos para la clasificación SUCS</div>
                  <table className="table-class-res">
                    <thead>
                      <tr>
                        <th>% Grava</th>
                        <th>% Arena</th>
                        <th>% Finos</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{resultados.porcentaje_grava !== undefined ? Number(resultados.porcentaje_grava).toFixed(1) : "-"}</td>
                        <td>{resultados.porcentaje_arena !== undefined ? Number(resultados.porcentaje_arena).toFixed(1) : "-"}</td>
                        <td>{resultados.porcentaje_finos !== undefined ? Number(resultados.porcentaje_finos).toFixed(1) : "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CLASIFICACIÓN FINAL Y COEFICIENTES */}
              <div className="final-classification-banner">
                ASTM D2487-17 y AASHTO M145-2000
              </div>
              <table className="table-final-results">
                <tbody>
                  <tr>
                    <td className="lbl-f">Clasificación SUCS:</td>
                    <td className="val-f val-bold">{resultados.clasificacion_sucs || resultados.sucs || "N.P."}</td>
                    <td className="lbl-f">Clasificación AASHTO:</td>
                    <td className="val-f val-bold">{resultados.clasificacion_aashto || resultados.aashto || "N.P."}</td>
                  </tr>
                  <tr>
                    <td className="lbl-f-sm">D 10</td>
                    <td className="lbl-f-sm">D 30</td>
                    <td className="lbl-f-sm">D 50</td>
                    <td className="lbl-f-sm">D 60</td>
                    <td className="lbl-f-sm">Cu</td>
                    <td className="lbl-f-sm">Cc</td>
                    <td className="lbl-f-sm">L. L.</td>
                    <td className="lbl-f-sm">I. P.</td>
                  </tr>
                  <tr>
                    <td className="val-f-sm">{resultados.d10 ? Number(resultados.d10).toFixed(2) : "N.P."}</td>
                    <td className="val-f-sm">{resultados.d30 ? Number(resultados.d30).toFixed(2) : "N.P."}</td>
                    <td className="val-f-sm">{resultados.d50 ? Number(resultados.d50).toFixed(2) : "N.P."}</td>
                    <td className="val-f-sm">{resultados.d60 ? Number(resultados.d60).toFixed(2) : "N.P."}</td>
                    <td className="val-f-sm">{resultados.cu ? Number(resultados.cu).toFixed(2) : "N.P."}</td>
                    <td className="val-f-sm">{resultados.cc ? Number(resultados.cc).toFixed(2) : "N.P."}</td>
                    <td className="val-f-sm">{resultados.ll ? Number(resultados.ll).toFixed(0) : "N.P."}</td>
                    <td className="val-f-sm">{resultados.ip ? Number(resultados.ip).toFixed(0) : "N.P."}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* GRÁFICO - CURVA GRANULOMÉTRICA */}
          {hasGranulometria && graficosConfig && (
            <section className="reporte-chart-container-wrapper">
              <div className="chart-header-title">CURVA GRANULOMÉTRICA</div>
              <div className="reporte-chart-body">
                <VisorGraficos
                  graficosConfig={graficosConfig}
                  resultados={resultados}
                  formData={formData}
                  tableConfig={tableConfig}
                  isPrintMode={true}
                />
              </div>
            </section>
          )}
        </main>

        {/* PIE DE PÁGINA: OBSERVACIONES Y FIRMAS */}
        <footer className="reporte-footer-container">
          <div className="reporte-observaciones">
            <div className="obs-title">Observaciones :</div>
            <div className="obs-text">{formData.observaciones || "SIN OBSERVACIONES EXTRA ADICIONALES EN ESTE INFORME."}</div>
          </div>

          <div className="reporte-firmas-grid">
            <div className="firma-box">
              <div className="firma-line"></div>
              <div className="firma-cargo">ESP. ENSAYOS GEOTECNICOS</div>
              <div className="firma-subtext">NOMBRE: __________________________________</div>
              <div className="firma-subtext">FIRMA: ___________________________________</div>
            </div>
            <div className="firma-box">
              <div className="firma-line"></div>
              <div className="firma-cargo">ESP. SUELOS Y PAVIMENTOS</div>
              <div className="firma-subtext">NOMBRE: __________________________________</div>
              <div className="firma-subtext">FIRMA: ___________________________________</div>
            </div>
            <div className="firma-box">
              <div className="firma-line"></div>
              <div className="firma-cargo">SUPERVISOR</div>
              <div className="firma-subtext">NOMBRE: __________________________________</div>
              <div className="firma-subtext">FIRMA: ___________________________________</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
