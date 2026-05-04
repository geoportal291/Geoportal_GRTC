import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';

Chart.register(...registerables);

const engineeringDecorationsPlugin = {
    id: 'engineeringDecorations',
    beforeDraw(chart, _args, options) {
        const { ctx, chartArea } = chart;
        if (!chartArea || !options) return;

        const {
            background = true,
            backgroundColorTop = '#f9fcff',
            backgroundColorBottom = '#eef6ff',
            gridGlow = 'rgba(56, 189, 248, 0.10)',
            topBands = []
        } = options;

        if (background) {
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, backgroundColorTop);
            gradient.addColorStop(1, backgroundColorBottom);

            ctx.save();
            ctx.fillStyle = gradient;
            ctx.fillRect(
                chartArea.left,
                chartArea.top,
                chartArea.right - chartArea.left,
                chartArea.bottom - chartArea.top
            );
            ctx.restore();
        }

        ctx.save();
        ctx.strokeStyle = gridGlow;
        ctx.lineWidth = 1;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.12)';
        ctx.shadowBlur = 12;
        ctx.strokeRect(
            chartArea.left,
            chartArea.top,
            chartArea.right - chartArea.left,
            chartArea.bottom - chartArea.top
        );
        ctx.restore();

        if (!topBands.length) return;

        const bandHeight = options.bandHeight || 24;
        const bandTop = chartArea.top + 6;
        const chartWidth = chartArea.right - chartArea.left;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '600 12px "Segoe UI", sans-serif';

        topBands.forEach((band) => {
            const start = Math.max(0, Math.min(1, band.start ?? 0));
            const end = Math.max(start, Math.min(1, band.end ?? 1));
            const left = chartArea.left + (chartWidth * start);
            const width = chartWidth * (end - start);

            ctx.fillStyle = band.backgroundColor || 'rgba(255, 255, 255, 0.82)';
            ctx.strokeStyle = band.borderColor || 'rgba(56, 189, 248, 0.28)';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.08)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(left, bandTop, width, bandHeight, 7);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = band.color || '#0f172a';
            ctx.fillText(band.label || '', left + (width / 2), bandTop + (bandHeight / 2));
        });

        ctx.restore();
    }
};

Chart.register(engineeringDecorationsPlugin);

const getValue = (obj, path, defaultValue = undefined) => {
    if (!path || typeof path !== 'string') return defaultValue;
    const value = path.split('.').reduce((current, key) => (current ? current[key] : undefined), obj);
    return value !== undefined && value !== null ? value : defaultValue;
};

const deepMerge = (base = {}, incoming = {}) => {
    const output = Array.isArray(base) ? [...base] : { ...base };

    Object.entries(incoming || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            output[key] = [...value];
            return;
        }

        if (value && typeof value === 'object') {
            const currentValue = output[key];
            output[key] = deepMerge(
                currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue) ? currentValue : {},
                value
            );
            return;
        }

        if (value !== undefined) {
            output[key] = value;
        }
    });

    return output;
};

const formatNumericLabel = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return String(value ?? '');
    if (Math.abs(numericValue) >= 10) return numericValue.toFixed(0);
    if (Math.abs(numericValue) >= 1) return numericValue.toFixed(2).replace(/\.?0+$/, '');
    return numericValue.toFixed(3).replace(/\.?0+$/, '');
};

const nearlyEqual = (a, b, tolerance = 0.0001) => Math.abs(Number(a) - Number(b)) <= tolerance;

const buildTickValuesFromDatasets = (datasets = [], extraValues = []) => {
    const values = datasets
        .flatMap((dataset) => Array.isArray(dataset?.data) ? dataset.data.map((point) => Number(point.x)) : [])
        .concat(extraValues.map(Number))
        .filter((value) => Number.isFinite(value) && value > 0);

    return [...new Set(values)].sort((a, b) => b - a);
};

const buildCategoryValuesFromDatasets = (datasets = []) => {
    const values = datasets
        .flatMap((dataset) => Array.isArray(dataset?.data) ? dataset.data.map((point) => point.x) : [])
        .filter((value) => value !== null && value !== undefined && value !== '');

    return [...new Set(values)];
};

const getTablesConfigList = (tableConfig = {}) => {
    if (Array.isArray(tableConfig?.tables)) return tableConfig.tables;

    if (tableConfig?.tables && typeof tableConfig.tables === 'object') {
        return Object.entries(tableConfig.tables).map(([key, config]) => ({
            key: config?.key || key,
            ...config
        }));
    }

    return [];
};

