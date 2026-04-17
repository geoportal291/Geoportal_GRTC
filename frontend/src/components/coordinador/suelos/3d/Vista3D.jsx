import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { utmToWgs84, processCoordinates, getUtmZoneFromLon, chunkedSampleTerrain } from '../../../../utils/geoUtils';
import { FullTramoEngine } from './FullTramoEngine';
import { useAuth } from '../../../../data/contexts/AuthContext';
import useProgresivasData from '../../../../hooks/useProgresivasData';
import './Vista3D.css';

const Cesium = window.Cesium;
const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'https://backendgeoportal.fly.dev';
const ION_TOKEN = process.env.REACT_APP_CESIUM_TOKEN;

export default function Vista3D() {
    const { selectedProjectId, user } = useAuth();

    // DEPURACIÓN TEMPORAL: Queremos ver qué hay dentro de Cesium
    console.log("[Vista3D] Contenido del objeto Cesium:", Cesium);

    // DESESTRUCTURACIÓN SEGURA
    const {
        Viewer, Ion, Terrain, Cartesian3, Cartographic, Geometry, GeometryAttribute,
        ComponentDatatype, PrimitiveType, BoundingSphere, GeometryPipeline, Primitive,
        PerInstanceColorAppearance, ColorGeometryInstanceAttribute, Color,
        MaterialAppearance, Material, GeometryInstance, IonImageryProvider,
        ArcGisMapServerImageryProvider, UrlTemplateImageryProvider,
        sampleTerrainMostDetailed, EllipsoidTerrainProvider,
        KmlDataSource, LabelStyle, VerticalOrigin, Cartesian2
    } = Cesium;

    const [soilData, setSoilData] = useState(null); // NUEVO: Mover aquí para evitar TDZ

    useEffect(() => {
        if (soilData) {
            console.log("[Vista3D] Datos de suelo cargados:", {
                trazados: soilData.tracks?.length,
                progresivas: soilData.progresivas?.length
            });
        }
    }, [soilData]);

    // --- ESTADOS Y REFERENCIAS (Definidos al inicio para evitar TDZ) ---
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [modelos, setModelos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [selectedModelo, setSelectedModelo] = useState(null);
    const [mapOpacity, setMapOpacity] = useState(1.0);
    const [zExag, setZExag] = useState(15.0);
    const [isViewerReady, setIsViewerReady] = useState(false); // NUEVO: Control de ciclo de vida del visor
    const [isRightOpen, setIsRightOpen] = useState(false);
    const [isLeftOpen, setIsLeftOpen] = useState(false);
    const [isGroundMode, setIsGroundMode] = useState(false);
    const [subProgresivas, setSubProgresivas] = useState([]);
    const [isFetchingBoreholes, setIsFetchingBoreholes] = useState(false);
    const [mapStyle, setMapStyle] = useState('hipso');
    const [showEstratosLayer, setShowEstratosLayer] = useState(false);
    const [projectZone, setProjectZone] = useState('18S'); // NUEVO: Zona detectada automáticamente

    // --- DERIVADOS Y HELPERS PARA UI ---
    const statusMessage = isUploading 
        ? `Subiendo: ${uploadProgress}%` 
        : isGlobalLoading 
        ? "Cargando datos..." 
        : "";

    const toggleFullScreen = () => setIsFullscreen(prev => !prev);

    const mapStyleRef = useRef('hipso');
    const currentModelDataRef = useRef(null);
    const hipsoPrimitiveRef = useRef(null);
    const mallaSolidRef = useRef(null);
    const mallaWireRef = useRef(null);
    const boundaryWireRef = useRef(null);
    const estratosRefs = useRef([]);
    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const isMounted = useRef(false);
    const fileInputRef = useRef(null);
    const focusImageryLayerRef = useRef(null);
    const chunkRectangleRef = useRef(null);
    const boreholesEntitiesRef = useRef([]);
    const soilEntitiesRef = useRef([]); // Referencia para cilindros de estratos
    const kmlDataSourcesRef = useRef([]); // Referencia para líneas de trazado KML
    const fullTramoWallEntitiesRef = useRef([]);
    const abortControllersRef = useRef(new Map());

    // --- MOTOR DE PROGRESIVAS ---
    useProgresivasData();

    // --- FUNCIONES CORE (Definidas antes que los efectos para evitar ReferenceError) ---

    /**
     * Renderiza la malla LandXML final combinando capas visuales y estratos.
     */
    const renderFinalMesh = useCallback((verticesInfo, elevationData, minZ, maxZ, indicesTriangulos, indicesBoundary, indicesBordesFull) => {
        const viewer = viewerRef.current;
        console.log("[Vista3D] renderFinalMesh invocado. Vértices:", verticesInfo?.length);
        if (!viewer || viewer.isDestroyed() || !verticesInfo || verticesInfo.length === 0) {
            console.warn("[Vista3D] renderFinalMesh abortado: viewer inválido o sin vértices.");
            return;
        }

        const midZ = minZ + (maxZ - minZ) / 2.0;

        const vertices = verticesInfo.map(vi => {
            const exaggeratedZ = (vi.z - midZ) * (zExag / 15.0) + midZ;
            return Cartesian3.fromDegrees(vi.lon, vi.lat, exaggeratedZ + 2.5);
        });

        // Limpieza de previos
        const primitivesToRemove = [];
        for (let i = 0; i < viewer.scene.primitives.length; i++) {
            const prim = viewer.scene.primitives.get(i);
            if (prim.isCustomTopography) primitivesToRemove.push(prim);
        }
        primitivesToRemove.forEach(p => viewer.scene.primitives.remove(p));

        const positions64 = new Float64Array(vertices.length * 3);
        const colors8 = new Uint8Array(vertices.length * 4);
        const zRange = maxZ - minZ || 1.0;

        for (let i = 0; i < vertices.length; i++) {
            positions64[i * 3] = vertices[i].x;
            positions64[i * 3 + 1] = vertices[i].y;
            positions64[i * 3 + 2] = vertices[i].z;
            const normalizedZ = (elevationData[i] - minZ) / zRange;
            const hue = (1.0 - normalizedZ) * (1.0 / 3.0);
            const vColor = Color.fromHsl(hue, 1.0, 0.45, 1.0);
            colors8[i * 4] = vColor.red * 255;
            colors8[i * 4 + 1] = vColor.green * 255;
            colors8[i * 4 + 2] = vColor.blue * 255;
            colors8[i * 4 + 3] = 255;
        }

        // --- GEOMETRÍA SÓLIDA ---
        let solidGeometryHipso = new Geometry({
            attributes: {
                position: new GeometryAttribute({ componentDatatype: ComponentDatatype.DOUBLE, componentsPerAttribute: 3, values: positions64 }),
                color: new GeometryAttribute({ componentDatatype: ComponentDatatype.UNSIGNED_BYTE, componentsPerAttribute: 4, values: colors8, normalize: true })
            },
            indices: new Uint32Array(indicesTriangulos),
            primitiveType: PrimitiveType.TRIANGLES,
            boundingSphere: BoundingSphere.fromPoints(vertices)
        });

        let solidGeometryTopo = new Geometry({
            attributes: { position: new GeometryAttribute({ componentDatatype: ComponentDatatype.DOUBLE, componentsPerAttribute: 3, values: positions64 }) },
            indices: new Uint32Array(indicesTriangulos),
            primitiveType: PrimitiveType.TRIANGLES,
            boundingSphere: BoundingSphere.fromPoints(vertices)
        });

        try {
            solidGeometryHipso = GeometryPipeline.computeNormal(solidGeometryHipso);
            solidGeometryTopo = GeometryPipeline.computeNormal(solidGeometryTopo);
        } catch (e) { }

        // --- PRIMITIVOS ---
        const solidPrimitiveHipso = new Primitive({
            geometryInstances: new GeometryInstance({ geometry: solidGeometryHipso }),
            appearance: new PerInstanceColorAppearance({ flat: false, translucent: false, closed: false }),
            asynchronous: false,
            show: mapStyle === 'hipso'
        });
        solidPrimitiveHipso.isCustomTopography = true;

        const solidPrimitiveMalla = new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: solidGeometryTopo,
                attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.RED.withAlpha(0.25)) }
            }),
            appearance: new PerInstanceColorAppearance({ flat: true, translucent: true, closed: false }),
            asynchronous: false,
            show: mapStyle === 'malla'
        });
        solidPrimitiveMalla.isCustomTopography = true;

        const wirePrimitiveMalla = new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: new Geometry({
                    attributes: { position: new GeometryAttribute({ componentDatatype: ComponentDatatype.DOUBLE, componentsPerAttribute: 3, values: positions64 }) },
                    indices: new Uint32Array(indicesBordesFull),
                    primitiveType: PrimitiveType.LINES,
                    boundingSphere: BoundingSphere.fromPoints(vertices)
                }),
                attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.RED.withAlpha(1.0)) }
            }),
            appearance: new PerInstanceColorAppearance({ flat: true, translucent: false }),
            asynchronous: false,
            show: mapStyle === 'malla'
        });
        wirePrimitiveMalla.isCustomTopography = true;

        const wirePrimitiveBoundary = new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: new Geometry({
                    attributes: { position: new GeometryAttribute({ componentDatatype: ComponentDatatype.DOUBLE, componentsPerAttribute: 3, values: positions64 }) },
                    indices: new Uint32Array(indicesBoundary),
                    primitiveType: PrimitiveType.LINES,
                    boundingSphere: BoundingSphere.fromPoints(vertices)
                }),
                attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.RED.withAlpha(1.0)) }
            }),
            appearance: new PerInstanceColorAppearance({ flat: true, translucent: false }),
            asynchronous: false,
            show: mapStyle !== 'malla'
        });
        wirePrimitiveBoundary.isCustomTopography = true;

        hipsoPrimitiveRef.current = solidPrimitiveHipso;
        mallaSolidRef.current = solidPrimitiveMalla;
        mallaWireRef.current = wirePrimitiveMalla;
        boundaryWireRef.current = wirePrimitiveBoundary;

        // --- ESTRATOS 3D ---
        const getBoundaryNoise = (vertexIdx, boundaryLevel) => {
            if (boundaryLevel === 0) return 0.0;
            const v = vertices[vertexIdx];
            const x = v.x % 1000.0, y = v.y % 1000.0;
            return (Math.sin(x * 0.05 + y * 0.05) * 2.5 + Math.cos(x * 0.1 - y * 0.08) * 1.5) * (1.0 + boundaryLevel * 0.1);
        };

        const createStratumSlice = (topBias, botBias, topLvl, botLvl, hex) => {
            const count = vertices.length;
            const lPos = new Float64Array(count * 2 * 3);
            const lSt = new Float32Array(count * 2 * 2);
            const normal = new Cartesian3();

            for (let i = 0; i < count; i++) {
                const v = vertices[i];
                const finalTop = (topBias * zExag) + getBoundaryNoise(i, topLvl);
                const finalBot = (botBias * zExag) + getBoundaryNoise(i, botLvl);
                Cartesian3.normalize(v, normal);
                const pTop = Cartesian3.add(v, Cartesian3.multiplyByScalar(normal, -finalTop, new Cartesian3()), new Cartesian3());
                lPos[i * 3] = pTop.x; lPos[i * 3 + 1] = pTop.y; lPos[i * 3 + 2] = pTop.z;
                lSt[i * 2] = (v.x % 1000) * 0.1; lSt[i * 2 + 1] = (v.y % 1000) * 0.1;
                const pBot = Cartesian3.add(v, Cartesian3.multiplyByScalar(normal, -finalBot, new Cartesian3()), new Cartesian3());
                lPos[(i + count) * 3] = pBot.x; lPos[(i + count) * 3 + 1] = pBot.y; lPos[(i + count) * 3 + 2] = pBot.z;
                lSt[(i + count) * 2] = (v.x % 1000) * 0.1; lSt[(i + count) * 2 + 1] = (v.y % 1000) * 0.1;
            }

            const lInd = [];
            for (let i = 0; i < indicesTriangulos.length; i += 3) {
                lInd.push(indicesTriangulos[i], indicesTriangulos[i + 1], indicesTriangulos[i + 2]);
                lInd.push(indicesTriangulos[i] + count, indicesTriangulos[i + 2] + count, indicesTriangulos[i + 1] + count);
            }
            for (let i = 0; i < indicesBoundary.length; i += 2) {
                const ta = indicesBoundary[i], tb = indicesBoundary[i + 1], ba = ta + count, bb = tb + count;
                lInd.push(ta, ba, tb); lInd.push(ba, bb, tb);
            }

            const prim = new Primitive({
                geometryInstances: new GeometryInstance({
                    geometry: new Geometry({
                        attributes: {
                            position: new GeometryAttribute({ componentDatatype: ComponentDatatype.DOUBLE, componentsPerAttribute: 3, values: lPos }),
                            st: new GeometryAttribute({ componentDatatype: ComponentDatatype.FLOAT, componentsPerAttribute: 2, values: lSt })
                        },
                        indices: new Uint32Array(lInd),
                        primitiveType: PrimitiveType.TRIANGLES,
                        boundingSphere: BoundingSphere.fromPoints(vertices)
                    })
                }),
                appearance: new MaterialAppearance({
                    material: new Material({
                        fabric: {
                            uniforms: { u_baseColor: Color.fromCssColorString(hex).withAlpha(1.0) },
                            source: `czm_material czm_getMaterial(czm_materialInput materialInput){ czm_material m = czm_getDefaultMaterial(materialInput); m.diffuse = u_baseColor.rgb; m.alpha = u_baseColor.a; return m; }`
                        }
                    }),
                    flat: false, translucent: true, closed: true
                }),
                asynchronous: false
            });
            prim.isCustomTopography = true;
            return prim;
        };

        const estrato1 = createStratumSlice(0.01, 0.20, 0, 1, '#A67D5D');
        const estrato2 = createStratumSlice(0.20, 1.00, 1, 2, '#b8a99a');
        const estrato3 = createStratumSlice(1.00, 1.50, 2, 3, '#858585');

        estratosRefs.current = [estrato1, estrato2, estrato3];
        const reveal = (mapStyle === 'estratos' || (mapOpacity === 0 && showEstratosLayer));
        estratosRefs.current.forEach(e => e.show = reveal);

        [estrato3, estrato2, estrato1, solidPrimitiveHipso, solidPrimitiveMalla, wirePrimitiveMalla, wirePrimitiveBoundary].forEach(p => viewer.scene.primitives.add(p));
        viewer.scene.requestRender();
    }, [zExag, mapStyle, mapOpacity, showEstratosLayer]);

    /**
     * Renderiza cilindros 3D para sondajes.
     */
    const renderBoreholes = useCallback(async (boreholes) => {
        if (!viewerRef.current || !boreholes) return;
        const viewer = viewerRef.current;
        boreholesEntitiesRef.current.forEach(ent => viewer.entities.remove(ent));
        boreholesEntitiesRef.current = [];

        const cartographics = boreholes.map(bh => {
            const { lon, lat } = utmToWgs84(bh.coordenada_este, bh.coordenada_norte);
            return Cartographic.fromDegrees(lon, lat);
        });

        try {
            const tProvider = viewer.scene.terrainProvider || viewer.terrainProvider;
            const sampled = await chunkedSampleTerrain(Cesium, tProvider, cartographics);
            boreholes.forEach((bh, i) => {
                const surfaceZ = (sampled[i]?.height || 0);
                const { lon, lat } = utmToWgs84(bh.coordenada_este, bh.coordenada_norte);
                const ent = viewer.entities.add({
                    position: Cartesian3.fromDegrees(lon, lat, surfaceZ - 22.5),
                    cylinder: { length: 45.0, topRadius: 1.0, bottomRadius: 1.0, material: Color.fromCssColorString('#10B981').withAlpha(0.8) }
                });
                boreholesEntitiesRef.current.push(ent);
            });
            viewer.scene.requestRender();
        } catch (e) { }
    }, []);

    const fetchModelos = useCallback(async () => {
        if (!selectedProjectId) return;
        try {
            const res = await fetch(`${API_BASE}/api/modelos-3d?proyecto_id=${selectedProjectId}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok && isMounted.current) {
                const data = await res.json();
                setModelos(data);
                if (data.length > 0) {
                    setSelectedModelo(prev => prev || data[0]);
                }
            }
        } catch (e) {
            console.error("[Vista3D] Error fetching modelos:", e);
        }
    }, [selectedProjectId, user?.token]);

    const fetchSoilData = useCallback(async () => {
        if (!selectedProjectId) return;
        try {
            const res = await fetch(`${API_BASE}/api/3d/datos-suelos/${selectedProjectId}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok && isMounted.current) {
                const data = await res.json();
                console.log("[Vista3D] --- INSPECCIÓN DE DATOS DE SUELO ---");
                console.log("[Vista3D] Trazados recibidos:", data.tracks);
                console.log("[Vista3D] Progresivas recibidas (ejemplo 1era):", data.progresivas?.[0]);
                setSoilData(data);
            } else {
                console.error("[Vista3D] Error en respuesta de API Suelos:", res.status);
            }
        } catch (e) {
            console.error("[Vista3D] Error fetching soil data:", e);
        }
    }, [selectedProjectId, user?.token]);

    const flyToProgressive = useCallback((p) => {
        if (!viewerRef.current) return;
        const { lon, lat } = utmToWgs84(p.coordenada_este, p.coordenada_norte, projectZone);
        // Aumentamos el offset Z a 1200m para una vista panorámica más cómoda
        const z = (p.elevacion ? parseFloat(p.elevacion) : 500) + 1200;
        viewerRef.current.camera.flyTo({
            destination: Cartesian3.fromDegrees(lon, lat, z),
            duration: 1.5,
            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-90), // Vista cenital
                roll: 0
            }
        });
    }, [utmToWgs84, projectZone]);

    // --- EFECTO: RENDERIZADO DE SUELOS Y TRAZADOS (INTELIGENTE: Auto-Zona y Elevación Real) ---
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed() || !soilData || !isViewerReady) {
            console.warn("[Vista3D] Renderizado de suelos en espera: Visor no listo, destruido o sin datos.");
            return;
        }

        console.log("[Vista3D] --- INICIANDO RENDERIZADO 3D (AUTO) ---");

        // 1. Limpiar previos
        kmlDataSourcesRef.current.forEach(ds => viewer.dataSources.remove(ds));
        kmlDataSourcesRef.current = [];
        soilEntitiesRef.current.forEach(ent => viewer.entities.remove(ent));
        soilEntitiesRef.current = [];

        // 2. Renderizar Tracks y Detectar Zona
        const loadTracks = async () => {
            console.log("%c[Vista3D] 🚀 INICIANDO CARGA DE TRACKS KML...", "color: #3498db; font-weight: bold; font-size: 14px;");

            if (!soilData.tracks || soilData.tracks.length === 0) {
                console.warn("[Vista3D] ⚠️ No hay tracks en soilData.tracks");
                return;
            }

            let zoneDetected = false;
            for (const track of (soilData.tracks || [])) {
                try {
                    console.log(`[Vista3D] 🛰️ Procesando track: ${track.nombre || 'Sin nombre'} (ID Tramo: ${track.tramo_id})`);

                    if (!track.kml_content) {
                        console.error(`[Vista3D] ❌ El track ${track.nombre} no tiene contenido KML.`);
                        continue;
                    }

                    console.log(`[Vista3D] ℹ️ Longitud KML: ${track.kml_content.length} caracteres. Empieza con: ${track.kml_content.substring(0, 50)}...`);

                    // --- HACK: INYECTAR TESSELLATE ---
                    // Si el KML no tiene tessellate, Cesium ignora el clampToGround o crashea.
                    // Lo inyectamos por fuerza bruta en el string XML.
                    let kmlPrepared = track.kml_content;
                    if (!kmlPrepared.includes("<tessellate>1</tessellate>")) {
                        kmlPrepared = kmlPrepared.replace(/<LineString>/g, "<LineString><tessellate>1</tessellate>");
                    }

                    // CORRECCIÓN CRÍTICA: Cesium.KmlDataSource.load trata strings como URLs.
                    // Para cargar XML puro, debemos encapsularlo en un Blob.
                    const kmlBlob = new Blob([kmlPrepared], { type: 'application/vnd.google-earth.kml+xml' });

                    const ds = await Cesium.KmlDataSource.load(kmlBlob, {
                        camera: viewer.camera,
                        canvas: viewer.canvas,
                        clampToGround: true
                    });

                    const entities = ds.entities.values;
                    console.log(`%c[Vista3D] ✅ Trazado '${track.nombre}' cargado con ${entities.length} entidades.`, "color: #2ecc71; font-weight: bold;");

                    if (entities.length === 0) {
                        console.warn(`[Vista3D] ⚠️ El KML '${track.nombre}' no tiene entidades válidas (Puntos/Líneas).`);
                    }

                    // DETECCIÓN AUTOMÁTICA DE ZONA UTM DESDE EL KML
                    if (!zoneDetected && entities.length > 0) {
                        const firstEnt = entities.find(e => e.position);
                        if (firstEnt) {
                            const pos = firstEnt.position.getValue(Cesium.JulianDate.now());
                            if (pos) {
                                const carto = Cartographic.fromCartesian(pos);
                                const lonDeg = Cesium.Math.toDegrees(carto.longitude);
                                const zone = getUtmZoneFromLon(lonDeg);
                                console.log(`[Vista3D] 📍 Zona UTM detectada automáticamente: ${zone}`);
                                setProjectZone(zone);
                                zoneDetected = true;
                            }
                        }
                    }

                    entities.forEach(entity => {
                        if (entity.polyline) {
                            // Cambiamos el color a Azul (DodgerBlue) para coincidir con la estética de la página
                            entity.polyline.material = Color.DODGERBLUE.withAlpha(0.9);
                            entity.polyline.width = 8.0;
                            entity.polyline.clampToGround = true;
                            entity.polyline.arcType = Cesium.ArcType.GEODESIC;
                            entity.polyline.show = true;
                        }
                    });

                    viewer.dataSources.add(ds);
                    kmlDataSourcesRef.current.push(ds);

                    // AUTO-ENFOQUE: Volar al primer trazado cargado para validación visual
                    if (!zoneDetected) {
                        console.log("[Vista3D] ✈️ Volando al trazado...");
                        viewer.flyTo(ds, {
                            duration: 2,
                            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 0)
                        });
                    }

                } catch (e) {
                    console.error(`[Vista3D] ❌ Error crítico cargando track ${track.nombre}:`, e);
                }
            }
        };

        // 3. RENDERIZADO DE ESTRATOS (Cilindros)
        const renderHoles = async () => {
            const calicatasConCoords = (soilData.progresivas || []).filter(p => p.coordenada_este && p.coordenada_norte && p.estratos && p.estratos.length > 0);
            if (calicatasConCoords.length === 0) return;

            // Muestreamos terreno solo para las que NO tienen elevación en DB
            const cartographicsToSample = calicatasConCoords
                .filter(p => !p.elevacion)
                .map(p => {
                    const { lon, lat } = utmToWgs84(p.coordenada_este, p.coordenada_norte, projectZone);
                    return Cartographic.fromDegrees(lon, lat);
                });

            let sampledMap = {};
            if (cartographicsToSample.length > 0) {
                // Cesium 1.104+ usa scene.terrainProvider. El getter viewer.terrainProvider puede ser undefined.
                const tProvider = viewer.scene.terrainProvider || viewer.terrainProvider;

                console.log("[Vista3D] Muestreando terreno para calicatas. Provider detected:", tProvider?.constructor?.name || "None");

                try {
                    const sampled = await chunkedSampleTerrain(Cesium, tProvider, cartographicsToSample);
                    cartographicsToSample.forEach((c, idx) => {
                        sampledMap[`${c.longitude}_${c.latitude}`] = sampled[idx]?.height || 0;
                    });
                } catch (sampleErr) {
                    console.error("[Vista3D] Error crítico en muestreo de terreno:", sampleErr);
                }
            }

            try {
                calicatasConCoords.forEach((p) => {
                    const { lon, lat } = utmToWgs84(p.coordenada_este, p.coordenada_norte, projectZone);

                    // PRIORIDAD DE ELEVACIÓN: 1. DB (Topografía Real) | 2. Terreno Cesium
                    let surfaceZ = 0;
                    if (p.elevacion && parseFloat(p.elevacion) !== 0) {
                        surfaceZ = parseFloat(p.elevacion);
                    } else {
                        const key = `${Cesium.Math.toRadians(lon)}_${Cesium.Math.toRadians(lat)}`;
                        surfaceZ = sampledMap[key] || 0;
                    }

                    // --- NUEVO: MARCADOR Y ETIQUETA PREMIUM (Estilo Maqueta) ---
                    const markerId = `prog-marker-${p.id}`;
                    if (!viewer.entities.getById(markerId)) {
                        const markerEntity = viewer.entities.add({
                            id: markerId,
                            name: `Progresiva: ${p.nombre}`,
                            position: Cartesian3.fromDegrees(lon, lat, surfaceZ + 1.0), // 1 metro sobre el relieve
                            point: {
                                pixelSize: 10,
                                color: Color.CYAN,
                                outlineColor: Color.BLACK,
                                outlineWidth: 2
                            },
                            label: {
                                text: p.nombre,
                                font: '14pt Outfit, sans-serif',
                                fillColor: Color.WHITE,
                                outlineColor: Color.BLACK,
                                outlineWidth: 3,
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                pixelOffset: new Cesium.Cartesian2(0, -20),
                                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000)
                            }
                        });
                        soilEntitiesRef.current.push(markerEntity);
                    }

                    let cumulativeDepth = 0;
                    if (!p.estratos || p.estratos.length === 0) {
                        const noEstratoId = `calicata-empty-${p.id}`;
                        if (!viewer.entities.getById(noEstratoId)) {
                            const entity = viewer.entities.add({
                                id: noEstratoId,
                                name: `Calicata: ${p.nombre} (Sin estratos)`,
                                position: Cartesian3.fromDegrees(lon, lat, surfaceZ - 7.0), // Centro del cilindro a -7m
                                cylinder: {
                                    length: 14.0, topRadius: 1.2, bottomRadius: 1.2,
                                    material: Color.GRAY.withAlpha(0.6), 
                                    outline: true
                                }
                            });
                            soilEntitiesRef.current.push(entity);
                        }
                    } else {
                        p.estratos.forEach((estrato, eIdx) => {
                            const thickness = Math.abs(estrato.cota_final - estrato.cota_inicial) || 0.5;
                            const centerDepth = cumulativeDepth + (thickness / 2);
                            const color = estrato.nlp_color_hex || '#858585';
                            const estratoId = `estrato-${p.id}-${eIdx}`;

                            if (!viewer.entities.getById(estratoId)) {
                                const entity = viewer.entities.add({
                                    id: estratoId,
                                    name: `P: ${p.nombre} | ${estrato.nombre || 'Estrato'}`,
                                    description: `Profundidad: ${estrato.cota_inicial}m - ${estrato.cota_final}m<br/>${estrato.descripcion || ''}`,
                                    position: Cartesian3.fromDegrees(lon, lat, surfaceZ - centerDepth), // Offset negativo desde el suelo
                                    cylinder: {
                                        length: thickness, topRadius: 1.5, bottomRadius: 1.5,
                                        material: Color.fromCssColorString(color).withAlpha(0.95),
                                        outline: true, outlineColor: Color.BLACK.withAlpha(0.6), outlineWidth: 1
                                    }
                                });
                                soilEntitiesRef.current.push(entity);
                            }
                            cumulativeDepth += thickness;
                        });
                    }
                });
                viewer.scene.requestRender();
            } catch (e) {
                console.error("[Vista3D] Error en renderizado 3D de calicatas:", e);
            }
        };

        const initialize3D = async () => {
            await loadTracks();
            await renderHoles();
        };

        initialize3D();
    }, [soilData, isViewerReady, projectZone]);

    const fetchAllData = useCallback(async () => {
        setIsGlobalLoading(true);
        await Promise.all([fetchModelos(), fetchSoilData()]);
        setIsGlobalLoading(false);
    }, [fetchModelos, fetchSoilData]);

    // --- EFECTO DE CARGA INICIAL ---
    useEffect(() => {
        if (selectedProjectId) {
            fetchAllData();
        }
    }, [selectedProjectId, fetchAllData]);

    // --- EFECTO PANTALLA COMPLETA ---
    useEffect(() => {
        const container = document.getElementById('visor3DContainer');
        if (!container) return;

        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isNowFullscreen);

            // Forzar redimensionamiento de Cesium después de que el DOM se asiente
            setTimeout(() => {
                if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                    viewerRef.current.resize();
                    viewerRef.current.scene.requestRender();
                }
            }, 100);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Sincronizar estado con API del navegador
        if (isFullscreen && !document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error(`[Vista3D] Error Fullscreen: ${err.message}`);
                setIsFullscreen(false);
            });
        } else if (!isFullscreen && document.fullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            }
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isFullscreen]);

    useEffect(() => {
        isMounted.current = true;
        console.log("[Vista3D] Montando el visor ..");

        let viewer;

        const initializeViewer = async () => {
            try {
                if (!containerRef.current || !isMounted.current) return;

                if (Ion) { Ion.defaultAccessToken = ION_TOKEN || ''; }

                // Inicialización de Terreno con Fallback robusto
                let terrainProviderOption = {};
                try {
                    if (Terrain && typeof Terrain.fromWorldTerrain === 'function') {
                        // API Moderna (Cesium 1.104+)
                        terrainProviderOption = { terrain: Terrain.fromWorldTerrain({ requestVertexNormals: true }) };
                    } else if (typeof Cesium.createWorldTerrainAsync === 'function') {
                        // API Async (Cesium 1.100 - 1.103)
                        terrainProviderOption = { terrainProvider: await Cesium.createWorldTerrainAsync({ requestVertexNormals: true }) };
                    } else if (typeof Cesium.createWorldTerrain === 'function') {
                        // API Antigua
                        terrainProviderOption = { terrainProvider: Cesium.createWorldTerrain({ requestVertexNormals: true }) };
                    }
                } catch (terrainErr) {
                    console.warn("[Vista3D] No se pudo cargar terreno global, usando elipsoide por defecto.", terrainErr);
                }

                viewer = new Viewer(containerRef.current, {
                    ...terrainProviderOption,
                    animation: false,
                    baseLayerPicker: false,
                    homeButton: false,
                    geocoder: false,
                    timeline: false,
                    navigationHelpButton: false,
                    sceneModePicker: false,
                    selectionIndicator: false,
                    infoBox: false
                });

                if (!isMounted.current || viewer.isDestroyed()) {
                    viewer.destroy();
                    return;
                }

                // Optimizaciones de Escena
                viewer.scene.globe.enableLighting = true;
                viewer.scene.globe.depthTestAgainstTerrain = true;
                viewer.scene.highDynamicRange = true;
                viewer.scene.postProcessStages.fxaa.enabled = true;

                // Limpieza de capas por defecto para control total
                const imageryLayers = viewer.imageryLayers;
                if (imageryLayers) {
                    imageryLayers.removeAll();
                }

                // Capa Base Global (Sentinel-2 vía Ion con Fallback a ESRI)
                try {
                    const ionLayer = await IonImageryProvider.fromAssetId(2);
                    if (isMounted.current && !viewer.isDestroyed()) {
                        imageryLayers.addImageryProvider(ionLayer);
                    }
                } catch (e) {
                    console.warn("[Vista3D] Falló Sentinel-2 Ion, usando ESRI como fallback.");
                    if (isMounted.current && !viewer.isDestroyed()) {
                        imageryLayers.addImageryProvider(new ArcGisMapServerImageryProvider({
                            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                            enablePickFeatures: false
                        }));
                    }
                }

                // Verificación de seguridad tras await
                if (!isMounted.current || viewer.isDestroyed()) {
                    if (!viewer.isDestroyed()) viewer.destroy();
                    return;
                }

                // Capa Focal (Para el área del modelo LandXML)
                const focusLayer = imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    maximumLevel: 19
                }));
                focusLayer.alpha = 0.0;
                focusImageryLayerRef.current = focusLayer;

                const controller = viewer.scene.screenSpaceCameraController;
                if (controller) {
                    controller.inertiaSpin = 0.7;
                    controller.inertiaTranslate = 0.7;
                    controller.inertiaZoom = 0.7;
                }

                if (isMounted.current) {
                    console.log("[Vista3D] ✅ Visor Cesium inicializado con éxito.");
                    viewerRef.current = viewer;
                    setIsViewerReady(true); // DIPARAR RENDERIZADO DE DATOS
                } else {
                    viewer.destroy();
                }

            } catch (e) {
                console.error("Error crítico inicializando el motor Cesium:", e);
                if (viewer && !viewer.isDestroyed()) viewer.destroy();
            }
        };

        initializeViewer();

        return () => {
            console.log("[Vista3D] Desmontando visor ..");
            isMounted.current = false;
            if (viewer && !viewer.isDestroyed()) {
                viewer.destroy();
            }
            viewerRef.current = null;
        };
    }, []);


    // --- MANEJO DE ARCHIVOS ---

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limpieza previa y estados iniciales
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('proyecto_id', selectedProjectId);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/modelos-3d`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${user?.token}`);

        // Tiempo límite de 10 minutos para procesar modelos pesados
        xhr.timeout = 600000;

        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
                setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            }
        };

        xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const newModel = JSON.parse(xhr.responseText);

                    // Caso: El servidor terminó pero el procesamiento 3D falló
                    if (newModel.estado === 'ERROR_PROCESAMIENTO') {
                        throw new Error(newModel.metadata?.detalle || 'El motor 3D no pudo interpretar este archivo.');
                    }

                    Swal.fire({
                        title: '¡IMPORTACIÓN EXITOSA!',
                        text: 'El modelo se ha procesado y renderizado correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#0f172a',
                        color: '#f8fafc',
                        customClass: {
                            popup: 'rounded-2xl border border-slate-800 shadow-2xl',
                            title: 'text-sm font-black uppercase tracking-widest',
                        }
                    });

                    fetchModelos();
                    setSelectedModelo(newModel);
                } catch (err) {
                    Swal.fire({
                        title: 'FALLO DE PROCESAMIENTO',
                        text: err.message,
                        icon: 'error',
                        background: '#0f172a',
                        color: '#f8fafc',
                        customClass: {
                            popup: 'rounded-2xl border border-slate-800 shadow-2xl',
                            title: 'text-sm font-black uppercase tracking-widest',
                        }
                    });
                }
            } else {
                // Manejo de códigos de error HTTP específicos
                let errorTitle = 'ERROR DE IMPORTACIÓN';
                let errorMsg = 'No se pudo completar la operación.';

                if (xhr.status === 413) errorMsg = 'El archivo es demasiado grande para ser procesado por el servidor.';
                if (xhr.status === 401 || xhr.status === 403) errorMsg = 'Tu sesión ha expirado o no tienes permisos suficientes.';
                if (xhr.status === 500) {
                    try {
                        const res = JSON.parse(xhr.responseText);
                        errorMsg = res.error || 'Fallo crítico en el servidor.';
                    } catch (e) {
                        errorMsg = 'Fallo interno en el procesamiento de la malla 3D.';
                    }
                }

                Swal.fire({
                    title: errorTitle,
                    text: errorMsg,
                    icon: 'error',
                    background: '#0f172a',
                    color: '#f8fafc',
                    customClass: {
                        popup: 'rounded-2xl border border-slate-800 shadow-2xl',
                        title: 'text-sm font-black uppercase tracking-widest',
                    }
                });
            }
            e.target.value = ''; // Limpiar input para permitir re-subida
        };

        xhr.onerror = () => {
            setIsUploading(false);
            Swal.fire({
                title: 'FALLO DE CONEXIÓN',
                text: 'La conexión fue interrumpida. Revisa tu velocidad de internet o estabilidad de red.',
                icon: 'error',
                background: '#0f172a',
                color: '#f8fafc',
                customClass: {
                    popup: 'rounded-2xl border border-slate-800 shadow-2xl',
                    title: 'text-sm font-black uppercase tracking-widest',
                }
            });
            e.target.value = '';
        };

        xhr.ontimeout = () => {
            setIsUploading(false);
            Swal.fire({
                title: 'TIEMPO AGOTADO',
                text: 'La subida ha tardado demasiado (más de 10 min). Tu conexión es muy lenta para el tamaño de este archivo.',
                icon: 'warning',
                background: '#0f172a',
                color: '#f8fafc',
                customClass: {
                    popup: 'rounded-2xl border border-slate-800 shadow-2xl',
                    title: 'text-sm font-black uppercase tracking-widest',
                }
            });
            e.target.value = '';
        };

        xhr.send(formData);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar Modelo?',
            text: "Se borrará la malla 3D y su configuración asociada.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#1e293b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#0f172a',
            color: '#f8fafc',
            customClass: {
                popup: 'rounded-2xl border border-slate-800 shadow-2xl',
                title: 'text-sm font-black uppercase tracking-widest',
                htmlContainer: 'text-xs text-slate-400',
                confirmButton: 'text-[10px] font-bold uppercase tracking-widest px-6 py-3',
                cancelButton: 'text-[10px] font-bold uppercase tracking-widest px-6 py-3'
            }
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/api/modelos-3d/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    fetchModelos();
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'El modelo ha sido removido correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#0f172a',
                        color: '#f8fafc'
                    });
                }
            } catch (e) {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el modelo.',
                    icon: 'error',
                    background: '#0f172a',
                    color: '#f8fafc'
                });
            }
        }
    };


    // --- SELECCIÓN DE MODELO ---
    useEffect(() => {
        console.log("[Vista3D] useEffect selectedModelo disparado. Modelo:", selectedModelo?.id, "Viewer:", !!viewerRef.current);
        if (!selectedModelo || !viewerRef.current) {
            console.log("[Vista3D] Abortando efecto: No hay modelo o viewer.");
            return;
        }
        const viewer = viewerRef.current;
        console.log("[Vista3D] Procesando modelo:", selectedModelo.nombre_archivo || selectedModelo.id);

        // CASO ESPECIAL: Si es un Tramo Maestro (Streaming), no hay malla fija que procesar
        if (selectedModelo.url_archivo === 'STREAMING_LOCAL_SIN_MALLA') {
            console.log("[Vista3D] Detectado modelo de STREAMING");
            if (selectedModelo.metadata && selectedModelo.metadata.centro_utm) {
                const { x, y } = selectedModelo.metadata.centro_utm;
                console.log("[Vista3D] Centro UTM detectado:", x, y);
                const wgs = utmToWgs84(x, y, 18, 'S');
                console.log("[Vista3D] Conversión WGS84 para vuelo:", wgs);
                viewer.camera.flyTo({
                    destination: Cartesian3.fromDegrees(wgs.lon, wgs.lat, 1200), // Vista más amplia para tramos
                    duration: 1.5
                });
            } else {
                console.warn("[Vista3D] El modelo streaming no tiene metadatos de centro_utm:", selectedModelo.metadata);
            }
            setIsGlobalLoading(false);
            return;
        }

        // CASO NORMAL: Procesamiento de malla OBJ
        (async () => {
            try {
                // VALIDACIÓN CRÍTICA: Si el modelo está pendiente, no intentar fetch (evita cargar index.html como OBJ)
                if (selectedModelo.url_archivo === 'PENDIENTE' || !selectedModelo.url_archivo) {
                    setIsGlobalLoading(false);
                    Swal.fire({
                        title: 'Modelo no procesado',
                        text: 'Este modelo aún no ha sido convertido a 3D por el servidor o el proceso falló durante la subida.',
                        icon: 'error',
                        background: '#0f172a',
                        color: '#f8fafc'
                    });
                    console.error("[Vista3D] Abortando carga: url_archivo es PENDIENTE.");
                    return;
                }

                setIsGlobalLoading(true);
                console.log("[Vista3D] Cargando malla OBJ...");
                let objData = null;

                if (selectedModelo.url_archivo === 'DB_EMBEDDED_OBJ') {
                    console.log("[Vista3D] Extrayendo malla desde la Base de Datos (PostgreSQL)...");
                    objData = selectedModelo.metadata?.obj_content;
                    if (!objData) throw new Error("No se encontró el contenido OBJ en los metadatos de la DB.");
                } else {
                    console.log("[Vista3D] Descargando malla desde URL externa:", selectedModelo.url_archivo);
                    const resp = await fetch(selectedModelo.url_archivo);
                    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
                    objData = await resp.text();
                }

                if (objData === 'PENDIENTE') {
                    throw new Error("El modelo aún está siendo procesado por el servidor.");
                }

                if (!objData || objData.trim().startsWith('<!DOCTYPE html>') || objData.trim().startsWith('<html')) {
                    throw new Error("El servidor devolvió una página HTML en lugar de un objeto 3D o el archivo no se generó correctamente.");
                }

                console.log("[Vista3D] Datos OBJ listos, longitud:", objData?.length || 0);

                const verticesInfo = [], elevationData = [], indicesTriangulos = [], indicesBordesFull = [];
                let minZ = Infinity, maxZ = -Infinity;
                let sumLon = 0, sumLat = 0;

                const lines = objData.split('\n');
                const len = lines.length;
                console.log("[Vista3D] Procesando", len, "líneas del OBJ...");

                for (let i = 0; i < len; i++) {
                    const line = lines[i];
                    if (line.startsWith('v ')) {
                        const parts = line.trim().split(/\s+/);
                        const vx = parseFloat(parts[2]), vy = parseFloat(parts[1]), vz = parseFloat(parts[3]);
                        const { lon, lat } = utmToWgs84(vx, vy);

                        verticesInfo.push({ lon, lat, z: vz });
                        elevationData.push(vz);
                        sumLon += lon; sumLat += lat;

                        if (vz < minZ) minZ = vz; if (vz > maxZ) maxZ = vz;
                    } else if (line.startsWith('f ')) {
                        const parts = line.trim().split(/\s+/);
                        if (parts.length >= 4) {
                            const v1 = parseInt(parts[1]) - 1, v2 = parseInt(parts[2]) - 1, v3 = parseInt(parts[3]) - 1;
                            indicesTriangulos.push(v1, v2, v3);
                            indicesBordesFull.push(v1, v2, v2, v3, v3, v1);
                        }
                    }

                    if (i % 15000 === 0 && i > 0) await new Promise(resolve => setTimeout(resolve, 0));
                }

                console.log("[Vista3D] Procesamiento finalizado. Vértices:", verticesInfo.length, "Triángulos:", indicesTriangulos.length / 3);
                currentModelDataRef.current = { verticesInfo, elevationData, minZ, maxZ, indicesTriangulos, indicesBoundary: [], indicesBordesFull };
                const midZ = minZ + (maxZ - minZ) / 2.0;

                renderFinalMesh(verticesInfo, elevationData, minZ, maxZ, indicesTriangulos, [], indicesBordesFull);

                setIsGlobalLoading(false);

                if (verticesInfo.length > 0) {
                    const centerLon = sumLon / verticesInfo.length;
                    const centerLat = sumLat / verticesInfo.length;
                    console.log("[Vista3D] Volando a centro de malla:", centerLon, centerLat, "Altitud:", midZ + 800);
                    viewer.camera.flyTo({
                        destination: Cartesian3.fromDegrees(centerLon, centerLat, midZ + 800),
                        duration: 2.0
                    });
                } else {
                    console.warn("[Vista3D] No se encontraron vértices válidos en el OBJ.");
                }
            } catch (e) {
                console.error("[Vista3D] Error crítico cargando modelo:", e);
                setIsGlobalLoading(false);
            }
        })();
    }, [selectedModelo, renderFinalMesh]);

    const centerMap = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        // Prioridad 1: Vuelo a la malla LandXML actual
        if (currentModelDataRef.current && currentModelDataRef.current.verticesInfo && currentModelDataRef.current.verticesInfo.length > 0) {
            const { verticesInfo, minZ, maxZ } = currentModelDataRef.current;
            const midZ = minZ + (maxZ - minZ) / 2.0;
            let sumLon = 0, sumLat = 0;
            verticesInfo.forEach(v => { sumLon += v.lon; sumLat += v.lat; });
            const centerLon = sumLon / verticesInfo.length;
            const centerLat = sumLat / verticesInfo.length;
            viewer.camera.flyTo({
                destination: Cartesian3.fromDegrees(centerLon, centerLat, midZ + 1500),
                duration: 2.0,
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });
            return;
        }

        // Prioridad 2: Vuelo a los DataSources KML (Trazados)
        if (kmlDataSourcesRef.current && kmlDataSourcesRef.current.length > 0) {
            viewer.flyTo(kmlDataSourcesRef.current[0], {
                duration: 2.0,
                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 0)
            });
            return;
        }

        // Prioridad 3: Vuelo a Sólidos / Calicatas
        if (soilEntitiesRef.current && soilEntitiesRef.current.length > 0) {
            viewer.flyTo(soilEntitiesRef.current, {
                duration: 2.0,
                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 0)
            });
            return;
        }
    }, [Cartesian3]);

    // --- UI RENDER (dashboardContent y loadingOverlay) ---
    // (Keeping them at the end to ensure all references are initialized)

    return (
        <div id="visor3DContainer" className="visor-3d-root flex-1 w-full relative bg-slate-950 overflow-hidden flex flex-col font-sans">
            {/* 1. TOP BAR (HEADER) - Estética "Navy Vertical High-Contrast" */}
            <div className="w-full h-14 border-b border-blue-900/40 bg-gradient-to-b from-white to-blue-200/30 flex items-center justify-between px-6 z-50 shrink-0 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                        <button
                            onClick={() => setIsLeftOpen(!isLeftOpen)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${
                                isLeftOpen 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                : 'bg-white border-slate-200 text-slate-500 hover:text-blue-700 hover:border-blue-300'
                            }`}
                            title="Explorador de Modelos"
                        >
                            <i className={`fas ${isLeftOpen ? 'fa-folder-open' : 'fa-folder'}`}></i>
                        </button>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-slate-800 tracking-tighter uppercase leading-none">
                            Geoportal <span className="text-blue-700">3D</span> Core
                        </h1>
                        <p className="text-[9px] font-bold text-blue-900/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                            Visualizador LandXML v3.0
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status badge Premium */}
                    {statusMessage && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white border border-blue-100 rounded shadow-sm">
                            <i className="fas fa-sync fa-spin text-[10px] text-blue-600"></i>
                            <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">{statusMessage}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleFullScreen}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 rounded-md border border-slate-200 transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                            <i className={`fas ${document.fullscreenElement ? 'fa-compress' : 'fa-expand'}`}></i>
                            <span className="hidden sm:inline">Pantalla Completa</span>
                        </button>
                        
                        <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

                        <button
                            onClick={() => setIsRightOpen(!isRightOpen)}
                            className={`w-8 h-8 flex items-center justify-center transition-all rounded-md border ${
                                isRightOpen 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                                : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'
                            }`}
                            title="Configuración Visual"
                        >
                            <i className="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. BODY AREA (SIDEBARS + MAP) */}
            <div className="flex-1 flex w-full h-[calc(100%-3.5rem)] overflow-hidden relative">

                {/* A. SIDEBAR IZQUIERDO */}
                {isLeftOpen && (
                    <aside className="absolute left-0 top-0 w-72 border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl flex flex-col z-40 shrink-0 shadow-[20px_0_40px_rgba(0,0,0,0.5)] h-full animate-in slide-in-from-left-full duration-500 ease-out">
                    <div className="p-4 border-b border-slate-800/50">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xml,.zip,.ifc" />
                        <button onClick={() => fileInputRef.current.click()} className="w-full bg-blue-600/10 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white py-4 rounded-xl transition-all flex flex-col items-center gap-1 group">
                            <i className="fa-solid fa-cloud-arrow-up text-xl group-hover:scale-110 transition-transform"></i>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Importar LandXML</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        <div className="px-2 mb-2">
                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modelos Disponibles</h4>
                        </div>
                        {modelos.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <i className="fa-solid fa-folder-open text-slate-700 text-3xl mb-3"></i>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Sin modelos cargados</p>
                            </div>
                        ) : (
                            modelos.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedModelo(m)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedModelo?.id === m.id
                                            ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                            : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className="fa-solid fa-cube text-blue-400 text-[10px]"></i>
                                        <h4 className="text-[10px] font-bold text-white truncate flex-1 leading-tight">{m.nombre_archivo}</h4>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${selectedModelo?.id === m.id ? 'bg-blue-400 text-blue-950' : 'bg-slate-800 text-slate-500'
                                            }`}>OBJ</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                                            className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                                        >
                                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
                )}

                {/* B. ÁREA CENTRAL (MAPA) */}
                <div className="flex-1 relative bg-black overflow-hidden h-full">
                    <div ref={containerRef} className="w-full h-full" />

                    {/* Botones de Estilo de Capa Flotantes */}
                    <div className={`absolute top-6 transition-all duration-300 flex flex-col gap-3 z-30 ${isRightOpen ? 'right-[344px]' : 'right-6'}`}>
                        {['hipso', 'malla', 'estratos'].map(style => (
                            <button
                                key={style}
                                onClick={() => setMapStyle(style)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border transition-all duration-300 ${mapStyle === style
                                        ? 'bg-blue-600 border-blue-400 text-white translate-x-[-4px] shadow-blue-600/40'
                                        : 'bg-slate-900/80 backdrop-blur-md border-slate-700 text-slate-500 hover:text-white'
                                    }`}
                                title={style.toUpperCase()}
                            >
                                <i className={`fa-solid ${style === 'hipso' ? 'fa-layer-group' : style === 'malla' ? 'fa-border-all' : 'fa-mountain'}`}></i>
                            </button>
                        ))}
                    </div>

                    {/* Botón Flotante para Centrar Tramo */}
                    <button
                        onClick={centerMap}
                        className={`absolute bottom-6 transition-all duration-300 w-12 h-12 rounded-xl flex items-center justify-center shadow-xl border z-30 ${isRightOpen ? 'right-[344px]' : 'right-6'} ${
                            mapStyle === 'hipso' 
                            ? 'bg-blue-600 border-blue-400 text-white' 
                            : 'bg-slate-900/80 backdrop-blur-md border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Centrar en el Proyecto"
                    >
                        <i className="fas fa-crosshairs text-xl"></i>
                    </button>

                    {/* Overlay de Carga Portal */}
                    {(isGlobalLoading || isUploading) && createPortal(
                        <div className="bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-8 z-[99999] fixed inset-0">
                            <div className="w-96 text-center space-y-8 p-12 rounded-[2rem] bg-slate-900/50 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="4" fill="transparent"
                                            strokeDasharray={364.4}
                                            strokeDashoffset={364.4 - (364.4 * (isUploading ? uploadProgress : 100)) / 100}
                                            className="text-blue-500 transition-all duration-500 ease-out" strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <i className={`fa-solid ${isUploading ? 'fa-cloud-arrow-up text-3xl animate-bounce' : 'fa-satellite-dish text-4xl fa-beat-fade'} text-blue-400`}></i>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-white text-base font-black uppercase tracking-[0.3em]">{isUploading ? 'Subiendo Datos...' : 'Procesando Malla...'}</h3>
                                    {isUploading && (
                                        <div className="space-y-4 pt-4 px-2">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-blue-400 font-mono text-3xl font-black">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                                                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>

                {/* C. PANEL DERECHO (OPCIONES) */}
                {isRightOpen && (
                    <aside className="absolute right-0 top-0 w-80 border-l border-white/5 bg-slate-950/40 backdrop-blur-3xl flex flex-col z-40 shrink-0 h-full animate-in slide-in-from-right-full duration-500 ease-out shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-slate-800 bg-slate-950/20">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Opciones Visuales</h3>
                        </div>
                        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Terreno Natural</label>
                                    <span className="text-blue-400 font-mono text-xs font-bold">{Math.round(mapOpacity * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={mapOpacity} onChange={(e) => setMapOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-blue-500 cursor-pointer" />
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all duration-500 ${mapOpacity < 0.1 ? 'bg-blue-600/5 border-blue-500/20 shadow-inner' : 'bg-slate-800/10 border-slate-800 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mapOpacity < 0.1 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                                            <i className="fa-solid fa-microscope text-sm"></i>
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Capas Geológicas</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer scale-90">
                                        <input type="checkbox" checked={showEstratosLayer} onChange={(e) => setShowEstratosLayer(e.target.checked)} className="sr-only peer" disabled={mapOpacity > 0.1} />
                                        <div className="w-10 h-5 bg-slate-700 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 shadow-inner"></div>
                                    </div>
                                </div>
                                {showEstratosLayer && mapOpacity < 0.1 ? (
                                    <div className="space-y-6 pt-4 border-t border-blue-500/10 active:animate-in fade-in zoom-in-95 duration-300">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Vertical Exaggeration</label>
                                                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{zExag}x</span>
                                            </div>
                                            <input type="range" min="1" max="50" step="1" value={zExag} onChange={(e) => setZExag(parseFloat(e.target.value))} className="w-full h-1 bg-slate-900 rounded-full appearance-none accent-blue-400 cursor-pointer" />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-slate-600 italic font-medium leading-relaxed">Baja la opacidad al 0% para habilitar el visor de geología.</p>
                                )}
                            </div>

                            {/* NUEVA SECCIÓN: LISTA DE CALICATAS */}
                            <div className="space-y-4 pt-6 border-t border-slate-800">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exploración de Calicatas</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {((soilData?.progresivas || []).filter(p => p.estratos && p.estratos.length > 0)).length === 0 ? (
                                        <div className="p-10 text-center opacity-40">
                                            <i className="fa-solid fa-location-dot text-2xl mb-2"></i>
                                            <p className="text-[9px] font-bold uppercase tracking-tighter leading-none">No hay puntos con estratos</p>
                                        </div>
                                    ) : (
                                        soilData.progresivas
                                            .filter(p => p.estratos && p.estratos.length > 0)
                                            .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                            .map(p => {
                                                const hasCoords = p.coordenada_este && p.coordenada_norte;
                                                const hasData = p.estratos && p.estratos.length > 0;
                                                const isDisabled = !hasCoords || !hasData;

                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => !isDisabled && flyToProgressive(p)}
                                                        className={`group p-3 rounded-xl border transition-all flex items-center justify-between ${isDisabled
                                                                ? 'bg-slate-900/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                                                                : 'bg-slate-800/30 border-slate-800 hover:border-blue-500/50 hover:bg-blue-600/5 cursor-pointer shadow-sm'
                                                            }`}
                                                        title={isDisabled ? "Este punto no tiene coordenadas o estratos registrados" : "Volar a esta ubicación"}
                                                    >
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDisabled ? 'bg-slate-600' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                                                }`}></div>
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className={`text-[10px] font-bold transition-colors uppercase tracking-tight truncate ${isDisabled ? 'text-slate-500' : 'text-slate-300 group-hover:text-white'
                                                                    }`}>{p.nombre}</span>
                                                                {isDisabled && (
                                                                    <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest mt-0.5">
                                                                        {!hasCoords ? 'Sin Coordenadas' : 'Sin Estratos'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!isDisabled && (
                                                            <i className="fa-solid fa-location-crosshairs text-[10px] text-slate-600 group-hover:text-blue-400 transition-colors"></i>
                                                        )}
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
