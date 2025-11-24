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

const cu104Route = [
    { lat: -12.612858, lng: -72.537347, km: "0+000" },
    { lat: -12.6128389, lng: -72.5399268, km: "1+000" },
    { lat: -12.6089852, lng: -72.5357536, km: "2+000" },
    { lat: -12.6083169, lng: -72.5364748, km: "3+000" },
    { lat: -12.6028955, lng: -72.534466, km: "4+000" },
    { lat: -12.5985516, lng: -72.5335861, km: "5+000" },
    { lat: -12.5939207, lng: -72.5282134, km: "6+000" },
    { lat: -12.593865, lng: -72.5214706, km: "7+000" },
    { lat: -12.5925915, lng: -72.5207259, km: "8+000" },
    { lat: -12.5898242, lng: -72.5247351, km: "9+000" },
    { lat: -12.591443, lng: -72.5315981, km: "10+000" },
    { lat: -12.5934973, lng: -72.5397426, km: "11+000" },
    { lat: -12.5974475, lng: -72.5428666, km: "12+000" },
    { lat: -12.5899118, lng: -72.539525, km: "13+000" },
    { lat: -12.5825663, lng: -72.5371001, km: "14+000" },
    { lat: -12.5758135, lng: -72.5377089, km: "15+000" },
    { lat: -12.572673, lng: -72.5311406, km: "16+000" },
    { lat: -12.5695298, lng: -72.5256841, km: "17+000" },
    { lat: -12.5667794, lng: -72.5201656, km: "18+000" },
    { lat: -12.5635378, lng: -72.514829, km: "19+000" },
    { lat: -12.56835, lng: -72.5093612, km: "20+000" },
    { lat: -12.5706355, lng: -72.5031311, km: "21+000" },
    { lat: -12.5703763, lng: -72.4960299, km: "22+000" },
    { lat: -12.5696317, lng: -72.4922632, km: "23+000" },
    { lat: -12.5685319, lng: -72.4916131, km: "24+000" },
    { lat: -12.5652749, lng: -72.4966427, km: "25+000" },
    { lat: -12.5626558, lng: -72.503613, km: "26+000" },
    { lat: -12.5584166, lng: -72.5060608, km: "27+000" },
    { lat: -12.5536945, lng: -72.5071827, km: "28+000" },
    { lat: -12.5466313, lng: -72.5037707, km: "29+000" },
    { lat: -12.5419855, lng: -72.5017109, km: "30+000" },
    { lat: -12.5455844, lng: -72.5093845, km: "31+000" },
    { lat: -12.5476376, lng: -72.5162239, km: "32+000" },
    { lat: -12.5418581, lng: -72.5208138, km: "33+000" },
    { lat: -12.5355587, lng: -72.5197259, km: "34+000" },
    { lat: -12.5292673, lng: -72.5227035, km: "35+000" },
    { lat: -12.5247862, lng: -72.5186099, km: "36+000" },
    { lat: -12.5188822, lng: -72.5151722, km: "37+000" },
    { lat: -12.5191315, lng: -72.5075137, km: "38+000" },
    { lat: -12.5142591, lng: -72.5071781, km: "39+000" },
    { lat: -12.507766, lng: -72.5091767, km: "40+000" },
    { lat: -12.5018443, lng: -72.5073283, km: "41+000" },
    { lat: -12.501643, lng: -72.5011797, km: "42+000" },
    { lat: -12.496931, lng: -72.4998679, km: "43+000" },
    { lat: -12.4922451, lng: -72.5011361, km: "44+000" },
    { lat: -12.4896146, lng: -72.4959092, km: "45+000" },
    { lat: -12.4844038, lng: -72.4918644, km: "46+000" },
    { lat: -12.481086, lng: -72.4850861, km: "47+000" },
    { lat: -12.4770418, lng: -72.4859931, km: "48+000" },
    { lat: -12.475227, lng: -72.4897299, km: "49+000" },
    { lat: -12.4744654, lng: -72.4969444, km: "50+000" },
    { lat: -12.4701314, lng: -72.5006844, km: "51+000" },
    { lat: -12.4621015, lng: -72.5001575, km: "52+000" },
    { lat: -12.4593692, lng: -72.5011537, km: "53+000" },
    { lat: -12.4537329, lng: -72.4993379, km: "54+000" },
    { lat: -12.4560166, lng: -72.5014414, km: "55+000" },
    { lat: -12.453613, lng: -72.5013492, km: "56+000" },
    { lat: -12.4504718, lng: -72.4995831, km: "57+000" },
    { lat: -12.4491233, lng: -72.50009, km: "58+000" },
    { lat: -12.4496823, lng: -72.4957513, km: "59+000" },
    { lat: -12.4475225, lng: -72.5009065, km: "60+000" },
    { lat: -12.4471145, lng: -72.5012717, km: "61+000" },
    { lat: -12.4441252, lng: -72.4991176, km: "62+000" },
    { lat: -12.443348, lng: -72.4977381, km: "63+000" },
    { lat: -12.4473835, lng: -72.4927945, km: "64+000" },
    { lat: -12.4407357, lng: -72.4975957, km: "65+000" },
    { lat: -12.4392505, lng: -72.5010088, km: "66+000" },
    { lat: -12.437155, lng: -72.5008345, km: "67+000" },
    { lat: -12.4337139, lng: -72.5004675, km: "68+000" },
    { lat: -12.4341512, lng: -72.4991308, km: "69+000" },
    { lat: -12.4310916, lng: -72.5005384, km: "70+000" },
    { lat: -12.4335416, lng: -72.497612, km: "71+000" },
    { lat: -12.4376664, lng: -72.4931695, km: "72+000" },
    { lat: -12.4431788, lng: -72.4897023, km: "73+000" },
    { lat: -12.440658, lng: -72.486988, km: "74+000" },
    { lat: -12.440589, lng: -72.480397, km: "75+000" },
    { lat: -12.438189, lng: -72.476775, km: "76+000" },
    { lat: -12.438147, lng: -72.473756, km: "77+000" },
    { lat: -12.436236, lng: -72.466231, km: "78+000" },
    { lat: -12.433681, lng: -72.458950, km: "79+000" },
    { lat: -12.436028, lng: -72.451459, km: "80+000" },
    { lat: -12.433219, lng: -72.444902, km: "81+000" },
    { lat: -12.436690, lng: -72.439437, km: "82+000" },
    { lat: -12.438050, lng: -72.433138, km: "83+000" },
    { lat: -12.433770, lng: -72.426602, km: "84+000" },
    { lat: -12.436289, lng: -72.419530, km: "85+000" },
    { lat: -12.434893, lng: -72.411776, km: "86+000" },
    { lat: -12.434819, lng: -72.408721, km: "86+364.66" }
  ];

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
            const kmValue = kmMatch[1];
            const kmInMeters = parseKmToMeters(kmValue);

            let routePoint = null;
            let minDiff = Infinity;

            cu104Route.forEach(point => {
              const pointKmInMeters = parseKmToMeters(point.km);
              const diff = Math.abs(kmInMeters - pointKmInMeters);
              if (diff < minDiff) {
                minDiff = diff;
                routePoint = point;
              }
            });

    
            if (routePoint) {
              item.lat = routePoint.lat;
              item.lng = routePoint.lng;
            } else {
              console.warn('ADVERTENCIA: No se encontraron coordenadas para el km:', kmValue);
            }
          } else {
            console.warn('ADVERTENCIA: No se pudo extraer km de la ubicación:', item.ubicacion);
          }
          estaciones[item.id] = { info: item };
        } else if (item.tipo === 'tramo') {
          const kmRangeMatch = item.ubicacion.match(/(\d+\+\d+(?:\.\d+)?) .*? (\d+\+\d+(?:\.\d+)?)/);

          if (kmRangeMatch && kmRangeMatch[1] && kmRangeMatch[2]) {
            const startKmValue = kmRangeMatch[1];
            const endKmValue = kmRangeMatch[2];
            const startKmInMeters = parseKmToMeters(startKmValue);
            const endKmInMeters = parseKmToMeters(endKmValue);
           

            let startIndex = -1;
            let endIndex = -1;

            
            for (let i = 0; i < cu104Route.length; i++) {
              const pointKmInMeters = parseKmToMeters(cu104Route[i].km);
              if (pointKmInMeters >= startKmInMeters) {
                startIndex = i;
                break;
              }
            }

           
            for (let i = cu104Route.length - 1; i >= 0; i--) {
              const pointKmInMeters = parseKmToMeters(cu104Route[i].km);
              if (pointKmInMeters <= endKmInMeters) {
                endIndex = i;
                break;
              }
            }

           
            if (startIndex > 0 && parseKmToMeters(cu104Route[startIndex].km) > startKmInMeters) {
                startIndex--;
            }
            
            if (endIndex < cu104Route.length - 1 && parseKmToMeters(cu104Route[endIndex].km) < endKmInMeters) {
                endIndex++;
            }

            if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
              const tramoPoints = cu104Route.slice(startIndex, endIndex + 1).map(p => [p.lat, p.lng]);
              item.coordinates = tramoPoints;
              
            } else {
              console.warn('ADVERTENCIA: No se encontraron coordenadas para el tramo:', item.ubicacion);
            }
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            <MapOnlyDisplay
              cu104Route={cu104Route}
            />  
          </div>
        );
    }
  };

  const renderDataProcessingTabContent = () => {
    switch (activeDataProcessingTab) {
      case 'Conteo Vehicular':
        return (
          <ConteoVehicularTab
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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
            cu104Route={cu104Route}
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