const getTableDefinition = (tableConfig, tableKey) =>
    getTablesConfigList(tableConfig).find((table) => table?.key === tableKey) || null;

const resolveTemplate = (value, rowContext = {}) => {
    if (typeof value !== 'string') return value;
    return value.replace(/\{([^}]+)\}/g, (_, token) => {
        const replacement = getValue(rowContext, token, rowContext[token]);
        return replacement === undefined || replacement === null ? '' : String(replacement);
    });
};

const resolveContextValue = (path, context, rowContext = {}, defaultValue = undefined) => {
    if (path === null || path === undefined) return defaultValue;
    if (typeof path !== 'string') return path;

    const resolvedPath = resolveTemplate(path, rowContext);
    if (!resolvedPath) return defaultValue;

    const rootMatchers = [
        ['data.', context.data],
        ['resultados.', context.resultados],
        ['formData.', context.formData],
        ['tableConfig.', context.tableConfig]
    ];

    for (const [prefix, root] of rootMatchers) {
        if (resolvedPath.startsWith(prefix)) {
            return getValue(root, resolvedPath.slice(prefix.length), defaultValue);
        }
    }

    const rowDirectValue = getValue(rowContext, resolvedPath);
    if (rowDirectValue !== undefined && rowDirectValue !== null) return rowDirectValue;
    if (rowContext[resolvedPath] !== undefined && rowContext[resolvedPath] !== null) return rowContext[resolvedPath];

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

const normalizeRowsSource = (rows = [], sourceConfig = {}) => {
    const includeKeys = Array.isArray(sourceConfig.include_keys) ? sourceConfig.include_keys : null;
    const excludeKeys = Array.isArray(sourceConfig.exclude_keys) ? sourceConfig.exclude_keys : [];

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
        const tableDefinition = getTableDefinition(context.tableConfig, sourceConfig.table_key);
        return normalizeRowsSource(Array.isArray(tableDefinition?.rows) ? tableDefinition.rows : [], sourceConfig);
    }

    return [];
};

const isValidForScale = (value, scaleType) => {
    if (value === null || value === undefined || value === '') return false;
    if (scaleType === 'category') return true;
    if (scaleType === 'logarithmic') {
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric > 0;
    }
    return true;
};

const normalizePoint = (point, chartConfig) => {
    if (!point) return null;

    const xScaleType = chartConfig?.x_axis?.type || 'linear';
    const yScaleType = chartConfig?.y_axis?.type || 'linear';

    if (!isValidForScale(point.x, xScaleType) || !isValidForScale(point.y, yScaleType)) {
        return null;
    }

    return point;
};

const buildPointsFromArraySource = (dataArray = [], chartConfig, datasetConfig, context) => {
    return dataArray
        .map((item, index) => {
            const rowContext = { index, ...item };
            return normalizePoint({
                x: resolveContextValue(datasetConfig.x_key || chartConfig?.x_axis?.key, context, rowContext),
                y: resolveContextValue(datasetConfig.y_key, context, rowContext)
            }, chartConfig);
        })
        .filter(Boolean);
};

const buildPointsFromRowSource = (rows = [], chartConfig, datasetConfig, context) => {
    return rows
        .map((row, index) => {
            const rowContext = {
                index,
                row_key: row?.key,
                row_label: row?.label,
                ...row
            };

            return normalizePoint({
                x: resolveContextValue(datasetConfig.x_key || chartConfig?.x_axis?.key, context, rowContext),
                y: resolveContextValue(datasetConfig.y_key, context, rowContext)
            }, chartConfig);
        })
        .filter(Boolean);
};

const buildPointsFromInlineConfig = (points = [], chartConfig, context) => {
    return points
        .map((point, index) => {
            const rowContext = { index, ...point };
            const xValue = point?.x_key ? resolveContextValue(point.x_key, context, rowContext) : point?.x;
            const yValue = point?.y_key ? resolveContextValue(point.y_key, context, rowContext) : point?.y;

            return normalizePoint({
                x: xValue,
                y: yValue
            }, chartConfig);
        })
        .filter(Boolean);
};

