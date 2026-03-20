import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import axiosInstance from '../../../../api/axios';
import * as XLSX from 'xlsx';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ImageDisplayModal from './ImageDisplayModal';
import UploadTrafficDataModal from './UploadTrafficDataModal';

import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { CSSTransition } from 'react-transition-group';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import AnalysisModal from './AnalysisModal'; // Importar el nuevo modal

import './EstacionControlTab.css';
import ErrorBoundary from '../../../ErrorBoundary';


const analizarDatosHorarios = (datos, etiquetas) => {
  if (!datos || datos.length < 24) return null;


  const getStdDev = (arr) => {
    const n = arr.length;
    if (n === 0) return 0;
    const mean = arr.reduce((a, b) => a + b) / n;
    if (mean === 0) return 0;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return Math.sqrt(variance);
  };


  const periodosInfo = [];
  const periodos = {
    Madrugada: { inicio: 0, fin: 5, icono: 'fas fa-moon' },
    Mañana: { inicio: 6, fin: 11, icono: 'fas fa-sun' },
    Tarde: { inicio: 12, fin: 18, icono: 'fas fa-cloud-sun' },
    Noche: { inicio: 19, fin: 23, icono: 'fas fa-star' }
  };

  for (const [nombre, { inicio, fin, icono }] of Object.entries(periodos)) {
    const datosPeriodo = datos.slice(inicio, fin + 1);
    if (datosPeriodo.length === 0 || datosPeriodo.every(d => d === 0)) continue;

    const totalPeriodo = datosPeriodo.reduce((a, b) => a + b, 0);
    const promedioPeriodo = totalPeriodo / datosPeriodo.length;
    const maxPeriodo = Math.max(...datosPeriodo);
    const horaPicoPeriodo = etiquetas[datos.indexOf(maxPeriodo)];

    periodosInfo.push({
      nombre,
      icono,
      promedio: promedioPeriodo.toFixed(1),
      pico: maxPeriodo,
      horaPico: horaPicoPeriodo,
      total: totalPeriodo
    });
  }


  const puntosClave = [];
  const maxVehiculos = Math.max(...datos);
  const minVehiculos = Math.min(...datos);
  const horaPico = etiquetas[datos.indexOf(maxVehiculos)];
  const horaValle = etiquetas[datos.indexOf(minVehiculos)];

  puntosClave.push(`El punto más alto de tráfico en todo el día fue a las ${horaPico} con ${maxVehiculos} vehículos.`);
  puntosClave.push(`El momento de menor tráfico fue a las ${horaValle} con ${minVehiculos} vehículos.`);

  if (periodosInfo.length > 0) {
    const busiestPeriod = periodosInfo.reduce((prev, current) => (prev.total > current.total) ? prev : current);
    puntosClave.push(`El periodo de mayor actividad fue la ${busiestPeriod.nombre}.`);
  }


  const morningPeak = periodosInfo.find(p => p.nombre === 'Mañana')?.pico || 0;
  const afternoonPeak = periodosInfo.find(p => p.nombre === 'Tarde')?.pico || 0;
  if (morningPeak > 0 && afternoonPeak > 0) {
    if (morningPeak > afternoonPeak) {
      puntosClave.push(`El pico de la mañana (${morningPeak} veh.) fue más intenso que el de la tarde (${afternoonPeak} veh.).`);
    } else if (afternoonPeak > morningPeak) {
      puntosClave.push(`El pico de la tarde (${afternoonPeak} veh.) fue más intenso que el de la mañana (${morningPeak} veh.).`);
    } else {
      puntosClave.push(`Los picos de la mañana y la tarde tuvieron una intensidad similar (${morningPeak} veh.).`);
    }
  }


  const mean = datos.reduce((a, b) => a + b) / datos.length;
  const stdDev = getStdDev(datos);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
  if (coefficientOfVariation > 0.6) {
    puntosClave.push(`El flujo de tráfico fue muy variable a lo largo del día.`);
  } else {
    puntosClave.push(`El flujo de tráfico fue relativamente estable a lo largo del día.`);
  }

  const avgMadrugada = datos.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  const avgTotal = datos.reduce((a, b) => a + b, 0) / 24;
  if (avgMadrugada < avgTotal * 0.5) {
    puntosClave.push(`El volumen de tráfico es consistentemente bajo durante la madrugada.`);
  }

  return { periodosInfo, puntosClave };
};



const analizarDatosPorcentaje = (data, labels) => {
  if (!data || data.length === 0) return null;

  const getPcuFactor = (label) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('camión 4e') || lowerLabel.includes('trayler')) return 3.5;
    if (lowerLabel.includes('camión 3e') || lowerLabel.includes('semi trayler')) return 3.0;
    if (lowerLabel.includes('omnibus') || lowerLabel.includes('bus')) return 2.5;
    if (lowerLabel.includes('camión 2e')) return 2.0;
    if (lowerLabel.includes('micro')) return 1.8;
    if (lowerLabel.includes('rural') || lowerLabel.includes('combi')) return 1.5;
    if (lowerLabel.includes('pick up') || lowerLabel.includes('panel')) return 1.2;
    return 1.0;
  };

  const vehicleData = labels.map((label, index) => ({
    label: label,
    value: data[index]?.originalValue !== undefined ? data[index].originalValue : 0,
    pcuFactor: getPcuFactor(label)
  }));

  const totalVehicles = vehicleData.reduce((sum, v) => sum + v.value, 0);
  if (totalVehicles === 0) return null;

  const totalPcu = vehicleData.reduce((sum, v) => sum + (v.value / 100 * v.pcuFactor), 0);

  const puntosClave = [];

  const pcuAnalysis = vehicleData.map(v => ({
    label: v.label,
    percentage: v.value,
    congestionContribution: (v.value / 100 * v.pcuFactor) / totalPcu * 100
  })).sort((a, b) => b.congestionContribution - a.congestionContribution);

  const topCongestionVehicle = pcuAnalysis[0];
  const topVehicleByCount = [...pcuAnalysis].sort((a, b) => b.percentage - a.percentage)[0];

  const heavyLabels = ['Camión', 'Semi trayler', 'Trayler', 'Omnibus', 'Bus', 'Micro'];
  const heavyVehicles = vehicleData.filter(v => heavyLabels.some(hl => v.label.toLowerCase().includes(hl.toLowerCase())));
  const heavyVehiclePercentage = heavyVehicles.reduce((sum, v) => sum + v.value, 0);
  const heavyPcuTotalContribution = heavyVehicles.reduce((sum, v) => sum + (v.value / 100 * v.pcuFactor), 0) / totalPcu * 100;


  let resumen = `El análisis muestra una predominancia de **${topVehicleByCount.label}s** (${topVehicleByCount.percentage.toFixed(1)}% del total). `;
  if (heavyVehiclePercentage > 20) {
    resumen += `Sin embargo, el tráfico pesado (camiones, buses) representa un **${heavyVehiclePercentage.toFixed(1)}%** del total, ejerciendo una influencia significativa en la congestión.`;
  } else {
    resumen += `El tráfico es mayormente ligero, con una presencia moderada de vehículos pesados (${heavyVehiclePercentage.toFixed(1)}%).`;
  }
  puntosClave.push({ title: "Resumen General", text: resumen, icon: "fas fa-chart-pie" });


  // 2. Foco en Congestión (UCP)
  let conclusionCongestion = `El **${topCongestionVehicle.label}** es el principal generador de congestión, responsable del **${topCongestionVehicle.congestionContribution.toFixed(1)}%** del impacto total (UCP). `;
  if (topCongestionVehicle.label !== topVehicleByCount.label) {
    conclusionCongestion += `Aunque no es el más numeroso, su alto factor de UCP lo convierte en un elemento crítico para la fluidez del tráfico.`;
  }
  puntosClave.push({ title: "Principal Factor de Congestión", text: conclusionCongestion, icon: "fas fa-traffic-light" });


  // 3. Impacto del Tráfico Pesado
  let conclusionPesados = `Los vehículos pesados en conjunto (camiones, buses, etc.) causan el **${heavyPcuTotalContribution.toFixed(1)}%** de la congestión, a pesar de ser solo el **${heavyVehiclePercentage.toFixed(1)}%** de los vehículos. `;
  if (heavyVehiclePercentage > 25) {
    conclusionPesados += `Este alto porcentaje impacta directamente el Nivel de Servicio (LoS), lo que puede traducirse en menores velocidades y mayor desgaste de la vía.`;
  } else if (heavyVehiclePercentage > 15) {
    conclusionPesados += `Esta proporción es un factor clave a monitorear para la gestión de la infraestructura y la planificación de mantenimientos.`;
  }
  puntosClave.push({ title: "Impacto del Tráfico Pesado", text: conclusionPesados, icon: "fas fa-truck" });


  // 4. Recomendación / Observación Clave
  let recomendacion = "";
  if (heavyVehiclePercentage > 30) {
    recomendacion = "Se recomienda evaluar la posibilidad de implementar horarios restringidos para vehículos de carga o diseñar carriles exclusivos para mejorar la fluidez general.";
  } else if (topCongestionVehicle.congestionContribution > 40) {
    recomendacion = `Dado el alto impacto del **${topCongestionVehicle.label}**, cualquier medida de gestión de tráfico debería enfocarse en este tipo de vehículo.`;
  } else {
    recomendacion = "La composición del tráfico parece balanceada. Se sugiere un monitoreo continuo para detectar cambios en las tendencias a futuro.";
  }
  puntosClave.push({ title: "Recomendación", text: recomendacion, icon: "fas fa-lightbulb" });


  return { puntosClave };
};

const analizarDatosClasificacion = (data, labels) => {
  if (!data || data.length === 0) return null;

  const puntosClave = [];

  const vehicleClassification = labels.map((label, index) => ({
    type: label,
    count: data[index] || 0
  }));

  const totalCount = vehicleClassification.reduce((sum, v) => sum + v.count, 0);
  if (totalCount === 0) {
    puntosClave.push({
      title: "Sin Datos de Clasificación",
      text: "No se encontraron datos de clasificación vehicular para analizar.",
      icon: "fas fa-exclamation-triangle"
    });
    return { puntosClave };
  }


  const sortedClassification = [...vehicleClassification].sort((a, b) => b.count - a.count);


  const topVehicles = sortedClassification.slice(0, 3);
  let summaryText = `La clasificación vehicular muestra un total de **${totalCount}** vehículos. `;
  if (topVehicles.length > 0) {
    summaryText += `Los tipos de vehículos más predominantes son: `;
    topVehicles.forEach((v, i) => {
      summaryText += `**${v.type}** (${v.count} unidades)`;
      if (i < topVehicles.length - 1) summaryText += ", ";
    });
    summaryText += ".";
  }
  puntosClave.push({
    title: "Resumen General de Clasificación",
    text: summaryText,
    icon: "fas fa-car"
  });


  const heavyLabels = ['Camión', 'Semi trayler', 'Trayler', 'Omnibus', 'Bus', 'Micro']; // Re-using from percentage analysis
  const lightVehicles = vehicleClassification.filter(v => !heavyLabels.some(hl => v.type.toLowerCase().includes(hl.toLowerCase())));
  const heavyVehicles = vehicleClassification.filter(v => heavyLabels.some(hl => v.type.toLowerCase().includes(hl.toLowerCase())));

  const totalLight = lightVehicles.reduce((sum, v) => sum + v.count, 0);
  const totalHeavy = heavyVehicles.reduce((sum, v) => sum + v.count, 0);

  const percentLight = (totalLight / totalCount * 100).toFixed(1);
  const percentHeavy = (totalHeavy / totalCount * 100).toFixed(1);

  let proportionText = `Los vehículos ligeros constituyen el **${percentLight}%** del tráfico (${totalLight} unidades), mientras que los vehículos pesados representan el **${percentHeavy}%** (${totalHeavy} unidades). `;
  if (parseFloat(percentHeavy) > 20) {
    proportionText += `Una proporción significativa de vehículos pesados indica una mayor demanda sobre la infraestructura vial.`;
  } else {
    proportionText += `La predominancia de vehículos ligeros sugiere un flujo de tráfico más ágil.`;
  }
  puntosClave.push({
    title: "Distribución Ligeros vs. Pesados",
    text: proportionText,
    icon: "fas fa-balance-scale"
  });


  let implicationText = "";
  if (parseFloat(percentHeavy) > 25) {
    implicationText = `El alto porcentaje de vehículos pesados (${percentHeavy}%) sugiere una necesidad de monitoreo constante del estado del pavimento y una planificación de mantenimiento más frecuente debido al mayor desgaste.`;
  } else if (parseFloat(percentHeavy) > 10) {
    implicationText = `La presencia de vehículos pesados (${percentHeavy}%) es un factor a considerar en la durabilidad de la vía y en la capacidad de diseño.`;
  } else {
    implicationText = `La baja proporción de vehículos pesados es favorable para la conservación de la infraestructura vial.`;
  }
  puntosClave.push({
    title: "Implicaciones en la Infraestructura",
    text: implicationText,
    icon: "fas fa-road"
  });

  return { puntosClave };
};

