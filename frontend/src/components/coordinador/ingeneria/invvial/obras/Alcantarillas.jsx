import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CSSTransition } from 'react-transition-group';
import './Alcantarillas.css';
import Geoite from '../map/geoite';
import '../map/geoite.css';
import ListaAlcantarillasModal from './ListaAlcantarillasModal';
import ExportarMapaModal from './ExportarMapaModal';
import axiosInstance from '../../../../../api/axios';
import { saveAs } from 'file-saver';

// Estructura de datos de ejemplo
const tramoData = {
  'TRAMO 1': {
    id: 'TRAMO 1',
    elements: [
      // Dejamos esto para referencia futura, pero la lógica ahora simula un solo elemento
    ]
  },
  'TRAMO 2': {
    id: 'TRAMO 2',
    elements: []
  },
  'TRAMO 3': {
    id: 'TRAMO 3',
    elements: []
  }
};

const Alcantarillas = ({ onEditElementSelect, alcantarillasData, graphicsImages, canUpload, showModal }) => {

  const [highlightedTramoId, setHighlightedTramoId] = useState('TRAMO 1');
  const [kmlRoute, setKmlRoute] = useState([]); // Estado para la ruta del KML
  const [selectedTramo, setSelectedTramo] = useState(null);
  const [isInfoVisible, setIsInfoVisible] = useState(true);
  const [isGeneralInfoVisible, setIsGeneralInfoVisible] = useState(true); // Nuevo estado para el panel de información general
  const [isElementVisible, setIsElementVisible] = useState({}); // Estado para el acordeón de cada elemento
  const [selectedAlcantarilla, setSelectedAlcantarilla] = useState(null); // Nuevo estado para la alcantarilla seleccionada
  const [alcantarillaImages, setAlcantarillaImages] = useState([]); // NEW: State for filtered images
  const [alcantarillasWithImages, setAlcantarillasWithImages] = useState([]); // NEW: State to hold alcantarillas with their images
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [showListModal, setShowListModal] = useState(false);
  const infoRef = useRef(null);
  const generalInfoRef = useRef(null); // Nueva referencia para el panel de información general

  useEffect(() => {
    if (selectedAlcantarilla && selectedAlcantarilla.panel_fotografico_codigo && graphicsImages) {
      const code = selectedAlcantarilla.panel_fotografico_codigo;
      const parts = code.split(' - ');
      const rangePart = parts[0];
      const suffix = parts.length > 1 ? `-${parts[1]}` : '';

      const [startStr, endStr] = rangePart.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const expectedNames = [];
        for (let i = start; i <= end; i++) {
          expectedNames.push(`${i}${suffix}`);
        }

        const filtered = graphicsImages.filter(img => {
          const imgNameWithoutExt = img.index.split('.')[0];
          return expectedNames.includes(imgNameWithoutExt);
        });
        setAlcantarillaImages(filtered);
      } else {
        setAlcantarillaImages([]);
      }
    } else {
      setAlcantarillaImages([]);
    }
  }, [selectedAlcantarilla, graphicsImages]);

  useEffect(() => {
    if (alcantarillasData.length > 0 && graphicsImages.length > 0) {
      const processedAlcantarillas = alcantarillasData.map(alcantarilla => {
        const code = alcantarilla.panel_fotografico_codigo;
        let imageUrls = [];

        if (code) {
          const parts = code.split(' - ');
          const rangePart = parts[0];
          const suffix = parts.length > 1 ? `-${parts[1]}` : '';

          const [startStr, endStr] = rangePart.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);

          if (!isNaN(start) && !isNaN(end)) {
            const expectedNames = [];
            for (let i = start; i <= end; i++) {
              expectedNames.push(`${i}${suffix}`);
            }

            const foundImages = graphicsImages.filter(img => {
              const imgNameWithoutExt = img.index.split('.')[0];
              return expectedNames.includes(imgNameWithoutExt);
            });

            if (foundImages.length > 0) {
              imageUrls = foundImages.map(img => `${img.url}?v=${img.id}`);
            }
          }
        }
        return { ...alcantarilla, imageUrls: imageUrls, type: 'alcantarilla' };
      });
      setAlcantarillasWithImages(processedAlcantarillas);
    } else {
      setAlcantarillasWithImages(alcantarillasData.map(alcantarilla => ({ ...alcantarilla, imageUrls: [], type: 'alcantarilla' })));
    }
  }, [alcantarillasData, graphicsImages]);

  useEffect(() => {
    if (highlightedTramoId && tramoData[highlightedTramoId]) {
      setSelectedTramo(tramoData[highlightedTramoId]);
    }
  }, [highlightedTramoId]);

  const handleTramoSelectFromMap = (properties) => {
    if (properties && properties.id && tramoData[properties.id]) {
      setHighlightedTramoId(properties.id);
    }
  };

  const handleEditElement = (element) => {
    if (onEditElementSelect) {
      onEditElementSelect(element);
    }
  };

  const toggleElementVisibility = (elementId) => {
    setIsElementVisible(prevState => ({
      ...prevState,
      [elementId]: !prevState[elementId]
    }));
  };

  const [initialSelectedAlcantarilla, setInitialSelectedAlcantarilla] = useState(null); // Nuevo estado para pasar al modal

  const handleAlcantarillaClick = useCallback((alcantarilla) => {
    setSelectedAlcantarilla(alcantarilla);
    setIsInfoVisible(true); // Asegurarse de que el panel de información esté visible
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      title: 'Alcantarilla Seleccionada',
      text: `Se seleccionó la alcantarilla: ${alcantarilla.codigo || alcantarilla.id_alcantarilla}`,
      icon: 'success'
    });
  }, []);

  const handleShowDetails = useCallback((alcantarilla) => {
    setInitialSelectedAlcantarilla(alcantarilla);
    setShowListModal(true);
  }, []);

  // --- Export Logic ---
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = async (selectedItems, format) => {
    if (selectedItems.length === 0) {
      Swal.fire('Error', 'No hay elementos seleccionados para exportar.', 'error');
      return;
    }

    // 1. Convert selected items (Alcantarillas) to GeoJSON Point features
    const pointFeatures = selectedItems.map(item => {
      // Create HTML table for description
      const descriptionTable = `
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Progresiva</th><td style="padding: 5px;">${item.prog_ini || '-'}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Código</th><td style="padding: 5px;">${item.codigo || item.id_alcantarilla}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Clase</th><td style="padding: 5px;">${item.clase || '-'}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Tipo</th><td style="padding: 5px;">${item.tipo || '-'}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Estado</th><td style="padding: 5px;">${item.estado || '-'}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Longitud</th><td style="padding: 5px;">${item.longitud_alcantarilla || '-'}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Diámetro/Sección</th><td style="padding: 5px;">${item.diametro_lado || '-'}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Coordenadas</th><td style="padding: 5px;">${item.latitud.toFixed(6)}, ${item.longitud.toFixed(6)}</td></tr>
          <tr><th style="background-color: #f2f2f2; padding: 5px;">Observaciones</th><td style="padding: 5px;">${item.observaciones || '-'}</td></tr>
        </table>
      `;

      return {
        type: 'Feature',
        properties: {
          name: item.codigo || `Alcantarilla ${item.id_alcantarilla}`,
          description: descriptionTable, // Use HTML table for KML description
          ...item // Keep raw properties for Shapefile attributes
        },
        geometry: {
          type: 'Point',
          coordinates: [item.longitud, item.latitud]
        }
      };
    }).filter(f => f.geometry.coordinates[0] && f.geometry.coordinates[1]);

    // 2. Get Route features (if available)
    let routeFeatures = [];
    if (kmlRoute && kmlRoute.features) {
      routeFeatures = kmlRoute.features;
    } else if (kmlRoute && kmlRoute.type === 'FeatureCollection') {
      routeFeatures = kmlRoute.features;
    } else if (Array.isArray(kmlRoute)) {
      routeFeatures = kmlRoute;
    }

    // 3. Combine all features
    const allFeatures = [...pointFeatures, ...routeFeatures];

    const geoJsonData = {
      type: 'FeatureCollection',
      features: allFeatures
    };

    try {
      Swal.fire({
        title: 'Exportando...',
        text: 'Por favor espere.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const endpoint = format === 'kml' ? '/api/trafico/exportar-kml' : '/api/trafico/exportar-shapefile';
      const response = await axiosInstance.post(endpoint, geoJsonData, {
        responseType: 'blob'
      });

      const extension = format === 'kml' ? 'kml' : 'zip';
      saveAs(response.data, `alcantarillas_export.${extension}`);

      Swal.close();
      Swal.fire('Éxito', 'Exportación completada correctamente.', 'success');
      setShowExportModal(false);

    } catch (error) {
      console.error('Error exporting:', error);
      Swal.fire('Error', 'Ocurrió un error durante la exportación.', 'error');
    }
  };

  return (
    <div className="alcantarillas-tab-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, height: '100%' }}>        {/* Columna del Mapa - Izquierda */}
        <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <Geoite onTramoSelect={handleTramoSelectFromMap} highlightedTramoId={highlightedTramoId} alcantarillasData={alcantarillasWithImages} onAlcantarillaClick={handleAlcantarillaClick} selectedAlcantarilla={selectedAlcantarilla} onRouteLoaded={setKmlRoute} onShowDetails={handleShowDetails} />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {canUpload && (
              <div onClick={() => { if (showModal) showModal(true); }} style={{ display: 'inline-block' }}>
                <button style={{ backgroundColor: 'green', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Subir Datos</button>
              </div>
            )}
            <div onClick={() => setShowListModal(true)} style={{ display: 'inline-block' }}>
              <button style={{ backgroundColor: '#007bff', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Mostrar Alcantarillas</button>
            </div>
            <div onClick={() => setShowExportModal(true)} style={{ display: 'inline-block' }}>
              <button style={{ backgroundColor: '#6c757d', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Exportar Mapa</button>
            </div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <h3 style={{
                fontSize: '1.1em',
                fontWeight: 600,
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: 0
              }}>
                <i className="fas fa-road" style={{ color: '#3b82f6' }}></i>
                Tramos
              </h3>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px'
            }}>
              {
                Object.keys(tramoData).map(tramoId => {
                  const tramo = tramoData[tramoId];
                  const ranges = { 'TRAMO 1': '0+00 - 34+00', 'TRAMO 2': '34+00 - 66+00', 'TRAMO 3': '66+00 - 86+500' };
                  const isActive = highlightedTramoId === tramo.id;

                  const baseButtonStyle = {
                    padding: '15px',
                    border: 'none',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    flex: '1 1 calc(33.33% - 10px)',
                    maxWidth: 'calc(33.33% - 10px)',
                    minWidth: '150px'
                  };

                  const activeButtonStyle = {
                    backgroundColor: '#3498db',
                    color: 'white'
                  };

                  const buttonStyle = isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle;

                  const topTextStyle = {
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'block'
                  };

                  const bottomTextStyle = {
                    fontSize: '12px',
                    opacity: isActive ? 0.9 : 0.8,
                    display: 'block'
                  };

                  return (
                    <div key={tramo.id} style={buttonStyle} onClick={() => setHighlightedTramoId(tramo.id)}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={topTextStyle}>{tramo.id.replace('TRAMO ', 'T-')}</strong>
                        <small style={bottomTextStyle}>{ranges[tramo.id]}</small>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>

        {/* Columna de Información - Derecha */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

          {/* Panel de InformaciÃ³n */}
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Información de la Alcantarilla</span>
              <i className={`fas fa-chevron-down accordion-icon ${isInfoVisible ? '' : 'collapsed'}`}></i>
            </h3>
            <CSSTransition
              nodeRef={infoRef}
              in={isInfoVisible}
              timeout={500}
              classNames="accordion-content"
              unmountOnExit
            >
              <div ref={infoRef}>
                {selectedAlcantarilla ? (
                  <div>
                    <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detalles de la Alcantarilla</h4>
                    <div>
                      <div style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        fontSize: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ padding: '12px' }}>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Progresiva:</strong> {selectedAlcantarilla.progresiva || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>N de alcantarilla:</strong> {selectedAlcantarilla.codigo || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Clase:</strong> {selectedAlcantarilla.clase || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Tipo:</strong> {selectedAlcantarilla.tipo || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Estado:</strong> {selectedAlcantarilla.estado || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Longitud:</strong> {selectedAlcantarilla.longitud_alcantarilla || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Diámetro / Sección:</strong> {selectedAlcantarilla.diametro_lado || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Coordenadas:</strong> {selectedAlcantarilla.latitud.toFixed(6)}, {selectedAlcantarilla.longitud.toFixed(6)}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Observaciones:</strong> {selectedAlcantarilla.observaciones || 'datos sin encontrar'}</p>
                          <p style={{ margin: '0 0 5px 0' }}><strong>Código de Panel Fotográfico:</strong> {selectedAlcantarilla.panel_fotografico_codigo || 'datos sin encontrar'}</p>
                          <button
                            onClick={() => handleEditElement(selectedAlcantarilla)}
                            style={{
                              marginTop: '10px',
                              padding: '8px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '0.9em'
                            }}
                          >
                            Editar Elemento
                          </button>
                        </div>
                      </div>
                    </div>
                    {alcantarillaImages.length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <h5 style={{ marginBottom: '10px' }}>Imágenes de Panel Fotográfico</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {alcantarillaImages.map(img => (
                            <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                              <img
                                src={`${img.url}?v=${img.id}`}
                                alt={`Imagen ${img.index}`}
                                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }}
                              />
                              <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{img.index}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Seleccione una alcantarilla en el mapa para ver sus detalles.</p>
                )}
              </div>
            </CSSTransition>
          </div>



        </div>
      </div>
      {isPreviewModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10002,
        }}>
          <img src={previewImageUrl} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
          <button onClick={() => setIsPreviewModalOpen(false)} style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#333',
          }}>&times;</button>
        </div>
      )}
      <ListaAlcantarillasModal
        show={showListModal}
        onClose={() => setShowListModal(false)}
        alcantarillasData={alcantarillasWithImages} // Usar alcantarillasWithImages para pasar también las URLs de las imágenes
        route={kmlRoute} // Pasar la ruta del KML al modal de lista
        graphicsImages={graphicsImages} // Pasar la lista completa de imágenes gráficas
        initialSelectedAlcantarilla={initialSelectedAlcantarilla} // Pasar la alcantarilla seleccionada inicialmente
      />
      <ExportarMapaModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={alcantarillasData}
        type="alcantarillas"
        onExport={handleExport}
      />
    </div>
  );
};

export default Alcantarillas;