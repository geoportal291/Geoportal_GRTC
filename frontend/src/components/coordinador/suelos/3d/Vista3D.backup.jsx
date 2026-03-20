import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center, Html, Bounds } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import './Vista3D.css';


const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'https://backendgeoportal.fly.dev';

// Componente para cargar y renderizar el OBJ devuelto por Python y Node
function ModeloOBJ({ url, viewMode }) {
    const obj = useLoader(OBJLoader, url);

    React.useMemo(() => {
        let boundingBox = new THREE.Box3();
        let center = new THREE.Vector3();

        let totalVertices = 0;
        let objectCount = 0;

        // Compute Bounding Box
        obj.traverse((child) => {
            if (child.isMesh) {
                objectCount++;
                if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                    totalVertices += child.geometry.attributes.position.count;
                }
                child.geometry.computeBoundingBox();
                if (!child.geometry.boundingBox.isEmpty()) {
                    boundingBox.expandByObject(child);
                }
            }
        });

        console.log(`[DEBUG 3D] Modelo cargado: ${objectCount} sub-mallas encontradas, ${totalVertices} vértices totales.`);

        // Obtener el centro real de toda la malla
        boundingBox.getCenter(center);
        console.log("Centro de malla UTM detectado en:", center.x, center.y, center.z);

        const size = boundingBox.getSize(new THREE.Vector3());

        // Mover absolutamente toda la geometría al punto [0,0,0] para que la cámara no se vuelva loca
        obj.traverse((child) => {
            if (child.isMesh && !child.userData.centered) {
                child.geometry.translate(-center.x, -center.y, -center.z);
                child.geometry.computeVertexNormals(); // Crucial para que la luz rebote bien sin wireframe
                child.userData.centered = true;
            }
        });

        const minZ = boundingBox.min.z - center.z;
        const maxZ = boundingBox.max.z - center.z;
        const rangeZ = maxZ - minZ || 1;

        // Aplicar Materiales Optimizados y Modo Visualización
        obj.traverse((child) => {
            if (child.isMesh) {
                if (viewMode === 'topografica') {
                    // Mapa de calor HSL por Elevación (Z)
                    const pos = child.geometry.attributes.position;
                    const count = pos.count;
                    const colors = new Float32Array(count * 3);
                    const color = new THREE.Color();

                    for (let i = 0; i < count; i++) {
                        const z = pos.getZ(i);
                        const norm = Math.max(0, Math.min(1, (z - minZ) / rangeZ));

                        // Mapa de calor topográfico clásico: Verde (bajo) -> Amarillo -> Rojo (alto)
                        // En HSL: Verde es Hue ~0.33, Rojo es Hue 0.0
                        const hue = 0.33 * (1 - norm);
                        color.setHSL(hue, 0.8, 0.5);

                        colors[i * 3] = color.r;
                        colors[i * 3 + 1] = color.g;
                        colors[i * 3 + 2] = color.b;
                    }

                    child.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                    child.material = new THREE.MeshPhongMaterial({
                        vertexColors: true,
                        flatShading: true,
                        side: THREE.DoubleSide
                    });

                } else if (viewMode === 'geografica') {
                    // Color tierra oscuro/sólido, simulando satélite o terreno genérico
                    child.material = new THREE.MeshPhongMaterial({
                        color: '#4b5563', // Gris/Tierra oscuro
                        flatShading: true,
                        side: THREE.DoubleSide
                    });

                } else if (viewMode === 'ifc') {
                    // Modo Arquitectura / Estructuras (Color metálico/neutro pálido)
                    child.material = new THREE.MeshStandardMaterial({
                        color: '#93c5fd',
                        metalness: 0.3,
                        roughness: 0.4,
                        side: THREE.DoubleSide
                    });
                }
            }
        });

    }, [obj, viewMode]);

    return <primitive object={obj} />;
}

