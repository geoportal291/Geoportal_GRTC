import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { utmToWgs84, processCoordinates, getUtmZoneFromLon, chunkedSampleTerrain, waitForTerrainReady } from '../../../../utils/geoUtils';
import { FullTramoEngine } from './FullTramoEngine';
import { applyDioramaCameraMode, clampDioramaCamera, getDioramaLocalMaxHeight } from './DioramaCameraController';
import { useAuth } from '../../../../data/contexts/AuthContext';
import useProgresivasData from '../../../../hooks/useProgresivasData';
import useModelLoader from './useModelLoader';
import useTerrainElevation from './hooks/useTerrainElevation';
import { BoreholeBatchEngine } from './engines/BoreholeBatchEngine';
import { MapEngineFactory } from './core/MapEngineFactory';
import LayersControlPanel from './components/LayersControlPanel';
import Progressivas3DSelector from './components/Progressivas3DSelector';
import BoreholeDetailTooltip from './components/BoreholeDetailTooltip';
import './Vista3D.css';

const getCesium = () => window.Cesium || {};
const Cesium = getCesium();
const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'https://backendgeoportal.fly.dev';
const ION_TOKEN = process.env.REACT_APP_CESIUM_TOKEN;

export default function Vista3D() {
    const { selectedProjectId, user } = useAuth();

    // DESESTRUCTURACIÓN SEGURA DE CESIUM CON FALLBACK
    const C = window.Cesium || {};
    const {
        Viewer, Ion, Terrain, Cartesian3, Cartographic, Geometry, GeometryAttribute,
        ComponentDatatype, PrimitiveType, BoundingSphere, GeometryPipeline, Primitive,
        PerInstanceColorAppearance, ColorGeometryInstanceAttribute, Color,
        MaterialAppearance, Material, GeometryInstance, IonImageryProvider,
        ArcGisMapServerImageryProvider, UrlTemplateImageryProvider,
        sampleTerrainMostDetailed, EllipsoidTerrainProvider, ClippingPolygon, ClippingPolygonCollection,
        KmlDataSource, LabelStyle, VerticalOrigin, Cartesian2
    } = C;

    const [soilData, setSoilData] = useState(null); // NUEVO: Mover aquí para evitar TDZ



    // --- ESTADOS Y REFERENCIAS (Definidos al inicio para evitar TDZ) ---
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [modelos, setModelos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [selectedModelo, setSelectedModelo] = useState(null);
    const [mapOpacity, setMapOpacity] = useState(1.0);
    const [zExag, setZExag] = useState(1.0); // 1x = escala real (exageración unificada malla/calicatas/muro/globo)
    const [isViewerReady, setIsViewerReady] = useState(false); // NUEVO: Control de ciclo de vida del visor
    const [isRightOpen, setIsRightOpen] = useState(false);
    const [isLeftOpen, setIsLeftOpen] = useState(false);
    const [isGroundMode, setIsGroundMode] = useState(false);
    const [subProgresivas, setSubProgresivas] = useState([]);
    const [isFetchingBoreholes, setIsFetchingBoreholes] = useState(false);
    const [mapStyle, setMapStyle] = useState('hipso');
    const [showEstratosLayer, setShowEstratosLayer] = useState(false);
    const [projectZone, setProjectZone] = useState('18S'); // NUEVO: Zona detectada automáticamente
    const [selectedProgressiva3D, setSelectedProgressiva3D] = useState(null);
    const [dioramaSize, setDioramaSize] = useState(500);
    const [cameraMode, setCameraMode] = useState('orbit');
    const [modelMeshVersion, setModelMeshVersion] = useState(0);
    const [selectedEstratoTooltip, setSelectedEstratoTooltip] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState(null);
    // Base vertical (MSL) alrededor de la cual se exagera TODO el escenario (malla, calicatas, muro y globo).
    const [zBase, setZBase] = useState(0);
    // Diorama del Tramo: recorta el planeta al bbox del trazado (+margen). Todo lo demás desaparece.
    const [corridorClip, setCorridorClip] = useState(true);

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
    const engineRef = useRef(null);
    const isMounted = useRef(false);
    const focusImageryLayerRef = useRef(null);
    const chunkRectangleRef = useRef(null);
    const soilEntitiesRef = useRef([]); // Referencia para marcadores y calicatas vacías
    const kmlDataSourcesRef = useRef([]); // Referencia para líneas de trazado KML
    const fullTramoWallEntitiesRef = useRef([]);
    const batchBoreholePrimitiveRef = useRef(null);
    const fullTramoWallPrimitiveRef = useRef(null);
    const abortControllersRef = useRef(new Map());
    const dioramaBoxEntitiesRef = useRef([]);
    const dioramaConstraintRef = useRef(null);
    const dioramaOrbitLockRef = useRef(false); // anclaje orbital activo (camera.lookAt)
    const isApplyingDioramaClampRef = useRef(false);
    const isDioramaTransitioningRef = useRef(false);
    const dioramaAnchorRef = useRef(null);
    const dioramaMaskPolygonRef = useRef(null);
    const progressivaAnchorsRef = useRef(new Map());
    const selectedProgressivaRef = useRef(null);
    const pendingDioramaFocusRef = useRef(null);
    const hasInitialAutoCenterRef = useRef(false);
    const localRoadEntityRef = useRef(null);
    const localEstratosRef = useRef([]);
    const localMarkerEntityRef = useRef(null);
    const localOverlayEntitiesRef = useRef([]);
    const zExagRef = useRef(1.0);
    const zBaseRef = useRef(0);
    const sampledTerrainCacheRef = useRef(new Map());
    const wallBuildParamsRef = useRef(null);
    const wallBuildGenRef = useRef(0);
    const batchInputRef = useRef(null);
    const batchBuildParamsRef = useRef(null);
    const corridorClipRef = useRef(true);
    const corridorPolygonRef = useRef(null);

    // --- MOTOR DE PROGRESIVAS ---
    useProgresivasData();

    // --- CARGADOR DE MODELOS Y ELEVACIÓN UNIFICADA ---
    const { loadModel, cancelLoad } = useModelLoader({
        userToken: user?.token,
        processCoordinates,
        utmToWgs84,
    });
    const { resolveSurfaceZ, exaggerateZ } = useTerrainElevation();

    // ── EXAGERACIÓN VERTICAL UNIFICADA (única fuente de verdad) ──────────────
    // Los datos SIEMPRE se guardan en MSL real; la exageración se aplica solo al render:
    //   cota absoluta:  zRender = zBase + (z - zBase) * f
    //   profundidad:    surfaceRender - prof * f
    // zBase = midZ de la malla activa (o promedio de calicatas si no hay malla).
    useEffect(() => { zExagRef.current = zExag; }, [zExag]);
    useEffect(() => { zBaseRef.current = zBase; }, [zBase]);
    useEffect(() => { corridorClipRef.current = corridorClip; }, [corridorClip]);

    const currentZExag = useCallback(() => Math.max(1.0, parseFloat(zExagRef.current) || 1.0), []);
    const surfRenderZ = useCallback((surfaceZ) => exaggerateZ(
        surfaceZ,
        Math.max(1.0, parseFloat(zExagRef.current) || 1.0),
        { surfaceBase: Number.isFinite(zBaseRef.current) ? zBaseRef.current : 0 }
    ), [exaggerateZ]);
    const depthRenderZ = useCallback((surfaceZ, depth) => (
        surfRenderZ(surfaceZ) - (Math.abs(depth) * Math.max(1.0, parseFloat(zExagRef.current) || 1.0))
    ), [surfRenderZ]);

    // --- FUNCIONES CORE (Definidas antes que los efectos para evitar ReferenceError) ---

    /**
     * Renderiza la malla LandXML final combinando capas visuales y estratos.
     */
    const renderFinalMesh = useCallback((verticesInfo, elevationData, minZ, maxZ, indicesTriangulos, indicesBoundary, indicesBordesFull) => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed() || !verticesInfo || verticesInfo.length === 0) {
            return;
        }

        const isDioramaActive = !!selectedProgressiva3D;
        const showHipsoSurface = mapStyle === 'hipso' || mapStyle === 'estratos' || isDioramaActive;
        const showMeshOverlay = mapStyle === 'malla';
        const showBoundaryLines = mapStyle !== 'malla' && !isDioramaActive;
        const surfaceAlpha = isDioramaActive ? 150 : 255;

        const midZ = minZ + (maxZ - minZ) / 2.0;
        // La malla fija la base de exageración de todo el escenario (globo, calicatas y muro la siguen).
        setZBase((prev) => (Number.isFinite(midZ) ? midZ : prev));

        const vertices = verticesInfo.map(vi => {
            const exaggeratedZ = exaggerateZ(vi.z, zExag, { surfaceBase: midZ });
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
            colors8[i * 4 + 3] = surfaceAlpha;
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
            appearance: new PerInstanceColorAppearance({ flat: false, translucent: isDioramaActive, closed: false }),
            asynchronous: false,
            show: showHipsoSurface
        });
        solidPrimitiveHipso.isCustomTopography = true;

        const solidPrimitiveMalla = new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: solidGeometryTopo,
                attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.RED.withAlpha(0.25)) }
            }),
            appearance: new PerInstanceColorAppearance({ flat: true, translucent: true, closed: false }),
            asynchronous: false,
            show: showMeshOverlay
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
            show: showMeshOverlay
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
            show: showBoundaryLines
        });
        wirePrimitiveBoundary.isCustomTopography = true;

        hipsoPrimitiveRef.current = solidPrimitiveHipso;
        mallaSolidRef.current = solidPrimitiveMalla;
        mallaWireRef.current = wirePrimitiveMalla;
        boundaryWireRef.current = wirePrimitiveBoundary;

        estratosRefs.current = [];
        [solidPrimitiveHipso, solidPrimitiveMalla, wirePrimitiveMalla, wirePrimitiveBoundary].forEach(p => viewer.scene.primitives.add(p));
        viewer.scene.requestRender();
    }, [zExag, mapStyle, mapOpacity, selectedProgressiva3D, showEstratosLayer, exaggerateZ]);

    const clearDioramaBox = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;
        dioramaBoxEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
        dioramaBoxEntitiesRef.current = [];
    }, []);

    const clearLocalOverlays = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;
        localOverlayEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
        localOverlayEntitiesRef.current = [];
        localRoadEntityRef.current = null;
        localEstratosRef.current = [];
        localMarkerEntityRef.current = null;
    }, []);

    // ── DIORAMA DEL TRAMO: recorte rectangular automático del planeta ────────
    // En vez de renderizar el planeta completo, se descarta todo lo que queda fuera
    // del bbox del trazado (+margen): Cesium deja de pedir/renderizar esas teselas.
    // El bbox se adapta solo: tramo alargado → rectángulo alargado; tramo cuadrado → cuadrado.
    const computeCorridorPolygon = useCallback(() => {
        let minLon = Infinity;
        let maxLon = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;
        let fuente = null;

        // Fuente preferente: la malla LandXML cargada (cobertura exacta del modelo)
        const vertices = currentModelDataRef.current?.rawVertices;
        if (vertices?.length) {
            for (const v of vertices) {
                if (!Number.isFinite(v.lon) || !Number.isFinite(v.lat)) continue;
                if (v.lon < minLon) minLon = v.lon;
                if (v.lon > maxLon) maxLon = v.lon;
                if (v.lat < minLat) minLat = v.lat;
                if (v.lat > maxLat) maxLat = v.lat;
            }
            if (Number.isFinite(minLon)) fuente = 'malla';
        }

        // Fallback: el trazado KML de los tramos
        if (!fuente && kmlDataSourcesRef.current.length) {
            const sampleTime = Cesium.JulianDate.now();
            kmlDataSourcesRef.current.forEach((ds) => {
                ds?.entities?.values?.forEach((entity) => {
                    if (!entity?.polyline?.positions) return;
                    let positions = entity.polyline.positions;
                    if (typeof positions.getValue === 'function') {
                        positions = positions.getValue(sampleTime);
                    }
                    if (!Array.isArray(positions)) return;
                    fuente = fuente || 'kml';
                    positions.forEach((pos) => {
                        const carto = Cartographic.fromCartesian(pos);
                        const lon = Cesium.Math.toDegrees(carto.longitude);
                        const lat = Cesium.Math.toDegrees(carto.latitude);
                        if (lon < minLon) minLon = lon;
                        if (lon > maxLon) maxLon = lon;
                        if (lat < minLat) minLat = lat;
                        if (lat > maxLat) maxLat = lat;
                    });
                });
            });
        }

        if (!fuente || !Number.isFinite(minLon)) return null;

        // Margen adaptativo: 8% del lado mayor del tramo, mínimo 300 m
        const metersPerLon = (111_320 * Math.cos(Cesium.Math.toRadians((minLat + maxLat) / 2))) || 1;
        const anchoM = Math.max(1, (maxLon - minLon) * metersPerLon);
        const altoM = Math.max(1, (maxLat - minLat) * 110_540);
        const margenM = Math.max(300, Math.max(anchoM, altoM) * 0.08);

        return {
            fuente,
            corners: [
                { lon: minLon - margenM / metersPerLon, lat: minLat - margenM / 110_540 },
                { lon: maxLon + margenM / metersPerLon, lat: minLat - margenM / 110_540 },
                { lon: maxLon + margenM / metersPerLon, lat: maxLat + margenM / 110_540 },
                { lon: minLon - margenM / metersPerLon, lat: maxLat + margenM / 110_540 }
            ]
        };
    }, []);

    const applyCorridorClipToGlobe = useCallback((viewer) => {
        if (!viewer || viewer.isDestroyed() || !viewer.scene?.globe) return false;
        if (!ClippingPolygon || !ClippingPolygonCollection) return false;
        if (!ClippingPolygonCollection.isSupported(viewer.scene)) return false;

        const corridor = computeCorridorPolygon();
        if (!corridor) return false;

        const polygon = new ClippingPolygon({
            positions: corridor.corners.map(({ lon, lat }) => Cartesian3.fromDegrees(lon, lat, 0))
        });
        viewer.scene.globe.clippingPolygons = new ClippingPolygonCollection({
            polygons: [polygon],
            inverse: true, // mantiene SOLO el interior: el resto del planeta se descarta
            enabled: true,
            quality: 1.0
        });
        corridorPolygonRef.current = polygon;
        return true;
    }, [ClippingPolygon, ClippingPolygonCollection, Cartesian3, computeCorridorPolygon]);

    const clearDioramaTerrainMask = useCallback(() => {
        const viewer = viewerRef.current;
        dioramaMaskPolygonRef.current = null;
        if (!viewer || viewer.isDestroyed() || !viewer.scene?.globe) return;
        // Restaurar el planeta y el recorte del tramo (si está activo) al salir del diorama
        viewer.scene.globe.show = true;
        if (corridorClipRef.current && applyCorridorClipToGlobe(viewer)) {
            return;
        }
        viewer.scene.globe.clippingPolygons = undefined;
    }, [applyCorridorClipToGlobe]);

    const applyDioramaTerrainMask = useCallback((roundedRectLonLat) => {
        const viewer = viewerRef.current;
        if (
            !viewer ||
            viewer.isDestroyed() ||
            !viewer.scene?.globe ||
            !ClippingPolygon ||
            !ClippingPolygonCollection ||
            !Array.isArray(roundedRectLonLat) ||
            roundedRectLonLat.length < 3
        ) {
            return;
        }

        if (!ClippingPolygonCollection.isSupported(viewer.scene)) {
            return;
        }

        // HUECO DEL DIORAMA: se recorta el terreno DENTRO de la caja para que se vea el
        // chunk de la malla LandXML y los estratos; el mapa (montañas, etc.) sigue visible
        // por fuera. Esta máscara REEMPLAZA temporalmente al recorte del tramo (no pueden
        // coexistir en una misma colección); clearDioramaTerrainMask lo restaura al salir.
        const positions = roundedRectLonLat.map(({ lon, lat }) => (
            Cartesian3.fromDegrees(lon, lat, 0)
        ));

        const polygon = new ClippingPolygon({ positions });
        const clippingPolygons = new ClippingPolygonCollection({
            polygons: [polygon],
            inverse: false, // corta el interior de la caja → hueco que revela el chunk
            enabled: true,
            quality: 1.0
        });

        viewer.scene.globe.clippingPolygons = clippingPolygons;
        dioramaMaskPolygonRef.current = polygon;
    }, [Cartesian3, ClippingPolygon, ClippingPolygonCollection]);

    const disableDioramaConstraints = useCallback(() => {
        dioramaConstraintRef.current = null;
        dioramaOrbitLockRef.current = false;
        clearDioramaTerrainMask();
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;
        // Liberar el anclaje orbital (lookAt): sin esto la cámara global queda pegada al ancla
        try {
            const cam = viewer.scene?.camera;
            const M4 = Cesium.Matrix4;
            if (cam && typeof cam.lookAtTransform === 'function' && M4?.IDENTITY) {
                cam.lookAtTransform(M4.IDENTITY);
            }
        } catch (e) { }
        const controller = viewer.scene?.screenSpaceCameraController;
        if (!controller) return;
        controller.maximumZoomDistance = Number.POSITIVE_INFINITY;
        controller.minimumZoomDistance = 1;
        controller.enableInputs = true;
        controller.enableLook = true;
        controller.enableTilt = true;
        controller.enableTranslate = true;
        controller.enableRotate = true;
        controller.enableZoom = true;
        if (viewer.scene?.globe) {
            viewer.scene.globe.translucency.enabled = false;
            viewer.scene.globe.undergroundColor = Color.BLACK.withAlpha(0.0);
        }
    }, [clearDioramaTerrainMask]);

    const applyCameraMode = useCallback((mode) => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;

        const controller = viewer.scene?.screenSpaceCameraController;
        if (!controller) return;
        applyDioramaCameraMode({ controller, mode, dioramaSize });
    }, [dioramaSize]);

    const getSceneCamera = useCallback((viewer) => {
        if (!viewer || viewer.isDestroyed()) return null;
        try {
            return viewer.scene?.camera || null;
        } catch (e) {
            return null;
        }
    }, []);

    const resetCameraTransform = useCallback((camera) => {
        if (!camera || typeof camera.lookAtTransform !== 'function' || !Cesium.Matrix4?.IDENTITY) return;
        try {
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        } catch (e) { }
    }, []);

    const isViewerStable = useCallback((viewer) => {
        if (!viewer || viewer !== viewerRef.current || viewer.isDestroyed()) return false;
        try {
            return !!viewer.scene && !!viewer.entities && !!viewer.dataSources;
        } catch (e) {
            return false;
        }
    }, []);

    const offsetLonLatMeters = useCallback((centerLon, centerLat, eastMeters, northMeters) => {
        const metersPerLon = 111320 * Math.cos(Cesium.Math.toRadians(centerLat)) || 1;
        return {
            lon: centerLon + (eastMeters / metersPerLon),
            lat: centerLat + (northMeters / 110540)
        };
    }, []);

    const resolveProgressivaAnchor = useCallback((progressiva, fallbackHeight = null) => {
        const viewer = viewerRef.current;
        if (!progressiva) return null;

        const cachedAnchor = progressivaAnchorsRef.current.get(progressiva.id);
        if (cachedAnchor) {
            return {
                lon: cachedAnchor.lon,
                lat: cachedAnchor.lat,
                surfaceZ: Number.isFinite(fallbackHeight) && fallbackHeight !== 0
                    ? fallbackHeight
                    : cachedAnchor.surfaceZ
            };
        }

        let lon;
        let lat;
        let surfaceZ = Number.isFinite(fallbackHeight) ? fallbackHeight : parseFloat(progressiva.elevacion);

        const markerEntity = viewer?.entities?.getById?.(`prog-marker-${progressiva.id}`);
        if (markerEntity?.position) {
            try {
                const markerPosition = markerEntity.position.getValue(Cesium.JulianDate.now());
                if (markerPosition) {
                    const carto = Cesium.Cartographic.fromCartesian(markerPosition);
                    lon = Cesium.Math.toDegrees(carto.longitude);
                    lat = Cesium.Math.toDegrees(carto.latitude);
                    if (!Number.isFinite(surfaceZ)) {
                        surfaceZ = carto.height || 0;
                    }
                }
            } catch (e) { }
        }

        if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
            const progressivaCoords = processCoordinates(progressiva.coordenada_este, progressiva.coordenada_norte, projectZone);
            const wgs = utmToWgs84(progressivaCoords.x, progressivaCoords.y, projectZone);
            if (wgs) {
                lon = wgs.lon;
                lat = wgs.lat;
            }
        }

        return Number.isFinite(lon) && Number.isFinite(lat)
            ? { lon, lat, surfaceZ: Number.isFinite(surfaceZ) ? surfaceZ : 0 }
            : null;
    }, [projectZone]);

    const enforceDioramaCameraBounds = useCallback(() => {
        const viewer = viewerRef.current;
        const constraint = dioramaConstraintRef.current;
        if (!viewer || viewer.isDestroyed() || !constraint || isApplyingDioramaClampRef.current || isDioramaTransitioningRef.current || cameraMode === 'orbit') return;
        // Con el anclaje orbital activo la cámara YA está limitada (órbita + distancia al ancla);
        // este clamp por setView peleaba con los controles y producía los saltos erráticos.
        if (dioramaOrbitLockRef.current) return;

        const camera = getSceneCamera(viewer);
        if (!camera || !camera._scene) return;

        let cameraCartographic;
        try {
            cameraCartographic = camera.positionCartographic;
        } catch (e) {
            return;
        }

        if (!cameraCartographic) return;

        const clampResult = clampDioramaCamera({ Cesium, camera, constraint });
        if (!clampResult) {
            return;
        }

        isApplyingDioramaClampRef.current = true;
        try {
            camera.setView({
                destination: Cartesian3.fromDegrees(
                    clampResult.destination.lon,
                    clampResult.destination.lat,
                    clampResult.destination.height
                ),
                orientation: {
                    heading: camera.heading,
                    pitch: camera.pitch,
                    roll: camera.roll
                }
            });
        } finally {
            isApplyingDioramaClampRef.current = false;
        }
    }, [Cartesian3, cameraMode, getSceneCamera]);

    const flyToGlobalContext = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed() || selectedProgressivaRef.current || pendingDioramaFocusRef.current) {
            return false;
        }

        if (kmlDataSourcesRef.current.length > 0) {
            // Sin offset custom: el encuadre por defecto de flyTo calcula una distancia segura.
            // (Con offset HeadingPitchRange range=0 la cámara quedaba SOBRE el punto del trazado,
            // incluso bajo el terreno → estrellas a través del globo y "planeta invisible".)
            viewer.flyTo(kmlDataSourcesRef.current[0], { duration: 2.0 });
            return true;
        }

        if (currentModelDataRef.current?.activeVerticesInfo?.length) {
            const { activeVerticesInfo, activeMinZ, activeMaxZ } = currentModelDataRef.current;
            const midZ = activeMinZ + (activeMaxZ - activeMinZ) / 2.0;
            let sumLon = 0;
            let sumLat = 0;
            activeVerticesInfo.forEach((vertex) => {
                sumLon += vertex.lon;
                sumLat += vertex.lat;
            });
            const centerLon = sumLon / activeVerticesInfo.length;
            const centerLat = sumLat / activeVerticesInfo.length;
            const sceneCamera = getSceneCamera(viewer);
            if (!sceneCamera) return false;
            sceneCamera.flyTo({
                destination: Cartesian3.fromDegrees(centerLon, centerLat, midZ + 1500),
                duration: 2.0,
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });
            return true;
        }

        if (soilEntitiesRef.current.length > 0) {
            viewer.flyTo(soilEntitiesRef.current, { duration: 2.0 }); // encuadre por defecto (distancia segura)
            return true;
        }

        return false;
    }, [Cartesian3, getSceneCamera]);

    const buildEdgeIndices = useCallback((triangleIndices) => {
        const edgeIndices = [];
        for (let i = 0; i < triangleIndices.length; i += 3) {
            const a = triangleIndices[i];
            const b = triangleIndices[i + 1];
            const c = triangleIndices[i + 2];
            edgeIndices.push(a, b, b, c, c, a);
        }
        return edgeIndices;
    }, []);

    const buildBoundaryIndices = useCallback((triangleIndices) => {
        const edgeCounter = new Map();

        const registerEdge = (start, end) => {
            const key = start < end ? `${start}_${end}` : `${end}_${start}`;
            const current = edgeCounter.get(key);
            if (current) {
                current.count += 1;
            } else {
                edgeCounter.set(key, { start, end, count: 1 });
            }
        };

        for (let i = 0; i < triangleIndices.length; i += 3) {
            const a = triangleIndices[i];
            const b = triangleIndices[i + 1];
            const c = triangleIndices[i + 2];
            registerEdge(a, b);
            registerEdge(b, c);
            registerEdge(c, a);
        }

        const boundaryIndices = [];
        edgeCounter.forEach(({ start, end, count }) => {
            if (count === 1) {
                boundaryIndices.push(start, end);
            }
        });

        return boundaryIndices;
    }, []);

    const renderDioramaBox = useCallback((progressiva, sizeMeters, minZ, maxZ) => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed() || !progressiva?.coordenada_este || !progressiva?.coordenada_norte) return;

        clearDioramaBox();

        const progressivaElevation = parseFloat(progressiva.elevacion);
        const anchor = resolveProgressivaAnchor(progressiva);
        if (!anchor) return;
        const surfaceReferenceZ = Number.isFinite(progressivaElevation) && progressivaElevation !== 0
            ? progressivaElevation
            : (Number.isFinite(anchor.surfaceZ) && anchor.surfaceZ !== 0
                ? anchor.surfaceZ
                : (Number.isFinite(maxZ) ? maxZ : 0));
        // La caja debe HUNDIRSE hasta el piso circundante: en zonas montañosas el terreno
        // alrededor puede estar decenas de metros más abajo que la progresiva; un fondo
        // plano a la cota de la progresiva deja las paredes flotando en el aire.
        const baseZ = Math.min(Number.isFinite(minZ) ? minZ : surfaceReferenceZ, surfaceReferenceZ) - 150;
        const topZ = Math.max(Number.isFinite(maxZ) ? maxZ + 25 : surfaceReferenceZ + 2000, surfaceReferenceZ + 2000);
        // Cotas de render en espacio exagerado (misma fórmula que la malla y el globo)
        const surfaceRenderZ = surfRenderZ(surfaceReferenceZ);
        const baseRenderZ = surfRenderZ(baseZ);
        const topRenderZ = surfRenderZ(topZ);
        const halfWidth = Math.max(90, sizeMeters * 0.58);
        const halfDepth = Math.max(50, sizeMeters * 0.34);
        const clampHalfWidth = Math.max(halfWidth * 0.82, sizeMeters * 0.42);
        const clampHalfDepth = Math.max(halfDepth * 0.82, sizeMeters * 0.26);
        const centerLon = anchor.lon;
        const centerLat = anchor.lat;
        const roundedRectLonLat = [];
        const segments = 6;

        const pushCorner = (startAngle, endAngle) => {
            for (let i = 0; i <= segments; i++) {
                const t = startAngle + ((endAngle - startAngle) * i) / segments;
                roundedRectLonLat.push(
                    offsetLonLatMeters(
                        centerLon,
                        centerLat,
                        Math.cos(t) * halfWidth,
                        Math.sin(t) * halfDepth
                    )
                );
            }
        };

        pushCorner(Math.PI * 1.5, Math.PI * 2.0);
        pushCorner(0, Math.PI * 0.5);
        pushCorner(Math.PI * 0.5, Math.PI);
        pushCorner(Math.PI, Math.PI * 1.5);

        const bottomPositions = [];
        const topPositions = [];

        roundedRectLonLat.forEach(({ lon, lat }) => {
            bottomPositions.push(Cartesian3.fromDegrees(lon, lat, baseRenderZ));
            topPositions.push(Cartesian3.fromDegrees(lon, lat, topRenderZ));
        });

        const topLoop = viewer.entities.add({
            polyline: {
                positions: [...topPositions, topPositions[0]],
                width: 2,
                material: Color.CYAN.withAlpha(0.95)
            }
        });

        const bottomLoop = viewer.entities.add({
            polyline: {
                positions: [...bottomPositions, bottomPositions[0]],
                width: 2,
                material: Color.CYAN.withAlpha(0.35)
            }
        });

        const walls = viewer.entities.add({
            wall: {
                positions: [...roundedRectLonLat, roundedRectLonLat[0]].map(({ lon, lat }) => Cartesian3.fromDegrees(lon, lat)),
                minimumHeights: new Array(roundedRectLonLat.length + 1).fill(baseRenderZ),
                maximumHeights: new Array(roundedRectLonLat.length + 1).fill(topRenderZ),
                material: Color.CYAN.withAlpha(0.02),
                outline: true,
                outlineColor: Color.CYAN.withAlpha(0.32)
            }
        });

        const guideIndices = [0, Math.floor(roundedRectLonLat.length / 4), Math.floor(roundedRectLonLat.length / 2), Math.floor((roundedRectLonLat.length * 3) / 4)];
        const verticals = guideIndices.map((idx) => {
            const { lon, lat } = roundedRectLonLat[idx];
            return viewer.entities.add({
                    polyline: {
                        positions: [
                            Cartesian3.fromDegrees(lon, lat, baseRenderZ),
                            Cartesian3.fromDegrees(lon, lat, topRenderZ)
                        ],
                        width: 1.5,
                        material: Color.CYAN.withAlpha(0.5)
                    }
            });
        });

        dioramaBoxEntitiesRef.current = [topLoop, bottomLoop, walls, ...verticals];
        // El ancla y las restricciones de cámara viven en COTAS DE RENDER (exageradas),
        // igual que la cámara y el resto de entidades.
        dioramaAnchorRef.current = {
            lon: centerLon,
            lat: centerLat,
            surfaceZ: surfaceRenderZ
        };
        dioramaConstraintRef.current = {
            centerLon,
            centerLat,
            halfWidthMeters: halfWidth,
            halfDepthMeters: halfDepth,
            clampHalfWidthMeters: clampHalfWidth,
            clampHalfDepthMeters: clampHalfDepth,
            minHeight: surfaceRenderZ + 1.8,
            maxHeight: surfaceRenderZ + 2000,
            localMaxHeight: getDioramaLocalMaxHeight({ surfaceReferenceZ: surfaceRenderZ, sizeMeters, maxZ: surfRenderZ(maxZ) }),
            surfaceHeight: surfaceRenderZ
        };
        applyDioramaTerrainMask(roundedRectLonLat);

        const controller = viewer.scene?.screenSpaceCameraController;
        if (controller) {
            controller.maximumZoomDistance = Math.max(420, sizeMeters * 1.8);
            controller.minimumZoomDistance = 1.0;
        }

        if (viewer.scene?.globe) {
            viewer.scene.globe.translucency.enabled = false;
            viewer.scene.globe.undergroundColor = Color.BLACK.withAlpha(0.0);
        }
    }, [Cartesian3, Color, applyDioramaTerrainMask, clearDioramaBox, resolveProgressivaAnchor, surfRenderZ]);

    const buildLocalRoadPositions = useCallback((anchor) => {
        if (!anchor || !kmlDataSourcesRef.current.length) return [];

        const sampleTime = Cesium.JulianDate.now();
        const anchorPosition = Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.surfaceZ);
        let bestPolylinePositions = null;
        let bestNearestIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;

        kmlDataSourcesRef.current.forEach((ds) => {
            ds?.entities?.values?.forEach((entity) => {
                if (!entity?.polyline?.positions) return;
                let positions = entity.polyline.positions;
                if (typeof positions.getValue === 'function') {
                    positions = positions.getValue(sampleTime);
                }
                if (!Array.isArray(positions) || positions.length < 2) return;

                let nearestIndex = -1;
                let nearestDistance = Number.POSITIVE_INFINITY;
                positions.forEach((position, index) => {
                    const distance = Cartesian3.distance(position, anchorPosition);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = index;
                    }
                });

                if (nearestIndex >= 0 && nearestDistance < bestDistance) {
                    bestDistance = nearestDistance;
                    bestNearestIndex = nearestIndex;
                    bestPolylinePositions = positions;
                }
            });
        });

        if (!bestPolylinePositions || bestNearestIndex < 0) {
            return [];
        }

        const maxSegmentDistance = Math.max(140, dioramaSize * 0.95);
        let startIndex = bestNearestIndex;
        let endIndex = bestNearestIndex;
        let backwardDistance = 0;
        let forwardDistance = 0;

        while (startIndex > 0 && backwardDistance < maxSegmentDistance) {
            backwardDistance += Cartesian3.distance(
                bestPolylinePositions[startIndex],
                bestPolylinePositions[startIndex - 1]
            );
            startIndex -= 1;
        }

        while (endIndex < bestPolylinePositions.length - 1 && forwardDistance < maxSegmentDistance) {
            forwardDistance += Cartesian3.distance(
                bestPolylinePositions[endIndex],
                bestPolylinePositions[endIndex + 1]
            );
            endIndex += 1;
        }

        return bestPolylinePositions.slice(startIndex, endIndex + 1).map((position) => {
            const carto = Cartographic.fromCartesian(position);
            const realZ = Math.max(anchor.surfaceZ - 2.5, carto.height || 0);
            return Cartesian3.fromDegrees(
                Cesium.Math.toDegrees(carto.longitude),
                Cesium.Math.toDegrees(carto.latitude),
                surfRenderZ(realZ) + 1.5
            );
        });
    }, [Cartesian3, Cartographic, dioramaSize, surfRenderZ]);

    const renderLocalOverlay = useCallback((progressiva) => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;

        clearLocalOverlays();

        if (!progressiva) {
            viewer.scene.requestRender();
            return;
        }

        const anchor = dioramaAnchorRef.current || resolveProgressivaAnchor(progressiva);
        if (!anchor) return;

        const overlayEntities = [];
        const localRoadPositions = buildLocalRoadPositions(anchor);
        if (localRoadPositions.length >= 2) {
            const roadEntity = viewer.entities.add({
                id: `local-road-${progressiva.id}`,
                polyline: {
                    positions: localRoadPositions,
                    width: 10,
                    clampToGround: false,
                    material: Color.CYAN.withAlpha(0.95),
                    depthFailMaterial: Color.WHITE.withAlpha(0.98)
                }
            });
            localRoadEntityRef.current = roadEntity;
            overlayEntities.push(roadEntity);
        }

        const markerEntity = viewer.entities.add({
            id: `local-prog-marker-${progressiva.id}`,
            name: `Progresiva activa: ${progressiva.nombre}`,
            position: Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.surfaceZ + 2.0),
            point: {
                pixelSize: 14,
                color: Color.CYAN,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
                text: progressiva.nombre,
                font: '16pt Outfit, sans-serif',
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 3,
                style: LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -18),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
        localMarkerEntityRef.current = markerEntity;
        overlayEntities.push(markerEntity);

        let cumulativeDepth = 0;
        const estratoEntities = [];
        if (progressiva.estratos?.length) {
            progressiva.estratos.forEach((estrato, index) => {
                const thickness = Math.abs(estrato.cota_final - estrato.cota_inicial) || 0.5;
                const centerDepth = cumulativeDepth + (thickness / 2);
                const estratoEntity = viewer.entities.add({
                    id: `local-estrato-${progressiva.id}-${index}`,
                    name: `Estrato activo: ${estrato.nombre || 'Estrato'}`,
                    description: `Profundidad: ${estrato.cota_inicial}m - ${estrato.cota_final}m<br/>${estrato.descripcion || ''}`,
                    position: Cartesian3.fromDegrees(anchor.lon, anchor.lat, depthRenderZ(anchor.surfaceZ, centerDepth)),
                    cylinder: {
                        length: thickness * currentZExag(),
                        topRadius: 2.6,
                        bottomRadius: 2.6,
                        material: Color.fromCssColorString(estrato.nlp_color_hex || '#60a5fa').withAlpha(0.96),
                        outline: true,
                        outlineColor: Color.WHITE.withAlpha(0.92),
                        outlineWidth: 1
                    }
                });
                estratoEntities.push(estratoEntity);
                overlayEntities.push(estratoEntity);
                cumulativeDepth += thickness;
            });
        }
        localEstratosRef.current = estratoEntities;
        localOverlayEntitiesRef.current = overlayEntities;

        viewer.scene.requestRender();
    }, [Cartesian2, Cartesian3, Color, LabelStyle, VerticalOrigin, buildLocalRoadPositions, clearLocalOverlays, resolveProgressivaAnchor, depthRenderZ, currentZExag]);

    const renderModelChunk = useCallback((modelData, progressiva = null) => {
        if (!modelData?.rawVertices?.length || !modelData?.rawIndicesTriangulos?.length) {
            return;
        }

        const rawVertices = modelData.rawVertices;
        let selectedTriangles = modelData.rawIndicesTriangulos;
        const isChunkMode = !!(progressiva?.coordenada_este && progressiva?.coordenada_norte);

        if (isChunkMode) {
            const progressivaCoords = processCoordinates(progressiva.coordenada_este, progressiva.coordenada_norte, projectZone);
            const centerX = parseFloat(progressivaCoords.x);
            const centerY = parseFloat(progressivaCoords.y);
            // Mismas dimensiones que la caja guía del diorama (renderDioramaBox):
            // así el chunk CUBRE el hueco recortado en el terreno (no se ve el vacío del
            // globo por los bordes) y no se derrama fuera de la caja.
            const halfW = Math.max(90, dioramaSize * 0.58);
            const halfD = Math.max(50, dioramaSize * 0.34);

            const withinChunk = (vertex) => (
                Math.abs(vertex.x - centerX) <= halfW &&
                Math.abs(vertex.y - centerY) <= halfD
            );

            const croppedTriangles = [];
            const fallbackTriangles = [];

            for (let i = 0; i < modelData.rawIndicesTriangulos.length; i += 3) {
                const a = modelData.rawIndicesTriangulos[i];
                const b = modelData.rawIndicesTriangulos[i + 1];
                const c = modelData.rawIndicesTriangulos[i + 2];
                const va = rawVertices[a];
                const vb = rawVertices[b];
                const vc = rawVertices[c];
                if (!va || !vb || !vc) continue;

                const centroidX = (va.x + vb.x + vc.x) / 3;
                const centroidY = (va.y + vb.y + vc.y) / 3;
                const centroidInside = (
                    Math.abs(centroidX - centerX) <= halfW &&
                    Math.abs(centroidY - centerY) <= halfD
                );

                if (centroidInside) {
                    croppedTriangles.push(a, b, c);
                } else if (withinChunk(va) || withinChunk(vb) || withinChunk(vc)) {
                    fallbackTriangles.push(a, b, c);
                }
            }

            selectedTriangles = croppedTriangles.length > 0 ? croppedTriangles : fallbackTriangles;
        }

        if (!selectedTriangles.length) {
            if (isChunkMode) {
                currentModelDataRef.current = {
                    ...modelData,
                    activeVertices: [],
                    activeIndicesTriangulos: [],
                    activeVerticesInfo: [],
                    activeElevationData: [],
                    activeMinZ: modelData.rawMinZ,
                    activeMaxZ: modelData.rawMaxZ,
                    activeIndicesBordesFull: []
                };
                clearDioramaBox();
                return;
            }
            selectedTriangles = modelData.rawIndicesTriangulos;
        }

        const usedVertexIndices = new Set(selectedTriangles);
        const remap = new Map();
        const activeVertices = [];

        Array.from(usedVertexIndices).sort((a, b) => a - b).forEach((originalIndex) => {
            const vertex = rawVertices[originalIndex];
            if (!vertex) return;
            remap.set(originalIndex, activeVertices.length);
            activeVertices.push(vertex);
        });

        const remappedTriangles = [];
        for (let i = 0; i < selectedTriangles.length; i += 3) {
            const a = remap.get(selectedTriangles[i]);
            const b = remap.get(selectedTriangles[i + 1]);
            const c = remap.get(selectedTriangles[i + 2]);
            if ([a, b, c].some(v => v === undefined)) continue;
            remappedTriangles.push(a, b, c);
        }

        if (!activeVertices.length || !remappedTriangles.length) {
            return;
        }

        const verticesInfo = activeVertices.map(({ lon, lat, z }) => ({ lon, lat, z }));
        const elevationData = activeVertices.map(v => v.z);
        let minZ = Infinity;
        let maxZ = -Infinity;
        for (let i = 0; i < elevationData.length; i++) {
            const z = elevationData[i];
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
        const indicesBordesFull = buildEdgeIndices(remappedTriangles);
        const indicesBoundary = buildBoundaryIndices(remappedTriangles);

        currentModelDataRef.current = {
            ...modelData,
            activeVertices,
            activeIndicesTriangulos: remappedTriangles,
            activeVerticesInfo: verticesInfo,
            activeElevationData: elevationData,
            activeMinZ: minZ,
            activeMaxZ: maxZ,
            activeIndicesBordesFull: indicesBordesFull,
            activeIndicesBoundary: indicesBoundary
        };

        renderFinalMesh(verticesInfo, elevationData, minZ, maxZ, remappedTriangles, indicesBoundary, indicesBordesFull);

        if (progressiva?.coordenada_este && progressiva?.coordenada_norte) {
            renderDioramaBox(progressiva, dioramaSize, minZ, maxZ);
        } else {
            clearDioramaBox();
            disableDioramaConstraints();
        }
    }, [buildBoundaryIndices, buildEdgeIndices, clearDioramaBox, dioramaSize, disableDioramaConstraints, renderDioramaBox, renderFinalMesh]);

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
                setSoilData(data);
            } else {
                console.error("[Vista3D] Error en respuesta de API Suelos:", res.status);
            }
        } catch (e) {
            console.error("[Vista3D] Error fetching soil data:", e);
        }
    }, [selectedProjectId, user?.token]);

    const focusOnSelectedProgressiva = useCallback(() => {
        const viewer = viewerRef.current;
        const camera = getSceneCamera(viewer);
        const constraint = dioramaConstraintRef.current;
        const anchor = dioramaAnchorRef.current;
        if (!viewer || viewer.isDestroyed() || !camera || !constraint || !anchor) return;

        isDioramaTransitioningRef.current = true;
        try {
            const HeadingPitchRange = Cesium.HeadingPitchRange;
            if (typeof camera.lookAt === 'function' && HeadingPitchRange) {
                // ANCLAJE ORBITAL: la cámara queda referida a la progresiva (como el doble-clic
                // sobre un punto): arrastrar orbita alrededor del ancla, la rueda cambia la
                // distancia, y el pan queda desactivado para que la cámara no escape del diorama.
                const range = Math.max(80, dioramaSize * 0.9);
                camera.lookAt(
                    Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.surfaceZ),
                    new HeadingPitchRange(Cesium.Math.toRadians(22), Cesium.Math.toRadians(-35), range)
                );
                dioramaOrbitLockRef.current = true;

                // La distancia de órbita es el nuevo "límite" de la cámara
                const ctrl = viewer.scene?.screenSpaceCameraController;
                if (ctrl) {
                    ctrl.minimumZoomDistance = 5;
                    ctrl.maximumZoomDistance = Math.max(420, dioramaSize * 1.8);
                    ctrl.enableTranslate = false; // el pan rompería el anclaje
                    ctrl.enableLook = false;      // el tilt libre rompería la órbita
                }
            } else {
                // Fallback para Cesium sin lookAt: encuadre clásico
                resetCameraTransform(camera);
                camera.setView({
                    destination: Cartesian3.fromDegrees(
                        anchor.lon,
                        anchor.lat,
                        Math.max(anchor.surfaceZ + Math.max(80, dioramaSize * 0.3), constraint.minHeight + 20)
                    ),
                    orientation: {
                        heading: Cesium.Math.toRadians(22),
                        pitch: Cesium.Math.toRadians(-35),
                        roll: 0
                    }
                });
            }
        } finally {
            window.setTimeout(() => {
                isDioramaTransitioningRef.current = false;
            }, 0);
        }
    }, [Cartesian3, dioramaSize, getSceneCamera, resetCameraTransform]);

    const flyToProgressive = useCallback(async (p) => {
        if (!viewerRef.current) return;
        const viewer = viewerRef.current;
        selectedProgressivaRef.current = p;
        pendingDioramaFocusRef.current = p.id;
        setSelectedProgressiva3D(p);
        const hasRawMesh = !!currentModelDataRef.current?.rawVertices?.length;
        if (hasRawMesh) {
            renderModelChunk(currentModelDataRef.current, p);
        }
        const initialAnchor = resolveProgressivaAnchor(p);
        if (!initialAnchor) return;
        let { lon, lat } = initialAnchor;

        let surfaceZ = initialAnchor.surfaceZ;
        if (!Number.isFinite(surfaceZ) || surfaceZ === 0) {
            try {
                const tProvider = viewer.scene.terrainProvider || viewer.terrainProvider;
                const sampled = await chunkedSampleTerrain(Cesium, tProvider, [Cartographic.fromDegrees(lon, lat)], 1);
                surfaceZ = sampled?.[0]?.height;
            } catch (e) { }
        }

        if (!Number.isFinite(surfaceZ)) {
            surfaceZ = currentModelDataRef.current?.activeMaxZ
                || currentModelDataRef.current?.rawMaxZ
                || 500;
        }

        // El ancla se guarda en COTA DE RENDER (exagerada) para que cámara y overlays coincidan.
        dioramaAnchorRef.current = { lon, lat, surfaceZ: surfRenderZ(surfaceZ) };

        // SIN MALLA CARGADA (p. ej. OBJ no disponible/caído): el diorama local funciona igual.
        // Se construye la caja guía y el overlay (carretera + marcador + estratos) en la
        // progresiva y se vuela hasta ella. Antes esto dependía del efecto de la malla y
        // sin modelo la selección quedaba en una escena vacía y sin vuelo.
        if (!hasRawMesh) {
            renderDioramaBox(p, dioramaSize, null, null);
            renderLocalOverlay(p);
            pendingDioramaFocusRef.current = null;
            setCameraMode('diorama');
            focusOnSelectedProgressiva();
        }
    }, [Cartographic, renderModelChunk, resolveProgressivaAnchor, surfRenderZ, renderDioramaBox, renderLocalOverlay, focusOnSelectedProgressiva, dioramaSize]);

    // ── MURO GEOLÓGICO CONTINUO: construir / destruir con invalidación ───────
    // La construcción es asíncrona (Primitives), por lo que un cambio de zExag/zBase a mitad de
    // camino invalida la construcción previa por generación para no dejar primitivos huérfanos.
    const buildGeologyWall = useCallback((viewer) => {
        if (!viewer || viewer.isDestroyed() || !(soilData?.progresivas?.length >= 2)) return;

        const buildParams = `${currentZExag()}|${zBaseRef.current}|${projectZone}`;
        if (wallBuildParamsRef.current === buildParams) return; // ya en construcción con estos parámetros
        wallBuildParamsRef.current = buildParams;

        const gen = ++wallBuildGenRef.current;
        FullTramoEngine.renderWallStrata(viewer, soilData.progresivas, {
            toLon: (e, n) => utmToWgs84(e, n, projectZone),
            zExag: currentZExag(),
            zBase: zBaseRef.current
        }).then((prim) => {
            // Descartar si mientras tanto se pidió otra versión (zExag/zBase cambió o se destruyó)
            if (gen === wallBuildGenRef.current && prim && !viewer.isDestroyed()) {
                fullTramoWallPrimitiveRef.current = prim;
            }
        }).catch((err) => {
            console.warn('[Vista3D] Advertencia renderizando muro geológico continuo:', err);
            if (gen === wallBuildGenRef.current) wallBuildParamsRef.current = null;
        });
    }, [soilData, projectZone, currentZExag]);

    const destroyGeologyWall = useCallback((viewer) => {
        wallBuildGenRef.current += 1; // invalida cualquier construcción en vuelo
        wallBuildParamsRef.current = null;
        if (!viewer || viewer.isDestroyed()) return;
        if (fullTramoWallPrimitiveRef.current) {
            try { viewer.scene.primitives.remove(fullTramoWallPrimitiveRef.current); } catch (e) { }
            fullTramoWallPrimitiveRef.current = null;
        }
    }, []);

    // --- EFECTO: RENDERIZADO DE SUELOS Y TRAZADOS (INTELIGENTE: Auto-Zona y Elevación Real) ---
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!isViewerStable(viewer) || !soilData || !isViewerReady) {
            return;
        }
        progressivaAnchorsRef.current = new Map();

        // 1. Limpiar previos
        clearLocalOverlays();
        kmlDataSourcesRef.current.forEach(ds => viewer.dataSources.remove(ds));
        kmlDataSourcesRef.current = [];
        soilEntitiesRef.current.forEach(ent => viewer.entities.remove(ent));
        soilEntitiesRef.current = [];

        // 2. Renderizar Tracks y Detectar Zona
        const loadTracks = async () => {
            if (!isViewerStable(viewer)) return;

            if (!soilData.tracks || soilData.tracks.length === 0) {
                return;
            }

            let zoneDetected = false;
            for (const track of (soilData.tracks || [])) {
                try {
                    if (!isViewerStable(viewer)) return;
                    if (!track.kml_content) {
                        console.error(`[Vista3D] ❌ El track ${track.nombre} no tiene contenido KML.`);
                        continue;
                    }
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
                        camera: getSceneCamera(viewer),
                        canvas: viewer.canvas,
                        clampToGround: true
                    });
                    if (!isViewerStable(viewer)) return;

                    const entities = ds.entities.values;

                    // DETECCIÓN AUTOMÁTICA DE ZONA UTM DESDE EL KML
                    if (!zoneDetected && entities.length > 0) {
                        const firstEnt = entities.find(e => e.position);
                        if (firstEnt) {
                            const pos = firstEnt.position.getValue(Cesium.JulianDate.now());
                            if (pos) {
                                const carto = Cartographic.fromCartesian(pos);
                                const lonDeg = Cesium.Math.toDegrees(carto.longitude);
                                const zone = getUtmZoneFromLon(lonDeg);

                                setProjectZone(zone);
                                zoneDetected = true;
                            }
                        }
                    }

                    entities.forEach(entity => {
                        if (entity.polyline) {
                            // Con clampToGround el trazado se dibuja pegado al relieve y queda
                            // correctamente OCULTO tras las montañas (sin depthFailMaterial,
                            // que lo hacía visible a través del terreno).
                            entity.polyline.material = Color.DODGERBLUE.withAlpha(0.9);
                            entity.polyline.width = 8.0;
                            entity.polyline.clampToGround = true;
                            entity.polyline.arcType = Cesium.ArcType.GEODESIC;
                            entity.polyline.zIndex = 20;
                            entity.polyline.show = true;
                        }
                    });

                    viewer.dataSources.add(ds);
                    kmlDataSourcesRef.current.push(ds);

                } catch (e) {
                    console.error(`[Vista3D] ❌ Error crítico cargando track ${track.nombre}:`, e);
                }
            }
        };

        // 3. RENDERIZADO DE ESTRATOS (Cilindros)
        const renderHoles = async () => {
            if (!isViewerStable(viewer)) return;
            const calicatasConCoords = (soilData.progresivas || []).filter(p => p.coordenada_este && p.coordenada_norte && p.estratos && p.estratos.length > 0);
            if (calicatasConCoords.length === 0) return;

            // Muestreamos terreno solo para las que NO tienen elevación en DB
            const cartographicsToSample = calicatasConCoords
                .filter(p => !p.elevacion)
                .map(p => {
                    const wgs = utmToWgs84(p.coordenada_este, p.coordenada_norte, projectZone);
                    return wgs ? Cartographic.fromDegrees(wgs.lon, wgs.lat) : null;
                })
                .filter(Boolean);

            let sampledMap = {};
            if (cartographicsToSample.length > 0) {
                if (!isViewerStable(viewer)) return;
                const scene = viewer.scene;
                if (!scene) return;
                const tProvider = scene.terrainProvider || viewer.terrainProvider;

                // ── Esperar a que el terreno esté listo antes de muestrear ──────
                await waitForTerrainReady(tProvider);

                try {
                    // 1) Usar primero la caché (evita re-muestrear al re-renderizar por zExag)
                    const pendientes = [];
                    cartographicsToSample.forEach((c) => {
                        const key = `${c.longitude}_${c.latitude}`;
                        if (sampledTerrainCacheRef.current.has(key)) {
                            sampledMap[key] = sampledTerrainCacheRef.current.get(key);
                        } else {
                            pendientes.push(c);
                        }
                    });

                    // 2) Muestrear solo las faltantes y guardarlas en caché (cotas reales MSL)
                    if (pendientes.length > 0) {
                        const sampled = await chunkedSampleTerrain(Cesium, tProvider, pendientes);
                        pendientes.forEach((c, idx) => {
                            const key = `${c.longitude}_${c.latitude}`;
                            const h = sampled[idx]?.height || 0;
                            sampledTerrainCacheRef.current.set(key, h);
                            sampledMap[key] = h;
                        });
                    }
                } catch (sampleErr) {
                    console.error('[Vista3D] Error en muestreo de terreno:', sampleErr);
                }
            }

            try {
                if (!isViewerStable(viewer)) return;
                const conSuperficie = []; // calicatas enriquecidas con su cota de superficie (real, MSL)
                calicatasConCoords.forEach((p) => {
                    if (!isViewerStable(viewer)) return;
                    // Coordenadas inválidas → utmToWgs84 devuelve null: se omite esta calicata
                    // (antes el destructuring de null abortaba TODO el render de calicatas).
                    const wgs = utmToWgs84(p.coordenada_este, p.coordenada_norte, projectZone);
                    if (!wgs) return;
                    const { lon, lat } = wgs;

                    // PRIORIDAD DE ELEVACIÓN: 1. DB (Topografía Real) | 2. Terreno Cesium (cotas reales MSL)
                    let surfaceZ = 0;
                    if (p.elevacion && parseFloat(p.elevacion) !== 0) {
                        surfaceZ = parseFloat(p.elevacion);
                    } else {
                        const key = `${Cesium.Math.toRadians(lon)}_${Cesium.Math.toRadians(lat)}`;
                        surfaceZ = sampledMap[key] || 0;
                    }

                    // Cota de RENDER (exagerada) coherente con la malla y el globo.
                    const surfaceRenderZ = surfRenderZ(surfaceZ);
                    const f = currentZExag();
                    progressivaAnchorsRef.current.set(p.id, { lon, lat, surfaceZ, surfaceRenderZ });
                    // El lote de cilindros lee p.elevacion: se inyecta la superficie resuelta
                    // (DB o muestreo de terreno) para que el batch quede a la misma cota.
                    conSuperficie.push({ ...p, elevacion: surfaceZ });

                    // --- NUEVO: MARCADOR Y ETIQUETA PREMIUM (Estilo Maqueta) ---
                    const markerId = `prog-marker-${p.id}`;
                    if (!viewer.entities.getById(markerId)) {
                        const markerEntity = viewer.entities.add({
                            id: markerId,
                            name: `Progresiva: ${p.nombre}`,
                            // Depth test ACTIVO: la progresiva queda oculta tras las montañas
                            // (disableDepthTestDistance=Infinity las dibujaba a través del terreno).
                            // +2.5 m sobre el relieve para que no se entierre en laderas.
                            position: Cartesian3.fromDegrees(lon, lat, surfaceRenderZ + 2.5),
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

                    if (!p.estratos || p.estratos.length === 0) {
                        const noEstratoId = `calicata-empty-${p.id}`;
                        if (!viewer.entities.getById(noEstratoId)) {
                            const entity = viewer.entities.add({
                                id: noEstratoId,
                                name: `Calicata: ${p.nombre} (Sin estratos)`,
                                position: Cartesian3.fromDegrees(lon, lat, depthRenderZ(surfaceRenderZ, 7.0)), // Centro del cilindro a -7 m (exagerado)
                                cylinder: {
                                    length: 14.0 * f, topRadius: 1.2, bottomRadius: 1.2,
                                    material: Color.GRAY.withAlpha(0.6),
                                    outline: true
                                }
                            });
                            soilEntitiesRef.current.push(entity);
                        }
                    } else {
                        // Los cilindros de estratos se dibujan en LOTE (BoreholeBatchEngine)
                        // después del bucle: una sola primitiva para todas las calicatas.
                    }
                });

                // ── ESTRATOS POR LOTE: 1 primitiva para N calicatas (60 FPS) ──────
                if (isViewerStable(viewer) && conSuperficie.length > 0) {
                    if (batchBoreholePrimitiveRef.current) {
                        try { viewer.scene.primitives.remove(batchBoreholePrimitiveRef.current); } catch (e) { }
                        batchBoreholePrimitiveRef.current = null;
                    }
                    batchInputRef.current = conSuperficie;
                    batchBuildParamsRef.current = `${currentZExag()}|${zBaseRef.current}|${projectZone}`;
                    batchBoreholePrimitiveRef.current = BoreholeBatchEngine.renderBoreholeBatch(viewer, conSuperficie, {
                        toLon: (e, n) => utmToWgs84(e, n, projectZone),
                        zExag: currentZExag(),
                        zBase: zBaseRef.current,
                        radius: 1.5
                    });
                }
                if (isViewerStable(viewer)) {
                    viewer.scene.requestRender();
                }
            } catch (e) {
                console.error("[Vista3D] Error en renderizado 3D de calicatas:", e);
            }
        };

        const initialize3D = async () => {
            await loadTracks();
            await renderHoles();
            if (selectedProgressivaRef.current) {
                renderLocalOverlay(selectedProgressivaRef.current);
                return;
            }
            if (!hasInitialAutoCenterRef.current) {
                window.setTimeout(() => {
                    if (hasInitialAutoCenterRef.current || selectedProgressivaRef.current || pendingDioramaFocusRef.current) return;
                    hasInitialAutoCenterRef.current = flyToGlobalContext();
                }, 0);
            }
        };

        initialize3D();
    }, [clearLocalOverlays, flyToGlobalContext, getSceneCamera, isViewerStable, renderLocalOverlay, soilData, isViewerReady, projectZone, surfRenderZ, depthRenderZ, currentZExag]);

    const fetchAllData = useCallback(async () => {
        setIsGlobalLoading(true);
        await Promise.all([fetchModelos(), fetchSoilData()]);
        setIsGlobalLoading(false);
    }, [fetchModelos, fetchSoilData]);

    useEffect(() => {
        selectedProgressivaRef.current = selectedProgressiva3D;
    }, [selectedProgressiva3D]);

    useEffect(() => {
        hasInitialAutoCenterRef.current = false;
    }, [selectedProjectId, selectedModelo?.id]);

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
        let isCancelled = false;
        isMounted.current = true;

        let activeEngine = null;
        let activeViewer = null;

        const initializeViewer = async () => {
            try {
                if (!containerRef.current || isCancelled) return;

                // Limpieza defensiva del contenedor DOM para evitar advertencias de WebGL/nodos huérfanos
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                }

                // Inicialización vía MapEngineFactory (CesiumEngine con fallback robusto)
                const engine = await MapEngineFactory.createEngine(containerRef.current, {
                    mapboxToken: process.env.REACT_APP_MAPBOX_TOKEN,
                    ionToken: ION_TOKEN
                });

                if (isCancelled) {
                    if (engine && typeof engine.destroy === 'function') {
                        try { engine.destroy(); } catch (e) { }
                    }
                    return;
                }

                if (engine) {
                    activeEngine = engine;
                    engineRef.current = engine;
                }

                if (engine && engine.viewer) {
                    activeViewer = engine.viewer;
                    viewerRef.current = activeViewer;

                    if (Ion && ION_TOKEN) { Ion.defaultAccessToken = ION_TOKEN; }

                    // Optimizaciones de Escena para Cesium
                    if (activeViewer.scene && activeViewer.scene.globe) {
                        // enableLighting apagado: con iluminación solar real el hemisferio nocturno
                        // se pinta negro y parece que "el planeta desapareció" (y su disco oscuro
                        // tapa el sol). El globo se muestra siempre iluminado.
                        activeViewer.scene.globe.enableLighting = false;
                        activeViewer.scene.globe.depthTestAgainstTerrain = true;
                        activeViewer.scene.highDynamicRange = false;
                        if (activeViewer.scene.postProcessStages && activeViewer.scene.postProcessStages.fxaa) {
                            activeViewer.scene.postProcessStages.fxaa.enabled = true;
                        }
                    }

                    // Configuración de Capas de Mapa Base
                    const imageryLayers = activeViewer.imageryLayers;
                    if (imageryLayers) {
                        imageryLayers.removeAll();
                        try {
                            imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
                                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                                // Nivel 17: evita los mosaicos "Map data not yet available" de Esri
                                // en zonas rurales donde no hay imágenes a niveles 18-19.
                                maximumLevel: 17,
                                credit: 'Esri World Imagery'
                            }));
                        } catch (e) {
                            try {
                                imageryLayers.addImageryProvider(new ArcGisMapServerImageryProvider({
                                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                                    enablePickFeatures: false
                                }));
                            } catch (err) { }
                        }

                        // Capa Focal (Para el área del modelo LandXML)
                        try {
                            const focusLayer = imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
                                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                                maximumLevel: 17
                            }));
                            focusLayer.alpha = 0.0;
                            focusImageryLayerRef.current = focusLayer;
                        } catch (e) { }
                    }

                    const controller = activeViewer.scene && activeViewer.scene.screenSpaceCameraController;
                    if (controller) {
                        // --- CONFIGURACIÓN GLOBAL DE MOVILIDAD MEJORADA ---
                        controller.inertiaSpin = 0.06;          // Rotación muy directa
                        controller.inertiaTranslate = 0.06;     // Pan directo sin "resbalar"
                        controller.inertiaZoom = 0.06;          // Zoom que para donde quieres
                        controller.enableLook = true;
                        controller.enableTilt = true;
                        controller.enableTranslate = true;
                        controller.enableRotate = true;
                        controller.enableZoom = true;
                        if ('zoomFactor' in controller) {
                            controller.zoomFactor = 10.0;
                        }
                        // Colisión con el terreno: la cámara NO atraviesa la tierra al bajar.
                        // (Antes estaba en false y la cámara se hundía bajo el relieve.)
                        controller.enableCollisionDetection = true;
                    }

                    if (activeViewer.scene && activeViewer.scene.preRender) {
                        activeViewer.scene.preRender.addEventListener(enforceDioramaCameraBounds);
                    }

                    // Listener interactivo para inspección de calicatas y perfiles geológicos
                    if (engine && typeof engine.onPick === 'function') {
                        engine.onPick((picked, screenPosition) => {
                            if (picked && picked.id) {
                                if (typeof picked.id === 'object' && picked.id.type === 'BOREHOLE_STRATUM') {
                                    setSelectedEstratoTooltip(picked.id);
                                    setTooltipPosition({ x: screenPosition.x, y: screenPosition.y });
                                } else if (typeof picked.id === 'object' && picked.id.type === 'GEOLOGY_WALL') {
                                    setSelectedEstratoTooltip({
                                        nombre_progresiva: `${picked.id.progresiva1} ➔ ${picked.id.progresiva2}`,
                                        numero_estrato: 'Perfil Continuo',
                                        profundidad_inicial: picked.id.estrato?.profundidad_inicial ?? '0.00',
                                        profundidad_final: picked.id.estrato?.profundidad_final ?? '1.00',
                                        clasificacion_sucs: picked.id.estrato?.clasificacion_sucs || 'SUCS',
                                        descripcion: picked.id.estrato?.descripcion || 'Muro geológico continuo del tramo vial.',
                                        nlp_color_hex: picked.id.estrato?.nlp_color_hex || '#3b82f6'
                                    });
                                    setTooltipPosition({ x: screenPosition.x, y: screenPosition.y });
                                } else if (typeof picked.id === 'object' && picked.id.name) {
                                    setSelectedEstratoTooltip({
                                        nombre_progresiva: picked.id.name,
                                        numero_estrato: 'Sondaje',
                                        profundidad_inicial: '0.00',
                                        profundidad_final: 'S/D',
                                        clasificacion_sucs: 'N/A',
                                        descripcion: typeof picked.id.description?.getValue === 'function' ? picked.id.description.getValue() : '',
                                        nlp_color_hex: '#10b981'
                                    });
                                    setTooltipPosition({ x: screenPosition.x, y: screenPosition.y });
                                }
                            } else {
                                setSelectedEstratoTooltip(null);
                            }
                        });
                    }
                }

                if (!isCancelled && isMounted.current) {
                    setIsViewerReady(true); // DISPARAR RENDERIZADO DE DATOS (Calicatas, Estratos, LandXML)
                } else {
                    if (activeViewer && typeof activeViewer.destroy === 'function') activeViewer.destroy();
                    if (activeEngine && typeof activeEngine.destroy === 'function') activeEngine.destroy();
                }

            } catch (e) {
                console.error("Error crítico inicializando el motor 3D:", e);
                if (activeViewer && typeof activeViewer.isDestroyed === 'function' && !activeViewer.isDestroyed()) {
                    activeViewer.destroy();
                }
            }
        };

        initializeViewer();

        return () => {
            isCancelled = true;
            isMounted.current = false;
            setIsViewerReady(false);
            disableDioramaConstraints();

            if (fullTramoWallPrimitiveRef.current && activeViewer && !activeViewer.isDestroyed()) {
                try {
                    activeViewer.scene.primitives.remove(fullTramoWallPrimitiveRef.current);
                } catch (e) { }
                fullTramoWallPrimitiveRef.current = null;
            }

            if (batchBoreholePrimitiveRef.current && activeViewer && !activeViewer.isDestroyed()) {
                try {
                    activeViewer.scene.primitives.remove(batchBoreholePrimitiveRef.current);
                } catch (e) { }
                batchBoreholePrimitiveRef.current = null;
            }

            if (activeViewer && typeof activeViewer.isDestroyed === 'function' && !activeViewer.isDestroyed()) {
                try {
                    if (activeViewer.scene && activeViewer.scene.preRender) {
                        activeViewer.scene.preRender.removeEventListener(enforceDioramaCameraBounds);
                    }
                } catch (e) { }
            }

            if (activeEngine && typeof activeEngine.destroy === 'function') {
                try { activeEngine.destroy(); } catch (e) { }
            } else if (engineRef.current && typeof engineRef.current.destroy === 'function') {
                try { engineRef.current.destroy(); } catch (e) { }
            }

            engineRef.current = null;
            viewerRef.current = null;
        };
    }, []); // ⭐ El viewer se monta ONCE de forma atómica y cancelable en React 18

    // Sincronización en tiempo real de la opacidad de la capa satelital
    useEffect(() => {
        if (engineRef.current && typeof engineRef.current.setImageryOpacity === 'function') {
            engineRef.current.setImageryOpacity(mapOpacity);
        } else if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            const layers = viewerRef.current.imageryLayers;
            if (layers) {
                for (let i = 0; i < layers.length; i++) {
                    const layer = layers.get(i);
                    if (layer && layer !== focusImageryLayerRef.current) {
                        layer.alpha = mapOpacity;
                    }
                }
                viewerRef.current.scene?.requestRender();
            }
        }
    }, [mapOpacity]);


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
        if (!selectedModelo || !viewerRef.current) {
            return;
        }
        const viewer = viewerRef.current;

        // CASO ESPECIAL: Si es un Tramo Maestro (Streaming), no hay malla fija que procesar
        if (selectedModelo.url_archivo === 'STREAMING_LOCAL_SIN_MALLA') {
            currentModelDataRef.current = null;
            setModelMeshVersion(0);
            setCameraMode('orbit');
            disableDioramaConstraints();
            clearDioramaBox();
            clearLocalOverlays();
            if (selectedModelo.metadata && selectedModelo.metadata.centro_utm) {
                const { x, y } = selectedModelo.metadata.centro_utm;
                const wgs = utmToWgs84(x, y, projectZone);
                const sceneCamera = getSceneCamera(viewer);
                if (!sceneCamera || !wgs) {
                    setIsGlobalLoading(false);
                    return;
                }
                sceneCamera.flyTo({
                    destination: Cartesian3.fromDegrees(wgs.lon, wgs.lat, 1200), // Vista más amplia para tramos
                    duration: 1.5
                });
            }
            setIsGlobalLoading(false);
            return;
        }

        // CASO NORMAL: Procesamiento de malla OBJ
        (async () => {
            try {
                currentModelDataRef.current = null;
                setModelMeshVersion(0);
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

                // ── PARSEO VÍA WEB WORKER (sin freeze) ───────────────────────
                // loadModel descarga el OBJ y lo parsea en un Worker separado.
                // onProgress actualiza uploadProgress para que la barra de carga
                // sea real en lugar de indeterminada.
                const parsedModelData = await loadModel(
                    selectedModelo,
                    projectZone,
                    (percent) => setUploadProgress(percent)
                );

                const { rawVertices, rawMinZ, rawMaxZ } = parsedModelData;

                // Calcular centro para el vuelo inicial
                let sumLon = 0, sumLat = 0;
                rawVertices.forEach(v => { sumLon += v.lon; sumLat += v.lat; });

                const getLatestSelection = () => selectedProgressivaRef.current;
                currentModelDataRef.current = parsedModelData;
                setModelMeshVersion(prev => prev + 1);
                renderModelChunk(parsedModelData, getLatestSelection());

                const activeMesh = currentModelDataRef.current;
                const activeMinZ = activeMesh?.activeMinZ ?? rawMinZ;
                const activeMaxZ = activeMesh?.activeMaxZ ?? rawMaxZ;
                const activeVerticesInfo = activeMesh?.activeVerticesInfo || rawVertices.map(({ lon, lat, z }) => ({ lon, lat, z }));
                const midZ = activeMinZ + (activeMaxZ - activeMinZ) / 2.0;

                setIsGlobalLoading(false);

                if (activeVerticesInfo.length > 0) {
                    const latestSelection = getLatestSelection();
                    const selectedProgressivaCoords = latestSelection
                        ? processCoordinates(latestSelection.coordenada_este, latestSelection.coordenada_norte, projectZone)
                        : null;
                    const selectedWgs = latestSelection
                        ? utmToWgs84(selectedProgressivaCoords.x, selectedProgressivaCoords.y, projectZone)
                        : null;
                    // Si la progresiva seleccionada no tiene coordenadas válidas, se cae al centroide de la malla
                    const centerLon = selectedWgs ? selectedWgs.lon : sumLon / rawVertices.length;
                    const centerLat = selectedWgs ? selectedWgs.lat : sumLat / rawVertices.length;
                    const sceneCamera = getSceneCamera(viewer);
                    if (!sceneCamera) return;

                    if (latestSelection) {
                        renderModelChunk(parsedModelData, latestSelection);
                        renderLocalOverlay(latestSelection);
                        window.setTimeout(() => {
                            if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
                            setCameraMode('diorama');
                            focusOnSelectedProgressiva();
                        }, 0);
                    } else {
                        window.setTimeout(() => {
                            if (selectedProgressivaRef.current || pendingDioramaFocusRef.current) return;
                            const centered = flyToGlobalContext();
                            hasInitialAutoCenterRef.current = centered;
                            if (centered) return;
                            sceneCamera.flyTo({
                                destination: Cartesian3.fromDegrees(centerLon, centerLat, midZ + 800),
                                duration: 2.0
                            });
                        }, 0);
                    }
                }
            } catch (e) {
                // Ignorar errores de abort (usuario cambió de modelo durante la carga)
                if (e.name !== 'AbortError') {
                    console.error('[Vista3D] Error crítico cargando modelo:', e);
                }
                setIsGlobalLoading(false);
            }
        })();

        // Cancelar carga si el componente desmonta o el modelo cambia
        return () => cancelLoad();
    }, [Cartesian3, cancelLoad, clearDioramaBox, clearLocalOverlays, disableDioramaConstraints, flyToGlobalContext, focusOnSelectedProgressiva, getSceneCamera, loadModel, projectZone, renderLocalOverlay, renderModelChunk, selectedModelo]);


    useEffect(() => {
        if (!viewerRef.current || !selectedModelo || modelMeshVersion === 0 || !currentModelDataRef.current?.rawVertices?.length) {
            return;
        }

        if (selectedModelo.url_archivo === 'STREAMING_LOCAL_SIN_MALLA') {
            clearDioramaBox();
            clearLocalOverlays();
            return;
        }

        renderModelChunk(currentModelDataRef.current, selectedProgressiva3D);
    }, [clearDioramaBox, clearLocalOverlays, dioramaSize, modelMeshVersion, renderModelChunk, selectedModelo, selectedProgressiva3D]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;

        // Salida del modo local: restaurar planeta/recortes y limpiar overlay y caja guía
        // (con o sin malla cargada).
        if (!selectedProgressiva3D) {
            pendingDioramaFocusRef.current = null;
            disableDioramaConstraints();
            clearDioramaBox();
            clearLocalOverlays();
            return;
        }

        // Con malla cargada el enfoque lo completa la cadena renderModelChunk → caja → cámara.
        if (!selectedModelo || modelMeshVersion === 0 || !currentModelDataRef.current?.rawVertices?.length) {
            // Sin malla: flyToProgressive ya construyó caja+overlay y voló directamente.
            return;
        }

        renderLocalOverlay(selectedProgressiva3D);

        if (!dioramaConstraintRef.current || !dioramaAnchorRef.current) {
            return;
        }

        pendingDioramaFocusRef.current = null;
        setCameraMode('diorama');
        focusOnSelectedProgressiva();
    }, [clearDioramaBox, clearLocalOverlays, focusOnSelectedProgressiva, modelMeshVersion, renderLocalOverlay, selectedModelo, selectedProgressiva3D]);

    useEffect(() => {
        const isLocalMode = selectedProgressiva3D?.id != null;
        const showGlobalEstratos = showEstratosLayer && mapOpacity < 0.1;

        soilEntitiesRef.current.forEach((entity) => {
            if (!entity) return;
            const entityId = entity.id;

            if (typeof entityId === 'string' && entityId.startsWith('prog-marker-')) {
                entity.show = !isLocalMode;
                return;
            }

            if (typeof entityId === 'string' && (entityId.startsWith('estrato-') || entityId.startsWith('calicata-empty-'))) {
                entity.show = isLocalMode
                    ? false
                    : showGlobalEstratos;
            }
        });

        // Visibilidad de estratos batch (+ reconstrucción si cambió zExag/zBase/zona:
        // el lote hornea cotas exageradas, igual que el muro)
        if (batchBoreholePrimitiveRef.current) {
            const buildParams = `${currentZExag()}|${zBaseRef.current}|${projectZone}`;
            if (batchBuildParamsRef.current !== buildParams) {
                if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                    try { viewerRef.current.scene.primitives.remove(batchBoreholePrimitiveRef.current); } catch (e) { }
                }
                batchBoreholePrimitiveRef.current = null;
            } else {
                batchBoreholePrimitiveRef.current.show = isLocalMode ? false : showGlobalEstratos;
            }
        }
        if (!isLocalMode && showGlobalEstratos && !batchBoreholePrimitiveRef.current
            && batchInputRef.current?.length && viewerRef.current && !viewerRef.current.isDestroyed()) {
            batchBuildParamsRef.current = `${currentZExag()}|${zBaseRef.current}|${projectZone}`;
            batchBoreholePrimitiveRef.current = BoreholeBatchEngine.renderBoreholeBatch(viewerRef.current, batchInputRef.current, {
                toLon: (e, n) => utmToWgs84(e, n, projectZone),
                zExag: currentZExag(),
                zBase: zBaseRef.current,
                radius: 1.5
            });
        }

        // Gestión del Muro Geológico Continuo (FullTramoEngine) — la exageración la fija buildGeologyWall
        const viewer = viewerRef.current;
        if (viewer && !viewer.isDestroyed() && soilData?.progresivas?.length >= 2) {
            if (showGlobalEstratos && !isLocalMode) {
                if (!fullTramoWallPrimitiveRef.current) {
                    buildGeologyWall(viewer);
                } else {
                    fullTramoWallPrimitiveRef.current.show = true;
                }
            } else if (fullTramoWallPrimitiveRef.current) {
                fullTramoWallPrimitiveRef.current.show = false;
            }
        }

        kmlDataSourcesRef.current.forEach((ds) => {
            if (!ds?.entities?.values) return;
            ds.show = !isLocalMode;
            ds.entities.values.forEach((entity) => {
                if (!entity.polyline) return;
                entity.polyline.show = !isLocalMode;
                entity.polyline.width = isLocalMode ? 12.0 : 8.0;
                entity.polyline.material = isLocalMode
                    ? Color.CYAN.withAlpha(0.98)
                    : Color.DODGERBLUE.withAlpha(0.9);
                // El trazado solo atraviesa el terreno DENTRO del diorama local (guía intencional);
                // en la vista global queda oculto tras las montañas.
                entity.polyline.depthFailMaterial = isLocalMode ? Color.CYAN.withAlpha(0.95) : undefined;
                entity.polyline.clampToGround = true;
                entity.polyline.zIndex = isLocalMode ? 40 : 20;
            });
        });

        if (viewer && !viewer.isDestroyed()) {
            viewer.scene.requestRender();
        }
    }, [mapOpacity, projectZone, selectedProgressiva3D, showEstratosLayer, soilData, buildGeologyWall, currentZExag, zExag]);

    // ── EXAGERACIÓN GLOBAL COHERENTE (globo + muro) ──────────────────────────
    // El globo exagera alrededor de zBase (relativeHeight), la MISMA fórmula de la malla:
    // superficie del terreno en render = zBase + (zReal - zBase) * zExag.
    // El muro hornea cotas exageradas en su geometría, por eso se reconstruye aquí.
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed() || !viewer.scene) return;

        if ('verticalExaggeration' in viewer.scene) {
            viewer.scene.verticalExaggeration = zExag;
        }
        if ('verticalExaggerationRelativeHeight' in viewer.scene) {
            viewer.scene.verticalExaggerationRelativeHeight = zBase;
        }

        destroyGeologyWall(viewer);
        const showGlobalEstratos = showEstratosLayer && mapOpacity < 0.1;
        if (showGlobalEstratos && !selectedProgressiva3D) {
            buildGeologyWall(viewer);
        }
        viewer.scene.requestRender();
    }, [zExag, zBase, buildGeologyWall, destroyGeologyWall]);

    // ── DIORAMA DEL TRAMO: aplicar/quitar el recorte según datos y toggle ────
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!isViewerStable(viewer) || !isViewerReady) return;
        if (selectedProgressiva3D) return; // el diorama local gestiona su propia máscara
        if (corridorClip) {
            applyCorridorClipToGlobe(viewer);
        } else if (!dioramaMaskPolygonRef.current) {
            viewer.scene.globe.clippingPolygons = undefined;
        }
        viewer.scene.requestRender();
    }, [corridorClip, soilData, modelMeshVersion, isViewerReady, selectedProgressiva3D, applyCorridorClipToGlobe, isViewerStable]);

    useEffect(() => {
        applyCameraMode(cameraMode);
    }, [applyCameraMode, cameraMode]);

    useEffect(() => {
        if (!selectedProgressiva3D && cameraMode !== 'orbit') {
            setCameraMode('orbit');
        }
    }, [cameraMode, selectedProgressiva3D]);

    const centerMap = useCallback(() => {
        flyToGlobalContext();
    }, [flyToGlobalContext]);

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
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${isLeftOpen
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
                            className={`w-8 h-8 flex items-center justify-center transition-all rounded-md border ${isRightOpen
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

                {/* A. SIDEBAR IZQUIERDO (componente extraído) */}
                <Progressivas3DSelector
                    isOpen={isLeftOpen}
                    modelos={modelos}
                    selectedModelo={selectedModelo}
                    setSelectedModelo={setSelectedModelo}
                    handleDeleteModel={handleDelete}
                    handleFileChange={handleFileChange}
                />

                {/* B. ÁREA CENTRAL (MAPA) */}
                <div className="flex-1 relative bg-black overflow-hidden h-full">
                    <div ref={containerRef} className="w-full h-full" />

                    {/* Tooltip interactivo 3D para estratos */}
                    <BoreholeDetailTooltip
                        selectedEstrato={selectedEstratoTooltip}
                        position={tooltipPosition}
                        onClose={() => setSelectedEstratoTooltip(null)}
                    />

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
                        className={`absolute bottom-6 transition-all duration-300 w-12 h-12 rounded-xl flex items-center justify-center shadow-xl border z-30 ${isRightOpen ? 'right-[344px]' : 'right-6'} ${mapStyle === 'hipso'
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

                {/* C. PANEL DERECHO (componente extraído) */}
                <LayersControlPanel
                    isOpen={isRightOpen}
                    mapOpacity={mapOpacity}
                    setMapOpacity={setMapOpacity}
                    zExag={zExag}
                    setZExag={setZExag}
                    showEstratosLayer={showEstratosLayer}
                    setShowEstratosLayer={setShowEstratosLayer}
                    cameraMode={cameraMode}
                    setCameraMode={setCameraMode}
                    dioramaSize={dioramaSize}
                    setDioramaSize={setDioramaSize}
                    selectedProgressiva3D={selectedProgressiva3D}
                    setSelectedProgressiva3D={setSelectedProgressiva3D}
                    focusOnSelectedProgressiva={focusOnSelectedProgressiva}
                    soilData={soilData}
                    flyToProgressive={flyToProgressive}
                    corridorClip={corridorClip}
                    setCorridorClip={setCorridorClip}
                />
            </div>
        </div>
    );
}
