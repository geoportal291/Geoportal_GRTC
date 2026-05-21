import React, { useEffect, useMemo, useRef } from "react";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-luxon";
import { calcularResultados } from "../ensayos.calculos.js";

Chart.register(...registerables);

const engineeringDecorationsPlugin = {
  id: "engineeringDecorations",
  beforeDraw(chart, _args, options) {
    const { ctx, chartArea } = chart;
    if (!chartArea || !options) return;

    const {
      background = true,
      backgroundColorTop = "#f9fcff",
      backgroundColorBottom = "#eef6ff",
      gridGlow = "rgba(56, 189, 248, 0.10)",
      topBands = [],
    } = options;

    if (background) {
      const gradient = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom,
      );
      gradient.addColorStop(0, backgroundColorTop);
      gradient.addColorStop(1, backgroundColorBottom);

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(
        chartArea.left,
        chartArea.top,
        chartArea.right - chartArea.left,
        chartArea.bottom - chartArea.top,
      );
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = gridGlow;
    ctx.lineWidth = 1;
    ctx.shadowColor = "rgba(56, 189, 248, 0.12)";
    ctx.shadowBlur = 12;
    ctx.strokeRect(
      chartArea.left,
      chartArea.top,
      chartArea.right - chartArea.left,
      chartArea.bottom - chartArea.top,
    );
    ctx.restore();

    if (!topBands.length) return;

    const bandHeight = options.bandHeight || 24;
    const bandTop = chartArea.top + 6;
    const chartWidth = chartArea.right - chartArea.left;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '600 12px "Segoe UI", sans-serif';

    topBands.forEach((band) => {
      const start = Math.max(0, Math.min(1, band.start ?? 0));
      const end = Math.max(start, Math.min(1, band.end ?? 1));
      const left = chartArea.left + chartWidth * start;
      const width = chartWidth * (end - start);

      ctx.fillStyle = band.backgroundColor || "rgba(255, 255, 255, 0.82)";
      ctx.strokeStyle = band.borderColor || "rgba(56, 189, 248, 0.28)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(56, 189, 248, 0.08)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(left, bandTop, width, bandHeight, 7);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = band.color || "#0f172a";
      ctx.fillText(
        band.label || "",
        left + width / 2,
        bandTop + bandHeight / 2,
      );
    });

    ctx.restore();
  },
};

Chart.register(engineeringDecorationsPlugin);

const getValue = (obj, path, defaultValue = undefined) => {
  if (!path || typeof path !== "string") return defaultValue;
  const value = path
    .split(".")
    .reduce((current, key) => (current ? current[key] : undefined), obj);
  return value !== undefined && value !== null ? value : defaultValue;
};

const deepMerge = (base = {}, incoming = {}) => {
  const output = Array.isArray(base) ? [...base] : { ...base };

  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      output[key] = [...value];
      return;
    }

    if (value && typeof value === "object") {
      const currentValue = output[key];
      output[key] = deepMerge(
        currentValue &&
          typeof currentValue === "object" &&
          !Array.isArray(currentValue)
          ? currentValue
          : {},
        value,
      );
      return;
    }

    if (value !== undefined) {
      output[key] = value;
    }
  });

  return output;
};

const hasMeaningfulValue = (value) =>
  value !== undefined && value !== null && value !== "";

const toFiniteNumber = (value) => {
  const normalized =
    typeof value === "string" ? Number(String(value).replace(",", ".")) : Number(value);
  return Number.isFinite(normalized) ? normalized : null;
};

const isGranulometriaTrendChart = (chartConfig = {}) =>
  chartConfig?.scope === "group" &&
  (chartConfig?.id === "granulometria_tendencia" ||
    String(chartConfig?.title || "").toLowerCase().includes("granulom"));

const withGranulometriaTrendDatasetFallbacks = (
  datasetConfig = {},
  chartConfig = {},
  sourceConfig = {},
) => {
  if (
    !isGranulometriaTrendChart(chartConfig) ||
    sourceConfig?.type !== "group_table_rows" ||
    sourceConfig?.table_key !== "granulometria"
  ) {
    return datasetConfig;
  }

  const yCandidates = [
    datasetConfig.y_key,
    ...(Array.isArray(datasetConfig.y_keys) ? datasetConfig.y_keys : []),
    "results.granulometria.pasa.{row_key}",
    "granulometria.pasa.{row_key}",
    "tables.granulometria.{row_key}.pasa",
    "tables.granulometria.{row_key}.porc_pasa",
  ].filter(Boolean);

  return {
    ...datasetConfig,
    y_key: yCandidates[0],
    y_keys: [...new Set(yCandidates.slice(1))],
    skip_zero_y: datasetConfig.skip_zero_y ?? true,
  };
};

const withAlpha = (color, alpha) => {
  if (typeof color !== "string" || !color.trim()) {
    return `rgba(37, 99, 235, ${alpha})`;
  }

  const normalized = color.trim();

  if (normalized.startsWith("#")) {
    let hex = normalized.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/,
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
};

const formatNumericLabel = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value ?? "");
  if (Math.abs(numericValue) >= 10) return numericValue.toFixed(0);
  if (Math.abs(numericValue) >= 1)
    return numericValue.toFixed(2).replace(/\.?0+$/, "");
  return numericValue.toFixed(3).replace(/\.?0+$/, "");
};

const nearlyEqual = (a, b, tolerance = 0.0001) =>
  Math.abs(Number(a) - Number(b)) <= tolerance;

const buildTickValuesFromDatasets = (datasets = [], extraValues = []) => {
  const values = datasets
    .flatMap((dataset) =>
      Array.isArray(dataset?.data)
        ? dataset.data.map((point) => Number(point.x))
        : [],
    )
    .concat(extraValues.map(Number))
    .filter((value) => Number.isFinite(value) && value > 0);

  return [...new Set(values)].sort((a, b) => b - a);
};

const buildCategoryValuesFromDatasets = (datasets = []) => {
  const values = datasets
    .flatMap((dataset) =>
      Array.isArray(dataset?.data) ? dataset.data.map((point) => point.x) : [],
    )
    .filter((value) => value !== null && value !== undefined && value !== "");

  return [...new Set(values)];
};

const getTablesConfigList = (tableConfig = {}) => {
  if (Array.isArray(tableConfig?.tables)) return tableConfig.tables;

  if (tableConfig?.tables && typeof tableConfig.tables === "object") {
    return Object.entries(tableConfig.tables).map(([key, config]) => ({
      key: config?.key || key,
      ...config,
    }));
  }

  return [];
};

const getTableDefinition = (tableConfig, tableKey) =>
  getTablesConfigList(tableConfig).find((table) => table?.key === tableKey) ||
  null;

