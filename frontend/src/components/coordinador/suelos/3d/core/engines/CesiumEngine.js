import { loadCesium } from '../cesiumLoader';

/**
 * Implementación del motor 3D basada en CesiumJS.
 * Sigue el contrato unificado MapEngine para aislamiento del motor de mapa.
 */
export class CesiumEngine {
    constructor() {
        this.viewer = null;
        this.Cesium = null;
        this.primitivesMap = new Map();
        this.imageryLayers = new Map();
        this.pickHandler = null;
    }

    /**
     * Inicializa el visor Cesium.
     */
    async init(container, options = {}) {
        this.Cesium = await loadCesium();
        const Cesium = this.Cesium;

        if (options.ionToken) {
            Cesium.Ion.defaultAccessToken = options.ionToken;
        }

        // Terreno 3D con cadena de fallbacks:
        //   1) Cesium World Terrain (Ion) si hay token.
        //   2) Terreno global de Esri WorldElevation3D (público, sin token) → montañas reales sin Ion.
        //   3) Elipsoide plano (último recurso).
        let terrainProvider;
        if (options.ionToken) {
            try {
                terrainProvider = await Cesium.createWorldTerrainAsync({
                    requestWaterMask: false,
                    requestVertexNormals: true,
                });
            } catch (e) {
                console.warn('[CesiumEngine] No se pudo cargar terreno Cesium Ion:', e);
                terrainProvider = null;
            }
        }

        if (!terrainProvider) {
            try {
                // OJO: en Cesium moderno el constructor new ArcGISTiledElevationTerrainProvider()
                // NO inicializa el proveedor (tilingScheme/availability quedan undefined para
                // siempre y el globo queda sin relieve). Hay que usar la fábrica asíncrona
                // fromUrl(), que descarga el tilemap del servicio.
                terrainProvider = await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
                    'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
                );
                console.log('[CesiumEngine] Terreno global Esri (WorldElevation3D, sin token Ion) activado.');
            } catch (e2) {
                console.warn('[CesiumEngine] Tampoco se pudo usar el terreno Esri; queda elipsoide plano:', e2);
                terrainProvider = new Cesium.EllipsoidTerrainProvider();
            }
        }

        this.viewer = new Cesium.Viewer(container, {
            animation: false,
            timeline: false,
            navigationHelpButton: false,
            sceneModePicker: false,
            geocoder: false,
            homeButton: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            infoBox: false,
            selectionIndicator: false,
            requestRenderMode: true,
            maximumRenderTimeChange: Infinity,
            // baseLayer:false evita el asset Ion por defecto del Viewer (401 sin token);
            // la base satelital Esri se agrega siempre más abajo.
            baseLayer: false,
            terrainProvider
        });