const buildDataset = (chartConfig, datasetConfig, context) => {
    const sourceConfig = datasetConfig.source || chartConfig.source || {};
    let points = [];

    if (Array.isArray(datasetConfig.points)) {
        points = buildPointsFromInlineConfig(datasetConfig.points, chartConfig, context);
    } else if (sourceConfig.type === 'array' || chartConfig.data_key) {
        const dataArray = resolveContextValue(sourceConfig.data_key || chartConfig.data_key, context, {}, []);
        points = buildPointsFromArraySource(Array.isArray(dataArray) ? dataArray : [], chartConfig, datasetConfig, context);
    } else if (
        sourceConfig.type === 'table_rows' ||
        sourceConfig.table_key ||
        sourceConfig.rows_path ||
        Array.isArray(sourceConfig.rows)
    ) {
        const rows = resolveRowsForSource(sourceConfig, context);
        points = buildPointsFromRowSource(rows, chartConfig, datasetConfig, context);
    }

    if (!points.length) return null;

    return {
        label: datasetConfig.label,
        data: points,
        type: datasetConfig.type || chartConfig.dataset_type,
        borderColor: datasetConfig.borderColor || '#2563eb',
        backgroundColor: datasetConfig.backgroundColor || 'rgba(37, 99, 235, 0.16)',
        tension: datasetConfig.tension ?? chartConfig.tension ?? 0,
        fill: datasetConfig.fill ?? false,
        pointRadius: datasetConfig.pointRadius ?? 3,
        pointHoverRadius: datasetConfig.pointHoverRadius ?? 5,
        showLine: datasetConfig.showLine ?? true,
        pointStyle: datasetConfig.pointStyle,
        borderDash: datasetConfig.borderDash,
        borderWidth: datasetConfig.borderWidth ?? 2,
        stepped: datasetConfig.stepped,
        parsing: false
    };
};

const buildReferenceDataset = (referenceConfig, chartConfig, existingDatasets) => {
    const allPoints = existingDatasets.flatMap((dataset) => dataset?.data || []);
    const xValues = allPoints.map((point) => Number(point.x)).filter(Number.isFinite);
    const yValues = allPoints.map((point) => Number(point.y)).filter(Number.isFinite);

    if (!xValues.length || !yValues.length) return null;

    const xMin = chartConfig?.x_axis?.min ?? Math.min(...xValues);
    const xMax = chartConfig?.x_axis?.max ?? Math.max(...xValues);
    const yMin = chartConfig?.y_axis?.min ?? Math.min(...yValues);
    const yMax = chartConfig?.y_axis?.max ?? Math.max(...yValues);

    if (referenceConfig.axis === 'y' && referenceConfig.value !== undefined) {
        return {
            label: referenceConfig.label || '',
            data: [
                { x: xMin, y: referenceConfig.value },
                { x: xMax, y: referenceConfig.value }
            ],
            borderColor: referenceConfig.borderColor || '#6b7280',
            borderDash: referenceConfig.borderDash || [6, 6],
            borderWidth: referenceConfig.borderWidth ?? 1.5,
            pointRadius: 0,
            fill: false,
            parsing: false
        };
    }

    if (referenceConfig.axis === 'x' && referenceConfig.value !== undefined) {
        return {
            label: referenceConfig.label || '',
            data: [
                { x: referenceConfig.value, y: yMin },
                { x: referenceConfig.value, y: yMax }
            ],
            borderColor: referenceConfig.borderColor || '#6b7280',
            borderDash: referenceConfig.borderDash || [6, 6],
            borderWidth: referenceConfig.borderWidth ?? 1.5,
            pointRadius: 0,
            fill: false,
            parsing: false
        };
    }

    return null;
};

const buildChartDatasets = (chartConfig, context) => {
    const baseDatasets = (Array.isArray(chartConfig.datasets) ? chartConfig.datasets : [])
        .map((datasetConfig) => buildDataset(chartConfig, datasetConfig, context))
        .filter(Boolean);

    const referenceDatasets = (Array.isArray(chartConfig.reference_lines) ? chartConfig.reference_lines : [])
        .map((referenceConfig) => buildReferenceDataset(referenceConfig, chartConfig, baseDatasets))
        .filter(Boolean);

    return [...baseDatasets, ...referenceDatasets];
};

const buildChartData = (chartConfig, datasets = []) => {
    const xAxisType = chartConfig?.x_axis?.type || 'linear';

    if (xAxisType === 'category') {
        const labels = Array.isArray(chartConfig?.x_axis?.tick_values) && chartConfig.x_axis.tick_values.length
            ? chartConfig.x_axis.tick_values
            : buildCategoryValuesFromDatasets(datasets);

        return {
            labels,
            datasets
        };
    }

    return { datasets };
};