const resolveTemplate = (value, rowContext = {}) => {
  if (typeof value !== "string") return value;
  return value.replace(/\{([^}]+)\}/g, (_, token) => {
    const replacement = getValue(rowContext, token, rowContext[token]);
    return replacement === undefined || replacement === null
      ? ""
      : String(replacement);
  });
};

const resolveContextValue = (
  path,
  context,
  rowContext = {},
  defaultValue = undefined,
) => {
  if (path === null || path === undefined) return defaultValue;
  if (typeof path !== "string") return path;

  const resolvedPath = resolveTemplate(path, rowContext);
  if (!resolvedPath) return defaultValue;

  const rootMatchers = [
    ["data.", context.data],
    ["resultados.", context.resultados],
    ["formData.", context.formData],
    ["tableConfig.", context.tableConfig],
  ];

  for (const [prefix, root] of rootMatchers) {
    if (resolvedPath.startsWith(prefix)) {
      return getValue(root, resolvedPath.slice(prefix.length), defaultValue);
    }
  }

  const rowDirectValue = getValue(rowContext, resolvedPath);
  if (rowDirectValue !== undefined && rowDirectValue !== null)
    return rowDirectValue;
  if (
    rowContext[resolvedPath] !== undefined &&
    rowContext[resolvedPath] !== null
  )
    return rowContext[resolvedPath];

  const dataValue = getValue(context.data, resolvedPath);
  if (dataValue !== undefined && dataValue !== null) return dataValue;

  const resultsValue = getValue(context.resultados, resolvedPath);
  if (resultsValue !== undefined && resultsValue !== null) return resultsValue;

  const formValue = getValue(context.formData, resolvedPath);
  if (formValue !== undefined && formValue !== null) return formValue;

  const tableValue = getValue(context.tableConfig, resolvedPath);
  if (tableValue !== undefined && tableValue !== null) return tableValue;

  return defaultValue;
};

const normalizeCandidatePaths = (basePath, extraPaths = []) => {
  const candidates = [
    basePath,
    ...(Array.isArray(extraPaths) ? extraPaths : []),
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());

  const expanded = candidates.flatMap((candidate) => {
    const variants = new Set([candidate]);

    if (!candidate.startsWith("results.")) {
      variants.add(`results.${candidate}`);
    }

    if (candidate.startsWith("results.")) {
      variants.add(candidate.replace(/^results\./, ""));
    }

    return [...variants];
  });

  return [...new Set(expanded)];
};

const resolveContextValueFromCandidates = (
  basePath,
  context,
  rowContext = {},
  defaultValue = undefined,
  extraPaths = [],
  options = {},
) => {
  const candidates = normalizeCandidatePaths(basePath, extraPaths);

  // Si hay prefijos, los expandimos combinándolos con el basePath
  if (options.prefixes?.length > 0) {
    options.prefixes.forEach(prefix => {
      if (!basePath.startsWith(`${prefix}.`)) {
        candidates.push(`${prefix}.${basePath}`);
      }
    });
  }

  let fallbackValue = defaultValue;

  for (const candidate of candidates) {
    const value = resolveContextValue(
      candidate,
      context,
      rowContext,
      undefined,
    );

    const isPresent = value !== undefined && value !== null && value !== "";


    if (isPresent) {
      const numericValue = toFiniteNumber(value);
      const isZero = numericValue === 0;

      if (options.preferNonZero && isZero) {
        if (fallbackValue === defaultValue) {
          fallbackValue = value;
        }
        continue;
      }

      return value;
    }
  }


  // Si preferimos no-ceros y lo único que encontramos fue un cero, 
  // devolvemos el defaultValue (que suele ser undefined) para que el punto se omita.
  if (options.preferNonZero && toFiniteNumber(fallbackValue) === 0) {
    return defaultValue;
  }

  if (fallbackValue === undefined && (options.prefixes?.length > 0 || extraPaths.length > 0)) {
    console.debug(`[Visor] Fallo al resolver "${basePath}" con prefijos:`, options.prefixes, "y extras:", extraPaths);
  }

  return fallbackValue;
};

const resolveArraySourceItems = (
  sourceConfig = {},
  chartConfig = {},
  context,
) => {
  const dataKey = sourceConfig.data_key || chartConfig.data_key;
  if (!dataKey) return [];

  let mergedObj = null;
  // Intentamos un merge profundo si dataKey apunta a una estructura de tabla dividida entre formData y resultados
  if (context && context.formData && context.resultados) {
    const formPart = getValue(context.formData, dataKey);
    const resPart = getValue(context.resultados, dataKey);
    
    if (formPart && typeof formPart === "object" && !Array.isArray(formPart)) {
      mergedObj = { ...formPart };
      if (resPart && typeof resPart === "object" && !Array.isArray(resPart)) {
        Object.keys(resPart).forEach(k => {
          if (typeof resPart[k] === "object" && typeof mergedObj[k] === "object") {
            mergedObj[k] = { ...mergedObj[k], ...resPart[k] };
          } else {
            mergedObj[k] = resPart[k];
          }
        });
      }
    } else if (resPart && typeof resPart === "object" && !Array.isArray(resPart)) {
      mergedObj = { ...resPart };
    }
  }

  // Usamos el objeto mezclado o resolvemos de forma normal
  const dataArray = mergedObj && Object.keys(mergedObj).length > 0 ? mergedObj : resolveContextValueFromCandidates(
    dataKey,
    context,
    {},
    [],
    sourceConfig.data_keys || [],
    { prefixes: ["results", "resultados", "data"] }
  );

  if (Array.isArray(dataArray)) {
    return dataArray;
  }
  
  if (dataArray !== undefined && dataArray !== null) {
    if (typeof dataArray === "object") {
      const keys = Object.keys(dataArray);
      const numericKeys = keys.filter(k => !isNaN(k) && typeof dataArray[k] === "object");
      if (numericKeys.length > 0) {
        return numericKeys.map(k => ({ ...dataArray[k], rowId: k }));
      }
    }
    return [dataArray];
  }
  
  return [];
};

