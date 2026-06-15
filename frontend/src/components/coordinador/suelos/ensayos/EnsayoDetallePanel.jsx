import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import alertify from "alertifyjs";
import "./ensayos.css";
import "./VistaGeneralEnsayos.css";
import EnsayoFormulario from "./EnsayoFormulario.jsx";
import VisorResultados from "./secciones/VisorResultados.jsx";
import VisorGraficos from "./secciones/VisorGraficos.jsx";
import { calcularResultados } from "./ensayos.calculos.js";

Chart.register(...registerables);

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

const cloneJson = (value) => JSON.parse(JSON.stringify(value || {}));

const normalizeEnsayoConfig = (cfg) => {
  if (!cfg || typeof cfg !== "object") return cfg;

  return {
    ...cfg,
    tableConfig: cfg.tableConfig,
    formConfig: cfg.tableConfig,
    calculationConfig: cfg.calculationConfig,
  };
};

const getValueAtPath = (obj, path) => {
  if (!obj || !path) return undefined;
  return String(path)
    .split(".")
    .reduce(
      (acc, key) => (acc !== undefined && acc !== null ? acc[key] : undefined),
      obj,
    );
};

const setValueAtPath = (obj, path, nextValue) => {
  const keys = String(path).split(".");
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

const normalizeFieldPath = (fieldPath, scope = "general_fields") => {
  if (!fieldPath) return "";
  return String(fieldPath).includes(".")
    ? String(fieldPath)
    : `${scope}.${fieldPath}`;
};

const interpolateTemplate = (template, context = {}) =>
  String(template || "").replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const value = getValueAtPath(context, key.trim());
    return hasValue(value) ? String(value) : "";
  });

const getDynamicFieldEntries = (currentTableConfig) => {
  const generalFields = Array.isArray(currentTableConfig?.general_fields)
    ? currentTableConfig.general_fields.map((field) => ({
        scope: "general_fields",
        field,
        fieldPath: normalizeFieldPath(
          field.path || field.key,
          "general_fields",
        ),
      }))
    : [];

  const legacyFields = Array.isArray(currentTableConfig?.fields)
    ? currentTableConfig.fields.map((field) => ({
        scope: "fields",
        field,
        fieldPath: normalizeFieldPath(field.path || field.key, "fields"),
      }))
    : [];

  return [...generalFields, ...legacyFields];
};

const getFieldAutofillMap = (field) =>
  field?.input_config?.autofill || field?.autofill || null;

const getFieldOptionsSource = (field, currentTableConfig) => {
  const inputConfig = field?.input_config || {};

  if (Array.isArray(inputConfig.options_source)) {
    return inputConfig.options_source;
  }

  if (typeof inputConfig.options_source === "string") {
    const source = getValueAtPath(
      currentTableConfig,
      inputConfig.options_source,
    );
    return Array.isArray(source) ? source : [];
  }

  if (Array.isArray(inputConfig.options)) {
    return inputConfig.options;
  }

  return [];
};

const getOptionValue = (option, inputConfig = {}) => {
  if (option && typeof option === "object") {
    const valueKey = inputConfig.option_value_key || "value";
    return option[valueKey] ?? option.value ?? option.codigo ?? option.id ?? "";
  }
  return option;
};

const getOptionLabel = (option, inputConfig = {}) => {
  if (option && typeof option === "object") {
    if (inputConfig.option_label_template) {
      const interpolated = interpolateTemplate(
        inputConfig.option_label_template,
        option,
      ).trim();
      if (interpolated) return interpolated;
    }

    const labelKey = inputConfig.option_label_key || "label";
    return (
      option[labelKey] ??
      option.label ??
      option.descripcion ??
      option.codigo ??
      option.value
    );
  }

  return option;
};

