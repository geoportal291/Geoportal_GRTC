import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import '../../suelos/proyectos/GestorProyectos.css';
import alertify from 'alertifyjs';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../data/contexts/AuthContext';
import FormularioEnsayo from '../ensayos/FormularioEnsayo';
import EstratoItem from '../estratos/EstratoItem'; // Import the new EstratoItem component
import PerfilEstratigraficoModal from '../estratos/PerfilEstratigraficoModal'; // Import the new PerfilEstratigraficoModal component
import VisorGraficosProgresivaModal from '../estratos/VisorGraficosProgresivaModal'; // NEW: Import VisorGraficosProgresivaModal

// --- Pagination Component ---
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const getPaginationNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 4) {
                pages.push('...');
            }
            let start = Math.max(2, currentPage - 2);
            let end = Math.min(totalPages - 1, currentPage + 2);

            if (currentPage <= 4) {
                start = 2;
                end = 5;
            }
            if (currentPage >= totalPages - 3) {
                start = totalPages - 4;
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 3) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
        return pages;
    };

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="pagination-container">
            <button onClick={handlePrevious} disabled={currentPage === 1} className="pagination-button">
                &laquo; Anterior
            </button>
            {getPaginationNumbers().map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="pagination-ellipsis">{page}</span>
                )
            )}
            <button onClick={handleNext} disabled={currentPage === totalPages} className="pagination-button">
                Siguiente &raquo;
            </button>
        </div>
    );
};




// Memoized ProgressivaItem Component
const ForwardedProgressivaItem = React.forwardRef(({ progresiva, expandedProgresivas, toggleProgresiva, expandedEstratos, toggleEstrato, handleGestionarEstratos, formatCodigoForDisplay, handleEditProgresiva, handleOpenEnsayoModal, handleDeleteEnsayo, handleEditEnsayo, handleViewEnsayo, handleViewGraficos }, ref) => { // MODIFIED: handleViewPerfil -> handleViewGraficos
    return (
        <div ref={ref} key={progresiva.id} className={`progresiva-item ${expandedProgresivas[progresiva.id] ? 'progresiva-expanded' : ''}`}>

            <div className="progressiva-header" onClick={() => toggleProgresiva(progresiva.id)}>
                <div className="progressiva-info">
                    <div className="progressiva-icon"><i className="fas fa-map-pin"></i></div>
                    <div className="progressiva-details">
                        <div className="progresiva-title-line">
                            <h3>
                                <span className="station-format">{formatCodigoForDisplay(progresiva.codigo.split('-').pop())}</span>
                                {progresiva.nombre && <span className="progresiva-name"> - {progresiva.nombre}</span>}
                            </h3>
                            <div className="coordenadas-display">
                                <div className="coordenada-item">
                                    <strong>E:</strong> {progresiva.coordenada_este || 'N/A'}
                                </div>
                                <div className="coordenada-item">
                                    <strong>N:</strong> {progresiva.coordenada_norte || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="progressiva-meta">
                    <div className="meta-group">
                        <div className="meta-item">
                            <i className="fas fa-layer-group"></i>
                            <span>
                                {progresiva.estratos_perfil ? progresiva.estratos_perfil.length : 0} Estratos
                            </span>
                        </div>
                        <div className="meta-item">
                            <i className="fas fa-flask"></i>
                            <span>
                                {progresiva.estratos_perfil
                                    ? progresiva.estratos_perfil.reduce(
                                        (total, estrato) => total + (estrato.ensayos ? estrato.ensayos.length : 0),
                                        0
                                    )
                                    : 0}{' '}
                                Ensayos
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="action-btn edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditProgresiva(progresiva);
                        }}
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                </div>

            </div>
            <div className={`estratos-container ${expandedProgresivas[progresiva.id] ? 'expanded' : ''}`}>
                <div className="estratos-header">
                    <h3 className="estratos-title"><i className="fas fa-layer-group"></i> Estratos identificados</h3>
                    <div className="estratos-header-actions">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleViewGraficos(progresiva); }} className="btn btn-outline"> {/* MODIFIED */}
                            <i className="fas fa-chart-bar"></i> Ver Gráficos
                        </button>
                        <button type="button" onClick={() => handleGestionarEstratos(progresiva)} className="btn btn-outline">
                            <i className="fas fa-plus"></i> Añadir Estrato
                        </button>
                    </div>
                </div>
                {progresiva.estratos_perfil && progresiva.estratos_perfil.length > 0 ? (
                    progresiva.estratos_perfil.map((estrato) => (
                        <EstratoItem
                            key={estrato.id || `estrato-${estrato.estrato_nombre}-${estrato.profundidad_inicial}`}
                            estrato={estrato}
                            expandedEstratos={expandedEstratos}
                            onToggle={toggleEstrato}
                            handleGestionarEstratos={handleGestionarEstratos}
                            progresiva={progresiva} // Pass progresiva to EstratoItem for handleGestionarEstratos
                            onAddEnsayo={handleOpenEnsayoModal}
                            handleDeleteEnsayo={handleDeleteEnsayo}
                            handleEditEnsayo={handleEditEnsayo} // Pass handleEditEnsayo
                            handleViewEnsayo={handleViewEnsayo} // Pass handleViewEnsayo
                        />
                    ))
                ) : <p>No hay estratos definidos.</p>}
            </div>
        </div>
    );
});