const buildAssayContext = (
  ensayo = {},
  fallbackCalculationConfig = null,
  fallbackTableConfig = null,
) => {
  const formData = ensayo?.datos_formulario || ensayo?.formData || {};

  // Normalizamos el formData para que el motor de cálculo encuentre las tablas 
  // incluso si la config usa el prefijo "tables." (estándar de la app)
  const normalizedFormData = { ...formData };
  if (!normalizedFormData.tables) {
    normalizedFormData.tables = { ...formData };
  }

  let resultados = ensayo?.resultado || ensayo?.resultados || {};

  // Prioridad 1: Cálculo con la configuración propia del ensayo
  if (
    (!resultados || !Object.keys(resultados).length) &&
    ensayo?.config_calculos &&
    Object.keys(formData).length > 0
  ) {
    try {
      resultados = calcularResultados(ensayo.config_calculos, normalizedFormData) || {};
    } catch (_error) {
      console.error(`[Visor] Error calculando resultados para ensayo ${ensayo.id}:`, _error);
      resultados = {};
    }
  }
  // Prioridad 2: Si no tiene config propia, probar con la del tipo de ensayo (fallback)
  else if (
    (!resultados || !Object.keys(resultados).length) &&
    fallbackCalculationConfig &&
    Object.keys(formData).length > 0
  ) {
    try {
      resultados = calcularResultados(fallbackCalculationConfig, normalizedFormData) || {};
    } catch (_error) {
      resultados = {};
    }
  }

  // El contexto ahora expone todo al primer nivel para facilitar las keys cortas
  return {
    ...resultados,
    ...normalizedFormData,
    resultados: resultados || {},
    results: resultados || {},
    formData: normalizedFormData,
    data: normalizedFormData,
    tableConfig: ensayo?.config_tabla || ensayo?.tableConfig || fallbackTableConfig || {},
    ensayo,
  };
};

const normalizeRowsSource = (rows = [], sourceConfig = {}) => {
  const includeKeys = Array.isArray(sourceConfig.include_keys)
    ? sourceConfig.include_keys
    : null;
  const excludeKeys = Array.isArray(sourceConfig.exclude_keys)
    ? sourceConfig.exclude_keys
    : [];

  return rows.filter((row) => {
    if (!row) return false;
    if (includeKeys && !includeKeys.includes(row.key)) return false;
    if (excludeKeys.includes(row.key)) return false;
    return true;
  });
};

const resolveRowsForSource = (sourceConfig = {}, context) => {
  if (Array.isArray(sourceConfig.rows)) {
    return normalizeRowsSource(sourceConfig.rows, sourceConfig);
  }

  if (sourceConfig.rows_path) {
    const rows = resolveContextValue(sourceConfig.rows_path, context, {}, []);
    return normalizeRowsSource(Array.isArray(rows) ? rows : [], sourceConfig);
  }

  if (sourceConfig.table_key) {
    const tableDefinition = getTableDefinition(
      context.tableConfig,
      sourceConfig.table_key,
    );
    return normalizeRowsSource(
      Array.isArray(tableDefinition?.rows) ? tableDefinition.rows : [],
      sourceConfig,
    );
  }

  return [];
};

const isValidForScale = (value, scaleType) => {
  if (value === null || value === undefined || value === "") return false;
  if (scaleType === "category") return true;
  if (scaleType === "logarithmic") {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0;
  }
  return true;
};

const normalizePoint = (point, chartConfig) => {
  if (!point) return null;

  const xScaleType = chartConfig?.x_axis?.type || "linear";
  const yScaleType = chartConfig?.y_axis?.type || "linear";

  if (
    !isValidForScale(point.x, xScaleType) ||
    !isValidForScale(point.y, yScaleType)
  ) {
    return null;
  }

  return point;
};

const shouldSkipPointByDatasetRules = (point, datasetConfig = {}) => {
  if (!point) return true;

  // Usamos un epsilon pequeño para capturar ceros reales y residuos de cálculo
  const EPSILON = 0.00001;

  if (datasetConfig.skip_zero_x) {
    const numericX = toFiniteNumber(point.x);
    if (numericX === null || Math.abs(numericX) < EPSILON) return true;
  }

  if (datasetConfig.skip_zero_y) {
    const numericY = toFiniteNumber(point.y);
    if (numericY === null || Math.abs(numericY) < EPSILON) return true;
  }

  return false;
};

const buildPointsFromArraySource = (
  dataArray = [],
  chartConfig,
  datasetConfig,
  context,
) => {
  return dataArray
    .map((item, index) => {
      const rowContext = { index, ...item };

      // Filtrado dinámico por clave externa (ej: omitir si peso_retenido es 0 o está vacío)
      if (datasetConfig.filter_zero_key) {
        const filterVal = resolveContextValue(
          datasetConfig.filter_zero_key,
          context,
          rowContext,
        );
        const num = Number(filterVal);
        if (
          filterVal === undefined ||
          filterVal === null ||
          filterVal === "" ||
          (Number.isFinite(num) && num === 0)
        ) {
          return null;
        }
      }

      return normalizePoint(
        {
          x: resolveContextValueFromCandidates(
            datasetConfig.x_key || chartConfig?.x_axis?.key || "x",
            context,
            rowContext,
            undefined,
            datasetConfig.x_keys || [],
            { preferNonZero: datasetConfig.skip_zero_x === true, extraPaths: ["results.x", "resultados.x", "data.x"] },
          ),
          y: resolveContextValueFromCandidates(
            datasetConfig.y_key || "y",
            context,
            rowContext,
            undefined,
            datasetConfig.y_keys || [],
            { preferNonZero: datasetConfig.skip_zero_y === true, extraPaths: ["results.y", "resultados.y", "data.y"] },
          ),
        },
        chartConfig,
      );
    })
    .filter(
      (candidatePoint) =>
        !shouldSkipPointByDatasetRules(candidatePoint, datasetConfig),
    )
    .filter(Boolean);
};

const buildPointsFromRowSource = (
  rows = [],
  chartConfig,
  datasetConfig,
  context,
) => {
  const isTrendDebug = isGranulometriaTrendChart(chartConfig);
  return rows
    .map((row, index) => {
      const rowContext = {
        index,
        row_key: row?.key,
        row_label: row?.label,
        ...row,
      };

      // Filtrado dinámico por clave externa (ej: omitir si peso_retenido es 0 o está vacío)
      if (datasetConfig.filter_zero_key) {
        const filterVal = resolveContextValue(
          datasetConfig.filter_zero_key,
          context,
          rowContext,
        );
        const numericFilter = toFiniteNumber(filterVal);
        const EPSILON = 0.00001;

        if (
          filterVal === undefined ||
          filterVal === null ||
          filterVal === "" ||
          (numericFilter !== null && Math.abs(numericFilter) < EPSILON)
        ) {
          return null;
        }
      }

      return normalizePoint(
        {
          x: resolveContextValueFromCandidates(
            datasetConfig.x_key || chartConfig?.x_axis?.key,
            context,
            rowContext,
            undefined,
            datasetConfig.x_keys || [],
            {
              preferNonZero: datasetConfig.skip_zero_x === true,
              debugMeta: isTrendDebug
                ? {
                  axis: "x",
                  ensayo:
                    context?.ensayo?.codigo_ensayo ||
                    context?.ensayo?.codigo_generado ||
                    context?.ensayo?.id,
                  row_key: rowContext.row_key,
                }
                : null,
            },
          ),
          y: resolveContextValueFromCandidates(
            datasetConfig.y_key,
            context,
            rowContext,
            undefined,
            datasetConfig.y_keys || [],
            {
              preferNonZero: datasetConfig.skip_zero_y === true,
              debugMeta: isTrendDebug
                ? {
                  axis: "y",
                  ensayo:
                    context?.ensayo?.codigo_ensayo ||
                    context?.ensayo?.codigo_generado ||
                    context?.ensayo?.id,
                  row_key: rowContext.row_key,
                }
                : null,
            },
          ),
        },
        chartConfig,
      );
    })
    .filter((point) => {
      const shouldSkip = shouldSkipPointByDatasetRules(point, datasetConfig);
      return !shouldSkip;
    })
    .filter(Boolean);
};