const analizarDatosDiarios = (data, labels) => {
  if (!data || data.length === 0) return null;

  const puntosClave = [];

  const dailyTraffic = labels.map((label, index) => ({
    day: label,
    count: data[index] || 0
  }));

  const totalTrafficWeek = dailyTraffic.reduce((sum, d) => sum + d.count, 0);
  const averageDailyTraffic = totalTrafficWeek / dailyTraffic.length;

  if (totalTrafficWeek === 0) {
    puntosClave.push({
      title: "Sin Datos de Tráfico Diario",
      text: "No se encontraron datos de tráfico diario para analizar.",
      icon: "fas fa-exclamation-triangle"
    });
    return { puntosClave };
  }


  const sortedByCount = [...dailyTraffic].sort((a, b) => a.count - b.count);
  const minTrafficDay = sortedByCount[0];
  const maxTrafficDay = sortedByCount[sortedByCount.length - 1];


  let summaryText = `El tráfico semanal total fue de **${totalTrafficWeek}** vehículos, con un promedio diario de **${averageDailyTraffic.toFixed(0)}** vehículos. `;
  summaryText += `El día de mayor tráfico fue el **${maxTrafficDay.day}** con **${maxTrafficDay.count}** vehículos, y el de menor tráfico fue el **${minTrafficDay.day}** con **${minTrafficDay.count}** vehículos.`;
  puntosClave.push({
    title: "Resumen General de Tráfico Semanal",
    text: summaryText,
    icon: "fas fa-calendar-week"
  });


  const weekdays = dailyTraffic.filter(d => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].includes(d.day));
  const weekends = dailyTraffic.filter(d => ['Sábado', 'Domingo'].includes(d.day));

  const avgWeekdayTraffic = weekdays.length > 0 ? weekdays.reduce((sum, d) => sum + d.count, 0) / weekdays.length : 0;
  const avgWeekendTraffic = weekends.length > 0 ? weekends.reduce((sum, d) => sum + d.count, 0) / weekends.length : 0;

  let patternText = "";
  if (avgWeekdayTraffic > avgWeekendTraffic * 1.2) {
    patternText = `Se observa un patrón claro de mayor tráfico durante los días de semana (promedio: **${avgWeekdayTraffic.toFixed(0)}** veh.) en comparación con el fin de semana (promedio: **${avgWeekendTraffic.toFixed(0)}** veh.), lo cual es típico para vías con uso laboral/comercial.`;
  } else if (avgWeekendTraffic > avgWeekdayTraffic * 1.2) {
    patternText = `El tráfico es notablemente más alto durante el fin de semana (promedio: **${avgWeekendTraffic.toFixed(0)}** veh.) que en días de semana (promedio: **${avgWeekdayTraffic.toFixed(0)}** veh.), sugiriendo un uso recreacional o turístico de la vía.`;
  } else {
    patternText = `El flujo de tráfico se mantiene relativamente constante a lo largo de la semana, sin grandes variaciones entre días laborales y fines de semana.`;
  }
  puntosClave.push({
    title: "Patrones de Tráfico Semanal",
    text: patternText,
    icon: "fas fa-chart-line"
  });


  let operationalImplicationText = "";
  if (maxTrafficDay.count > averageDailyTraffic * 1.5) { // Significant peak day
    operationalImplicationText = `El pico de tráfico en **${maxTrafficDay.day}** (${maxTrafficDay.count} veh.) podría requerir una gestión de tráfico específica o recursos adicionales en ese día.`;
  } else if (minTrafficDay.count < averageDailyTraffic * 0.5) { // Significant low day
    operationalImplicationText = `El bajo volumen de tráfico en **${minTrafficDay.day}** (${minTrafficDay.count} veh.) podría ser una oportunidad para realizar trabajos de mantenimiento o mejoras en la vía con mínima interrupción.`;
  } else {
    operationalImplicationText = `La distribución del tráfico diario es bastante uniforme, lo que facilita una planificación operativa consistente.`;
  }
  puntosClave.push({
    title: "Implicaciones Operacionales",
    text: operationalImplicationText,
    icon: "fas fa-tools"
  });

  return { puntosClave };
};


const percentageTextPlugin = {
  id: 'percentageText',
  afterDraw(chart, args, options) {
    const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;

    ctx.save();

    data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((arc, index) => {
        const value = data.datasets[0].data[index].renderValue;

        if (value >= 0) {
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 12px Arial';

          const midAngle = (arc.startAngle + arc.endAngle) / 2;
          const radius = arc.outerRadius / 2;
          const textX = arc.x + Math.cos(midAngle) * radius;
          const textY = arc.y + Math.sin(midAngle) * radius;

          const percentage = value.toFixed(1);
          ctx.fillText(`${percentage}%`, textX, textY);
        }
      });
    });

    ctx.restore();
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  percentageTextPlugin
);


