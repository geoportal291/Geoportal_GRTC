import * as THREE from 'three';
import mapboxglRaw from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxgl = mapboxglRaw && mapboxglRaw.default ? mapboxglRaw.default : mapboxglRaw;

/**
 * Motor 3D Geoespacial basado en Mapbox GL JS / MapLibre GL JS + Three.js.
 * Implementa el contrato MapEngine para máximo rendimiento y calidad gráfica.
 */
export class MapboxEngine {
    constructor() {
        this.map = null;
        this.threeScene = new THREE.Scene();
        this.threeCamera = new THREE.PerspectiveCamera();
        this.threeRenderer = null;
        this.customLayer = null;
        this.raycaster = new THREE.Raycaster();
        this.pickCallback = null;
    }

    /**
     * Inicializa Mapbox GL JS v3 / MapLibre GL JS con terreno 3D y proyección Globe.
     */
    async init(container, options = {}) {
        if (!mapboxgl || typeof mapboxgl.Map !== 'function') {
            throw new Error('mapbox-gl no está disponible o no exporta la clase Map.');
        }

        const token = options.mapboxToken || process.env.REACT_APP_MAPBOX_TOKEN;
        if (token && mapboxgl.accessToken !== undefined) {
            mapboxgl.accessToken = token;
        }

        // Estilo predeterminado compatible con Mapbox y MapLibre
        const styleUrl = token
            ? 'mapbox://styles/mapbox/satellite-v9'
            : 'https://demotiles.maplibre.org/style.json';

        this.map = new mapboxgl.Map({
            container,
            style: styleUrl,
            center: options.center || [-71.96, -13.52],
            zoom: options.zoom || 13,
            pitch: options.pitch || 45,
            bearing: options.bearing || 0,
            antialias: true
        });

        // Configuración de Terreno 3D si Mapbox DEM está disponible
        this.map.on('style.load', () => {
            try {
                if (token && !this.map.getSource('mapbox-dem')) {
                    this.map.addSource('mapbox-dem', {
                        type: 'raster-dem',
                        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        tileSize: 512,
                        maxzoom: 14
                    });
                    this.map.setTerrain({
                        source: 'mapbox-dem',
                        exaggeration: options.zExag || 1.0
                    });
                }
            } catch (err) {
                console.warn('[MapboxEngine] Advertencia al configurar terreno 3D:', err);
            }
        });

        // Configurar capa personalizada de Three.js para mallas 3D
        this._setupThreeJsCustomLayer();

        return new Promise((resolve) => {
            this.map.on('load', () => resolve(this));
        });
    }

    /**
     * Destrucción limpia del mapa e instancias de Three.js.
     */
    destroy() {
        if (this.threeRenderer) {
            this.threeRenderer.dispose();
            this.threeRenderer = null;
        }
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.threeScene.clear();
    }

    /**
     * Ajusta la opacidad del mapa base satelital.
     */
    setImageryOpacity(alpha) {
        if (!this.map) return;
        const style = this.map.getStyle();
        if (style && style.layers) {
            style.layers.forEach(layer => {
                if (layer.type === 'raster') {
                    this.map.setPaintProperty(layer.id, 'raster-opacity', alpha);
                }
            });
        }
    }

    /**
     * Ajusta la exageración vertical Z en Mapbox v3.
     */
    setTerrain({ exaggeration = 1.0 }) {
        if (!this.map) return;
        try {
            if (this.map.getSource('mapbox-dem')) {
                this.map.setTerrain({ source: 'mapbox-dem', exaggeration });
            }
        } catch (e) { }
    }

    /**
     * Muestrea alturas de terreno en coordenadas locales usando la API queryTerrainElevation.
     */
    async sampleElevations(coords) {
        if (!this.map) return coords.map(() => 0);
        return coords.map(c => {
            if (typeof this.map.queryTerrainElevation === 'function') {
                const elevation = this.map.queryTerrainElevation([c.lon, c.lat]);
                return Number.isFinite(elevation) ? elevation : 0;
            }
            return 0;
        });
    }

    /**
     * Vuela suavemente a un punto objetivo.
     */
    flyTo({ lon, lat, zoom = 15, pitch = 50, duration = 1500 }) {
        if (!this.map) return;
        this.map.flyTo({
            center: [lon, lat],
            zoom,
            pitch,
            duration
        });
    }

    /**
     * Configura la integración entre la cámara de Mapbox y Three.js via Custom Layer API.
     */
    _setupThreeJsCustomLayer() {
        const self = this;

        this.customLayer = {
            id: 'threejs-landxml-layer',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function (map, gl) {
                self.threeRenderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialiasing: true
                });
                self.threeRenderer.autoClear = false;

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
                self.threeScene.add(ambientLight);

                const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
                dirLight.position.set(0, 1, 1).normalize();
                self.threeScene.add(dirLight);
            },
            render: function (gl, matrix) {
                if (!self.threeRenderer) return;

                // Solo renderizar Three.js si existen objetos/mallas en la escena
                const hasRenderableObjects = self.threeScene.children.some(child => child.isMesh || child.isGroup || child.isPoints);
                if (!hasRenderableObjects) return;

                const m = new THREE.Matrix4().fromArray(matrix);
                self.threeCamera.projectionMatrix = m;
                self.threeRenderer.resetState();
                self.threeRenderer.render(self.threeScene, self.threeCamera);
            }
        };

        this.map.on('style.load', () => {
            if (!this.map.getLayer('threejs-landxml-layer')) {
                this.map.addLayer(this.customLayer);
            }
        });
    }

    /**
     * Configura el listener para picking e inspección de objetos en 3D.
     */
    onPick(callback) {
        if (!this.map) return;
        this.pickCallback = callback;

        this.map.on('click', (e) => {
            if (!this.pickCallback) return;

            const mouse = new THREE.Vector2(
                (e.point.x / this.map.transform.width) * 2 - 1,
                -(e.point.y / this.map.transform.height) * 2 + 1
            );

            this.raycaster.setFromCamera(mouse, this.threeCamera);
            const intersects = this.raycaster.intersectObjects(this.threeScene.children, true);

            if (intersects.length > 0) {
                const picked = intersects[0];
                this.pickCallback(picked.object.userData, e.point);
            }
        });
    }

    renderOnce() {
        if (this.map) {
            this.map.triggerRepaint();
        }
    }
}