        // Configurar capa satelital global de alta resolución (Esri World Imagery)
        try {
            const imageryLayers = this.viewer.imageryLayers;
            if (imageryLayers) {
                imageryLayers.removeAll();
                imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    // Nivel 17: en zonas rurales de Perú Esri no tiene imágenes a niveles 18-19
                    // y sirve mosaicos "Map data not yet available". Al limitar aquí, Cesium
                    // re-escala las teselas del nivel 17 al hacer más zoom (borroso pero correcto).
                    maximumLevel: 17,
                    credit: 'Esri World Imagery'
                }));
            }
        } catch (imgErr) {
            console.warn('[CesiumEngine] Advertencia configurando capa satelital Esri:', imgErr);
        }

        if (this.viewer.scene && this.viewer.scene.globe) {
            this.viewer.scene.globe.depthTestAgainstTerrain = true;
            // Rendimiento: el visor trabaja a escala de tramo, no de planeta.
            // maximumScreenSpaceError 2→4 reduce la densidad de teselas (imperceptible a
            // distancia de diorama); tileCacheSize 100→50 reduce memoria de teselas.
            this.viewer.scene.globe.maximumScreenSpaceError = 4;
            this.viewer.scene.globe.tileCacheSize = 50;
        }

        // Configurar controlador de cámara
        const controller = this.viewer.scene.screenSpaceCameraController;
        controller.inertiaSpin = 0.5;
        controller.inertiaTranslate = 0.5;
        controller.inertiaZoom = 0.5;

        return this;
    }

    /**
     * Destrucción limpia del motor.
     */
    destroy() {
        if (this.pickHandler) {
            this.pickHandler.destroy();
            this.pickHandler = null;
        }
        if (this.viewer && !this.viewer.isDestroyed()) {
            this.viewer.destroy();
        }
        this.viewer = null;
        this.primitivesMap.clear();
        this.imageryLayers.clear();
    }

    /**
     * Ajusta la opacidad real del mapa base/imagery (P2-10 Fix).
     */
    setImageryOpacity(alpha) {
        if (!this.viewer || this.viewer.isDestroyed()) return;
        const layers = this.viewer.imageryLayers;
        const count = layers.length;
        for (let i = 0; i < count; i++) {
            const layer = layers.get(i);
            if (layer) layer.alpha = alpha;
        }
        this.viewer.scene.requestRender();
    }

    /**
     * Activa o desactiva exageración vertical global del terreno.
     */
    setTerrain({ exaggeration = 1.0 }) {
        if (!this.viewer || this.viewer.isDestroyed()) return;
        if ('verticalExaggeration' in this.viewer.scene) {
            this.viewer.scene.verticalExaggeration = exaggeration;
        }
        this.viewer.scene.requestRender();
    }

    /**
     * Actualiza la exageración Z de la malla LandXML mediante transformación sin reconstruir geometría (P2-11 Fix).
     */
    updateMeshExaggeration(meshPrimitive, zExag) {
        if (!this.viewer || this.viewer.isDestroyed() || !meshPrimitive) return;
        // Cesium Primitive modelMatrix o verticalExaggeration update
        if ('verticalExaggeration' in this.viewer.scene) {
            this.viewer.scene.verticalExaggeration = zExag;
        }
        this.viewer.scene.requestRender();
    }

    /**
     * Muestrea alturas del terreno en coordenadas lon/lat.
     */
    async sampleElevations(coords) {
        if (!this.viewer || this.viewer.isDestroyed()) return coords.map(() => 0);
        const Cesium = this.Cesium;
        const positions = coords.map(c => Cesium.Cartographic.fromDegrees(c.lon, c.lat));
        try {
            const sampled = await Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, positions);
            return sampled.map(s => s.height || 0);
        } catch (e) {
            return coords.map(() => 0);
        }
    }

    /**
     * Cambia el modo de cámara de forma fluida sin reiniciar el visor.
     */
    setCameraMode(mode) {
        if (!this.viewer || this.viewer.isDestroyed()) return;
        // Cambios de restricción o inercia según el modo
        this.viewer.scene.requestRender();
    }

    /**
     * Vuela suavemente a un punto de interés.
     */
    flyTo({ lon, lat, height = 500, pitch = -35 }) {
        if (!this.viewer || this.viewer.isDestroyed()) return;
        const Cesium = this.Cesium;
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(pitch),
                roll: 0
            },
            duration: 1.5
        });
    }

    /**
     * Configura el manejador de clic/picking.
     */
    onPick(callback) {
        if (!this.viewer || this.viewer.isDestroyed()) return;
        const Cesium = this.Cesium;

        if (this.pickHandler) {
            this.pickHandler.destroy();
        }

        this.pickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // setInputAction(action, type): la acción va PRIMERO, luego el tipo de evento.
        this.pickHandler.setInputAction((movement) => {
            const pickedObject = this.viewer.scene.pick(movement.position);
            if (Cesium.defined(pickedObject) && callback) {
                callback(pickedObject, movement.position);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    renderOnce() {
        if (this.viewer && !this.viewer.isDestroyed()) {
            this.viewer.scene.requestRender();
        }
    }
}