const buildGroupPointsFromEnsayos = (
  groupEnsayos = [],
  chartConfig,
  datasetConfig,
  context,
) => {
  const sourceConfig = datasetConfig.source || chartConfig.source || {};
  const pointBuilderType = sourceConfig.type;

  return groupEnsayos.flatMap((ensayo, idx) => {
    // Usar contexto pre-calculado si está disponible para ahorrar CPU
    const assayContext =
      context.groupAssayContexts?.[idx] ||
      buildAssayContext(
        ensayo,
        context.calculationConfig,
        context.tableConfig,
      );

    const datasetConfigWithFallbacks = withGranulometriaTrendDatasetFallbacks(
      datasetConfig,
      chartConfig,
      sourceConfig,
    );

    let points = [];

    if (pointBuilderType === "group_array") {
      const dataArray = resolveArraySourceItems(
        sourceConfig,
        chartConfig,
        assayContext,
      );
      points = buildPointsFromArraySource(
        dataArray,
        chartConfig,
        datasetConfigWithFallbacks,
        assayContext,
      );
      if (
        !points.length &&
        String(sourceConfig.data_key || chartConfig.data_key || "").includes(
          "curva_granulometr",
        )
      ) {
        const rows = resolveRowsForSource(
          {
            type: "table_rows",
            table_key: sourceConfig.table_key || "granulometria",
            exclude_keys: ["fondo", "total", "pass_200"],
          },
          assayContext,
        );

        points = buildPointsFromRowSource(
          rows,
          chartConfig,
          {
            ...datasetConfigWithFallbacks,
            x_key: datasetConfigWithFallbacks.x_key || "mm",
            y_key: datasetConfigWithFallbacks.y_key || "tables.granulometria.{row_key}.pasa",
            y_keys: [
              ...(Array.isArray(datasetConfigWithFallbacks.y_keys)
                ? datasetConfigWithFallbacks.y_keys
                : []),
              "tables.granulometria.{row_key}.porc_pasa",
              "tables.granulometria.{row_key}.pasa",
            ],
            callback: (context) => {
              const isTrend = isGranulometriaTrendChart(chartConfig);
              const lines = [];
              if (isTrend) {
                const xLabel = chartConfig.x_axis?.label || "X";
                const yLabel = chartConfig.y_axis?.label || "Y";
                lines.push(`${xLabel}: ${context.parsed.x}`);
                lines.push(`${yLabel}: ${context.parsed.y}`);
              }
            }
          },
          assayContext,
        );
      }
    } else if (pointBuilderType === "group_table_rows") {
      const rows = resolveRowsForSource(sourceConfig, assayContext);
      points = buildPointsFromRowSource(
        rows,
        chartConfig,
        datasetConfigWithFallbacks,
        assayContext,
      );
    } else if (Array.isArray(datasetConfigWithFallbacks.points)) {
      points = buildPointsFromInlineConfig(
        datasetConfigWithFallbacks.points,
        chartConfig,
        assayContext,
      );
    }

    if (!points.length && (sourceConfig.data_key || "").includes("puntos_recta")) {
      console.warn(`[Visor] Ensayo ${ensayo.id} (${ensayo.codigo_ensayo}) NO generó puntos para la línea técnica. data_key: ${sourceConfig.data_key}`);
    }

    return points
      .filter(Boolean)
      .filter((p) => !shouldSkipPointByDatasetRules(p, datasetConfigWithFallbacks))
      .map((p) => ({
        ...p,
        ensayo_id: ensayo?.id,
        ensayo_codigo: ensayo?.codigo_ensayo || ensayo?.codigo_generado || "",
        ensayo_nombre: ensayo?.nombre_ensayo || "",
        progresiva: ensayo?.progresiva_nombre || ensayo?.progresiva_codigo || "-",
        estrato: hasMeaningfulValue(ensayo?.estrato_orden) ? `E: ${ensayo.estrato_orden}` : "-",
        identificador: ensayo?.identificador || ensayo?.calicata || "-",
      }));
  });
};

