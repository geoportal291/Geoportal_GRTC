import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon'; // Importante para escalas de tiempo/logarítmicas

Chart.register(...registerables);

// Helper para obtener valores anidados de forma segura
const getValue = (obj, path, defaultValue = undefined) => {
    const value = path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    return value !== undefined && value !== null ? value : defaultValue;
};

const VisorGraficos = ({ graficosConfig, resultados }) => {
    const chartRefs = useRef({});

    useEffect(() => {
        const chartInstances = {};

        if (graficosConfig && Array.isArray(graficosConfig)) {
            graficosConfig.forEach(chartConfig => {
                const chartId = chartConfig.id;
                const ctx = chartRefs.current[chartId]?.getContext('2d');
                if (!ctx) return;

                // Destruir instancia anterior si existe
                if (chartInstances[chartId]) {
                    chartInstances[chartId].destroy();
                }

                // 1. Obtener el array de datos principal
                const dataArray = getValue(resultados, chartConfig.data_key, []);
                if (!Array.isArray(dataArray) || dataArray.length === 0) {
                    return; // No hay datos para este gráfico
                }

                // 2. Construir los datasets
                const datasets = chartConfig.datasets.map(datasetConfig => {
                    return {
                        label: datasetConfig.label,
                        data: dataArray.map(point => ({
                            x: getValue(point, chartConfig.x_axis.key),
                            y: getValue(point, datasetConfig.y_key)
                        })),
                        borderColor: datasetConfig.borderColor,
                        backgroundColor: datasetConfig.backgroundColor,
                        tension: datasetConfig.tension || 0.1,
                        fill: datasetConfig.fill || false,
                        pointRadius: datasetConfig.pointRadius || 3,
                        pointHoverRadius: datasetConfig.pointHoverRadius || 5,
                    };
                });

                // 3. Configurar opciones del gráfico (título, ejes, etc.)
                const chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: chartConfig.title,
                            font: { size: 16 }
                        },
                        legend: {
                            position: chartConfig.legend_position || 'top',
                        },
                    },
                    scales: {
                        x: {
                            type: chartConfig.x_axis.type || 'linear',
                            title: {
                                display: true,
                                text: chartConfig.x_axis.label
                            },
                            reverse: chartConfig.x_axis.reverse || false,
                            min: chartConfig.x_axis.min,
                            max: chartConfig.x_axis.max,
                        },
                        y: {
                            type: chartConfig.y_axis.type || 'linear',
                            title: {
                                display: true,
                                text: chartConfig.y_axis.label
                            },
                            reverse: chartConfig.y_axis.reverse || false,
                            min: chartConfig.y_axis.min,
                            max: chartConfig.y_axis.max,
                        }
                    }
                };

                // 4. Crear la nueva instancia del gráfico
                chartInstances[chartId] = new Chart(ctx, {
                    type: chartConfig.type,
                    data: { datasets },
                    options: chartOptions,
                });
            });
        }

        // Función de limpieza para destruir todos los gráficos al desmontar el componente
        return () => {
            Object.values(chartInstances).forEach(chart => chart.destroy());
        };
    }, [graficosConfig, resultados]);

    if (!graficosConfig || graficosConfig.length === 0) {
        return <div className="alert alert-info">No hay gráficos configurados para este tipo de ensayo.</div>;
    }

    return (
        <div className="container-fluid">
            <div className="row">
                {graficosConfig.map(chartConfig => (
                    <div className="col-12 mb-4" key={chartConfig.id}>
                        <div className="chart-container">
                            <canvas ref={el => (chartRefs.current[chartConfig.id] = el)}></canvas>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisorGraficos;