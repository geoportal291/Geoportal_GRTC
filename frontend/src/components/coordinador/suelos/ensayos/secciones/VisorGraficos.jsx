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
  let fallbackValue = defaultValue;
  const debugTrail = [];

  for (const candidate of candidates) {
    const value = resolveContextValue(
      candidate,
      context,
      rowContext,
      undefined,
    );

    const isPresent = value !== undefined && value !== null && value !== "";

    if (options.debugMeta) {
      debugTrail.push({ candidate, value });
    }

    if (isPresent) {
      const numericValue = toFiniteNumber(value);
      const isZero = numericValue === 0;

      if (options.preferNonZero && isZero) {
        if (fallbackValue === defaultValue) {
          fallbackValue = value;
        }
        continue;
      }

      if (options.debugMeta) {
        console.debug(
          `[Grafico tendencia] candidato seleccionado ${JSON.stringify({
            ...options.debugMeta,
            candidate,
            value,
            candidates: debugTrail,
          })}`,
        );
      }
      return value;
    }
  }

  if (options.debugMeta) {
    console.debug(
      `[Grafico tendencia] sin candidato util, usando fallback ${JSON.stringify({
        ...options.debugMeta,
        fallback: fallbackValue,
        candidates: debugTrail,
      })}`,
    );
  }

  // Si preferimos no-ceros y lo único que encontramos fue un cero, 
  // devolvemos el defaultValue (que suele ser undefined) para que el punto se omita.
  if (options.preferNonZero && toFiniteNumber(fallbackValue) === 0) {
    return defaultValue;
  }

  return fallbackValue;
};

const resolveArraySourceItems = (
  sourceConfig = {},
  chartConfig = {},
  context,
) => {
  const candidateKeys = normalizeCandidatePaths(
    sourceConfig.data_key || chartConfig.data_key,
    sourceConfig.data_keys || [],
  );

  for (const candidateKey of candidateKeys) {
    const dataArray = resolveContextValue(candidateKey, context, {}, []);
    if (Array.isArray(dataArray) && dataArray.length) {
      return dataArray;
    }
  }

  return [];
};

const buildAssayContext = (
  ensayo = {},
  fallbackCalculationConfig = null,
  fallbackTableConfig = null,
) => {
  const formData = ensayo?.datos_formulario || ensayo?.formData || {};
  let resultados = ensayo?.resultado || ensayo?.resultados || {};

  if (
    (!resultados || !Object.keys(resultados).length) &&
    ensayo?.config_calculos &&
    formData &&
    Object.keys(formData).length
  ) {
    try {
      resultados = calcularResultados(ensayo.config_calculos, formData) || {};
    } catch (_error) {
      resultados = {};
    }
  } else if (
    (!resultados || !Object.keys(resultados).length) &&
    fallbackCalculationConfig &&
    formData &&
    Object.keys(formData).length
  ) {
    try {
      resultados =
        calcularResultados(fallbackCalculationConfig, formData) || {};
    } catch (_error) {
      resultados = {};
    }
  }

  const mergedData = deepMerge(formData || {}, resultados || {});

  return {
    data: mergedData,
    resultados: resultados || {},
    formData: formData || {},
    tableConfig:
      ensayo?.config_tabla || ensayo?.tableConfig || fallbackTableConfig || {},
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
            datasetConfig.x_key || chartConfig?.x_axis?.key,
            context,
            rowContext,
            undefined,
            datasetConfig.x_keys || [],
            { preferNonZero: datasetConfig.skip_zero_x === true },
          ),
          y: resolveContextValueFromCandidates(
            datasetConfig.y_key,
            context,
            rowContext,
            undefined,
            datasetConfig.y_keys || [],
            { preferNonZero: datasetConfig.skip_zero_y === true },
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
      if (isTrendDebug && shouldSkip) {
        console.debug(
          `[Grafico tendencia] punto omitido por reglas ${JSON.stringify({
            ensayo:
              context?.ensayo?.codigo_ensayo ||
              context?.ensayo?.codigo_generado ||
              context?.ensayo?.id,
            point,
            skip_zero_x: datasetConfig.skip_zero_x,
            skip_zero_y: datasetConfig.skip_zero_y,
          })}`,
        );
      }
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

    return points.map((point) => ({
      ...point,
      ensayo_id: ensayo?.id,
      ensayo_codigo: ensayo?.codigo_ensayo || ensayo?.codigo_generado || "",
      ensayo_nombre: ensayo?.nombre_ensayo || "",
    }));
  });
};