const buildGroupSeriesDatasetsFromEnsayos = (
  groupEnsayos = [],
  chartConfig,
  datasetConfig,
  context,
) => {
  if (!Array.isArray(groupEnsayos)) return [];

  const sourceConfig = datasetConfig.source || {};

  return groupEnsayos.flatMap((ensayo, idx) => {
    const assayContext = context.groupAssayContexts?.[idx] || buildAssayContext(ensayo, context.calculationConfig, context.tableConfig);

    const datasetConfigWithFallbacks = withGranulometriaTrendDatasetFallbacks(
      datasetConfig,
      chartConfig,
      sourceConfig,
    );

    let points = [];

    if (sourceConfig.type === "group_table_rows" || sourceConfig.type === "table_rows") {
      const rows = resolveRowsForSource(sourceConfig, assayContext);
      points = buildPointsFromRowSource(rows, chartConfig, datasetConfigWithFallbacks, assayContext);
    } else if (sourceConfig.type === "group_array" || sourceConfig.type === "array") {
      const dataArray = resolveArraySourceItems(sourceConfig, chartConfig, assayContext);
      points = buildPointsFromArraySource(dataArray, chartConfig, datasetConfigWithFallbacks, assayContext);
    } else if (Array.isArray(datasetConfig.points)) {
      points = buildPointsFromInlineConfig(datasetConfig.points, chartConfig, assayContext);
    }

    if (!points.length && (sourceConfig.data_key || "").includes("puntos_recta")) {
      console.warn(`[Visor] Ensayo ${ensayo.id} (${ensayo.codigo_ensayo}) NO generó puntos para la línea técnica. data_key: ${sourceConfig.data_key}`);
    }

    if (!points.length) return [];

    const isLine = datasetConfig.showLine !== false;
    const isRedLine = isLine && (datasetConfig.label || "").toLowerCase().includes("línea");

    return [
      {
        ...datasetConfig,
        label: `${datasetConfig.label || ""} - ${ensayo.codigo_ensayo || ensayo.id}`,
        _baseLabel: datasetConfig.label || `Serie ${datasetConfig.id || idx}`,
        _datasetGroupId: datasetConfig.id || datasetConfig.label || `group_${idx}`,
        data: points.map(p => ({
          ...p,
          ensayo_id: ensayo.id,
          ensayo_codigo: ensayo.codigo_ensayo || ensayo.codigo_generado || "",
          progresiva: ensayo.progresiva_nombre || "-",
          estrato: ensayo.estrato_nombre || "-",
          identificador: ensayo.identificador || ensayo.calicata || "-",
        })),
        type: datasetConfig.type || chartConfig.type,
        borderColor: datasetConfig.borderColor || (isRedLine ? "#dc2626" : (isLine ? "#1e40af" : "#2563eb")),
        backgroundColor: datasetConfig.backgroundColor || (isRedLine ? "rgba(220, 38, 38, 0.15)" : "rgba(37, 99, 235, 0.4)"),
        tension: datasetConfig.tension ?? chartConfig.tension ?? 0,
        fill: datasetConfig.fill ?? false,
        pointRadius: datasetConfig.pointRadius ?? (isLine ? 0 : 3),
        showLine: isLine,
        borderWidth: datasetConfig.borderWidth || (isLine ? 1.8 : 2),
        _interactiveSeries: true,
        _ensayoId: ensayo.id,
      },
    ];
  });
};

const buildPointsFromInlineConfig = (points = [], chartConfig, context) => {
  return points
    .map((p) => {
      const point = {
        x: resolveContextValueFromCandidates(
          p.x_key || chartConfig?.x_axis?.key || "x",
          context,
          {},
          p.x,
          p.x_keys || [],
          { preferNonZero: p.skip_zero_x === true, prefixes: ["results", "resultados", "data", "metadata"] },
        ),
        y: resolveContextValueFromCandidates(
          p.y_key || "y",
          context,
          {},
          p.y,
          p.y_keys || [],
          { preferNonZero: p.skip_zero_y === true, prefixes: ["results", "resultados", "data", "metadata"] },
        ),
      };
      const normalizedPoint = normalizePoint(point, chartConfig);
      return shouldSkipPointByDatasetRules(normalizedPoint, p) ? null : normalizedPoint;
    })
    .filter(Boolean);
};

const buildDataset = (chartConfig, datasetConfig, context) => {
  const sourceConfig = datasetConfig.source || chartConfig.source || {};

  if (sourceConfig.series_by === "ensayo" && Array.isArray(context.groupEnsayos)) {
    return buildGroupSeriesDatasetsFromEnsayos(context.groupEnsayos, chartConfig, datasetConfig, context);
  }

  let points = [];
  if (sourceConfig.type === "group_array" || sourceConfig.type === "group_table_rows") {
    points = buildGroupPointsFromEnsayos(context.groupEnsayos, chartConfig, datasetConfig, context);
  } else if (Array.isArray(datasetConfig.points)) {
    points = buildPointsFromInlineConfig(datasetConfig.points, chartConfig, context);
  } else if (sourceConfig.type === "array") {
    const dataArray = resolveArraySourceItems(sourceConfig, chartConfig, context);
    points = buildPointsFromArraySource(dataArray, chartConfig, datasetConfig, context);
  } else if (sourceConfig.type === "table_rows" || sourceConfig.table_key) {
    const rows = resolveRowsForSource(sourceConfig, context);
    points = buildPointsFromRowSource(rows, chartConfig, datasetConfig, context);
  }

  if (!points.length) return null;

  return {
    ...datasetConfig,
    data: points,
    type: datasetConfig.type || chartConfig.dataset_type,
    borderColor: datasetConfig.borderColor || "#2563eb",
    backgroundColor: datasetConfig.backgroundColor || "rgba(37, 99, 235, 0.16)",
    tension: datasetConfig.tension ?? chartConfig.tension ?? 0,
    fill: datasetConfig.fill ?? false,
    pointRadius: datasetConfig.pointRadius ?? 3,
    showLine: datasetConfig.showLine ?? true,
    borderWidth: datasetConfig.borderWidth ?? 2,
  };
};

const buildInteractiveDatasetStyles = (dataset) => {
  const baseBorderColor = dataset.borderColor || "#2563eb";
  const baseBackgroundColor = dataset.backgroundColor || "#93c5fd";
  const baseBorderWidth = dataset.borderWidth ?? 2;
  const basePointRadius = dataset.pointRadius ?? 3;
  const basePointHoverRadius = dataset.pointHoverRadius ?? 5;

  return {
    ...dataset,
    _baseBorderColor: baseBorderColor,
    _baseBackgroundColor: baseBackgroundColor,
    borderColor: (scriptableContext) => {
      const chart = scriptableContext.chart;
      const activeEnsayoId = chart?.$activeEnsayoId ?? null;
      if (activeEnsayoId === null) return withAlpha(baseBorderColor, 0.5);
      
      const thisDataset = chart.data.datasets[scriptableContext.datasetIndex];
      const thisEnsayoId = thisDataset?._ensayoId ?? scriptableContext.datasetIndex;
      
      return thisEnsayoId === activeEnsayoId
        ? withAlpha(baseBorderColor, 0.95)
        : withAlpha(baseBorderColor, 0.08);
    },
    backgroundColor: (scriptableContext) => {
      const chart = scriptableContext.chart;
      const activeEnsayoId = chart?.$activeEnsayoId ?? null;
      if (activeEnsayoId === null) return withAlpha(baseBackgroundColor, 0.4);
      
      const thisDataset = chart.data.datasets[scriptableContext.datasetIndex];
      const thisEnsayoId = thisDataset?._ensayoId ?? scriptableContext.datasetIndex;

      return thisEnsayoId === activeEnsayoId
        ? withAlpha(baseBackgroundColor, 0.8)
        : withAlpha(baseBackgroundColor, 0.05);
    },
    borderWidth: baseBorderWidth,
    pointRadius: (scriptableContext) => {
      const chart = scriptableContext.chart;
      const activeEnsayoId = chart?.$activeEnsayoId ?? null;
      if (activeEnsayoId === null) return basePointRadius;
      
      const thisDataset = chart.data.datasets[scriptableContext.datasetIndex];
      const thisEnsayoId = thisDataset?._ensayoId ?? scriptableContext.datasetIndex;

      return thisEnsayoId === activeEnsayoId ? basePointRadius * 1.5 : basePointRadius * 0.7;
    },
    pointHoverRadius: basePointHoverRadius,
  };
};