const ProgressivaItem = React.memo(ForwardedProgressivaItem);


export default function GestorDeTramosActual() {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedProjectId, user } = useAuth();
    const [tramos, setTramos] = useState([]);
    const [tramoSeleccionado, setTramoSeleccionado] = useState(null);
    const [subProgresivas, setSubProgresivas] = useState([]);
    const [, setLoading] = useState(false);
    const [loadingProgresivas, setLoadingProgresivas] = useState(false);
    const [, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('progresivas');

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalProgresivas, setTotalProgresivas] = useState(0);
    const totalPages = Math.ceil(totalProgresivas / itemsPerPage);

    const [expandedProgresivas, setExpandedProgresivas] = useState({});
    const [expandedEstratos, setExpandedEstratos] = useState({});
    const [selectedProgresivaId, setSelectedProgresivaId] = useState(null); // NEW STATE

    // State for Strata Modal
    const [showGestionarEstratosModal, setShowGestionarEstratosModal] = useState(false);
    const [progresivaParaGestionar, setProgresivaParaGestionar] = useState(null);
    const [estratosEnEdicion, setEstratosEnEdicion] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const progresivaRefs = useRef({});

    // State for Edit Progresiva Modal
    const [showEditProgresivaModal, setShowEditProgresivaModal] = useState(false);
    const [progresivaToEdit, setProgresivaToEdit] = useState(null);
    const [progresivaFormData, setProgresivaFormData] = useState(null);

    // State for Assay Form Modal
    const [showEnsayoModal, setShowEnsayoModal] = useState(false);
    const [currentProgresivaForAssay, setCurrentProgresivaForAssay] = useState(null);
    const [currentEstratoForAssay, setCurrentEstratoForAssay] = useState(null);
    const [ensayoToEdit, setEnsayoToEdit] = useState(null); // New state for assay to edit

    // --- State for Listado General ---
    const [subProgresivasList, setSubProgresivasList] = useState([]);
    const [isLoadingListado, setIsLoadingListado] = useState(false);
    const [listadoDataCache, setListadoDataCache] = useState({});

    // State for Estratos Summary Modal
    const [viewingEstratos, setViewingEstratos] = useState(null);
    const [expandedEnsayos, setExpandedEnsayos] = useState({});
    const [selectedEnsayoInModal, setSelectedEnsayoInModal] = useState(null);

    // NEW: State for graphics modal
    const [viewingGraficosFor, setViewingGraficosFor] = useState(null);

    const toggleEnsayos = (estratoId) => {
        setExpandedEnsayos(prev => ({ ...prev, [estratoId]: !prev[estratoId] }));
    };

    const handleSelectEnsayoInModal = (ensayoId) => {
        setSelectedEnsayoInModal(prevId => prevId === ensayoId ? null : ensayoId);
    };

    useEffect(() => {
        if (progresivaToEdit) {
            setProgresivaFormData({ ...progresivaToEdit });
        }
    }, [progresivaToEdit]);

    const handleProgresivaFormChange = (e) => {
        const { name, value } = e.target;
        setProgresivaFormData(prev => ({ ...prev, [name]: value }));
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

    const fetchProgresivas = useCallback(async (tramoId, page, search = '') => {
        setLoadingProgresivas(true);
        try {
            const headers = getAuthHeaders();

            let url = `${API_URL}/api/progresivas/${tramoId}/children?page=${page}&limit=${itemsPerPage}`;
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const res = await axios.get(url, { headers });
            const responseData = res.data;

            if (responseData && typeof responseData === 'object' && responseData.data) {
                const processedData = responseData.data.map(progresiva => ({
                    ...progresiva,
                    estratos_perfil: (progresiva.estratos_perfil || []).map(estrato => ({
                        ...estrato,
                        ensayos: estrato.ensayos || []
                    }))
                }));
                setSubProgresivas(processedData);
                setTotalProgresivas(responseData.total);
                setCurrentPage(page);
            } else {
                setSubProgresivas([]);
                setTotalProgresivas(0);
            }
        } catch (err) {
            if (err.message !== 'Token no proporcionado') {
                alertify.error('Error al cargar las progresivas del tramo.');
                setSubProgresivas([]);
                setTotalProgresivas(0);
            }
        } finally {
            setLoadingProgresivas(false);
        }
    }, [API_URL, getAuthHeaders, itemsPerPage]);

    const fetchListadoGeneral = useCallback(async (tramoId) => {
        setIsLoadingListado(true);
        try {
            const headers = getAuthHeaders();
            const res = await axios.get(`${API_URL}/api/progresivas/${tramoId}/children/all`, { headers });

            const processedData = res.data.filter(Boolean).map(subProg => ({
                ...subProg,
                estratos_perfil: (subProg.estratos_perfil || []).map(estrato => ({
                    ...estrato,
                    ensayos: estrato.ensayos || []
                }))
            }));

            setSubProgresivasList(processedData);
            setListadoDataCache(prev => ({ ...prev, [tramoId]: processedData }));

        } catch (err) {
            if (err.message !== 'Token no proporcionado') {
                alertify.error(`Error al cargar el listado general: ${err.response?.data?.error || err.message}`);
            }
        } finally {
            setIsLoadingListado(false);
        }
    }, [API_URL, getAuthHeaders]);

    const handleSelectTramo = useCallback(async (tramo, page = 1) => {
        setTramoSeleccionado(tramo);
        setActiveTab('progresivas');
        setExpandedProgresivas({});
        setExpandedEstratos({}); // Clear expanded estratos too
        setSelectedProgresivaId(null); // NEW: Clear selected progresiva
        setSubProgresivasList([]); // Clear previous list
        setSearchTerm(''); // Reset search term on new tramo selection
        await fetchProgresivas(tramo.id, page); // Use the page parameter
    }, [fetchProgresivas]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'listado' && tramoSeleccionado && !listadoDataCache[tramoSeleccionado.id]) {
            fetchListadoGeneral(tramoSeleccionado.id);
        }
    };

    const fetchTramos = useCallback(async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const url = selectedProjectId
                ? `${API_URL}/api/progresivas?selectedProjectId=${selectedProjectId}`
                : `${API_URL}/api/progresivas`;

            const res = await axios.get(url, { headers });
            setTramos(res.data);

        } catch (err) {
            if (err.message !== 'Token no proporcionado') {
                setError('No se pudieron cargar los tramos.');
            }
        } finally {
            setLoading(false);
        }
    }, [API_URL, getAuthHeaders, selectedProjectId]);

    // NEW: Handle Initial Selection (Default vs Deep Link)
    useEffect(() => {
        if (tramos.length > 0 && !tramoSeleccionado) {
            const state = location.state || {};
            const hasDeepLink = state.activeTramoId || state.tramoId || state.openTramoId;

            // Only select default if NO deep link is trying to set a specific one
            if (!hasDeepLink) {
                handleSelectTramo(tramos[0]);
            }
        }
    }, [tramos, tramoSeleccionado, location.state, handleSelectTramo]);

    useEffect(() => {
        const state = location.state || {};
        const tramoId = state.activeTramoId || state.tramoId || state.openTramoId;
        const progresivaId = state.activeProgresivaId || state.progresivaId || state.openProgresivaId;
        const estratoId = state.estratoId;

        console.log('>>> [GestorDeTramos] Deep Link Analysis:', { tramoId, progresivaId, estratoId });

        // Ensure strictly integer comparison if IDs are numbers
        const pId = progresivaId ? Number(progresivaId) : null;
        const tId = tramoId ? Number(tramoId) : null;

        if (tId && tramos.length > 0) {
            const tramoToSelect = tramos.find(t => t.id === tId);

            // Case 1: Switching Tramos or No Tramo Selected
            if (tramoToSelect && (!tramoSeleccionado || tramoSeleccionado.id !== tId)) {
                setTramoSeleccionado(tramoToSelect);
                setActiveTab('progresivas');

                if (pId) {
                    const fetchPageAndExpand = async () => {
                        try {
                            const headers = getAuthHeaders();
                            const res = await axios.get(`${API_URL}/api/progresivas/${pId}/page`, { headers });
                            const { page } = res.data;

                            // Always fetch to ensure data is fresh and page is correct
                            await fetchProgresivas(tramoToSelect.id, page);

                            // Expand and Select
                            setExpandedProgresivas(prev => ({ ...prev, [pId]: true }));
                            if (estratoId) setExpandedEstratos(prev => ({ ...prev, [estratoId]: true }));
                            setSelectedProgresivaId(pId);

                            // Clean URL state
                            navigate(location.pathname, { replace: true, state: {} });
                        } catch (err) {
                            console.error('Error handling deep link (new tramo):', err);
                            fetchProgresivas(tramoToSelect.id, 1);
                        }
                    };
                    fetchPageAndExpand();
                } else {
                    fetchProgresivas(tramoToSelect.id, 1);
                }
            }
            // Case 2: Tramo Already Selected - Just Need to Expand/Scroll
            else if (tramoSeleccionado && tramoSeleccionado.id === tId && pId) {
                const handleExistingTramoDeepLink = async () => {
                    console.log('>>> [GestorDeTramos] Case 2: Handling Valid Deep Link for pId:', pId);
                    try {
                        const headers = getAuthHeaders();
                        // Verify page just in case
                        const res = await axios.get(`${API_URL}/api/progresivas/${pId}/page`, { headers });
                        const { page } = res.data;
                        console.log('>>> [GestorDeTramos] Page Check:', { apiPage: page, currentPage });

                        // Force fetch if page is different OR to ensure children are loaded
                        if (page !== currentPage) {
                            console.log('>>> [GestorDeTramos] Pages mismatch, fetching page:', page);
                            await fetchProgresivas(tramoSeleccionado.id, page);
                        } else {
                            console.log('>>> [GestorDeTramos] Page matches, proceeding to expand.');
                        }

                        // Force expansion logic even if already expanded (to trigger scroll effects if needed)
                        setExpandedProgresivas(prev => ({ ...prev, [pId]: true }));
                        if (estratoId) setExpandedEstratos(prev => ({ ...prev, [estratoId]: true }));
                        setSelectedProgresivaId(pId);

                        // Trigger Scroll
                        setTimeout(() => {
                            const el = progresivaRefs.current[pId];
                            console.log('>>> [GestorDeTramos] Attempting Scroll. Ref found?', !!el);

                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Add a temporary highlight class if desired
                                el.classList.add('highlight-pulse');
                                setTimeout(() => el.classList.remove('highlight-pulse'), 2000);
                            } else {
                                console.warn('>>> [GestorDeTramos] SCROLL FAILED: Ref not found for pId', pId);
                            }
                        }, 800); // Increased delay slightly to be safe

                        navigate(location.pathname, { replace: true, state: {} });
                    } catch (e) { console.error('Error handling deep link (existing tramo):', e); }
                };
                handleExistingTramoDeepLink();
            }
        }
    }, [location.state, tramos, tramoSeleccionado, getAuthHeaders, API_URL, navigate, fetchProgresivas, currentPage]);

    // Secondary Effect for Scrolling when list is loaded (subProgresivas changes)
    useEffect(() => {
        const state = location.state || {}; // React Router state persists until cleared/navigation
        // But we cleared it in the previous effect? Not necessarily if subProgresivas wasn't ready.
        // Let's use a local ref or simpler check. 
        // Actually, the previous effect handles the fetch. This effect handles the SCROLL once data arrives.

        // However, since we cleared state in the previous effect, this might miss. 
        // Let's RELY on the 'selectedProgresivaId' state which we set in the previous effect.

        if (selectedProgresivaId && subProgresivas.length > 0) {
            const element = progresivaRefs.current[selectedProgresivaId];
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        }
    }, [subProgresivas, selectedProgresivaId]);

    useEffect(() => {
        fetchTramos();
    }, [fetchTramos]);

    const scrollableContentRef = useRef(null);
    useEffect(() => {
        if (scrollableContentRef.current) {
            scrollableContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const handlePageChange = (page) => {
        if (tramoSeleccionado) {
            fetchProgresivas(tramoSeleccionado.id, page, searchTerm);
        }
    };

    const handleSearch = () => {
        // Now, this function only applies to the "Progresivas" tab with backend pagination
        if (activeTab === 'progresivas' && tramoSeleccionado) {
            fetchProgresivas(tramoSeleccionado.id, 1, searchTerm);
        }
        // For the "Listado" tab, filtering is handled client-side, so no new fetch is needed.
    };

    const toggleProgresiva = (progresivaId) => {
        setExpandedProgresivas(prev => ({ ...prev, [progresivaId]: !prev[progresivaId] }));
        setExpandedEstratos({});
        setSelectedProgresivaId(progresivaId); // NEW: Set the selected progresiva
    };

    const toggleEstrato = (estratoId) => {
        setExpandedEstratos(prev => ({ ...prev, [estratoId]: !prev[estratoId] }));
    };

    const handleGestionarEstratos = (progresiva) => {
        setProgresivaParaGestionar(progresiva);
        setEstratosEnEdicion(JSON.parse(JSON.stringify(progresiva.estratos_perfil || [])));
        setShowGestionarEstratosModal(true);
    };

    const handleEstratoChange = (index, e) => {
        const { name, value } = e.target;
        setEstratosEnEdicion(prev => {
            const newPerfil = [...prev];
            newPerfil[index] = { ...newPerfil[index], [name]: value };
            return newPerfil;
        });
    };

    const handleAddEstrato = () => {
        setEstratosEnEdicion(prev => {
            const newEstrato = {
                id: `temp-${Date.now()}`, // Use a temporary ID for new estratos
                nombre: '',
                descripcion: '',
                cota_inicial: prev.length > 0 ? parseFloat(prev[prev.length - 1].cota_final) : 0,
                cota_final: '',
                orden: prev.length,
            };
            return [...prev, newEstrato];
        });
    };

    const handleRemoveEstrato = (indexToRemove) => {
        setEstratosEnEdicion(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleEditProgresiva = (progresiva) => {
        setProgresivaToEdit(progresiva);
        setShowEditProgresivaModal(true);
    };

    const handleCloseEditProgresivaModal = () => {
        setProgresivaToEdit(null);
        setShowEditProgresivaModal(false);
    };

    const handleUpdateProgresiva = async (e) => {
        e.preventDefault();
        if (!progresivaFormData) return;
        setSubmitting(true);
        try {
            const headers = getAuthHeaders();
            const payload = { ...progresivaFormData, estratos_perfil: undefined };
            await axios.put(`${API_URL}/api/progresivas/child/${progresivaFormData.id}`, payload, { headers });
            alertify.success('Progresiva actualizada.');
            handleCloseEditProgresivaModal();
            fetchProgresivas(tramoSeleccionado.id, currentPage);
        } catch (err) {
            alertify.error(`Error al actualizar la progresiva: ${err.response?.data?.error || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateEstratos = async (e) => {
        e.preventDefault();
        if (!progresivaParaGestionar) return;
        setSubmitting(true);
        try {
            const headers = getAuthHeaders();

            // Send all strata (new and existing) to the backend. The backend is now equipped to handle creation of new strata.
            const payload = { ...progresivaParaGestionar, estratos_perfil: estratosEnEdicion };
            payload.estratos_perfil.forEach((estrato, index) => {
                console.log(`Estrato ${index}:`, estrato);
            });
            await axios.put(`${API_URL}/api/progresivas/child/${progresivaParaGestionar.id}`, payload, { headers });
            alertify.success('Estratos actualizados correctamente.');
            setShowGestionarEstratosModal(false);
            fetchProgresivas(tramoSeleccionado.id, currentPage);
        } catch (err) {
            alertify.error(`Error al actualizar los estratos: ${err.response?.data?.error || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEnsayoModal = (progresiva, estrato) => {
        setCurrentProgresivaForAssay(progresiva);
        setCurrentEstratoForAssay(estrato);
        setEnsayoToEdit(null); // Ensure it's null for new assay
        setShowEnsayoModal(true);
    };

    const handleEditEnsayo = (progresiva, estrato, ensayo) => {
        setCurrentProgresivaForAssay(progresiva);
        setCurrentEstratoForAssay(estrato);
        setEnsayoToEdit(ensayo); // Set the assay to be edited
        setShowEnsayoModal(true);
    };

    const handleCloseEnsayoModal = () => {
        setShowEnsayoModal(false);
        setCurrentProgresivaForAssay(null);
        setCurrentEstratoForAssay(null);
    };

    const handleAssayCreated = () => {
        setShowEnsayoModal(false);
        if (tramoSeleccionado) {
            fetchProgresivas(tramoSeleccionado.id, currentPage);
        }
    };

    const handleDeleteEnsayo = async (ensayoId) => {
        alertify.confirm(
            'Eliminar Ensayo',
            '¿Está seguro que desea eliminar este ensayo?',
            async function () {
                try {
                    const headers = getAuthHeaders();
                    await axios.delete(`${API_URL}/api/ensayos/${ensayoId}`, { headers });
                    alertify.success('Ensayo eliminado correctamente.');
                    if (tramoSeleccionado) {
                        fetchProgresivas(tramoSeleccionado.id, currentPage);
                    }
                } catch (err) {
                    console.error('Error al eliminar ensayo:', err);
                    alertify.error(err.response?.data?.mensaje || 'Error al eliminar ensayo. Intenta nuevamente.');
                }
            },
            function () {
                alertify.message('Eliminación cancelada');
            }
        );
    };

    // ***************************************************
    // ** CORRECCIÓN: Definición de handleViewGraficos **
    // ***************************************************
    const handleViewGraficos = (progresiva) => {
        setViewingGraficosFor(progresiva);
    };
    // ***************************************************


    const handleViewEnsayo = (ensayo) => {
        const assayDetails = `
    <div class="ensayo-details-modal-container">
        <div class="ensayo-details-modal-header">
            <i class="fas fa-vial"></i>
            <h2>Detalles del Ensayo</h2>
        </div>
        <div class="ensayo-details-modal-content">
            <div class="modal-detail-item">
                <i class="fas fa-tag"></i>
                <span class="modal-detail-label">Nombre:</span>
                <span class="modal-detail-value">${ensayo.nombre_ensayo}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-flask"></i>
                <span class="modal-detail-label">Tipo:</span>
                <span class="modal-detail-value">${ensayo.tipo_ensayo_descripcion || ensayo.tipo_ensayo}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-calendar-alt"></i>
                <span class="modal-detail-label">Fecha:</span>
                <span class="modal-detail-value">${formatDateForDisplay(ensayo.fecha)}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-chart-bar"></i>
                <span class="modal-detail-label">Resultado:</span>
                <span class="modal-detail-value">${ensayo.resultado}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-user"></i>
                <span class="modal-detail-label">Responsable:</span>
                <span class="modal-detail-value">${ensayo.responsable_nombre || 'N/A'}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-info-circle"></i>
                <span class="modal-detail-label">Estado:</span>
                <span class="modal-detail-value status-badge status-${ensayo.estado?.toLowerCase()}">${ensayo.estado}</span>
            </div>
        </div>
    </div>
    `;
        // Remove the default title and padding from alertify to use our own
        alertify.alert('', assayDetails).set('padding', false);
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        // The date from the DB is a string like '2025-11-10T00:00:00.000Z'.
        // new Date() parses this as UTC. Instead of relying on toLocaleDateString with a timeZone option,
        // which can be inconsistent, we'll manually get the UTC parts of the date.
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
        const day = date.getUTCDate();
        // Format it as DD/MM/YYYY or MM/DD/YYYY depending on locale preference.
        // Let's stick to a common format like DD/MM/YYYY.
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    };

    const formatCodigoForDisplay = (codigo) => {
        if (!codigo || typeof codigo !== 'string') return codigo;
        if (codigo.includes('+')) return codigo.replace(/\++/g, '+');
        if (codigo.length < 4) return `0+${codigo.padStart(3, '0')}`;
        const km = codigo.substring(0, codigo.length - 3) || "0";
        const meters = codigo.substring(codigo.length - 3);
        return `${km}+${meters}`;
    };

    const getProgresivaCodeForDisplay = (fullCode) => {
        if (typeof fullCode !== 'string') return fullCode;
        const lastHyphenIndex = fullCode.lastIndexOf('-');
        if (lastHyphenIndex !== -1) {
            return fullCode.substring(lastHyphenIndex + 1);
        }
        return fullCode;
    };

    const getProgresivaCodeForInput = (fullCode) => {
        const code = getProgresivaCodeForDisplay(fullCode);
        if (typeof code === 'string') return code.replace(/\+/g, '');
        return code;
    };

    // Filter for "Listado General" tab
    const filteredListado = React.useMemo(() => {
        if (!searchTerm) {
            return subProgresivasList;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return subProgresivasList.filter(p => {
            const codigo = formatCodigoForDisplay(getProgresivaCodeForDisplay(p.codigo)).toLowerCase();
            const nombre = (p.nombre || '').toLowerCase();
            const descripcion = (p.descripcion || '').toLowerCase();

            return codigo.includes(lowercasedFilter) ||
                nombre.includes(lowercasedFilter) ||
                descripcion.includes(lowercasedFilter);
        });
    }, [searchTerm, subProgresivasList]);


    return (
        <>
            {/* NEW MODAL for Graphics */}
            {viewingGraficosFor && (
                <VisorGraficosProgresivaModal
                    progresiva={viewingGraficosFor}
                    onClose={() => setViewingGraficosFor(null)}
                />
            )}

            {(loadingProgresivas || submitting || isLoadingListado) && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Cargando...</p>
                </div>
            )}
            <div className="gestor-main">
                <div className="lista-tramos-panel">
                    <div className="panel-header">
                        <h2><i className="fas fa-road"></i> Tramos</h2>
                    </div>
                    <ul className="tramos-list">
                        {tramos.map((tramo) => (
                            <li
                                key={tramo.id}
                                className={`tramo-list-item ${tramoSeleccionado?.id === tramo.id ? 'active' : ''}`}
                                onClick={() => handleSelectTramo(tramo)}
                            >
                                {tramo.nombre}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="detalle-proyecto-panel">
                    {!tramoSeleccionado ? (
                        <div className="panel-header"><h2><i className="fas fa-check-circle"></i> Seleccione un tramo</h2></div>
                    ) : (
                        <>
                            <div className="panel-header">
                                <h2><i className="fas fa-map-marker-alt"></i> {tramoSeleccionado.nombre}</h2>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm ml-3"
                                    onClick={() => navigate(`/coordinador/suelos/ensayos/tramos/${tramoSeleccionado.id}`)}
                                >
                                    <i className="fas fa-flask"></i> Ver Ensayos del Tramo
                                </button>
                                <div className="search-container">
                                    <input
                                        type="text"
                                        placeholder="Buscar en la pestaña actual..."
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch();
                                            }
                                        }}
                                    />
                                    <i className="fas fa-search"></i>
                                </div>
                            </div>
                            <div className="tabs">
                                <div className={`tab ${activeTab === 'progresivas' ? 'active' : ''}`} onClick={() => handleTabChange('progresivas')}>Progresivas</div>
                                <div className={`tab ${activeTab === 'listado' ? 'active' : ''}`} onClick={() => handleTabChange('listado')}>Listado General</div>
                            </div>
                            {activeTab === 'progresivas' && (
                                <div className="tab-content active">
                                    <div className="progressiva-list-container" ref={scrollableContentRef}>
                                        {subProgresivas.map(progresiva => (
                                            <ProgressivaItem
                                                key={progresiva.id}
                                                progresiva={progresiva}
                                                expandedProgresivas={expandedProgresivas}
                                                toggleProgresiva={toggleProgresiva}
                                                expandedEstratos={expandedEstratos}
                                                toggleEstrato={toggleEstrato}
                                                handleGestionarEstratos={handleGestionarEstratos}
                                                formatCodigoForDisplay={formatCodigoForDisplay}
                                                handleEditProgresiva={handleEditProgresiva}
                                                handleOpenEnsayoModal={handleOpenEnsayoModal}
                                                handleDeleteEnsayo={handleDeleteEnsayo}
                                                handleEditEnsayo={handleEditEnsayo}
                                                handleViewEnsayo={handleViewEnsayo}
                                                handleViewGraficos={handleViewGraficos}
                                                selectedProgresivaId={selectedProgresivaId}
                                                ref={el => progresivaRefs.current[progresiva.id] = el}
                                            />
                                        ))}
                                    </div>
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                            {activeTab === 'listado' && (
                                <div className="tab-content active">
                                    {isLoadingListado ? (
                                        <div style={{ padding: '20px' }}>Cargando listado completo...</div>
                                    ) : filteredListado.length > 0 ? (
                                        <div className="virtual-table-container">
                                            <div className="virtual-table-header">
                                                <div className="virtual-table-cell" style={{ flex: '0 0 50px' }}>#</div>
                                                <div className="virtual-table-cell progresiva-cell" style={{ flex: '1 1 120px' }}>Progresiva</div>
                                                <div className="virtual-table-cell" style={{ flex: '1 1 150px' }}>Nombre</div>
                                                <div className="virtual-table-cell" style={{ flex: '2 1 250px' }}>Descripción</div>
                                                <div className="virtual-table-cell" style={{ flex: '1 1 120px' }}>Coord. Este</div>
                                                <div className="virtual-table-cell" style={{ flex: '1 1 120px' }}>Coord. Norte</div>
                                                <div className="virtual-table-cell" style={{ flex: '0 0 80px' }}>Zona</div>
                                                <div className="virtual-table-cell" style={{ flex: '0 0 120px' }}>N° Estratos</div>
                                                <div className="virtual-table-cell" style={{ flex: '1 1 100px' }}>Estado</div>
                                            </div>

                                            <div className="virtual-table-list">
                                                {filteredListado.map((progresiva, index) => (
                                                    <div key={progresiva.id || index} className="virtual-table-row">
                                                        <div className="virtual-table-cell" style={{ flex: '0 0 50px' }}>{index + 1}</div>
                                                        <div className="virtual-table-cell progresiva-cell" style={{ flex: '1 1 120px' }}>{formatCodigoForDisplay(getProgresivaCodeForDisplay(progresiva.codigo))}</div>
                                                        <div className="virtual-table-cell" style={{ flex: '1 1 150px' }}>{progresiva.nombre || 'N/A'}</div>
                                                        <div className="virtual-table-cell" style={{ flex: '2 1 250px' }}>{progresiva.descripcion || 'N/A'}</div>
                                                        <div className="virtual-table-cell" style={{ flex: '1 1 120px' }}>{progresiva.coordenada_este || 'N/A'}</div>
                                                        <div className="virtual-table-cell" style={{ flex: '1 1 120px' }}>{progresiva.coordenada_norte || 'N/A'}</div>
                                                        <div className="virtual-table-cell" style={{ flex: '0 0 80px' }}>{progresiva.zona || 'N/A'}</div>
                                                        <div className="virtual-table-cell" style={{ flex: '0 0 120px' }}>{progresiva.estratos_perfil ? progresiva.estratos_perfil.length : 0}</div>
                                                        <div className="virtual-table-cell" style={{ flex: '1 1 100px' }}>{progresiva.estado || 'N/A'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p>No hay progresivas para mostrar en el listado general.</p>
                                    )}
                                </div>
                            )}

                        </>
                    )}
                </div>
            </div>

            {showGestionarEstratosModal && (
                <div className="overlay">
                    <div className="progresivas-form-container">
                        <form className="progresivas-form" onSubmit={handleUpdateEstratos}>
                            <div className="estratos-header" style={{ marginBottom: '15px' }}>
                                <h3 className="estratos-title"><i className="fas fa-layer-group"></i> Estratos identificados</h3>
                                <button type="button" onClick={handleAddEstrato} className="btn btn-outline">
                                    <i className="fas fa-plus"></i> Añadir Estrato
                                </button>
                            </div>
                            <div className="form-group full-width">
                                <div className="estratos-editor-list">
                                    {estratosEnEdicion.map((estrato, index) => (
                                        <div className="estrato-editor-row" key={index}>
                                            <input type="number" name="profundidad_inicial" value={estrato.profundidad_inicial} placeholder="Prof. Inicial" readOnly />
                                            <input type="number" step="any" name="profundidad_final" value={estrato.profundidad_final} placeholder="Prof. Final" onChange={(e) => handleEstratoChange(index, e)} />
                                            <textarea name="descripcion" value={estrato.descripcion || ''} placeholder="Descripción" onChange={(e) => handleEstratoChange(index, e)} rows="1"></textarea>
                                            <button type="button" onClick={() => handleRemoveEstrato(index)} className="remove-estrato-btn" disabled={index === 0}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="close-btn" onClick={() => setShowGestionarEstratosModal(false)}>Cancelar</button>
                                <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar Cambios'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditProgresivaModal && progresivaToEdit && progresivaFormData && (
                <div className="overlay" onClick={handleCloseEditProgresivaModal}>
                    <div className="progresivas-form-container" onClick={(e) => e.stopPropagation()}>
                        <form className="progresivas-form" onSubmit={handleUpdateProgresiva}>
                            <h3>Editar Progresiva: {getProgresivaCodeForDisplay(progresivaToEdit.codigo)}</h3>
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
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Descripción</label>
                                    <textarea name="descripcion" value={progresivaFormData.descripcion} onChange={handleProgresivaFormChange} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="close-btn" onClick={handleCloseEditProgresivaModal}>Cancelar</button>
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingEstratos.estratos_perfil.map((estrato, index) => (
                                            <React.Fragment key={estrato.id || index}>
                                                <tr>
                                                    <td>{index + 1}</td>
                                                    <td>{estrato.profundidad_inicial}</td>
                                                    <td>{estrato.profundidad_final}</td>
                                                    <td>{estrato.descripcion}</td>
                                                    <td>
                                                        <button className="action-btn view" onClick={(e) => { e.stopPropagation(); toggleEnsayos(estrato.id); }}>
                                                            <i className="fas fa-eye"></i> Ver Ensayos ({estrato.ensayos ? estrato.ensayos.length : 0})
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedEnsayos[estrato.id] && (() => {
                                                    const selectedEnsayo = selectedEnsayoInModal && estrato.ensayos ? estrato.ensayos.find(e => e.id === selectedEnsayoInModal) : null;
                                                    return (
                                                        <tr>
                                                            <td colSpan="5">
                                                                <div className="modal-ensayos-container">
                                                                    <div className="ensayos-header">
                                                                        <h4>Ensayos realizados</h4>
                                                                        <div className="ensayo-main-actions">
                                                                            {selectedEnsayo && (
                                                                                <div className="selected-ensayo-actions">
                                                                                    <button type="button" className="action-btn view" onClick={() => handleViewEnsayo(selectedEnsayo)}><i className="fas fa-eye"></i> Ver</button>
                                                                                    <button type="button" className="action-btn action-btn-granulometria-simple" onClick={() => navigate(`/coordinador/suelos/ensayos/${selectedEnsayo.id}`)}>Ir a Ensayo</button>
                                                                                    <button type="button" className="action-btn edit" onClick={() => handleEditEnsayo(viewingEstratos, estrato, selectedEnsayo)}><i className="fas fa-edit"></i> Editar</button>
                                                                                    <button type="button" className="action-btn delete" onClick={() => { handleDeleteEnsayo(selectedEnsayo.id); setSelectedEnsayoInModal(null); }}><i className="fas fa-trash"></i> Eliminar</button>
                                                                                </div>
                                                                            )}
                                                                            <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenEnsayoModal(viewingEstratos, estrato); }}>
                                                                                <i className="fas fa-plus"></i> Nuevo Ensayo
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ensayos-list">
                                                                        {estrato.ensayos && estrato.ensayos.length > 0 ? (
                                                                            estrato.ensayos.map((ensayo, ensayoIndex) => {
                                                                                return (
                                                                                    <div
                                                                                        className={`ensayo-card selectable ${selectedEnsayoInModal === ensayo.id ? 'selected' : ''}`}
                                                                                        key={ensayo.id || ensayoIndex}
                                                                                        onClick={() => handleSelectEnsayoInModal(ensayo.id)}
                                                                                    >
                                                                                        <div className="ensayo-header">
                                                                                            <div className="ensayo-title">{ensayo.nombre_ensayo}</div>
                                                                                            <div className="ensayo-date">{formatDateForDisplay(ensayo.fecha)}</div>
                                                                                        </div>
                                                                                        <div className="ensayo-details">
                                                                                            <div className="detail-item">
                                                                                                <span className="detail-label">Tipo</span>
                                                                                                <span className="detail-value truncate">${ensayo.tipo_ensayo_descripcion || ensayo.tipo_ensayo}</span>
                                                                                            </div>
                                                                                            <div className="detail-item">
                                                                                                <span className="detail-label">Resultado</span>
                                                                                                <span className="detail-value">${ensayo.resultado}</span>
                                                                                            </div>
                                                                                            <div className="detail-item">
                                                                                                <span className="detail-label">Responsable</span>
                                                                                                <span className="detail-value">${ensayo.responsable_nombre || 'N/A'}</span>
                                                                                            </div>
                                                                                            <div className="detail-item">
                                                                                                <span className="detail-label">Estado</span>
                                                                                                <span className={`detail-value status-badge status-${ensayo.estado?.toLowerCase()}`}>{ensayo.estado}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <p>No hay ensayos registrados para este estrato.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })()}
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

            {showEnsayoModal && currentProgresivaForAssay && currentEstratoForAssay && (
                <div className="overlay" onClick={handleCloseEnsayoModal}>
                    <div className="progresivas-form-container" onClick={(e) => e.stopPropagation()}>
                        <FormularioEnsayo
                            showModal={showEnsayoModal}
                            onClose={handleCloseEnsayoModal}
                            progresiva={currentProgresivaForAssay}
                            estrato={currentEstratoForAssay}
                            onAssayCreated={handleAssayCreated}
                            ensayoToEdit={ensayoToEdit} // Pass ensayoToEdit
                            token={user?.token}
                        />
                    </div>
                </div>
            )}
        </>
    );
}