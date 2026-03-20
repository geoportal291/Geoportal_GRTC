import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './Progresivas.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import SeleccionarEstratosModal from '../estratos/SeleccionarEstratosModal';
import KmlMapModal from '../mapa/KmlMapModal';
import ProgresivaImageGalleryModal from './ProgresivaImageGalleryModal';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import { fromLatLon } from 'utm';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

import { useAuth } from '../../../../data/contexts/AuthContext';
import useProgresivasData from '../../../../hooks/useProgresivasData';

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const WordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const formatNumber = (num) => {
  if (typeof num === 'number') {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return num; // Return as is if not a number (e.g., 'N/A')
};

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const ManageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-4.44a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.54" />
    <path d="M18 2l4 4-10 10H8v-4L18 2z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 5 17 10"></polyline>
    <line x1="12" y1="5" x2="12" y2="19"></line>
  </svg>
);

const ProjectsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

const convertProgresivaToMeters = (progresivaCode) => {
  if (!progresivaCode || typeof progresivaCode !== 'string') {
    return 0;
  }
  // If it's in "km+m" format (old), convert it
  if (progresivaCode.includes('+')) {
    const parts = progresivaCode.split('+');
    const km = parseInt(parts[0], 10);
    const meters = parseInt(parts[1], 10);
    if (!isNaN(km) && !isNaN(meters)) {
      return km * 1000 + meters;
    }
  } else { // Assume it's in "kmmeters" format (new)
    const metersPart = progresivaCode.substring(progresivaCode.length - 3);
    const kmPart = progresivaCode.substring(0, progresivaCode.length - 3);
    const km = parseInt(kmPart, 10);
    const meters = parseInt(metersPart, 10);
    if (!isNaN(km) && !isNaN(meters)) {
      return km * 1000 + meters;
    }
  }
  return 0; // Default or error case
};

const convertMetersToProgresiva = (meters) => {
  if (typeof meters !== 'number' || isNaN(meters)) {
    return '';
  }
  const km = Math.floor(meters / 1000);
  const remainingMeters = meters % 1000;
  // Return in the new 'kmmeters' format
  return `${km}${String(remainingMeters).padStart(3, '0')}`;
};

const formatCodigoForDisplay = (codigo) => {
  if (!codigo || typeof codigo !== 'string') {
    return codigo;
  }
  if (codigo.includes('+')) {
    return codigo.replace(/\++/g, '+');
  }
  if (codigo.length < 4) {
    return codigo;
  }
  const km = codigo.substring(0, codigo.length - 3);
  const meters = codigo.substring(codigo.length - 3);
  return `${km}+${meters}`;
};

const parseProgresivaCode = (code) => {
  if (typeof code === 'number') {
    return convertMetersToProgresiva(code); // Convert number to new string format
  }
  if (typeof code === 'string') {
    if (code.includes('+')) { // Old "km+m" format
      const meters = convertProgresivaToMeters(code); // Use the updated convertProgresivaToMeters
      return convertMetersToProgresiva(meters); // Convert meters to new string format
    } else { // Assume new "kmmeters" format
      return code;
    }
  }
  return '';
};

const getProgresivaCodeForDisplay = (fullCode) => {
  if (typeof fullCode !== 'string') {
    return fullCode;
  }
  const lastHyphenIndex = fullCode.lastIndexOf('-');
  if (lastHyphenIndex !== -1) {
    return fullCode.substring(lastHyphenIndex + 1);
  }
  return fullCode;
};

const getProgresivaCodeForInput = (fullCode) => {
  const code = getProgresivaCodeForDisplay(fullCode);
  if (typeof code === 'string') {
    return code.replace(/\+/g, '');
  }
  return code;
};

const getLadoDisplayName = (ladoInitial) => {
  switch (ladoInitial) {
    case 'I': return 'IZQUIERDA';
    case 'C': return 'CENTRO';
    case 'D': return 'DERECHA';
    default: return ladoInitial; // Return as is if not recognized
  }
};

const getLadoInitial = (ladoDisplayName) => {
  if (typeof ladoDisplayName !== 'string') {
    return '';
  }
  switch (ladoDisplayName.trim().toUpperCase()) {
    case 'IZQUIERDA': return 'I';
    case 'CENTRO': return 'C';
    case 'DERECHA': return 'D';
    case 'I': return 'I'; // Handle cases where initial is already provided
    case 'C': return 'C';
    case 'D': return 'D';
    default: return ''; // Default to empty string if not recognized
  }
};

