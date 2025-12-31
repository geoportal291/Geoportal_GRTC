import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axiosInstance from '../../../../api/axios';
import './vial.css';
import './map/loading.css'; // Import Full Screen Loader CSS
import { usePageTitle } from '../../../contexts/PageTitleContext';
import { useVialOption } from '../../../../data/contexts/VialOptionContext';
import { useAuth } from '../../../../data/contexts/AuthContext';
import { logAuditEvent } from '../../../../api/audit';
import { toLatLon } from 'utm';
import L from 'leaflet';
import * as XLSX from 'xlsx';
import withUpload from './obras/withUpload';
import DataManagementModal from './DataManagementModal';
import Swal from 'sweetalert2';
import Dashboard from './Dashboard'; // Import Dashboard
import ExternalView from './ExternalView'; // Import External View
import DetailViewModal from './DetailViewModal'; // NEW IMPORT

// Import components (updated paths/names)
import Alcantarillas from './obras/Alcantarillas';
import Badenes from './obras/Badenes';
import Puentes from './obras/Puentes';
import Muros from './obras/Muros';
import CanterasFuentes from './canteras/CanterasFuentes';
import ZonasCriticas from './ZonasCriticas';
import EstructurasExistentes from './EstructurasExistentes';
import InterferenciasElectricas from './InterferenciasElectricas';
import SenalesInformativas from './SenalesInformativas';
import SenalesReguladoras from './SenalesReguladoras';
import SenalesPreventivas from './SenalesPreventivas';
import HitosKilometricos from './HitosKilometricos';


const AlcantarillasWithUpload = withUpload(Alcantarillas);
const BadenesWithUpload = withUpload(Badenes); // Create BadenesWithUpload
const PuentesWithUpload = withUpload(Puentes);
const MurosWithUpload = withUpload(Muros);
const ZonasCriticasWithUpload = withUpload(ZonasCriticas);
const InterferenciasWithUpload = withUpload(InterferenciasElectricas);
const SenalesInformativasWithUpload = withUpload(SenalesInformativas);
const SenalesReguladorasWithUpload = withUpload(SenalesReguladoras);
const SenalesPreventivasWithUpload = withUpload(SenalesPreventivas);
const HitosKilometricosWithUpload = withUpload(HitosKilometricos);



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
  'RESUMEN DEL PROYECTO', // New Tab
  'ESTRUCTURAS Y OBRAS DE ARTE',
  'SEÑALIZACION',
  'CANTERAS Y FUENTES DE AGUA',
  'ZONAS CRITICAS',
  'ESTRUCTURA EXISTENTE',
  'INTERFERENCIAS ELECTRICAS'
];

const obrasSubTabs = ['ALCANTARILLAS', 'BADENES', 'PUENTES', 'MUROS DE CONTENCION'];
const señalizacionSubTabs = ['S. INFORMATIVAS', 'S. REGULADORAS', 'S. PREVENTIVAS', 'HITOS KILOMETRICOS'];

// --- Modal Selection Component ---
const ViewSelectionModal = ({ onSelect }) => {
  return (
    <div className="view-selection-overlay">
      <div className="view-selection-card">
        <h3>Bienvenido al Geoportal</h3>
        <p>Seleccione el modo de visualización:</p>

        <div className="view-options">
          <div className="view-option" onClick={() => onSelect('internal')}>
            <div className="icon-box">📊</div>
            <h4>Gestión Interna</h4>
            <p>Administración y edición de inventario.</p>
          </div>

          <div className="view-option" onClick={() => onSelect('external')}>
            <div className="icon-box">🗺️</div>
            <h4>Vista Externa</h4>
            <p>Visualización geográfica interactiva.</p>
          </div>
        </div>
      </div>
      <style>{`
                .view-selection-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.8); z-index: 9999;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(5px);
                }
                .view-selection-card {
                    background: white; padding: 40px; border-radius: 20px;
                    text-align: center; max-width: 600px; width: 90%;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    font-family: 'Segoe UI', sans-serif;
                }
                .view-selection-card h3 { margin-top: 0; color: #333; font-size: 1.8rem; }
                .view-options {
                    display: flex; gap: 20px; margin-top: 30px;
                    justify-content: center;
                }
                .view-option {
                    flex: 1; padding: 20px; border-radius: 12px;
                    border: 2px solid #eee; cursor: pointer;
                    transition: all 0.3s ease;
                }
                .view-option:hover {
                    border-color: #0056b3; transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,86,179,0.1);
                }
                .icon-box { font-size: 3rem; margin-bottom: 10px; }
                .view-option h4 { margin: 10px 0; color: #0056b3; }
                .view-option p { font-size: 0.9rem; color: #666; }
            `}</style>
    </div>
  );
};

