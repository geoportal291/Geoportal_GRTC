import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../../../api/axios';
import './trafico.css';
import { usePageTitle } from '../../../contexts/PageTitleContext';
import { useTrafficOption } from '../../../../data/contexts/TrafficOptionContext'; // Importar useTrafficOption
import EstacionControlTab from './EstacionControlTab';
import MapOnlyDisplay from './MapOnlyDisplay';
// import RecoleccionDatosTab from './RecoleccionDatosTab';

import TramosHomogeneosTab from './TramosHomogeneosTab';
import FormatosRecoleccionTab from './FormatosRecoleccionTab';
import ConteoVehicularTab from './ConteoVehicularTab';
import DataVisualizationTab from './DataVisualizationTab';
import CensoDeCargasTab from './CensoDeCargasTab';
import EncuestaOrigenDestinoTab from './EncuestaOrigenDestinoTab';
import DataAnalysisTab from './EncuestadeVelocidadTab';
import ReportsTab from './ReportsTab';
import ReportConteoVehicularTab from './ReportConteoVehicularTab';
import ReportEncuestaOrigenDestinoTab from './ReportEncuestaOrigenDestinoTab';
import ReportCensoDeCargasTab from './ReportCensoDeCargasTab';
import ReportEncuestaVelocidadTab from './ReportEncuestaVelocidadTab';
import ReporteEjesEquivalentesTab from './ReporteEjesEquivalentesTab';

import { useAuth } from '../../../../data/contexts/AuthContext';
import { logAuditEvent } from '../../../../api/audit';


