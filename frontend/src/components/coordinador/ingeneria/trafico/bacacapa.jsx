/*import React, { useEffect, useState } from 'react';
import './trafico.css';
import { usePageTitle } from '../../../contexts/PageTitleContext';
import EstacionControlTab from './EstacionControlTab';
import TramosHomogeneosTab from './TramosHomogeneosTab';
import FormatosRecoleccionTab from './FormatosRecoleccionTab';

const Traficods = ({ headerOption = 'resumen' }) => {
  const { setPageTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState('Estacion de control');
  const [selectedStation, setSelectedStation] = useState('E1');
  const [selectedSection, setSelectedSection] = useState('T-1');
  const [showRoute, setShowRoute] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);

  useEffect(() => {
    setPageTitle('Área de Tráfico');
  }, [setPageTitle]);

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

  const stationData = {
    E1: {
      info: { nombre: "Estación E1", descripcion: "Estación de control principal ubicada en el acceso norte", ubicacion: "KM 0+500 - Av. Principal Norte", coordenadas: "12°02'45\"S, 77°02'30\"W", fechaInstalacion: "15/01/2024", estado: "Activo" },
      fotos: ["https://via.placeholder.com/200x150/3498db/fff?text=E1-Foto1", "https://via.placeholder.com/200x150/2980b9/fff?text=E1-Foto2", "https://via.placeholder.com/200x150/27ae60/fff?text=E1-Foto3", "https://via.placeholder.com/200x150/f39c12/fff?text=E1-Foto4"],
      resultados: { vehiculosDia: "1,250", velocidadPromedio: "45 km/h", horasPico: "7:00-9:00 AM, 5:00-7:00 PM", nivelServicio: "B", ultimaActualizacion: "Hace 2 horas" }
    },
    E2: {
        info: { nombre: "Estación E2", descripcion: "Estación secundaria en zona comercial central", ubicacion: "KM 3+200 - Jr. Comercio", coordenadas: "12°03'15\"S, 77°02'45\"W", fechaInstalacion: "20/01/2024", estado: "Activo" },
        fotos: ["https://via.placeholder.com/200x150/e74c3c/fff?text=E2-Foto1", "https://via.placeholder.com/200x150/9b59b6/fff?text=E2-Foto2", "https://via.placeholder.com/200x150/34495e/fff?text=E2-Foto3", "https://via.placeholder.com/200x150/16a085/fff?text=E2-Foto4"],
        resultados: { vehiculosDia: "890", velocidadPromedio: "38 km/h", horasPico: "8:00-10:00 AM, 6:00-8:00 PM", nivelServicio: "C", ultimaActualizacion: "Hace 1 hora" }
    },
    E3: {
        info: { nombre: "Estación E3", descripcion: "Estación de monitoreo en zona residencial", ubicacion: "KM 6+800 - Av. Residencial Sur", coordenadas: "12°04'20\"S, 77°03'10\"W", fechaInstalacion: "25/01/2024", estado: "Mantenimiento" },
        fotos: ["https://via.placeholder.com/200x150/f1c40f/fff?text=E3-Foto1", "https://via.placeholder.com/200x150/e67e22/fff?text=E3-Foto2", "https://via.placeholder.com/200x150/95a5a6/fff?text=E3-Foto3", "https://via.placeholder.com/200x150/2c3e50/fff?text=E3-Foto4"],
        resultados: { vehiculosDia: "2,100", velocidadPromedio: "52 km/h", horasPico: "6:30-8:30 AM, 4:30-6:30 PM", nivelServicio: "A", ultimaActualizacion: "Hace 4 horas" }
    },
    E4: {
        info: { nombre: "Estación E4", descripcion: "Estación de control en salida sur de la ciudad", ubicacion: "KM 12+500 - Carretera Panamericana Sur", coordenadas: "12°05'30\"S, 77°03'45\"W", fechaInstalacion: "30/01/2024", estado: "Activo" },
        fotos: ["https://via.placeholder.com/200x150/8e44ad/fff?text=E4-Foto1", "https://via.placeholder.com/200x150/d35400/fff?text=E4-Foto2", "https://via.placeholder.com/200x150/27ae60/fff?text=E4-Foto3", "https://via.placeholder.com/200x150/3498db/fff?text=E4-Foto4"],
        resultados: { vehiculosDia: "1,680", velocidadPromedio: "48 km/h", horasPico: "7:30-9:30 AM, 5:30-7:30 PM", nivelServicio: "B", ultimaActualizacion: "Hace 30 min" }
    }
  };

  const sectionData = {
    'T-1': {
      info: { nombre: "Tramo T-1", descripcion: "Tramo homogéneo en zona urbana norte", ubicacion: "KM 0+000 - KM 5+000", coordenadas: "12°02'45\"S, 77°02'30\"W", fechaInstalacion: "15/01/2024", estado: "Activo" },
      fotos: ["https://via.placeholder.com/200x150/3498db/fff?text=T1-Foto1", "https://via.placeholder.com/200x150/2980b9/fff?text=T1-Foto2", "https://via.placeholder.com/200x150/27ae60/fff?text=T1-Foto3", "https://via.placeholder.com/200x150/f39c12/fff?text=T1-Foto4"],
      resultados: { vehiculosDia: "1,250", velocidadPromedio: "45 km/h", horasPico: "7:00-9:00 AM, 5:00-7:00 PM", nivelServicio: "B", ultimaActualizacion: "Hace 2 horas" }
    },
    'T-2': {
        info: { nombre: "Tramo T-2", descripcion: "Tramo homogéneo en zona comercial central", ubicacion: "KM 5+000 - KM 10+000", coordenadas: "12°03'15\"S, 77°02'45\"W", fechaInstalacion: "20/01/2024", estado: "Activo" },
        fotos: ["https://via.placeholder.com/200x150/e74c3c/fff?text=T2-Foto1", "https://via.placeholder.com/200x150/9b59b6/fff?text=T2-Foto2", "https://via.placeholder.com/200x150/34495e/fff?text=T2-Foto3", "https://via.placeholder.com/200x150/16a085/fff?text=T2-Foto4"],
        resultados: { vehiculosDia: "890", velocidadPromedio: "38 km/h", horasPico: "8:00-10:00 AM, 6:00-8:00 PM", nivelServicio: "C", ultimaActualizacion: "Hace 1 hora" }
    },
    'T-3': {
        info: { nombre: "Tramo T-3", descripcion: "Tramo homogéneo en zona residencial", ubicacion: "KM 10+000 - KM 15+000", coordenadas: "12°04'20\"S, 77°03'10\"W", fechaInstalacion: "25/01/2024", estado: "Activo" },
        fotos: ["https://via.placeholder.com/200x150/f1c40f/fff?text=T3-Foto1", "https://via.placeholder.com/200x150/e67e22/fff?text=T3-Foto2", "https://via.placeholder.com/200x150/95a5a6/fff?text=T3-Foto3", "https://via.placeholder.com/200x150/2c3e50/fff?text=T3-Foto4"],
        resultados: { vehiculosDia: "2,100", velocidadPromedio: "52 km/h", horasPico: "6:30-8:30 AM, 4:30-6:30 PM", nivelServicio: "A", ultimaActualizacion: "Hace 4 horas" }
    },
    'TMB': {
        info: { nombre: "Tramo TMB", descripcion: "Tramo homogéneo en zona mixta baja", ubicacion: "KM 15+000 - KM 20+000", coordenadas: "12°05'30\"S, 77°03'45\"W", fechaInstalacion: "30/01/2024", estado: "Activo" },
        fotos: ["https://via.placeholder.com/200x150/8e44ad/fff?text=TMB-Foto1", "https://via.placeholder.com/200x150/d35400/fff?text=TMB-Foto2", "https://via.placeholder.com/200x150/27ae60/fff?text=TMB-Foto3", "https://via.placeholder.com/200x150/3498db/fff?text=TMB-Foto4"],
        resultados: { vehiculosDia: "1,680", velocidadPromedio: "48 km/h", horasPico: "7:30-9:30 AM, 5:30-7:30 PM", nivelServicio: "B", ultimaActualizacion: "Hace 30 min" }
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
  };

  const tramosCoordinates = {
    'T-1': cu104Route.slice(0, 29),
    'T-2': cu104Route.slice(28, 58),
    'T-3': cu104Route.slice(57, 87),
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
          />
        );
      case 'Tramos homogeneos':
        return (
          <TramosHomogeneosTab
            cu104Route={cu104Route}
            tramosCoordinates={tramosCoordinates}
            sectionData={sectionData}
            selectedSection={selectedSection}
            handleSectionSelect={handleSectionSelect}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
          />
        );
      case 'Formatos de recoleccion de datos':
        return <FormatosRecoleccionTab />;
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
              onClick={() => setActiveTab('Estacion de control')}
            >
              Estación de control
            </button>
            <button
              className={activeTab === 'Tramos homogeneos' ? 'active' : ''}
              onClick={() => setActiveTab('Tramos homogeneos')}
            >
              Tramos homogéneos
            </button>
            <button
              className={activeTab === 'Formatos de recoleccion de datos' ? 'active' : ''}
              onClick={() => setActiveTab('Formatos de recoleccion de datos')}
            >
              Formatos de recolección de datos
            </button>
          </div>

          <div className="tab-content-container">
            {renderTabContent()}
          </div>
        </>
      );
    } else if (headerOption === 'opcion2') {
      return (
        <div className="option2-content-container">
          <h1 className="page-title">
            <i className="fas fa-chart-line"></i> Opción 2 - Análisis Avanzado
          </h1>
          <div className="option-content-container">
            <div className="info-message-container">
              <h2>¡Hola! Estoy en Opción 2 en el tráfico</h2>
              <p>Esta es la vista de la Opción 2 donde puedes agregar contenido específico para análisis avanzado de tráfico.</p>
              <div className="feature-list-container">
                <div className="feature-item-container">
                  <i className="fas fa-chart-bar"></i>
                  <span>Análisis de patrones de tráfico</span>
                </div>
                <div className="feature-item-container">
                  <i className="fas fa-clock"></i>
                  <span>Estudios temporales detallados</span>
                </div>
                <div className="feature-item-container">
                  <i className="fas fa-route"></i>
                  <span>Optimización de rutas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="trafico-container">
      {renderContent()}
    </div>
  );
}

export default Traficods;
*/