const buildReferenceDataset = (
  referenceConfig,
  chartConfig,
  existingDatasets,
) => {
  const allPoints = existingDatasets.flatMap((dataset) => dataset?.data || []);
  const xValues = allPoints
    .map((point) => Number(point.x))
    .filter(Number.isFinite);
  const yValues = allPoints
    .map((point) => Number(point.y))
    .filter(Number.isFinite);

  if (!xValues.length || !yValues.length) return null;

  const xMin = chartConfig?.x_axis?.min ?? Math.min(...xValues);
  const xMax = chartConfig?.x_axis?.max ?? Math.max(...xValues);
  const yMin = chartConfig?.y_axis?.min ?? Math.min(...yValues);
  const yMax = chartConfig?.y_axis?.max ?? Math.max(...yValues);

  if (referenceConfig.axis === "y" && referenceConfig.value !== undefined) {
    return {
      label: referenceConfig.label || "",
      data: [
        { x: xMin, y: referenceConfig.value },
        { x: xMax, y: referenceConfig.value },
      ],
      borderColor: referenceConfig.borderColor || "#6b7280",
      borderDash: referenceConfig.borderDash || [6, 6],
      borderWidth: referenceConfig.borderWidth ?? 1.5,
      pointRadius: 0,
      fill: false,
      parsing: false,
    };
  }

  if (referenceConfig.axis === "x" && referenceConfig.value !== undefined) {
    return {
      label: referenceConfig.label || "",
      data: [
        { x: referenceConfig.value, y: yMin },
        { x: referenceConfig.value, y: yMax },
      ],
      borderColor: referenceConfig.borderColor || "#6b7280",
      borderDash: referenceConfig.borderDash || [6, 6],
      borderWidth: referenceConfig.borderWidth ?? 1.5,
      pointRadius: 0,
      fill: false,
      parsing: false,
    };
  }

  return null;
};

const buildChartDatasets = (chartConfig, context) => {
  // Primero generamos los datasets base sin estilos dinámicos
  const rawDatasets = (
    Array.isArray(chartConfig.datasets) ? chartConfig.datasets : []
  ).flatMap((datasetConfig) => {
    const builtDataset = buildDataset(chartConfig, datasetConfig, context);
    if (!builtDataset) return [];
    return Array.isArray(builtDataset) ? builtDataset : [builtDataset];
  });

  // Ahora aplicamos los estilos basándonos en la cantidad total para optimizar
  const baseDatasets = rawDatasets
    .map((dataset) => {
      return dataset?._interactiveSeries
        ? buildInteractiveDatasetStyles(dataset)
        : dataset;
    })
    .filter(Boolean);

  const referenceDatasets = (
    Array.isArray(chartConfig.reference_lines)
      ? chartConfig.reference_lines
      : []
  )
    .map((referenceConfig) =>
      buildReferenceDataset(referenceConfig, chartConfig, baseDatasets),
    )
    .filter(Boolean);

  return [...baseDatasets, ...referenceDatasets];
};

const buildChartData = (chartConfig, datasets = []) => {
  const xAxisType = chartConfig?.x_axis?.type || "linear";

  if (xAxisType === "category") {
    const labels =
      Array.isArray(chartConfig?.x_axis?.tick_values) &&
        chartConfig.x_axis.tick_values.length
        ? chartConfig.x_axis.tick_values
        : buildCategoryValuesFromDatasets(datasets);

    return {
      labels,
      datasets,
    };
  }

  return { datasets };
};

