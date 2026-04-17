// Usar Cesium global (cargado vía script tag en index.html)
const Cesium = window.Cesium;

/**
 * Motor especializado para el renderizado de tramos maestros (largos)
 * con geología real basada en la base de datos (Km 0 a Km 33+)
 * OPTIMIZADO: Usa Primitivos (Batched Geometries) para 60 FPS en grandes extensiones.
 */
export const FullTramoEngine = {
    /**
     * Renderiza el "Muro Geológico" conectando los sondajes de la BD de forma asíncrona
     */
    renderWallStrata: async (viewer, boreholes, options = {}) => {
        if (!viewer || !boreholes || boreholes.length < 2) return null;
        
        console.log(`[FullTramoEngine] Iniciando renderizado de alto rendimiento para ${boreholes.length} puntos.`);
        
        // Ordenar por código (Km 0+000)
        const sortedBoreholes = [...boreholes].sort((a, b) => {
            const getKm = (s) => {
                const m = String(s).match(/(\d+)\+(\d+)/);
                return m ? parseInt(m[1]) * 1000 + parseFloat(m[2]) : 0;
            };
            return getKm(a.codigo) - getKm(b.codigo);
        });

        // 1. FILTRADO AGRESIVO
        const validBoreholes = sortedBoreholes.filter(bh => {
            const ex = parseFloat(bh.coordenada_este);
            const ny = parseFloat(bh.coordenada_norte);
            return Number.isFinite(ex) && Number.isFinite(ny) && (ex !== 0 || ny !== 0);
        });

        if (validBoreholes.length < 2) return null;

        const positionsToSample = validBoreholes.map(bh => {
            const { lon, lat } = options.toLon(bh.coordenada_este, bh.coordenada_norte);
            return Cesium.Cartographic.fromDegrees(lon, lat);
        });

        // 2. MUESTREO DE TERRENO (Chunked para no bloquear)
        let samples = [];
        try {
            samples = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positionsToSample);
        } catch (e) {
            samples = positionsToSample.map(p => ({ height: 0 }));
        }

        const instances = [];
        const exaggeration = 15.0;

        // 3. GENERAR GEOMETRÍAS (INSTANCING)
        for (let i = 0; i < validBoreholes.length - 1; i++) {
            const b1 = validBoreholes[i];
            const b2 = validBoreholes[i + 1];
            
            const lonLat1 = options.toLon(b1.coordenada_este, b1.coordenada_norte);
            const lonLat2 = options.toLon(b2.coordenada_este, b2.coordenada_norte);

            const surfaceZ1 = (samples[i].height || 0) + 2.0; // Offset para que coincida con superficie exagerada
            const surfaceZ2 = (samples[i+1].height || 0) + 2.0;

            const estratos1 = b1.estratos_perfil || [];
            const estratos2 = b2.estratos_perfil || [];
            const maxLayers = Math.max(estratos1.length, estratos2.length);

            for (let j = 0; j < maxLayers; j++) {
                const e1 = estratos1[j] || (estratos1.length > 0 ? estratos1[estratos1.length - 1] : null);
                const e2 = estratos2[j] || (estratos2.length > 0 ? estratos2[estratos2.length - 1] : null);

                if (!e1 || !e2) continue;

                const top1 = surfaceZ1 - (parseFloat(e1.profundidad_inicial || 0) * exaggeration);
                const bot1 = surfaceZ1 - (parseFloat(e1.profundidad_final || 0) * exaggeration);
                const top2 = surfaceZ2 - (parseFloat(e2.profundidad_inicial || 0) * exaggeration);
                const bot2 = surfaceZ2 - (parseFloat(e2.profundidad_final || 0) * exaggeration);

                const color = Cesium.Color.fromCssColorString(e1.nlp_color_hex || '#555555').withAlpha(0.85);

                // Crear Geometría de Pared
                const wallGeom = new Cesium.WallGeometry({
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                        lonLat1.lon, lonLat1.lat, top1,
                        lonLat2.lon, lonLat2.lat, top2
                    ]),
                    minimumHeights: [bot1, bot2]
                });

                instances.push(new Cesium.GeometryInstance({
                    geometry: wallGeom,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
                    }
                }));
            }
        }

        if (instances.length === 0) return null;

        // 4. CREAR EL PRIMITIVO MAESTRO (BATCH RENDER)
        const primitive = new Cesium.Primitive({
            geometryInstances: instances,
            appearance: new Cesium.PerInstanceColorAppearance({
                translucent: true,
                closed: false,
                flat: true // Flat para mejor rendimiento visual en móviles/bajo hardware
            }),
            asynchronous: true // No bloquea el hilo principal durante la creación
        });

        viewer.scene.primitives.add(primitive);
        viewer.scene.requestRender();
        
        return primitive; // Retornamos el primitivo único para fácil limpieza
    }
};