const Progresivas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, selectedProjectId, selectedProjectName, selectProject } = useAuth();
  const isAdmin = user?.rol_nombre === 'ADMIN';

  // --- 0. AUTO-SWITCH PROJECT LOGIC (Deep Linking) ---
  useEffect(() => {
    if (location.state?.selectedProjectId && selectProject) {
      const targetId = String(location.state.selectedProjectId);
      const currentId = selectedProjectId ? String(selectedProjectId) : null;

      if (targetId !== currentId) {
        console.log('[DEBUG Progresivas] Switching Project Context to:', targetId);
        selectProject(location.state.selectedProjectId, location.state.selectedProjectName || 'Auto-Selected Project');
      }
    }
  }, [location.state, selectedProjectId, selectProject]);

  const initialFormData = {
    codigo: '',
    nombre: '',
    lado: '',
    linea: '18L',
    coordenada_este: '',
    coordenada_norte: '',
    descripcion: '',
    estado: 'activo',
    longitud_total: '',
    tipo_via: '500',
    intervalo_manual: '',
    isIntervalManual: false,
    selectedProjectId: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [kmlFileProgresiva, setKmlFileProgresiva] = useState(null);
  const [isUploadingKmlProgresiva, setIsUploadingKmlProgresiva] = useState(false);
  const [kmlFilePuntos, setKmlFilePuntos] = useState(null); // NEW: State for Puntos KML
  const [isUploadingKmlPuntos, setIsUploadingKmlPuntos] = useState(false); // NEW: State for Puntos KML upload status
  const { progresivas, loading, error, fetchProgresivas: fetchProgresivasFromHook } = useProgresivasData();
  const [proyectos, setProyectos] = useState([]); const [generatedSubProgresivas, setGeneratedSubProgresivas] = useState([]);
  const [progresivaDetails, setProgresivaDetails] = useState(null);
  const [subProgresivas, setSubProgresivas] = useState([]);
  const [isLoadingCreation, setIsLoadingCreation] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Added to fix ReferenceError
  const [managingProgresiva, setManagingProgresiva] = useState(null);
  const [editingId, setEditingId] = useState(null); // Added to fix ReferenceError
  const [progresivaFormData, setProgresivaFormData] = useState(null);
  const [estratosPerfil, setEstratosPerfil] = useState([]);
  const [viewingEstratos, setViewingEstratos] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null); // Added to fix ReferenceError
  const [expandedEnsayos, setExpandedEnsayos] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [showProjectSelectionForImport, setShowProjectSelectionForImport] = useState(false);
  const [selectedProjectForImport, setSelectedProjectForImport] = useState('');
  const [selectedIds, setSelectedIds] = useState([]); // Added to fix ReferenceError
  const [showEstratoSelectionModal, setShowEstratoSelectionModal] = useState(false);
  const [importDataForSelection, setImportDataForSelection] = useState(null);
  const [showForm, setShowForm] = useState(false); // Added to fix ReferenceError
  const [componentError, setComponentError] = useState(null); // Added for local component errors
  const [step, setStep] = useState(1); // State for wizard form

  const [showMapModal, setShowMapModal] = useState(false); // NEW: State for KML map modal

  const [selectedKmlProgresiva, setSelectedKmlProgresiva] = useState(null); // NEW: State for selected progresiva for KML map

  // --- KML Progress State ---
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [canterasData, setCanterasData] = useState([]); // NEW: State for map popup canteras


  const handleViewKmlMap = async (progresiva) => { // NEW: Handler for KML map button
    setSelectedKmlProgresiva(progresiva);

    // Fetch sub-progresivas fresh to ensure data is there for map coloring
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/progresivas/${progresiva.id}/children/all`, { headers });
      const subProgs = Array.isArray(res.data) ? res.data : [];
      setSubProgresivas(subProgs);

      // NEW: Fetch Canteras for this tramo to show on map
      try {
        // Intentar ruta con /api/tramos (estándar) o /tramos (si fuera legacy)
        // Usaremos /api/tramos/${id}/canteras asumiendo consistencia
        const resCanteras = await axios.get(`${API_URL}/api/tramos/${progresiva.id}/canteras`, { headers });
        setCanterasData(resCanteras.data || []);
      } catch (canteraErr) {
        console.warn("Could not fetch canteras for map fallback:", canteraErr);
        // Si falla con 404, podría intentar sin /api/ pero por ahora dejamos []
        setCanterasData([]);
      }

    } catch (err) {
      console.error("Error fetching sub-progresivas for map", err);
      setSubProgresivas([]);
    }

    setShowMapModal(true);
  };

  // --- Gallery & DOCX Upload Logic ---
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryProgresiva, setGalleryProgresiva] = useState(null);
  const [isUploadingDocx, setIsUploadingDocx] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleOpenGallery = (prog) => {
    setGalleryProgresiva(prog);
    setShowGalleryModal(true);
  };

  const handleDocxUpload = async (event, tramoId) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validación básica de extensión
    if (!file.name.match(/\.(docx|doc)$/i)) {
      alertify.error('Por favor sube un archivo Word (.docx)');
      return;
    }

    setIsUploadingDocx(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('docxFile', file);

    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`${API_URL}/api/tramos/${tramoId}/upload-docx-photos`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const { summary } = res.data;
      const msg = `Procesado: ${summary.processed} fotos importadas automáticamente.`;
      if (summary.processed > 0) alertify.success(msg);
      else alertify.warning('No se encontraron fotos asociadas a progresivas válidas en el documento.');
    } catch (err) {
      console.error("Error upload DOCX", err);
      alertify.error('Error al procesar el archivo DOCX.');
    } finally {
      setIsUploadingDocx(false);
      event.target.value = null;
    }
  };

  const handleViewEstratos = (progresiva) => {
    setViewingEstratos(progresiva);
  };

  const toggleEnsayos = (estratoId) => {
    setExpandedEnsayos(prev => ({ ...prev, [estratoId]: !prev[estratoId] }));
  };

  const API_URL = process.env.REACT_APP_API_BASE || '';

  const getAuthHeaders = useCallback(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = userData?.token;
    if (!token) {
      alertify.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
      navigate('/login');
      throw new Error('Token no proporcionado');
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);



  const fetchProyectos = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/proyectos`, { headers });
      setProyectos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.message !== 'Token no proporcionado') {
        console.error("Error fetching proyectos:", err);
      }
    }
  }, [API_URL, getAuthHeaders]);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  // --- AUTO-OPEN LOGIC FROM DASHBOARD ---
  // --- AUTO-OPEN LOGIC FROM DASHBOARD ---
  // Simplificado al máximo para garantizar apertura
  useEffect(() => {
    const targetId = location.state?.openTramoId;

    // Solo intentar si hay un ID, hay datos cargados, y NO estamos viendo nada aún.
    if (targetId && progresivas.length > 0 && !viewingDetails) {
      console.log('[DEBUG DeepLink] Evaluando apertura. Target:', targetId);

      // Buscar el tramo
      const tramo = progresivas.find(p => p.id == targetId);

      if (tramo) {
        console.log('[DEBUG DeepLink] ENCONTRADO. Ejecutando handleViewDetails para:', tramo.nombre);
        handleViewDetails(tramo);
      } else {
        // Log solo la primera vez o cuando deje de cargar
        if (!loading) {
          console.warn('[DEBUG DeepLink] NO ENCONTRADO. Lista de IDs:', progresivas.map(p => p.id));
        }
      }
    }
  }, [location.state, progresivas, viewingDetails, loading]);

  const handleNavigateToGestor = () => {
    if (selectedIds.length !== 1) return;
    const tramoSeleccionado = progresivas.find(p => p.id === selectedIds[0]);
    if (tramoSeleccionado) {
      navigate(`/coordinador/gestor-proyectos`, {
        state: { expandTramoId: tramoSeleccionado.id, selectedProjectId: tramoSeleccionado.proyecto_id }
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKmlFileChangeProgresiva = (e) => {
    setKmlFileProgresiva(e.target.files[0]);
  };

  const handleKmlFileChangePuntos = (e) => {
    setKmlFilePuntos(e.target.files[0]);
  };

  const handleDeleteKmlPuntos = async () => {
    if (!editingId) return;

    alertify.confirm(
      'Eliminar Puntos KML',
      '¿Estás seguro de que quieres eliminar el KML de Puntos de Referencia?',
      async () => {
        try {
          const headers = getAuthHeaders();
          // Assuming new endpoint or param. If backend not ready, this will fail 404.
          await axios.delete(`${API_URL}/api/progresivas/${editingId}/kml-puntos`, { headers });
          setFormData(prev => ({ ...prev, kml_puntos_filename: null }));
          alertify.success('KML de Puntos eliminado correctamente.');
          fetchProgresivasFromHook();
        } catch (err) {
          console.error("Error deleting KML Puntos", err);
          alertify.error('Error al eliminar KML de puntos.');
        }
      },
      () => { }
    );
  };


  const handleNextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleShowCreateForm = () => {
    setEditingId(null);
    const newInitialData = isAdmin
      ? { ...initialFormData }
      : { ...initialFormData, selectedProjectId: selectedProjectId };
    setFormData(newInitialData);
    setShowForm(true);
  };

  // ✅ Bloque completo corregido y mejorado
  const handleEdit = async (progresiva) => {
    if (!progresiva) {
      alertify.error('No se encontró la progresiva seleccionada.');
      return;
    }

    try {
      setIsLoadingAction(true);
      setEditingId(progresiva.id);

      setFormData({
        codigo: progresiva.codigo,
        nombre: progresiva.nombre,
        linea: progresiva.linea || '18L',
        descripcion: progresiva.descripcion || '',
        estado: progresiva.estado,
        coordenada_este: progresiva.coordenada_este || '',
        coordenada_norte: progresiva.coordenada_norte || '',
        longitud_total: progresiva.longitud_total || '',
        intervalo_manual: progresiva.intervalo_manual || '',
        tipo_via: progresiva.tipo_via || '500',
        kml_trazado_id: progresiva.kml_trazado_id || null, // Add this line
        kml_filename: progresiva.kml_filename || null,
        kml_uploaded_at: progresiva.kml_uploaded_at || null,
        kml_puntos_filename: progresiva.kml_puntos_filename || null, // NEW: Load Puntos KML filename
      });

      // Fetch generated sub-progresivas for editing
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/progresivas/${progresiva.id}/children/all`, { headers });

      setGeneratedSubProgresivas(Array.isArray(res.data?.children) ? res.data.children : res.data || []);
      setShowForm(true);
    } catch (err) {
      if (err.message !== 'Token no proporcionado') {
        setComponentError(err.response?.data?.error || err.message);
        alertify.error(`Error al cargar progresivas: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowForm(false);
    setGeneratedSubProgresivas([]);
    setStep(1); // Reset step on cancel
  };

  const generateSubProgresivas = (longitud, intervalo, data) => {
    if (isNaN(longitud) || longitud <= 0) {
      alertify.error('El "Valor Total" debe ser un número positivo.');
      return [];
    }
    if (isNaN(intervalo) || intervalo <= 0) {
      alertify.error('El "Intervalo" debe ser un número positivo.');
      return [];
    }

    const children = [];
    for (let i = 0; i <= longitud; i += intervalo) {
      const km = Math.floor(i / 1000);
      const meters = i % 1000;
      const codigoProgresiva = `${km}${String(meters).padStart(3, '0')}`;
      children.push({
        codigo: codigoProgresiva,
        nombre: `Progresiva ${codigoProgresiva}`,
        descripcion: `Progresiva generada automáticamente: ${codigoProgresiva}`,
        estado: 'activo',
        coordenada_este: null,
        coordenada_norte: null,
        linea: data.linea,
        estratos_perfil: [],
      });
    }
    return children;
  };

  const handleGenerateSubProgresivas = () => {
    setComponentError(null);
    const longitud = formData.longitud_total === '' ? 0 : parseFloat(formData.longitud_total);
    const intervalo = formData.isIntervalManual
      ? (formData.intervalo_manual === '' ? 0 : parseFloat(formData.intervalo_manual))
      : parseFloat(formData.tipo_via);

    const children = generateSubProgresivas(longitud, intervalo, formData);

    if (children.length === 0) {
      alertify.warning('No se generaron progresivas. Verifique el Valor Total y el Intervalo.');
    }

    setGeneratedSubProgresivas(children);
    alertify.success(`Se generaron ${children.length} progresivas.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: only allow submit on last step if creating new
    if (editingId === null && step !== 3) {
      alertify.error('Por favor, complete todos los pasos antes de finalizar.');
      return;
    }

    setSubmitting(true);
    setComponentError(null);
    setIsLoadingCreation(true);

    try {
      let progresivaIdToUpdate = editingId;

      if (editingId) {
        // --- UPDATE EXISTING PROGRESIVA ---
        const updatedProgresiva = {
          nombre: formData.nombre,
          linea: formData.linea,
          coordenada_este: formData.coordenada_este === '' ? null : Number(formData.coordenada_este),
          coordenada_norte: formData.coordenada_norte === '' ? null : Number(formData.coordenada_norte),
          descripcion: formData.descripcion,
          estado: formData.estado,
          proyecto_id: Number(selectedProjectId), // Use selectedProjectId from context
          longitud_total: formData.longitud_total === '' ? null : Number(formData.longitud_total),
          intervalo_manual: formData.intervalo_manual === '' ? null : Number(formData.intervalo_manual),
          tipo_via: Number(formData.tipo_via),
          kml_trazado_id: formData.kml_trazado_id, // Add this line
          generatedChildren: generatedSubProgresivas,
        };

        const headers = getAuthHeaders();
        await axios.put(`${API_URL}/api/progresivas/${editingId}`, updatedProgresiva, {
          headers: { 'Content-Type': 'application/json', ...headers },
        });
        alertify.success('Tramo actualizado.');
      } else {
        // --- CREATE NEW PROGRESIVA ---
        if (generatedSubProgresivas.length === 0) {
          setComponentError('Debe generar las progresivas antes de crear el tramo principal.');
          alertify.error('Debe generar las progresivas antes de crear el tramo principal.');
          setSubmitting(false);
          setIsLoadingCreation(false);
          return;
        }

        const parentProgresiva = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          linea: formData.linea,
          coordenada_este: formData.coordenada_este === '' ? null : Number(formData.coordenada_este),
          coordenada_norte: formData.coordenada_norte === '' ? null : Number(formData.coordenada_norte),
          descripcion: formData.descripcion,
          estado: formData.estado,
          proyecto_id: Number(selectedProjectId || formData.selectedProjectId) || null,
          longitud_total: formData.longitud_total === '' ? null : Number(formData.longitud_total),
          intervalo_manual: formData.intervalo_manual === '' ? null : Number(formData.intervalo_manual),
          tipo_via: Number(formData.tipo_via),
        };

        const generationParams = {
          valorTotal: formData.longitud_total === '' ? 0 : parseFloat(formData.longitud_total),
          intervalo: formData.isIntervalManual
            ? (formData.intervalo_manual === '' ? 0 : parseFloat(formData.intervalo_manual))
            : parseFloat(formData.tipo_via),
        };

        const headers = getAuthHeaders();
        const requestHeaders = { 'Content-Type': 'application/json', ...headers };
        const createRes = await axios.post(
          `${API_URL}/api/progresivas/importar-con-ensayos`,
          { parentProgresiva, generationParams, generatedChildren: generatedSubProgresivas },
          { headers: requestHeaders }
        );

        progresivaIdToUpdate = createRes.data.progresivaId || createRes.data.id;
        alertify.success('Tramo(s) creado(s).');
      }

      // --- KML Upload Logic ---
      if (kmlFileProgresiva && progresivaIdToUpdate) {
        if (!kmlFileProgresiva.name.match(/\.(kml|kmz)$/i)) {
          alertify.error('Solo se permiten archivos KML o KMZ.');
        } else {
          setIsUploadingKmlProgresiva(true);
          const kmlFormData = new FormData();
          kmlFormData.append('kmlFile', kmlFileProgresiva);

          try {
            const headers = getAuthHeaders();
            await axios.post(`${API_URL}/api/progresivas/${progresivaIdToUpdate}/upload-kml`, kmlFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                ...headers,
              },
            });
            alertify.success('Archivo KML cargado correctamente a la progresiva.');
            setKmlFileProgresiva(null);
          } catch (kmlUploadError) {
            console.error('Error al subir archivo KML a la progresiva:', kmlUploadError);
            alertify.error(`Error al subir KML a la progresiva: ${kmlUploadError.response?.data?.error || kmlUploadError.message}`);
          } finally {
            setIsUploadingKmlProgresiva(false);
          }
        }
      }
      // --- End KML Upload Logic ---

      fetchProgresivasFromHook();
      handleCancelEdit();
    } catch (err) {
      setComponentError(err.response?.data?.error || err.message);
      alertify.error(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
      setIsLoadingCreation(false);
    }
  };


  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    // VALIDACIÓN: Proteger el Tramo Principal
    const tramosPrincipales = selectedIds.filter(id => {
      const p = progresivas.find(prog => prog.id === id);
      return p && p.es_principal;
    });

    if (tramosPrincipales.length > 0) {
      alertify.error('Operación bloqueada: No se puede eliminar el Tramo Principal de un proyecto.');
      return;
    }

    alertify.confirm(
      'Eliminar Tramos',
      `¿Eliminar ${selectedIds.length} tramos?`,
      async () => {
        try {
          const headers = getAuthHeaders();
          await axios.post(`${API_URL}/api/progresivas/bulk-delete`,
            { ids: selectedIds },
            { headers: { ...headers } }
          );
          alertify.success('Tramos eliminados.');

          fetchProgresivasFromHook();
          setSelectedIds([]);

        } catch (err) {
          if (err.message !== 'Token no proporcionado') {
            setComponentError(err.response?.data?.error || err.message);
            alertify.error(`Error: ${err.response?.data?.error || err.message}`);
          }
        }
      },
      () => alertify.message('Cancelado')
    ).set('labels', { ok: 'Sí', cancel: 'No' });
  };

  const handleViewDetails = async (progresiva) => {
    setIsLoadingAction(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/progresivas/${progresiva.id}/children/all`, { headers });

      const subProgresivasData = Array.isArray(res.data) ? res.data : [];
      const processedSubProgresivas = subProgresivasData.map(subProg => ({
        ...subProg,
        estratos_perfil: (subProg.estratos_perfil || []).map(estrato => ({
          ...estrato,
          ensayos: estrato.ensayos || [] // Initialize ensayos if not present
        }))
      }));

      setProgresivaDetails(progresiva);
      setSubProgresivas(processedSubProgresivas);
      setViewingDetails(progresiva.id);
    } catch (err) {
      if (err.message !== 'Token no proporcionado') {
        setComponentError(err.response?.data?.error || err.message);
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleManageProgresiva = (progresiva) => {
    setProgresivaFormData({ ...progresiva, lado: progresiva.lado || '' });
    setEstratosPerfil(progresiva.estratos_perfil || []);
    setManagingProgresiva(progresiva);
  };

  const handleProgresivaFormChange = (e) => {
    const { name, value } = e.target;
    setProgresivaFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEstratoChange = (index, e) => {
    const { name, value } = e.target;
    setEstratosPerfil(prev => {
      const newPerfil = JSON.parse(JSON.stringify(prev));
      newPerfil[index] = { ...newPerfil[index], [name]: value };

      if (name === 'profundidad_final') {
        // Replace comma with dot for parsing
        const cleanedValue = value.replace(',', '.');
        const numericValue = parseFloat(cleanedValue);
        if (!isNaN(numericValue)) {
          newPerfil[index][name] = numericValue;
        } else {
          // If it's not a valid number after cleaning, keep the original string value
          // or set to 0, depending on desired behavior for invalid input.
          // For now, let's keep the original string value to allow user to correct.
          newPerfil[index][name] = value;
        }

        if (index < newPerfil.length - 1) {
          for (let i = index + 1; i < newPerfil.length; i++) {
            // Ensure the value being assigned is also a number, or handle appropriately
            newPerfil[i].profundidad_inicial = newPerfil[i - 1].profundidad_final;
          }
        }
      }

      return newPerfil;
    });
  };

  const handleAddEstrato = () => {
    setEstratosPerfil(prev => {
      const newEstrato = {
        id: Date.now(),
        estrato_id: null, // User will select this
        profundidad_inicial: prev.length > 0 ? prev[prev.length - 1].profundidad_final : 0,
        profundidad_final: 0,
        descripcion: ''
      };
      const newPerfil = [...prev, newEstrato];
      return newPerfil;
    });
  };

  const handleRemoveEstrato = (indexToRemove) => {
    setEstratosPerfil(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdateProgresiva = async (e) => {
    e.preventDefault();
    if (!progresivaFormData) return;

    setSubmitting(true);
    setComponentError(null);

    try {
      const headers = getAuthHeaders();
      const payload = {
        ...progresivaFormData,
        lado: progresivaFormData.lado,
        estratos_perfil: estratosPerfil,
      };
      // Assumption: API endpoint to update a single sub-progresiva
      await axios.put(`${API_URL}/api/progresivas/child/${progresivaFormData.id}`, payload, { headers });
      alertify.success('Progresiva actualizada.');
      setManagingProgresiva(null);
      // Refresh the details view
      handleViewDetails(progresivaDetails);
    } catch (err) {
      setComponentError(err.response?.data?.error || err.message);
      alertify.error(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportToExcel = async () => {
    if (selectedIds.length === 0) {
      alertify.warning('Selecciona tramos para exportar.');
      return;
    }

    setIsExporting(true);
    const parentDataToExport = [];
    const childDataToExport = [];
    let childEnumeration = 1;
    const maxEstratosCount = 5; // Always export 5 strata columns

    try {
      const headers = getAuthHeaders();

      // --- First pass: Determine maxEstratosCount and populate parentDataToExport ---
      const allChildrenData = []; // To collect all children data for the second pass
      for (const id of selectedIds) {
        const progresiva = progresivas.find(p => p.id === id);
        if (!progresiva) continue;

        const res = await axios.get(`${API_URL}/api/progresivas/${id}/children/all`, { headers });
        const children = Array.isArray(res.data) ? res.data : [];
        allChildrenData.push(...children); // Collect children for later

        // Populate parentDataToExport
        parentDataToExport.push({
          '#': parentDataToExport.length + 1,
          'codigo': progresiva.codigo,
          'Tramo': progresiva.nombre,
          'descripcion': progresiva.descripcion,
          'estado': progresiva.estado,
          'Valor Total': progresiva.longitud_total,
          'Intervalo': progresiva.tipo_via,
          'Intervalo Manual': progresiva.intervalo_manual,
          'Coord. Este': progresiva.coordenada_este || 'N/A',
          'Coord. Norte': progresiva.coordenada_norte || 'N/A',
          'Zona': progresiva.linea || 'N/A',
        });

        // No need to dynamically determine maxEstratosCount
      }

      // --- Second pass: Populate childDataToExport with pre-formatted text ---
      for (const child of allChildrenData) {
        const childRow = {
          '#': childEnumeration++,
          'progresiva': formatCodigoForDisplay(child.codigo.includes('-') ? child.codigo.split('-')[1] : child.codigo),
          'nombre de progresiva': child.nombre,
          'lado': child.lado || 'N/A',
          'descripcion': child.descripcion,
          'fecha': child.fecha_ejecucion ? child.fecha_ejecucion.split('T')[0] : '',
          'coord. este': child.coordenada_este || 'N/A',
          'coord norte': child.coordenada_norte || 'N/A',
          'zona': child.linea || 'N/A',
          'estado': child.estado || 'pendiente',
          'n° estratos': child.estratos_perfil ? child.estratos_perfil.length : 0,
        };

        // Add dynamic strata columns
        for (let i = 0; i < maxEstratosCount; i++) {
          const estrato = child.estratos_perfil ? child.estratos_perfil[i] : null;
          childRow[`ini_est_${i + 1}`] = estrato ? estrato.profundidad_inicial : '';
          childRow[`fin_est_${i + 1}`] = estrato ? estrato.profundidad_final : '';
          childRow[`descripcion_est_${i + 1}`] = estrato ? estrato.descripcion : '';
        }
        childDataToExport.push(childRow);
      }


      if (parentDataToExport.length === 0 && childDataToExport.length === 0) {
        alertify.warning('No hay datos para exportar.');
        setIsExporting(false);
        return;
      }

      const wb = XLSX.utils.book_new();

      // Create and append the first sheet (Parent Progresivas)
      if (parentDataToExport.length > 0) {
        const wsParent = XLSX.utils.json_to_sheet(parentDataToExport);
        XLSX.utils.book_append_sheet(wb, wsParent, 'Detalles de Tramos');
      }

      // Create and append the second sheet (Child Progresivas with Strata)
      if (childDataToExport.length > 0) {
        const wsChild = XLSX.utils.json_to_sheet(childDataToExport);
        XLSX.utils.book_append_sheet(wb, wsChild, 'Detalles de Progresivas');
      }

      XLSX.writeFile(wb, 'detalles_progresivas.xlsx');

      alertify.success('Exportado a Excel.');

    } catch (err) {
      setComponentError(err.response?.data?.error || err.message);
      alertify.error(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const navigateToProyectos = () => {
    navigate('/coordinador/proyectos');
  };

  /*
   Opción 1: Reemplazar completamente el tramo seleccionado y todas sus progresivas hijas.
   Esto significaría que el tramo seleccionado actualmente, junto con todas sus sub-progresivas, estratos y ensayos asociados, serían eliminados de la base de datos* y luego se
   crearían nuevos registros a partir del Excel importado.
   Advertencia:* Esta opción conlleva un ALTO RIESGO de pérdida de datos si no se maneja con extrema precaución.
  */
  /*
   Opción 1: Reemplazar completamente el tramo seleccionado y todas sus progresivas hijas.
   Esto significaría que el tramo seleccionado actualmente, junto con todas sus sub-progresivas, estratos y ensayos asociados, serían eliminados de la base de datos* y luego se
   crearían nuevos registros a partir del Excel importado.
   Advertencia:* Esta opción conlleva un ALTO RIESGO de pérdida de datos si no se maneja con extrema precaución.
  */
  const handleImportExcel = (event) => {
    const file = event.target.files[0];
    if (!file) {
      alertify.alert('Error', "No se seleccionó ningún archivo.");
      return;
    }

    // Store the file in a ref or state if needed for later processing after project selection
    // For now, we'll pass it directly to processImportFile

    if (selectedIds.length === 0) {
      // Scenario 1: No tramo selected - create new
      alertify.confirm(
        'Importar Tramo',
        '¿Desea crear un nuevo tramo con los datos importados?',
        () => {
          // User confirmed to create a new tramo
          // Store the file temporarily and show project selection
          // This requires a mechanism to pass the file to the project selection modal
          // For simplicity, let's make processImportFile callable directly from here
          // and from the project selection modal.
          // We need to store the file and then show the project selection.
          // Let's use a temporary state for the file to be imported.
          setFileToImport(file);
          setShowProjectSelectionForImport(true); // Show project selection modal
        },
        () => {
          // User cancelled
          alertify.message('Importación cancelada.');
          event.target.value = null; // Clear the file input
        }
      ).set('labels', { ok: 'Sí', cancel: 'No' });
    } else {
      // Scenario 2: Tramo(s) selected - overwrite the first one
      const firstSelectedProgresiva = progresivas.find(p => p.id === selectedIds[0]);
      if (!firstSelectedProgresiva) {
        alertify.error('No se encontró el tramo seleccionado para sobrescribir.');
        event.target.value = null;
        return;
      }
      const projectIdToUse = firstSelectedProgresiva.proyecto_id;

      // Proceed with file reading and processing immediately
      processImportFile(file, projectIdToUse, 'overwrite', firstSelectedProgresiva.id);
      event.target.value = null; // Clear the file input
    }
  };

  // New state to temporarily store the file for import
  const [fileToImport, setFileToImport] = useState(null);

  // New helper function to encapsulate file processing logic
  const processImportFile = async (file, projectId, mode, overwriteProgresivaId = null) => {
    setSubmitting(true);
    setComponentError(null);
    setIsLoadingCreation(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const parentSheetName = 'Detalles de Tramos';
        const parentWorksheet = workbook.Sheets[parentSheetName];
        if (!parentWorksheet) {
          alertify.alert('Error de Formato', `No se encontró la hoja "${parentSheetName}" en el archivo Excel.`);
          throw new Error("Sheet not found");
        }
        const parentJson = XLSX.utils.sheet_to_json(parentWorksheet);

        const childSheetName = 'Detalles de Progresivas';
        const childWorksheet = workbook.Sheets[childSheetName];
        if (!childWorksheet) {
          alertify.alert('Error de Formato', `No se encontró la hoja "${childSheetName}" en el archivo Excel.`);
          throw new Error("Sheet not found");
        }
        const childJson = XLSX.utils.sheet_to_json(childWorksheet);

        // Filter out empty/ghost rows before any processing
        const filteredChildJson = childJson.filter(row =>
          (row.progresiva !== undefined && row.progresiva !== null) ||
          (row['nombre de progresiva'] !== undefined && row['nombre de progresiva'] !== null)
        );
        console.log('DEBUG: filteredChildJson:', filteredChildJson);

        if (parentJson.length === 0) {
          alertify.alert('Error de Datos', "La hoja 'Detalles de Tramos' está vacía o no contiene datos.");
          throw new Error("Sheet empty");
        }

        if (filteredChildJson.length === 0) {
          alertify.alert('Error de Datos', "La hoja 'Detalles de Progresivas' está vacía o no contiene progresivas válidas.");
          throw new Error("Sheet empty");
        }

        // --- Start Validation ---
        const importedParentData = parentJson[0];

        if (!importedParentData.Tramo) {
          alertify.alert('Error de Validación', "Error en 'Detalles de Tramos': El campo 'Tramo' es obligatorio.");
          throw new Error("Validation failed");
        }
        const valorTotal = parseFloat(importedParentData['Valor Total']);
        if (isNaN(valorTotal) || valorTotal <= 0) {
          alertify.alert('Error de Validación', "Error en 'Detalles de Tramos': El campo 'Valor Total' es obligatorio y debe ser un número positivo.");
          throw new Error("Validation failed");
        }
        const intervalo = parseFloat(importedParentData.Intervalo || importedParentData['Intervalo Manual']);
        if (isNaN(intervalo) || intervalo <= 0) {
          alertify.alert('Error de Validación', "Error en 'Detalles de Tramos': El campo 'Intervalo' o 'Intervalo Manual' es obligatorio y debe ser un número positivo.");
          throw new Error("Validation failed");
        }

        for (let i = 0; i < filteredChildJson.length; i++) {
          const childRow = filteredChildJson[i];
          const rowNum = i + 2; // Excel row number (1-based index + 1 for header) 
          if (childRow.progresiva === undefined || childRow.progresiva === null) {
            alertify.alert('Error de Validación', `Error en la fila ${rowNum} de 'Detalles de Progresivas': El campo 'progresiva' es obligatorio.`);
            throw new Error("Validation failed");
          }
          if (!childRow['nombre de progresiva']) {
            alertify.alert('Error de Validación', `Error en la fila ${rowNum} de 'Detalles de Progresivas': El campo 'nombre de progresiva' es obligatorio.`);
            throw new Error("Validation failed");
          }
        }
        // --- End Validation ---

        const fileName = file.name.split('.').slice(0, -1).join('.');

        const newFormData = {
          nombre: importedParentData.Tramo || fileName,
          linea: importedParentData.Zona || '18L',
          coordenada_este: importedParentData['Coord. Este'] || '',
          coordenada_norte: importedParentData['Coord. Norte'] || '',
          descripcion: importedParentData.descripcion || '',
          estado: importedParentData.estado || 'activo',
          longitud_total: importedParentData['Valor Total'] || '',
          tipo_via: importedParentData.Intervalo || '500',
          intervalo_manual: importedParentData['Intervalo Manual'] || '',
          isIntervalManual: !!importedParentData['Intervalo Manual'],
        };

        const reconstructedSubProgresivas = filteredChildJson.map((childRow, index) => {

          const estratos_perfil = [];
          const numEstratos = childRow['n° estratos'] || 0;
          for (let j = 1; j <= numEstratos; j++) {
            estratos_perfil.push({
              profundidad_inicial: parseFloat(String(childRow[`ini_est_${j}`]).replace(',', '.')),
              profundidad_final: parseFloat(String(childRow[`fin_est_${j}`]).replace(',', '.')),
              descripcion: childRow[`descripcion_est_${j}`],
            });
          }
          return {
            excelRowNum: index + 2, // Pass the original row number (approximate)
            codigo: parseProgresivaCode(childRow.progresiva),
            nombre: childRow['nombre de progresiva'],
            lado: getLadoInitial(childRow.lado || childRow.Lado || childRow.LADO),
            descripcion: childRow.descripcion,
            estado: childRow.estado || 'pendiente',
            fecha_ejecucion: childRow.fecha || childRow.Fecha || null,
            coordenada_este: (childRow['coord. este'] === '' || childRow['coord. este'] === 'N/A' || childRow['coord. este'] === undefined) ? null : parseFloat(childRow['coord. este']),
            coordenada_norte: (childRow['coord norte'] === '' || childRow['coord norte'] === 'N/A' || childRow['coord norte'] === undefined) ? null : parseFloat(childRow['coord norte']),
            linea: childRow.zona,
            estratos_perfil: estratos_perfil,
          };
        });
        console.log('DEBUG: reconstructedSubProgresivas:', reconstructedSubProgresivas);

        const parentProgresiva = {
          codigo: importedParentData.codigo, // Assuming 'codigo' is in the Excel for parent
          nombre: newFormData.nombre,
          linea: newFormData.linea,
          coordenada_este: newFormData.coordenada_este === '' ? null : parseFloat(newFormData.coordenada_este),
          coordenada_norte: newFormData.coordenada_norte === '' ? null : parseFloat(newFormData.coordenada_norte),
          descripcion: newFormData.descripcion,
          estado: newFormData.estado,
          proyecto_id: projectId, // Use the passed projectId
          longitud_total: newFormData.longitud_total === '' ? null : parseFloat(newFormData.longitud_total),
          intervalo_manual: newFormData.intervalo_manual === '' ? null : parseFloat(newFormData.intervalo_manual),
          tipo_via: parseFloat(newFormData.tipo_via),
        };

        const generationParams = {
          valorTotal: newFormData.longitud_total === '' ? 0 : parseFloat(newFormData.longitud_total),
          intervalo: newFormData.isIntervalManual ? (newFormData.intervalo_manual === '' ? 0 : parseFloat(newFormData.intervalo_manual)) : parseFloat(newFormData.tipo_via),
        };

        const headers = getAuthHeaders();

        // --- INICIO CLASIFICADOR NLP BATCH ---
        const descripciones = [];
        reconstructedSubProgresivas.forEach(prog => {
          if (prog.estratos_perfil) {
            prog.estratos_perfil.forEach(est => {
              if (est.descripcion) descripciones.push(est.descripcion);
            });
          }
        });

        if (descripciones.length > 0) {
          try {
            const currentApiUrl = API_URL || process.env.REACT_APP_API_URL || '';
            const nlpRes = await axios.post(`${currentApiUrl}/api/clasificar-suelo-nlp-batch`, { textos: descripciones }, { headers });
            const clasificaciones = nlpRes.data;

            // Asignar los resultados a los estratos
            reconstructedSubProgresivas.forEach(prog => {
              if (prog.estratos_perfil) {
                prog.estratos_perfil.forEach(est => {
                  if (est.descripcion) {
                    const clasif = clasificaciones.find(c => c.texto === est.descripcion);
                    if (clasif && clasif.resultado && clasif.resultado.clasificacion_sucs !== "DESCONOCIDO (Requiere Revisión)") {
                      est.nlp_color_hex = clasif.resultado.color_hex_sugerido;
                      est.nlp_clasificacion_sucs = clasif.resultado.clasificacion_sucs;
                      est.nlp_clasificacion_aashto = clasif.resultado.clasificacion_aashto;
                    }
                  }
                });
              }
            });
          } catch (nlpErr) {
            console.warn('No se pudo clasificar los suelos con NLP en el frontend:', nlpErr);
          }
        }
        // --- FIN CLASIFICADOR NLP BATCH ---

        // En lugar de enviar al backend, abre el modal de selección de estratos
        setImportDataForSelection({
          parentProgresiva,
          generationParams,
          reconstructedSubProgresivas, // El nombre aquí es diferente al que se usa en el modal, asegúrate de que coincida
          projectId,
          mode,
          overwriteProgresivaId
        });
        setShowEstratoSelectionModal(true);

        // La lógica restante (llamada a la API, fetchProgresivas, etc.) se moverá a handleConfirmarImportacionConEnsayos

      } catch (err) {
        console.error("Error durante la importación:", err);
        if (err.response && err.response.data && err.response.data.type === 'ExcelDataValidationError') {
          const errorDetails = err.response.data.details;
          let detailedMessage = `Error en la importación de Excel:\n\n`;
          detailedMessage += `Mensaje: ${err.response.data.message}\n`;
          if (errorDetails) {
            detailedMessage += `Fila de Excel: ${errorDetails.excelRow}\n`;
            detailedMessage += `Progresiva: ${errorDetails.progressiveName}\n`;
            detailedMessage += `Estrato N°: ${errorDetails.stratumNumber}\n`;
            detailedMessage += `Campo: ${errorDetails.field}\n`;
            detailedMessage += `Valor(es) inválido(s): Inicial: "${errorDetails.invalidValueInitial}", Final: "${errorDetails.invalidValueFinal}"\n`;
            detailedMessage += `Razón: ${errorDetails.reason}\n`;
          }
          alertify.alert('Error de Importación de Excel', detailedMessage);
        } else if (err.message !== "Validation failed" && err.message !== "Sheet not found" && err.message !== "Sheet empty") {
          alertify.alert('Error de Importación', `Se produjo un error inesperado: ${err.response?.data?.error || err.message}`);
        }
      } finally {
        setSubmitting(false);
        setIsLoadingCreation(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmarImportacionConEnsayos = async (selectedEstratosKeys, tiposEnsayoIds) => {
    if (!importDataForSelection) {
      alertify.error("No se encontraron datos de importación. Por favor, intente de nuevo.");
      return;
    }

    setSubmitting(true);
    setComponentError(null);
    setIsLoadingCreation(true);
    setShowEstratoSelectionModal(false); // Close modal immediately

    const {
      parentProgresiva,
      generationParams,
      reconstructedSubProgresivas,
      mode,
      overwriteProgresivaId
    } = importDataForSelection;

    try {
      const headers = getAuthHeaders();

      const payload = {
        parentProgresiva,
        generationParams,
        reconstructedSubProgresivas,
        estratosSeleccionados: selectedEstratosKeys, // Pass the selected keys
        tiposEnsayoIds: tiposEnsayoIds, // Pass the selected assay type IDs
      };

      if (mode === 'new') {
        console.log('DEBUG: Sending to backend (new with assays):', payload);
        await axios.post(`${API_URL}/api/progresivas/importar-con-ensayos`, payload, {
          headers: { 'Content-Type': 'application/json', ...headers }
        });
        alertify.success('Tramo importado y ensayos creados correctamente.');
      } else if (mode === 'overwrite') {
        console.log('DEBUG: Sending to backend (overwrite with assays):', payload);
        await axios.put(`${API_URL}/api/progresivas/importar-con-ensayos/${overwriteProgresivaId}`, payload, {
          headers: { 'Content-Type': 'application/json', ...headers }
        });
        alertify.success('Tramo actualizado y ensayos creados correctamente.');
      }

      fetchProgresivasFromHook();
      handleCancelEdit();

    } catch (err) {
      console.error("Error durante la importación con ensayos:", err);
      if (err.response && err.response.data && err.response.data.type === 'ExcelDataValidationError') {
        const errorDetails = err.response.data.details;
        let detailedMessage = `Error en la importación de Excel:\n\n`;
        detailedMessage += `Mensaje: ${err.response.data.message}\n`;
        if (errorDetails) {
          detailedMessage += `Fila de Excel: ${errorDetails.excelRow}\n`;
          detailedMessage += `Progresiva: ${errorDetails.progressiveName}\n`;
          detailedMessage += `Estrato N°: ${errorDetails.stratumNumber}\n`;
          detailedMessage += `Campo: ${errorDetails.field}\n`;
          detailedMessage += `Valor(es) inválido(s): Inicial: "${errorDetails.invalidValueInitial}", Final: "${errorDetails.invalidValueFinal}"\n`; detailedMessage += `Razón: ${errorDetails.reason}\n`;
        }
        alertify.alert('Error de Importación de Excel', detailedMessage);
      } else {
        alertify.alert('Error de Importación', `Se produjo un error inesperado: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setSubmitting(false);
      setIsLoadingCreation(false);
      setImportDataForSelection(null); // Cleanup
      document.getElementById('import-excel-progresivas').value = null;
    }
  };

  const handleDownloadTemplate = () => {
    // Sheet 1: Detalles de Tramos
    const tramoHeaders = [
      "Tramo", "descripcion", "estado", "Valor Total",
      "Intervalo", "Intervalo Manual", "Coord. Este", "Coord. Norte", "Zona"
    ];
    const tramoExample = {
      "Tramo": "Tramo de Ejemplo",
      "descripcion": "Descripción del tramo de ejemplo",
      "estado": "activo",
      "Valor Total": 10000,
      "Intervalo": 500,
      "Intervalo Manual": "",
      "Coord. Este": "000000",
      "Coord. Norte": "000000",
      "Zona": "18L"
    };
    const wsParent = XLSX.utils.json_to_sheet([tramoExample], { header: tramoHeaders });

    // Sheet 2: Detalles de Progresivas
    const progresivaHeaders = [
      "progresiva", "nombre de progresiva", "lado", "descripcion", "fecha", "coord. este", "coord norte", "zona", "estado", "n° estratos",
      "ini_est_1", "fin_est_1", "descripcion_est_1",
      "ini_est_2", "fin_est_2", "descripcion_est_2",
      "ini_est_3", "fin_est_3", "descripcion_est_3",
      "ini_est_4", "fin_est_4", "descripcion_est_4",
      "ini_est_5", "fin_est_5", "descripcion_est_5"
    ];
    const progresivaExamples = [
      {
        "progresiva": "0+000",
        "nombre de progresiva": "Progresiva 0+000",
        "lado": "CENTRO",
        "descripcion": "Inicio del tramo",
        "fecha": "2024-01-01",
        "coord. este": "000000",
        "coord norte": "000000",
        "zona": "18L",
        "estado": "pendiente",
        "n° estratos": 2,
        "ini_est_1": 0,
        "fin_est_1": 1.5,
        "descripcion_est_1": "Arena limosa",
        "ini_est_2": 1.5,
        "fin_est_2": 3.0,
        "descripcion_est_2": "Grava mal graduada",
        "ini_est_3": "", "fin_est_3": "", "descripcion_est_3": "",
        "ini_est_4": "", "fin_est_4": "", "descripcion_est_4": "",
        "ini_est_5": "", "fin_est_5": "", "descripcion_est_5": ""
      },
      {
        "progresiva": "0+500",
        "nombre de progresiva": "Progresiva 0+500",
        "lado": "CENTRO",
        "descripcion": "Punto intermedio",
        "fecha": "2024-01-15",
        "coord. este": "",
        "coord norte": "",
        "zona": "18L",
        "estado": "pendiente",
        "n° estratos": 1,
        "ini_est_1": 0,
        "fin_est_1": 2.0,
        "descripcion_est_1": "Arcilla de alta plasticidad",
        "ini_est_2": "", "fin_est_2": "", "descripcion_est_2": "",
        "ini_est_3": "", "fin_est_3": "", "descripcion_est_3": "",
        "ini_est_4": "", "fin_est_4": "", "descripcion_est_4": "",
        "ini_est_5": "", "fin_est_5": "", "descripcion_est_5": ""
      }
    ];
    const wsChild = XLSX.utils.json_to_sheet(progresivaExamples, { header: progresivaHeaders });

    // Create workbook and download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsParent, "Detalles de Tramos");
    XLSX.utils.book_append_sheet(wb, wsChild, "Detalles de Progresivas");
    XLSX.writeFile(wb, "plantilla_importacion_tramos.xlsx");
    alertify.success("Descargando plantilla de importación.");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'activo': return 'status-activo';
      case 'inactivo': return 'status-inactivo';
      case 'completado': return 'status-completado';
      case 'pendiente': return 'status-pendiente';
      case 'en revision': return 'status-en-revicion';
      case 'aprobado': return 'status-completado'; // Visualmente similar a completado
      default: return '';
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = progresivas.map(p => p.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteKml = async () => {
    if (!editingId) {
      alertify.error('No se puede eliminar KML sin un tramo seleccionado.');
      return;
    }

    alertify.confirm(
      'Eliminar Trazado KML',
      '¿Estás seguro de que quieres eliminar el trazado KML de esta progresiva? Esta acción no se puede deshacer.',
      async () => {
        try {
          const headers = getAuthHeaders();
          await axios.delete(`${API_URL}/api/progresivas/${editingId}/kml`, { headers });
          alertify.success('Trazado KML eliminado correctamente.');
          setFormData(prev => ({ ...prev, kml_filename: null, kml_uploaded_at: null }));
          // Optionally, refresh progresivas data if needed
          fetchProgresivasFromHook();
        } catch (err) {
          console.error('Error al eliminar KML:', err);
          alertify.error(`Error al eliminar KML: ${err.response?.data?.error || err.message}`);
        }
      },
      () => alertify.message('Eliminación de KML cancelada.')
    ).set('labels', { ok: 'Sí', cancel: 'No' });
  };

  // --- KML POINTS IMPORT FOR SUB-PROGRESIVAS ---
  const handleImportKmlPoints = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(kml|kmz)$/i)) {
      alertify.error('Solo se permiten archivos KML o KMZ.');
      e.target.value = '';
      return;
    }

    if (!progresivaDetails || !subProgresivas) {
      alertify.error('No hay un tramo activo para asociar los puntos.');
      return;
    }

    try {
      let kmlText = '';

      if (file.name.match(/\.kmz$/i)) {
        // Handle KMZ (ZIP)
        const zip = new JSZip();
        const content = await zip.loadAsync(file);
        const kmlFilename = Object.keys(content.files).find(name => name.toLowerCase().endsWith('.kml'));

        if (!kmlFilename) {
          throw new Error('El archivo KMZ no contiene un archivo .kml válido.');
        }

        kmlText = await content.files[kmlFilename].async('string');
      } else {
        // Handle KML (Text)
        kmlText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }

      // Check XML validity
      if (!kmlText.trim().startsWith('<')) {
        throw new Error('El contenido extraído no es un XML válido.');
      }

      const kmlDoc = new DOMParser().parseFromString(kmlText, 'text/xml');
      const parserError = kmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error('Error al analizar la estructura del XML.');
      }

      const geojson = kml(kmlDoc);

      if (!geojson || !geojson.features) {
        throw new Error('No se encontraron datos geográficos válidos.');
      }

      const updates = [];
      let matchedCount = 0;
      let ignoredCount = 0;

      geojson.features.forEach(feature => {
        if (feature.geometry && feature.geometry.type === 'Point') {
          const [lon, lat] = feature.geometry.coordinates;
          const name = feature.properties?.name || '';

          // Mejorar Normalización: "Km 0+100", "0+100.00" -> "0100"
          const cleanName = name.trim().replace(/\s/g, '').replace(/km/i, '').replace(/m/i, '');
          // Si tiene decimales como 0+100.00, quitarlos si no son relevantes o parsear
          // convertProgresivaToMeters maneja "0+100" -> 100.
          const meters = convertProgresivaToMeters(cleanName);
          const targetCode = convertMetersToProgresiva(meters); // "0100"

          if (targetCode) {
            const zoneStr = progresivaDetails.linea || '18L';
            const zoneNum = parseInt(zoneStr.match(/\d+/)?.[0] || '18', 10);
            const utmCoords = fromLatLon(lat, lon, zoneNum);
            const este = parseFloat(utmCoords.easting.toFixed(2));
            const norte = parseFloat(utmCoords.northing.toFixed(2));

            // MATCHING ROBUSTO: Comparar sufijo (ej: "349-0100" vs "0100")
            const match = subProgresivas.find(sp => {
              const spCodeSuffix = String(sp.codigo).split('-').pop(); // obtener la parte "0100"
              return spCodeSuffix === targetCode || sp.codigo === targetCode;
            });

            if (match) {
              updates.push({
                id: match.id,
                nombre: match.nombre,
                lado: match.lado,
                estratos_perfil: match.estratos_perfil,
                codigo: match.codigo,
                descripcion: match.descripcion,
                estado: match.estado,
                linea: match.linea,
                coordenada_este: este,
                coordenada_norte: norte
              });
              matchedCount++;
            } else {
              // NO AGREGAR A INSERTS. Simplemente contar como ignorado (solo para visualización)
              ignoredCount++;
            }
          }
        }
      });

      alertify.confirm(
        'Confirmar Procesamiento KML/KMZ',
        `Se procesará el archivo: <strong>${file.name}</strong><br/>
         - <b>Trazado Completo:</b> Se guardará para visualizar en el mapa.<br/>
         - <b>Actualizaciones de Coordenadas:</b> ${matchedCount} (para progresivas existentes).<br/>
         - <b>Puntos Ignorados (Solo Visuales):</b> ${ignoredCount}<br/><br/>
         ¿Desea continuar?`,
        async () => {
          // Initialize Progress Modal
          setViewingDetails(null); // Close details view first
          setProgress(0);
          setProgressMessage('Iniciando carga...');
          setShowProgressModal(true);
          // Remove default alertify loading message since we have our own modal now
          // const loadingMsg = alertify.message('Subiendo KML y actualizando coordenadas...', 0);

          try {
            const headers = getAuthHeaders();
            let success = 0;

            // 1. SUBIR EL ARCHIVO KML AL BACKEND (Para visualización)
            // Progress 0% -> 40% reserved for upload
            // 1. SUBIR EL ARCHIVO KML AL BACKEND (Para visualización)
            // NEW LOGIC: Support both Trazado (Line) and Puntos (Points) KMLs.
            let uploadType = 'trazado';
            if (progresivaDetails.kml_trazado_id) {
              console.log('El tramo ya tiene un KML de trazado. Subiendo este archivo como Puntos de Referencia (kml_puntos_id).');
              uploadType = 'puntos';
            }

            // Always upload the file, either as main layout or secondary points
            const formData = new FormData();
            formData.append('kmlFile', file);
            formData.append('type', uploadType);

            // Usamos un endpoint específico para el TRAMO (progresiva padre)
            await axios.post(`${API_URL}/api/progresivas/${progresivaDetails.id}/upload-kml`, formData, {
              headers: { ...headers, 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                // Map 0-100 upload to 0-40 total progress
                const mappedProgress = Math.round(percentCompleted * 0.4);
                setProgress(mappedProgress);
                setProgressMessage(`Subiendo archivo de ${uploadType} (${percentCompleted}%)...`);
              }
            });

            // 2. ACTUALIZAR PROGRESIVAS EXISTENTES
            // Progress 40% -> 100% reserved for processing updates
            setProgress(40);
            setProgressMessage('Procesando actualizaciones de coordenadas...');

            const totalUpdates = updates.length;

            if (totalUpdates > 0) {
              for (let i = 0; i < totalUpdates; i++) {
                const updatedProg = updates[i];
                // Update progress relative to the remaining 60%
                const currentStepProgress = 40 + Math.round(((i + 1) / totalUpdates) * 60);
                setProgress(currentStepProgress);
                setProgressMessage(`Actualizando progresiva ${i + 1} de ${totalUpdates}...`);

                // Sanear estratos para evitar errores en backend
                const cleanEstratos = (updatedProg.estratos_perfil || []).map(est => ({
                  ...est,
                  profundidad_inicial: est.profundidad_inicial !== null && est.profundidad_inicial !== undefined
                    ? String(est.profundidad_inicial).replace(',', '.')
                    : 0,
                  profundidad_final: est.profundidad_final !== null && est.profundidad_final !== undefined
                    ? String(est.profundidad_final).replace(',', '.')
                    : 0,
                }));

                // Hacer la petición PUT para actualizar cada sub-progresiva
                try {
                  await axios.put(`${API_URL}/api/progresivas/child/${updatedProg.id}`, {
                    coordenada_este: updatedProg.coordenada_este,
                    coordenada_norte: updatedProg.coordenada_norte,
                    lado: updatedProg.lado,
                    nombre: updatedProg.nombre,
                    descripcion: updatedProg.descripcion,
                    estado: updatedProg.estado || 'activo',
                    estratos_perfil: cleanEstratos
                  }, { headers });
                  success++;
                } catch (putErr) {
                  console.error(`Error updating child ${updatedProg.id}:`, putErr.response?.data || putErr.message);
                  // Continue with others but maybe flag error? For now just log.
                }
              }
            } else {
              // If no updates, jump to 100
              setProgress(100);
            }

            // Final success
            setProgressMessage('¡Proceso completado!');
            // Short delay to show 100% before closing
            setTimeout(() => {
              setShowProgressModal(false);
              alertify.success(`Proceso finalizado. ${success} coordenadas actualizadas.`);
              handleViewDetails(progresivaDetails);
            }, 800);

          } catch (err) {
            // loadingMsg.dismiss(); // Not used anymore
            console.error(err);
            setShowProgressModal(false); // Close modal on error
            alertify.error('Error al procesar: ' + (err.response?.data?.error || err.message));
          } finally {
            // setIsLoadingAction(false); // Not strictly needed if we control modal visibility
          }
        },
        () => { }
      ).set('labels', { ok: 'Procesar', cancel: 'Cancelar' });

    } catch (err) {
      console.error(err);
      alertify.error(`Error procesando archivo: ${err.message}`);
    } finally {
      e.target.value = ''; // Reset input
    }
  };


  // --- AUTO-SCROLL LOGIC FOR DEEP LINKS ---
  useEffect(() => {
    if (viewingDetails && location.state?.activeProgresivaId && subProgresivas.length > 0) {
      const targetId = location.state.activeProgresivaId;
      // Pequeño timeout para permitir que el DOM se pinte
      const timer = setTimeout(() => {
        const row = document.getElementById(`prog-row-${targetId}`);
        if (row) {
          console.log('[DEBUG Progresivas] Scrolling to row:', targetId);
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.backgroundColor = '#fffbeb'; // Light yellow highlight
          row.style.transition = 'background-color 0.5s';
          // Remover highlight después de unos segundos
          setTimeout(() => {
            row.style.backgroundColor = '';
          }, 4000);
        } else {
          console.warn('[DEBUG Progresivas] Row not found for ID:', targetId);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [viewingDetails, location.state, subProgresivas]);


  return (
    <div className="progresivas-container">
      <SeleccionarEstratosModal
        isOpen={showEstratoSelectionModal}
        onClose={() => {
          setShowEstratoSelectionModal(false);
          setImportDataForSelection(null);
          document.getElementById('import-excel-progresivas').value = null;
        }}
        data={importDataForSelection}
        onConfirm={handleConfirmarImportacionConEnsayos}
      />
      {/* ... (rest of modals) ... */}
      {/* KML Progress Modal */}
      {showProgressModal && (
        <div className="progress-modal-overlay">
          <div className="progress-modal-content">
            <h3>Procesando Archivo KML</h3>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{progress}%</span>
            <p className="progress-detail">{progressMessage}</p>
          </div>
        </div>
      )}

      {isExporting && (

        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Exportando datos a Excel...</p>
        </div>
      )}
      {isLoadingCreation && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Creando tramo(s)...</p>
        </div>
      )}
      {isLoadingAction && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      )}
      <div className="progresivas-header">
        <h2>Gestión de Tramos</h2>
        <button onClick={handleShowCreateForm} className="new-progresiva-btn">
          <PlusIcon />
          Nuevo Tramo
        </button>
      </div>

      {showForm && createPortal(
        <div className="overlay">
          <div className="progresivas-form-container">
            <form className="progresivas-form">
              <h3>{editingId ? 'Editar Tramo' : 'Nuevo Tramo'}</h3>

              {/* Stepper Navigation */}
              <div className="stepper-container">
                <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                  <div className="step-counter">1</div>
                  <div className="step-name">Datos Principales</div>
                </div>
                <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                  <div className="step-counter">2</div>
                  <div className="step-name">Trazado</div>
                </div>
                <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                  <div className="step-counter">3</div>
                  <div className="step-name">Detalles</div>
                </div>
              </div>

              {/* Step 1: Main Details */}
              {step === 1 && (
                <div className="form-step-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Código</label>
                      <input type="number" name="codigo" value={formData.codigo} onChange={handleChange} placeholder="ejem 000" required min="0" step="1" max="9999" disabled={editingId !== null} />
                    </div>
                    <div className="form-group">
                      <label>Nombre del Tramo</label>
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Proyecto</label>
                      {selectedProjectId ? (
                        <p className="form-static-text">{selectedProjectName || 'Cargando nombre...'}</p>
                      ) : (
                        <select
                          name="selectedProjectId"
                          value={formData.selectedProjectId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Seleccionar Proyecto</option>
                          {proyectos.map(proyecto => (
                            <option key={proyecto.id} value={proyecto.id}>
                              {proyecto.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Alignment Configuration */}
              {step === 2 && (
                <div className="form-step-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Valor Total (metros)</label>
                      <input type="number" name="longitud_total" value={formData.longitud_total} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Intervalo (metros)</label>
                      <div className="intervalo-container">
                        {formData.isIntervalManual ? (
                          <input type="number" name="intervalo_manual" value={formData.intervalo_manual} onChange={handleChange} className="intervalo-input" />
                        ) : (
                          <select name="tipo_via" value={formData.tipo_via} onChange={handleChange} className="intervalo-select">
                            <option value="100">TIPO I - Autopistas (100m)</option>
                            <option value="250">Tipo II - Vias principales (250m)</option>
                            <option value="500">Tipo III - Vias secundarias (500m)</option>
                            <option value="1000">Tipo IV Vias locales (1000m)</option>
                          </select>
                        )}
                        <button type="button" className="btn-toggle-intervalo" onClick={() => setFormData(prev => ({ ...prev, isIntervalManual: !prev.isIntervalManual, intervalo_manual: '' }))}>
                          {formData.isIntervalManual ? 'Seleccionar' : 'Manual'}
                        </button>
                      </div>
                    </div>
                    <div className="form-group full-width">
                      <button type="button" onClick={handleGenerateSubProgresivas} className="btn-generar-progresivas">
                        Generar Progresivas
                      </button>
                    </div>
                  </div>
                  {generatedSubProgresivas.length > 0 && (
                    <div className="sub-progresivas-container">
                      <h4>Progresivas Generadas ({generatedSubProgresivas.length})</h4>
                      <ul className="sub-progresivas-list">
                        {generatedSubProgresivas.map((prog, index) => {
                          const cleanCode = prog.codigo.includes('-') ? prog.codigo.substring(prog.codigo.lastIndexOf('-') + 1) : prog.codigo;
                          return <li key={index}>{formatCodigoForDisplay(cleanCode)}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Additional Details */}
              {step === 3 && (
                <div className="form-step-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Zona</label>
                      <select name="linea" value={formData.linea} onChange={handleChange}>
                        <option value="17L">17L</option>
                        <option value="18L">18L</option>
                        <option value="19L">19L</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ubicación</label>
                      <div className="coordenadas-group">
                        <input type="text" name="coordenada_este" placeholder="Coord. Este" value={formData.coordenada_este} onChange={handleChange} />
                        <input type="text" name="coordenada_norte" placeholder="Coord. Norte" value={formData.coordenada_norte} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select name="estado" value={formData.estado} onChange={handleChange} required>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="completado">Completado</option>
                      </select>
                    </div>
                    <div className="form-group full-width">
                      <label>Descripción</label>
                      <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} />
                    </div>
                  </div>

                  {/* NEW: KML Upload Section for Progresiva */}
                  <fieldset>
                    <legend>Trazado KML (Opcional)</legend>
                    <div className="form-group">
                      <label htmlFor="kmlFileProgresiva">Archivo KML/KMZ</label>
                      <input
                        type="file"
                        id="kmlFileProgresiva"
                        name="kmlFileProgresiva"
                        accept=".kml,.kmz"
                        onChange={handleKmlFileChangeProgresiva}
                        disabled={isUploadingKmlProgresiva}
                      />
                      {isUploadingKmlProgresiva && (
                        <p className="loading-text">Subiendo KML... por favor espera.</p>
                      )}
                      {formData?.kml_filename && (
                        <div className="kml-info-display">
                          <p className="file-info">
                            KML actual: <strong>{formData.kml_filename}</strong> (cargado el {new Date(formData.kml_uploaded_at).toLocaleDateString()})
                          </p>
                          <button type="button" className="delete-kml-btn" onClick={handleDeleteKml}>
                            <DeleteIcon /> Eliminar KML
                          </button>
                        </div>
                      )}
                    </div>
                  </fieldset>

                  {/* NEW: KML Upload Section for Points (Puntos) */}
                  <fieldset>
                    <legend>Puntos Ref. KML (Opcional)</legend>
                    <div className="form-group">
                      <label htmlFor="kmlFilePuntos">Archivo KML/KMZ (Puntos)</label>
                      <input
                        type="file"
                        id="kmlFilePuntos"
                        name="kmlFilePuntos"
                        accept=".kml,.kmz"
                        onChange={handleKmlFileChangePuntos}
                        disabled={isUploadingKmlProgresiva}
                      />
                      {formData?.kml_puntos_filename && (
                        <div className="kml-info-display">
                          <p className="file-info">
                            Puntos KML actual: <strong>{formData.kml_puntos_filename}</strong>
                          </p>
                          <button type="button" className="delete-kml-btn" onClick={handleDeleteKmlPuntos}>
                            <DeleteIcon /> Eliminar Puntos
                          </button>
                        </div>
                      )}
                    </div>
                  </fieldset>
                  {/* END NEW: KML Upload Section */}

                </div>
              )}

              {/* Form Actions / Navigation */}
              <div className="form-actions">
                <button type="button" className="close-btn" onClick={handleCancelEdit}>Cancelar</button>
                <div className="wizard-nav-buttons">
                  {step > 1 && (
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>Anterior</button>
                  )}
                  {step < 3 ? (
                    <button type="button" className="submit-btn" onClick={handleNextStep}>Siguiente</button>
                  ) : (
                    <button type="button" className="submit-btn" disabled={submitting} onClick={handleSubmit}>{submitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Finalizar y Crear')}</button>
                  )}
                </div>
              </div>
              {componentError && <div className="error-message">{componentError}</div>}
            </form>
          </div>
        </div>,
        document.body
      )}

      {viewingDetails && progresivaDetails && (
        <div className="overlay" onClick={() => setViewingDetails(null)}>
          <div className="batch-details-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3>Detalles de {progresivaDetails.nombre}</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="file"
                  id="import-kml-points"
                  accept=".kml,.kmz"
                  style={{ display: 'none' }}
                  onChange={handleImportKmlPoints}
                />
                <button
                  className="btn-warning"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.9rem' }}
                  onClick={() => document.getElementById('import-kml-points').click()}
                >
                  <ImportIcon /> Importar Puntos KML
                </button>
              </div>
            </div>
            <div className="table-wrapper">
              {subProgresivas.length > 0 ? (
                <table className="progresivas-table horizontal-estratos">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Progresiva</th>
                      <th>Nombre</th>
                      <th>Lado</th>
                      <th>Descripción</th>
                      <th>Coord. Este</th>
                      <th>Coord. Norte</th>
                      <th>Zona</th>
                      <th>N° Estratos</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subProgresivas.map((p, subIndex) => (
                      <tr key={p.id} id={`prog-row-${p.id}`}>
                        <td>{subIndex + 1}</td>
                        <td>
                          {(() => {
                            const displayCode = p.codigo;
                            let actualProgresivaCode = displayCode;
                            const lastHyphenIndex = displayCode.lastIndexOf('-');
                            if (lastHyphenIndex !== -1) {
                              actualProgresivaCode = displayCode.substring(lastHyphenIndex + 1);
                            }
                            return formatCodigoForDisplay(actualProgresivaCode);
                          })()}</td>
                        <td>{p.nombre}</td>
                        <td>{getLadoDisplayName(p.lado)}</td>
                        <td className="descripcion-cell">{p.descripcion}</td>
                        <td>{formatNumber(p.coordenada_este)}</td>
                        <td>{formatNumber(p.coordenada_norte)}</td>
                        <td>{p.linea}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
                            {p.estratos_perfil ? p.estratos_perfil.length : 0}
                            {p.estratos_perfil && p.estratos_perfil.length > 0 && (
                              <button className="view-strata-btn" onClick={(e) => { e.stopPropagation(); handleViewEstratos(p); }}>
                                <EyeIcon />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={`status-badge ${getStatusClass(p.estado)}`}>
                            {p.estado}
                          </div>
                        </td>
                        <td className="actions-cell">
                          <button className="manage-btn" onClick={(e) => { e.stopPropagation(); handleManageProgresiva(p); }}>
                            <ManageIcon /> Gestionar
                          </button>
                          <button className="gallery-btn" onClick={(e) => { e.stopPropagation(); handleOpenGallery(p); }} title="Ver Fotos" style={{ marginLeft: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#0d6efd' }}>
                            <CameraIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No hay progresivas.</p>
              )}
            </div>
            <button onClick={() => setViewingDetails(null)} className="close-btn">Cerrar</button>
          </div>
        </div>
      )}

      {managingProgresiva && progresivaFormData && (
        <div className="overlay" onClick={() => setManagingProgresiva(null)}>
          <div className="progresivas-form-container" onClick={(e) => e.stopPropagation()}>
            <form className="progresivas-form" onSubmit={handleUpdateProgresiva}>
              <h3>Gestionar Progresiva: {getProgresivaCodeForDisplay(progresivaFormData.codigo)}</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Código</label>
                  <input type="text" name="codigo" value={getProgresivaCodeForInput(progresivaFormData.codigo)} onChange={handleProgresivaFormChange} required disabled />
                </div>
                <div className="form-group">
                  <label>Nombre</label>
                  <input type="text" name="nombre" value={progresivaFormData.nombre} onChange={handleProgresivaFormChange} required />
                </div>
                <div className="form-group">
                  <label>Lado</label>
                  <select name="lado" value={progresivaFormData.lado} onChange={handleProgresivaFormChange} required>
                    <option value="">Seleccionar Lado</option>
                    <option value="I">I - IZQUIERDA</option>
                    <option value="C">C - CENTRO</option>
                    <option value="D">D - DERECHA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ubicación</label>
                  <div className="coordenadas-group">
                    <input type="text" name="coordenada_este" placeholder="Coord. Este" value={progresivaFormData.coordenada_este || ''} onChange={handleProgresivaFormChange} />
                    <input type="text" name="coordenada_norte" placeholder="Coord. Norte" value={progresivaFormData.coordenada_norte || ''} onChange={handleProgresivaFormChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={progresivaFormData.estado} onChange={handleProgresivaFormChange} required>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="completado">Completado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en revision">En Revisión</option>
                    <option value="aprobado">Aprobado</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Descripción</label>
                  <textarea name="descripcion" value={progresivaFormData.descripcion} onChange={handleProgresivaFormChange} />
                </div>

                <div className="form-group full-width">
                  <h4>Perfil de Estratos</h4>
                  <div className="estratos-editor-list">
                    {estratosPerfil.map((estrato, index) => (
                      <div className="estrato-editor-row" key={index}>
                        <div className="estrato-input-group">
                          <label>Prof. Inicial (m)</label>
                          <input type="number" name="profundidad_inicial" value={estrato.profundidad_inicial} onChange={(e) => handleEstratoChange(index, e)} readOnly required />
                        </div>
                        <div className="estrato-input-group">
                          <label>Prof. Final (m)</label>
                          <input type="number" step="any" name="profundidad_final" value={estrato.profundidad_final} onChange={(e) => handleEstratoChange(index, e)} required />
                        </div>
                        <div className="estrato-input-group estrato-descripcion-group">
                          <label>Descripción</label>
                          <textarea name="descripcion" value={estrato.descripcion} onChange={(e) => handleEstratoChange(index, e)} rows="1"></textarea>
                        </div>
                        <div className="estrato-actions">
                          <button type="button" onClick={() => handleRemoveEstrato(index)} className="remove-estrato-btn" disabled={index === 0}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={handleAddEstrato} className="add-estrato-btn-modern">
                    <PlusIcon /> Añadir Estrato
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="close-btn" onClick={() => setManagingProgresiva(null)}>Cancelar</button>
                <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Guardando...' : 'Actualizar Progresiva'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingEstratos && (
        <div className="overlay" onClick={() => setViewingEstratos(null)}>
          <div className="batch-details-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Resumen de Estratos: {viewingEstratos.codigo}</h3>
            <div className="table-wrapper">
              {(viewingEstratos.estratos_perfil && viewingEstratos.estratos_perfil.length > 0) ? (
                <table className="estratos-summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Prof. Inicial (m)</th>
                      <th>Prof. Final (m)</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingEstratos.estratos_perfil.map((estrato, index) => (
                      <React.Fragment key={estrato.id || index}>
                        <tr>
                          <td>{index + 1}</td>
                          <td>{estrato.profundidad_inicial}</td>
                          <td>{estrato.profundidad_final}</td>
                          <td className="descripcion-cell">{estrato.descripcion}</td>
                          <td>
                            <button className="action-btn view" onClick={(e) => { e.stopPropagation(); toggleEnsayos(estrato.id); }}>
                              <i className="fas fa-eye"></i> Ver Ensayos ({estrato.ensayos ? estrato.ensayos.length : 0})
                            </button>
                          </td>
                        </tr>
                        {expandedEnsayos[estrato.id] && (
                          <tr>
                            <td colSpan="5">
                              <div className="ensayos-container">
                                <div className="ensayos-header">
                                  <h4>Ensayos realizados</h4>
                                  <button className="btn btn-secondary btn-sm addEnsayosBtn">
                                    <i className="fas fa-plus"></i> Nuevo Ensayo
                                  </button>
                                </div>
                                <div className="ensayos-list">
                                  {estrato.ensayos && estrato.ensayos.length > 0 ? (
                                    estrato.ensayos.map((ensayo, ensayoIndex) => (
                                      <div className="ensayo-card" key={ensayoIndex}>
                                        <div className="ensayo-header">
                                          <div className="ensayo-title">{ensayo.type}</div>
                                          <div className="ensayo-date">{ensayo.date}</div>
                                        </div>
                                        <div className="ensayo-details">
                                          <div className="detail-item">
                                            <span className="detail-label">Método</span>
                                            <span className="detail-value">{ensayo.method}</span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Resultado</span>
                                            <span className="detail-value" style={{ color: ensayo.status === 'Aprobado' ? 'var(--secondary)' : ensayo.status === 'Pendiente' ? 'var(--warning)' : 'var(--info)' }}>{ensayo.status}</span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Responsable</span>
                                            <span className="detail-value">{ensayo.responsible}</span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Estado</span>
                                            <span className="detail-value" style={{ color: ensayo.status === 'Aprobado' ? 'var(--secondary)' : ensayo.status === 'Pendiente' ? 'var(--warning)' : 'var(--info)' }}>{ensayo.status}</span>
                                          </div>
                                        </div>
                                        <div className="ensayo-actions">
                                          <button className="action-btn edit"><i className="fas fa-edit"></i></button>
                                          <button className="action-btn delete"><i className="fas fa-trash"></i></button>
                                          <button className="action-btn view"><i className="fas fa-eye"></i></button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p>No hay ensayos registrados para este estrato.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Esta progresiva no tiene estratos definidos.</p>
              )}
            </div>
            <div className="profundidad-final-display">
              <label>Profundidad Final Total (m):</label>
              <span>
                {viewingEstratos.estratos_perfil && viewingEstratos.estratos_perfil.length > 0
                  ? viewingEstratos.estratos_perfil[viewingEstratos.estratos_perfil.length - 1].profundidad_final
                  : 0}
              </span>
            </div>
            <button onClick={() => setViewingEstratos(null)} className="close-btn">Cerrar</button>
          </div>
        </div>
      )}

      {showMapModal && ( // NEW: Render KmlMapModal
        <KmlMapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          progresiva={selectedKmlProgresiva}
          subProgresivas={subProgresivas} // Pass all sub-progresivas data
          canterasData={canterasData} // NEW: Pass canteras data for popups
        />
      )}

      {showProjectSelectionForImport && (
        <div className="overlay">
          <div className="progresivas-form-container"> {/* Reusing the form container style */}
            <form className="progresivas-form" onSubmit={(e) => {
              e.preventDefault();
              if (selectedProjectForImport) {
                processImportFile(fileToImport, selectedProjectForImport, 'new');
                setShowProjectSelectionForImport(false);
                setFileToImport(null); // Clear the stored file
                setSelectedProjectForImport(''); // Clear selected project
              } else {
                alertify.error('Por favor, selecciona un proyecto.');
              }
            }}>
              <h3>Seleccionar Proyecto para Importación</h3>
              <div className="form-group">
                <label>Proyecto</label>
                <select
                  name="selectedProjectForImport"
                  value={selectedProjectForImport}
                  onChange={(e) => setSelectedProjectForImport(e.target.value)}
                  required
                >
                  <option value="">Seleccionar Proyecto</option>
                  {proyectos.map(proyecto => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="close-btn" onClick={() => {
                  setShowProjectSelectionForImport(false);
                  setFileToImport(null);
                  setSelectedProjectForImport('');
                  document.getElementById('import-excel-progresivas').value = null; // Clear file input
                }}>Cancelar</button>
                <button type="submit" className="submit-btn">Confirmar Importación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="progresivas-table-container">
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <table className="progresivas-table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={handleSelectAll} /></th>
                <th>Tramo</th>
                <th>Detalles</th>
                <th>Valor total</th>
                <th>Intervalo</th>
                <th>Proyecto</th>
                <th>Coord. Este</th>
                <th>Coord. Norte</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {progresivas.map((p) => (
                <tr key={p.id} className={selectedIds.includes(p.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleSelect(p.id)}
                      disabled={p.es_principal}
                      title={p.es_principal ? "Tramo Principal (Indestructible)" : "Seleccionar"}
                    />
                  </td>
                  <td><div className="caja-sombreada" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {p.nombre} {p.es_principal && <span style={{ color: 'gold', cursor: 'help' }} title="Tramo Principal">⭐</span>}
                  </div></td>
                  <td><div className="caja-sombreada">{p.descripcion}</div></td>
                  <td><div className="caja-sombreada">{p.longitud_total}</div></td>
                  <td><div className="caja-sombreada">{p.intervalo_manual || p.tipo_via}</div></td>
                  <td><div className="caja-sombreada">{p.proyecto_nombre || 'N/A'}</div></td>
                  <td><div className="caja-sombreada">{p.coordenada_este}</div></td>
                  <td><div className="caja-sombreada">{p.coordenada_norte}</div></td>
                  <td>
                    <div className={`status-badge ${getStatusClass(p.estado)}`}>
                      {p.estado}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="view-btn" onClick={() => handleViewDetails(p)} title="Ver Detalles"><EyeIcon /></button>
                    <button className="edit-btn" onClick={() => handleEdit(p)} title="Editar"><EditIcon /></button>
                    {p.kml_trazado_id && ( // Conditionally render if KML exists
                      <button className="map-btn" onClick={() => handleViewKmlMap(p)} title="Ver KML en Mapa"><MapIcon /></button>
                    )}
                    <label className="docx-upload-btn" title="Importar Panel Fotográfico (Word)" style={{ marginLeft: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#2b5797' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="file"
                        accept=".docx"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocxUpload(e, p.id)}
                        disabled={isUploadingDocx}
                      />
                      {isUploadingDocx ? <span style={{ fontSize: '10px' }}>...</span> : <WordIcon />}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="progresivas-actions-bottom">
        {/* Group 1: Destructive Actions */}
        <div className="button-group">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="delete-bulk-btn">
              <DeleteIcon />
              Eliminar ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Group 2: I/O Actions */}
        <div className="button-group">
          <label htmlFor="import-excel-progresivas" className="btn-importar">
            <ImportIcon />
            Importar Excel
            <input type="file" id="import-excel-progresivas" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
          </label>
          {selectedIds.length > 0 && (
            <button onClick={handleExportToExcel} className="export-excel-btn">
              <ExportIcon />
              Exportar ({selectedIds.length})
            </button>
          )}
          <button onClick={handleDownloadTemplate} className="btn-descargar-plantilla">
            <ExportIcon />
            Descargar Plantilla
          </button>
        </div>

        {/* Group 3: Navigation */}
        <div className="button-group">
          {selectedIds.length === 1 && (
            <button className="btn-navegar" onClick={handleNavigateToGestor}>
              <ManageIcon />
              Gestionar Tramo
            </button>
          )}
          <button className="btn-navegar" onClick={navigateToProyectos}>
            <ProjectsIcon />
            Ver Proyectos
          </button>
        </div>
      </div>
      {showGalleryModal && (
        <ProgresivaImageGalleryModal
          isOpen={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
          progresiva={galleryProgresiva}
        />
      )}

      {isUploadingDocx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 999999, backdropFilter: 'blur(5px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          {uploadProgress < 100 ? (
            <>
              <div style={{ width: '300px', height: '20px', backgroundColor: '#555', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
                <div style={{
                  height: '100%', width: `${uploadProgress}%`,
                  backgroundColor: '#3498db', transition: 'width 0.2s ease'
                }}></div>
              </div>
              <h3 style={{ fontFamily: 'sans-serif' }}>Subiendo documento: {uploadProgress}%</h3>
              <p style={{ opacity: 0.8 }}>Por favor espere...</p>
            </>
          ) : (
            <>
              <div style={{
                width: '60px', height: '60px', border: '6px solid #f3f3f3',
                borderTop: '6px solid #2ecc71', borderRadius: '50%', animation: 'spin 1.5s linear infinite'
              }}></div>
              <h3 style={{ marginTop: '25px', fontFamily: 'sans-serif' }}>Procesando imágenes...</h3>
              <p style={{ fontFamily: 'sans-serif', opacity: 0.9 }}>Extrayendo y organizando fotos.</p>
            </>
          )}
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
};

export default Progresivas;