const MapViewController = ({ setView, view }) => {
  const map = useMap();

  const onMove = useCallback(() => {
    setView({ center: map.getCenter(), zoom: map.getZoom() });
  }, [map, setView]);

  useEffect(() => {
    map.on('moveend', onMove);
    map.on('zoomend', onMove);
    return () => {
      map.off('moveend', onMove);
      map.off('zoomend', onMove);
    };
  }, [map, onMove]);

  return null;
};
const ReportConteoVehicularTab = ({
  stationData,
  selectedStation,
  handleStationSelect,
  showRoute,
  setShowRoute,
  showTraffic,
  setShowTraffic,
  refreshStationData,
  setIsLoadingImages,
  isLoadingImages,
  isNavbarExpanded
}) => {
  const [view, setView] = useState({ center: [-12.5, -72.5], zoom: 11 });
  const currentStationData = stationData[selectedStation];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stationIdToUpload, setStationIdToUpload] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);

  const [isStationDataVisible, setIsStationDataVisible] = useState(true);
  const [uploadedExcelUrl, setUploadedExcelUrl] = useState(null);
  const [excelTableData, setExcelTableData] = useState(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);


  const [modalAnalysisData, setModalAnalysisData] = useState(null);
  const [hourlyAnalysis, setHourlyAnalysis] = useState(null);
  const [percentageAnalysis, setPercentageAnalysis] = useState(null);
  const [classificationAnalysis, setClassificationAnalysis] = useState(null);
  const [dailyAnalysis, setDailyAnalysis] = useState(null);



  const [chartData, setChartData] = useState({ hourly: { labels: [], datasets: [{ data: [] }] }, percentage: { labels: [], datasets: [{ data: [] }] }, classification: { labels: [], datasets: [{ data: [] }] }, daily: { labels: [], datasets: [{ data: [] }] } });
  const stationDataRef = useRef(null);

  useEffect(() => {
    if (chartData.hourly && chartData.hourly.datasets[0].data.length > 0) {
      const result = analizarDatosHorarios(chartData.hourly.datasets[0].data, chartData.hourly.labels);
      setHourlyAnalysis(result); // Actualiza el estado del análisis horario
    } else {
      setHourlyAnalysis(null);
    }
  }, [chartData.hourly]);

  useEffect(() => {
    if (chartData.percentage && chartData.percentage.datasets[0].data.length > 0) {
      const result = analizarDatosPorcentaje(chartData.percentage.datasets[0].data, chartData.percentage.labels);
      setPercentageAnalysis(result);
    } else {
      setPercentageAnalysis(null);
    }
  }, [chartData.percentage]);

  useEffect(() => {
    if (chartData.classification && chartData.classification.datasets[0].data.length > 0) {
      const result = analizarDatosClasificacion(chartData.classification.datasets[0].data, chartData.classification.labels);
      setClassificationAnalysis(result);
    } else {
      setClassificationAnalysis(null);
    }
  }, [chartData.classification]);

  useEffect(() => {
    if (chartData.daily && chartData.daily.datasets[0].data.length > 0) {
      const result = analizarDatosDiarios(chartData.daily.datasets[0].data, chartData.daily.labels);
      setDailyAnalysis(result);
    } else {
      setDailyAnalysis(null);
    }
  }, [chartData.daily]);

  // Helper function for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day); // Create date in local timezone
      return date.toLocaleDateString();
    }
    // Fallback for other formats, try direct parsing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString();
  };



  const openImageModal = (imageUrl) => {
    setImageToDisplay(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageToDisplay(null);
  };



  const handleUploadSuccess = (stationId, newImageData) => {
    refreshStationData();
  };

  const openUploadModal = (stationId) => {
    setStationIdToUpload(stationId);
    setIsModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsModalOpen(false);
    setStationIdToUpload(null);
  };

  const handleClearExcel = () => {
    setUploadedExcelUrl(null);
    setChartData({
      hourly: { labels: [], datasets: [{ data: [] }] },
      percentage: { labels: [], datasets: [{ data: [] }] },
      classification: { labels: [], datasets: [{ data: [] }] },
      daily: { labels: [], datasets: [{ data: [] }] }
    });
    setExcelTableData(null);
    alertify.success('Datos de Excel borrados de la vista.');
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedStation) {
      alertify.error('Por favor, selecciona una estación primero.');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('stationId', selectedStation);

    try {
      const response = await axiosInstance.post('/api/trafico/conteovehicular/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.status === 'ok') {
        setUploadedExcelUrl(response.data.excelUrl);
        alertify.success('Archivo Excel subido y procesado correctamente.');

        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          const targetSheetName = 'ESTACION DESV.LORO Y SAN MARTIN';
          const targetRange = 'B59:V105';
          const targetWorksheet = workbook.Sheets[targetSheetName];

          if (targetWorksheet) {
            const tableData = XLSX.utils.sheet_to_json(targetWorksheet, { header: 1, range: targetRange });
            setExcelTableData(tableData);
          } else {
            alertify.error(`La hoja "${targetSheetName}" no se encontró en el archivo Excel.`);
            setExcelTableData(null);
          }



          const stationNumber = parseInt(selectedStation.split('-')[1], 10);
          // Helper to find sheet with loose matching (e.g. FW_E2, FW_E02, fw_e2)
          const findStationSheet = (wb, num) => {
            const regex = new RegExp(`^FW_E0?${num}$`, 'i');
            return wb.SheetNames.find(n => regex.test(n.trim()));
          };

          const sheetName = findStationSheet(workbook, stationNumber) || `FW_E${stationNumber}`;
          const worksheet = workbook.Sheets[sheetName];

          if (!worksheet) {
            console.warn(`Sheet not found. Searched for FW_E${stationNumber} variants. Available:`, workbook.SheetNames);
            alertify.error(`La hoja para la Estación ${stationNumber} (ej. "FW_E${stationNumber}") no se encontró.`);
            setChartData({
              hourly: { labels: [], datasets: [{ data: [] }] },
              percentage: { labels: [], datasets: [{ data: [] }] },
              classification: { labels: [], datasets: [{ data: [] }] },
              daily: { labels: [], datasets: [{ data: [] }] }
            });
            return;
          }


          // Dynamic Row Detection Helper
          const findRowIndex = (colIndex, searchText, startRow = 0, maxRow = 100) => {
            for (let r = startRow; r < maxRow; r++) {
              const cellAddress = XLSX.utils.encode_cell({ r, c: colIndex });
              const cell = worksheet[cellAddress];
              if (cell && cell.v && cell.v.toString().trim().toUpperCase() === searchText) {
                return r;
              }
            }
            return -1;
          };

          // 1. Hourly Data: Find first hour label (00-01 or 01-02) and TOTAL
          let hourlyStartRow = -1;
          for (let r = 2; r <= 5; r++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
            const cell = worksheet[cellAddress];
            if (cell && cell.v && /^\d{2}-\d{2}$/.test(cell.v.toString().trim())) {
              hourlyStartRow = r;
              break;
            }
          }
          const hourlyStartRow1Based = hourlyStartRow !== -1 ? hourlyStartRow + 1 : 4;

          const totalRowIndex = findRowIndex(0, 'TOTAL', 20, 35);
          const hourlyEndRow1Based = totalRowIndex !== -1 ? totalRowIndex : 27;

          // Variación Horaria
          const rawHourlyLabels = XLSX.utils.sheet_to_json(worksheet, { range: `A${hourlyStartRow1Based}:A${hourlyEndRow1Based}`, header: 1 });
          const hourlyLabels = rawHourlyLabels.map(row => row[0]);
          const rawHourlyData = XLSX.utils.sheet_to_json(worksheet, { range: `U${hourlyStartRow1Based}:U${hourlyEndRow1Based}`, header: 1 });
          const hourlyData = rawHourlyData.map(row => Number(row[0]));

          // Classification (Use Col B Types and Col M IMDa)
          // 2. Classification Start: Find 'Autos' in Column B (Index 1)
          let autosRowIndex = findRowIndex(1, 'AUTOS', 25, 45);
          if (autosRowIndex === -1) autosRowIndex = findRowIndex(1, 'Autos', 25, 45);

          const classStartRow = autosRowIndex !== -1 ? autosRowIndex : 32;
          const classEndRow = classStartRow + 12;

          const classStart1Based = classStartRow + 1;
          const classEnd1Based = classEndRow;

          // Classification (Use Col B Types and Col M IMDa)
          const rawClassificationLabels = XLSX.utils.sheet_to_json(worksheet, { range: `B${classStart1Based}:B${classEnd1Based}`, header: 1 });
          const classificationLabels = rawClassificationLabels.map(row => row[0]);
          const rawClassificationData = XLSX.utils.sheet_to_json(worksheet, { range: `M${classStart1Based}:M${classEnd1Based}`, header: 1 });
          const classificationData = rawClassificationData.map(row => {
            const val = Number(row[0]);
            return isNaN(val) ? 0 : Number(val.toFixed(2));
          });

          // Percentage (Computed from Classification Data)
          const totalIMD = classificationData.reduce((a, b) => a + b, 0);
          const percentageLabels = classificationLabels;
          const percentageData = classificationData.map(val => {
            const pct = totalIMD > 0 ? (val / totalIMD) * 100 : 0;
            return { originalValue: pct, renderValue: Number(pct.toFixed(2)) };
          }).filter(item => item.originalValue > 0);

          // Daily (Computed Sums of C33:C44 through I33:I44)
          const rawDailyHeaders = XLSX.utils.sheet_to_json(worksheet, { range: 'C32:I32', header: 1 });
          const dailyLabels = rawDailyHeaders.length > 0 ? rawDailyHeaders[0] : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

          const rawDailyBlock = XLSX.utils.sheet_to_json(worksheet, { range: 'C33:I44', header: 1 });
          // Transpose and Sum
          const dailyData = [];
          if (rawDailyBlock.length > 0) {
            const numDays = 7; // Sunday to Saturday
            for (let i = 0; i < numDays; i++) {
              let daySum = 0;
              rawDailyBlock.forEach(row => {
                const val = Number(row[i]);
                if (!isNaN(val)) daySum += val;
              });
              dailyData.push(daySum);
            }
          }

          setChartData({
            hourly: {
              labels: hourlyLabels,
              datasets: [{
                label: 'IMD',
                data: hourlyData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            },
            percentage: {
              labels: percentageLabels,
              datasets: [{
                data: percentageData,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                offset: 10
              }]
            },
            classification: {
              labels: classificationLabels,
              datasets: [{
                label: 'Nº de Vehículos',
                data: classificationData,
                backgroundColor: 'rgba(255, 99, 132, 0.5)'
              }]
            },
            daily: {
              labels: dailyLabels,
              datasets: [{
                label: 'Vehículos/Día (Semana Representativa)',
                data: dailyData,
                backgroundColor: [
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(153, 102, 255, 0.6)',
                  'rgba(255, 159, 64, 0.6)',
                  'rgba(199, 199, 199, 0.6)'
                ]
              }]
            }
          });
        };
        reader.readAsBinaryString(file);

      } else {
        alertify.error('Error al subir el archivo Excel.');
      }
    } catch (error) {
      console.error('Error uploading Excel:', error);
      alertify.error('Error al subir el archivo Excel.');
    }
  };

  const handleDeleteImageGroup = async (stationId, description, uploadDate) => {
    alertify.confirm(
      'Eliminar Grupo de Imágenes',
      '¿Estás seguro de que quieres eliminar este grupo de imágenes?\nEsta acción eliminará todas las imágenes con la descripción "' + description + '" y fecha "' + formatDate(uploadDate) + '" para esta estación.',
      async function () {
        try {
          await axiosInstance.delete(`/api/trafico/delete-image-group`,
            { data: { stationId, description, uploadDate } });
          refreshStationData();
          alertify.success('Grupo de imágenes eliminado con éxito.');
        } catch (error) {
          console.error('Error al eliminar el grupo de imágenes:', error);
          alertify.error('Error al eliminar el grupo de imágenes.');
        }
      },
      function () {
        alertify.error('Eliminación cancelada.');
      }
    );
  };

  const handleDeleteFile = async (stationId, imageUrl, description, uploadDate) => {
    alertify.confirm(
      'Eliminar Archivo',
      `¿Estás seguro de que quieres eliminar el archivo "${description || imageUrl.split('/').pop()}" subido el ${formatDate(uploadDate)}?`,
      async function () {
        try {
          await axiosInstance.delete(`/api/trafico/delete-image`,
            { data: { stationId, imageUrl } });
          refreshStationData();
          alertify.success('Archivo eliminado con éxito.');
        } catch (error) {
          console.error('Error al eliminar el archivo:', error);
          alertify.error('Error al eliminar el archivo.');
        }
      },
      function () {
        alertify.error('Eliminación cancelada.');
      }
    );
  };

  useEffect(() => {
    const fetchLatestExcel = async () => {
      setIsLoadingCharts(true); // Set loading to true at the start of data fetching

      if (selectedStation) {
        try {
          const response = await axiosInstance.get(`/api/trafico/conteovehicular/latest-excel/${selectedStation}`);
          if (response.data.status === 'ok') {
            const excelUrl = response.data.excelUrl;
            setUploadedExcelUrl(excelUrl);
            console.log('URL de Excel cargada:', excelUrl);

            const excelFileResponse = await axiosInstance.get(`/api/trafico/download-excel?url=${encodeURIComponent(excelUrl)}`, { responseType: 'arraybuffer' });
            const data = new Uint8Array(excelFileResponse.data);
            const workbook = XLSX.read(data, { type: 'array' });

            const stationNumber = parseInt(selectedStation.split('-')[1], 10);
            const findStationSheet = (wb, num) => {
              const regex = new RegExp(`^FW_E0?${num}$`, 'i');
              return wb.SheetNames.find(n => regex.test(n.trim()));
            };
            const sheetName = findStationSheet(workbook, stationNumber) || `FW_E${stationNumber}`;
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
              console.error(`La hoja "${sheetName}" no se encontró en el archivo Excel al cargar el último.`);
              setChartData({
                hourly: { labels: [], datasets: [{ data: [] }] },
                percentage: { labels: [], datasets: [{ data: [] }] },
                classification: { labels: [], datasets: [{ data: [] }] },
                daily: { labels: [], datasets: [{ data: [] }] }
              });
              setIsLoadingCharts(false); // Set loading to false if sheet not found
              return;
            }

            // Variación Horaria
            // Dynamic Layout Detection
            const findRowIndex = (colIndex, searchText, startRow = 0, maxRow = 100) => {
              for (let r = startRow; r < maxRow; r++) {
                const cellAddress = XLSX.utils.encode_cell({ r, c: colIndex });
                const cell = workbook.Sheets[sheetName][cellAddress];
                if (cell && cell.v && cell.v.toString().trim().toUpperCase() === searchText) {
                  return r;
                }
              }
              return -1;
            };

            // 1. Hourly Data: Find first hour label (00-01 or 01-02) and TOTAL
            let hourlyStartRow = -1;
            for (let r = 2; r <= 5; r++) {
              const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
              const cell = workbook.Sheets[sheetName][cellAddress];
              if (cell && cell.v && /^\d{2}-\d{2}$/.test(cell.v.toString().trim())) {
                hourlyStartRow = r;
                break;
              }
            }
            const hourlyStartRow1Based = hourlyStartRow !== -1 ? hourlyStartRow + 1 : 4;

            const totalRowIndex = findRowIndex(0, 'TOTAL', 20, 35);
            const hourlyEndRow1Based = totalRowIndex !== -1 ? totalRowIndex : 27;

            const rawHourlyLabels = XLSX.utils.sheet_to_json(worksheet, { range: `A${hourlyStartRow1Based}:A${hourlyEndRow1Based}`, header: 1 });
            const hourlyLabels = rawHourlyLabels.map(row => row[0]);
            const rawHourlyData = XLSX.utils.sheet_to_json(worksheet, { range: `U${hourlyStartRow1Based}:U${hourlyEndRow1Based}`, header: 1 });
            const hourlyData = rawHourlyData.map(row => Number(row[0]));

            // Classification (Use Col B Types and Col M IMDa)
            let autosRowIndex = findRowIndex(1, 'AUTOS', 25, 45);
            if (autosRowIndex === -1) autosRowIndex = findRowIndex(1, 'Autos', 25, 45);
            const classStartRow = autosRowIndex !== -1 ? autosRowIndex : 32;
            const classEndRow = classStartRow + 12;
            const classStart1Based = classStartRow + 1;
            const classEnd1Based = classEndRow;

            const rawClassificationLabels = XLSX.utils.sheet_to_json(worksheet, { range: `B${classStart1Based}:B${classEnd1Based}`, header: 1 });
            const classificationLabels = rawClassificationLabels.map(row => row[0]);
            const rawClassificationData = XLSX.utils.sheet_to_json(worksheet, { range: `M${classStart1Based}:M${classEnd1Based}`, header: 1 });
            const classificationData = rawClassificationData.map(row => {
              const val = Number(row[0]);
              return isNaN(val) ? 0 : Number(val.toFixed(2));
            });

            // Percentage (Computed)
            const totalIMD = classificationData.reduce((a, b) => a + b, 0);
            const percentageLabels = classificationLabels;
            const percentageData = classificationData.map(val => {
              const pct = totalIMD > 0 ? (val / totalIMD) * 100 : 0;
              return { originalValue: pct, renderValue: Number(pct.toFixed(2)) };
            }).filter(item => item.originalValue > 0);

            // Daily (Computed Sums)
            const dailyHeaderRow1Based = classStartRow;
            const rawDailyHeaders = XLSX.utils.sheet_to_json(worksheet, { range: `C${dailyHeaderRow1Based}:I${dailyHeaderRow1Based}`, header: 1 });
            const dailyLabels = rawDailyHeaders.length > 0 ? rawDailyHeaders[0] : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

            const rawDailyBlock = XLSX.utils.sheet_to_json(worksheet, { range: `C${classStart1Based}:I${classEnd1Based}`, header: 1 });
            const dailyData = [];
            if (rawDailyBlock.length > 0) {
              const numDays = 7;
              for (let i = 0; i < numDays; i++) {
                let daySum = 0;
                rawDailyBlock.forEach(row => {
                  const val = Number(row[i]);
                  if (!isNaN(val)) daySum += val;
                });
                dailyData.push(daySum);
              }
            }

            setChartData({
              hourly: {
                labels: hourlyLabels,
                datasets: [{
                  label: 'Variación Horaria (Promedio Semanal)',
                  data: hourlyData,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
                }]
              },
              percentage: {
                labels: percentageLabels,
                datasets: [{
                  data: percentageData,
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                  offset: 10
                }]
              },
              classification: {
                labels: classificationLabels,
                datasets: [{
                  label: 'Clasificación Vehicular (IMDa)',
                  data: classificationData,
                  backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }]
              },
              daily: {
                labels: dailyLabels,
                datasets: [{
                  label: 'Vehículos/Día (Semana Representativa)',
                  data: dailyData,
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(199, 199, 199, 0.6)'
                  ]
                }]
              }
            });

          } else {
            setUploadedExcelUrl(null);
            console.log('URL de Excel establecida a null (respuesta no ok).');
            setChartData({
              hourly: { labels: [], datasets: [{ data: [] }] },
              percentage: { labels: [], datasets: [{ data: [] }] },
              classification: { labels: [], datasets: [{ data: [] }] },
              daily: { labels: [], datasets: [{ data: [] }] }
            });
          }
        } catch (error) {
          console.error('Error fetching latest Excel:', error);
          setUploadedExcelUrl(null);
          console.log('URL de Excel establecida a null (error de carga).');
          setChartData({
            hourly: { labels: [], datasets: [{ data: [] }] },
            percentage: { labels: [], datasets: [{ data: [] }] },
            classification: { labels: [], datasets: [{ data: [] }] },
            daily: { labels: [], datasets: [{ data: [] }] }
          });
        } finally {
          setIsLoadingCharts(false); // Ensure loading is set to false in all cases
        }
      } else {
        setUploadedExcelUrl(null);
        console.log('URL de Excel establecida a null (sin estación seleccionada).');
        setChartData({
          hourly: { labels: [], datasets: [{ data: [] }] },
          percentage: { labels: [], datasets: [{ data: [] }] },
          classification: { labels: [], datasets: [{ data: [] }] },
          daily: { labels: [], datasets: [{ data: [] }] }
        });
        setIsLoadingCharts(false); // Set loading to false if no station is selected
      }
    };

    fetchLatestExcel();
  }, [selectedStation]);

  return (
    <div className="estacion-control-tab-wrapper">
      <div style={{ display: 'flex', minHeight: '600px', padding: '20px', gap: '20px', alignItems: 'stretch' }}>
        {/* MAPA principal - a la izquierda */}
        <div style={{ flex: '3', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '500px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <ErrorBoundary>
              <MapContainer center={view.center} zoom={view.zoom} zoomControl={false} className="map-container-custom-controls" style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <MapViewController setView={setView} />
                {showTraffic && Object.values(stationData).map((station) => {
                  if (!station || !station.info || station.info.lat === undefined || station.info.lng === undefined || station.info.lat === null || station.info.lng === null) {
                    return null;
                  }
                  const images = station.info.imagenes.filter(img => img.source_type === 'conteo_vehicular_image');
                  let randomImageUrl = null;
                  if (images && images.length > 0) {
                    const randomIndex = Math.floor(Math.random() * images.length);
                    randomImageUrl = images[randomIndex].image_url;
                  }

                  return (
                    <Marker
                      key={station.info.id}
                      position={[station.info.lat, station.info.lng]}
                      eventHandlers={{
                        click: () => {
                          handleStationSelect(station.info.id);
                        },
                        mouseover: (event) => {
                          event.target.openPopup();
                        },
                        mouseout: (event) => {
                          event.target.closePopup();
                        },
                      }}
                      icon={divIcon({
                        className: 'custom-station-icon',
                        html: `<div style="
                      background-color: ${selectedStation === station.info.id ? '#1abc9c' : '#2ecc71'};
                        border: ${selectedStation === station.info.id ? '4px solid #3498db' : '2px solid #27ae60'};
                        border-radius: 50%;
                        width: ${selectedStation === station.info.id ? '40px' : '30px'};
                        height: ${selectedStation === station.info.id ? '40px' : '30px'};
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: white;
                        font-weight: bold;
                        font-size: ${selectedStation === station.info.id ? '14px' : '12px'};
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      ">${station.info.id}</div>`,
                        iconSize: selectedStation === station.info.id ? [50, 50] : [40, 40],
                        iconAnchor: selectedStation === station.info.id ? [25, 25] : [20, 20],
                        popupAnchor: selectedStation === station.info.id ? [0, -25] : [0, -20],
                      })}
                    >
                      <Popup>
                        <div style={{ maxWidth: '250px', fontFamily: 'Arial, sans-serif' }}>
                          <strong style={{ fontSize: '14px', color: '#333' }}>{station.info.nombre}</strong>
                          {randomImageUrl && (
                            <img
                              src={randomImageUrl}
                              alt={`Foto de ${station.info.nombre}`}
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                marginTop: '8px',
                                borderRadius: '4px'
                              }}
                            />
                          )}
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#555' }}>
                            <strong>Ubicación:</strong> {station.info.ubicacion}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </ErrorBoundary>
          </div>
          <div style={{ display: 'grid', gap: '20px', marginTop: '12px' }}>
            <div className="stations-container-box" style={{ width: '100%', position: 'relative', paddingBottom: '50px' }}>
              <div className="stations-header">
                <h3 className="stations-title">
                  <i className="fas fa-map-marker-alt"></i>
                  Estaciones
                </h3>

              </div>
              <div className="stations-content">
                <div className="stations-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', overflowX: 'auto', paddingBottom: '10px', width: '100%', gap: '10px' }}>
                  {Object.keys(stationData).map((stationId) => (
                    <div
                      key={stationId}
                      className={`station-btn-large ${selectedStation === stationId ? 'active' : ''}`}
                      onClick={() => handleStationSelect(stationId)}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        flex: '1 1 calc(25% - 10px)', // Make buttons take up 25% of the width minus gap
                        maxWidth: 'calc(25% - 10px)', // Ensure they don't grow beyond 25% minus gap
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingBottom: '10px' // Add some padding at the bottom
                      }}
                    >
                      <div className="station-info" style={{ marginBottom: '10px' }}> {/* Add margin to separate from image */}
                        <strong>{stationData[stationId].info.id}</strong>
                        <small>{stationData[stationId].info.nombre}</small>
                      </div>

                      {/* Nuevo botón para visualizar Excel */}


                      {stationData[stationId].info && stationData[stationId].info.imagenes && stationData[stationId].info.imagenes.filter(item => item.source_type === 'conteo_vehicular_file').length > 0 && (() => {
                        const sortedItems = [...stationData[stationId].info.imagenes.filter(item => item.source_type === 'conteo_vehicular_file')].sort((a, b) => {
                          return new Date(b.upload_date) - new Date(a.upload_date);
                        });
                        const latestItem = sortedItems[0];
                        const isImage = latestItem.image_url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i);

                        return (
                          <div
                            style={{
                              width: '100%',
                              marginTop: '10px',
                              textAlign: 'center',
                              padding: '8px',
                              backgroundColor: '#f0f0f0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: '1px solid #ddd',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              fontSize: '12px',
                              color: '#333',
                              fontWeight: 'bold'
                            }}
                            onClick={(e) => { e.stopPropagation(); isImage ? openImageModal(latestItem.image_url) : window.open(latestItem.image_url, '_blank'); }}
                          >
                            {isImage ? (
                              <img src={latestItem.image_url} alt={latestItem.description || 'Última imagen'} style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                              <i className="fas fa-file-alt" style={{ marginRight: '5px' }}></i>
                            )}
                            <p style={{ margin: '5px 0 0 0' }}>{latestItem.description || latestItem.image_url.split('/').pop()}</p>
                          </div>
                        );
                      })()}

                    </div>
                  ))}
                </div>
              </div>
              {currentStationData && uploadedExcelUrl && (
                <button
                  onClick={() => {
                    window.open(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(uploadedExcelUrl)}`, '_blank');
                  }}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 1000
                  }}
                >
                  Ver Excel
                </button>
              )}
            </div>

          </div>
          {selectedStation && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                Gestión de Datos Excel
              </h3>
              <input
                type="file"
                id="excelUpload"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleExcelUpload}
              />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => document.getElementById('excelUpload').click()}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    flex: 1
                  }}
                >
                  Subir Excel para Gráficos
                </button>
                <button
                  onClick={handleClearExcel}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    flex: 1
                  }}
                >
                  Borrar Excel Actual
                </button>
              </div>
            </div>
          )}
          {currentStationData && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '20px',
              marginTop: '20px' // Add margin-top to separate it from the stations box
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                Gráficos e Información de Estación
              </h3>

              <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '5px', minHeight: '100px', overflowX: 'auto' }}>
                { }

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
                  {excelTableData && excelTableData.length > 0 && (
                    <div style={{ marginTop: '20px', overflowX: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                      <h4>Tabla de Datos Extraída</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          {excelTableData[0] && (
                            <tr>
                              {excelTableData[0].map((header, idx) => (
                                <th key={idx} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'left' }}>{header}</th>
                              ))}
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {excelTableData.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px 10px 60px 10px', borderRadius: '5px' }}>
                    <h4>Variación Horaria</h4>
                    {chartData && <Line data={chartData.hourly} plugins={[ChartDataLabels]} options={{
                      plugins: {
                        datalabels: {
                          anchor: 'end',
                          align: 'top',
                          formatter: (value) => value,
                          color: 'black',
                          font: {
                            weight: 'bold',
                            size: 12
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 80
                        }
                      }
                    }} />}
                    {hourlyAnalysis && (
                      <button
                        onClick={() => setModalAnalysisData({ ...hourlyAnalysis, title: 'Análisis de Variación Horaria' })}
                        style={{
                          position: 'absolute',
                          bottom: '15px',
                          right: '15px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          zIndex: 10,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                      >
                        <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                        Conclusiones
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                    <h4>Porcentaje Vehicular</h4>

                    {chartData && chartData.percentage && chartData.percentage.datasets && chartData.percentage.datasets[0] && chartData.percentage.datasets[0].data.length > 0 ? (
                      <Pie key={selectedStation} data={chartData.percentage} plugins={[ChartDataLabels]} options={{
                        parsing: {
                          key: 'renderValue'
                        },
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                let label = context.label || '';
                                if (label) {
                                  label += ': ';
                                }
                                const originalValue = context.raw.originalValue;
                                if (originalValue !== null) {
                                  label += originalValue.toFixed(1) + '%';
                                }
                                return label;
                              }
                            }
                          },
                          datalabels: {
                            display: true,
                            color: 'white',
                            font: {
                              weight: 'bold',
                              size: 12
                            },
                            formatter: (value, context) => {
                              return value.renderValue.toFixed(1) + '%';
                            }
                          }
                        }
                      }} />
                    ) : (
                      <p>Cargando datos de porcentaje vehicular...</p>
                    )}
                    {percentageAnalysis && (
                      <button
                        onClick={() => setModalAnalysisData({ ...percentageAnalysis, title: 'Análisis de Porcentaje Vehicular' })}
                        style={{
                          position: 'absolute',
                          bottom: '15px',
                          right: '15px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          zIndex: 10,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                      >
                        <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                        Conclusiones
                      </button>
                    )}
                    {percentageAnalysis && (
                      <button
                        onClick={() => setModalAnalysisData({ ...percentageAnalysis, title: 'Análisis de Porcentaje Vehicular' })}
                        style={{
                          position: 'absolute',
                          bottom: '15px',
                          right: '15px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          zIndex: 10,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                      >
                        <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                        Conclusiones
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px 10px 60px 10px', borderRadius: '5px' }}>
                    <h4>Clasificación Vehicular IMD</h4>
                    {chartData && <Bar data={chartData.classification} plugins={[ChartDataLabels]} options={{
                      plugins: {
                        datalabels: {
                          anchor: 'end',
                          align: 'top',
                          formatter: (value) => value,
                          font: {
                            weight: 'bold',
                            size: 14
                          },
                          color: 'white',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: 4,
                          padding: 4
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }} />}
                    {classificationAnalysis && (
                      <button
                        onClick={() => setModalAnalysisData({ ...classificationAnalysis, title: 'Análisis de Clasificación Vehicular' })}
                        style={{
                          position: 'absolute',
                          bottom: '15px',
                          right: '15px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          zIndex: 10,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                      >
                        <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                        Conclusiones
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px 10px 60px 10px', borderRadius: '5px' }}>
                    <h4>Variación Diaria</h4>
                    {chartData && <Bar data={chartData.daily} plugins={[ChartDataLabels]} options={{
                      plugins: {
                        datalabels: {
                          anchor: 'end',
                          align: 'top',
                          formatter: (value) => value,
                          font: {
                            weight: 'bold'
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }} />}
                    {dailyAnalysis && (
                      <button
                        onClick={() => setModalAnalysisData({ ...dailyAnalysis, title: 'Análisis de Variación Diaria' })}
                        style={{
                          position: 'absolute',
                          bottom: '15px',
                          right: '15px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          zIndex: 10,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                      >
                        <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                        Conclusiones
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: '0.8', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h3 onClick={() => setIsStationDataVisible(!isStationDataVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Estación Datos</span>
              <i className={`fas fa-chevron-down accordion-icon ${isStationDataVisible ? '' : 'collapsed'}`}></i>
            </h3>
            <CSSTransition
              nodeRef={stationDataRef}
              in={isStationDataVisible}
              timeout={500}
              classNames="accordion-content"
              unmountOnExit
            >
              <div ref={stationDataRef}>
                {currentStationData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <strong>Nombre:</strong> {currentStationData.info.nombre}
                    </div>
                    <div>
                      <strong>Ubicación:</strong> {currentStationData.info.ubicacion}
                    </div>
                    <div>
                      <strong>Coordenadas:</strong> {currentStationData.info.coordenadas}
                    </div>
                    <div>
                      <strong>Altitud:</strong> {currentStationData.info.altitud} msnm
                    </div>
                    <div>
                      <strong>Descripción:</strong> {currentStationData.info.descripcion}
                    </div>
                  </div>
                )}
              </div>
            </CSSTransition>
          </div>
          {currentStationData && (
            <button
              onClick={() => alert('Descargar Reporte Clicked!')} // Placeholder for future functionality
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '100%',
                marginTop: '20px',
                boxSizing: 'border-box', // Ensure padding and border are included in the width
                margin: '0 auto' // Center horizontally
              }}
            >
              Descargar Reporte
            </button>
          )}


        </div>

      </div>
      <UploadTrafficDataModal
        isOpen={isModalOpen}
        onClose={closeUploadModal}
        entityId={stationIdToUpload}
        onUploadSuccess={handleUploadSuccess}
        uploadUrl="/api/trafico/conteovehicular/upload-file"
        entityIdName="stationId"
        sourceTypeImage="conteo_vehicular_image"
        sourceTypeFile="conteo_vehicular_file"
      />

      <ImageDisplayModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        imageUrl={imageToDisplay}
        isNavbarExpanded={isNavbarExpanded}
      />

      <AnalysisModal
        isOpen={modalAnalysisData !== null}
        onClose={() => setModalAnalysisData(null)}
        analysis={modalAnalysisData}
      />

      {isLoadingCharts && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          flexDirection: 'column'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', marginBottom: '20px', color: '#ADD8E6' }}></i>
          Cargando datos de estación {selectedStation ? selectedStation.replace('E-', '') : ''}...
        </div>
      )}

    </div>
  );
};

export default ReportConteoVehicularTab;