const buildGroupSeriesDatasetsFromEnsayos = (
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

    if (!points.length) return [];

    const sanitizedPoints = points
      .filter(Boolean)
      .filter((point) =>
        !shouldSkipPointByDatasetRules(point, datasetConfigWithFallbacks),
      )
      .sort((a, b) => {
        const xA = toFiniteNumber(a?.x);
        const xB = toFiniteNumber(b?.x);
        if (xA === null && xB === null) return 0;
        if (xA === null) return 1;
        if (xB === null) return -1;
        return xB - xA;
      });

    if (!sanitizedPoints.length) return [];

    if (isGranulometriaTrendChart(chartConfig)) {
      console.debug(
        `[Grafico tendencia] resumen por ensayo ${JSON.stringify({
          ensayo: ensayo?.codigo_ensayo || ensayo?.codigo_generado || ensayo?.id,
          progresiva: ensayo?.progresiva_nombre || ensayo?.progresiva_codigo,
          estrato: ensayo?.estrato_orden,
          identificador: ensayo?.identificador || ensayo?.calicata,
          totalPointsBeforeSanitize: points.length,
          totalPointsAfterSanitize: sanitizedPoints.length,
          zeroLikePointsRemaining: sanitizedPoints.filter(
            (point) => toFiniteNumber(point?.y) === 0,
          ).length,
          points: sanitizedPoints.map((point) => ({
            x: point?.x,
            y: point?.y,
          })),
        })}`,
      );
    }

    const progresiva =
      ensayo?.progresiva_nombre || ensayo?.progresiva_codigo || "-";
    const estrato = hasMeaningfulValue(ensayo?.estrato_orden)
      ? `E: ${ensayo.estrato_orden}`
      : "-";
    const identificador = ensayo?.identificador || ensayo?.calicata || "-";

    return [
      {
        label:
          datasetConfig.label ||
          ensayo?.codigo_ensayo ||
          ensayo?.codigo_generado ||
          ensayo?.nombre_ensayo ||
          "Curva granulométrica",
        data: sanitizedPoints.map((point) => ({
          ...point,
          ensayo_id: ensayo?.id,
          ensayo_codigo: ensayo?.codigo_ensayo || ensayo?.codigo_generado || "",
          ensayo_nombre: ensayo?.nombre_ensayo || "",
          progresiva,
          estrato,
          identificador,
        })),
        type: datasetConfig.type || chartConfig.dataset_type || chartConfig.type,
        borderColor: datasetConfig.borderColor || "#2563eb",
        backgroundColor:
          datasetConfig.backgroundColor || "rgba(37, 99, 235, 0.22)",
        tension: datasetConfig.tension ?? chartConfig.tension ?? 0,
        fill: datasetConfig.fill ?? false,
        pointRadius: datasetConfig.pointRadius ?? 3,
        pointHoverRadius: datasetConfig.pointHoverRadius ?? 5,
        showLine: datasetConfig.showLine ?? true,
        pointStyle: datasetConfig.pointStyle,
        borderDash: datasetConfig.borderDash,
        borderWidth: datasetConfig.borderWidth ?? 1.6,
        stepped: datasetConfig.stepped,
        parsing: false,
        hidden: datasetConfig.hidden ?? false,
        _interactiveSeries: true,
      },
    ];
  });
};

const buildPointsFromInlineConfig = (points = [], chartConfig, context) => {
  return points
    .map((point, index) => {
      const rowContext = { index, ...point };

      // Filtrado dinámico por clave externa (ej: omitir si el valor es 0 o está vacío)
      if (point.filter_zero_key) {
        const filterVal = resolveContextValue(
          point.filter_zero_key,
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

      const xValue = point?.x_key
        ? resolveContextValueFromCandidates(
          point.x_key,
          context,
          rowContext,
          undefined,
          point.x_keys || [],
          { preferNonZero: point.skip_zero_x === true },
        )
        : point?.x;
      const yValue = point?.y_key
        ? resolveContextValueFromCandidates(
          point.y_key,
          context,
          rowContext,
          undefined,
          point.y_keys || [],
          { preferNonZero: point.skip_zero_y === true },
        )
        : point?.y;

      const normalizedPoint = normalizePoint(
        {
          x: xValue,
          y: yValue,
        },
        chartConfig,
      );

      if (shouldSkipPointByDatasetRules(normalizedPoint, point)) {
        return null;
      }

      return normalizedPoint;
    })
    .filter(Boolean);
};

const buildDataset = (chartConfig, datasetConfig, context) => {
  const sourceConfig = datasetConfig.source || chartConfig.source || {};
  let points = [];

  if (
    sourceConfig.series_by === "ensayo" &&
    Array.isArray(context.groupEnsayos)
  ) {
    return buildGroupSeriesDatasetsFromEnsayos(
      context.groupEnsayos,
      chartConfig,
      datasetConfig,
      context,
    );
  }

  if (
    (sourceConfig.type === "group_array" ||
      sourceConfig.type === "group_table_rows") &&
    Array.isArray(context.groupEnsayos)
  ) {
    points = buildGroupPointsFromEnsayos(
      context.groupEnsayos,
      chartConfig,
      datasetConfig,
      context,
    );
  } else if (Array.isArray(datasetConfig.points)) {
    points = buildPointsFromInlineConfig(
      datasetConfig.points,
      chartConfig,
      context,
    );
  } else if (sourceConfig.type === "array" || chartConfig.data_key) {
    const dataArray = resolveArraySourceItems(
      sourceConfig,
      chartConfig,
      context,
    );
    points = buildPointsFromArraySource(
      dataArray,
      chartConfig,
      datasetConfig,
      context,
    );
  } else if (
    sourceConfig.type === "table_rows" ||
    sourceConfig.table_key ||
    sourceConfig.rows_path ||
    Array.isArray(sourceConfig.rows)
  ) {
    const rows = resolveRowsForSource(sourceConfig, context);
    points = buildPointsFromRowSource(
      rows,
      chartConfig,
      datasetConfig,
      context,
    );
  }

  if (!points.length) return null;

  return {
    label: datasetConfig.label,
    data: points,
    type: datasetConfig.type || chartConfig.dataset_type,
    borderColor: datasetConfig.borderColor || "#2563eb",
    backgroundColor: datasetConfig.backgroundColor || "rgba(37, 99, 235, 0.16)",
    tension: datasetConfig.tension ?? chartConfig.tension ?? 0,
    fill: datasetConfig.fill ?? false,
    pointRadius: datasetConfig.pointRadius ?? 3,
    pointHoverRadius: datasetConfig.pointHoverRadius ?? 5,
    showLine: datasetConfig.showLine ?? true,
    pointStyle: datasetConfig.pointStyle,
    borderDash: datasetConfig.borderDash,
    borderWidth: datasetConfig.borderWidth ?? 2,
    stepped: datasetConfig.stepped,
    parsing: false,
  };
};

const buildInteractiveDatasetStyles = (dataset, isMassive = false) => {
  const baseBorderColor = dataset.borderColor || "#2563eb";
  const baseBackgroundColor = dataset.backgroundColor || "#93c5fd";
  const baseBorderWidth = dataset.borderWidth ?? 2;
  const basePointRadius = dataset.pointRadius ?? 3;
  const basePointHoverRadius = dataset.pointHoverRadius ?? 5;

  // Si hay demasiados datos, simplificamos los estilos interactivos para ganar FPS
  if (isMassive) {
    return {
      ...dataset,
      borderColor: withAlpha(baseBorderColor, 0.4),
      backgroundColor: withAlpha(baseBackgroundColor, 0.15),
      borderWidth: 1.2,
      pointRadius: 1.5,
      pointHoverRadius: 4,
    };
  }

  return {
    ...dataset,
    borderColor: (scriptableContext) => {
      const activeDatasetIndex =
        scriptableContext.chart?.$activeDatasetIndex ?? null;
      const showCurves = scriptableContext.chart?.$showCurves !== false;
      if (!showCurves) return withAlpha(baseBorderColor, 0);
      if (activeDatasetIndex === null) return baseBorderColor;
      return scriptableContext.datasetIndex === activeDatasetIndex
        ? withAlpha(baseBorderColor, 0.95)
        : withAlpha(baseBorderColor, 0.08);
    },
    backgroundColor: (scriptableContext) => {
      const activeDatasetIndex =
        scriptableContext.chart?.$activeDatasetIndex ?? null;
      const showPoints = scriptableContext.chart?.$showPoints !== false;
      if (!showPoints) return withAlpha(baseBackgroundColor, 0);
      if (activeDatasetIndex === null) return baseBackgroundColor;
      return scriptableContext.datasetIndex === activeDatasetIndex
        ? withAlpha(baseBackgroundColor, 0.82)
        : withAlpha(baseBackgroundColor, 0.1);
    },
    borderWidth: (scriptableContext) => {
      const activeDatasetIndex =
        scriptableContext.chart?.$activeDatasetIndex ?? null;
      const showCurves = scriptableContext.chart?.$showCurves !== false;
      if (!showCurves) return 0;
      if (activeDatasetIndex === null) return baseBorderWidth;
      return scriptableContext.datasetIndex === activeDatasetIndex ? 2.8 : 0.8;
    },
    pointRadius: (scriptableContext) => {
      const activeDatasetIndex =
        scriptableContext.chart?.$activeDatasetIndex ?? null;
      const showPoints = scriptableContext.chart?.$showPoints !== false;
      if (!showPoints) return 0;
      if (activeDatasetIndex === null) return basePointRadius;
      return scriptableContext.datasetIndex === activeDatasetIndex ? 4.8 : 2.2;
    },
    pointHoverRadius: (scriptableContext) =>
      scriptableContext.chart?.$showPoints === false ? 0 : basePointHoverRadius,
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
      const isMassive =
        dataset?.data?.length > 1000 || rawDatasets.length > 50;
      return dataset?._interactiveSeries
        ? buildInteractiveDatasetStyles(dataset, isMassive)
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

const buildChartOptions = (chartConfig, datasets = []) => {
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
  const usesCurvePointToggleLegend =
    chartConfig.legend_mode === "curves_points_toggle" && hasInteractiveSeries;

  return {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    normalized: true,
    spanGaps: true,
    animation: {
      duration: datasets.length > 20 ? 0 : 450,
      easing: "easeOutQuart",
    },
    layout: {
      padding: {
        top: topBands.length ? 40 : 12,
        right: 12,
        bottom: 8,
        left: 8,
      },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    onHover: (event, activeElements, chart) => {
      const nextActiveDatasetIndex = activeElements?.length
        ? activeElements[0].datasetIndex
        : null;

      if ((chart.$activeDatasetIndex ?? null) !== nextActiveDatasetIndex) {
        chart.$activeDatasetIndex = nextActiveDatasetIndex;
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
        onClick: usesCurvePointToggleLegend
          ? (_event, legendItem, legend) => {
            const chart = legend.chart;
            if (legendItem.text === "Curvas") {
              chart.$showCurves = chart.$showCurves === false ? true : false;
            }
            if (legendItem.text === "Puntos") {
              chart.$showPoints = chart.$showPoints === false ? true : false;
            }
            chart.update("none");
          }
          : undefined,
        labels: {
          usePointStyle: true,
          boxWidth: 12,
          boxHeight: 12,
          color: "#475569",
          font: { size: 12, weight: "600" },
          padding: 16,
          generateLabels: usesCurvePointToggleLegend
            ? (chart) => [
              {
                text: "Curvas",
                fillStyle:
                  chart.$showCurves === false
                    ? "rgba(148, 163, 184, 0.35)"
                    : "#2563eb",
                strokeStyle:
                  chart.$showCurves === false
                    ? "rgba(148, 163, 184, 0.35)"
                    : "#2563eb",
                lineWidth: 2,
                hidden: chart.$showCurves === false,
                datasetIndex: 0,
                pointStyle: "line",
              },
              {
                text: "Puntos",
                fillStyle:
                  chart.$showPoints === false
                    ? "rgba(148, 163, 184, 0.35)"
                    : "rgba(37, 99, 235, 0.55)",
                strokeStyle:
                  chart.$showPoints === false
                    ? "rgba(148, 163, 184, 0.35)"
                    : "rgba(37, 99, 235, 0.9)",
                lineWidth: 1,
                hidden: chart.$showPoints === false,
                datasetIndex: 0,
                pointStyle: "circle",
              },
            ]
            : undefined,
          filter: (legendItem, chartData) =>
            legendItem.text !== "" &&
            (!chartData.datasets?.[legendItem.datasetIndex]
              ?._interactiveSeries ||
              usesCurvePointToggleLegend),
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
            return "Datos del ensayo";
          },
          label: (tooltipItem) => {
            const xLabel = formatNumericLabel(tooltipItem.raw?.x);
            const yLabel = formatNumericLabel(tooltipItem.raw?.y);
            return [`Abertura: ${xLabel} mm`, `% que pasa: ${yLabel}`];
          },
          afterLabel: (tooltipItem) => {
            const raw = tooltipItem.raw || {};
            const details = [];
            if (raw.progresiva) details.push(`Progresiva: ${raw.progresiva}`);
            if (raw.estrato) details.push(`Estrato: ${raw.estrato}`);
            if (raw.identificador)
              details.push(`Calicata: ${raw.identificador}`);
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
          padding: { top: 12 },
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
}) => {
  const chartRefs = useRef({});
  const getChartHeight = (chartConfig = {}) =>
    Math.max(Number(chartConfig?.height) || 0, 480);
  const charts = useMemo(() => {
    const normalized = normalizeChartsConfig(graficosConfig);
    return scope === "group" ? normalized.group : normalized.single;
  }, [graficosConfig, scope]);

  const mergedData = useMemo(
    () => deepMerge(formData || {}, resultados || {}),
    [formData, resultados],
  );

  // OPTIMIZACIÓN: Pre-calculamos los contextos de todos los ensayos una sola vez
  const groupAssayContexts = useMemo(() => {
    if (!groupEnsayos || !groupEnsayos.length) return [];
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

  const preparedCharts = useMemo(
    () =>
      charts
        .map((chartConfig) => ({
          chartConfig,
          datasets: buildChartDatasets(chartConfig, context),
        }))
        .filter((entry) => entry.datasets.length > 0),
    [charts, context],
  );

  useEffect(() => {
    const chartInstances = {};

    preparedCharts.forEach(({ chartConfig, datasets }, index) => {
      const chartId = chartConfig.id || `grafico-${index}`;
      const canvas = chartRefs.current[chartId];
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      if (
        chartId === "curva_compactacion" ||
        chartId === "humedad_por_prueba" ||
        chartId === "densidad_seca_por_prueba"
      ) {
        console.log("[VisorGraficos][Proctor] valores relevantes", {
          chartId,
          humedad: {
            m1: getValue(mergedData, "tables.calculo_humedad.m1.humedad"),
            m2: getValue(mergedData, "tables.calculo_humedad.m2.humedad"),
            m3: getValue(mergedData, "tables.calculo_humedad.m3.humedad"),
            m4: getValue(mergedData, "tables.calculo_humedad.m4.humedad"),
          },
          densidadSeca: {
            m1: getValue(mergedData, "tables.calculo_humedad.m1.densidad_seca"),
            m2: getValue(mergedData, "tables.calculo_humedad.m2.densidad_seca"),
            m3: getValue(mergedData, "tables.calculo_humedad.m3.densidad_seca"),
            m4: getValue(mergedData, "tables.calculo_humedad.m4.densidad_seca"),
          },
          resultados: {
            humedad_optima: getValue(mergedData, "results.humedad_optima"),
            maxima_densidad_seca: getValue(
              mergedData,
              "results.maxima_densidad_seca",
            ),
          },
        });
      }

      chartInstances[chartId] = new Chart(ctx, {
        type: chartConfig.type || "line",
        data: buildChartData(chartConfig, datasets),
        options: buildChartOptions(chartConfig, datasets),
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

  return (
    <div className="container-fluid">
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
