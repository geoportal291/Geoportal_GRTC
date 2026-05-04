import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import axiosInstance from '../../../../api/axios';
import ImageDisplayModal from './ImageDisplayModal';

import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { CSSTransition } from 'react-transition-group';
import * as XLSX from 'xlsx';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import UploadTrafficDataModal from './UploadTrafficDataModal';

import './EstacionControlTab.css';
import ErrorBoundary from '../../../ErrorBoundary';

// Primero definimos el plugin (aunque no se use directamente en este archivo, se mantiene por consistencia si se añaden gráficos)
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
  ChartDataLabels
);

// Componente para manejar la vista del mapa (adaptado para sectionData)
const MapViewController = ({ sectionData, setView, view }) => {
  const map = useMap();
  const isInitialFitDone = useRef(false);

  useEffect(() => {
    if (sectionData && Object.keys(sectionData).length > 0 && !isInitialFitDone.current) {
      const allCoords = Object.values(sectionData).flatMap(section => section.info.coordinates);
      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [50, 50] });
        isInitialFitDone.current = true;
      }
    }
  }, [sectionData, map]);

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

const ReportEncuestaVelocidadTab = ({
  sectionData, // Recibido como prop
  selectedSection, // Recibido como prop
  handleSectionSelect, // Recibido como prop
  refreshData, // Recibido como prop
  isNavbarExpanded
}) => {
  const [view, setView] = useState({ center: [-12.5, -72.5], zoom: 11 });
  const [showTraffic, setShowTraffic] = useState(true); // Asegurar que los tramos se muestren

  const currentSectionData = sectionData && selectedSection ? sectionData[selectedSection] : null;

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);

  const [isSectionDataVisible, setIsSectionDataVisible] = useState(true);
  const [isPhotosVisible, setIsPhotosVisible] = useState(true);
  const sectionDataRef = useRef(null);
  const photosRef = useRef(null);

  const [visibility, setVisibility] = useState(() => {
    const initialVisibility = {};
    if (sectionData) {
      Object.keys(sectionData).forEach(tramoId => {
        initialVisibility[tramoId] = true;
      });
    }
    return initialVisibility;
  });

  const [uploadedExcelUrl, setUploadedExcelUrl] = useState(null);
  const [excelTableData, setExcelTableData] = useState(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sectionIdToUpload, setSectionIdToUpload] = useState(null);

  const [velocidadPieData, setVelocidadPieData] = useState(null);

  const sectionChartConfig = {
    'T-1': {
      velocidad: {
        sheetName: 'R. VEL.',
        labelsRange: 'F17:M17',
        dataRange: 'F18:M18',
      },
    },
    'T-2': {
      velocidad: {
        sheetName: 'R. VEL.',
        labelsRange: 'F17:M17',
        dataRange: 'F19:M19',
      },
    },
    'T-3': {
      velocidad: {
        sheetName: 'R. VEL.',
        labelsRange: 'F17:M17',
        dataRange: 'F20:M20',
      },
    },
  };

  const chartTitles = {
    'T-1': 'VELOCIDADES (KM/H), DESV. LOROHUACHANA - PTE. LAMPACHACA (0+000-22+700)',
    'T-2': 'VELOCIDADES (KM/H), PTE. LAMPACHACA - DESV. LA ESTRELLA (22+700-71+800)',
    'T-3': 'VELOCIDADES (KM/H), DESV. LA ESTRELLA - SAN MARTIN (71+800-86+100)',
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('sectionId', selectedSection);

    try {
      const response = await axiosInstance.post('/api/trafico/encuestavelocidad/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-type'
        }
      });

      if (response.data.status === 'ok') {
        alertify.success('Archivo Excel subido y procesado con éxito.');
        // refreshData(); // O una función más específica para recargar solo los datos del gráfico
        // Después de subir el Excel, se debería volver a cargar los datos para los gráficos
        // Por ahora, solo se refresca la URL del excel para que se muestre el botón de borrar
        setUploadedExcelUrl(response.data.excelUrl); // Asumiendo que la respuesta incluye la URL del excel subido
      } else {
        alertify.error('Error al procesar el archivo Excel.');
      }
    } catch (error) {
      console.error('Error al subir el archivo Excel:', error);
      alertify.error('Error al subir el archivo Excel.');
    }
  };

  const handleClearExcel = async () => {
    if (!selectedSection) return;

    alertify.confirm(
      'Borrar Excel',
      '¿Estás seguro de que quieres borrar el archivo Excel actual para este tramo? Esto limpiará los gráficos.',
      async function() {
        try {
          const response = await axiosInstance.delete(`/api/trafico/encuestavelocidad/delete-excel/${selectedSection}`);

          if (response.data.status === 'ok') {
            alertify.success('Archivo Excel borrado con éxito.');
            setUploadedExcelUrl(null);
            setExcelTableData(null);
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

  const handleUploadSuccess = (sectionId, newImageData) => {
    refreshData();
  };

  const openUploadModal = (sectionId) => {
    setSectionIdToUpload(sectionId);
    setIsModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsModalOpen(false);
    setSectionIdToUpload(null);
  };

  useEffect(() => {
    const fetchLatestExcel = async () => {
        setIsLoadingCharts(true);
        setVelocidadPieData(null); // Reset pie data on section change

        if (selectedSection) {
            const currentSectionConfig = sectionChartConfig[selectedSection];

            if (!currentSectionConfig) {
                console.warn(`No hay configuración de gráfico para el tramo: ${selectedSection}`);
                setUploadedExcelUrl(null);
                setExcelTableData(null);
                setIsLoadingCharts(false);
                return;
            }

            try {
                const response = await axiosInstance.get(`/api/trafico/conteovehicular/latest-excel/E-01`);
                if (response.data.status === 'ok') {
                    const excelUrl = response.data.excelUrl;
                    setUploadedExcelUrl(excelUrl);
                    console.log('Leyendo archivo Excel:', excelUrl);

                    const excelFileResponse = await axiosInstance.get(`/api/trafico/download-excel?url=${encodeURIComponent(excelUrl)}`, { responseType: 'arraybuffer' });
                    const data = new Uint8Array(excelFileResponse.data);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Procesar hoja R. VEL. para gráfico de torta de velocidad
                    if (currentSectionConfig.velocidad) {
                        const velocidadConfig = currentSectionConfig.velocidad;
                        const sheetNameVelocidad = velocidadConfig.sheetName;
                        const worksheetVelocidad = workbook.Sheets[sheetNameVelocidad];

                        if (worksheetVelocidad) {
                            const rawLabels = XLSX.utils.sheet_to_json(worksheetVelocidad, { range: velocidadConfig.labelsRange, header: 1 });
                            const labels = rawLabels[0] || [];

                            const rawData = XLSX.utils.sheet_to_json(worksheetVelocidad, { range: velocidadConfig.dataRange, header: 1 });
                            const pieData = rawData[0] || [];

                            const total = pieData.reduce((sum, val) => sum + (Number(val) || 0), 0);
                            const percentages = pieData.map(val => (total > 0 ? Math.round((Number(val) || 0) / total * 100) : 0));

                            setVelocidadPieData({
                                labels: labels,
                                datasets: [
                                    {
                                        data: percentages,
                                        backgroundColor: labels.map((_, i) => `hsl(${(i * 360) / labels.length}, 70%, 50%)`),
                                        borderColor: '#fff',
                                        borderWidth: 1,
                                    },
                                ],
                            });
                        } else {
                            console.error(`La hoja "${sheetNameVelocidad}" no se encontró.`);
                        }
                    }
                } else {
                    setUploadedExcelUrl(null);
                    setExcelTableData(null);
                }
            } catch (error) {
                console.error('Error fetching latest Excel:', error);
                setUploadedExcelUrl(null);
                setExcelTableData(null);
            } finally {
                setIsLoadingCharts(false);
            }
        } else {
            setUploadedExcelUrl(null);
            setExcelTableData(null);
            setIsLoadingCharts(false);
        }
    };

    fetchLatestExcel();
  }, [selectedSection]);

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

  const handleVisibilityChange = (tramoId) => {
    setVisibility(prev => ({ ...prev, [tramoId]: !prev[tramoId] }));
  };

  const showAll = () => {
    if (sectionData) {
      setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: true }), {}));
    }
    setShowTraffic(true);
  };

  const hideAll = () => {
    if (sectionData) {
      setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: false }), {}));
    }
    setShowTraffic(false);
  };

  const colors = {
    'T-1': '#27ae60', // Verde
    'T-2': '#3498db', // Azul
    'T-3': '#f39c12'  // Naranja
  };

  // useEffect para actualizar la visibilidad cuando sectionData cambia
  useEffect(() => {
    if (sectionData) {
      setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: true }), {}));
    }
  }, [sectionData]);

  return (
    <div className="estacion-control-tab-wrapper">
      <div style={{display: 'flex', minHeight: '600px', padding: '20px', gap: '20px', alignItems: 'stretch'}}>
        {/* MAPA principal - a la izquierda */}
        <div style={{flex: '3', display: 'flex', flexDirection: 'column'}}>
          <div style={{height: '500px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
            <ErrorBoundary>
              <MapContainer center={view.center} zoom={13} zoomControl={false} className="map-container-custom-controls" style={{height: '100%', width: '100%'}}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapViewController setView={setView} sectionData={sectionData} />
              {showTraffic && sectionData && Object.keys(sectionData).map(sectionId => {
                const section = sectionData[sectionId];
                const isSelected = selectedSection === sectionId;

                if (!visibility[sectionId] || !section.info.coordinates) {
                  return null;
                }

                return (
                  <Polyline
                    key={`${sectionId}-${isSelected}`}
                    positions={section.info.coordinates}
                    pathOptions={{
                      color: isSelected ? '#00FFFF' : (colors[sectionId] || '#3388ff'),
                      weight: 8,
                    }}
                    eventHandlers={{
                      click: (e) => {
                        handleSectionSelect(sectionId);
                      },
                      mouseover: (e) => {
                        e.target.openPopup();
                      },
                      mouseout: (e) => {
                        e.target.closePopup();
                      },
                    }}
                  >
                    <Popup>
                      Tramo: {section.info.nombre}<br/>
                      {section.info.imagenes && section.info.imagenes.filter(img => img.source_type === 'encuesta_velocidad_image').length > 0 && (() => {
                        const filteredImages = section.info.imagenes.filter(img => img.source_type === 'encuesta_velocidad_image');
                        const randomIndex = Math.floor(Math.random() * filteredImages.length);
                        const randomImage = filteredImages[randomIndex];
                        return (
                          <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            <img src={randomImage.image_url} alt={randomImage.description || 'Imagen del tramo'} style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                            <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{randomImage.description || 'Imagen'}</p>
                          </div>
                        );
                      })()}
                      <p style={{ fontSize: '0.9em', margin: '5px 0 0 0' }}>Ubicación: {section.info.ubicacion}</p>
                    </Popup>
                  </Polyline>
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
                  Tramos
                </h3>

              </div>
              <div className="stations-content">
                <div className="stations-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', overflowX: 'auto', paddingBottom: '10px', width: '100%', gap: '10px' }}>
                  {sectionData && Object.keys(sectionData).map((sectionId) => (
                    <div
                      key={sectionId}
                      className={`station-btn-large ${selectedSection === sectionId ? 'active' : ''}`}
                      onClick={() => handleSectionSelect(sectionId)}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        flex: '1 1 calc(33.33% - 10px)', // Make buttons take 33.33% of the width minus gap
                        maxWidth: 'calc(33.33% - 10px)', // Ensure they don't grow beyond 33.33% minus gap
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingBottom: '10px' // Add some padding at the bottom
                      }}
                    >
                      <div className="station-info" style={{ marginBottom: '10px' }}> {/* Add margin to separate from image */}
                        <strong>{sectionData[sectionId].info.id}</strong>
                        <small>{sectionData[sectionId].info.nombre}</small>
                      </div>


                      {sectionData[sectionId].info && sectionData[sectionId].info.imagenes && sectionData[sectionId].info.imagenes.filter(item => item.source_type === 'encuesta_velocidad_file').length > 0 && (() => {
                        const sortedItems = [...sectionData[sectionId].info.imagenes.filter(item => item.source_type === 'encuesta_velocidad_file')].sort((a, b) => {
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
          {selectedSection && (
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
                id="excelUploadVelocidad"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleExcelUpload}
              />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => document.getElementById('excelUploadVelocidad').click()}
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

          {velocidadPieData && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                Gráfico de Torta de Velocidad
              </h3>
              <Pie data={velocidadPieData} options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: chartTitles[selectedSection] || 'Distribución Porcentual de Velocidad',
                    font: { size: 16 }
                  },
                  datalabels: {
                    color: 'white',
                    formatter: (value, context) => {
                      return value > 0 ? `${value}%` : null;
                    }
                  },
                  percentageText: percentageTextPlugin
                },
              }} />
            </div>
          )}


        </div>

        <div style={{flex: '0.8', display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px'}}>
            <h3 onClick={() => setIsSectionDataVisible(!isSectionDataVisible)} style={{margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Tramo Datos</span>
              <i className={`fas fa-chevron-down accordion-icon ${isSectionDataVisible ? '' : 'collapsed'}`}></i>
            </h3>
            <CSSTransition
              nodeRef={sectionDataRef}
              in={isSectionDataVisible}
              timeout={500}
              classNames="accordion-content"
              unmountOnExit
            >
              <div ref={sectionDataRef}>
                {currentSectionData && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px'}}>
                    <div>
                      <strong>Nombre:</strong> {currentSectionData.info.nombre}
                    </div>
                    <div>
                      <strong>Ubicación:</strong> {currentSectionData.info.ubicacion}
                    </div>
                    <div>
                      <strong>Coordenadas:</strong> {currentSectionData.info.coordenadas}
                    </div>
                    <div>
                      <strong>Altitud:</strong> {currentSectionData.info.altitud} msnm
                    </div>
                    <div>
                      <strong>Descripción:</strong> {currentSectionData.info.descripcion}
                    </div>
                  </div>
                )}
              </div>
            </CSSTransition>
          </div>
                   {currentSectionData && (
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


      <ImageDisplayModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        imageUrl={imageToDisplay}
        isNavbarExpanded={isNavbarExpanded}
      />

      <UploadTrafficDataModal
        isOpen={isModalOpen}
        onClose={closeUploadModal}
        entityId={sectionIdToUpload}
        onUploadSuccess={handleUploadSuccess}
        uploadUrl="/api/trafico/encuestavelocidad/upload-file"
        entityIdName="sectionId"
        sourceTypeImage="encuesta_velocidad_image"
        sourceTypeFile="encuesta_velocidad_file"
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
              Cargando datos del tramo {currentSectionData ? currentSectionData.info.nombre : (selectedSection || '')}...
          </div>
      )}
    </div>
  );
};

export default ReportEncuestaVelocidadTab;
