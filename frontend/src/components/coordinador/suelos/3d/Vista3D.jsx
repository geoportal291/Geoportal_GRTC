import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import proj4 from 'proj4';
import './Vista3D.css';

// 1. CONFIGURACIÓN GLOBAL
const ION_TOKEN = process.env.REACT_APP_CESIUM_TOKEN;
if (typeof window !== 'undefined') {
    window.CESIUM_BASE_URL = '/cesium';
}

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'https://backendgeoportal.fly.dev';
const UTM_18S = "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs";
const UTM_19S = "+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs";
const WGS84 = "EPSG:4326";

export default function Vista3D() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [modelos, setModelos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedModelo, setSelectedModelo] = useState(null);
    const [mapOpacity, setMapOpacity] = useState(1.0); // Estado para el slider de transparencia
    const [isRightOpen, setIsRightOpen] = useState(true); // Estado para colapsar panel derecho
    const [isGroundMode, setIsGroundMode] = useState(false); // Modo primera persona - Desactivado por defecto
    const [isChunkLoading, setIsChunkLoading] = useState(false); // Cargando chunk en RAM
    const [isTerrainLoaded, setIsTerrainLoaded] = useState(false); // Estado del relieve
    const [subProgresivas, setSubProgresivas] = useState([]); // Boreholes del tramo
    const [selectedBorehole, setSelectedBorehole] = useState(null); // Borehole seleccionado
    const [isFetchingBoreholes, setIsFetchingBoreholes] = useState(false);

    // VISUALIZACIÓN DEL MODELO IMPORTADO
    const [mapStyle, setMapStyle] = useState('hipso'); // 'hipso', 'topo', o 'malla'
    const [selectedEstrato, setSelectedEstrato] = useState(null); // 0, 1, 2 para resaltar estratos
    const [showEstratosLayer, setShowEstratosLayer] = useState(false); // Activado por botón manual
    const mapStyleRef = useRef('hipso');
    const hipsoPrimitiveRef = useRef(null);
    const mallaSolidRef = useRef(null);
    const mallaWireRef = useRef(null);
    const boundaryWireRef = useRef(null);
    const estratosRefs = useRef([]);

    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const fileInputRef = useRef(null);
    const chunkRectangleRef = useRef(null); // Referencia para el límite del "Cubo/Chunk"
    const boreholesEntitiesRef = useRef([]); // Referencia para los cilindros de sondajes

    // Sincronizar estado visual y aplicarlo a los primitivos reales sin re-parsear
    useEffect(() => {
        mapStyleRef.current = mapStyle;
        if (hipsoPrimitiveRef.current && mallaSolidRef.current && mallaWireRef.current) {
            // El modo 'estratos' oculta el hipso y permite que el toggle de estratos tome el control
            hipsoPrimitiveRef.current.show = mapStyle === 'hipso';
            
            mallaSolidRef.current.show = mapStyle === 'malla';
            mallaWireRef.current.show = mapStyle === 'malla';
            
            if (boundaryWireRef.current) {
                boundaryWireRef.current.show = mapStyle !== 'malla';
            }

            if (viewerRef.current) viewerRef.current.scene.requestRender();
        }
    }, [mapStyle]);

    // EFECTO: Control de visibilidad de Sondajes (Boreholes)
    useEffect(() => {
        if (viewerRef.current) {
            const viewer = viewerRef.current;
            const isXray = mapStyle === 'estratos' && mapOpacity === 0.0 && showEstratosLayer;
            
            if (boreholesEntitiesRef.current) {
                boreholesEntitiesRef.current.forEach(entity => {
                    entity.show = isXray;
                });
            }
            viewer.scene.requestRender();
        }
    }, [mapOpacity, showEstratosLayer, mapStyle]);

    useEffect(() => {
        fetchModelos();
    }, []);

    useEffect(() => {
        const initCesium = async () => {
            if (!containerRef.current || viewerRef.current) return;

            try {
                console.log("[CESIUM] Activando RELIEVE 3D y atmósfera...");

                if (ION_TOKEN) {
                    Cesium.Ion.defaultAccessToken = ION_TOKEN;
                }

                // 1. CARGA DE TERRENO REAL (ELEVACIÓN)
                let terrainProvider;
                try {
                    terrainProvider = await Cesium.createWorldTerrainAsync({
                        requestVertexNormals: true, // Sombras realistas sobre relieve
                        requestWaterMask: true      // Efectos de agua
                    });
                    setIsTerrainLoaded(true);
                } catch (e) {
                    console.warn("Fallo carga de terreno 3D. Usando elipsoide básico.");
                    terrainProvider = new Cesium.EllipsoidTerrainProvider();
                    setIsTerrainLoaded(false);
                }

                const viewer = new Cesium.Viewer(containerRef.current, {
                    terrainProvider: terrainProvider,
                    baseLayerPicker: false,
                    timeline: false,
                    animation: false,
                    geocoder: false,
                    homeButton: false,
                    sceneModePicker: false,
                    navigationHelpButton: false,
                    infoBox: false,
                    selectionIndicator: false,
                    // Omitimos skyBox y skyAtmosphere para que Cesium use sus valores por defecto (objetos reales)
                    // y evitar el error de TypeError al pasar un booleano 'true'.
                    requestRenderMode: true,
                    maximumRenderTimeChange: Infinity,
                    msaaSamples: 1,
                    contextOptions: {
                        webgl: {
                            preserveDrawingBuffer: true,
                            antialias: false,
                            failIfMajorPerformanceCaveat: false
                        }
                    }
                });

                viewer.resolutionScale = Math.min(window.devicePixelRatio || 1.0, 1.5);
                viewer.useBrowserRecommendedResolution = true;

                // Deshabilitar el rastreo de entidades y zoom automático por doble clic (Vista de 1era persona accidental)
                viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
                viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

                try {
                    const imageryLayer = Cesium.ImageryLayer.fromWorldImagery({
                        style: Cesium.IonWorldImageryStyle.AERIAL
                    });
                    imageryLayer.minificationFilter = Cesium.TextureMinificationFilter.LINEAR;
                    imageryLayer.magnificationFilter = Cesium.TextureMinificationFilter.LINEAR;
                    viewer.imageryLayers.add(imageryLayer);
                } catch (e) {
                    console.warn("Falló carga de capa satelital.");
                }

                // --- CONFIGURACIÓN DE RENDIMIENTO EXTREMO (CHUNKS) ---
                viewer.scene.globe.showGroundAtmosphere = false;
                viewer.scene.highDynamicRange = false;
                viewer.scene.globe.enableLighting = false;
                viewer.scene.shadowMap.enabled = false;

                // Desactivar post-procesado
                viewer.scene.postProcessStages.fxaa.enabled = false;

                // NIEBLA LIGERA 
                viewer.scene.fog.enabled = true;
                viewer.scene.fog.density = 0.0001;

                // ESTRATEGIA DE MEMORIA OPTIMIZADA (Evita lag en relieve)
                viewer.scene.globe.tileCacheSize = 100; // Balanceado para no ahogar la RAM
                viewer.scene.globe.loadingDescendantLimit = 10; // Carga simultánea más ligera
                viewer.scene.globe.preloadAncestors = false; // Prioriza lo que está en cámara
                viewer.scene.globe.preloadSiblings = false;

                viewer.scene.logarithmicDepthBuffer = false;
                viewer.resolutionScale = 0.85;

                // VISTA GLOBAL
                viewer.camera.setView({
                    destination: Cesium.Cartesian3.fromDegrees(-75.0, -12.0, 10000000),
                    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
                });

                viewerRef.current = viewer;

                // --- MANEJO DE INTERACCIÓN (PICKING) DE SONDAJES ---
                const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handler.setInputAction((movement) => {
                    const pickedObject = viewer.scene.pick(movement.position);
                    if (Cesium.defined(pickedObject)) {
                        const entity = pickedObject.id;
                        // El dato está vinculado en renderBoreholes como entity.boreholeData
                        if (entity && entity.boreholeData) {
                            setSelectedBorehole(entity.boreholeData);
                            setSelectedEstrato(null); 
                            setIsRightOpen(true); // Asegurar que el panel se abra
                            console.log("[3D] Sondaje seleccionado via picking:", entity.boreholeData.nombre);
                        }
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                // Guardar para limpieza
                viewer.handler = handler;

                console.log("[CESIUM] Motor configurado con RELIEVE REAL.");
            } catch (err) {
                console.error("[CESIUM] Error en inicio:", err);
            }
        };

        const timer = setTimeout(initCesium, 100);
        return () => {
            clearTimeout(timer);
            if (viewerRef.current) {
                console.log("[CESIUM] Destruyendo visor...");
                try {
                    const v = viewerRef.current;
                    viewerRef.current = null; // Evitar accesos asíncronos
                    v.destroy();
                } catch (e) {
                    console.warn("Error en destroy:", e);
                }
            }
        };
    }, []);

    // EFECTO: Control de opacidad dinámico del mapa base y aparición de Estratos
    useEffect(() => {
        if (viewerRef.current) {
            const viewer = viewerRef.current;
            
            // 1. Atenuar todas las capas satelitales (Bing Maps, Sentinel, etc.)
            for (let i = 0; i < viewer.imageryLayers.length; i++) {
                const layer = viewer.imageryLayers.get(i);
                layer.alpha = mapOpacity;
            }

            // 2. Controlar la visibilidad de los estratos: 
            // Solo visibles en modo ESTRATIGRÁFICO, cuando la capa ha sido activada manualmente, y el suelo real está en opacidad 0%.
            const isXray = mapStyle === 'estratos' && mapOpacity === 0.0 && showEstratosLayer;
            
            if (estratosRefs.current) {
                estratosRefs.current.forEach(prim => {
                    if (prim) prim.show = isXray;
                });
            }

            // También controlar visibilidad de sondajes individuales
            if (boreholesEntitiesRef.current) {
                boreholesEntitiesRef.current.forEach(entity => {
                    entity.show = isXray;
                });
            }

            viewer.scene.requestRender();
        }
    }, [mapOpacity, showEstratosLayer, mapStyle]);

    // EFECTO: Resaltado visual del estrato seleccionado en el panel
    useEffect(() => {
        if (!estratosRefs.current || estratosRefs.current.length < 3 || !viewerRef.current) return;
        
        const hexes = ['#A67D5D', '#b8a99a', '#858585'];
        
        estratosRefs.current.forEach((prim, index) => {
            if (!prim || !prim.appearance || !prim.appearance.material) return;
            const mat = prim.appearance.material;
            const originalColor = Cesium.Color.fromCssColorString(hexes[index]);
            
            if (selectedEstrato === null) {
                // Estado normal: Todos opacos
                mat.uniforms.u_baseColor = originalColor.withAlpha(1.0);
            } else {
                if (selectedEstrato === index) {
                    // Seleccionado
                    mat.uniforms.u_baseColor = originalColor.withAlpha(1.0);
                } else {
                    // No seleccionado: Opaco/translúcido (apenas visible)
                    mat.uniforms.u_baseColor = originalColor.withAlpha(0.15);
                }
            }
        });
        
        viewerRef.current.scene.requestRender();
    }, [selectedEstrato]);

    // REPARACIÓN: Forzar a Cesium a recalcular su tamaño al cambiar a pantalla completa
    useEffect(() => {
        if (viewerRef.current) {
            console.log("[CESIUM] Reajustando tamaño para modo:", isFullscreen ? "FULLSCREEN" : "NORMAL");

            // Intentar reajustar en varios intervalos para asegurar captura del nuevo tamaño del DOM tras el portal
            const intervals = [10, 100, 300, 600, 1000];
            const timers = intervals.map(ms => setTimeout(() => {
                if (viewerRef.current) {
                    viewerRef.current.resize();
                    viewerRef.current.scene.requestRender();
                }
            }, ms));

            return () => timers.forEach(t => clearTimeout(t));
        }
    }, [isFullscreen]);

    // EFECTO: Gestión Dinámica de Controles y Bloqueo de Eje (Anti-Inclinación)
    useEffect(() => {
        if (!viewerRef.current) return;
        const viewer = viewerRef.current;
        const controller = viewer.scene.screenSpaceCameraController;

        // Función para mantener la cámara siempre "parada" y gestionar límites
        const monitorCamera = () => {
            if (!viewer.camera || viewer.isDestroyed()) return;

            if (isGroundMode) {
                const pos = viewer.camera.positionCartographic;

                // Salvavidas Anti-Crasheo: Si por un cálculo agresivo del mouse la cámara pierde sus valores matemáticos, abortamos.
                if (!pos || isNaN(pos.longitude) || isNaN(pos.latitude) || isNaN(pos.height) ||
                    isNaN(viewer.camera.heading) || isNaN(viewer.camera.pitch)) {
                    return;
                }

                let corrected = false;
                let newLon = pos.longitude;
                let newLat = pos.latitude;
                let newHeight = pos.height;

                // 1. MUROS VIRTUALES EXTREMOS: Respaldar 'cartographicLimitRectangle' nativo con un rebote estricto por código
                if (chunkRectangleRef.current) {
                    const rect = chunkRectangleRef.current;
                    const b = 0.000001; // Pequeño buffer interno
                    if (newLon <= rect.west) { newLon = rect.west + b; corrected = true; }
                    if (newLon >= rect.east) { newLon = rect.east - b; corrected = true; }
                    if (newLat <= rect.south) { newLat = rect.south + b; corrected = true; }
                    if (newLat >= rect.north) { newLat = rect.north - b; corrected = true; }
                }

                // 2. SUELO DE HIERRO: Evitar caer al inframundo/vacío estelar al hacer zoom cerca de los bordes
                // Prevenir cámara subterránea consultando la elevación del mosaico 3D exacto debajo nuestro
                const terrainHeight = viewer.scene.globe.getHeight(pos) || 0;

                // Mantenemos una estatura mínima de 1.5 metros (altura de humano) para nunca cruzar las normales del terreno
                if (newHeight < terrainHeight + 1.5) {
                    newHeight = terrainHeight + 1.5;
                    corrected = true;
                }

                // 3. TECHO DE CRISTAL RELATIVO: Evitar que un zoom fortísimo al cielo envíe la cámara a la estratósfera.
                // Se usa la altura del terreno (+2000m) en lugar de un número absoluto, dado que en Perú los terrenos pueden estar a >4000 msnm.
                const maxAllowedHeight = terrainHeight + 2000.0;
                if (newHeight > maxAllowedHeight) {
                    newHeight = maxAllowedHeight;
                    corrected = true;
                }

                // 4. BLOQUEO ANTI-MAREO: Evitar que el mundo se tuerza
                if (viewer.camera.roll !== 0) {
                    corrected = true;
                }

                if (corrected) {
                    try {
                        viewer.camera.setView({
                            destination: Cesium.Cartesian3.fromRadians(newLon, newLat, newHeight),
                            orientation: {
                                heading: viewer.camera.heading,
                                pitch: viewer.camera.pitch,
                                roll: 0.0 // Siempre restaurar Anti-Roll
                            }
                        });
                    } catch (e) { /* Suprimir error silencioso si el math interno de Cesium aún escupe NaN */ }
                }
            }
        };

        if (isGroundMode) {
            console.log("[CESIUM] Aplicando Cuarto Aislado (Muros Nativos de Chunk).");

            if (chunkRectangleRef.current) {
                // Al colocar esto, Cesium pone una barrera física invisible donde el jugador simplemente "choca" con los bordes
                viewer.scene.globe.cartographicLimitRectangle = chunkRectangleRef.current;
            }

            controller.translateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];
            controller.rotateEventTypes = [];
            controller.lookEventTypes = [Cesium.CameraEventType.RIGHT_DRAG];
            controller.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
            controller.tiltEventTypes = [];

            // Inercia para un giro fluido y sin estirones
            controller.inertiaSpin = 0.2;
            controller.inertiaTranslate = 0.2;
            controller.enableCollisionDetection = true;
            controller.minimumZoomDistance = 3.0;
            controller.maximumZoomDistance = Number.POSITIVE_INFINITY; // Dejamos el techo a discreción del preRender inteligente para evitar entierros absolutos

            // Alta definición porque ya está cargado en caché
            viewer.scene.globe.maximumScreenSpaceError = 1.2;

            viewer.scene.preRender.addEventListener(monitorCamera);

            return () => {
                if (!viewer.isDestroyed()) {
                    viewer.scene.preRender.removeEventListener(monitorCamera);
                }
            };
        } else {
            console.log("[CESIUM] Regresando a Vista Planetaria (2D Absoluto).");
            if (!viewer.isDestroyed()) {
                viewer.scene.globe.cartographicLimitRectangle = undefined;
                viewer.scene.globe.maximumScreenSpaceError = 2.0;

                controller.translateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];
                controller.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG]; // Restaurar el paneo (arrastre) del planeta
                controller.zoomEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];

                // Tilt desactivado para evitar vista 3D en satélite, asegurando el aspecto 2D plano desde arriba
                controller.tiltEventTypes = [];

                // Borrar lookEventTypes (la propiedad clave "mirar alrededor" de los FPS) para devolverle al mouse izquierdo su pan nativo
                controller.lookEventTypes = undefined;

                controller.inertiaSpin = 0.9;
                controller.inertiaTranslate = 0.9;
                controller.enableCollisionDetection = false;
                controller.minimumZoomDistance = 150.0;
                controller.maximumZoomDistance = Number.POSITIVE_INFINITY;

                // Forzar a la cámara a mirar siempre hacia abajo (nadir) para la experiencia 2D
                viewer.scene.camera.setView({
                    orientation: {
                        heading: viewer.scene.camera.heading,
                        pitch: Cesium.Math.toRadians(-90.0), // Restablecer picado total para mapa plano
                        roll: 0.0
                    }
                });
            }
        }
    }, [isGroundMode]);

    // Vuelo de cámara al seleccionar modelo + Marcador Visual
    useEffect(() => {
        if (selectedModelo?.metadata?.centro_utm && viewerRef.current) {
            const viewer = viewerRef.current;

            // 1. CANCELAR VUELOS PREVIOS (Evita parpadeos y tirones)
            viewer.camera.cancelFlight();

            let { x, y } = selectedModelo.metadata.centro_utm;

            console.log("%c [3D] COORDINATES DEBUG ", "background: #222; color: #bada55; font-size: 12px; font-weight: bold;");
            console.log("Valores originales del archivo -> X:", x, "Y:", y);

            // CORRECCIÓN AUTOMÁTICA DE INVERSIÓN:
            // En Perú, Norte (Y) siempre es > 2,000,000 y Este (X) está entre 100k y 999k.
            if (x > y) {
                console.log("[3D] Detectada inversión de ejes (X > Y). Corrigiendo...");
                const temp = x;
                x = y;
                y = temp;
            }

            // DETECCIÓN DE ZONA AUTOMÁTICA (Cusco/Sierra vs Lima/Costa):
            // En el sur de Perú, la Zona 19S empieza con valores de Este bajos (~160k).
            // Si el valor está en el rango de los 200k, es Cusco (Zona 19S).
            const projection = x < 400000 ? UTM_19S : UTM_18S;

            console.log("Valores corregidos -> Este(X):", x, "Norte(Y):", y);
            console.log("Usando Proyección:", projection === UTM_19S ? "Zona 19S (Cusco/Puno/Sierra)" : "Zona 18S (Lima/Costa)");

            try {
                const projection = x < 400000 ? UTM_19S : UTM_18S;
                const [lon, lat] = proj4(projection, WGS84, [x, y]);

                console.log(`WGS84 Calculado: LON=${lon}, LAT=${lat}`);

                // --- 1. RENDERIZACIÓN DE LA MALLA (LANDXML -> OBJ -> CESIUM) "Con Borde Rojo" ---
                // Limpiar entidades planas nativas y meshes de la sesión anterior
                viewer.entities.removeAll();
                
                // Buscar primitivas custom que hayan sido añadidas por nuestro obj-loader y borrarlas
                const primitivesToRemove = [];
                for (let i = 0; i < viewer.scene.primitives.length; i++) {
                    const prim = viewer.scene.primitives.get(i);
                    if (prim.isCustomTopography) {
                        primitivesToRemove.push(prim);
                    }
                }
                primitivesToRemove.forEach(p => viewer.scene.primitives.remove(p));

                if (selectedModelo.url_archivo && selectedModelo.url_archivo !== 'PENDIENTE') {
                    console.log(`[3D] Descargando malla espacial desde: ${selectedModelo.url_archivo}`);
                    
                    // PROMESA 1: Obtener la altura real del planeta Cesium en el Centro del modelo para el Drop-to-Ground
                    const getTerrainPromise = Cesium.sampleTerrainMostDetailed(
                        viewer.terrainProvider, 
                        [Cesium.Cartographic.fromDegrees(lon, lat)]
                    ).then(samples => samples[0].height || 0).catch(() => 0);

                    // PROMESA 2: Descargar el modelo LandXML (.obj backend)
                    const fetchModelPromise = fetch(selectedModelo.url_archivo).then(r => r.text());

                    Promise.all([getTerrainPromise, fetchModelPromise])
                    .then(([terrainCenterZ, objText]) => {
                        console.log(`[DEBUG 3D] Offset Z Planeta: ${terrainCenterZ}m | Texto: ${objText.length} bytes.`);
                        const lines = objText.split('\n');
                        
                        const verticesInfo = []; // Array temporal (lon, lat, rawZ)
                        const indicesTriangulos = [];
                        const indicesBordesFull = [];
                        const elevationData = []; 
                        let minZ = Infinity;
                        let maxZ = -Infinity;

                        for (const line of lines) {
                            if (line.startsWith('v ')) {
                                const parts = line.trim().split(/\s+/);
                                let py = parseFloat(parts[1]); 
                                let px = parseFloat(parts[2]);
                                let pz = parseFloat(parts[3]);
                                
                                minZ = Math.min(minZ, pz);
                                maxZ = Math.max(maxZ, pz);
                                // Conservamos la elevación original para pintar el gradiente Hipsométrico matemáticamente idéntico
                                elevationData.push(pz);

                                if (px > py) { const t = px; px = py; py = t; }
                                const [vLon, vLat] = proj4(projection, WGS84, [px, py]);
                                
                                verticesInfo.push({ lon: vLon, lat: vLat, z: pz });
                            } else if (line.startsWith('f ')) {
                                const parts = line.trim().split(/\s+/);
                                const v1 = parseInt(parts[1]) - 1;
                                const v2 = parseInt(parts[2]) - 1;
                                const v3 = parseInt(parts[3]) - 1;
                                
                                indicesTriangulos.push(v1, v2, v3);
                                indicesBordesFull.push(v1, v2, v2, v3, v3, v1);
                            }
                        }

                        // CÁLCULO DE DROP-TO-GROUND (ADAPTACIÓN AL TERRENO):
                        // Calculamos el centro vertical del modelo original
                        const modelCenterZ = minZ + ((maxZ - minZ) / 2.0);
                        // El delta para hundir el modelo entero (Offset)
                        // Atamos el centro de masa del archivo a la altura de las montañas de Cesium, 
                        // con 2.0m de amortiguador para que no haya colisiones ("Z-fighting") satelitales.
                        let deltaZ = terrainCenterZ - modelCenterZ;
                        
                        // Si el terreno satelital falló al cargar y dice '0' (modo offline o error de API), no hundimos ciegamente
                        if (Math.abs(terrainCenterZ) < 1.0) deltaZ = 0; 
                        
                        console.log(`[3D DROP-TO-GROUND] Altura SRTM Terreno: ${terrainCenterZ}m | Centro Modelo Importado: ${modelCenterZ}m | Offset de Adaptación: ${deltaZ}m`);

                        const vertices = [];
                        for (let i = 0; i < verticesInfo.length; i++) {
                            const vi = verticesInfo[i];
                            // Adaptamos (hundimos) su altura original según la discrepancia satelital calculada
                            const droppedZ = vi.z + deltaZ + 2.0;
                            vertices.push(Cesium.Cartesian3.fromDegrees(vi.lon, vi.lat, droppedZ));
                        }

                        console.log(`[DEBUG 3D] Vertices generados y adaptados: ${vertices.length}`);
                        console.log(`[DEBUG 3D] Índices de Triángulos: ${indicesTriangulos.length} (${indicesTriangulos.length/3} caras)`);

                        // Calcular el borde exterior real del modelo para el "borde rojo"
                        const edgeMap = new Map();
                        for (let i = 0; i < indicesTriangulos.length; i += 3) {
                            const v1 = indicesTriangulos[i];
                            const v2 = indicesTriangulos[i+1];
                            const v3 = indicesTriangulos[i+2];

                            const addEdge = (a, b) => {
                                const key = a < b ? `${a}-${b}` : `${b}-${a}`;
                                edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
                            };

                            addEdge(v1, v2);
                            addEdge(v2, v3);
                            addEdge(v3, v1);
                        }

                        const indicesBoundary = [];
                        for (const [key, count] of edgeMap.entries()) {
                            if (count === 1) { // Límite exterior, ya que solo pertenece a un polígono
                                const [a, b] = key.split('-').map(Number);
                                indicesBoundary.push(a, b);
                            }
                        }

                        if (vertices.length > 0) {
                            const positions64 = new Float64Array(vertices.length * 3);
                            const colors8 = new Uint8Array(vertices.length * 4); // Para color per-vertex (hipsometría)
                            
                            const zRange = maxZ - minZ || 1.0;

                            for (let i = 0; i < vertices.length; i++) {
                                positions64[i * 3] = vertices[i].x;
                                positions64[i * 3 + 1] = vertices[i].y;
                                positions64[i * 3 + 2] = vertices[i].z;

                                // --- Mapa Hipsométrico ---
                                // normalizedZ = 0 (bajo) a 1 (alto)
                                const normalizedZ = (elevationData[i] - minZ) / zRange;
                                // Hue en Cesium: Verde es ~0.33, Rojo es 0.0. Interpolar.
                                const hue = (1.0 - normalizedZ) * (1.0 / 3.0);
                                const vColor = Cesium.Color.fromHsl(hue, 1.0, 0.45, 1.0); // Algo menos luminoso para lucir sólido con sombreado
                                
                                colors8[i * 4] = vColor.red * 255;
                                colors8[i * 4 + 1] = vColor.green * 255;
                                colors8[i * 4 + 2] = vColor.blue * 255;
                                colors8[i * 4 + 3] = 255;
                            }

                            // Geometría Sólida HIPSOMÉTRICA (Color por vértice)
                            let solidGeometryHipso = new Cesium.Geometry({
                                attributes: {
                                    position: new Cesium.GeometryAttribute({
                                        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                                        componentsPerAttribute: 3,
                                        values: positions64
                                    }),
                                    color: new Cesium.GeometryAttribute({
                                        componentDatatype: Cesium.ComponentDatatype.UNSIGNED_BYTE,
                                        componentsPerAttribute: 4,
                                        values: colors8,
                                        normalize: true
                                    })
                                },
                                indices: new Uint32Array(indicesTriangulos),
                                primitiveType: Cesium.PrimitiveType.TRIANGLES,
                                boundingSphere: Cesium.BoundingSphere.fromPoints(vertices)
                            });

                            // Geometría Sólida TOPOGRÁFICA (Tierra)
                            let solidGeometryTopo = new Cesium.Geometry({
                                attributes: {
                                    position: new Cesium.GeometryAttribute({
                                        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                                        componentsPerAttribute: 3,
                                        values: positions64
                                    })
                                },
                                indices: new Uint32Array(indicesTriangulos),
                                primitiveType: Cesium.PrimitiveType.TRIANGLES,
                                boundingSphere: Cesium.BoundingSphere.fromPoints(vertices)
                            });

                            // Computar normales
                            try {
                                solidGeometryHipso = Cesium.GeometryPipeline.computeNormal(solidGeometryHipso);
                                solidGeometryTopo = Cesium.GeometryPipeline.computeNormal(solidGeometryTopo);
                            } catch (e) {
                                console.warn("[3D] No se pudieron computar las normales, la iluminación será degradada:", e);
                            }

                            const solidPrimitiveHipso = new Cesium.Primitive({
                                geometryInstances: new Cesium.GeometryInstance({ geometry: solidGeometryHipso }),
                                appearance: new Cesium.PerInstanceColorAppearance({
                                    flat: false, translucent: false, closed: false, renderState: { cull: { enabled: false }, depthTest: { enabled: true } }
                                }),
                                asynchronous: false,
                                show: mapStyleRef.current === 'hipso'
                            });
                            solidPrimitiveHipso.isCustomTopography = true;

                            // -------------------------
                            // GEOMETRÍAS MALLA ORIGINAL
                            // -------------------------
                            const solidInstanceMalla = new Cesium.GeometryInstance({
                                geometry: solidGeometryTopo, // Reutilizamos topología base (coordenadas)
                                attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(0.25)) } // Rojo translúcido
                            });
                            
                            const solidPrimitiveMalla = new Cesium.Primitive({
                                geometryInstances: solidInstanceMalla,
                                appearance: new Cesium.PerInstanceColorAppearance({
                                    flat: true, translucent: true, closed: false,
                                    renderState: { cull: { enabled: false }, depthTest: { enabled: true } }
                                }),
                                asynchronous: false,
                                show: mapStyleRef.current === 'malla'
                            });
                            solidPrimitiveMalla.isCustomTopography = true;

                            const wireGeometryMalla = new Cesium.Geometry({
                                attributes: {
                                    position: new Cesium.GeometryAttribute({
                                        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                                        componentsPerAttribute: 3,
                                        values: positions64
                                    })
                                },
                                indices: new Uint32Array(indicesBordesFull),
                                primitiveType: Cesium.PrimitiveType.LINES,
                                boundingSphere: Cesium.BoundingSphere.fromPoints(vertices)
                            });

                            const wirePrimitiveMalla = new Cesium.Primitive({
                                geometryInstances: new Cesium.GeometryInstance({
                                    geometry: wireGeometryMalla,
                                    attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(1.0)) }
                                }),
                                appearance: new Cesium.PerInstanceColorAppearance({
                                    flat: true, translucent: false,
                                    renderState: { cull: { enabled: false }, depthTest: { enabled: true } }
                                }),
                                asynchronous: false,
                                show: mapStyleRef.current === 'malla'
                            });
                            wirePrimitiveMalla.isCustomTopography = true;

                            hipsoPrimitiveRef.current = solidPrimitiveHipso;
                            mallaSolidRef.current = solidPrimitiveMalla;
                            mallaWireRef.current = wirePrimitiveMalla;

                            // Geometría Wireframe (SOLO Borde Rojo Exterior)
                            const wireGeometry = new Cesium.Geometry({
                                attributes: {
                                    position: new Cesium.GeometryAttribute({
                                        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                                        componentsPerAttribute: 3,
                                        values: positions64
                                    })
                                },
                                indices: new Uint32Array(indicesBoundary),
                                primitiveType: Cesium.PrimitiveType.LINES,
                                boundingSphere: Cesium.BoundingSphere.fromPoints(vertices)
                            });

                            const bs = Cesium.BoundingSphere.fromPoints(vertices);
                            console.log(`[DEBUG 3D] BoundingSphere Válido -> Centro X: ${bs.center.x.toFixed(2)}, Radio: ${bs.radius.toFixed(2)}`);

                            const wireInstance = new Cesium.GeometryInstance({
                                geometry: wireGeometry,
                                attributes: {
                                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(1.0))
                                }
                            });

                            const wirePrimitive = new Cesium.Primitive({
                                geometryInstances: wireInstance,
                                appearance: new Cesium.PerInstanceColorAppearance({ 
                                    flat: true, // Líneas no necesitan sombreado
                                    translucent: false,
                                    renderState: {
                                        cull: { enabled: false },
                                        depthTest: { enabled: true }
                                    }
                                }),
                                asynchronous: false,
                                show: mapStyleRef.current !== 'malla' // Oculto cuando estamos en 'malla', visible en 'hipso' y 'topo'
                            });
                            wirePrimitive.isCustomTopography = true;
                            boundaryWireRef.current = wirePrimitive;

                            // --- CONSTRUCCIÓN DE ESTRATOS 3D (Subterráneos) ---
                            // Generador de Ruido Geológico para hacer ondas naturales en las capas en lugar de cortes rectos:
                            const getBoundaryNoise = (vertexIdx, boundaryLevel) => {
                                if (boundaryLevel === 0) return 0.0; // El nivel 0 debe ser plano para no perforar el mapa original (Topografía)
                                const v = vertices[vertexIdx];
                                // Normalizamos coordenadas grandes ECEF
                                const x = v.x % 1000.0; 
                                const y = v.y % 1000.0;
                                // Ondas trigonométricas normalizadas a rango [0, 1] para que el ruido SIEMPRE empuje hacia abajo (profundidad),
                                // y NUNCA hacia arriba (valores negativos), porque empujar arriba causaba que crucen/perforen la malla topográfica superficial.
                                const wave1 = (Math.sin(x * 0.05 + y * 0.05) * 0.5 + 0.5) * 5.0; // Ondas largas 
                                const wave2 = (Math.cos(x * 0.1 - y * 0.08) * 0.5 + 0.5) * 2.0;  // Irregularidad
                                const wave3 = (Math.sin(x * 0.2 + boundaryLevel * 2.0) * 0.5 + 0.5) * 1.5; // Desplazamiento por nivel
                                return (wave1 + wave2 + wave3) * (1.0 + boundaryLevel * 0.15); 
                            };

                            const createStratumSlice = (topOffsetBase, botOffsetBase, topBoundaryLvl, botBoundaryLvl, hexColor) => {
                                const Z_EXAG = 15.0; // Exageración vertical para visualización 3D
                                
                                const count = vertices.length;
                                const lPos = new Float64Array(count * 2 * 3);
                                const lSt = new Float32Array(count * 2 * 2); // Textura Fake (ST) requerida por MaterialAppearance
                                
                                const normal = new Cesium.Cartesian3();
                                const pushDownVectorTop = new Cesium.Cartesian3();
                                const pushDownVectorBot = new Cesium.Cartesian3();
                                const newPos = new Cesium.Cartesian3();

                                for (let i = 0; i < count; i++) {
                                    const v = vertices[i];
                                    
                                    // Calculamos el ruido topológico para que esta interfaz empate perfectamente con la siguiente si tienen el mismo Level:
                                    const topNoise = getBoundaryNoise(i, topBoundaryLvl);
                                    const botNoise = getBoundaryNoise(i, botBoundaryLvl);
                                    
                                    const finalTop = (topOffsetBase * Z_EXAG) + topNoise;
                                    const finalBot = (botOffsetBase * Z_EXAG) + botNoise;
                                    
                                    Cesium.Cartesian3.normalize(v, normal);
                                    
                                    // TOP
                                    Cesium.Cartesian3.multiplyByScalar(normal, -finalTop, pushDownVectorTop);
                                    Cesium.Cartesian3.add(v, pushDownVectorTop, newPos);
                                    lPos[i * 3] = newPos.x;
                                    lPos[i * 3 + 1] = newPos.y;
                                    lPos[i * 3 + 2] = newPos.z;
                                    
                                    // Usamos coordenadas espaciales truncadas como mapa UV (ST) para anclar visualmente el Shader
                                    // Usamos escala 0.1 para que el ruido tenga el balance de escala correcto
                                    lSt[i * 2] = (v.x % 1000.0) * 0.1; 
                                    lSt[i * 2 + 1] = (v.y % 1000.0) * 0.1;
                                    
                                    // BOT
                                    Cesium.Cartesian3.multiplyByScalar(normal, -finalBot, pushDownVectorBot);
                                    Cesium.Cartesian3.add(v, pushDownVectorBot, newPos);
                                    lPos[(i + count) * 3] = newPos.x;
                                    lPos[(i + count) * 3 + 1] = newPos.y;
                                    lPos[(i + count) * 3 + 2] = newPos.z;
                                    
                                    lSt[(i + count) * 2] = (v.x % 1000.0) * 0.1; 
                                    lSt[(i + count) * 2 + 1] = (v.y % 1000.0) * 0.1;
                                }

                                const lInd = [];
                                // Ordenar polígonos
                                for (let i = 0; i < indicesTriangulos.length; i += 3) {
                                    lInd.push(indicesTriangulos[i], indicesTriangulos[i + 1], indicesTriangulos[i + 2]);
                                    lInd.push(indicesTriangulos[i] + count, indicesTriangulos[i + 2] + count, indicesTriangulos[i + 1] + count);
                                }

                                // Paredes verticales
                                for (let i = 0; i < indicesBoundary.length; i += 2) {
                                    const ta = indicesBoundary[i];
                                    const tb = indicesBoundary[i + 1];
                                    const ba = ta + count;
                                    const bb = tb + count;
                                    lInd.push(ta, ba, tb);
                                    lInd.push(ba, bb, tb);
                                }

                                let geom = new Cesium.Geometry({
                                    attributes: {
                                        position: new Cesium.GeometryAttribute({
                                            componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                                            componentsPerAttribute: 3,
                                            values: lPos
                                        }),
                                        st: new Cesium.GeometryAttribute({
                                            componentDatatype: Cesium.ComponentDatatype.FLOAT,
                                            componentsPerAttribute: 2,
                                            values: lSt
                                        })
                                    },
                                    indices: new Uint32Array(lInd),
                                    primitiveType: Cesium.PrimitiveType.TRIANGLES,
                                    boundingSphere: Cesium.BoundingSphere.fromPoints(vertices)
                                });
                                
                                try { geom = Cesium.GeometryPipeline.computeNormal(geom); } catch(e){}

                                // SHADER DE RUIDO GLSL (Realismo de Tierra/Arena):
                                const materialGLSL = `
                                    czm_material czm_getMaterial(czm_materialInput materialInput) {
                                        czm_material material = czm_getDefaultMaterial(materialInput);
                                        
                                        // EXTRAEMOS LAS COORDENADAS ST DE LA GEOMETRÍA:
                                        // Como asignamos ST a nivel global en JS, el textura se "ancla" a la roca, parando la ilusión de que "nada" (swimming).
                                        vec2 pos = materialInput.st;
                                        
                                        // Ruido granulado pseudo-aleatorio de textura (Efecto Arena/Porosidad de Roca)
                                        float noiseGrain = fract(sin(dot(pos.xy, vec2(12.9898, 78.233))) * 43758.5453);
                                        
                                        // Ondas sedimentarias súper suaves para insinuar capas de tierra formadas por gravedad
                                        float bandNoise = sin(pos.x * 0.2 + pos.y * 0.15) * 0.5 + 0.5;

                                        vec3 finalColor = u_baseColor.rgb;
                                        
                                        // MODULACIÓN SUTIL MANTENIENDO EL COLOR BASE INTACTO:
                                        // Solución para que la Tierra/Roca no se vea Negra/Gris. Oscurecemos MAX un 15%, 
                                        // así el Afirmado sigue café, Grava clara y Piedra gris sólido.
                                        finalColor = mix(finalColor, finalColor * 0.88, bandNoise * 0.15); // Sedimentos suaves (12% más oscuros)
                                        finalColor = mix(finalColor, finalColor * 0.85, noiseGrain * 0.20); // Porosidades de arena (15% más oscuros)
                                        
                                        material.diffuse = finalColor;
                                        material.alpha = u_baseColor.a;
                                        return material;
                                    }
                                `;

                                const prim = new Cesium.Primitive({
                                    geometryInstances: new Cesium.GeometryInstance({ geometry: geom }),
                                    appearance: new Cesium.MaterialAppearance({
                                        material: new Cesium.Material({
                                            fabric: {
                                                // Al NO definir un 'type', Cesium crea un Custom Material anónimo. 
                                                // Definir type: 'Color' colapsaba porque Cesium no permite reescribir shaders del core.
                                                uniforms: { u_baseColor: Cesium.Color.fromCssColorString(hexColor).withAlpha(1.0) },
                                                source: materialGLSL
                                            }
                                        }),
                                        // 'translucent' en true permite que podamos bajar el alpha dinámicamente si el usuario selecciona otro estrato
                                        flat: false, translucent: true, closed: true,
                                        renderState: { cull: { enabled: false }, depthTest: { enabled: true } }
                                    }),
                                    asynchronous: false
                                });
                                prim.isCustomTopography = true;
                                return prim;
                            };

                            // PROFUNDIDADES EXACTAS + NOISE LEVELS:
                            // Pasamos un límite superior e inferior (topLvl, botLvl) para que las costuras conecten los estratos ondulados mutuamente.
                            // El estrato 1 conecta Lvl 0 (Liso con la superficie) con Lvl 1 (Ondulado inferior).
                            const estrato1 = createStratumSlice(0.01, 0.20, 0, 1, '#A67D5D'); // AFIRMADO 
                            const estrato2 = createStratumSlice(0.20, 1.00, 1, 2, '#b8a99a'); // MATERIA SUELTO GRAVA 
                            const estrato3 = createStratumSlice(1.00, 1.50, 2, 3, '#858585'); // BOLONERIA PIEDRA

                            // Guardamos referencia para ocultarlos en opacidad 100% de suelo
                            estratosRefs.current = [estrato1, estrato2, estrato3];
                            // Iniciamos su visibilidad actual 
                            const initialXray = mapStyleRef.current === 'estratos' && mapOpacity === 0.0 && showEstratosLayer;
                            estrato1.show = initialXray;
                            estrato2.show = initialXray;
                            estrato3.show = initialXray;

                            // Añadir a la escena (de abajo hacia arriba para manejar la física y transparencias)
                            viewer.scene.primitives.add(estrato3);
                            viewer.scene.primitives.add(estrato2);
                            viewer.scene.primitives.add(estrato1);

                            // Malla de superficie
                            viewer.scene.primitives.add(solidPrimitiveHipso);
                            viewer.scene.primitives.add(solidPrimitiveMalla);
                            viewer.scene.primitives.add(wirePrimitiveMalla);
                            viewer.scene.primitives.add(wirePrimitive);

                            console.log("[CESIUM] MALLA RENDERIZADA: Vértices parseados ->", vertices.length, "Caras ->", indicesTriangulos.length / 3);
                        }
                    }).catch(err => console.error("Error cargando malla obj:", err));
                }

                // --- DEFINIR EL "CUBO/CHUNK" GEOGRÁFICO ---
                // Creamos un área de ~3km alrededor del punto para restringir RAM
                const buffer = 0.015; // Aproximadamente 1.5km en cada dirección
                chunkRectangleRef.current = new Cesium.Rectangle(
                    Cesium.Math.toRadians(lon - buffer),
                    Cesium.Math.toRadians(lat - buffer),
                    Cesium.Math.toRadians(lon + buffer),
                    Cesium.Math.toRadians(lat + buffer)
                );

                console.log("[CHUNK] Cubo de carga definido alrededor del modelo.");
                console.log("------------------------------------------");

                // Calcular la elevación real del archivo base para el marcador y el vuelo
                const zMeta = selectedModelo.metadata?.centro_utm?.z || 0;

                // Añadir marcador visual (Pin rojo flotando por encima de la topología importada)
                viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(lon, lat, zMeta > 0 ? zMeta + 30.0 : 0),
                    billboard: {
                        image: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png',
                        width: 48,
                        height: 48,
                        heightReference: zMeta > 0 ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    }
                });

                const safeFlightHeight = zMeta > 0 ? zMeta + 2000 : 2500;

                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(lon, lat, safeFlightHeight),
                    duration: 3,
                    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
                    complete: () => console.log("[3D] Vuelo finalizado.")
                });
            } catch (err) {
                console.error("[3D] Error CRÍTICO en transformación o vuelo:", err);
            }
        }
    }, [selectedModelo]);

    // EFECTO: Cargar sub-progresivas (Sondajes) cuando se selecciona un modelo con tramo_id
    useEffect(() => {
        if (selectedModelo?.tramo_id) {
            fetchSubProgresivas(selectedModelo.tramo_id);
        } else {
            setSubProgresivas([]);
        }
    }, [selectedModelo]);

    const fetchSubProgresivas = async (tramoId) => {
        setIsFetchingBoreholes(true);
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await fetch(`${API_BASE}/api/progresivas/${tramoId}/children/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("[3D] Sub-progresivas (Sondajes) cargadas:", data.length);
                setSubProgresivas(data);
                if (data.length > 0) {
                    renderBoreholes(data);
                }
            }
        } catch (e) {
            console.error("Error cargando sub-progresivas para 3D:", e);
        } finally {
            setIsFetchingBoreholes(false);
        }
    };

    const renderBoreholes = async (boreholes) => {
        if (!viewerRef.current) return;
        const viewer = viewerRef.current;

        // Limpiar boreholes previos
        // Note: We use entities for boreholes because they are easier to handle individually
        if (boreholesEntitiesRef.current) {
            boreholesEntitiesRef.current.forEach(e => viewer.entities.remove(e));
        }
        boreholesEntitiesRef.current = [];

        console.log("[3D] Renderizando sondajes...");

        for (const bh of boreholes) {
            if (!bh.coordenada_este || !bh.coordenada_norte) continue;

            const x = parseFloat(bh.coordenada_este);
            const y = parseFloat(bh.coordenada_norte);
            const projection = x < 400000 ? UTM_19S : UTM_18S;
            const [lon, lat] = proj4(projection, WGS84, [x, y]);

            // Obtener altura del terreno en este punto (RAYO INVERSO / SAMPLE)
            const carto = Cesium.Cartographic.fromDegrees(lon, lat);
            const heightArr = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [carto]);
            const surfaceZ = heightArr[0].height || 0;

            if (bh.estratos_perfil && bh.estratos_perfil.length > 0) {
                bh.estratos_perfil.forEach((estrato, idx) => {
                    const profIni = parseFloat(estrato.profundidad_inicial);
                    const profFin = parseFloat(estrato.profundidad_final);
                    if (isNaN(profIni) || isNaN(profFin)) return;

                    const height = (profFin - profIni) * 15.0; // Exageración Z consistente con las mallas
                    const centerZ = surfaceZ - (profIni * 15.0) - (height / 2.0);

                    const color = estrato.nlp_color_hex ? Cesium.Color.fromCssColorString(estrato.nlp_color_hex) : Cesium.Color.GRAY;

                    const boreholeEntity = viewer.entities.add({
                        name: `Sondaje: ${bh.nombre} - ${estrato.nombre || 'Estrato ' + (idx + 1)}`,
                        position: Cesium.Cartesian3.fromDegrees(lon, lat, centerZ),
                        boreholeData: bh, // Vincular datos originales para el picking
                        description: `
                            <div style="font-family: sans-serif; padding: 10px; color: white;">
                                <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #60a5fa;">${bh.nombre}</h3>
                                <b>Estrato:</b> ${estrato.nombre || 'N/A'}<br/>
                                <b>Prof:</b> ${profIni}m - ${profFin}m<br/>
                                <hr style="border: 0; border-top: 1px solid #334155; margin: 8px 0;"/>
                                <b>Clasif SUCS:</b> ${estrato.nlp_clasificacion_sucs || 'N/A'}<br/>
                                <b>Clasif AASHTO:</b> ${estrato.nlp_clasificacion_aashto || 'N/A'}
                            </div>
                        `,
                        cylinder: {
                            length: height,
                            topRadius: 4.0,
                            bottomRadius: 4.0,
                            material: color.withAlpha(0.9),
                            outline: true,
                            outlineColor: Cesium.Color.BLACK.withAlpha(0.5),
                            heightReference: Cesium.HeightReference.NONE
                        },
                        show: mapStyle === 'estratos' && mapOpacity === 0.0 && showEstratosLayer
                    });

                    boreholesEntitiesRef.current.push(boreholeEntity);
                });

                // Añadir etiqueta en la superficie
                const tagEntity = viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(lon, lat, surfaceZ + 5.0),
                    boreholeData: bh, // También permitir picking desde la etiqueta
                    label: {
                        text: `${bh.nombre}`,
                        font: 'bold 12px monospace',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        heightReference: Cesium.HeightReference.NONE,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000)
                    },
                    show: mapStyle === 'estratos' && mapOpacity === 0.0 && showEstratosLayer
                });
                boreholesEntitiesRef.current.push(tagEntity);
            }
        }
        viewer.scene.requestRender();
    };

    const fetchModelos = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await fetch(`${API_BASE}/api/modelos-3d`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setModelos(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleUploadClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('archivo', file);
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await fetch(`${API_BASE}/api/modelos-3d`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const nuevo = await res.json();
                console.log("[3D] Servidor respondió con el nuevo modelo:", nuevo);
                console.log("[3D] Metadatos del nuevo modelo:", nuevo.metadata);

                // Forzar actualización de la lista primero
                await fetchModelos();

                // Seleccionar automáticamente para disparar el flyTo
                setSelectedModelo(nuevo);

                Swal.fire({
                    title: 'Modelo Importado',
                    text: 'El archivo se ha procesado. La cámara se dirigirá a la ubicación del modelo.',
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false
                });
            } else {
                const err = await res.json();
                Swal.fire('Error', err.error || 'No se pudo subir el modelo', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Fallo la conexión con el servidor', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = null;
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({ title: '¿Borrar?', icon: 'warning', showCancelButton: true });
        if (confirm.isConfirmed) {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await fetch(`${API_BASE}/api/modelos-3d/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchModelos();
        }
    };

    const displayCoords = useMemo(() => {
        if (!selectedModelo?.metadata?.centro_utm) return null;
        let { x, y } = selectedModelo.metadata.centro_utm;
        // Regla: En Perú, el Norte (Y) siempre es el millonario. El Este (X) son 6 cifras.
        // Si vienen al revés, los corregimos solo para el display del panel lateral.
        if (x > y) {
            return { este: y, norte: x, elevacion: selectedModelo.metadata?.centro_utm?.z };
        }
        return { este: x, norte: y, elevacion: selectedModelo.metadata?.centro_utm?.z };
    }, [selectedModelo]);

    const formatBytes = (bytes) => {
        if (!+bytes) return '0 B';
        const k = 1024, i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB'][i]}`;
    };

    const handleToggleGroundMode = () => {
        if (!viewerRef.current) return;

        if (!isGroundMode) {
            setIsChunkLoading(true); // START LOADING

            const viewer = viewerRef.current;
            viewer.scene.globe.maximumScreenSpaceError = 1.2; // Alta calidad para cargar el chunk en full detalle
            viewer.scene.globe.tileCacheSize = 2500; // MEGA caché para mantener TODO el rededor en memoria RAM
            viewer.scene.globe.preloadAncestors = true;
            viewer.scene.globe.preloadSiblings = true;
            viewer.scene.globe.loadingDescendantLimit = 40; // Descargas masivas simultáneas ocultas por el overlay

            if (selectedModelo?.metadata?.centro_utm) {
                let { x, y } = selectedModelo.metadata.centro_utm;
                if (x > y) { const t = x; x = y; y = t; }
                const projection = x < 400000 ? UTM_19S : UTM_18S;
                const [lon, lat] = proj4(projection, WGS84, [x, y]);

                // Asignar altura de aterrizaje segura usando metadata Z si existe,
                // Esto previene en entierro inicial si el terreno es altísimo
                const landingZ = selectedModelo.metadata?.centro_utm?.z ? selectedModelo.metadata.centro_utm.z + 10 : 15.0;

                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(lon, lat, landingZ),
                    orientation: {
                        heading: Cesium.Math.toRadians(0),
                        pitch: Cesium.Math.toRadians(-10.0),
                        roll: 0
                    },
                    duration: 0.5, // Viaje instantáneo por debajo de la pantalla de carga
                    complete: () => {
                        const finalizeLoading = () => {
                            setIsChunkLoading(false);
                            setIsGroundMode(true);
                        };

                        if (!viewer || viewer.isDestroyed()) return finalizeLoading();

                        if (viewer.scene.globe.tilesLoaded) {
                            finalizeLoading();
                        } else {
                            const removeListener = viewer.scene.globe.tileLoadProgressEvent.addEventListener((queuedCount) => {
                                if (queuedCount === 0) {
                                    removeListener();
                                    finalizeLoading();
                                }
                            });

                            // Timeout de 7 segundos: si se pega (ej. red inestable), liberamos la vista igual
                            setTimeout(() => {
                                setIsChunkLoading(prev => {
                                    if (prev) {
                                        removeListener();
                                        setIsGroundMode(true);
                                        return false;
                                    }
                                    return prev;
                                });
                            }, 7000);
                        }
                    }
                });
            } else {
                setIsChunkLoading(false);
                setIsGroundMode(true);
            }
        } else {
            // SALIR DE MODO SUELO: Limpiar variables pesadas
            setIsGroundMode(false);
            const viewer = viewerRef.current;

            Swal.fire({
                title: 'Vista Satelital Restablecida',
                text: 'Has salido del cuarto aislante de 1ra persona. Perspectiva 2D recuperada.',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            viewer.scene.globe.maximumScreenSpaceError = 2.0;
            viewer.scene.globe.tileCacheSize = 100; // Vaciamos RAM
            viewer.scene.globe.preloadAncestors = false;
            viewer.scene.globe.preloadSiblings = false;
            viewer.scene.globe.loadingDescendantLimit = 10;

            if (selectedModelo?.metadata?.centro_utm) {
                let { x, y } = selectedModelo.metadata.centro_utm;
                if (x > y) { const t = x; x = y; y = t; }
                const projection = x < 400000 ? UTM_19S : UTM_18S;
                const [lon, lat] = proj4(projection, WGS84, [x, y]);

                // Recoger la altura actual del caminante para impulsarlo verticalmente, en vez de usar un valor fijo que podría estar subterráneo
                const currentHeight = viewer.camera.positionCartographic?.height || 0;
                const escapeZ = Math.max(currentHeight + 2000, (selectedModelo.metadata?.centro_utm?.z || 0) + 2000);

                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(lon, lat, escapeZ),
                    orientation: {
                        heading: Cesium.Math.toRadians(0),
                        pitch: Cesium.Math.toRadians(-90.0), // Reestablecer cámara mirando al suelo
                        roll: 0
                    },
                    duration: 2
                });
            }
        }
    };

    const handleToggleFullscreen = () => {
        const container = document.getElementById('visor3DContainer');
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error(`Error intentando activar pantalla completa: ${err.message}`);
                setIsFullscreen(true); // Fallback al modo CSS si falla
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Escuchar cambios de pantalla completa nativa para sincronizar el estado
    useEffect(() => {
        const handleFsChange = () => {
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            setIsFullscreen(isFs);

            // Forzar reajuste de Cesium con un pequeño debounce visual
            if (viewerRef.current) {
                const v = viewerRef.current;
                setTimeout(() => {
                    v.resize();
                    v.scene.requestRender();
                }, 150);
            }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const dashboardContent = (
        <div id="visor3DContainer" className={`visor-3d-root flex flex-col border border-slate-700 bg-slate-900 ${isFullscreen ? 'is-fullscreen-native' : 'h-full'}`}>
            <div className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 z-20 shadow-lg">
                <div className="flex items-center gap-2">
                    <i className="fa-brands fa-unity text-white text-lg"></i>
                    <h2 className="text-white text-xs font-bold uppercase tracking-widest italic">Visor Geotécnico 3D</h2>
                </div>
                <div className="flex gap-2">
                    {selectedModelo && (
                        <button
                            onClick={handleToggleGroundMode}
                            disabled={isChunkLoading}
                            className={`text-[10px] px-3 py-1.5 rounded text-white font-bold shadow-md transition-all ${isChunkLoading ? 'bg-amber-600 animate-pulse' : (isGroundMode ? 'bg-emerald-600 ring-2 ring-emerald-400' : 'bg-slate-700 hover:bg-slate-600')} disabled:opacity-50`}
                        >
                            <i className={`fa-solid ${isChunkLoading ? 'fa-spinner fa-spin' : (isGroundMode ? 'fa-person-walking' : 'fa-street-view')} mr-2`}></i>
                            {isChunkLoading ? 'CARGANDO CACHÉ...' : (isGroundMode ? 'CAMINANTE: ON' : 'IR A SUELO')}
                        </button>
                    )}
                    <button onClick={handleToggleFullscreen} className="text-[10px] bg-blue-600 px-3 py-1.5 rounded text-white font-bold hover:bg-blue-500 shadow-md">
                        {isFullscreen ? 'SALIR DE PANTALLA COMPLETA' : 'PANTALLA COMPLETA'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <aside className="w-64 border-r border-slate-800 flex flex-col p-4 bg-slate-900/60 shrink-0">
                    <div onClick={handleUploadClick} className="border-2 border-dashed border-slate-700 p-4 text-center rounded-xl cursor-pointer hover:border-blue-400 bg-slate-800/20 group transition-all">
                        <i className={`fa-solid ${isUploading ? 'fa-spinner fa-spin text-blue-400' : 'fa-upload text-slate-500 group-hover:text-blue-400'} text-xl mb-1`}></i>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{isUploading ? 'Procesando...' : 'Subir LandXML / IFC'}</div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xml,.ifc" />
                    </div>

                    <div className="mt-8 flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
                        <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-800 pb-1 italic">Modelos Activos</h4>
                        {modelos.map(mod => (
                            <div key={mod.id} onClick={() => setSelectedModelo(mod)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedModelo?.id === mod.id ? 'border-blue-500 bg-blue-900/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'}`}>
                                <div className="text-white text-[11px] font-bold truncate mb-1">{mod.nombre_archivo}</div>
                                <div className="flex justify-between text-[8px] text-slate-500 font-mono uppercase">
                                    <span>{mod.tipo}</span>
                                    <span>{formatBytes(mod.tamano_bytes)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 relative bg-black shadow-inner overflow-hidden">
                    <div ref={containerRef} className="w-full h-full" />

                    {/* PANTALLA DE CARGA DE CHUNK */}
                    {isChunkLoading && (
                        <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center transition-all">
                            <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                                <div className="absolute w-full h-full rounded-full border-[3px] border-slate-700"></div>
                                <div className="absolute w-full h-full rounded-full border-[3px] border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                <i className="fa-solid fa-mountain text-3xl text-emerald-400 animate-pulse"></i>
                            </div>
                            <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-xl mb-2 drop-shadow-md">
                                Materializando Chunk
                            </h2>
                            <p className="text-slate-400 text-[11px] font-mono uppercase tracking-widest bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700/50">
                                Almacenando terreno en Caché (0-Lag)...
                            </p>
                        </div>
                    )}

                    <div className="absolute top-4 left-4 z-20">
                        <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[9px] font-mono text-emerald-400 uppercase tracking-tighter shadow-xl">
                            &gt; Visor Engine: Stable_Vanilla_3D_v5
                        </div>
                    </div>

                    {/* Botón para deslizar/colapsar el panel derecho */}
                    <button
                        onClick={() => setIsRightOpen(!isRightOpen)}
                        className={`absolute top-1/2 -translate-y-1/2 right-0 z-30 bg-slate-900/80 border border-slate-700 p-1.5 rounded-l-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-all shadow-2xl ${isRightOpen ? 'mr-0' : 'mr-0'}`}
                        title={isRightOpen ? "Contraer Panel" : "Expandir Panel"}
                    >
                        <i className={`fa-solid ${isRightOpen ? 'fa-angle-right' : 'fa-angle-left'} text-sm`}></i>
                    </button>
                </main>

                <aside className={`border-l border-slate-800 bg-slate-900/60 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl ${isRightOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none border-none'}`}>
                    <div className="w-72 p-6 flex flex-col h-full scroll-hidden overflow-y-auto">
                        <h3 className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <i className="fa-solid fa-layer-group text-slate-200"></i> Herramientas de Capa
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-800/40 rounded border border-slate-800 shadow-inner">
                                <div className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">Estilo Geográfico</div>
                                <button className={`w-full text-left p-2.5 rounded text-[10px] font-bold transition bg-blue-600 text-white shadow-lg mb-2`}>
                                    <i className="fa-solid fa-earth-americas mr-2 text-blue-200"></i> MAPA BASE (ESTÁNDAR)
                                </button>
                                <div className={`flex items-center gap-2 px-1 mb-4 ${isTerrainLoaded ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    <i className={`fa-solid ${isTerrainLoaded ? 'fa-mountain-sun' : 'fa-exclamation-triangle'} text-[10px]`}></i>
                                    <span className="text-[9px] font-extrabold uppercase tracking-tight">
                                        {isTerrainLoaded ? 'Relieve 3D: Activo' : 'Relieve: No disponible'}
                                    </span>
                                </div>

                                {selectedModelo && (
                                    <div className="mt-4 mb-4">
                                        <div className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest italic border-b border-slate-700/50 pb-1">Visualización del Modelo</div>
                                        <div className="flex flex-col gap-2 bg-slate-900/40 rounded-lg p-1.5 border border-slate-800 shadow-inner">
                                            <button 
                                                onClick={() => setMapStyle('hipso')}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded text-[10px] font-bold transition-all border ${mapStyle === 'hipso' ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:bg-slate-800'}`}>
                                                <i className="fa-solid fa-temperature-three-quarters text-[16px] w-5 text-center"></i>
                                                HIPSOMÉTRICO
                                            </button>
                                            <button 
                                                onClick={() => setMapStyle('estratos')}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded text-[10px] font-bold transition-all border ${mapStyle === 'estratos' ? 'bg-[#9B7653] border border-[#D2B48C] text-white shadow-lg' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-[#D2B48C] hover:bg-slate-800'}`}>
                                                <i className="fa-solid fa-layer-group text-[16px] w-5 text-center"></i>
                                                ESTRATIGRÁFICO
                                            </button>
                                            <button 
                                                onClick={() => setMapStyle('malla')}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded text-[10px] font-bold transition-all border ${mapStyle === 'malla' ? 'bg-red-800/80 border-red-500 text-white shadow-lg' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-800'}`}>
                                                <i className="fa-brands fa-unity text-[16px] w-5 text-center"></i>
                                                MALLA (X-RAY)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedModelo && mapStyle === 'estratos' && (
                                    <div className="mt-4 mb-4 animate-fadeIn">
                                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-1 mb-2">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Estratigrafía Identificada</div>
                                            
                                            {/* BOTÓN MASTER PARA REVELAR ESTRATOS (Solo activo en opacidad 0%) */}
                                            <button 
                                                onClick={() => {
                                                    if (mapOpacity === 0) {
                                                        const newVal = !showEstratosLayer;
                                                        setShowEstratosLayer(newVal);
                                                        if (!newVal) setSelectedEstrato(null); // Resetear selección si se apaga
                                                    }
                                                }}
                                                disabled={mapOpacity > 0}
                                                className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider transition-all shadow-md flex items-center gap-1 ${mapOpacity > 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-transparent' : (showEstratosLayer ? 'bg-emerald-600 text-white border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-[#2A3441] text-blue-400 border border-blue-500/50 hover:bg-[#344256]')}`}
                                                title={mapOpacity > 0 ? 'Baja la Opacidad del Suelo al 0% para explorar el subsuelo' : 'Alternar visibilidad del corte estratigráfico'}
                                            >
                                                <i className={`fa-solid ${showEstratosLayer ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                                {showEstratosLayer ? 'MOSTRANDO' : 'OCULTO'}
                                            </button>
                                        </div>

                                        <div className={`flex flex-col gap-2 transition-all ${(!showEstratosLayer || mapOpacity > 0) ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                                            {selectedBorehole ? (
                                                <>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[9px] text-blue-300 font-bold uppercase tracking-widest">{selectedBorehole.nombre}</span>
                                                        <button 
                                                            onClick={() => setSelectedBorehole(null)}
                                                            className="text-[8px] text-slate-500 hover:text-white uppercase font-bold"
                                                        >
                                                            <i className="fa-solid fa-arrow-left mr-1"></i> Volver
                                                        </button>
                                                    </div>
                                                    {selectedBorehole.estratos_perfil?.map((est, idx) => (
                                                        <div 
                                                            key={est.id || idx}
                                                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${selectedEstrato === idx ? 'bg-slate-700/80 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800'}`}
                                                            onClick={() => setSelectedEstrato(selectedEstrato === idx ? null : idx)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-5 h-5 rounded shadow-sm border border-black/30" style={{backgroundColor: est.nlp_color_hex || '#858585'}}></div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[10px] font-bold ${selectedEstrato === idx ? 'text-white' : 'text-slate-300'} truncate w-32`}>{est.nombre || est.nlp_clasificacion_sucs || 'Sin Nombre'}</span>
                                                                    <span className="text-[9px] text-slate-500 font-mono">{est.profundidad_inicial}m - {est.profundidad_final}m</span>
                                                                </div>
                                                            </div>
                                                            {selectedEstrato === idx && <i className="fa-solid fa-eye text-emerald-400 text-xs"></i>}
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <>
                                                    {isFetchingBoreholes ? (
                                                        <div className="py-4 text-center">
                                                            <i className="fa-solid fa-spinner fa-spin text-blue-400 text-lg mb-2"></i>
                                                            <div className="text-[9px] text-slate-500 uppercase font-bold">Consultando DB...</div>
                                                        </div>
                                                    ) : subProgresivas.length > 0 ? (
                                                        <div className="space-y-1 max-h-64 overflow-y-auto custom-scroll pr-1">
                                                            {subProgresivas.map(bh => (
                                                                <div 
                                                                    key={bh.id} 
                                                                    onClick={() => setSelectedBorehole(bh)}
                                                                    className="flex items-center justify-between p-2 rounded bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 cursor-pointer transition-all group"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <i className="fa-solid fa-bore-hole text-slate-500 group-hover:text-blue-400 text-xs"></i>
                                                                        <span className="text-[10px] text-slate-300 font-bold group-hover:text-white">{bh.nombre}</span>
                                                                    </div>
                                                                    <div className="text-[8px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                                                        {bh.estratos_perfil?.length || 0} CAPAS
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-2 text-center text-[9px] text-slate-500 italic uppercase">
                                                            No hay sondajes asociados
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase italic">Opacidad de Suelo</span>
                                        <span className="text-[10px] text-blue-400 font-mono">{(mapOpacity * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={mapOpacity}
                                        onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all shadow-inner"
                                    />
                                    <div className="flex justify-between mt-1 px-1">
                                        <span className="text-[8px] text-slate-600 font-bold">X-RAY</span>
                                        <span className="text-[8px] text-slate-600 font-bold">SÓLIDO</span>
                                    </div>
                                </div>
                            </div>

                            {selectedModelo && (
                                <div className="space-y-4 animate-fadeIn">
                                    {/* Sección de Ubicación Técnica */}
                                    <div className="p-4 bg-slate-800/60 rounded border border-blue-500/30 shadow-lg">
                                        <h4 className="text-[10px] text-blue-400 uppercase font-extrabold tracking-widest mb-4 border-b border-blue-900/50 pb-2 flex items-center gap-2">
                                            <i className="fa-solid fa-location-dot"></i> Datos de Ubicación
                                        </h4>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Nombre del Modelo</div>
                                                <div className="text-[12px] text-white font-bold truncate">{selectedModelo.nombre_archivo}</div>
                                            </div>
                                            |
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="bg-slate-900/50 p-2 rounded">
                                                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 italic">Coordenadas y Altitud (Relieve)</div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] text-slate-400">ESTE (X):</span>
                                                        <span className="text-[12px] text-emerald-400 font-mono font-bold">
                                                            {displayCoords?.este?.toLocaleString('en-US', { minimumFractionDigits: 3 }) || '---'} m
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] text-slate-400">NORTE (Y):</span>
                                                        <span className="text-[12px] text-emerald-400 font-mono font-bold">
                                                            {displayCoords?.norte?.toLocaleString('en-US', { minimumFractionDigits: 3 }) || '---'} m
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-blue-900/10 rounded px-1">
                                                        <span className="text-[10px] text-blue-300">COTA Z:</span>
                                                        <span className="text-[12px] text-white font-mono font-bold">
                                                            {displayCoords?.elevacion?.toFixed(2) || '---'} msnm
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900/50 p-2 rounded">
                                                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 italic">Geográficas (WGS84)</div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] text-slate-400">LAT:</span>
                                                        <span className="text-[11px] text-blue-300 font-mono">
                                                            {selectedModelo.metadata?.centro_utm?.lat?.toFixed(6) || '---'}°
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-slate-400">LON:</span>
                                                        <span className="text-[11px] text-blue-300 font-mono">
                                                            {selectedModelo.metadata?.centro_utm?.lon?.toFixed(6) || '---'}°
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sección de Propiedades del Modelo */}
                                    <div className="p-4 bg-slate-800/40 rounded border border-slate-700">
                                        <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3 border-b border-slate-800 pb-1 italic">Ficha Técnica</h4>
                                        <div className="space-y-2 text-[11px]">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 uppercase">Superficies TIN:</span>
                                                <span className="text-white font-mono">{selectedModelo.metadata?.cantidad_superficies || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 uppercase">Puntos Control:</span>
                                                <span className="text-white font-mono text-blue-400">{selectedModelo.metadata?.cantidad_puntos_control || 0}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-800 mt-2">
                                                <span className="text-slate-500 uppercase">Tipo:</span>
                                                <span className="text-blue-400 font-bold">{selectedModelo.tipo}</span>
                                            </div>
                                        </div>

                                        <button onClick={() => handleDelete(selectedModelo.id)} className="w-full bg-red-900/10 border border-red-900/30 text-red-500 text-[10px] font-bold py-2 rounded hover:bg-red-600 hover:text-white transition-all uppercase mt-6 tracking-widest shadow-md">
                                            <i className="fa-solid fa-trash-can mr-2"></i> ELIMINAR MODELO
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );

    return dashboardContent;
}
