import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import axiosInstance from '../../../../api/axios';
import * as XLSX from 'xlsx';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
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

// Primero definimos el plugin
const percentageTextPlugin = {
  id: 'percentageText',
  afterDraw(chart, args, options) {
    const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;

    ctx.save();

    data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((arc, index) => {
        const rawValue = dataset?.data?.[index];
        const value = typeof rawValue === 'number'
          ? rawValue
          : Number(rawValue?.renderValue ?? rawValue?.value ?? rawValue?.originalValue);

        if (Number.isFinite(value) && value >= 0) {
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

// Luego registramos los componentes incluyendo el plugin
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
  percentageTextPlugin,
  ChartDataLabels
);

// El resto del código permanece igual...
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



const ReportEncuestaOrigenDestinoTab = ({ stationData, selectedStation, handleStationSelect, showRoute, setShowRoute, showTraffic, setShowTraffic, refreshStationData, setIsLoadingImages, isLoadingImages, isNavbarExpanded }) => {
  console.log('ReportEncuestaOrigenDestinoTab se está renderizando.');

  const staticData = {
    labels: ['Ruta A', 'Ruta B', 'Ruta C', 'Ruta D', 'Ruta E'],
    datasets: [
      {
        label: 'Origen 1',
        data: [10, 20, 15, 5, 25],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Origen 2',
        data: [15, 10, 20, 10, 10],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };
  const [view, setView] = useState({ center: [-12.5, -72.5], zoom: 11 });
  const currentStationData = stationData[selectedStation];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stationIdToUpload, setStationIdToUpload] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);

  const [isStationDataVisible, setIsStationDataVisible] = useState(true);
  const stationDataRef = useRef(null);

  const [uploadedExcelUrl, setUploadedExcelUrl] = useState(null);
  const [excelTableData, setExcelTableData] = useState(null);
  const [origenDestinoLabels, setOrigenDestinoLabels] = useState([]);
    const [origenDestinoData, setOrigenDestinoData] = useState(null);
    const [origenDestinoDataPesados, setOrigenDestinoDataPesados] = useState(null);
    const [isLoadingCharts, setIsLoadingCharts] = useState(false);

    const stationChartConfig = {
      'E-01': {
          livianos: {
              sheetName: 'R. OD. VLIV. E1',
              destinosRange: 'C3:T3',
              origenesRange: 'B4:B20',
              origenesStartRow: 4,
              origenesEndRow: 20,
              destinosStartCol: 'C',
              destinosEndCol: 'T',
          },
          pesados: {
              sheetName: 'R. OD. VPES. E1',
              origenesRange: 'B4:B11',
              destinosRange: 'C3:I3',
              origenesStartRow: 4,
              origenesEndRow: 11,
              destinosStartCol: 'C',
              destinosEndCol: 'I',
          }
      },
      'E-04': {
          livianos: {
              sheetName: 'R. OD. VLIV. E4',
              destinosRange: 'C3:P3',
              origenesRange: 'B4:B16',
              origenesStartRow: 4,
              origenesEndRow: 16,
              destinosStartCol: 'C',
              destinosEndCol: 'P',
          },
          pesados: {
              sheetName: 'R. OD. VPES. E4',
              origenesRange: 'F4:F13',
              destinosRange: 'G3:L3',
              origenesStartRow: 4,
              origenesEndRow: 13,
              destinosStartCol: 'G',
              destinosEndCol: 'L',
          }
      }
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('stationId', selectedStation);

    try {
      const response = await axiosInstance.post('/api/trafico/conteovehicular/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'ok') {
        alertify.success('Archivo Excel subido y procesado con éxito.');
        refreshStationData(); // O una función más específica para recargar solo los datos del gráfico
      } else {
        alertify.error('Error al procesar el archivo Excel.');
      }
    } catch (error) {
      console.error('Error al subir el archivo Excel:', error);
      alertify.error('Error al subir el archivo Excel.');
    }
  };

  const handleClearExcel = async () => {
    if (!selectedStation) return;

    alertify.confirm(
      'Borrar Excel',
      '¿Estás seguro de que quieres borrar el archivo Excel actual para esta estación? Esto limpiará los gráficos.',
      async function() {
        try {
          const response = await axiosInstance.delete(`/api/trafico/conteovehicular/delete-excel/${selectedStation}`);

          if (response.data.status === 'ok') {
            alertify.success('Archivo Excel borrado con éxito.');
            setUploadedExcelUrl(null);
           
          } else {
            alertify.error('Error al borrar el archivo Excel.');
          }
        } catch (error) {
          console.error('Error al borrar el archivo Excel:', error);
          alertify.error('Error al borrar el archivo Excel.');
        }
      },
      function() {
        alertify.error('Borrado cancelado.');
      }
    );
  };


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

useEffect(() => {
    const fetchLatestExcel = async () => {
        setIsLoadingCharts(true); // Set loading to true at the start of data fetching

        if (selectedStation) {
            const stationConfig = stationChartConfig[selectedStation];

            if (!stationConfig) {
                console.warn(`No hay configuración de gráfico para la estación: ${selectedStation}`);
                setOrigenDestinoData(null);
                setOrigenDestinoDataPesados(null);
                setUploadedExcelUrl(null);
                setIsLoadingCharts(false); // Set loading to false if no config is found
                return;
            }

            try {
                const response = await axiosInstance.get(`/api/trafico/conteovehicular/latest-excel/E-01`);
                if (response.data.status === 'ok') {
                    const excelUrl = response.data.excelUrl;
                    setUploadedExcelUrl(excelUrl);
                    console.log('URL de Excel cargada:', excelUrl);

                    const excelFileResponse = await axiosInstance.get(`/api/trafico/download-excel?url=${encodeURIComponent(excelUrl)}`, { responseType: 'arraybuffer' });
                    const data = new Uint8Array(excelFileResponse.data);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // --- PROCESAR HOJA DE VEHÍCULOS LIVIANOS ---
                    const livianosConfig = stationConfig.livianos;
                    const sheetNameLivianos = livianosConfig.sheetName;
                    const worksheetLivianos = workbook.Sheets[sheetNameLivianos];

                    if (worksheetLivianos) {
                        const rawDestinoLabels = XLSX.utils.sheet_to_json(worksheetLivianos, { range: livianosConfig.destinosRange, header: 1 });
                        let labels = (rawDestinoLabels.length > 0 && rawDestinoLabels[0].length > 0) ? [...rawDestinoLabels[0]].reverse() : [];
                        setOrigenDestinoLabels(labels);

                        const datasets = [];
                        const rawOriginLabels = XLSX.utils.sheet_to_json(worksheetLivianos, { range: livianosConfig.origenesRange, header: 1 });
                        const originLabels = rawOriginLabels.map(row => row[0] || `Origen ${rawOriginLabels.indexOf(row) + 1}`);
                        const numOrigins = livianosConfig.origenesEndRow - livianosConfig.origenesStartRow + 1;

                        for (let r = livianosConfig.origenesStartRow; r <= livianosConfig.origenesEndRow; r++) {
                            const originLabel = originLabels[r - livianosConfig.origenesStartRow];
                            const rowRange = `${livianosConfig.destinosStartCol}${r}:${livianosConfig.destinosEndCol}${r}`;
                            const rawDataRow = XLSX.utils.sheet_to_json(worksheetLivianos, { range: rowRange, header: 1 });
                            const data = rawDataRow.length > 0 ? rawDataRow[0].map(val => val ?? 0) : Array(labels.length).fill(0);
                            const dataForDataset = [...data].reverse();
                            datasets.push({
                                label: originLabel,
                                data: dataForDataset,
                                backgroundColor: `hsl(${((r - livianosConfig.origenesStartRow) * 360) / numOrigins}, 70%, 50%)`,
                                barPercentage: 1.0,
                                categoryPercentage: 0.8
                            });
                        }
                        setOrigenDestinoData({ labels: labels, datasets: datasets });
                    } else {
                        console.error(`La hoja "${sheetNameLivianos}" no se encontró.`);
                        setOrigenDestinoData(null);
                    }

                    // --- PROCESAR HOJA DE VEHÍCULOS PESADOS (PIVOTADO) ---
                    const pesadosConfig = stationConfig.pesados;
                    const sheetNamePesados = pesadosConfig.sheetName;
                    const worksheetPesados = workbook.Sheets[sheetNamePesados];

                    if (worksheetPesados) {
                        const rawOriginLabels = XLSX.utils.sheet_to_json(worksheetPesados, { range: pesadosConfig.origenesRange, header: 1 });
                        const originLabels = rawOriginLabels.map(row => row[0] || `Origen ${rawOriginLabels.indexOf(row) + 1}`).reverse();

                        const rawDestinoLabels = XLSX.utils.sheet_to_json(worksheetPesados, { range: pesadosConfig.destinosRange, header: 1 });
                        const destinationLabels = (rawDestinoLabels.length > 0 && rawDestinoLabels[0].length > 0) ? rawDestinoLabels[0] : [];

                        const datasets = [];
                        const startColCharCode = pesadosConfig.destinosStartCol.charCodeAt(0);
                        const endColCharCode = pesadosConfig.destinosEndCol.charCodeAt(0);

                        for (let i = 0; i <= endColCharCode - startColCharCode; i++) {
                            const destinationLabel = destinationLabels[i];
                            const currentColLetter = String.fromCharCode(startColCharCode + i);
                            const colRange = `${currentColLetter}${pesadosConfig.origenesStartRow}:${currentColLetter}${pesadosConfig.origenesEndRow}`;
                            
                            const rawColData = XLSX.utils.sheet_to_json(worksheetPesados, { range: colRange, header: 1 });
                            const colData = rawColData.map(row => row[0] ?? 0).reverse();

                            datasets.push({
                                label: destinationLabel,
                                data: colData,
                                backgroundColor: `hsl(${(i * 360) / destinationLabels.length}, 70%, 50%)`,
                                barPercentage: 1.0,
                                categoryPercentage: 0.8
                            });
                        }
                        setOrigenDestinoDataPesados({ labels: originLabels, datasets: datasets });
                    } else {
                        console.error(`La hoja "${sheetNamePesados}" no se encontró.`);
                        setOrigenDestinoDataPesados(null);
                    }
                } else {
                    setUploadedExcelUrl(null);
                    setOrigenDestinoData(null);
                    setOrigenDestinoDataPesados(null);
                }
            } catch (error) {
                console.error('Error fetching latest Excel:', error);
                setUploadedExcelUrl(null);
                setOrigenDestinoData(null);
                setOrigenDestinoDataPesados(null);
            } finally {
                setIsLoadingCharts(false); // Ensure loading is set to false in all cases
            }
        } else {
            setUploadedExcelUrl(null);
            setOrigenDestinoData(null);
            setOrigenDestinoDataPesados(null);
            setIsLoadingCharts(false); // Set loading to false if no station is selected
        }
    };

    fetchLatestExcel();
}, [selectedStation]);


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

  const handleDeleteImageGroup = async (stationId, description, uploadDate) => {
    alertify.confirm(
      'Eliminar Grupo de Imágenes',
      '¿Estás seguro de que quieres eliminar este grupo de imágenes?\nEsta acción eliminará todas las imágenes con la descripción "' + description + '" y fecha "' + formatDate(uploadDate) + '" para esta estación.',
      async function() {
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
      function() {
        alertify.error('Eliminación cancelada.');
      }
    );
  };

  const handleDeleteFile = async (stationId, imageUrl, description, uploadDate) => {
    alertify.confirm(
      'Eliminar Archivo',
      `¿Estás seguro de que quieres eliminar el archivo "${description || imageUrl.split('/').pop()}" subido el ${formatDate(uploadDate)}?`,
      async function() {
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
      function() {
        alertify.error('Eliminación cancelada.');
      }
    );
  };

  return (
    <div className="estacion-control-tab-wrapper">
      <div style={{display: 'flex', minHeight: '600px', padding: '20px', gap: '20px', alignItems: 'stretch'}}>
        {/* MAPA principal - a la izquierda */}
        <div style={{flex: '3', display: 'flex', flexDirection: 'column'}}>
          <div style={{height: '500px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
            <ErrorBoundary>
              <MapContainer center={view.center} zoom={view.zoom} zoomControl={false} className="map-container-custom-controls" style={{height: '100%', width: '100%'}}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapViewController setView={setView} />
              {showTraffic && Object.values(stationData)
                .filter(station => !['E-02', 'E-03'].includes(station.info.id)) // Filter out E-02 and E-03
                .map((station) => {
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
          <div style={{display: 'grid', gap: '20px', marginTop: '12px'}}>
            <div className="stations-container-box" style={{ width: '100%', position: 'relative', paddingBottom: '50px' }}>
              <div className="stations-header">
                <h3 className="stations-title">
                  <i className="fas fa-map-marker-alt"></i>
                  Estaciones
                </h3>

              </div>
              <div className="stations-content">
                <div className="stations-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', overflowX: 'auto', paddingBottom: '10px', width: '100%', gap: '10px' }}>
                  {Object.keys(stationData)
                    .filter(stationId => !['E-02', 'E-03'].includes(stationId)) // Added filter to exclude E-02 and E-03
                    .map((stationId) => (
                    <div
                      key={stationId}
                      className={`station-btn-large ${selectedStation === stationId ? 'active' : ''}`}
                      onClick={() => handleStationSelect(stationId)}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        flex: '1 1 calc(25% - 10px)',
                        maxWidth: 'calc(25% - 10px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingBottom: '10px'
                      }}
                    >
                      <div className="station-info" style={{ marginBottom: '10px' }}>
                        <strong>{stationData[stationId].info.id}</strong>
                        <small>{stationData[stationId].info.nombre}</small>
                      </div>


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
              marginTop: '20px' 
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                Gráficos e Información de Estación
              </h3>

              <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '5px', minHeight: '100px', overflowX: 'auto' }}>
                {}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
                  {origenDestinoData ? (
                    <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                      <Bar data={origenDestinoData} options={{
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: `COMPARACIÓN DE ORÍGENES Y DESTINO EN LA ESTACIÓN ${selectedStation ? selectedStation.replace('E-', '') : ''} - VEHÍCULOS LIVIANOS`,
                            font: { size: 16 }
                          },
                          datalabels: {
                            display: true,
                            color: 'black',
                            font: {
                              weight: 'bold'
                            },
                            formatter: (value, context) => {
                              return value > 0 ? value : null;
                            }
                          }
                        },
                        scales: {
                          x: {
                            stacked: true,
                            min: 0,
                            title: {
                              display: true,
                              text: 'Conteo de Vehículos'
                            }
                          },
                          y: {
                            stacked: true,
                            title: {
                              display: true,
                              text: 'Destino (Rutas)'
                            },
                            ticks: {
                              autoSkip: false,
                              maxRotation: 0,
                              minRotation: 0,
                            }
                          },
                        },
                      }} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No se encontraron datos de origen y destino para Vehículos Livianos.
                    </div>
                  )}

                  {origenDestinoDataPesados ? (
                    <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginTop: '20px' }}>
                      <Bar data={origenDestinoDataPesados} options={{
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: `COMPARACION DE ORIGENES Y DESTINOS ESTACION ${selectedStation ? selectedStation.replace('E-', '') : ''} VEHICULOS PESADOS`,
                            font: { size: 16 }
                          },
                          datalabels: {
                            display: true,
                            color: 'black',
                            font: {
                              weight: 'bold'
                            },
                            formatter: (value, context) => {
                              return value > 0 ? value : null;
                            }
                          }
                        },
                        scales: {
                          x: {
                            stacked: true,
                            min: 0, // You might want to adjust this max value for the new chart
                            title: {
                              display: true,
                              text: 'Conteo de Vehículos'
                            }
                          },
                          y: {
                            stacked: true,
                            title: {
                              display: true,
                              text: 'Origen'
                            },
                            ticks: {
                              autoSkip: false,
                              maxRotation: 0,
                              minRotation: 0,
                            }
                          },
                        },
                      }} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No se encontraron datos de origen y destino para Vehículos Pesados.
                    </div>
                  )}
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
                  
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{flex: '0.8', display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px'}}>
            <h3 onClick={() => setIsStationDataVisible(!isStationDataVisible)} style={{margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
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
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px'}}>
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
              onClick={() => alert('Descargar Reporte Clicked! no funcional por el momento V2 trabajado')} // Placeholder for future functionality
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

export default ReportEncuestaOrigenDestinoTab;
