import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import alertify from "alertifyjs";
import { calcularResultados } from "./ensayos.calculos.js";
import VisorGraficos from "./secciones/VisorGraficos.jsx";
import "./EnsayoReporteImprimible.css";

// Importación de base de datos local de ubigeo para mapeo de alta fidelidad
import departamentosData from "../../../../data/ubigeo/ubigeo_peru_2016_departamentos.json";
import provinciasData from "../../../../data/ubigeo/ubigeo_peru_2016_provincias.json";
import distritosData from "../../../../data/ubigeo/ubigeo_peru_2016_distritos.json";

// Helpers para traducir codigos de ubigeo a nombres legibles
const getDepartmentName = (idOrName) => {
  if (!idOrName) return "N/A";
  const dept = departamentosData.find(d => d.id === idOrName);
  return dept ? dept.name : idOrName;
};

const getProvinceName = (idOrName) => {
  if (!idOrName) return "N/A";
  const prov = provinciasData.find(p => p.id === idOrName);
  return prov ? prov.name : idOrName;
};

const getDistrictName = (idOrName) => {
  if (!idOrName) return "N/A";
  const dist = distritosData.find(d => d.id === idOrName);
  return dist ? dist.name : idOrName;
};

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

// Helper para descomprimir IDs agrupados en rangos (ej. "2251-2253" -> ["2251", "2252", "2253"])
const decompressIds = (compressedStr) => {
  if (!compressedStr) return [];
  const tokens = compressedStr.split(",");
  const ids = [];

  tokens.forEach((token) => {
    if (token.includes("-")) {
      const [start, end] = token.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          ids.push(String(i));
        }
      }
    } else {
      if (token.trim()) {
        ids.push(token.trim());
      }
    }
  });

  return ids;
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
  const [zoom, setZoom] = useState(1.0);

  // Estados para soportar múltiples informes consolidados consecutivamente
  const [consolidadoEnsayos, setConsolidadoEnsayos] = useState([]);
  const [consolidadoConfigs, setConsolidadoConfigs] = useState({});
  const [consolidadoResultados, setConsolidadoResultados] = useState({});
  const [consolidadoFormDatas, setConsolidadoFormDatas] = useState({});

  // Barra lateral, miniaturas y buscador de hojas en caliente
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

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
        const isConsolidado = ensayoId === "consolidado";

        if (isConsolidado) {
          const queryParams = new URLSearchParams(window.location.search);
          const idsStr = queryParams.get("ids") || "";
          const ids = decompressIds(idsStr);

          if (ids.length === 0) {
            throw new Error("No se proporcionaron IDs de ensayo para consolidar.");
          }

          // 1. Obtener detalles de todos los ensayos en paralelo
          const responses = await Promise.all(
            ids.map(id =>
              axios.get(
                `${API_URL}/api/ensayos/details/${id}?_=${new Date().getTime()}`,
                { headers }
              ).catch(err => {
                console.error(`Error al cargar ensayo ${id}:`, err);
                return null;
              })
            )
          );

          const validDetails = responses.filter(r => r && r.data).map(r => r.data);
          if (validDetails.length === 0) {
            throw new Error("No se pudieron cargar detalles de los ensayos proporcionados.");
          }

          setConsolidadoEnsayos(validDetails);
          
          // Fallback global de compatibilidad
          setEnsayoDetails(validDetails[0]);

          // Cargar las configuraciones de cada tipo de ensayo presente
          const uniqueTipos = [...new Set(validDetails.map(d => d.tipo_ensayo).filter(Boolean))];
          const configResponses = await Promise.all(
            uniqueTipos.map(tipo =>
              axios.get(`${API_URL}/api/config/ensayo-tipos/${tipo}`, { headers })
                .then(res => ({ tipo, config: res.data }))
                .catch(err => {
                  console.error(`Error al cargar config para tipo ${tipo}:`, err);
                  return null;
                })
            )
          );

          const configMap = configResponses.filter(Boolean).reduce((acc, c) => {
            acc[c.tipo] = c.config;
            return acc;
          }, {});

          setConsolidadoConfigs(configMap);

          // Establecer fallbacks para el primer elemento
          const firstDetail = validDetails[0];
          const firstCfg = configMap[firstDetail.tipo_ensayo] || {};
          setTableConfig(firstCfg.tableConfig);
          setGraficosConfig(firstCfg.graficosConfig);
          setReportConfig(firstDetail.config_reporte_pdf || firstCfg.reportConfig || firstCfg.config_reporte_pdf);

          // Realizar los cálculos en caliente para cada ensayo en el consolidado
          const calculatedResultsMap = {};
          const parsedFormDataMap = {};

          for (const data of validDetails) {
            let formDataObject = data.datos_ensayo || {};
            if (typeof formDataObject === "string") {
              try {
                formDataObject = JSON.parse(formDataObject);
              } catch (e) {
                formDataObject = {};
              }
            }
            parsedFormDataMap[data.id] = formDataObject;

            const cfg = configMap[data.tipo_ensayo] || {};
            if (cfg.calculationConfig && formDataObject) {
              try {
                const normalizedData = { ...formDataObject };
                if (!normalizedData.tables) {
                  normalizedData.tables = { ...formDataObject };
                }
                const calculatedRes = calcularResultados(cfg.calculationConfig, normalizedData, cfg.tableConfig) || {};
                calculatedResultsMap[data.id] = calculatedRes;
              } catch (err) {
                console.error(`Error recalculando ensayo ${data.id}:`, err);
                calculatedResultsMap[data.id] = data.resultado || {};
              }
            } else {
              calculatedResultsMap[data.id] = data.resultado || {};
            }
          }

          setConsolidadoResultados(calculatedResultsMap);
          setConsolidadoFormDatas(parsedFormDataMap);
          
          if (ignore) return;
        } else {
          // Modo normal (1 solo ensayo)
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
            setReportConfig(data.config_reporte_pdf || cfg.reportConfig || cfg.config_reporte_pdf);

            // 3. Ejecutar los cálculos en caliente
            if (cfg.calculationConfig && formDataObject) {
              setCalculating(true);
              try {
                const normalizedData = { ...formDataObject };
                if (!normalizedData.tables) {
                  normalizedData.tables = { ...formDataObject };
                }
                const calculatedRes = calcularResultados(cfg.calculationConfig, normalizedData, cfg.tableConfig);
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
        }
      } catch (err) {
        console.error("Error al cargar datos del reporte:", err);
        if (!ignore) {
          setError(err.message || "Error al recuperar la información del ensayo.");
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

  // Helper de Autogeneración inteligente de layout secuencial si no viene de base de datos
  const getAutogeneratedLayout = (currentTableConfig = tableConfig) => {
    if (!currentTableConfig?.tables) return null;
    const comps = [];
    Object.keys(currentTableConfig.tables).forEach((tableKey) => {
      const tbl = currentTableConfig.tables[tableKey];
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

  const essaysToRender = ensayoId === "consolidado" ? consolidadoEnsayos : [ensayoDetails];

  const allPagesToRender = [];
  essaysToRender.forEach((ensayo) => {
    if (!ensayo) return;
    const currentCfg = ensayoId === "consolidado" 
      ? (consolidadoConfigs[ensayo.tipo_ensayo] || {})
      : { tableConfig, graficosConfig, reportConfig };
    
    const currentTableConfig = ensayoId === "consolidado" ? currentCfg.tableConfig : tableConfig;
    const currentGraficosConfig = ensayoId === "consolidado" ? currentCfg.graficosConfig : graficosConfig;
    const currentReportConfig = ensayoId === "consolidado" 
      ? (ensayo.config_reporte_pdf || currentCfg.reportConfig || currentCfg.config_reporte_pdf)
      : reportConfig;
    const currentFormData = ensayoId === "consolidado" ? (consolidadoFormDatas[ensayo.id] || {}) : formData;
    const currentResultados = ensayoId === "consolidado" ? (consolidadoResultados[ensayo.id] || {}) : resultados;
    
    const currentPages = currentReportConfig?.pages || [{
      document: currentReportConfig?.document,
      header: currentReportConfig?.header,
      metadataFields: currentReportConfig?.metadataFields,
      layout: currentReportConfig?.layout || getAutogeneratedLayout(currentTableConfig),
      classificationBlock: currentReportConfig?.classificationBlock,
      charts: currentReportConfig?.charts,
      signatures: currentReportConfig?.signatures
    }];

    currentPages.forEach((page, pageIndex) => {
      allPagesToRender.push({
        ensayo,
        page,
        pageIndex,
        totalPages: currentPages.length,
        currentTableConfig,
        currentGraficosConfig,
        currentReportConfig,
        currentFormData,
        currentResultados
      });
    });
  });

  // Buscador de hojas en caliente
  const filteredPages = allPagesToRender.map((item, absoluteIndex) => ({
    ...item,
    absoluteIndex
  })).filter((item) => {
    if (!sidebarSearch) return true;
    const term = sidebarSearch.toLowerCase();
    
    // Buscar en código de ensayo
    const codeMatch = String(item.ensayo.codigo_ensayo || item.ensayo.codigo_generado || "").toLowerCase().includes(term);
    // Buscar en ubicación / progresiva
    const locMatch = String(item.ensayo.progresiva_nombre || item.ensayo.cantera_nombre || "").toLowerCase().includes(term);
    // Buscar en número de página (1-indexed)
    const pageNumMatch = String(item.absoluteIndex + 1).includes(term);
    // Buscar en tipo de ensayo / descripción o nombre del ensayo
    const typeMatch = String(item.ensayo.nombre_ensayo || item.ensayo.tipo_ensayo || "").toLowerCase().includes(term);

    return codeMatch || locMatch || pageNumMatch || typeMatch;
  });

  // Salto de página suave
  const handleJumpToPage = (index) => {
    const element = document.getElementById(`page-sheet-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActivePageIndex(index);
    }
  };

  // Scroll tracker para auto-seleccionar la miniatura correspondiente al scroll manual
  useEffect(() => {
    if (loading || error || allPagesToRender.length === 0) return;

    const handleScroll = () => {
      const sheets = allPagesToRender.map((_, idx) => document.getElementById(`page-sheet-${idx}`));
      let currentActive = 0;
      let minDiff = Infinity;

      sheets.forEach((sheet, idx) => {
        if (!sheet) return;
        const rect = sheet.getBoundingClientRect();
        // Queremos saber cuál hoja está más cerca de la parte superior del viewport
        const diff = Math.abs(rect.top - 80); // Restamos el margen superior de la barra de acciones
        if (diff < minDiff) {
          minDiff = diff;
          currentActive = idx;
        }
      });

      setActivePageIndex(currentActive);
    };

    const container = document.querySelector(".reporte-a4-page-container");
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      // Ejecutar una vez al inicio
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [loading, error, allPagesToRender.length]);


  const handleExportarExcel = async () => {
    if (descargandoExcel) return;
    try {
      setDescargandoExcel(true);
      let solicitante = "";
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (user) {
          solicitante = [user.nombre, user.ap_paterno, user.ap_materno]
            .filter(Boolean).join(" ");
        }
      } catch (e) { /* solicitante opcional */ }
      const resp = await axios.get(
        `${API_URL}/api/ensayos/${ensayoId}/reporte-excel`,
        { responseType: "blob", headers: getAuthHeaders(), params: { solicitante, _: Date.now() } }
      );
      const disp = resp.headers?.["content-disposition"] || "";
      let nombre = `Informe_Excel_${ensayoId}.xlsm`;
      const mUtf8 = disp.match(/filename\*=UTF-8''([^;]+)/i);
      const mSimple = disp.match(/filename="?([^";]+)"?/i);
      if (mUtf8) nombre = decodeURIComponent(mUtf8[1]);
      else if (mSimple) nombre = mSimple[1];
      const url = URL.createObjectURL(
        new Blob([resp.data], { type: resp.headers["content-type"] || "application/octet-stream" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al generar informe Excel:", e);
      let msg = "No se pudo generar el informe Excel.";
      if (e.response?.data instanceof Blob) {
        try {
          const j = JSON.parse(await e.response.data.text());
          if (j.error) msg = `${j.error}${j.details ? `: ${j.details}` : ""}`;
        } catch (_) { /* respuesta no JSON */ }
      }
      alertify.error(msg);
    } finally {
      setDescargandoExcel(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    // Esperar un momento a que React monte todos los gráficos pesados en el DOM antes de disparar la impresión
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
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

  // Coordenadas UTM — directamente desde la base de datos (progresivas.coordenada_este/norte)
  let coordE = "N/A";
  let coordN = "N/A";
  if (ensayoDetails.coordenada_este != null && ensayoDetails.coordenada_este !== "") {
    coordE = Number(ensayoDetails.coordenada_este).toFixed(0);
  } else if (ensayoDetails.coordenadas) {
    const coords = String(ensayoDetails.coordenadas);
    const matchE = coords.match(/E:\s*(\d+(\.\d+)?)/i);
    if (matchE) coordE = matchE[1];
  } else if (ensayoDetails.longitud) {
    coordE = Number(ensayoDetails.longitud).toFixed(6);
  }
  if (ensayoDetails.coordenada_norte != null && ensayoDetails.coordenada_norte !== "") {
    coordN = Number(ensayoDetails.coordenada_norte).toFixed(0);
  } else if (ensayoDetails.coordenadas) {
    const coords = String(ensayoDetails.coordenadas);
    const matchN = coords.match(/N:\s*(\d+(\.\d+)?)/i);
    if (matchN) coordN = matchN[1];
  } else if (ensayoDetails.latitud) {
    coordN = Number(ensayoDetails.latitud).toFixed(6);
  }

  // Helper para buscar de forma flexible dot-notation en formData, resultados o metadatos de un ensayo específico
  const getSourceValue = (source, format, currentEnsayo = ensayoDetails, currentForm = formData, currentRes = resultados) => {
    if (!source) return "N/A";

    // Normalización de alias para compatibilidad retroactiva
    if (typeof source === "string" && source.includes("peso_fina_calculado")) {
      source = source.replace("peso_fina_calculado", "peso_fraccion_fina");
    }

    let val = null;

    if (source === "solicitante") {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          const fullName = `${u.nombre || ""} ${u.ap_paterno || ""} ${u.ap_materno || ""}`.trim();
          if (fullName) return fullName;
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
      val = getNested(currentEnsayo, source, null);
      if (val === null || val === undefined || val === "") {
        val = getNested(currentForm, source, null);
      }
    } else if (source.startsWith("formData.")) {
      const cleanPath = source.replace("formData.", "");
      val = getNested(currentForm, cleanPath, null);
      if (val === null || val === undefined || val === "") {
        val = getNested(currentForm, `general_fields.${cleanPath}`, null);
      }
      if (val === null || val === undefined || val === "") {
        val = getNested(currentRes, cleanPath, null);
      }
      if (val === null || val === undefined || val === "") {
        val = getNested(currentRes, `general_fields.${cleanPath}`, null);
      }
    } else if (source.startsWith("resultados.")) {
      const cleanPath = source.replace("resultados.", "");
      val = getNested(currentRes, cleanPath, null);
      if (val === null || val === undefined || val === "") {
        val = getNested(currentRes, `general_fields.${cleanPath}`, null);
      }
      if (val === null || val === undefined || val === "") {
        val = getNested(currentForm, cleanPath, null);
      }
      if (val === null || val === undefined || val === "") {
        val = getNested(currentForm, `general_fields.${cleanPath}`, null);
      }
    } else {
      // Intentar en metadatos del ensayo
      val = getNested(currentEnsayo, source, null);

      // Intentar en resultados
      if (val === null || val === undefined || val === "") {
        val = getNested(currentRes, source, null);
      }

      // Intentar en resultados.general_fields
      if (val === null || val === undefined || val === "") {
        val = getNested(currentRes, `general_fields.${source}`, null);
      }

      // Intentar en formData
      if (val === null || val === undefined || val === "") {
        val = getNested(currentForm, source, null);
      }

      // Intentar en formData.general_fields
      if (val === null || val === undefined || val === "") {
        val = getNested(currentForm, `general_fields.${source}`, null);
      }
    }

    if (val === null || val === undefined || val === "") {
      if (source === "profundidad") {
        let min = currentEnsayo.estrato_profundidad_min;
        let max = currentEnsayo.estrato_profundidad_max;

        // Fallbacks si es nulo, vacío, o si ambos son cero y tenemos algo en formData o resultados
        if (min === null || min === undefined || (Number(min) === 0 && Number(max) === 0)) {
          const alternativeMin = getNested(currentForm, "profundidad_inicial", null) ||
            getNested(currentForm, "profundidad_min", null) ||
            getNested(currentForm, "cota_inicial", null) ||
            getNested(currentRes, "profundidad_inicial", null) ||
            currentEnsayo.estrato_profundidad_min;

          const alternativeMax = getNested(currentForm, "profundidad_final", null) ||
            getNested(currentForm, "profundidad_max", null) ||
            getNested(currentForm, "cota_final", null) ||
            getNested(currentRes, "profundidad_final", null) ||
            currentEnsayo.estrato_profundidad_max;

          if (alternativeMin !== null && alternativeMin !== undefined && alternativeMin !== "") min = alternativeMin;
          if (alternativeMax !== null && alternativeMax !== undefined && alternativeMax !== "") max = alternativeMax;
        }

        const numMin = (min !== null && min !== undefined && min !== "") ? Number(min) : 0.00;
        const numMax = (max !== null && max !== undefined && max !== "") ? Number(max) : 0.00;

        return `${numMin.toFixed(2)} - ${numMax.toFixed(2)} m`;
      }
      
      // Coordenadas locales para este ensayo específico
      let localE = "N/A";
      let localN = "N/A";
      if (currentEnsayo.coordenada_este != null && currentEnsayo.coordenada_este !== "") {
        localE = Number(currentEnsayo.coordenada_este).toFixed(0);
      } else if (currentEnsayo.coordenadas) {
        const coords = String(currentEnsayo.coordenadas);
        const matchE = coords.match(/E:\s*(\d+(\.\d+)?)/i);
        if (matchE) localE = matchE[1];
      } else if (currentEnsayo.longitud) {
        localE = Number(currentEnsayo.longitud).toFixed(6);
      }
      if (currentEnsayo.coordenada_norte != null && currentEnsayo.coordenada_norte !== "") {
        localN = Number(currentEnsayo.coordenada_norte).toFixed(0);
      } else if (currentEnsayo.coordenadas) {
        const coords = String(currentEnsayo.coordenadas);
        const matchN = coords.match(/N:\s*(\d+(\.\d+)?)/i);
        if (matchN) localN = matchN[1];
      } else if (currentEnsayo.latitud) {
        localN = Number(currentEnsayo.latitud).toFixed(6);
      }

      if (source === "longitud") return localE || "N/A";
      if (source === "latitud") return localN || "N/A";
      
      if (source === "fecha_muestreo") {
        val = currentEnsayo.fecha_muestreo || currentEnsayo.fecha || currentEnsayo.created_at;
        if (!val) return "N/A";
      } else if (source === "calicata" || source === "exploracion") {
        val = currentEnsayo.calicata || currentEnsayo.cantera_codigo || currentEnsayo.progresiva_codigo || "N/A";
        if (!val) return "N/A";
      } else {
        return "N/A";
      }
    }

    // Traducción de códigos de ubigeo al vuelo utilizando el diccionario local
    if (source === "departamento") return getDepartmentName(val);
    if (source === "provincia") return getProvinceName(val);
    if (source === "distrito") return getDistrictName(val);

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

  // --- RENDERS DE COMPONENTES DINÁMICOS DE REPORTES ---

  // Renderizado dinámico de Metadatos
  const renderMetadata = (fields, currentEnsayo = ensayoDetails, currentForm = formData, currentRes = resultados) => {
    if (fields === null || fields === undefined) return null;
    if (Array.isArray(fields) && fields.length === 0) return null;

    // Buscar campos estándar para maquetación inteligente y alineación de alta gama
    const fProyecto = fields.find(f => f.label?.toLowerCase() === "proyecto");
    const fUbicacion = fields.find(f => f.label?.toLowerCase() === "ubicación" || f.label?.toLowerCase() === "ubicacion");
    const fSolicitante = fields.find(f => f.label?.toLowerCase() === "solicitante");
    const fCoordenadas = fields.find(f => f.label?.toLowerCase() === "coordenadas");
    const fMuestra = fields.find(f => f.label?.toLowerCase() === "datos de muestra");
    const fProfundidad = fields.find(f => f.label?.toLowerCase() === "profundidad");
    const fFecha = fields.find(f => f.label?.toLowerCase() === "fecha muestreo" || f.label?.toLowerCase() === "fecha de muestreo");

    // Si tenemos los campos estándar del MTC, renderizamos el Grid Premium perfectamente balanceado
    if (fProyecto || fUbicacion || fSolicitante || fCoordenadas || fMuestra || fProfundidad || fFecha) {
      return (
        <div className="premium-metadata-grid">
          {/* FILA 1: PROYECTO */}
          {fProyecto && (
            <React.Fragment>
              <div className="p-lbl span-2 font-bold">{fProyecto.label}:</div>
              <div className="p-val span-10 font-bold val-highlight">
                {getSourceValue(fProyecto.source, fProyecto.format, currentEnsayo, currentForm, currentRes)}
              </div>
            </React.Fragment>
          )}

          {/* FILA 2: UBICACIÓN */}
          {fUbicacion && fUbicacion.fields && (
            <React.Fragment>
              <div className="p-lbl span-2 font-bold">{fUbicacion.label}:</div>
              <div className="p-grid span-10 location-subgrid">
                {fUbicacion.fields.map((sub, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <div className="p-sublbl">{sub.sublabel}:</div>
                    <div className="p-val">{getSourceValue(sub.source, sub.format, currentEnsayo, currentForm, currentRes)}</div>
                  </React.Fragment>
                ))}
              </div>
            </React.Fragment>
          )}

          {/* FILA 3: SOLICITANTE Y FECHA MUESTREO */}
          {fSolicitante && (
            <React.Fragment>
              <div className="p-lbl span-2 font-bold">{fSolicitante.label}:</div>
              <div className="p-val span-6">
                {getSourceValue(fSolicitante.source, fSolicitante.format, currentEnsayo, currentForm, currentRes)}
              </div>
            </React.Fragment>
          )}
          {fFecha && (
            <React.Fragment>
              <div className="p-lbl span-2 font-bold">{fFecha.label}:</div>
              <div className="p-val span-2">
                {getSourceValue(fFecha.source, fFecha.format, currentEnsayo, currentForm, currentRes)}
              </div>
            </React.Fragment>
          )}
          {!fFecha && fSolicitante && <div className="p-val span-4"></div>}
          {!fSolicitante && fFecha && <div className="p-val span-10"></div>}

          {/* FILA 4: COORDENADAS Y PROFUNDIDAD */}
          {fCoordenadas && fCoordenadas.fields && (
            <React.Fragment>
              <div className="p-lbl span-2 font-bold">{fCoordenadas.label}:</div>
              <div className="p-grid span-6 coords-subgrid">
                {fCoordenadas.fields.map((sub, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <div className="p-sublbl">{sub.sublabel}:</div>
                    <div className="p-val">{getSourceValue(sub.source, sub.format, currentEnsayo, currentForm, currentRes)}</div>
                  </React.Fragment>
                ))}
              </div>
            </React.Fragment>
          )}
          {fProfundidad && (
            <React.Fragment>
              <div className="p-lbl span-2 font-bold">{fProfundidad.label}:</div>
              <div className="p-val span-2">
                {getSourceValue(fProfundidad.source, fProfundidad.format, currentEnsayo, currentForm, currentRes)}
              </div>
            </React.Fragment>
          )}
          {!fProfundidad && fCoordenadas && <div className="p-val span-4"></div>}
          {!fCoordenadas && fProfundidad && <div className="p-val span-10"></div>}

          {/* FILA 5: DATOS DE MUESTRA */}
          {fMuestra && fMuestra.fields && (
            <React.Fragment>
              <div className="p-lbl span-2 font-bold">{fMuestra.label}:</div>
              <div className="p-grid span-10 sample-subgrid">
                {fMuestra.fields.map((sub, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <div className="p-sublbl">{sub.sublabel}:</div>
                    <div className="p-val">{getSourceValue(sub.source, sub.format, currentEnsayo, currentForm, currentRes)}</div>
                  </React.Fragment>
                ))}
              </div>
            </React.Fragment>
          )}
        </div>
      );
    }

    // Fallback dinámico genérico si la estructura difiere de la estándar
    return (
      <div className="premium-metadata-grid dynamic-fallback">
        {fields.map((field, idx) => {
          if (field.fields) {
            return (
              <React.Fragment key={idx}>
                <div className="p-lbl span-2 font-bold">{field.label}:</div>
                <div className="p-grid span-10 dynamic-subgrid" style={{ gridTemplateColumns: `repeat(${field.fields.length * 2}, 1fr)` }}>
                  {field.fields.map((sub, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <div className="p-sublbl">{sub.sublabel}:</div>
                      <div className="p-val">{getSourceValue(sub.source, sub.format, currentEnsayo, currentForm, currentRes)}</div>
                    </React.Fragment>
                  ))}
                </div>
              </React.Fragment>
            );
          } else {
            return (
              <React.Fragment key={idx}>
                <div className="p-lbl span-2 font-bold">{field.label}:</div>
                <div className={`p-val span-10 ${field.highlight ? "val-highlight font-bold" : ""}`}>
                  {getSourceValue(field.source, field.format, currentEnsayo, currentForm, currentRes)}
                </div>
              </React.Fragment>
            );
          }
        })}
      </div>
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
  const renderTableGeneric = (comp, key, currentTableConfig = tableConfig, currentFormData = formData, currentResultados = resultados) => {
    const sourceTable = comp.sourceTable;
    let tblCfg;
    if (Array.isArray(currentTableConfig?.tables)) {
      tblCfg = currentTableConfig.tables.find(t => t.table_key === sourceTable || t.key === sourceTable);
    } else {
      tblCfg = currentTableConfig?.tables?.[sourceTable];
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
        const val = getNested(currentFormData, fieldName, '');

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
        const val = getNested(currentResultados, finalResultKey, null);

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
                      const rawVal = getNested(currentFormData, fieldName, '');
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
  const renderClassificationBlock = (blockConfig, currentEnsayo = ensayoDetails, currentFormData = formData, currentResultados = resultados) => {
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
                      <td key={fIdx}>{getSourceValue(f.source, f.format, currentEnsayo, currentFormData, currentResultados)}</td>
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
                        <td className="val-f val-bold">{getSourceValue(res.source, res.format, currentEnsayo, currentFormData, currentResultados)}</td>
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
                        <td key={cIdx} className="val-f-sm">{getSourceValue(coef.source, coef.format, currentEnsayo, currentFormData, currentResultados)}</td>
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
  const renderComponent = (comp, key, currentEnsayo = ensayoDetails, currentFormData = formData, currentResultados = resultados, currentTableConfig = tableConfig, currentGraficosConfig = graficosConfig, absoluteIdx = 0, isThumbnail = false) => {
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
                {col.components.map((childComp, childIdx) => renderComponent(childComp, `${key}-${cIdx}-${childIdx}`, currentEnsayo, currentFormData, currentResultados, currentTableConfig, currentGraficosConfig, absoluteIdx, isThumbnail))}
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
                          {getSourceValue(f.source, f.format, currentEnsayo, currentFormData, currentResultados)}{f.suffix || ""}
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
        return renderTableGeneric(comp, key, currentTableConfig, currentFormData, currentResultados);

      case "chart":
        if (isThumbnail) {
          return (
            <div key={key} className="reporte-chart-container-wrapper thumbnail-chart-box" style={{ height: comp.height || "60mm", margin: "4px 0", width: "100%" }}>
              {comp.title && <div className="chart-header-title">{comp.title}</div>}
              <div className="mini-chart-vector-preview" style={{ height: "calc(100% - 24px)", position: "relative" }}>
                <svg viewBox="0 0 100 40" className="mini-svg-chart-preview" style={{ width: "100%", height: "100%" }}>
                  <line x1="5" y1="5" x2="5" y2="35" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="5" y1="35" x2="95" y2="35" stroke="#94a3b8" strokeWidth="1" />
                  <path d="M10,32 C30,32 40,8 90,8" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          );
        }
        const shouldRenderInlineChart = isPrinting || Math.abs(absoluteIdx - activePageIndex) <= 2;
        // Determinar el scope correcto: si el chartConfigKey existe en los gráficos single, usar "single";
        // si está en group o si comp.scope está definido explícitamente, respetar eso.
        // El default cambia a "single" porque los gráficos de ensayos individuales (Proctor, etc.) son single.
        const chartScope = comp.scope || "single";
        return (
          <div key={key} className="reporte-chart-container-wrapper" style={{ height: comp.height || "60mm", margin: "4px 0", width: "100%" }}>
            {comp.title && <div className="chart-header-title">{comp.title}</div>}
            <div className="reporte-chart-body" style={{ width: "100%", height: "calc(100% - 24px)" }}>
              {shouldRenderInlineChart ? (
                <VisorGraficos
                  graficosConfig={currentGraficosConfig}
                  resultados={currentResultados}
                  formData={currentFormData}
                  tableConfig={currentTableConfig}
                  isPrintMode={true}
                  targetChartId={comp.chartConfigKey || comp.id}
                  scope={chartScope}
                  groupEnsayos={[{
                    id: currentEnsayo?.id || "print-1",
                    datos_formulario: currentFormData,
                    resultado: currentResultados
                  }]}
                />
              ) : (
                <div className="chart-placeholder">
                  <i className="fas fa-chart-line placeholder-icon"></i>
                  <p>Cargando gráfico...</p>
                </div>
              )}
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

  // Datos calculados y procesados para visualización inyectados arriba

  return (
    <div className="reporte-a4-page-container" style={{ "--reporte-zoom": zoom }}>
      {/* Nuevo contenedor principal para soportar barra lateral (oculto en impresión) */}
      <div className="reporte-workspace-layout">
        
        {/* SIDEBAR DE CONTROL (no-print) */}
        <aside className="reporte-sidebar no-print">
          <div className="sidebar-search-box">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por código, progresiva..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="sidebar-search-input"
            />
          </div>

          <div className="sidebar-thumbnails-list">
            {filteredPages.map((item) => {
              const isSelected = activePageIndex === item.absoluteIndex;
              const {
                ensayo,
                page,
                pageIndex,
                totalPages,
                currentTableConfig,
                currentGraficosConfig,
                currentReportConfig,
                currentFormData,
                currentResultados,
                absoluteIndex
              } = item;

              const isLastPageOfEnsayo = pageIndex === totalPages - 1;
              const currentHeader = page.header || currentReportConfig?.header;
              const currentMetadata = page.metadataFields !== undefined
                ? page.metadataFields
                : (pageIndex === 0 ? currentReportConfig?.metadataFields : null);
              const currentSignatures = page.signatures !== undefined
                ? page.signatures
                : (isLastPageOfEnsayo ? currentReportConfig?.signatures : null);
              const showCodeBanner = !page.hideCodeBanner && (pageIndex === 0 || page.showCodeBanner === true);

              return (
                <div
                  key={absoluteIndex}
                  className={`thumbnail-card-wrapper ${isSelected ? "active" : ""}`}
                  onClick={() => handleJumpToPage(absoluteIndex)}
                >
                  <div className="thumbnail-card">
                    {/* El A4 real miniaturizado con transform scale */}
                    <div className="thumbnail-mini-page-scaled">
                      <div className="reporte-a4-sheet miniature-mode">
                        {/* ENCABEZADO OFICIAL DINÁMICO */}
                        <div className="reporte-header-container">
                          <div className="header-logo-left">
                            {currentHeader?.logo_left_url && (
                              <img src={currentHeader.logo_left_url} alt="Logo" className="svg-logo" />
                            )}
                          </div>
                          <div className="header-text-center">
                            {currentHeader?.title && <h1>{currentHeader.title}</h1>}
                            {currentHeader?.subtitle && <h2>{currentHeader.subtitle}</h2>}
                          </div>
                          <div className="header-logo-right">
                            {currentHeader?.logo_right_url && (
                              <img src={currentHeader.logo_right_url} alt="Logo Derecho" className="svg-logo" />
                            )}
                          </div>
                        </div>

                        {/* FRANJA DE CÓDIGO */}
                        {showCodeBanner && (
                          <div className="reporte-code-banner">
                            <div className="code-label">{page.codeBannerLabel || currentReportConfig?.codeBannerLabel || "CÓDIGO"}</div>
                            <div className="code-value">{ensayo.codigo_ensayo || ensayo.codigo_generado || `ENS-${ensayo.id}`}</div>
                          </div>
                        )}

                        {/* FICHA TÉCNICA */}
                        {currentMetadata != null && (
                          <section className="reporte-metadata-section">
                            {renderMetadata(currentMetadata, ensayo, currentFormData, currentResultados)}
                          </section>
                        )}

                        {/* CONTENIDO PRINCIPAL DEL ENSAYO */}
                        <main className="reporte-main-content">
                          {page.layout ? (
                            page.layout.type === "grid" ? (
                              <div className="reporte-grid-dinamico" style={{ display: "flex", gap: page.layout.gap || "10px", width: "100%" }}>
                                {page.layout.columns.map((col, cIdx) => (
                                  <div key={cIdx} className="reporte-col-dinamica" style={{ width: col.width }}>
                                    {col.components.map((comp, compIdx) => renderComponent(comp, `thumb-${absoluteIndex}-${cIdx}-${compIdx}`, ensayo, currentFormData, currentResultados, currentTableConfig, currentGraficosConfig, absoluteIndex, true))}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              page.layout.components.map((comp, compIdx) => renderComponent(comp, `thumb-${absoluteIndex}-${compIdx}`, ensayo, currentFormData, currentResultados, currentTableConfig, currentGraficosConfig, absoluteIndex, true))
                            )
                          ) : null}
                        </main>

                        {/* FIRMAS DE RESPONSABILIDAD */}
                        {currentSignatures && (
                          <footer className="reporte-signatures-section">
                            <div className="reporte-signatures-grid" style={{ display: "flex", justifyContent: "space-around", gap: "20px", marginTop: "10px" }}>
                              {currentSignatures.map((sig, sIdx) => (
                                <div key={sIdx} className="firma-box" style={{ width: "120px", textAlign: "center" }}>
                                  <div className="firma-line" style={{ borderTop: "1px solid #000", marginTop: "20px" }}></div>
                                  <div className="firma-name" style={{ fontSize: "8px", fontWeight: "bold" }}>{sig.name}</div>
                                  <div className="firma-cargo" style={{ fontSize: "6px" }}>{sig.cargo}</div>
                                </div>
                              ))}
                            </div>
                          </footer>
                        )}
                      </div>
                    </div>
                    {/* Flotante con el número de página */}
                    <span className="thumbnail-page-number">{absoluteIndex + 1}</span>
                  </div>
                  
                  {/* Detalles rápidos de la hoja */}
                  <div className="thumbnail-details">
                    <span className="details-code" title={item.ensayo.codigo_ensayo || item.ensayo.codigo_generado}>
                      {item.ensayo.codigo_ensayo || item.ensayo.codigo_generado || `ENS-${item.ensayo.id}`}
                    </span>
                    <span className="details-loc">
                      {item.ensayo.progresiva_nombre || item.ensayo.cantera_nombre || "Ubicación N/A"}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredPages.length === 0 && (
              <div className="sidebar-empty-state">
                <i className="fas fa-search-minus empty-icon"></i>
                <p>No se encontraron hojas</p>
              </div>
            )}
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <main className="reporte-main-view">
          {/* Botones de acción flotantes (ocultos al imprimir) */}
          <div className="reporte-action-bar no-print">
            <button onClick={() => window.close()} className="btn-reporte-vertical btn-danger-reporte" title="Cerrar pestaña">
              <i className="fas fa-times icon-vertical"></i>
              <span className="text-vertical">Cerrar</span>
            </button>

            {/* Controles de Zoom Premium Vertical */}
            <div className="zoom-controls-wrapper-vertical">
              <button 
                onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))} 
                className="btn-zoom-vertical" 
                title="Aumentar tamaño"
                disabled={zoom >= 2.0}
              >
                <i className="fas fa-plus"></i>
              </button>
              <span className="zoom-value-vertical" onClick={() => setZoom(1.0)} title="Hacer clic para restablecer al 100%">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} 
                className="btn-zoom-vertical" 
                title="Reducir tamaño"
                disabled={zoom <= 0.5}
              >
                <i className="fas fa-minus"></i>
              </button>
            </div>

            <button onClick={handlePrint} className="btn-reporte-vertical btn-success-reporte" title="Imprimir / Guardar PDF">
              <i className="fas fa-print icon-vertical"></i>
              <span className="text-vertical">Imprimir</span>
            </button>

            <button onClick={handleExportarExcel} className="btn-reporte-vertical btn-excel-reporte" title="Descargar informe Excel con macros" disabled={descargandoExcel}>
              <i className={`fas ${descargandoExcel ? "fa-spinner fa-spin" : "fa-file-excel"} icon-vertical`}></i>
              <span className="text-vertical">Excel</span>
            </button>
          </div>

          {/* Área de hojas A4 físicas */}
          <div className="reporte-sheets-scroll-area">
            {allPagesToRender.map((item, idx) => {
              const {
                ensayo,
                page,
                pageIndex,
                totalPages,
                currentTableConfig,
                currentGraficosConfig,
                currentReportConfig,
                currentFormData,
                currentResultados
              } = item;

              const isAbsoluteLastPage = idx === allPagesToRender.length - 1;
              const isLastPageOfEnsayo = pageIndex === totalPages - 1;

              // El header siempre se muestra (fallback global si la página no define uno propio)
              const currentHeader = page.header || currentReportConfig?.header;
              // Los metadatos SOLO se muestran si la página los define explícitamente,
              // O si es la primera página (pageIndex === 0) y están en el config global.
              const currentMetadata = page.metadataFields !== undefined
                ? page.metadataFields
                : (pageIndex === 0 ? currentReportConfig?.metadataFields : null);
              // Las firmas se muestran si la página las define,
              // o si es la ÚLTIMA página y el config global las tiene.
              const currentSignatures = page.signatures !== undefined
                ? page.signatures
                : (isLastPageOfEnsayo ? currentReportConfig?.signatures : null);
              // El código de ensayo solo se muestra en páginas que no lo ocultan explícitamente
              const showCodeBanner = !page.hideCodeBanner && (pageIndex === 0 || page.showCodeBanner === true);

              return (
                <div key={idx} id={`page-sheet-${idx}`} className="reporte-sheet-zoom-box">
                  <div className="reporte-a4-sheet" style={{ pageBreakAfter: isAbsoluteLastPage ? "auto" : "always" }}>
                    {/* ENCABEZADO OFICIAL DINÁMICO */}
                    <div className="reporte-header-container">
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
                    </div>

                    {/* FRANJA DE CÓDIGO - solo en páginas que deben mostrarlo */}
                    {showCodeBanner && (
                      <div className="reporte-code-banner">
                        <div className="code-label">{page.codeBannerLabel || currentReportConfig?.codeBannerLabel || "CÓDIGO"}</div>
                        <div className="code-value">{ensayo.codigo_ensayo || ensayo.codigo_generado || `ENS-${ensayo.id}`}</div>
                      </div>
                    )}

                    {/* FICHA TÉCNICA - DATOS DEL PROYECTO Y MUESTRA */}
                    {currentMetadata != null && (
                      <section className="reporte-metadata-section">
                        {renderMetadata(currentMetadata, ensayo, currentFormData, currentResultados)}
                      </section>
                    )}

                    {/* CONTENIDO PRINCIPAL DEL ENSAYO */}
                    <main className="reporte-main-content">
                      {page.layout ? (
                        page.layout.type === "grid" ? (
                          <div className="reporte-grid-dinamico" style={{ display: "flex", gap: "10px" }}>
                            {page.layout.columns.map((col, cIdx) => (
                              <div key={cIdx} className="reporte-col-dinamica" style={{ width: col.width }}>
                                {col.components.map((comp, compIdx) => renderComponent(comp, `${idx}-${cIdx}-${compIdx}`, ensayo, currentFormData, currentResultados, currentTableConfig, currentGraficosConfig, idx))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="reporte-secuencial-dinamico">
                            {page.layout.components.map((comp, compIdx) => renderComponent(comp, `${idx}-${compIdx}`, ensayo, currentFormData, currentResultados, currentTableConfig, currentGraficosConfig, idx))}
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
                      {renderClassificationBlock(page.classificationBlock, ensayo, currentFormData, currentResultados)}

                      {/* GRÁFICOS DINÁMICOS */}
                      {page.charts && currentGraficosConfig && (
                        <div className="reporte-charts-grid" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                          {page.charts.map((chart, chartIdx) => {
                            if (chart.position === "after_layout") {
                              const chartH = chart.height || "95mm";
                              return (
                                <section
                                  key={chartIdx}
                                  className="reporte-chart-container-wrapper"
                                  style={{
                                    height: chartH,
                                    flex: "0 0 auto",
                                    marginTop: "0px"
                                  }}
                                >
                                  <div className="chart-header-title">
                                    {String(chart.title || chart.chartConfigKey).replace(/_/g, " ").toUpperCase()}
                                  </div>
                                  <div className="reporte-chart-body" style={{ height: `calc(${chartH} - 22px)` }}>
                                    {(() => {
                                      const shouldRenderChart = isPrinting || Math.abs(idx - activePageIndex) <= 2;
                                      return shouldRenderChart ? (
                                        <VisorGraficos
                                          graficosConfig={currentGraficosConfig}
                                          resultados={currentResultados}
                                          formData={currentFormData}
                                          tableConfig={currentTableConfig}
                                          isPrintMode={true}
                                          targetChartId={chart.chartConfigKey}
                                          scope={chart.scope || "group"}
                                          groupEnsayos={[{
                                            id: ensayo?.id || "print-1",
                                            datos_formulario: currentFormData,
                                            resultado: currentResultados
                                          }]}
                                          printHeight={chartH}
                                        />
                                      ) : (
                                        <div className="chart-placeholder">
                                          <i className="fas fa-chart-line placeholder-icon"></i>
                                          <p>Cargando gráfico...</p>
                                        </div>
                                      );
                                    })()}
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
                          <div className="obs-text">{currentFormData.observaciones || currentMetadata.observations.fallback || ""}</div>
                        </div>
                      )}

                      <div className="reporte-firmas-grid">
                        {currentSignatures && currentSignatures.map((sig, sIdx) => (
                          <div key={sIdx} className="firma-box">
                            <div className="firma-line"></div>
                            <div className="firma-cargo">{sig.role}</div>
                            <div className="firma-subtext">{sig.nameLabel || "NOMBRE:"} __________________________________</div>
                          </div>
                        ))}
                      </div>
                    </footer>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