const Traficods = ({ isNavbarExpanded }) => {
  const headerOption = useTrafficOption(); // Consume from context
  const { user, selectedProjectId } = useAuth(); 

  const { setPageTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState('Estacion de control');
  const [activeDataProcessingTab, setActiveDataProcessingTab] = useState(null);

  useEffect(() => {
    if (headerOption === 'resumen') {
      setActiveTab('Estacion de control'); // Reset to default for 'resumen'
    } else if (headerOption === 'opcion2' || headerOption === 'opcion3') {
      setActiveDataProcessingTab('Conteo Vehicular'); // Reset to default for 'opcion2' and 'opcion3'
    }
  }, [headerOption]); // Run this effect whenever headerOption changes
  const [selectedStation, setSelectedStation] = useState("E-01");
  const [selectedSection, setSelectedSection] = useState('T-1');
  const [showRoute, setShowRoute] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [stationData, setStationData] = useState({});
  const [sectionData, setSectionData] = useState({});
  const [isLoadingImages, setIsLoadingImages] = useState(false); 

  const parseKmToMeters = useCallback((kmString) => {
    if (!kmString) return null;
    const parts = kmString.replace(' km', '').split('+');
    const kilometers = parseFloat(parts[0] || 0);
    const meters = parseFloat(parts[1] || 0);
    return kilometers * 1000 + meters;
  }, []);

  const tramosCoordinates = {};

  const fetchTraficoData = useCallback(async () => {
    console.log('fetchTraficoData se está ejecutando...'); // Añadido para depuración
    if (!user || !user.token || !selectedProjectId) {
        console.warn('Usuario no autenticado, token no disponible o proyecto no seleccionado. No se cargarán los datos de tráfico.');
        setIsLoadingImages(false);
        return;
    }
    setIsLoadingImages(true);
    try {
      const response = await axiosInstance.get(`/api/elementos-trafico?proyectoId=${selectedProjectId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
   
      const estaciones = {};
      const tramos = {};
      response.data.forEach(item => {
       
        if (item.tipo === 'estacion') {
          const kmMatch = item.ubicacion.match(/(\d+\+\d+(\.\d+)?)/);

          if (kmMatch && kmMatch[1]) {
            // Se asumen coordenadas fijas en item (si existieran en la DB) o se dependerá del KML para geo-referenciación visual.
            // La lógica anterior dependía de cu104Route para interpolar lat/lng.
          } else {
            console.warn('ADVERTENCIA: No se pudo extraer km de la ubicación:', item.ubicacion);
          }
          estaciones[item.id] = { info: item };
        } else if (item.tipo === 'tramo') {
          const kmRangeMatch = item.ubicacion.match(/(\d+\+\d+(?:\.\d+)?) .*? (\d+\+\d+(?:\.\d+)?)/);

          if (kmRangeMatch && kmRangeMatch[1] && kmRangeMatch[2]) {
             // La lógica anterior calculaba item.coordinates basándose en cu104Route.
             // Al eliminar cu104Route, los tramos dependerán de su representación en el KML.
          } else {
            console.warn('ADVERTENCIA: No se pudo extraer rango de km de la ubicación del tramo:', item.ubicacion);
          }
          tramos[item.id] = { info: item };
        }
      });
            setStationData(estaciones);
            setSectionData(tramos);
            console.log('Datos de tramos cargados:', tramos); // Añadido para depuración
            console.log('Tramo seleccionado:', selectedSection); // Añadido para depuración
          } catch (error) {
            console.error('Error fetching trafico data:', error);
          } finally {
            setIsLoadingImages(false);
          }
        }, [user, selectedProjectId, parseKmToMeters, selectedSection]);
  useEffect(() => {
    setPageTitle('Área de Tráfico');
    if (selectedProjectId) {
      fetchTraficoData();
    }
  }, [selectedProjectId, fetchTraficoData]);

  
  useEffect(() => {
    if (Object.keys(stationData).length > 0 && !selectedStation) {
      setSelectedStation(Object.keys(stationData)[0]);
    }
  }, [stationData, selectedStation]);


  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Estacion de control':
        return (
          <EstacionControlTab
            projectId={selectedProjectId}
            stationData={stationData}
            selectedStation={selectedStation}
            handleStationSelect={handleStationSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshStationData={fetchTraficoData}
            setIsLoadingImages={setIsLoadingImages} 
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Tramos homogeneos':
        return (
          <TramosHomogeneosTab
            projectId={selectedProjectId}
            sectionData={sectionData}
            selectedSection={selectedSection}
            handleSectionSelect={handleSectionSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshData={fetchTraficoData}
            isLoadingImages={isLoadingImages} 
            setIsLoadingImages={setIsLoadingImages} 
            isNavbarExpanded={isNavbarExpanded} 
          />
        );
      case 'Formatos de recoleccion de datos':
        return <FormatosRecoleccionTab />;
      default:
        return (
          <div className="map-container-full-width">
            <MapOnlyDisplay />
          </div>
        );
    }
  };

  const renderDataProcessingTabContent = () => {
    switch (activeDataProcessingTab) {
      case 'Conteo Vehicular':
        return (
          <ConteoVehicularTab
            projectId={selectedProjectId}
            stationData={stationData}
            selectedStation={selectedStation}
            handleStationSelect={handleStationSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshStationData={fetchTraficoData}
            setIsLoadingImages={setIsLoadingImages}
            isLoadingImages={isLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Encuesta de Origen/Destino':
        return (
          <EncuestaOrigenDestinoTab
            projectId={selectedProjectId}
            stationData={stationData}
            selectedStation={selectedStation}
            handleStationSelect={handleStationSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshStationData={fetchTraficoData}
            setIsLoadingImages={setIsLoadingImages}
            isLoadingImages={isLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Censo De Cargas':
        return (
          <CensoDeCargasTab
            projectId={selectedProjectId}
            stationData={stationData}
            selectedStation={selectedStation}
            handleStationSelect={handleStationSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshStationData={fetchTraficoData}
            setIsLoadingImages={setIsLoadingImages}
            isLoadingImages={isLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Encuesta de velocidad':
        return (
          <DataAnalysisTab
            projectId={selectedProjectId}
            sectionData={sectionData}
            selectedSection={selectedSection}
            handleSectionSelect={handleSectionSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshData={fetchTraficoData}
            isLoadingImages={isLoadingImages}
            setIsLoadingImages={setIsLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      default:
        return null; // Componente RecoleccionDatosTab deshabilitado temporalmente
    }
  };

  const renderReportTabContent = () => {
    switch (activeDataProcessingTab) {
      case 'Conteo Vehicular':
        return (
          <ReportConteoVehicularTab
            projectId={selectedProjectId}
            stationData={stationData}
            selectedStation={selectedStation}
            handleStationSelect={handleStationSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshStationData={fetchTraficoData}
            setIsLoadingImages={setIsLoadingImages}
            isLoadingImages={isLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Encuesta de Origen/Destino':
        return (
          <ReportEncuestaOrigenDestinoTab
            projectId={selectedProjectId}
            stationData={stationData}
            selectedStation={selectedStation}
            handleStationSelect={handleStationSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshStationData={fetchTraficoData}
            setIsLoadingImages={setIsLoadingImages}
            isLoadingImages={isLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Censo De Cargas':
        return (
          <ReportCensoDeCargasTab
            projectId={selectedProjectId}
            stationData={stationData}
            selectedStation={selectedStation}
            handleStationSelect={handleStationSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshStationData={fetchTraficoData}
            setIsLoadingImages={setIsLoadingImages}
            isLoadingImages={isLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Encuesta de velocidad':
        return (
          <ReportEncuestaVelocidadTab
            projectId={selectedProjectId}
            sectionData={sectionData}
            selectedSection={selectedSection}
            handleSectionSelect={handleSectionSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshData={fetchTraficoData}
            isLoadingImages={isLoadingImages}
            setIsLoadingImages={setIsLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      case 'Ejes Equivalentes':
        return (
          <ReporteEjesEquivalentesTab
            projectId={selectedProjectId}
            sectionData={sectionData} // <-- Corregido: ahora pasa sectionData
            selectedSection={selectedSection}
            handleSectionSelect={handleSectionSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            refreshData={fetchTraficoData} // <-- refreshData en lugar de refreshStationData
            setIsLoadingImages={setIsLoadingImages}
            isLoadingImages={isLoadingImages}
            isNavbarExpanded={isNavbarExpanded}
          />
        );
      default:
        return null;
    }
  };

  const renderContent = () => {

    if (headerOption === 'resumen') {

      return (
        <>
          <div className="tabs">
            <button
              className={activeTab === 'Estacion de control' ? 'active' : ''}
              onClick={() => {
                setActiveTab('Estacion de control');
                logAuditEvent('TRAFICO_TAB_CLICK', { tab: 'Estacion de control', headerOption: headerOption });
              }}
            >
              Estación de control
            </button>
            <button
              className={activeTab === 'Tramos homogeneos' ? 'active' : ''}
              onClick={() => {
                setActiveTab('Tramos homogeneos');
                logAuditEvent('TRAFICO_TAB_CLICK', { tab: 'Tramos homogeneos', headerOption: headerOption });
              }}
            >
              Tramos homogéneos
            </button>
            <button
              className={activeTab === 'Formatos de recoleccion de datos' ? 'active' : ''}
              onClick={() => {
                setActiveTab('Formatos de recoleccion de datos');
                logAuditEvent('TRAFICO_TAB_CLICK', { tab: 'Formatos de recoleccion de datos', headerOption: headerOption });
              }}
            >
              Formatos de recolección de datos
            </button>
          </div>

          <div className="tab-content-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflowY: 'auto' }}>
            {renderTabContent()}
          </div>
        </>
      );
    } else if (headerOption === 'opcion2') {
      return (
        <>
          <div className="tabs">
            <button
              className={activeDataProcessingTab === 'Conteo Vehicular' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Conteo Vehicular')}
            >
              Conteo Vehicular
            </button>
            <button
              className={activeDataProcessingTab === 'Encuesta de Origen/Destino' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Encuesta de Origen/Destino')}
            >
              Encuesta de Origen/Destino
            </button>
            <button
              className={activeDataProcessingTab === 'Censo De Cargas' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Censo De Cargas')}
            >
              Censo De Cargas 
            </button>
            <button
              className={activeDataProcessingTab === 'Encuesta de velocidad' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Encuesta de velocidad')}
            >
              Encuesta de velocidad
            </button>
          </div>

          <div className="tab-content-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflowY: 'auto' }}>
            {renderDataProcessingTabContent()}
          </div>
        </>
      );
    }
    else if (headerOption === 'opcion3') {
      return (
        <>
          <div className="tabs">
            <button
              className={activeDataProcessingTab === 'Conteo Vehicular' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Conteo Vehicular')}
            >
              Conteo Vehicular
            </button>
            <button
              className={activeDataProcessingTab === 'Encuesta de Origen/Destino' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Encuesta de Origen/Destino')}
            >
              Encuesta de Origen/Destino
            </button>
            <button
              className={activeDataProcessingTab === 'Censo De Cargas' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Censo De Cargas')}
            >
              Censo De Cargas 
            </button>
            <button
              className={activeDataProcessingTab === 'Encuesta de velocidad' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Encuesta de velocidad')}
            >
              Encuesta de velocidad
            </button>
            <button
              className={activeDataProcessingTab === 'Ejes Equivalentes' ? 'active' : ''}
              onClick={() => setActiveDataProcessingTab('Ejes Equivalentes')}
            >
              Ejes Equivalentes
            </button>
          </div>

          <div className="tab-content-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflowY: 'auto' }}>
            {renderReportTabContent()}
          </div>
        </>
      );
    }
  };
return (
  <div className="trafico-container">
    {isLoadingImages ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '20px' }}>
        Cargando datos de tráfico...
      </div>
    ) : Object.keys(stationData).length === 0 && Object.keys(sectionData).length === 0 ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '20px' }}>
        No hay datos de tráfico para este proyecto. Por favor, solicite la carga de datos.
      </div>
    ) : (
      renderContent()
    )}
  </div>
);
}
export default Traficods;