const buildDynamicOptions = (
  field,
  currentTableConfig,
  currentData,
  fieldPath,
) => {
  const inputConfig = field?.input_config || {};
  const sourceOptions = getFieldOptionsSource(field, currentTableConfig);
  if (!sourceOptions.length) return inputConfig.options || [];

  const options = sourceOptions.map((option) => ({
    value: getOptionValue(option, inputConfig),
    label: getOptionLabel(option, inputConfig),
  }));

  const selectedValue = getValueAtPath(currentData, fieldPath);
  const hasSelectedOption = options.some(
    (option) => String(option.value) === String(selectedValue),
  );

  if (hasValue(selectedValue) && !hasSelectedOption) {
    return [{ value: selectedValue, label: String(selectedValue) }, ...options];
  }

  return options;
};

const hydrateDynamicFieldConfig = (currentTableConfig, currentData) => {
  if (!currentTableConfig || typeof currentTableConfig !== "object") {
    return currentTableConfig;
  }

  const mapFields = (fields = [], scope = "general_fields") =>
    fields.map((field) => {
      const inputConfig = field?.input_config || {};
      const sourceOptions = getFieldOptionsSource(field, currentTableConfig);
      if (!sourceOptions.length) return field;

      const fieldPath = normalizeFieldPath(field.path || field.key, scope);
      return {
        ...field,
        input_config: {
          ...inputConfig,
          control: inputConfig.control || "select",
          options: buildDynamicOptions(
            field,
            currentTableConfig,
            currentData,
            fieldPath,
          ),
        },
      };
    });

  return {
    ...currentTableConfig,
    general_fields: Array.isArray(currentTableConfig.general_fields)
      ? mapFields(currentTableConfig.general_fields, "general_fields")
      : currentTableConfig.general_fields,
    fields: Array.isArray(currentTableConfig.fields)
      ? mapFields(currentTableConfig.fields, "fields")
      : currentTableConfig.fields,
  };
};

const findSelectedSourceRecord = (field, currentTableConfig, selectedValue) => {
  const sourceOptions = getFieldOptionsSource(field, currentTableConfig);
  const inputConfig = field?.input_config || {};

  return sourceOptions.find(
    (option) =>
      String(getOptionValue(option, inputConfig)) === String(selectedValue),
  );
};

const applyFieldAutofill = (
  currentData,
  currentTableConfig,
  fieldEntry,
  selectedValue,
  { overwrite = true } = {},
) => {
  const autofillMap = getFieldAutofillMap(fieldEntry.field);
  if (!autofillMap || !hasValue(selectedValue)) return currentData;

  const selectedRecord = findSelectedSourceRecord(
    fieldEntry.field,
    currentTableConfig,
    selectedValue,
  );
  if (!selectedRecord) return currentData;

  const nextData = cloneJson(currentData);
  const normalizedEntries = Array.isArray(autofillMap)
    ? autofillMap
    : Object.entries(autofillMap).map(([target, source]) => ({
        target,
        source,
      }));

  normalizedEntries.forEach((entry) => {
    const targetPath = normalizeFieldPath(entry.target, fieldEntry.scope);
    const sourcePath = entry.source || entry.value || entry.from;
    const sourceValue = getValueAtPath(selectedRecord, sourcePath);
    const currentValue = getValueAtPath(nextData, targetPath);

    if (!overwrite && hasValue(currentValue)) return;
    if (!hasValue(sourceValue)) return;

    setValueAtPath(nextData, targetPath, sourceValue);
  });

  return nextData;
};

const applyConfiguredAutofillOnLoad = (currentData, currentTableConfig) => {
  return getDynamicFieldEntries(currentTableConfig).reduce(
    (acc, fieldEntry) => {
      const selectedValue = getValueAtPath(acc, fieldEntry.fieldPath);
      return applyFieldAutofill(
        acc,
        currentTableConfig,
        fieldEntry,
        selectedValue,
        {
          overwrite: false,
        },
      );
    },
    cloneJson(currentData),
  );
};