const buildChartOptions = (chartConfig, datasets = [], isPrintMode = false) => {
  const topBands = Array.isArray(chartConfig?.decorations?.topBands)
    ? chartConfig.decorations.topBands
    : [];
  const xAxisType = chartConfig?.x_axis?.type || "linear";
  const extraTickValues = (chartConfig.reference_lines || [])
    .filter((line) => line.axis === "x" && typeof line.value === "number")
    .map((line) => line.value);
  const xTickValues =
    xAxisType === "category"
      ? Array.isArray(chartConfig?.x_axis?.tick_values) &&
        chartConfig.x_axis.tick_values.length
        ? chartConfig.x_axis.tick_values
        : buildCategoryValuesFromDatasets(datasets)
      : Array.isArray(chartConfig?.x_axis?.tick_values) &&
        chartConfig.x_axis.tick_values.length
        ? chartConfig.x_axis.tick_values
        : buildTickValuesFromDatasets(datasets, extraTickValues);
  const hasInteractiveSeries = datasets.some(
    (dataset) => dataset?._interactiveSeries,
  );
  const isGroupedLegend = hasInteractiveSeries || chartConfig.legend_mode === "grouped";

  return {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    normalized: true,
    spanGaps: true,
    animation: {
      duration: isPrintMode ? 0 : (datasets.length > 20 ? 0 : 450),
      easing: "easeOutQuart",
    },
    layout: {
      padding: {
        top: topBands.length ? 40 : 12,
        right: isPrintMode ? 16 : 12,
        bottom: isPrintMode ? 28 : 12,
        left: isPrintMode ? 16 : 8,
      },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    onHover: (event, activeElements, chart) => {
      const activeDataset = activeElements?.length
        ? chart.data.datasets[activeElements[0].datasetIndex]
        : null;

      const nextActiveEnsayoId = activeDataset 
        ? (activeDataset._ensayoId ?? activeElements[0].datasetIndex)
        : null;

      if ((chart.$activeEnsayoId ?? null) !== nextActiveEnsayoId) {
        chart.$activeEnsayoId = nextActiveEnsayoId;
        chart.update("none");
      }

      if (event?.native?.target) {
        event.native.target.style.cursor = activeElements?.length
          ? "pointer"
          : "default";
      }
    },
    elements: {
      line: {
        borderJoinStyle: "round",
        capBezierPoints: true,
        cubicInterpolationMode: "monotone",
      },
      point: {
        hitRadius: 12,
        hoverBorderWidth: 2,
      },
    },
    plugins: {
      title: {
        display: !!chartConfig.title,
        text: chartConfig.title,
        color: "#334155",
        font: { size: 17, weight: "800" },
        padding: { top: 8, bottom: 14 },
      },
      legend: {
        display: chartConfig.show_legend !== false,
        position: chartConfig.legend_position || "top",
        onClick: isGroupedLegend
          ? (_event, legendItem, legend) => {
            const chart = legend.chart;
            const groupId = legendItem._group_id;
            const isVisible = chart.isDatasetVisible(legendItem.datasetIndex);
            chart.data.datasets.forEach((ds, i) => {
              if ((ds._datasetGroupId || ds.label) === groupId) {
                chart.setDatasetVisibility(i, !isVisible);
              }
            });
            chart.update();
          }
          : undefined,
        labels: {
          usePointStyle: true,
          boxWidth: 12,
          boxHeight: 12,
          color: "#475569",
          font: { size: 12, weight: "600" },
          padding: 16,
          generateLabels: isGroupedLegend
            ? (chart) => {
              const uniqueGroups = new Map();
              chart.data.datasets.forEach((ds, i) => {
                const groupId = ds._datasetGroupId || ds.label;
                if (!uniqueGroups.has(groupId)) {
                  uniqueGroups.set(groupId, {
                    text: ds._baseLabel || ds.label,
                    fillStyle: ds._baseBackgroundColor || (typeof ds.backgroundColor === 'function' ? 'rgba(37, 99, 235, 0.5)' : ds.backgroundColor),
                    strokeStyle: ds._baseBorderColor || (typeof ds.borderColor === 'function' ? '#2563eb' : ds.borderColor),
                    lineWidth: typeof ds.borderWidth === 'function' ? 2 : (ds.borderWidth || 2),
                    hidden: !chart.isDatasetVisible(i),
                    datasetIndex: i,
                    _group_id: groupId,
                    pointStyle: ds.pointStyle || (ds.showLine === false ? 'circle' : 'line'),
                  });
                }
              });
              return Array.from(uniqueGroups.values());
            }
            : undefined,
          filter: (legendItem) => legendItem.text !== "",
        },
      },
      tooltip: {
        enabled: true,
        mode: "nearest",
        intersect: false,
        backgroundColor: "rgba(17, 24, 39, 0.92)",
        titleColor: "#f9fafb",
        bodyColor: "#e5e7eb",
        borderColor: "rgba(56, 189, 248, 0.24)",
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          title: (tooltipItems) => {
            const raw = tooltipItems[0]?.raw || {};
            return raw.ensayo_codigo ? `Ensayo: ${raw.ensayo_codigo}` : "Datos del ensayo";
          },
          label: (tooltipItem) => {
            const chart = tooltipItem.chart;
            const xLabel = chart.options.scales.x.title.text || "X";
            const yLabel = chart.options.scales.y.title.text || "Y";

            const xVal = formatNumericLabel(tooltipItem.raw?.x);
            const yVal = formatNumericLabel(tooltipItem.raw?.y);

            return [`${xLabel}: ${xVal}`, `${yLabel}: ${yVal}`];
          },
          afterLabel: (tooltipItem) => {
            const raw = tooltipItem.raw || {};
            const details = [];
            if (raw.progresiva && raw.progresiva !== "-") details.push(`Progresiva: ${raw.progresiva}`);
            if (raw.estrato && raw.estrato !== "-") details.push(`Estrato: ${raw.estrato}`);
            if (raw.identificador && raw.identificador !== "-")
              details.push(`Muestra/C: ${raw.identificador}`);
            return details;
          },
        },
      },
      datalabels: {
        display: false,
      },
      engineeringDecorations: {
        ...(chartConfig.decorations || {}),
        topBands,
      },
    },
    scales: {
      x: {
        type: xAxisType,
        title: {
          display: !!chartConfig?.x_axis?.label,
          text: chartConfig?.x_axis?.label || "",
          color: "#2563eb",
          font: { size: 13, weight: "700" },
          padding: { top: isPrintMode ? 4 : 12 },
        },
        reverse: chartConfig?.x_axis?.reverse || false,
        min: chartConfig?.x_axis?.min,
        max: chartConfig?.x_axis?.max,
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
          drawBorder: false,
        },
        border: {
          color: "rgba(148, 163, 184, 0.25)",
        },
        ticks: {
          color: "#64748b",
          font: { size: 11, weight: "600" },
          maxRotation: 45,
          minRotation: 0,
          callback: function callback(value) {
            if (xAxisType === "category") {
              const categoryLabel = this.getLabelForValue
                ? this.getLabelForValue(value)
                : value;
              if (xTickValues.length && !xTickValues.includes(categoryLabel))
                return "";
              return String(categoryLabel);
            }

            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) return "";
            if (
              xTickValues.length &&
              !xTickValues.some((tickValue) =>
                nearlyEqual(tickValue, numericValue, 0.001),
              )
            ) {
              return "";
            }
            return formatNumericLabel(numericValue);
          },
          ...(chartConfig?.x_axis?.ticks || {}),
        },
      },
      y: {
        type: chartConfig?.y_axis?.type || "linear",
        title: {
          display: !!chartConfig?.y_axis?.label,
          text: chartConfig?.y_axis?.label || "",
          color: "#2563eb",
          font: { size: 13, weight: "700" },
        },
        reverse: chartConfig?.y_axis?.reverse || false,
        min: chartConfig?.y_axis?.min,
        max: chartConfig?.y_axis?.max,
        grid: {
          color: "rgba(148, 163, 184, 0.20)",
          drawBorder: false,
        },
        border: {
          color: "rgba(148, 163, 184, 0.25)",
        },
        ticks: {
          color: "#64748b",
          font: { size: 11, weight: "600" },
          callback: (value) => formatNumericLabel(value),
          ...(chartConfig?.y_axis?.ticks || {}),
        },
      },
    },
  };
};

const normalizeChartsConfig = (graficosConfig) => {
  if (!graficosConfig) return { single: [], group: [] };

  if (Array.isArray(graficosConfig)) {
    return {
      single: graficosConfig.filter((chart) => chart?.scope !== "group"),
      group: graficosConfig.filter((chart) => chart?.scope === "group"),
    };
  }

  if (typeof graficosConfig === "object") {
    const charts = Array.isArray(graficosConfig.charts)
      ? graficosConfig.charts
      : [];
    const aggregateCharts = Array.isArray(graficosConfig.aggregate_charts)
      ? graficosConfig.aggregate_charts
      : Array.isArray(graficosConfig.list_view_charts)
        ? graficosConfig.list_view_charts
        : [];
    const singleObjectChart =
      !Array.isArray(graficosConfig.charts) &&
        hasMeaningfulValue(graficosConfig.id) &&
        Array.isArray(graficosConfig.datasets)
        ? [graficosConfig]
        : [];

    return {
      single: [...singleObjectChart, ...charts].filter(
        (chart) => chart?.scope !== "group",
      ),
      group: [
        ...charts.filter((chart) => chart?.scope === "group"),
        ...aggregateCharts,
      ],
    };
  }

  return { single: [], group: [] };
};