const Vialds = ({ isNavbarExpanded }) => {
  const { vialHeaderOption } = useVialOption();
  const { user, selectedProjectId: projectId } = useAuth();
  const { setPageTitle } = usePageTitle();

  // View Mode Logic
  const [viewMode, setViewMode] = useState(null); // 'internal', 'external'
  const [showSelection, setShowSelection] = useState(false);

  // Normal States
  const [activeTab, setActiveTab] = useState(resumenTabs[0]);
  const [activeObrasSubTab, setActiveObrasSubTab] = useState(obrasSubTabs[0]);
  const [activeSeñalizacionSubTab, setActiveSeñalizacionSubTab] = useState(señalizacionSubTabs[0]);
  const [segmentedRoute, setSegmentedRoute] = useState([]);
  const [selectedAlcantarilla, setSelectedAlcantarilla] = useState(null);
  const [selectedBaden, setSelectedBaden] = useState(null);
  const [selectedPuente, setSelectedPuente] = useState(null);
  const [selectedMuro, setSelectedMuro] = useState(null);

  const [isLoadingData, setIsLoadingData] = useState(false);

  const [showExcelPreviewModal, setShowExcelPreviewModal] = useState(false);
  // State for external detail view modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailElementData, setDetailElementData] = useState(null);
  const [detailElementType, setDetailElementType] = useState(null);
  const [excelDataPreview, setExcelDataPreview] = useState([]);
  const [modalMode, setModalMode] = useState('list'); // Default to list mode when modal opens
  const [alcantarillasData, setAlcantarillasData] = useState([]); // New state to store all alcantarillas
  const [badenesData, setBadenesData] = useState([]); // New state to store all badenes
  const [puentesData, setPuentesData] = useState([]);
  const [murosData, setMurosData] = useState([]);
  const [canterasData, setCanterasData] = useState([]); // New state for Canteras
  const [fuentesData, setFuentesData] = useState([]); // New state for Fuentes
  const [zonasCriticasData, setZonasCriticasData] = useState([]); // New state for Zonas Criticas
  const [interferenciasData, setInterferenciasData] = useState([]);
  const [senalesInformativasData, setSenalesInformativasData] = useState([]); // New state
  const [senalesReguladorasData, setSenalesReguladorasData] = useState([]); // New state
  const [senalesPreventivasData, setSenalesPreventivasData] = useState([]); // New state for Preventivas
  const [hitosKilometricosData, setHitosKilometricosData] = useState([]); // New state for Hitos
  const [graphicsImages, setGraphicsImages] = useState([]); // NEW: State for graphics images
  const [estructurasExistentesData, setEstructurasExistentesData] = useState([]); // NEW
  const [projectData, setProjectData] = useState(null); // NEW: State for project metadata
  const [isSwitchingTab, setIsSwitchingTab] = useState(false); // NEW: State for tab switching
  const canUpload = user && (user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'COORDINADOR PROYECTO' || parseInt(user.codigo_esp, 10) === 5);
  const canComment = user && (
    user.role?.toUpperCase() === 'ADMIN' ||
    user.role?.toUpperCase() === 'COORDINADOR PROYECTO' ||
    user.role?.toUpperCase() === 'EVALUADOR' ||
    user.role?.toUpperCase() === 'COORDINADOR DE EVALUACION' ||
    parseInt(user.codigo_esp, 10) === 5
  );


  // Decide initial view mode
  useEffect(() => {
    if (user) {
      const role = user.role?.toUpperCase() || '';
      const specialtyId = parseInt(user.codigo_esp, 10);

      if (role === 'ADMIN') {
        setShowSelection(true); // Admin chooses
      } else if (role === 'COORDINADOR PROYECTO' || specialtyId === 5) {
        setViewMode('internal'); // Coordinator/InvVial goes straight to internal
      } else {
        setViewMode('external'); // Others go straight to external
      }
    }
  }, [user]);

  // Handle Selection
  const handleViewSelect = (mode) => {
    setViewMode(mode);
    setShowSelection(false);
  };


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
      // Fetch Project Metadata (including KML URL)
      try {
        const projectRes = await axiosInstance.get(`/api/proyectos/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log("vial.jsx: fetchProjectData response:", projectRes.data);
        setProjectData(projectRes.data);
      } catch (error) {
        console.error('Error fetching project data:', error);
        // If project endpoint fails, try to fetch KML directly
        try {
          const kmlRes = await axiosInstance.get(`/api/proyectos/${projectId}/kml`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          if (kmlRes.data && kmlRes.data.url) {
            setProjectData({ kml_url: kmlRes.data.url });
          }
        } catch (kmlError) {
          console.error('Error fetching KML URL:', kmlError);
        }
      }

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

      // Fetch Puentes
      try {
        const puentesRes = await axiosInstance.get(`/api/puentes/by-project/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setPuentesData(puentesRes.data.map(puente => ({
          ...puente,
          latitud: parseFloat(puente.latitud),
          longitud: parseFloat(puente.longitud)
        })));
      } catch (error) {
        console.error('Error fetching puentes data:', error);
        setPuentesData([]);
      }

      // Fetch Muros
      try {
        const murosRes = await axiosInstance.get(`/api/muros/by-project/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMurosData(murosRes.data.map(muro => ({
          ...muro,
          latitud: parseFloat(muro.latitud),
          longitud: parseFloat(muro.longitud)
        })));
      } catch (error) {
        console.error('Error fetching muros data:', error);
        setMurosData([]);
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

      // Fetch Canteras
      try {
        const canterasRes = await axiosInstance.get(`/api/canteras-fuentes/canteras/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCanterasData(canterasRes.data.map(c => ({
          ...c,
          latitud: parseFloat(c.latitud),
          longitud: parseFloat(c.longitud)
        })));
      } catch (error) {
        console.error('Error fetching canteras data:', error);
        setCanterasData([]);
      }

      // Fetch Fuentes
      try {
        const fuentesRes = await axiosInstance.get(`/api/canteras-fuentes/fuentes/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFuentesData(fuentesRes.data.map(f => ({
          ...f,
          latitud: parseFloat(f.latitud),
          longitud: parseFloat(f.longitud)
        })));
      } catch (error) {
        console.error('Error fetching fuentes data:', error);
        setFuentesData([]);
      }

      // Fetch Zonas Criticas
      try {
        const zonasCriticasRes = await axiosInstance.get(`/api/zonas-criticas/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setZonasCriticasData(zonasCriticasRes.data.map(z => ({
          ...z,
          latitud: z.latitud ? parseFloat(z.latitud) : null,
          longitud: z.longitud ? parseFloat(z.longitud) : null
        })));
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn('Endpoint de zonas críticas no encontrado.');
          setZonasCriticasData([]);
        } else {
          console.error('Error fetching zonas criticas data:', error);
          setZonasCriticasData([]);
        }
      }

      // Fetch Interferencias
      try {
        const interferenciasRes = await axiosInstance.get(`/api/interferencias/project/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setInterferenciasData(interferenciasRes.data.map(i => ({
          ...i,
          latitud: i.latitud ? parseFloat(i.latitud) : null,
          longitud: i.longitud ? parseFloat(i.longitud) : null
        })));
      } catch (error) {
        console.error('Error fetching interferencias data:', error);
        setInterferenciasData([]);
      }

      // Fetch Senales Informativas
      try {
        const senalesRes = await axiosInstance.get(`/api/senales-informativas/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSenalesInformativasData((senalesRes.data || []).map(s => ({
          ...s,
          latitud: s.latitud ? parseFloat(s.latitud) : null,
          longitud: s.longitud ? parseFloat(s.longitud) : null
        })));
      } catch (error) {
        console.error('Error fetching senales informativas data:', error);
        setSenalesInformativasData([]);
      }

      // Fetch Senales Reguladoras
      try {
        const senalesRegRes = await axiosInstance.get(`/api/senales-reguladoras/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSenalesReguladorasData((senalesRegRes.data || []).map(s => ({
          ...s,
          latitud: s.latitud ? parseFloat(s.latitud) : null,
          longitud: s.longitud ? parseFloat(s.longitud) : null
        })));
      } catch (error) {
        // console.error('Error fetching senales reguladoras data:', error); // Backend issue acknowledged
        setSenalesReguladorasData([]);
      }

      // Fetch Senales Preventivas
      try {
        const senalesPrevRes = await axiosInstance.get(`/api/senales-preventivas/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSenalesPreventivasData((senalesPrevRes.data || []).map(s => ({
          ...s,
          latitud: s.latitud ? parseFloat(s.latitud) : null,
          longitud: s.longitud ? parseFloat(s.longitud) : null
        })));
      } catch (error) {
        console.error('Error fetching senales preventivas data:', error);
        setSenalesPreventivasData([]);
      }

      // Fetch Hitos Kilometricos
      try {
        const hitosRes = await axiosInstance.get(`/api/hitos-kilometricos/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setHitosKilometricosData((hitosRes.data || []).map(s => ({
          ...s,
          latitud: s.latitud ? parseFloat(s.latitud) : null,
          longitud: s.longitud ? parseFloat(s.longitud) : null
        })));
      } catch (error) {
        console.error('Error fetching hitos kilometricos data:', error);
        setHitosKilometricosData([]);
      }
      // ...
      // Fetch Estructuras Existentes
      try {
        const estExRes = await axiosInstance.get(`/api/estructuras-existentes/${projectId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEstructurasExistentesData((estExRes.data || []).map(s => ({
          ...s,
          latitud: s.latitud ? parseFloat(s.latitud) : null,
          longitud: s.longitud ? parseFloat(s.longitud) : null
        })));
      } catch (error) {
        // console.warn('Error fetching estructuras existentes data:', error); // Backend issue acknowledged
        setEstructurasExistentesData([]);
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
  }, [showExcelPreviewModal]);

  const handleExternalShowDetails = useCallback((point) => {
    // console.log('handleExternalShowDetails triggered with:', point);
    const { type, data } = point;

    // Set data for the new DetailViewModal
    setDetailElementData(data);
    setDetailElementType(type);
    setShowDetailModal(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setDetailElementData(null);
    setDetailElementType(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowExcelPreviewModal(false);
    setExcelDataPreview([]);
    setModalMode('list');
    setSelectedElementForEdit(null);
  }, []);

  const handleSaveManualAlcantarilla = useCallback(async (newElementData) => {
    if (!user || !user.token) {
      console.warn('Usuario no autenticado o token no disponible.');
      return;
    }
    if (!canUpload) {
      Swal.fire('Acceso Denegado', 'No tienes permisos para modificar información.', 'error');
      return;
    }
    setIsLoadingData(true);

    const isBaden = activeObrasSubTab === 'BADENES';
    const isPuente = activeObrasSubTab === 'PUENTES';
    const isMuro = activeObrasSubTab === 'MUROS DE CONTENCION';
    const isInterferencia = activeTab === 'INTERFERENCIAS ELECTRICAS';

    let endpoint = '/api/alcantarillas';
    let idField = 'id_alcantarilla';

    if (isBaden) {
      endpoint = '/api/badenes';
      idField = 'id_baden';
    } else if (isPuente) {
      endpoint = '/api/puentes';
      idField = 'id_puente';
    } else if (isMuro) {
      endpoint = '/api/muros';
      idField = 'id_muro';
    } else if (isInterferencia) {
      endpoint = '/api/interferencias';
      idField = 'id';
    } else if (activeSeñalizacionSubTab === 'S. INFORMATIVAS') {
      endpoint = '/api/senales-informativas';
      idField = 'id_senal_informativa';
    } else if (activeSeñalizacionSubTab === 'S. REGULADORAS') {
      endpoint = '/api/senales-reguladoras';
      idField = 'id_senal_reguladora';
    } else if (activeSeñalizacionSubTab === 'S. PREVENTIVAS') {
      endpoint = '/api/senales-preventivas';
      idField = 'id_senal_preventiva';
    } else if (activeSeñalizacionSubTab === 'HITOS KILOMETRICOS') {
      endpoint = '/api/hitos-kilometricos';
      idField = 'id_hito_kilometrico';
    } else if (activeTab === 'CANTERAS Y FUENTES DE AGUA') {
      endpoint = '/api/canteras';
      idField = 'id';
    } else if (activeTab === 'ZONAS CRITICAS') {
      endpoint = '/api/zonas-criticas';
      idField = 'id_zona_critica';
    } else if (activeTab === 'ESTRUCTURA EXISTENTE') {
      endpoint = '/api/estructuras-existentes';
      idField = 'id_estructura';
    }

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


  }, [user, fetchVialData, handleCloseModal, activeObrasSubTab, canUpload]);

  const handleDeleteElement = useCallback(async (elementToDelete, type) => {
    if (!user || !user.token) {
      console.warn('Usuario no autenticado.');
      return;
    }
    if (!canUpload) {
      Swal.fire('Acceso Denegado', 'No tienes permisos para eliminar información.', 'error');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    });

    if (!isConfirmed) return;

    setIsLoadingData(true);
    let endpoint = '';
    let idValue = '';

    // Determine endpoint and ID based on type
    if (type === 'alcantarillas') {
      endpoint = `/api/alcantarillas/${elementToDelete.id_alcantarilla}`;
    } else if (type === 'badenes') {
      endpoint = `/api/badenes/${elementToDelete.id_baden}`;
    } else if (type === 'puentes') {
      endpoint = `/api/puentes/${elementToDelete.id_puente}`;
    } else if (type === 'muros') {
      endpoint = `/api/muros/${elementToDelete.id_muro}`;
    } else if (type === 'zonas-criticas') {
      endpoint = `/api/zonas-criticas/${elementToDelete.id_zona_critica || elementToDelete.id}`;
    } else if (type === 'estructuras-existentes') {
      endpoint = `/api/estructuras-existentes/${elementToDelete.id_estructura || elementToDelete.id}`;
    } else if (type === 'canteras') {
      endpoint = `/api/canteras-fuentes/${elementToDelete.id}`; // Check endpoint
    } else if (type === 'interferencias') {
      endpoint = `/api/interferencias/${elementToDelete.id}`;
    } else if (type === 'senales_informativas') {
      endpoint = `/api/senales-informativas/${elementToDelete.id_senal_informativa}`;
    } else if (type === 'senales_reguladoras') {
      endpoint = `/api/senales-reguladoras/${elementToDelete.id_senal_reguladora}`;
    } else if (type === 'senales_preventivas') {
      endpoint = `/api/senales-preventivas/${elementToDelete.id_senal_preventiva}`;
    } else if (type === 'hitos_kilometricos') {
      endpoint = `/api/hitos-kilometricos/${elementToDelete.id_hito_kilometrico}`;
    }

    if (!endpoint) {
      console.error('Tipo de elemento no reconocido para eliminación:', type);
      setIsLoadingData(false);
      return;
    }

    try {
      await axiosInstance.delete(endpoint, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchVialData();
      Swal.fire(
        '¡Eliminado!',
        'El elemento ha sido eliminado correctamente.',
        'success'
      );
      // If the deleted element was the one being edited, close the modal?
      // Usually delete is done from list view so no need to close modal if it's the list.
    } catch (error) {
      console.error('Error al eliminar elemento:', error);
      Swal.fire('Error', 'No se pudo eliminar el elemento.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [user, fetchVialData, canUpload]);

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
    // Simplified: Always render with upload capabilities for the single view
    return (
      <>
        {activeObrasSubTab === 'ALCANTARILLAS' && (
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
            canComment={canComment}
          />
        )}
        {activeObrasSubTab === 'BADENES' && (
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
            canComment={canComment}
          />
        )}
        {activeObrasSubTab === 'PUENTES' && (
          <PuentesWithUpload
            segmentedRoute={segmentedRoute}
            canUpload={canUpload}
            showModal={handleShowModal}
            onEditElementSelect={handleEditElementSelect}
            puentesData={puentesData}
            graphicsImages={graphicsImages}
            projectId={projectId}
            selectedPuente={selectedPuente}
            onPuenteSelect={setSelectedPuente}
            canComment={canComment}
          />
        )}
        {activeObrasSubTab === 'MUROS DE CONTENCION' && (
          <MurosWithUpload
            segmentedRoute={segmentedRoute}
            canUpload={canUpload}
            showModal={handleShowModal}
            onEditElementSelect={handleEditElementSelect}
            murosData={murosData}
            graphicsImages={graphicsImages}
            projectId={projectId}
            selectedMuro={selectedMuro}
            onMuroSelect={setSelectedMuro}
            canComment={canComment}
          />
        )}
      </>
    );
  };






  const renderSeñalizacionSubTabContent = () => {
    switch (activeSeñalizacionSubTab) {
      case 'S. INFORMATIVAS':
        return (
          <SenalesInformativasWithUpload
            senalesData={senalesInformativasData}
            graphicsImages={graphicsImages}
            canUpload={canUpload}
            showModal={handleShowModal}
            onElementSelect={(element) => handleEditElementSelect(element, 'senales_informativas')}
            projectId={projectId}
            vialHeaderOption={vialHeaderOption}
            type="senales_informativas"
            canComment={canComment}
          />
        );
      case 'S. REGULADORAS':
        return (
          <SenalesReguladorasWithUpload
            senalesData={senalesReguladorasData}
            graphicsImages={graphicsImages}
            canUpload={canUpload}
            showModal={handleShowModal}
            onElementSelect={(element) => handleEditElementSelect(element, 'senales_reguladoras')}
            projectId={projectId}
            vialHeaderOption={vialHeaderOption}
            type="senales_reguladoras"
            canComment={canComment}
          />
        );
      case 'S. PREVENTIVAS':
        return (
          <SenalesPreventivasWithUpload
            senalesData={senalesPreventivasData}
            graphicsImages={graphicsImages}
            canUpload={canUpload}
            showModal={handleShowModal}
            onElementSelect={(element) => handleEditElementSelect(element, 'senales_preventivas')}
            projectId={projectId}
            vialHeaderOption={vialHeaderOption}
            type="senales_preventivas"
            canComment={canComment}
          />
        );
      case 'HITOS KILOMETRICOS':
        return (
          <HitosKilometricosWithUpload
            hitosData={hitosKilometricosData}
            graphicsImages={graphicsImages}
            canUpload={canUpload}
            showModal={handleShowModal}
            onElementSelect={(element) => handleEditElementSelect(element, 'hitos_kilometricos')}
            projectId={projectId}
            vialHeaderOption={vialHeaderOption}
            type="hitos_kilometricos"
            canComment={canComment}
          />
        );
      default:
        return null;
    }
  };

  const renderTabContent = (entregableNumero, tabs) => {

    switch (activeTab) {

      case 'RESUMEN DEL PROYECTO':
        return <Dashboard projectId={projectId} />;

      case 'ESTRUCTURAS Y OBRAS DE ARTE':

        return renderObrasSubTabContent();

      case 'SEÑALIZACION':

        return renderSeñalizacionSubTabContent();

      case 'CANTERAS Y FUENTES DE AGUA':

      case 'CANTERAS Y FUENTES DE AGUA':

        return (
          <CanterasFuentes
            canterasData={canterasData}
            fuentesData={fuentesData}
            projectId={projectId}
            canUpload={canUpload}
            onUploadSuccess={fetchVialData}
            showUploadModal={handleShowModal}
            graphicsImages={graphicsImages}
          />
        );

      case 'ZONAS CRITICAS':

      case 'ZONAS CRITICAS':
        return (
          <ZonasCriticasWithUpload
            zonasCriticasData={zonasCriticasData}
            graphicsImages={graphicsImages}
            canUpload={canUpload}
            projectId={projectId}
            showModal={handleShowModal}
            onEditElementSelect={handleEditElementSelect}
            canComment={canComment}
          />
        );

      case 'ESTRUCTURA EXISTENTE':
        return (
          <EstructurasExistentes
            projectId={projectId}
            isVisible={activeTab === 'ESTRUCTURA EXISTENTE'}
            graphicsImages={graphicsImages}
            canComment={canComment}
          />
        );

      case 'INTERFERENCIAS ELECTRICAS':
        return (
          <InterferenciasWithUpload
            interferenciasData={interferenciasData}
            graphicsImages={graphicsImages}
            canUpload={canUpload}
            projectId={projectId}
            showModal={handleShowModal}
            onEditElementSelect={handleEditElementSelect}
            canComment={canComment}
          />
        );

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
    // Defaulting to the main view always
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
                    setIsSwitchingTab(true);
                    setTimeout(() => {
                      setActiveTab(tab);
                      setActiveObrasSubTab(option);
                      setTimeout(() => setIsSwitchingTab(false), 800);
                    }, 50);
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
                    setIsSwitchingTab(true);
                    setTimeout(() => {
                      setActiveTab(tab);
                      setActiveSeñalizacionSubTab(option);
                      setTimeout(() => setIsSwitchingTab(false), 800);
                    }, 50);
                  }}
                  isActive={activeTab === tab}
                />
              );
            }
            return (
              <button
                key={tab}
                className={`invvial-tabs-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => {
                  setIsSwitchingTab(true);
                  setTimeout(() => {
                    setActiveTab(tab);
                    setTimeout(() => setIsSwitchingTab(false), 500);
                  }, 50);
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <div className="invvial-tab-content-container" style={{ position: 'relative', minHeight: '300px' }}>
          {(isSwitchingTab) && (
            <div className="invvial-loading-overlay">
              <div className="loader-spinner-large"></div>
              <div className="invvial-loading-text">Cargando...</div>
            </div>
          )}
          {!isLoadingData && !isSwitchingTab && renderTabContent(null, [])}
        </div>
      </>
    );
  };

  const consolidatedData = useMemo(() => ({
    alcantarillas: alcantarillasData,
    badenes: badenesData,
    puentes: puentesData,
    muros: murosData,
    senalesInformativas: senalesInformativasData,
    senalesPreventivas: senalesPreventivasData,
    hitosKilometricos: hitosKilometricosData,
    senalesReguladoras: senalesReguladorasData,
    canteras: canterasData,
    fuentes: fuentesData,
    zonasCriticas: zonasCriticasData,
    interferencias: interferenciasData,
    estructurasExistentes: estructurasExistentesData
  }), [
    alcantarillasData, badenesData, puentesData, murosData,
    senalesInformativasData, senalesPreventivasData, senalesReguladorasData, hitosKilometricosData,
    canterasData, fuentesData, zonasCriticasData,
    interferenciasData, estructurasExistentesData
  ]);



  if (!projectId) {
    return <div className="no-project-selected">Por favor seleccione un proyecto</div>
  }

  return (
    <div className="invvial-container">
      {isLoadingData && (
        <div className="invvial-loading-overlay">
          <div className="loader-spinner-large"></div>
          <div className="invvial-loading-text">Cargando datos del proyecto...</div>
        </div>
      )}
      {showSelection && (
        <ViewSelectionModal onSelect={handleViewSelect} />
      )}

      {viewMode === 'external' ? (
        <ExternalView
          onExit={() => { setShowSelection(true); setViewMode(null); }}
          data={consolidatedData}
          kmlUrl={projectData?.url_kml || projectData?.kml_url || projectData?.kml}
          graphicsImages={graphicsImages}
          onShowDetails={handleExternalShowDetails}
          showModal={showExcelPreviewModal}
          onCloseModal={handleCloseModal}
          modalMode={modalMode}
          selectedElementForEdit={selectedElementForEdit}
          onSaveManualData={handleSaveManualAlcantarilla}
          onUploadExcelData={handleUploadExcelData}
          projectId={projectId}
          vialHeaderOption={vialHeaderOption}
          activeTab={activeTab}
          activeObrasSubTab={activeObrasSubTab}
          activeSeñalizacionSubTab={activeSeñalizacionSubTab}
          onDeleteElement={handleDeleteElement}
          isNavbarExpanded={isNavbarExpanded}
          alcantarillasData={alcantarillasData}
          badenesData={badenesData}
          puentesData={puentesData}
          murosData={murosData}
          canterasData={canterasData}
          fuentesData={fuentesData}
          zonasCriticasData={zonasCriticasData}
          interferenciasData={interferenciasData}
          senalesInformativasData={senalesInformativasData}
          senalesPreventivasData={senalesPreventivasData}
          senalesReguladorasData={senalesReguladorasData}
          hitosKilometricosData={hitosKilometricosData}
        />
      ) : (
        viewMode === 'internal' && renderContent()
      )}


      <DataManagementModal
        canUpload={canUpload}
        show={showExcelPreviewModal}
        onClose={handleCloseModal}
        listData={(() => {
          if (activeTab === 'CANTERAS Y FUENTES DE AGUA') {
            return [
              ...canterasData.map(c => ({ ...c, type_label: 'Cantera', id: `c-${c.id}` })),
              ...fuentesData.map(f => ({ ...f, type_label: 'Fuente', id: `f-${f.id}` }))
            ];
          }
          if (activeTab === 'ZONAS CRITICAS') return zonasCriticasData;
          if (activeTab === 'INTERFERENCIAS ELECTRICAS') return interferenciasData;

          if (activeTab === 'SEÑALIZACION') {
            if (activeSeñalizacionSubTab === 'S. INFORMATIVAS') return senalesInformativasData;
            if (activeSeñalizacionSubTab === 'S. REGULADORAS') return senalesReguladorasData;
            if (activeSeñalizacionSubTab === 'S. PREVENTIVAS') return senalesPreventivasData;
            if (activeSeñalizacionSubTab === 'HITOS KILOMETRICOS') return hitosKilometricosData;
          }

          if (activeTab === 'ESTRUCTURAS Y OBRAS DE ARTE') {
            if (activeObrasSubTab === 'BADENES') return badenesData;
            if (activeObrasSubTab === 'PUENTES') return puentesData;
            if (activeObrasSubTab === 'MUROS DE CONTENCION') return murosData;
            // Default is Alcantarillas
            return alcantarillasData;
          }

          return alcantarillasData;
        })()}
        editData={selectedElementForEdit}
        mode={modalMode}
        onSaveManualData={handleSaveManualAlcantarilla}
        onUploadExcelData={handleUploadExcelData}
        projectId={projectId}
        vialHeaderOption={vialHeaderOption}
        type={(() => {
          if (activeTab === 'CANTERAS Y FUENTES DE AGUA') return 'canteras';
          if (activeTab === 'ZONAS CRITICAS') return 'zonas-criticas';
          if (activeTab === 'INTERFERENCIAS ELECTRICAS') return 'interferencias';

          if (activeTab === 'SEÑALIZACION') {
            if (activeSeñalizacionSubTab === 'S. INFORMATIVAS') return 'senales_informativas';
            if (activeSeñalizacionSubTab === 'S. REGULADORAS') return 'senales_reguladoras';
            if (activeSeñalizacionSubTab === 'S. PREVENTIVAS') return 'senales_preventivas';
            if (activeSeñalizacionSubTab === 'HITOS KILOMETRICOS') return 'hitos_kilometricos';
          }

          if (activeTab === 'ESTRUCTURAS Y OBRAS DE ARTE') {
            if (activeObrasSubTab === 'BADENES') return 'badenes';
            if (activeObrasSubTab === 'PUENTES') return 'puentes';
            if (activeObrasSubTab === 'MUROS DE CONTENCION') return 'muros';
            return 'alcantarillas';
          }

          if (activeTab === 'ESTRUCTURA EXISTENTE') return 'estructuras-existentes';

          return 'alcantarillas';
        })()} // Pass type
        isNavbarExpanded={isNavbarExpanded}
        onDeleteElement={handleDeleteElement}
      />

      {/* Detail View Modal for External Map */}
      <DetailViewModal
        show={showDetailModal}
        onClose={handleCloseDetailModal}
        elementData={detailElementData}
        elementType={detailElementType}
        projectId={projectId}
        vialHeaderOption={vialHeaderOption}
        graphicsImages={graphicsImages}
        route={segmentedRoute.length > 0 ? segmentedRoute : mainRoute}
        canComment={canComment}
      />
    </div>
  );
};
export default Vialds;