const applyConfiguredAutofillByFieldPath = (
  currentData,
  currentTableConfig,
  changedFieldPath,
  selectedValue,
) => {
  const fieldEntry = getDynamicFieldEntries(currentTableConfig).find(
    (entry) => entry.fieldPath === changedFieldPath,
  );

  if (!fieldEntry) return currentData;

  return applyFieldAutofill(
    currentData,
    currentTableConfig,
    fieldEntry,
    selectedValue,
    { overwrite: true },
  );
};

  // Lógica de Granulometría migrada nativamente a la base de datos (config_tabla y config_calculos)

const formatProgresiva = (codigo) => {
  if (!codigo) return "N/A";
  const code = codigo.includes("-") ? codigo.split("-")[1] : codigo;
  return code.length < 3 ? code : `${code.slice(0, -3)}+${code.slice(-3)}`;
};

export default function EnsayoDetallePanel({
  ensayoId,
  initialEnsayoDetails = null,
  modalMode = false,
  onClose = null,
  onSaved = null,
  onDirtyStateChange = null,
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
  const [activeTab, setActiveTab] = useState("formulario");
  const [initialFormSnapshot, setInitialFormSnapshot] = useState("{}");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const API_URL = process.env.REACT_APP_API_BASE ?? "";

  const applyGeneralFieldDefaults = useCallback(
    (currentData, currentTableConfig) => {
      const generalFieldsList = Array.isArray(currentTableConfig?.general_fields)
        ? currentTableConfig.general_fields
        : (currentTableConfig?.general_fields?.fields || []);

      if (!generalFieldsList.length) return currentData;

      const nextData = cloneJson(currentData);
      if (
        !nextData.general_fields ||
        typeof nextData.general_fields !== "object"
      ) {
        nextData.general_fields = {};
      }

      generalFieldsList.forEach((field) => {
        const hasValue =
          nextData.general_fields[field.key] !== undefined &&
          nextData.general_fields[field.key] !== null &&
          nextData.general_fields[field.key] !== "";

        if (!hasValue && field.defaultValue !== undefined) {
          nextData.general_fields[field.key] = field.defaultValue;
        }
      });

      return nextData;
    },
    [],
  );

  const getAuthHeaders = useCallback(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const token = userData?.token;
    if (!token) {
      alertify.error("Sesión expirada. Por favor, inicia sesión de nuevo.");
      navigate("/login");
      throw new Error("Token no proporcionado");
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  const handleVolver = useCallback(() => {
    const { parent_type, tramo_id, progresiva_id, cantera_id, estrato_id } =
      ensayoDetails || {};
    if (
      parent_type === "progresiva" &&
      tramo_id &&
      progresiva_id &&
      estrato_id
    ) {
      navigate("/coordinador/recoleccion-datos/gestor-tramos", {
        state: {
          tramoId: tramo_id,
          progresivaId: progresiva_id,
          estratoId: estrato_id,
        },
      });
    } else if (
      parent_type === "cantera" &&
      tramo_id &&
      cantera_id &&
      estrato_id
    ) {
      navigate("/coordinador/recoleccion-datos/gestor-canteras", {
        state: {
          tramoId: tramo_id,
          canteraId: cantera_id,
          estratoId: estrato_id,
        },
      });
    } else {
      navigate("/coordinador/recoleccion-datos");
    }
  }, [ensayoDetails, navigate]);

  const handleGoToGeneral = useCallback(() => {
    if (ensayoDetails?.tramo_id) {
      navigate(
        `/coordinador/suelos/tramos/${ensayoDetails.tramo_id}/ensayos-generales`,
      );
    }
  }, [ensayoDetails, navigate]);

  const handleExportarInforme = useCallback(() => {
    if (ensayoId) {
      window.open(`/coordinador/suelos/ensayos/${ensayoId}/reporte`, "_blank");
    }
  }, [ensayoId]);

  useEffect(() => {
    let ignore = false;

    const fetchEnsayoAndConfig = async () => {
      if (!ensayoId) {
        setError("ID de ensayo no proporcionado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setActiveTab("formulario");
        const headers = getAuthHeaders();
        const response = await axios.get(
          `${API_URL}/api/ensayos/details/${ensayoId}?_=${new Date().getTime()}`,
          { headers },
        );
        const data = response.data;
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
        setInitialFormSnapshot(JSON.stringify(formDataObject || {}));

        if (data.parent_type === "progresiva") {
          setInfoGeneral({
            proyecto: data.proyecto_nombre,
            tramo: data.tramo_nombre,
            progresiva: data.progresiva_codigo,
            estrato: data.estrato_orden,
          });
        } else if (data.parent_type === "cantera") {
          setInfoGeneral({
            proyecto: data.proyecto_nombre,
            tramo: data.tramo_nombre,
            cantera: data.cantera_codigo,
            estrato: data.estrato_orden,
          });
        } else if (data.parent_type === "fuente_agua") {
          setInfoGeneral({
            proyecto: data.proyecto_nombre,
            tramo: data.tramo_nombre,
            fuente_agua: data.fuente_agua_nombre,
            estrato: data.estrato_orden,
          });
        } else {
          setInfoGeneral({});
        }

        if (data.tipo_ensayo) {
          const configRes = await axios.get(
            `${API_URL}/api/config/ensayo-tipos/${data.tipo_ensayo}`,
            { headers },
          );
          if (ignore) return;
          const cfg = normalizeEnsayoConfig(configRes.data);

          // Cargando campos del formulario dinámicamente desde config_tabla

          const hydratedTableConfig = hydrateDynamicFieldConfig(
            cfg.tableConfig,
            formDataObject,
          );
          formDataObject = applyConfiguredAutofillOnLoad(
            formDataObject,
            hydratedTableConfig,
          );
          const finalTableConfig = hydrateDynamicFieldConfig(
            hydratedTableConfig,
            formDataObject,
          );

          // Ejecutar los cálculos en caliente para garantizar la fidelidad absoluta de resultados
          let finalResultados = {};
          if (cfg.calculationConfig && formDataObject) {
            try {
              const normalizedData = { ...formDataObject };
              if (!normalizedData.tables) {
                normalizedData.tables = { ...formDataObject };
              }
              const calculatedRes = calcularResultados(cfg.calculationConfig, normalizedData, finalTableConfig);
              finalResultados = calculatedRes || {};
            } catch (err) {
              console.error("[PANEL DETALLE - ERROR] Error al recalcular en carga inicial:", err);
              finalResultados = data.resultado || {};
            }
          } else {
            finalResultados = data.resultado || {};
          }

          // Sincronizar en caliente los campos editables auto-calculados al cargar
          const generalFieldsList = Array.isArray(finalTableConfig?.general_fields)
            ? finalTableConfig.general_fields
            : (finalTableConfig?.general_fields?.fields || []);

          if (cfg.calculationConfig && generalFieldsList.length > 0) {
            try {
              generalFieldsList.forEach((field) => {
                const fieldPath = `general_fields.${field.key}`;
                if (cfg.calculationConfig[fieldPath] !== undefined) {
                  const currentValue = getValueAtPath(formDataObject, fieldPath);
                  const calculatedValue = getValueAtPath(finalResultados, fieldPath);
                  
                  if ((currentValue === undefined || currentValue === null || currentValue === "" || Number(currentValue) === 0) &&
                      calculatedValue !== undefined && calculatedValue !== null && Number(calculatedValue) !== 0) {
                    setValueAtPath(formDataObject, fieldPath, calculatedValue);
                  }
                }
              });
            } catch (err) {
              console.error("Error al sincronizar campos editables calculados en carga:", err);
            }
          }

          setFormData(formDataObject);
          setInitialFormSnapshot(JSON.stringify(formDataObject || {}));
          setFormConfig(finalTableConfig);
          setResultsConfig(cfg.resultsConfig);
          setTableConfig(finalTableConfig);
          setCalculationConfig(cfg.calculationConfig);
          setGraficosConfig(cfg.graficosConfig);
          setResultados(finalResultados);
          setFormData((prev) =>
            applyGeneralFieldDefaults(prev, finalTableConfig),
          );
        }
      } catch (err) {
        if (!ignore) {
          setError("Error al cargar los datos del ensayo.");
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
    setFormData((prev) => applyGeneralFieldDefaults(prev, tableConfig));
  }, [tableConfig, applyGeneralFieldDefaults]);

  useEffect(() => {
    const currentSnapshot = JSON.stringify(formData || {});
    const isDirty = currentSnapshot !== initialFormSnapshot;

    if (typeof onDirtyStateChange === "function") {
      onDirtyStateChange(isDirty);
    }
  }, [formData, initialFormSnapshot, onDirtyStateChange]);

  useEffect(() => {
    if (!calculationConfig || !formData || Object.keys(formData).length === 0) {
      setResultados({});
      return;
    }

    try {
      let resultadosCalculados = calcularResultados(
        calculationConfig,
        formData,
        tableConfig,
      );
      setResultados(resultadosCalculados);
    } catch (err) {
      console.error("[PANEL DETALLE - EFFECT - ERROR] Falló el cálculo automático reactivo en useEffect:", err);
      setResultados({ error: "Error en el cálculo." });
    }
  }, [formData, calculationConfig, tableConfig, ensayoDetails]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let val = value;
    if (type === "number") {
      if (value === "") {
        val = "";
      } else {
        const parsed = parseFloat(value);
        val = isNaN(parsed) ? value : parsed;
      }
    }

    setFormData((prev) => {
      let newState = cloneJson(prev);

      setValueAtPath(newState, name, val);
      newState = applyConfiguredAutofillByFieldPath(
        newState,
        tableConfig,
        name,
        val,
      );

      // Sincronización dinámica de campos auto-calculados editables en caliente
      const generalFieldsList = Array.isArray(tableConfig?.general_fields)
        ? tableConfig.general_fields
        : (tableConfig?.general_fields?.fields || []);

      if (calculationConfig && generalFieldsList.length > 0) {
        try {
          const tempResults = calcularResultados(calculationConfig, newState, tableConfig);

          generalFieldsList.forEach((field) => {
            const fieldPath = `general_fields.${field.key}`;
            
            // Si el campo tiene fórmula de cálculo y NO es el campo que el usuario está editando activamente
            if (calculationConfig[fieldPath] !== undefined && name !== fieldPath) {
              const calculatedValue = getValueAtPath(tempResults, fieldPath);
              if (calculatedValue !== undefined && calculatedValue !== null) {
                setValueAtPath(newState, fieldPath, calculatedValue);
              }
            }
          });
        } catch (err) {
          console.error("[PANEL DETALLE - INPUT_CHANGE - ERROR] Error al sincronizar campos editables autocalculados en caliente:", err);
        }
      }

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
        tipo_ensayo_id: ensayoDetails?.tipo_ensayo,
      };

      await axios.put(
        `${API_URL}/api/ensayos/full-assay/${ensayoId}`,
        payload,
        { headers },
      );
      alertify.success("Ensayo actualizado correctamente.");
      setInitialFormSnapshot(JSON.stringify(formData || {}));

      if (typeof onDirtyStateChange === "function") {
        onDirtyStateChange(false);
      }

      if (typeof onSaved === "function") {
        onSaved();
      }
    } catch (err) {
      console.error("Error al guardar el ensayo:", err);
      alertify.error(
        "Error al guardar el ensayo. Revisa la consola para más detalles.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (nuevoEstado) => {
    setDropdownOpen(false);
    try {
      alertify.message("Actualizando estado...");
      const headers = getAuthHeaders();
      await axios.put(
        `${API_URL}/api/ensayos/${ensayoId}/base`,
        { 
          nombre_ensayo: ensayoDetails?.nombre_ensayo,
          estado: nuevoEstado 
        },
        { headers }
      );
      
      setEnsayoDetails(prev => ({
        ...prev,
        estado: nuevoEstado
      }));
      
      alertify.success(`Estado actualizado a: ${nuevoEstado}`);
      
      if (typeof onSaved === "function") {
        onSaved();
      }
    } catch (err) {
      console.error("Error al actualizar el estado del ensayo:", err);
      alertify.error("No se pudo actualizar el estado del ensayo.");
    }
  };

  if (loading)
    return <div className="ensayo-detail-loading">Cargando ensayo...</div>;

  if (error) {
    return (
      <div className="ensayos-layout-container error-container">
        <h3>
          <i className="fas fa-exclamation-triangle"></i> Error
        </h3>
        <p>{error}</p>
        {!modalMode && (
          <button onClick={handleVolver} className="btn btn-primary">
            Volver
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`detalle-ensayo-container ${modalMode ? "detalle-ensayo-container-modal" : ""}`}
    >
      {!modalMode && (
        <div className="ensayo-header-actions">
          <button
            onClick={handleVolver}
            className="btn btn-secondary btn-expandable"
          >
            <i className="fas fa-arrow-left"></i>
            <span className="btn-text">Volver</span>
          </button>
          <button
            onClick={handleGoToGeneral}
            className="btn btn-info btn-expandable"
          >
            <i className="fas fa-vials"></i>
            <span className="btn-text">Ensayos Generales</span>
          </button>
          <button
            onClick={handleExportarInforme}
            className="btn-pdf-premium btn-expandable"
          >
            <i className="fas fa-file-pdf"></i>
            <span className="btn-text">Exportar Informe</span>
          </button>
          <h2 className="ensayo-title">
            Detalles del Ensayo: {ensayoDetails?.nombre_ensayo}
          </h2>
        </div>
      )}

      {modalMode && (
        <div className="ensayo-modal-inline-header d-flex justify-content-between align-items-center">
          <div className="ensayo-modal-inline-title-group">
            <h2 className="ensayo-title">{ensayoDetails?.nombre_ensayo}</h2>
            <span className="ensayo-modal-inline-subtitle">
              {ensayoDetails?.tipo_ensayo_descripcion ||
                ensayoDetails?.tipo_ensayo_nombre ||
                "Ensayo"}
            </span>
          </div>
          <button
            onClick={handleExportarInforme}
            className="btn-pdf-premium ms-auto me-2"
          >
            <i className="fas fa-file-pdf"></i> Informe PDF
          </button>
        </div>
      )}

      <div className="info-panels-row mb-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <i className="fas fa-info-circle"></i> Información General
            </div>
            <div className="card-body">
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">
                    <i className="fas fa-folder"></i> Proyecto
                  </span>
                  <span className="metadata-value">
                    {infoGeneral.proyecto || <span className="metadata-na">N/A</span>}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">
                    <i className="fas fa-road"></i> Tramo
                  </span>
                  <span className="metadata-value">
                    {infoGeneral.tramo || <span className="metadata-na">N/A</span>}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">
                    <i className="fas fa-flask"></i> Tipo de Ensayo
                  </span>
                  <span className="metadata-value" title={ensayoDetails?.tipo_ensayo_descripcion || ""}>
                    {ensayoDetails?.tipo_ensayo_descripcion || ensayoDetails?.tipo_ensayo_nombre || <span className="metadata-na">N/A</span>}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">
                    <i className="fas fa-barcode"></i> Código / Nombre
                  </span>
                  <span className="metadata-value">
                    {ensayoDetails?.nombre_ensayo || <span className="metadata-na">N/A</span>}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">
                    <i className="fas fa-calendar-alt"></i> Fecha de Muestreo
                  </span>
                  <span className="metadata-value">
                    {ensayoDetails?.fecha_muestreo ? (
                      new Date(ensayoDetails.fecha_muestreo).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })
                    ) : (
                      <span className="metadata-na">N/A</span>
                    )}
                  </span>
                </div>
                <div className="metadata-item" ref={dropdownRef}>
                  <span className="metadata-label">
                    <i className="fas fa-tasks"></i> Estado
                  </span>
                  <div className="metadata-value" style={{ position: "relative", width: "100%" }}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`select-estado-premium ${String(ensayoDetails?.estado || 'pendiente').toLowerCase().trim().replace(/\s+/g, '-')}`}
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <span>{ensayoDetails?.estado || "Pendiente"}</span>
                      <i className={`fas fa-chevron-${dropdownOpen ? "up" : "down"}`} style={{ fontSize: "0.75rem", opacity: 0.8 }}></i>
                    </button>
                    {dropdownOpen && (
                      <div className="estado-dropdown-menu">
                        {["Pendiente", "En Progreso", "Completado", "Aprobado", "Rechazado"].map((opcion) => (
                          <button
                            key={opcion}
                            type="button"
                            onClick={() => handleEstadoChange(opcion)}
                            className={`estado-dropdown-item ${String(opcion).toLowerCase().trim().replace(/\s+/g, '-')}`}
                          >
                            <span className="status-dot"></span>
                            {opcion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <i className="fas fa-map-marker-alt"></i> Ubicación
            </div>
            <div className="card-body">
              {ensayoDetails?.parent_type === "progresiva" ? (
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-route"></i> Progresiva
                    </span>
                    <span className="metadata-value">
                      {formatProgresiva(infoGeneral.progresiva)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-compass"></i> Calicata / Exploración
                    </span>
                    <span className="metadata-value" title={ensayoDetails?.calicata || ""}>
                      {ensayoDetails?.calicata || <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-layer-group"></i> Estrato / Muestra
                    </span>
                    <span className="metadata-value">
                      {ensayoDetails?.estrato_nombre ? (
                        `${ensayoDetails.estrato_nombre} (Orden: ${infoGeneral.estrato})`
                      ) : (
                        `Estrato ${infoGeneral.estrato}`
                      )}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-arrows-up-down"></i> Profundidad (Rango)
                    </span>
                    <span className="metadata-value">
                      {hasValue(ensayoDetails?.estrato_profundidad_min) && hasValue(ensayoDetails?.estrato_profundidad_max) ? (
                        `${Number(ensayoDetails.estrato_profundidad_min).toFixed(2)} m - ${Number(ensayoDetails.estrato_profundidad_max).toFixed(2)} m`
                      ) : (
                        <span className="metadata-na">N/A</span>
                      )}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-globe"></i> Coordenadas UTM
                    </span>
                    <span className="metadata-value metadata-value-coordinates">
                      {ensayoDetails?.coordenada_este && ensayoDetails?.coordenada_norte ? (
                        <div>
                          <span style={{color: '#64748b', fontWeight: 600}}>E:</span> {ensayoDetails.coordenada_este}
                          <br />
                          <span style={{color: '#64748b', fontWeight: 600}}>N:</span> {ensayoDetails.coordenada_norte}
                        </div>
                      ) : (
                        <span className="metadata-na">N/A</span>
                      )}
                    </span>
                  </div>
                </div>
              ) : ensayoDetails?.parent_type === "cantera" ? (
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-mountain"></i> Cantera
                    </span>
                    <span className="metadata-value">
                      {infoGeneral.cantera || <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-compass"></i> Calicata / Exploración
                    </span>
                    <span className="metadata-value" title={ensayoDetails?.calicata || ""}>
                      {ensayoDetails?.calicata || <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-layer-group"></i> Estrato / Muestra
                    </span>
                    <span className="metadata-value">
                      {ensayoDetails?.estrato_nombre ? (
                        `${ensayoDetails.estrato_nombre} (Orden: ${infoGeneral.estrato})`
                      ) : (
                        `Estrato ${infoGeneral.estrato}`
                      )}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-arrows-up-down"></i> Profundidad (Rango)
                    </span>
                    <span className="metadata-value">
                      {hasValue(ensayoDetails?.estrato_profundidad_min) && hasValue(ensayoDetails?.estrato_profundidad_max) ? (
                        `${Number(ensayoDetails.estrato_profundidad_min).toFixed(2)} m - ${Number(ensayoDetails.estrato_profundidad_max).toFixed(2)} m`
                      ) : (
                        <span className="metadata-na">N/A</span>
                      )}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-globe"></i> Coordenadas UTM
                    </span>
                    <span className="metadata-value metadata-value-coordinates">
                      {ensayoDetails?.coordenada_este && ensayoDetails?.coordenada_norte ? (
                        <div>
                          <span style={{color: '#64748b', fontWeight: 600}}>E:</span> {ensayoDetails.coordenada_este}
                          <br />
                          <span style={{color: '#64748b', fontWeight: 600}}>N:</span> {ensayoDetails.coordenada_norte}
                        </div>
                      ) : (
                        <span className="metadata-na">N/A</span>
                      )}
                    </span>
                  </div>
                </div>
              ) : ensayoDetails?.parent_type === "fuente_agua" ? (
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-tint"></i> Fuente de Agua
                    </span>
                    <span className="metadata-value">
                      {ensayoDetails?.fuente_agua_nombre || <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-route"></i> Progresiva Ref.
                    </span>
                    <span className="metadata-value">
                      {ensayoDetails?.fa_progresiva_ref_codigo
                        ? formatProgresiva(ensayoDetails.fa_progresiva_ref_codigo)
                        : <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-arrows-alt-h"></i> Desplazamiento
                    </span>
                    <span className="metadata-value">
                      {hasValue(ensayoDetails?.fa_desplazamiento_km)
                        ? `${ensayoDetails.fa_desplazamiento_km} km`
                        : <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-map-signs"></i> Lado
                    </span>
                    <span className="metadata-value">
                      {ensayoDetails?.fa_lado || <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-vials"></i> N° de Muestras / Testigos
                    </span>
                    <span className="metadata-value">
                      {ensayoDetails?.fa_total_muestras != null
                        ? ensayoDetails.fa_total_muestras
                        : <span className="metadata-na">N/A</span>}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">
                      <i className="fas fa-globe"></i> Coordenadas UTM
                    </span>
                    <span className="metadata-value metadata-value-coordinates">
                      {ensayoDetails?.coordenada_este && ensayoDetails?.coordenada_norte ? (
                        <div>
                          <span style={{color: '#64748b', fontWeight: 600}}>E:</span> {ensayoDetails.coordenada_este}
                          <br />
                          <span style={{color: '#64748b', fontWeight: 600}}>N:</span> {ensayoDetails.coordenada_norte}
                        </div>
                      ) : (
                        <span className="metadata-na">N/A</span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted py-4">Ubicación no disponible</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ensayo-internal-tabs">
        <div className="ensayo-tab-buttons">
          <button
            type="button"
            className={`ensayo-tab-btn ${activeTab === "formulario" ? "active" : ""}`}
            onClick={() => setActiveTab("formulario")}
          >
            Datos del Ensayo
          </button>
          <button
            type="button"
            className={`ensayo-tab-btn ${activeTab === "resultados" ? "active" : ""}`}
            onClick={() => setActiveTab("resultados")}
          >
            Resultados Calculados
          </button>
          <button
            type="button"
            className={`ensayo-tab-btn ${activeTab === "graficos" ? "active" : ""}`}
            onClick={() => setActiveTab("graficos")}
          >
            Gráficos
          </button>
        </div>
      </div>
      <div className="ensayo-tab-content-area">
        {activeTab === "formulario" && formConfig && (
          <EnsayoFormulario
            data={formData}
            onInputChange={handleInputChange}
            resultados={resultados}
            formConfig={formConfig}
            tableConfig={tableConfig}
          />
        )}
        {activeTab === "resultados" && (
          <VisorResultados config={resultsConfig} data={resultados} />
        )}
        {activeTab === "graficos" && (
          <VisorGraficos
            graficosConfig={graficosConfig}
            resultados={resultados}
            formData={formData}
            tableConfig={tableConfig}
          />
        )}
      </div>

      <div className={modalMode ? "ensayo-detail-savebar" : "d-grid mt-3 p-3"}>
        <button
          type="button"
          className="btn btn-success ensayo-detail-savebtn"
          onClick={handleSaveEnsayo}
        >
          <i className="fas fa-save me-1"></i> Actualizar Ensayo
        </button>
      </div>
    </div>
  );
}