const buildChartOptions = (chartConfig, datasets = []) => {
    const topBands = Array.isArray(chartConfig?.decorations?.topBands) ? chartConfig.decorations.topBands : [];
    const xAxisType = chartConfig?.x_axis?.type || 'linear';
    const extraTickValues = (chartConfig.reference_lines || [])
        .filter((line) => line.axis === 'x' && typeof line.value === 'number')
        .map((line) => line.value);
    const xTickValues = xAxisType === 'category'
        ? (
            Array.isArray(chartConfig?.x_axis?.tick_values) && chartConfig.x_axis.tick_values.length
                ? chartConfig.x_axis.tick_values
                : buildCategoryValuesFromDatasets(datasets)
        )
        : (
            Array.isArray(chartConfig?.x_axis?.tick_values) && chartConfig.x_axis.tick_values.length
                ? chartConfig.x_axis.tick_values
                : buildTickValuesFromDatasets(datasets, extraTickValues)
        );

    return {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: {
            duration: 450,
            easing: 'easeOutQuart'
        },
        layout: {
            padding: {
                top: topBands.length ? 40 : 12,
                right: 12,
                bottom: 8,
                left: 8
            }
        },
        interaction: {
            mode: 'nearest',
            intersect: false
        },
        elements: {
            line: {
                borderJoinStyle: 'round',
                capBezierPoints: true,
                cubicInterpolationMode: 'monotone'
            },
            point: {
                hitRadius: 12,
                hoverBorderWidth: 2
            }
        },
        plugins: {
            title: {
                display: !!chartConfig.title,
                text: chartConfig.title,
                color: '#334155',
                font: { size: 17, weight: '800' },
                padding: { top: 8, bottom: 14 }
            },
            legend: {
                display: chartConfig.show_legend !== false,
                position: chartConfig.legend_position || 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 12,
                    boxHeight: 12,
                    color: '#475569',
                    font: { size: 12, weight: '600' },
                    padding: 16,
                    filter: (legendItem) => legendItem.text !== ''
                }
            },
            tooltip: {
                enabled: true,
                mode: 'nearest',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.92)',
                titleColor: '#f9fafb',
                bodyColor: '#e5e7eb',
                borderColor: 'rgba(56, 189, 248, 0.24)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                    label: (tooltipItem) => {
                        const xLabel = formatNumericLabel(tooltipItem.raw?.x);
                        const yLabel = formatNumericLabel(tooltipItem.raw?.y);
                        const datasetLabel = tooltipItem.dataset?.label || 'Serie';
                        return `${datasetLabel}: (${xLabel}, ${yLabel})`;
                    }
                }
            },
            datalabels: {
                display: false
            },
            engineeringDecorations: {
                ...(chartConfig.decorations || {}),
                topBands
            }
        },
        scales: {
            x: {
                type: xAxisType,
                title: {
                    display: !!chartConfig?.x_axis?.label,
                    text: chartConfig?.x_axis?.label || '',
                    color: '#2563eb',
                    font: { size: 13, weight: '700' },
                    padding: { top: 12 }
                },
                reverse: chartConfig?.x_axis?.reverse || false,
                min: chartConfig?.x_axis?.min,
                max: chartConfig?.x_axis?.max,
                grid: {
                    color: 'rgba(148, 163, 184, 0.18)',
                    drawBorder: false
                },
                border: {
                    color: 'rgba(148, 163, 184, 0.25)'
                },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: '600' },
                    maxRotation: 45,
                    minRotation: 0,
                    callback: function callback(value) {
                        if (xAxisType === 'category') {
                            const categoryLabel = this.getLabelForValue ? this.getLabelForValue(value) : value;
                            if (xTickValues.length && !xTickValues.includes(categoryLabel)) return '';
                            return String(categoryLabel);
                        }

                        const numericValue = Number(value);
                        if (!Number.isFinite(numericValue)) return '';
                        if (xTickValues.length && !xTickValues.some((tickValue) => nearlyEqual(tickValue, numericValue, 0.001))) {
                            return '';
                        }
                        return formatNumericLabel(numericValue);
                    },
                    ...(chartConfig?.x_axis?.ticks || {})
                }
            },
            y: {
                type: chartConfig?.y_axis?.type || 'linear',
                title: {
                    display: !!chartConfig?.y_axis?.label,
                    text: chartConfig?.y_axis?.label || '',
                    color: '#2563eb',
                    font: { size: 13, weight: '700' }
                },
                reverse: chartConfig?.y_axis?.reverse || false,
                min: chartConfig?.y_axis?.min,
                max: chartConfig?.y_axis?.max,
                grid: {
                    color: 'rgba(148, 163, 184, 0.20)',
                    drawBorder: false
                },
                border: {
                    color: 'rgba(148, 163, 184, 0.25)'
                },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: '600' },
                    callback: (value) => formatNumericLabel(value),
                    ...(chartConfig?.y_axis?.ticks || {})
                }
            }
        }
    };
};