const VisorGraficos = ({
  graficosConfig,
  resultados,
  formData,
  tableConfig,
  scope = "single",
  groupEnsayos = [],
  calculationConfig = null,
  targetChartId = null,
  isPrintMode = false,
  printHeight = null, // Altura de impresión forzada desde el reportConfig (ej: '95mm')
}) => {
  const chartRefs = useRef({});
  const getChartHeight = (chartConfig = {}) => {
    if (isPrintMode) {
      // Prioridad 1: altura forzada desde el padre (reportConfig)
      if (printHeight) return printHeight;
      // Prioridad 2: altura en el propio chartConfig de la DB
      const rawHeight = chartConfig?.height;
      if (typeof rawHeight === 'string' && rawHeight.endsWith('mm')) {
        return rawHeight;
      }
      return Number(rawHeight) ? `${Number(rawHeight)}px` : "220px";
    }
    return Math.max(Number(chartConfig?.height) || 0, 480);
  };
  const charts = useMemo(() => {
    const normalized = normalizeChartsConfig(graficosConfig);
    const selectedCharts = scope === "group" ? normalized.group : normalized.single;
    if (targetChartId) {
      return selectedCharts.filter(
        (chart) => chart?.id === targetChartId || chart?.chartConfigKey === targetChartId
      );
    }
    return selectedCharts;
  }, [graficosConfig, scope, targetChartId]);

  const mergedData = useMemo(
    () => deepMerge(formData || {}, resultados || {}),
    [formData, resultados],
  );

  // OPTIMIZACIÓN: Pre-calculamos los contextos de todos los ensayos una sola vez
  const groupAssayContexts = useMemo(() => {
    if (!groupEnsayos || !groupEnsayos.length) return [];
    if (groupEnsayos.length > 0) {
      console.log("[Visor] DEBUG - Estructura del primer ensayo:", {
        id: groupEnsayos[0].id,
        keys_datos_formulario: Object.keys(groupEnsayos[0].datos_formulario || {}),
        keys_resultado: Object.keys(groupEnsayos[0].resultado || {}),
        first_assay_raw: groupEnsayos[0]
      });
    }
    return groupEnsayos.map((ensayo) =>
      buildAssayContext(ensayo, calculationConfig, tableConfig),
    );
  }, [groupEnsayos, calculationConfig, tableConfig]);

  const context = useMemo(
    () => ({
      data: mergedData,
      resultados: resultados || {},
      formData: formData || {},
      tableConfig: tableConfig || {},
      groupEnsayos,
      groupAssayContexts, // Inyectamos los contextos pre-calculados
      calculationConfig,
    }),
    [
      mergedData,
      resultados,
      formData,
      tableConfig,
      groupEnsayos,
      groupAssayContexts,
      calculationConfig,
    ],
  );

  const preparedCharts = useMemo(() => {
    const prepared = charts
      .map((chartConfig) => {
        const datasets = buildChartDatasets(chartConfig, context);
        if (datasets.length === 0) {
          console.warn(`[Visor] Gráfico "${chartConfig.title || chartConfig.id}" descartado: 0 datasets generados.`);
        }
        return { chartConfig, datasets };
      })
      .filter((entry) => entry.datasets.length > 0);

    console.log(`[Visor] Gráficos finales a renderizar: ${prepared.length}`, prepared.map(p => p.chartConfig.title));
    return prepared;
  }, [charts, context]);

  useEffect(() => {
    const chartInstances = {};

    preparedCharts.forEach(({ chartConfig, datasets }, index) => {
      const chartId = chartConfig.id || `grafico-${index}`;
      const canvas = chartRefs.current[chartId];
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;


      chartInstances[chartId] = new Chart(ctx, {
        type: chartConfig.type || "line",
        data: buildChartData(chartConfig, datasets),
        options: buildChartOptions(chartConfig, datasets, isPrintMode),
      });
    });

    return () => {
      Object.values(chartInstances).forEach((chart) => chart.destroy());
    };
  }, [preparedCharts]);

  if (!charts.length) {
    return (
      <div className="alert alert-info">
        {scope === "group"
          ? "No hay gráficos de tendencia configurados para este tipo de ensayo."
          : "No hay gráficos configurados para este tipo de ensayo."}
      </div>
    );
  }

  if (!preparedCharts.length) {
    return (
      <div className="alert alert-info">
        {scope === "group"
          ? "No hay puntos suficientes para construir la tendencia de este tipo."
          : "No hay puntos suficientes para construir los gráficos de este ensayo."}
      </div>
    );
  }

  if (isPrintMode) {
    return (
      <div className="visor-graficos-print-wrapper" style={{ width: "100%", height: "100%", padding: 0, margin: 0 }}>
        {preparedCharts.map(({ chartConfig }, index) => {
          const chartId = chartConfig.id || `grafico-${index}`;
          return (
            <div 
              key={chartId} 
              className="chart-container-print" 
              style={{ 
                width: "100%", 
                height: "100%", 
                position: "relative",
                padding: "4px",
                border: "none",
                backgroundColor: "#ffffff",
                boxSizing: "border-box"
              }}
            >
              <canvas
                ref={(element) => {
                  chartRefs.current[chartId] = element;
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="container-fluid visor-graficos-scroll"
      style={{
        height: 'auto',
        minHeight: '400px',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '15px 20px',
        scrollBehavior: 'smooth'
      }}
    >
      <div className="row">
        {preparedCharts.map(({ chartConfig }, index) => {
          const chartId = chartConfig.id || `grafico-${index}`;
          return (
            <div className="col-12 mb-4" key={chartId}>
              <div
                className="chart-container"
                style={{
                  minHeight: getChartHeight(chartConfig),
                  padding: "18px 18px 14px",
                  borderRadius: "24px",
                  background: `
                                        radial-gradient(circle at top left, rgba(56,189,248,0.12), transparent 26%),
                                        radial-gradient(circle at top right, rgba(37,99,235,0.10), transparent 24%),
                                        linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)
                                    `,
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: `
                                        inset 0 1px 0 rgba(255,255,255,0.95),
                                        0 24px 48px rgba(15, 23, 42, 0.12),
                                        0 0 0 1px rgba(56, 189, 248, 0.04)
                                    `,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "10px",
                    borderRadius: "18px",
                    border: "1px solid rgba(56, 189, 248, 0.10)",
                    boxShadow: "inset 0 0 24px rgba(56, 189, 248, 0.05)",
                    pointerEvents: "none",
                  }}
                />
                <canvas
                  ref={(element) => {
                    chartRefs.current[chartId] = element;
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisorGraficos;