export default function Vista3D() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [modelos, setModelos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedModelo, setSelectedModelo] = useState(null);
    const [viewMode, setViewMode] = useState('topografica'); // Estado para los 3 botones

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchModelos();
    }, []);

    const fetchModelos = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await fetch(`${API_BASE}/api/modelos-3d`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setModelos(data);
                if (data.length > 0 && !selectedModelo) {
                    setSelectedModelo(data[0]);
                }
            } else {
                console.error("Error fetching modelos", await res.text());
            }
        } catch (e) {
            console.error("Error cargando modelos", e);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'xml' && ext !== 'ifc') {
            Swal.fire({ icon: 'error', title: 'Formato inválido', text: 'Solo se admiten archivos .xml (LandXML) y .ifc' });
            e.target.value = null;
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('archivo', file);
        // Si tienes el contexto del proyecto/tramo actual, podrías añadirlo aquí:
        // formData.append('proyecto_id', currentProyectoId);

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await fetch(`${API_BASE}/api/modelos-3d`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Subido y procesado!',
                    toast: true,
                    position: 'bottom-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                fetchModelos();
            } else {
                Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'No se pudo procesar el archivo.' });
            }
        } catch (err) {
            console.error("Error en subida:", err);
            Swal.fire({ icon: 'error', title: 'Error de Red', text: err.message });
        } finally {
            setIsUploading(false);
            e.target.value = null; // reset
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar modelo?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                const token = JSON.parse(localStorage.getItem('user'))?.token;
                const res = await fetch(`${API_BASE}/api/modelos-3d/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Eliminado', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
                    if (selectedModelo && selectedModelo.id === id) {
                        setSelectedModelo(null);
                    }
                    fetchModelos();
                } else {
                    Swal.fire({ icon: 'error', title: 'Oops...', text: 'No se pudo eliminar el archivo' });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error de Red', text: err.message });
            }
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const dashboardContent = (
        <div
            id="visor3DContainer"
            className={`visor-3d-root w-full rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border border-slate-700 ${isFullscreen ? 'is-fullscreen' : 'h-full'}`}
        >
            {/* Toolbar interno del Visor 3D */}
            <div className="h-12 glass-panel border-b border-slate-700 flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-2">
                    <i className="fa-brands fa-unity text-white text-lg"></i>
                    <h2 className="font-semibold text-sm text-white">Entorno BIM y Topografía</h2>
                </div>
                <div className="flex gap-2">

                    {/* Botón de Pantalla Completa */}
                    <button
                        onClick={toggleFullscreen}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-2 ${isFullscreen
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                    >
                        {isFullscreen ? (
                            <>
                                <i className="fa-solid fa-compress"></i> Contraer
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-expand"></i> Pantalla Completa
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Cuerpo del Visor 3D */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* PANEL IZQUIERDO: ARCHIVOS */}
                <aside className="w-64 glass-panel border-r border-slate-700 flex flex-col z-10 shrink-0">
                    <div className="p-3 border-b border-slate-700">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept=".xml,.ifc"
                        />
                        <div
                            onClick={handleUploadClick}
                            className={`border border-dashed border-slate-500 bg-slate-800/50 rounded-lg p-3 text-center transition duration-200 ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-blue-500 hover:bg-slate-700/50'}`}
                        >
                            {isUploading ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-xl text-blue-400 mb-1"></i>
                            ) : (
                                <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-400 mb-1"></i>
                            )}
                            <span className="block text-xs font-medium text-slate-300">
                                {isUploading ? 'Procesando en Python...' : 'Subir LandXML/IFC'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-hidden text-xs">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modelos Activos</h3>

                        {modelos.length === 0 && (
                            <div className="text-center text-slate-500 text-xs py-4 opacity-70">
                                <i className="fa-solid fa-folder-open mb-2 text-xl"></i>
                                <p>No hay modelos subidos</p>
                            </div>
                        )}

                        {modelos.map(mod => {
                            const isSelected = selectedModelo?.id === mod.id;
                            const isError = mod.estado === 'ERROR_PROCESAMIENTO';

                            return (
                                <div
                                    key={mod.id}
                                    onClick={() => setSelectedModelo(mod)}
                                    className={`bg-slate-800 rounded p-2 border cursor-pointer shadow-sm transition ${isSelected ? 'border-blue-400 bg-slate-700/80' : 'border-slate-600/50 hover:border-blue-500/50'} ${isError ? 'opacity-70 border-red-500/50' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold flex items-center gap-1.5 truncate ${mod.tipo === 'IFC' ? 'text-blue-300' : 'text-emerald-400'}`}>
                                            <i className={`fa-solid ${mod.tipo === 'IFC' ? 'fa-bridge' : 'fa-mountain'}`}></i>
                                            <span className="truncate" title={mod.nombre_archivo}>{mod.nombre_archivo}</span>
                                        </span>
                                        <i className={`fa-solid ${isSelected ? 'fa-eye text-white' : 'fa-eye-slash text-slate-500 hover:text-white transition'}`}></i>
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px]">
                                        <span className="text-slate-400">{mod.tipo} | {formatBytes(mod.tamano_bytes)}</span>
                                        <span className={`px-1 rounded border ${isError ? 'bg-red-900/50 text-red-300 border-red-800' : 'bg-emerald-900/50 text-emerald-300 border-emerald-800'}`}>
                                            {isError ? 'Error XML' : 'Procesado'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* ÁREA CENTRAL: RENDER 3D */}
                <main className="flex-1 viewer-area flex flex-col relative overflow-hidden">
                    <div className="grid-bg"></div>

                    {/* Controles Flotantes Izquierda */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        <button className="w-9 h-9 bg-slate-800/80 backdrop-blur-md text-slate-300 border border-slate-600/50 rounded hover:bg-blue-600 hover:text-white transition shadow-lg" title="Mover la cámara">
                            <i className="fa-solid fa-hand"></i>
                        </button>
                        <button className="w-9 h-9 bg-slate-800/80 backdrop-blur-md text-slate-300 border border-slate-600/50 rounded hover:bg-blue-600 hover:text-white transition shadow-lg" title="Medir distancia o área">
                            <i className="fa-solid fa-ruler-combined"></i>
                        </button>
                        <button className="w-9 h-9 bg-slate-800/80 backdrop-blur-md text-slate-300 border border-slate-600/50 rounded hover:bg-blue-600 hover:text-white transition shadow-lg" title="Corte Transversal">
                            <i className="fa-solid fa-scissors"></i>
                        </button>
                    </div>

                    <div className="flex-1 relative z-10 w-full h-full cursor-grab active:cursor-grabbing">
                        {selectedModelo && selectedModelo.url_archivo && selectedModelo.url_archivo !== 'PENDIENTE' ? (
                            <Canvas camera={{ position: [0, 500, 1000], fov: 60, near: 1, far: 500000, up: [0, 0, 1] }} gl={{ powerPreference: "high-performance", logarithmicDepthBuffer: true }}>
                                <ambientLight intensity={0.4} />
                                <directionalLight position={[1000, 1000, 1000]} intensity={1.5} />
                                <directionalLight position={[-1000, -1000, -1000]} intensity={0.5} color="#3b82f6" />

                                {/* Helpers visuales para dar perspectiva espacial: 50m por debajo de la base topográfica en Z */}
                                <axesHelper args={[1000]} position={[0, 0, -50]} />
                                <gridHelper args={[5000, 100]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -50]} />

                                <React.Suspense fallback={
                                    <Html center>
                                        <div className="text-white text-xs font-mono bg-slate-800/80 px-4 py-2 rounded shadow border border-slate-600 whitespace-nowrap">
                                            <i className="fa-solid fa-circle-notch fa-spin text-blue-400 mr-2"></i>Construyendo malla 3D...
                                        </div>
                                    </Html>
                                }>
                                    <Bounds fit clip observe margin={1.5}>
                                        <Center>
                                            <ModeloOBJ
                                                url={selectedModelo.url_archivo.startsWith('http') ? selectedModelo.url_archivo : `${API_BASE}${selectedModelo.url_archivo}`}
                                                viewMode={viewMode}
                                            />
                                        </Center>
                                    </Bounds>
                                </React.Suspense>
                                <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                            </Canvas>
                        ) : (
                            <div className="flex-1 flex items-center justify-center pointer-events-none h-full">
                                <div className="text-center opacity-80">
                                    <i className="fa-brands fa-unity text-6xl mb-3 text-blue-500/20 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"></i>
                                    <p className="text-sm text-slate-300 font-mono tracking-widest font-bold">Visor Geoportal 3D</p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
                                        {selectedModelo ? 'Este modelo no cuenta con un archivo 3D procesado' : 'Esperando inicialización local'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Consola Inferior Simulación Log */}
                    <div className="h-8 bg-slate-900/95 border-t border-slate-700/80 flex items-center px-4 text-[10px] font-mono text-emerald-400 z-20 shrink-0">
                        <span className="opacity-70 mr-2">&gt;</span> Python Worker: Listo y conectando con el entorno...
                    </div>
                </main>

                {/* PANEL DERECHO: HERRAMIENTAS Y EDICIÓN */}
                <aside className="w-72 glass-panel border-l border-slate-700 flex flex-col z-10 shrink-0 overflow-hidden">
                    <div className="p-3 border-b border-slate-700 bg-slate-800/80 shrink-0">
                        <h3 className="text-xs font-semibold text-slate-200 flex items-center">
                            <i className="fa-solid fa-layer-group text-blue-400 mr-2"></i> Detalles de Selección
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto scroll-hidden p-4 space-y-5">

                        {!selectedModelo ? (
                            <div className="text-center text-slate-500 text-xs py-4 opacity-70">
                                <i className="fa-solid fa-mouse-pointer mb-2 text-xl"></i>
                                <p>Selecciona un modelo de la lista</p>
                            </div>
                        ) : (
                            <>
                                {/* Modos de Visualización */}
                                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 shadow-inner mb-2">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <i className="fa-solid fa-layer-group text-blue-400"></i> Capas de Visualización
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => setViewMode('topografica')}
                                            className={`py-2 px-3 rounded text-xs flex items-center justify-between transition ${viewMode === 'topografica' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white font-medium' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                        >
                                            <span className="flex items-center gap-2"><i className="fa-solid fa-mountain flex w-4"></i> Topográfica (TIN)</span>
                                            {viewMode === 'topografica' && <i className="fa-solid fa-check text-blue-200"></i>}
                                        </button>
                                        <button
                                            onClick={() => setViewMode('geografica')}
                                            className={`py-2 px-3 rounded text-xs flex items-center justify-between transition ${viewMode === 'geografica' ? 'bg-emerald-600 shadow-lg shadow-emerald-900/50 text-white font-medium' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                        >
                                            <span className="flex items-center gap-2"><i className="fa-solid fa-earth-americas flex w-4"></i> Geográfica</span>
                                            {viewMode === 'geografica' && <i className="fa-solid fa-check text-emerald-200"></i>}
                                        </button>
                                        <button
                                            onClick={() => setViewMode('ifc')}
                                            className={`py-2 px-3 rounded text-xs flex items-center justify-between transition ${viewMode === 'ifc' ? 'bg-purple-600 shadow-lg shadow-purple-900/50 text-white font-medium' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                        >
                                            <span className="flex items-center gap-2"><i className="fa-solid fa-cube flex w-4"></i> Estructural (IFC/BIM)</span>
                                            {viewMode === 'ifc' && <i className="fa-solid fa-check text-purple-200"></i>}
                                        </button>
                                    </div>
                                </div>

                                {/* Info Básica desde la DB y Python */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">Información del Modelo</h4>
                                    <div className="text-xs text-slate-300 space-y-2">
                                        <p className="flex justify-between border-b border-slate-700/50 pb-1">
                                            <span className="text-slate-400">Archivo</span>
                                            <span className="font-semibold text-white max-w-[120px] truncate" title={selectedModelo.nombre_archivo}>{selectedModelo.nombre_archivo}</span>
                                        </p>

                                        {/* Campos Mapeados del JSONB metadata (LandXML) */}
                                        {selectedModelo.metadata?.cantidad_superficies !== undefined && (
                                            <p className="flex justify-between border-b border-slate-700/50 pb-1">
                                                <span className="text-slate-400">Superficies TIN</span>
                                                <span className="font-medium bg-slate-700/50 px-1.5 rounded">{selectedModelo.metadata.cantidad_superficies}</span>
                                            </p>
                                        )}
                                        {selectedModelo.metadata?.cantidad_puntos_control !== undefined && (
                                            <p className="flex justify-between border-b border-slate-700/50 pb-1">
                                                <span className="text-slate-400">CgPoints (Puntos)</span>
                                                <span className="font-bold text-blue-300">{selectedModelo.metadata.cantidad_puntos_control}</span>
                                            </p>
                                        )}
                                        {selectedModelo.metadata?.unidades && (
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Unidades</span>
                                                <span className="text-emerald-400">{selectedModelo.metadata.unidades}</span>
                                            </p>
                                        )}

                                        {/* Campos genéricos IFC u error */}
                                        {selectedModelo.estado === 'ERROR_PROCESAMIENTO' && (
                                            <div className="mt-2 p-2 bg-red-900/20 border border-red-500/50 rounded flex flex-col gap-1">
                                                <p className="text-red-400 font-bold">
                                                    Error: {selectedModelo.metadata?.error || 'Falló la extracción.'}
                                                </p>
                                                <p className="text-[10px] text-red-300 opacity-80 font-mono break-all whitespace-pre-wrap">
                                                    Detalle Técnico: {
                                                        typeof selectedModelo.metadata?.detalle === 'object'
                                                            ? JSON.stringify(selectedModelo.metadata.detalle)
                                                            : String(selectedModelo.metadata?.detalle || 'Ninguno')
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedModelo.metadata?.lineas_ifc !== undefined && (
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Líneas IFC estimadas</span>
                                                <span className="text-blue-300">{selectedModelo.metadata.lineas_ifc}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Cálculo */}
                                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 shadow-inner">
                                    <h4 className="text-xs font-bold text-orange-400 mb-3 flex items-center gap-1.5">
                                        <i className="fa-solid fa-calculator"></i> Análisis Espacial
                                    </h4>
                                    <label className="text-[10px] text-slate-400 block mb-1">Volumetría contra capa base:</label>
                                    <select className="w-full bg-slate-900 border border-slate-600 text-xs rounded p-1.5 mb-3 focus:outline-none focus:border-blue-500 text-slate-300 transition-colors">
                                        <option>Rasante de Diseño</option>
                                        <option>Terreno Natural Previo</option>
                                    </select>
                                    <button className="w-full bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/20 text-xs py-2 rounded transition font-medium">
                                        Calcular Volúmenes
                                    </button>
                                </div>

                                {/* Edición */}
                                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 shadow-inner">
                                    <h4 className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                                        <i className="fa-solid fa-arrows-up-down-left-right"></i> Transformación
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Desfase Z (m)</label>
                                            <input type="number" defaultValue="0.00" className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 text-xs rounded p-1.5 text-center font-mono text-slate-300 outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Rotación (°)</label>
                                            <input type="number" defaultValue="0.00" className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 text-xs rounded p-1.5 text-center font-mono text-slate-300 outline-none transition-colors" />
                                        </div>
                                    </div>
                                    <button className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-500 hover:border-emerald-500 text-white shadow shadow-slate-900/50 hover:shadow-emerald-900/50 text-xs py-2 rounded transition font-medium">
                                        Aplicar Cambios
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-3 border-t border-slate-700 bg-slate-800/30 shrink-0">
                        <button
                            disabled={!selectedModelo}
                            className={`w-full bg-slate-800 border border-slate-600 text-slate-300 text-[11px] py-1.5 rounded transition mb-1.5 flex justify-center items-center gap-2 ${selectedModelo ? 'hover:bg-slate-700 hover:border-slate-500' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <i className="fa-solid fa-download"></i> Descargar Archivo
                        </button>
                        <button
                            onClick={() => selectedModelo && handleDelete(selectedModelo.id)}
                            disabled={!selectedModelo}
                            className={`w-full bg-transparent border border-transparent text-[11px] py-1.5 rounded transition flex justify-center items-center gap-2 ${selectedModelo ? 'hover:bg-red-900/30 text-red-500/80 hover:text-red-400 hover:border-red-500/50' : 'opacity-50 text-slate-500 cursor-not-allowed'}`}
                        >
                            <i className="fa-solid fa-trash-can"></i> Eliminar del Proyecto
                        </button>
                    </div>
                </aside>

            </div>


        </div>
    );

    if (isFullscreen) {
        // Renderizamos el visor directamente en el document.body usando un Portal
        return (
            <>
                <div className="h-full w-full bg-slate-800/10 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center min-h-[500px] shadow-inner">
                    <div className="text-center opacity-70">
                        <i className="fa-solid fa-expand text-blue-500/50 text-4xl mb-3"></i>
                        <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Visor 3D en Pantalla Completa</p>
                    </div>
                </div>
                {createPortal(dashboardContent, document.body)}
            </>
        );
    }

    return dashboardContent;
}