const normalizeChartsConfig = (graficosConfig) => {
    if (!graficosConfig) return [];
    return Array.isArray(graficosConfig) ? graficosConfig : [graficosConfig];
};

const VisorGraficos = ({ graficosConfig, resultados, formData, tableConfig }) => {
    const chartRefs = useRef({});

    useEffect(() => {
        const chartInstances = {};
        const mergedData = deepMerge(formData || {}, resultados || {});
        const context = {
            data: mergedData,
            resultados: resultados || {},
            formData: formData || {},
            tableConfig: tableConfig || {}
        };

        normalizeChartsConfig(graficosConfig).forEach((chartConfig, index) => {
            const chartId = chartConfig.id || `grafico-${index}`;
            const canvas = chartRefs.current[chartId];
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;

            if (
                chartId === 'curva_compactacion' ||
                chartId === 'humedad_por_prueba' ||
                chartId === 'densidad_seca_por_prueba'
            ) {
                console.log('[VisorGraficos][Proctor] valores relevantes', {
                    chartId,
                    humedad: {
                        m1: getValue(mergedData, 'tables.calculo_humedad.m1.humedad'),
                        m2: getValue(mergedData, 'tables.calculo_humedad.m2.humedad'),
                        m3: getValue(mergedData, 'tables.calculo_humedad.m3.humedad'),
                        m4: getValue(mergedData, 'tables.calculo_humedad.m4.humedad')
                    },
                    densidadSeca: {
                        m1: getValue(mergedData, 'tables.calculo_humedad.m1.densidad_seca'),
                        m2: getValue(mergedData, 'tables.calculo_humedad.m2.densidad_seca'),
                        m3: getValue(mergedData, 'tables.calculo_humedad.m3.densidad_seca'),
                        m4: getValue(mergedData, 'tables.calculo_humedad.m4.densidad_seca')
                    },
                    resultados: {
                        humedad_optima: getValue(mergedData, 'results.humedad_optima'),
                        maxima_densidad_seca: getValue(mergedData, 'results.maxima_densidad_seca')
                    }
                });
            }

            const datasets = buildChartDatasets(chartConfig, context);
            if (!datasets.length) return;

            chartInstances[chartId] = new Chart(ctx, {
                type: chartConfig.type || 'line',
                data: buildChartData(chartConfig, datasets),
                options: buildChartOptions(chartConfig, datasets)
            });
        });

        return () => {
            Object.values(chartInstances).forEach((chart) => chart.destroy());
        };
    }, [graficosConfig, resultados, formData, tableConfig]);

    const charts = normalizeChartsConfig(graficosConfig);
    if (!charts.length) {
        return <div className="alert alert-info">No hay gráficos configurados para este tipo de ensayo.</div>;
    }

    return (
        <div className="container-fluid">
            <div className="row">
                {charts.map((chartConfig, index) => {
                    const chartId = chartConfig.id || `grafico-${index}`;
                    return (
                        <div className="col-12 mb-4" key={chartId}>
                            <div
                                className="chart-container"
                                style={{
                                    minHeight: chartConfig.height || 360,
                                    padding: '18px 18px 10px',
                                    borderRadius: '24px',
                                    background: `
                                        radial-gradient(circle at top left, rgba(56,189,248,0.12), transparent 26%),
                                        radial-gradient(circle at top right, rgba(37,99,235,0.10), transparent 24%),
                                        linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)
                                    `,
                                    border: '1px solid rgba(148, 163, 184, 0.18)',
                                    boxShadow: `
                                        inset 0 1px 0 rgba(255,255,255,0.95),
                                        0 24px 48px rgba(15, 23, 42, 0.12),
                                        0 0 0 1px rgba(56, 189, 248, 0.04)
                                    `,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: '10px',
                                        borderRadius: '18px',
                                        border: '1px solid rgba(56, 189, 248, 0.10)',
                                        boxShadow: 'inset 0 0 24px rgba(56, 189, 248, 0.05)',
                                        pointerEvents: 'none'
                                    }}
                                />
                                <canvas ref={(element) => { chartRefs.current[chartId] = element; }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VisorGraficos;
