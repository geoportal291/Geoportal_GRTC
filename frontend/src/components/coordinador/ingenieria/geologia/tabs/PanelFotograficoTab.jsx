import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '@/api/axios';
import { useAuth } from '@/data/contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import alertify from 'alertifyjs';
import GeologiaGeoite from '../map/GeologiaGeoite';
import './GeologiaTab.css'; // Importar los estilos estándar de las pestañas de Geología
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';

// ─────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────
const Lightbox = ({ foto, onClose, onPrev, onNext }) => {
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, onNext, onPrev]);

    if (!foto) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '12px'
            }}
        >
            {/* Botón cerrar */}
            <button
                onClick={onClose}
                style={{
                    position: 'fixed', top: '20px', right: '30px',
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    color: 'white', fontSize: '24px', cursor: 'pointer',
                    borderRadius: '50%', width: '44px', height: '44px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 3100, transition: 'background 0.3s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            ><i className="fas fa-times"></i></button>

            {/* Navigación - Ajustados para evitar navbar */}
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                style={{
                    position: 'fixed', left: '280px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                    fontSize: '28px', cursor: 'pointer', borderRadius: '50%',
                    width: '58px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 3100, transition: 'all 0.3s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            ><i className="fas fa-chevron-left"></i></button>

            <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                style={{
                    position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                    fontSize: '28px', cursor: 'pointer', borderRadius: '50%',
                    width: '58px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 3100, transition: 'all 0.3s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            ><i className="fas fa-chevron-right"></i></button>

            {/* Imagen */}
            <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh', textAlign: 'center' }}>
                {foto.image_url ? (
                    <img
                        src={foto.image_url}
                        alt={foto.nombre || 'Foto'}
                        style={{ maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
                    />
                ) : (
                    <div style={{ width: '300px', height: '200px', background: '#1e293b', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '8px' }}></i>
                        <span>Sin imagen</span>
                    </div>
                )}
                {/* Info */}
                <div style={{ marginTop: '12px', color: 'white' }}>
                    {foto.nombre && <p style={{ margin: '4px 0', fontWeight: 700, fontSize: '15px' }}>{foto.nombre}</p>}
                    {foto.descripcion && <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>{foto.descripcion}</p>}
                    {foto.lat && foto.lng && (
                        <p style={{ margin: '4px 0', fontSize: '11px', color: '#94a3b8' }}>
                            📍 {parseFloat(foto.lat).toFixed(6)}, {parseFloat(foto.lng).toFixed(6)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// CARD DE FOTO
// ─────────────────────────────────────────────
const FotoCard = ({ foto, onClick }) => (
    <div
        onClick={onClick}
        style={{
            borderRadius: '10px', overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            background: 'white', cursor: 'pointer',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
    >
        {/* Imagen */}
        <div style={{ width: '100%', height: '180px', background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
            {foto.image_url ? (
                <img
                    src={foto.image_url}
                    alt={foto.nombre || 'Foto geológica'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
                    <i className="fas fa-image" style={{ fontSize: '32px', marginBottom: '6px' }}></i>
                    <span style={{ fontSize: '12px' }}>Sin imagen</span>
                </div>
            )}
            {/* Badge coords */}
            {foto.lat && foto.lng && (
                <div style={{
                    position: 'absolute', bottom: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.65)', color: 'white',
                    fontSize: '10px', padding: '3px 7px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    <i className="fas fa-map-marker-alt"></i>
                    {parseFloat(foto.lat).toFixed(4)}, {parseFloat(foto.lng).toFixed(4)}
                </div>
            )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '13px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {foto.nombre || 'Sin nombre'}
            </p>
            {foto.descripcion && (
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {foto.descripcion}
                </p>
            )}
        </div>
    </div>
);

// Icono personalizado para el mapa (Cámara) - Ajustado
const cameraIcon = (count) => L.divIcon({
    html: `
        <div class="visorimagenes_geoolgia_1_marker_cont" style="position: relative; background: #3b82f6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); z-index: 500;">
            <i class="fas fa-camera" style="font-size: 11px;"></i>
            ${count > 1 ? `<span class="visorimagenes_geoolgia_1_badge" style="position: absolute; top: -7px; right: -7px; background: #ef4444; color: white; font-size: 10px; font-weight: 800; padding: 1px 4px; border-radius: 8px; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 1000;">${count}</span>` : ''}
        </div>
    `,
    className: 'visorimagenes_geoolgia_1_custom_icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
});

// Componente para ajustar zoom al cargar puntos
const MapFitter = ({ groups }) => {
    const map = useMap();
    useEffect(() => {
        if (groups.length > 0) {
            const bounds = L.latLngBounds(groups.map(g => [g.lat, g.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [groups, map]);
    return null;
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
const PanelFotograficoTab = ({ projectData }) => {
    const { selectedProjectId: projectId } = useAuth();
    const [fotos, setFotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'map'
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [search, setSearch] = useState('');
    const [isMapExpanded, setIsMapExpanded] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 36;

    const fetchFotos = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/api/proyectos/${projectId}/panel-fotografico`);
            setFotos(res.data.fotos || []);
        } catch (err) {
            console.error('[PanelFotografico] Error al cargar fotos:', err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchFotos(); }, [fetchFotos]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, viewMode]);

    const handleUploadKmz = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.kmz')) {
            alertify.error('Solo se aceptan archivos KMZ.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('kmz', file);

        try {
            const res = await axiosInstance.post(
                `/api/proyectos/${projectId}/panel-fotografico/upload-kmz`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );
            alertify.success(`✅ Se cargaron ${res.data.count} fotos correctamente.`);
            await fetchFotos();
        } catch (err) {
            console.error('[PanelFotografico] Error al subir KMZ:', err);
            alertify.error('Error al procesar el KMZ: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
            setUploadProgress(0);
            e.target.value = '';
        }
    };

    const handleLimpiar = () => {
        alertify.confirm(
            'Limpiar Panel Fotográfico',
            '¿Estás seguro de que quieres eliminar todas las fotos del panel?',
            async () => {
                try {
                    await axiosInstance.delete(`/api/proyectos/${projectId}/panel-fotografico`);
                    setFotos([]);
                    alertify.success('Panel fotográfico limpiado.');
                } catch (err) {
                    alertify.error('Error al limpiar el panel.');
                }
            },
            () => { }
        );
    };

    // Filtrado por búsqueda
    const fotosFiltradas = fotos.filter(f => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (f.nombre || '').toLowerCase().includes(q) ||
            (f.descripcion || '').toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(fotosFiltradas.length / ITEMS_PER_PAGE);
    const fotosPaginadas = fotosFiltradas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Lightbox navegación
    const fotosConImagen = fotosFiltradas.filter(f => f.image_url);
    const lightboxFoto = lightboxIdx !== null ? fotosConImagen[lightboxIdx] : null;

    const openLightbox = (foto) => {
        const idx = fotosConImagen.findIndex(f => f.id === foto.id);
        setLightboxIdx(idx >= 0 ? idx : null);
    };

    // Lógica de Agrupamiento con Memoización para evitar re-renderizados costosos
    // y asegurar que los popups no se cierren al mover el mapa.
    const grupos = useMemo(() => {
        const groups = [];
        const fotosConCoords = fotosFiltradas.filter(f => f.lat && f.lng);

        // Radio de agrupamiento: 0.00018 grados (~20 metros)
        const DIST_THRESHOLD = 0.00018;

        fotosConCoords.forEach(foto => {
            let found = false;
            for (const group of groups) {
                const dLat = Math.abs(group.lat - parseFloat(foto.lat));
                const dLng = Math.abs(group.lng - parseFloat(foto.lng));
                if (dLat < DIST_THRESHOLD && dLng < DIST_THRESHOLD) {
                    group.photos.push(foto);
                    found = true;
                    break;
                }
            }
            if (!found) {
                groups.push({
                    id: `g-${foto.id}`, // ID estable basado en la primera foto
                    lat: parseFloat(foto.lat),
                    lng: parseFloat(foto.lng),
                    photos: [foto]
                });
            }
        });
        return groups;
    }, [fotosFiltradas]);

    // Estilos CSS para anular Leaflet y asegurar aislamiento total
    const customPopupStyles = `
        .visorimagenes_geoolgia_1_pop .leaflet-popup-content-wrapper {
            padding: 0 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            background: #ffffff !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        .visorimagenes_geoolgia_1_pop .leaflet-popup-content {
            margin: 0 !important;
            width: 250px !important;
        }
        .visorimagenes_geoolgia_1_pop .leaflet-popup-tip {
            background: #ffffff !important;
        }
        .visorimagenes_geoolgia_1_pop .leaflet-popup-close-button {
            top: 8px !important;
            right: 8px !important;
            color: #ffffff !important;
            font-size: 16px !important;
            z-index: 9999 !important;
        }
        .visorimagenes_geoolgia_1_pop .leaflet-popup-close-button:hover {
            opacity: 0.8 !important;
            color: white !important;
            background: transparent !important;
        }
        .visorimagenes_geoolgia_1_carousel {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            background: #000;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .visorimagenes_geoolgia_1_carousel img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .carousel-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.4);
            color: white;
            border: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: all 0.2s;
            font-size: 10px;
        }
        .carousel-arrow:hover {
            background: rgba(30, 58, 138, 0.9);
        }
        .carousel-arrow.left { left: 8px; }
        .carousel-arrow.right { right: 8px; }
        .carousel-counter {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
        }
    `;

    // Mini Componente Interno para el Carrusel del Popup
    const PhotoCarousel = ({ photos, onOpenLightbox }) => {
        const [currentIndex, setCurrentIndex] = React.useState(0);
        
        if (!photos || photos.length === 0) return null;
        
        const next = (e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        };
        const prev = (e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
        };

        const currentPhoto = photos[currentIndex];

        return (
            <div className="visorimagenes_geoolgia_1_carousel" onClick={() => onOpenLightbox(currentPhoto)}>
                <img src={currentPhoto.image_url} alt="Carousel" />
                {photos.length > 1 && (
                    <>
                        <button className="carousel-arrow left" onClick={prev}><i className="fas fa-chevron-left"></i></button>
                        <button className="carousel-arrow right" onClick={next}><i className="fas fa-chevron-right"></i></button>
                    </>
                )}
                <div className="carousel-counter">{currentIndex + 1} / {photos.length}</div>
            </div>
        );
    };

    return (
        <div className="visorimagenes_geoolgia_1_main_wrapper geol-custom-scrollbar" style={{ padding: '15px 15px 24px 15px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 145px)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <style>{customPopupStyles}</style>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-camera" style={{ fontSize: '22px', color: '#3b82f6' }}></i>
                    <div>
                        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: 700 }}>Panel Fotográfico</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                            {fotos.length > 0 ? `${fotos.length} fotos cargadas` : 'Sin fotos — sube un KMZ para comenzar'}
                        </p>
                    </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="file"
                        id="kmz-upload-input"
                        accept=".kmz"
                        style={{ display: 'none' }}
                        onChange={handleUploadKmz}
                    />
                    <button
                        onClick={() => document.getElementById('kmz-upload-input').click()}
                        disabled={uploading}
                        style={{
                            background: uploading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: 'white', border: 'none', borderRadius: '8px',
                            padding: '9px 18px', cursor: uploading ? 'wait' : 'pointer',
                            fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {uploading
                            ? <><i className="fas fa-spinner fa-spin"></i> Procesando KMZ...</>
                            : <><i className="fas fa-upload"></i> Subir KMZ</>
                        }
                    </button>

                    <div style={{ background: '#f1f5f9', p: '2px', borderRadius: '10px', display: 'flex' }}>
                        <button
                            onClick={() => setViewMode('gallery')}
                            style={{
                                padding: '8px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                background: viewMode === 'gallery' ? 'white' : 'transparent',
                                color: viewMode === 'gallery' ? '#1e293b' : '#64748b',
                                boxShadow: viewMode === 'gallery' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                            }}
                        >
                            <i className="fas fa-th"></i> Galería
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            style={{
                                padding: '8px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                background: viewMode === 'map' ? 'white' : 'transparent',
                                color: viewMode === 'map' ? '#1e293b' : '#64748b',
                                boxShadow: viewMode === 'map' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                            }}
                        >
                            <i className="fas fa-map-marked-alt"></i> Mapa
                        </button>
                    </div>

                    {fotos.length > 0 && (
                        <button
                            onClick={handleLimpiar}
                            style={{
                                background: 'white', color: '#ef4444', border: '1.5px solid #ef4444',
                                borderRadius: '8px', padding: '9px 16px', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <i className="fas fa-trash"></i> Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* BARRA DE PROGRESO */}
            {uploading && (
                <div style={{ marginBottom: '20px', background: '#f1f5f9', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                        <span style={{ color: '#1e293b' }}>
                            {uploadProgress < 100 ? 'Subiendo archivo...' : 'Procesando imágenes en el servidor...'}
                        </span>
                        <span style={{ color: '#3b82f6' }}>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${uploadProgress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                transition: 'width 0.3s ease-out',
                                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                            }}
                        />
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                        {uploadProgress === 100
                            ? 'Esto puede tardar unos segundos dependiendo del número de imágenes...'
                            : 'No cierres esta pestaña hasta completar el proceso'}
                    </p>
                </div>
            )}

            {/* BUSCADOR */}
            {fotos.length > 0 && (
                <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '360px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px',
                            border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none',
                            boxSizing: 'border-box', fontFamily: 'inherit'
                        }}
                    />
                </div>
            )}

            {/* CONTENIDO */}
            {/* Estilos inyectados para asegurar el blanco puro y el diseño del popup */}
            <style>{`
                .visorimagenes_geoolgia_1_header_text {
                    color: #ffffff !important;
                    opacity: 1 !important;
                    font-weight: 800 !important;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .visorimagenes_geoolgia_1_card:hover {
                    border-color: #3b82f6 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .leaflet-popup-content-wrapper {
                    padding: 0 !important;
                    border-radius: 8px !important;
                    overflow: hidden !important;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                }
                .leaflet-popup-close-button {
                    color: white !important;
                    font-size: 16px !important;
                    padding: 8px !important;
                    top: 4px !important;
                    right: 4px !important;
                }
            `}</style>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: '#64748b', gap: '12px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#3b82f6' }}></i>
                    <span>Cargando fotos...</span>
                </div>
            ) : fotosFiltradas.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '260px', background: '#f8fafc', borderRadius: '12px',
                    border: '2px dashed #cbd5e1', color: '#94a3b8', gap: '12px'
                }}>
                    <i className="fas fa-images" style={{ fontSize: '48px' }}></i>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                        {search ? 'Sin resultados para tu búsqueda' : 'No hay fotos cargadas'}
                    </span>
                    {!search && <span style={{ fontSize: '13px' }}>Haz clic en "Subir KMZ" para cargar las fotos del proyecto</span>}
                </div>
            ) : viewMode === 'map' ? (
                <div className="geoltab-layout" style={{ display: 'block', marginTop: '10px', overflow: 'visible' }}>
                    <div className="geoltab-map-panel" style={{ width: '100%', height: '950px', display: 'flex', flexDirection: 'column' }}>
                        <div className="geoltab-map-header" style={{ flexShrink: 0 }}>
                            <span className="geoltab-map-label">MAPA DE ANÁLISIS FOTOGRÁFICO</span>
                        </div>

                        <div className="geoltab-map-container" style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <GeologiaGeoite
                                tabName="panel_fotografico"
                                projectId={projectData?.id_proyecto || projectData?.id}
                                height="100%"
                            >
                                {grupos.map((grupo) => (
                                    <Marker
                                        key={grupo.id}
                                        position={[grupo.lat, grupo.lng]}
                                        icon={cameraIcon(grupo.photos.length)}
                                        eventHandlers={{
                                            click: (e) => {
                                                const marker = e.target;
                                                const map = marker._map;
                                                const currentZoom = map.getZoom();
                                                const targetZoom = Math.max(currentZoom + 2, 17);

                                                // Proyectar coordenadas a píxeles para el nivel de zoom objetivo
                                                const px = map.project(marker.getLatLng(), targetZoom);
                                                // Restar a Y mueve el centro hacia arriba, bajando el marcador visualmente
                                                px.y -= 220;
                                                const offsetLatLng = map.unproject(px, targetZoom);

                                                // Zoom progresivo y apertura persistente con offset
                                                map.setView(offsetLatLng, targetZoom, { animate: true });
                                                setTimeout(() => {
                                                    marker.openPopup();
                                                }, 350);
                                            }
                                        }}
                                    >
                                        <Popup maxWidth={300} minWidth={280} autoPan={false}>
                                            <div className="visorimagenes_geoolgia_1_container" style={{ overflow: 'hidden', background: '#ffffff', borderRadius: '8px' }}>
                                                {/* Header Compacto tipo Atributos */}
                                                <div className="visorimagenes_geoolgia_1_header" style={{ backgroundColor: '#1e3a8a', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className="fas fa-camera" style={{ fontSize: '14px', color: '#ffffff' }}></i>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                            Punto Fotográfico
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="visorimagenes_geoolgia_1_content" style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {/* Carrusel */}
                                                    <PhotoCarousel photos={grupo.photos} onOpenLightbox={openLightbox} />

                                                    {/* Atributos / Info */}
                                                    <div style={{ padding: '14px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                                                            <span style={{ fontWeight: 600, color: '#94a3b8' }}>NOMBRE:</span>
                                                            <span style={{ fontWeight: 700, color: '#334155' }}>{grupo.photos[0]?.nombre || 'Sin nombre'}</span>
                                                            
                                                            <span style={{ fontWeight: 600, color: '#94a3b8' }}>FECHA:</span>
                                                            <span style={{ fontWeight: 700, color: '#334155' }}>
                                                                {grupo.photos[0]?.uploaded_at ? new Date(grupo.photos[0].uploaded_at).toLocaleDateString() : 'N/A'}
                                                            </span>

                                                            <span style={{ fontWeight: 600, color: '#94a3b8' }}>FOTOS:</span>
                                                            <span style={{ fontWeight: 700, color: '#334155' }}>{grupo.photos.length} registradas</span>
                                                        </div>

                                                        {/* Botón Acción Principal */}
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setViewMode('gallery');
                                                                setSearch(grupo.photos[0]?.nombre || '');
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                marginTop: '16px',
                                                                padding: '10px',
                                                                backgroundColor: '#1e3a8a',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.target.style.backgroundColor = '#1e40af'}
                                                            onMouseOut={(e) => e.target.style.backgroundColor = '#1e3a8a'}
                                                        >
                                                            VER GALERÍA COMPLETA <i className="fas fa-arrow-right" style={{ fontSize: '9px' }}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                                <MapFitter groups={grupos} />
                            </GeologiaGeoite>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    paddingRight: '8px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f8fafc'
                }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                        Mostrando {fotosPaginadas.length} fotos en página {currentPage} de {totalPages} (Total: {fotosFiltradas.length} fotos) · Haz clic en una foto para verla en detalle
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '16px',
                        paddingBottom: '24px'
                    }}>
                        {fotosPaginadas.map((foto) => (
                            <FotoCard
                                key={foto.id}
                                foto={foto}
                                onClick={() => openLightbox(foto)}
                            />
                        ))}
                    </div>

                    {/* PAGINACIÓN CONTROLES */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', paddingBottom: '24px', paddingTop: '10px' }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                    background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    color: currentPage === 1 ? '#94a3b8' : '#1e293b', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                <i className="fas fa-chevron-left"></i> Anterior
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                    background: currentPage === totalPages ? '#f8fafc' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    color: currentPage === totalPages ? '#94a3b8' : '#1e293b', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                Siguiente <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* LIGHTBOX */}
            {lightboxFoto && (
                <Lightbox
                    foto={lightboxFoto}
                    onClose={() => setLightboxIdx(null)}
                    onPrev={() => setLightboxIdx(i => (i - 1 + fotosConImagen.length) % fotosConImagen.length)}
                    onNext={() => setLightboxIdx(i => (i + 1) % fotosConImagen.length)}
                />
            )}
        </div>
    );
};

export default PanelFotograficoTab;
