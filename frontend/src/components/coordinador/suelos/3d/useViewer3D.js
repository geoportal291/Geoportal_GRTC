/**
 * useViewer3D.js
 * Hook responsable del ciclo de vida completo del viewer Cesium:
 * inicialización, capas de imágenes, configuración de cámara y destrucción.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const Cesium = window.Cesium;

export default function useViewer3D({ containerRef, onReady, onCameraBoundsCheck }) {
    const viewerRef = useRef(null);
    const focusImageryLayerRef = useRef(null);
    const [isViewerReady, setIsViewerReady] = useState(false);
    const isMounted = useRef(false);

    const getSceneCamera = useCallback((viewer) => {
        if (!viewer || viewer.isDestroyed()) return null;
        try { return viewer.scene?.camera || null; } catch { return null; }
    }, []);

    const isViewerStable = useCallback((viewer) => {
        if (!viewer || viewer !== viewerRef.current || viewer.isDestroyed()) return false;
        try { return !!viewer.scene && !!viewer.entities && !!viewer.dataSources; } catch { return false; }
    }, []);

    const resetCameraTransform = useCallback((camera) => {
        if (!camera || typeof camera.lookAtTransform !== 'function' || !Cesium.Matrix4?.IDENTITY) return;
        try { camera.lookAtTransform(Cesium.Matrix4.IDENTITY); } catch { }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        let viewer;

        const init = async () => {
            try {
                if (!containerRef.current || !isMounted.current) return;

                const { Ion, Terrain, Viewer, IonImageryProvider, ArcGisMapServerImageryProvider, UrlTemplateImageryProvider } = Cesium;
                const ION_TOKEN = process.env.REACT_APP_CESIUM_TOKEN;

                if (Ion) Ion.defaultAccessToken = ION_TOKEN || '';

                // ── Terreno con fallback robusto ──────────────────────────────────
                let terrainOpt = {};
                try {
                    if (Terrain?.fromWorldTerrain) {
                        terrainOpt = { terrain: Terrain.fromWorldTerrain({ requestVertexNormals: true }) };
                    } else if (typeof Cesium.createWorldTerrainAsync === 'function') {
                        terrainOpt = { terrainProvider: await Cesium.createWorldTerrainAsync({ requestVertexNormals: true }) };
                    } else if (typeof Cesium.createWorldTerrain === 'function') {
                        terrainOpt = { terrainProvider: Cesium.createWorldTerrain({ requestVertexNormals: true }) };
                    }
                } catch { }

                viewer = new Viewer(containerRef.current, {
                    ...terrainOpt,
                    animation: false, baseLayerPicker: false, homeButton: false,
                    geocoder: false, timeline: false, navigationHelpButton: false,
                    sceneModePicker: false, selectionIndicator: false, infoBox: false,
                });

                if (!isMounted.current || viewer.isDestroyed()) {
                    if (!viewer.isDestroyed()) viewer.destroy();
                    return;
                }

                // ── Optimizaciones de escena ──────────────────────────────────────
                viewer.scene.globe.enableLighting = true;
                viewer.scene.globe.depthTestAgainstTerrain = true;
                viewer.scene.highDynamicRange = true;
                viewer.scene.postProcessStages.fxaa.enabled = true;

                // ── Capas de imágenes ─────────────────────────────────────────────
                const imageryLayers = viewer.imageryLayers;
                imageryLayers.removeAll();

                try {
                    const ionLayer = await IonImageryProvider.fromAssetId(2);
                    if (isMounted.current && !viewer.isDestroyed()) {
                        imageryLayers.addImageryProvider(ionLayer);
                    }
                } catch {
                    if (isMounted.current && !viewer.isDestroyed()) {
                        imageryLayers.addImageryProvider(new ArcGisMapServerImageryProvider({
                            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                            enablePickFeatures: false,
                        }));
                    }
                }

                if (!isMounted.current || viewer.isDestroyed()) {
                    if (!viewer.isDestroyed()) viewer.destroy();
                    return;
                }

                const focusLayer = imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    maximumLevel: 19,
                }));
                focusLayer.alpha = 0.0;
                focusImageryLayerRef.current = focusLayer;

                // ── Controlador de cámara: movilidad mejorada ─────────────────────
                const controller = viewer.scene.screenSpaceCameraController;
                if (controller) {
                    controller.inertiaSpin      = 0.06;
                    controller.inertiaTranslate = 0.06;
                    controller.inertiaZoom      = 0.06;
                    controller.enableLook       = true;
                    controller.enableTilt       = true;
                    controller.enableTranslate  = true;
                    controller.enableRotate     = true;
                    controller.enableZoom       = true;
                    if ('zoomFactor' in controller) controller.zoomFactor = 10.0;
                    controller.enableCollisionDetection = false;
                }

                // ── Listener de pre-render para restricciones de diorama ──────────
                if (onCameraBoundsCheck) {
                    viewer.scene.preRender.addEventListener(onCameraBoundsCheck);
                }

                if (isMounted.current) {
                    viewerRef.current = viewer;
                    setIsViewerReady(true);
                    if (onReady) onReady(viewer);
                } else {
                    viewer.destroy();
                }
            } catch (e) {
                console.error('[useViewer3D] Error crítico inicializando Cesium:', e);
                if (viewer && !viewer.isDestroyed()) viewer.destroy();
            }
        };

        init();

        return () => {
            isMounted.current = false;
            if (viewer && !viewer.isDestroyed()) {
                try {
                    if (onCameraBoundsCheck) {
                        viewer.scene.preRender.removeEventListener(onCameraBoundsCheck);
                    }
                } catch { }
                viewer.destroy();
            }
            viewerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo una vez al montar

    return {
        viewerRef,
        focusImageryLayerRef,
        isViewerReady,
        getSceneCamera,
        isViewerStable,
        resetCameraTransform,
    };
}
