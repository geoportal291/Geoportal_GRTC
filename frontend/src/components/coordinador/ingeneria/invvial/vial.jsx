import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../../../../api/axios';
import './vial.css';
import { usePageTitle } from '../../../contexts/PageTitleContext';
import { useVialOption } from '../../../../data/contexts/VialOptionContext';
import { useAuth } from '../../../../data/contexts/AuthContext';
import { logAuditEvent } from '../../../../api/audit';
import { toLatLon } from 'utm';
import L from 'leaflet';
import * as XLSX from 'xlsx';
import Alcantarillas from './obras/Alcantarillas';
import Badenes from './obras/Badenes'; // Import Badenes
import withUpload from './obras/withUpload';
import DataManagementModal from './DataManagementModal';
import Swal from 'sweetalert2';

const AlcantarillasWithUpload = withUpload(Alcantarillas);
const BadenesWithUpload = withUpload(Badenes); // Create BadenesWithUpload


const findClosestVertexIndex = (targetLatLng, routeCoords) => {
  let closestIndex = -1;
  let minDistance = Infinity;
  const target = L.latLng(targetLatLng.latitude, targetLatLng.longitude);

  routeCoords.forEach((coord, index) => {
    const vertex = L.latLng(coord.lat, coord.lng);
    const distance = target.distanceTo(vertex);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
};


// --- Dropdown Tab Component ---
const DropdownTab = ({ title, options, activeOption, onOptionSelect, isActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSelect = (option) => {
    onOptionSelect(option);
    setIsOpen(false);
  };

  return (
    <div className="invvial-dropdown-tab" ref={dropdownRef}>
      <button
        className={`invvial-tabs-button ${isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {title} <span className="invvial-dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="invvial-dropdown-menu">
          {options.map(option => (
            <a
              key={option}
              href="#"
              className={activeOption === option ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleSelect(option); }}
            >
              {option}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};


const resumenTabs = [
  'ESTRUCTURAS Y OBRAS DE ARTE',
  'SEÑALIZACION',
  'CANTERAS Y FUENTES DE AGUA',
  'ZONAS CRITICAS',
  'ESTRUCTURA EXISTENTE',
  'INTERFERENCIAS ELECTRICAS'
];

const obrasSubTabs = ['ALCANTARILLAS', 'BADENES', 'PUENTES', 'MUROS DE CONTENCION'];
const señalizacionSubTabs = ['S. INFORMATIVAS', 'S. PREVENTIVAS', 'HITOS KILOMETRICOS'];

const Vialds = ({ isNavbarExpanded }) => {
  const { vialHeaderOption } = useVialOption();
  const { user, selectedProjectId: projectId } = useAuth();
  const { setPageTitle } = usePageTitle();

  const [activeTab, setActiveTab] = useState(resumenTabs[0]);
  const [activeObrasSubTab, setActiveObrasSubTab] = useState(obrasSubTabs[0]);
  const [activeSeñalizacionSubTab, setActiveSeñalizacionSubTab] = useState(señalizacionSubTabs[0]);
  const [segmentedRoute, setSegmentedRoute] = useState([]);
  const [selectedAlcantarilla, setSelectedAlcantarilla] = useState(null);
  const [selectedBaden, setSelectedBaden] = useState(null);

  const [isLoadingData, setIsLoadingData] = useState(false);

  const [showExcelPreviewModal, setShowExcelPreviewModal] = useState(false);

  const [excelDataPreview, setExcelDataPreview] = useState([]);
  const [modalMode, setModalMode] = useState('list'); // Default to list mode when modal opens
  const [alcantarillasData, setAlcantarillasData] = useState([]); // New state to store all alcantarillas
  const [badenesData, setBadenesData] = useState([]); // New state to store all badenes
  const [graphicsImages, setGraphicsImages] = useState([]); // NEW: State for graphics images
  const canUpload = user && (user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'COORDINADOR');

  // 1. Define placeholder main route (moved outside useEffect)
  const mainRoute = [
    { lat: -12.612858, lng: -72.537347 }, { lat: -12.6128389, lng: -72.5399268 },
    { lat: -12.6089852, lng: -72.5357536 }, { lat: -12.6083169, lng: -72.5364748 },
    { lat: -12.6028955, lng: -72.534466 }, { lat: -12.5985516, lng: -72.5335861 },
    { lat: -12.5939207, lng: -72.5282134 }, { lat: -12.593865, lng: -72.5214706 },
    { lat: -12.5925915, lng: -72.5207259 }, { lat: -12.5898242, lng: -72.5247351 },
    { lat: -12.591443, lng: -72.5315981 }, { lat: -12.5934973, lng: -72.5397426 },
    { lat: -12.5974475, lng: -72.5428666 }, { lat: -12.5899118, lng: -72.539525 },
    { lat: -12.5825663, lng: -72.5371001 }, { lat: -12.5758135, lng: -72.5377089 },
    { lat: -12.572673, lng: -72.5311406 }, { lat: -12.5695298, lng: -72.5256841 },
    { lat: -12.5667794, lng: -72.5201656 }, { lat: -12.5635378, lng: -72.514829 }
  ];

  // Helper function to calculate distance between two LatLng points
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  // Helper function to convert progresiva (KM X+Y) to meters
  const progresivaToMeters = (progresiva) => {
    const match = progresiva.match(/KM (\d+)\+(\d+)/);
    if (match) {
      const km = parseInt(match[1], 10);
      const meters = parseInt(match[2], 10);
      return km * 1000 + meters;
    }
    return 0; // Default to start if format is incorrect
  };

  // Helper function to get Lat/Lon from progresiva along the route
  const getCoordsFromProgresiva = (progresiva, route) => {
    const targetMeters = progresivaToMeters(progresiva);
    let accumulatedDistance = 0;

    for (let i = 0; i < route.length - 1; i++) {
      const p1 = route[i];
      const p2 = route[i + 1];
      const segmentLength = getDistance(p1.lat, p1.lng, p2.lat, p2.lng);

      if (accumulatedDistance + segmentLength >= targetMeters) {
        // The point is within this segment
        const segmentProgress = (targetMeters - accumulatedDistance) / segmentLength;
        const lat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
        const lng = p1.lng + (p2.lng - p1.lng) * segmentProgress;
        return { latitud: lat, longitud: lng };
      }
      accumulatedDistance += segmentLength;
    }

    // If progresiva is beyond the route, return the last point
    const lastPoint = route[route.length - 1];
    return { latitud: lastPoint.lat, longitud: lastPoint.lng };
  };




  useEffect(() => {
    if (vialHeaderOption === 'resumen general') {
      setActiveTab(resumenTabs[0]);
      if (resumenTabs[0] === 'ESTRUCTURAS Y OBRAS DE ARTE') {
        setActiveObrasSubTab(obrasSubTabs[0]);
      }
    }
    else if (vialHeaderOption === '1er entregable') {
      setActiveTab(resumenTabs[0]); // Use resumenTabs for entregables
      if (resumenTabs[0] === 'ESTRUCTURAS Y OBRAS DE ARTE') {
        setActiveObrasSubTab(obrasSubTabs[0]);
      }
    }
    else if (vialHeaderOption === '2do entregable') {
      setActiveTab(resumenTabs[0]); // Use resumenTabs for entregables
      if (resumenTabs[0] === 'ESTRUCTURAS Y OBRAS DE ARTE') {
        setActiveObrasSubTab(obrasSubTabs[0]);
      }
    }
    else if (vialHeaderOption === '3er entregable') {
      setActiveTab(resumenTabs[0]); // Use resumenTabs for entregables
      if (resumenTabs[0] === 'ESTRUCTURAS Y OBRAS DE ARTE') {
        setActiveObrasSubTab(obrasSubTabs[0]);
      }
    }
  }, [vialHeaderOption, resumenTabs, obrasSubTabs]);

  const fetchVialData = useCallback(async () => {
    if (!user || !user.token) {
      console.warn('Usuario no autenticado o token no disponible.');
      return;
    }
    if (!projectId) {
      console.warn('ID de proyecto no disponible para cargar datos.');
      return;
    }
    setIsLoadingData(true);

    try {
      // Fetch Alcantarillas
      try {
        const alcantarillasRes = await axiosInstance.get(`/api/proyectos/${projectId}/alcantarillas`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAlcantarillasData(alcantarillasRes.data.map(alcantarilla => ({
          ...alcantarilla,
          latitud: parseFloat(alcantarilla.latitud),
          longitud: parseFloat(alcantarilla.longitud)
        })));
      } catch (error) {
        console.error('Error fetching alcantarillas data:', error);
        setAlcantarillasData([]); // Default to empty array on error
      }

      // Fetch Badenes
      try {
        const badenesRes = await axiosInstance.get(`/api/proyectos/${projectId}/badenes`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setBadenesData(badenesRes.data.map(baden => ({
          ...baden,
          latitud: parseFloat(baden.latitud),
          longitud: parseFloat(baden.longitud)
        })));
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn('Endpoint de badenes no encontrado. Se continuará sin datos de badenes.');
          setBadenesData([]);
        } else {
          console.error('Error fetching badenes data:', error);
          setBadenesData([]); // Default to empty array on error
        }
      }

      // Fetch Graphics
      try {
        const graphicsRes = await axiosInstance.get(`/api/alcantarillas/graphics/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setGraphicsImages(graphicsRes.data);
      } catch (error) {
        console.error('Error fetching graphics data:', error);
        setGraphicsImages([]); // Default to empty array on error
      }

    } finally {
      setIsLoadingData(false);
    }
  }, [user, projectId]);

  const [selectedElementForEdit, setSelectedElementForEdit] = useState(null);

  const handleEditElementSelect = useCallback((elementData) => {
    setSelectedElementForEdit(elementData);
    setShowExcelPreviewModal(true);
    setModalMode('edit');
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowExcelPreviewModal(false);
    setExcelDataPreview([]);
    setModalMode('list');
    setSelectedElementForEdit(null);
  }, []);

  const handleSaveManualAlcantarilla = useCallback(async (newElementData) => {
    console.log('Datos a guardar:', newElementData);
    if (!user || !user.token) {
      console.warn('Usuario no autenticado o token no disponible.');
      return;
    }
    setIsLoadingData(true);
    const isBaden = activeObrasSubTab === 'BADENES';
    const endpoint = isBaden ? '/api/badenes' : '/api/alcantarillas';
    const idField = isBaden ? 'id_baden' : 'id_alcantarilla';

    try {
      let response;
      if (newElementData[idField]) {
        response = await axiosInstance.put(`${endpoint}/${newElementData[idField]}`, newElementData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log('Elemento actualizado exitosamente:', response.data);
      } else {
        response = await axiosInstance.post(endpoint, newElementData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log('Elemento guardado exitosamente:', response.data);
      }
      fetchVialData();
      handleCloseModal(); // Cierra el modal y resetea el estado
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Elemento guardado/actualizado correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al guardar/actualizar el elemento:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar/actualizar el elemento.',
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [user, fetchVialData, handleCloseModal, activeObrasSubTab]);

  const handleUploadExcelData = useCallback(async () => {
    fetchVialData();
  }, [fetchVialData]);

  const handleShowModal = useCallback((show, mode = 'list') => {
    setShowExcelPreviewModal(show);
    setModalMode(mode);
  }, []);

  useEffect(() => {
    setPageTitle('Inventario Vial');
  }, [setPageTitle]);

  useEffect(() => {
    fetchVialData();
  }, [fetchVialData]);

  const renderObrasSubTabContent = () => {
    const isAlcantarillasEntregable = vialHeaderOption.includes('entregable') && activeObrasSubTab === 'ALCANTARILLAS';
    const isAlcantarillasGeneral = !vialHeaderOption.includes('entregable') && activeObrasSubTab === 'ALCANTARILLAS';

    return (
      <>
        {isAlcantarillasEntregable && (
          <AlcantarillasWithUpload
            segmentedRoute={segmentedRoute}
            canUpload={canUpload}
            showModal={handleShowModal}
            onEditElementSelect={handleEditElementSelect}
            alcantarillasData={alcantarillasData}
            graphicsImages={graphicsImages}
            projectId={projectId}
            selectedAlcantarilla={selectedAlcantarilla}
            onAlcantarillaSelect={setSelectedAlcantarilla}
          />
        )}
        {isAlcantarillasGeneral && (
          <Alcantarillas
            segmentedRoute={segmentedRoute}
            onEditElementSelect={handleEditElementSelect}
            alcantarillasData={alcantarillasData}
            graphicsImages={graphicsImages}
            projectId={projectId}
            selectedAlcantarilla={selectedAlcantarilla}
            onAlcantarillaSelect={setSelectedAlcantarilla}
            showModal={handleShowModal}
          />
        )}
        {activeObrasSubTab === 'BADENES' && (
          vialHeaderOption.includes('entregable') ? (
            <BadenesWithUpload
              segmentedRoute={segmentedRoute}
              canUpload={canUpload}
              showModal={handleShowModal}
              onEditElementSelect={handleEditElementSelect}
              badenesData={badenesData}
              graphicsImages={graphicsImages}
              projectId={projectId}
              selectedBaden={selectedBaden}
              onBadenSelect={setSelectedBaden}
            />
          ) : (
            <Badenes
              segmentedRoute={segmentedRoute}
              onEditElementSelect={handleEditElementSelect}
              badenesData={badenesData}
              graphicsImages={graphicsImages}
              projectId={projectId}
              selectedBaden={selectedBaden}
              onBadenSelect={setSelectedBaden}
              showModal={handleShowModal}
            />
          )
        )}
        {activeObrasSubTab === 'PUENTES' && (
          <div><h3>Contenido de PUENTES</h3></div>
        )}
        {activeObrasSubTab === 'MUROS DE CONTENCION' && (
          <div><h3>Contenido de MUROS DE CONTENCION</h3></div>
        )}
      </>
    );
  };






  const renderSeñalizacionSubTabContent = () => {
    switch (activeSeñalizacionSubTab) {
      case 'S. INFORMATIVAS':
        return <div><h3>Contenido de S. INFORMATIVAS</h3></div>;
      case 'S. PREVENTIVAS':
        return <div><h3>Contenido de S. PREVENTIVAS</h3></div>;
      case 'HITOS KILOMETRICOS':
        return <div><h3>Contenido de HITOS KILOMETRICOS</h3></div>;
      default:
        return null;
    }
  };

  const renderTabContent = (entregableNumero, tabs) => {

    switch (activeTab) {

      case 'ESTRUCTURAS Y OBRAS DE ARTE':

        return renderObrasSubTabContent();

      case 'SEÑALIZACION':

        return renderSeñalizacionSubTabContent();

      case 'CANTERAS Y FUENTES DE AGUA':

        return <div><h3>Contenido de CANTERAS Y FUENTES DE AGUA</h3></div>;

      case 'ZONAS CRITICAS':

        return <div><h3>Contenido de ZONAS CRITICAS</h3></div>;

      case 'ESTRUCTURA EXISTENTE':

        return <div><h3>Contenido de ESTRUCTURAS EXISTENTE</h3></div>;

      case 'INTERFERENCIAS ELECTRICAS':

        return <div><h3>Contenido de INTERFERENCIAS ELECTRICAS</h3></div>;

      case tabs?.[0]:

        return <p>Contenido del {entregableNumero}er Entregable - Tab 1</p>;

      case tabs?.[1]:

        return <p>Contenido del {entregableNumero}er Entregable - Tab 2</p>;

      case tabs?.[2]:

        return <p>Contenido del {entregableNumero}er Entregable - Tab 3</p>;

      case tabs?.[3]:

        return <p>Contenido del {entregableNumero}er Entregable - Tab 4</p>;

      default:

        return <div><h3>Seleccione una pestaña.</h3></div>;

    }

  };


  const renderContent = () => {
    switch (vialHeaderOption) {
      case 'resumen general':
        return (
          <>
            <div className="invvial-tabs">
              {resumenTabs.map(tab => {
                if (tab === 'ESTRUCTURAS Y OBRAS DE ARTE') {
                  return (
                    <DropdownTab
                      key={tab}
                      title={`${tab}: ${activeObrasSubTab}`}
                      options={obrasSubTabs}
                      activeOption={activeObrasSubTab}
                      onOptionSelect={(option) => {
                        setActiveTab(tab);
                        setActiveObrasSubTab(option);
                      }}
                      isActive={activeTab === tab}
                    />
                  );
                }
                if (tab === 'SEÑALIZACION') {
                  return (
                    <DropdownTab
                      key={tab}
                      title={`${tab}: ${activeSeñalizacionSubTab}`}
                      options={señalizacionSubTabs}
                      activeOption={activeSeñalizacionSubTab}
                      onOptionSelect={(option) => {
                        setActiveTab(tab);
                        setActiveSeñalizacionSubTab(option);
                      }}
                      isActive={activeTab === tab}
                    />
                  );
                }
                return (
                  <button
                    key={tab}
                    className={`invvial-tabs-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            <div className="invvial-tab-content-container">
              {renderTabContent(null, [])}
            </div>
          </>
        );
      case '1er entregable':
      case '2do entregable':
      case '3er entregable':
        return (
          <>
            <div className="invvial-tabs">
              {resumenTabs.map(tab => {
                if (tab === 'ESTRUCTURAS Y OBRAS DE ARTE') {
                  return (
                    <DropdownTab
                      key={tab}
                      title={`${tab}: ${activeObrasSubTab}`}
                      options={obrasSubTabs}
                      activeOption={activeObrasSubTab}
                      onOptionSelect={(option) => {
                        setActiveTab(tab);
                        setActiveObrasSubTab(option);
                      }}
                      isActive={activeTab === tab}
                    />
                  );
                }
                if (tab === 'SEÑALIZACION') {
                  return (
                    <DropdownTab
                      key={tab}
                      title={`${tab}: ${activeSeñalizacionSubTab}`}
                      options={señalizacionSubTabs}
                      activeOption={activeSeñalizacionSubTab}
                      onOptionSelect={(option) => {
                        setActiveTab(tab);
                        setActiveSeñalizacionSubTab(option);
                      }}
                      isActive={activeTab === tab}
                    />
                  );
                }
                return (
                  <button
                    key={tab}
                    className={`invvial-tabs-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            <div className="invvial-tab-content-container">
              {renderTabContent(null, [])}
            </div>
          </>
        );
      default:
        return <div><h3>Seleccione una opción de Inventario Vial del encabezado.</h3></div>;
    }
  };

  return (

    <div className="invvial-container">

      {isLoadingData ? (

        <div>Cargando datos de inventario vial...</div>

      ) : (

        renderContent()
      )}
      <DataManagementModal
        show={showExcelPreviewModal}
        onClose={handleCloseModal}
        listData={activeObrasSubTab === 'BADENES' ? badenesData : alcantarillasData} // Pass correct data
        editData={selectedElementForEdit}
        mode={modalMode} // Pass the new modalMode state
        onSaveManualData={handleSaveManualAlcantarilla}
        onUploadExcelData={handleUploadExcelData} // Nueva prop para la carga de Excel
        projectId={projectId} // NEW: Pasar projectId al modal
        vialHeaderOption={vialHeaderOption} // NEW: Pasar vialHeaderOption al modal
        type={activeObrasSubTab === 'BADENES' ? 'badenes' : 'alcantarillas'} // Pass type
      />
    </div>

  );

};
export default Vialds;