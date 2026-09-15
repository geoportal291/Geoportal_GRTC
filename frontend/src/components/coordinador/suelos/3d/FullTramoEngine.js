/**
 * FullTramoEngine.js
 * Motor especializado para el renderizado del Muro Geológico 3D Continuo (WallGeometry Primitives).
 * Conecta las calicatas/sondajes a lo largo del trazado de la carretera (Km 0 a Km 35+)
 * OPTIMIZADO: Utiliza Primitivos por lotes (Batched Geometries) para mantener 60 FPS.
 */

export const FullTramoEngine = {
    /**
     * Renderiza el "Muro Geológico" conectando los sondajes de la BD de forma asíncrona.
     */
    renderWallStrata: async (viewer, boreholes, options = {}) => {
        const Cesium = window.Cesium;
        if (!Cesium || !viewer || !boreholes || boreholes.length < 2) return null;

        const toLon = options.toLon || ((x, y) => ({ lon: parseFloat(x), lat: parseFloat(y) }));
        const zExag = parseFloat(options.zExag) || 1.0;
        const f = Math.max(1.0, zExag);
        const zBase = Number.isFinite(options.zBase) ? options.zBase : 0;
        // Misma fórmula de exageración que la malla LandXML y las calicatas:
        //   cota absoluta: zRender = zBase + (zReal - zBase) * f
        //   profundidad:   surfaceRender - prof * f
        // De lo contrario el muro queda descalzado frente a la malla/globo.
        const renderZ = (zReal) => zBase + (zReal - zBase) * f;

        // 1. ORDENAR POR KILOMETRAJE / CÓDIGO (Km 0+000)
        const sortedBoreholes = [...boreholes].sort((a, b) => {
            const getKm = (s) => {
                if (!s) return 0;
                const m = String(s).match(/(\d+)\+(\d+)/);
                return m ? parseInt(m[1], 10) * 1000 + parseFloat(m[2]) : 0;
            };
            return getKm(a.nombre || a.codigo) - getKm(b.nombre || b.codigo);
        });

        // 2. FILTRAR PUNTOS VÁLIDOS CON COORDENADAS
        const validBoreholes = sortedBoreholes.filter(bh => {
            const ex = parseFloat(bh.coordenada_este || bh.este);
            const ny = parseFloat(bh.coordenada_norte || bh.norte);
            return Number.isFinite(ex) && Number.isFinite(ny) && (ex !== 0 || ny !== 0);
        });

        if (validBoreholes.length < 2) return null;

        // 3. GENERAR MUESTREO Y GEOMETRÍAS DE PARED EN BATCH
        const instances = [];

        for (let i = 0; i < validBoreholes.length - 1; i++) {
            const b1 = validBoreholes[i];
            const b2 = validBoreholes[i + 1];

            const lonLat1 = toLon(b1.coordenada_este || b1.este, b1.coordenada_norte || b1.norte);
            const lonLat2 = toLon(b2.coordenada_este || b2.este, b2.coordenada_norte || b2.norte);

            if (!lonLat1 || !lonLat2) continue;

            const surfaceZ1 = parseFloat(b1.elevacion || b1.cota || 0);
            const surfaceZ2 = parseFloat(b2.elevacion || b2.cota || 0);

            const estratos1 = b1.estratos || b1.estratos_perfil || [];
            const estratos2 = b2.estratos || b2.estratos_perfil || [];
            const maxLayers = Math.max(estratos1.length, estratos2.length);

            for (let j = 0; j < maxLayers; j++) {
                const e1 = estratos1[j] || (estratos1.length > 0 ? estratos1[estratos1.length - 1] : null);
                const e2 = estratos2[j] || (estratos2.length > 0 ? estratos2[estratos2.length - 1] : null);

                if (!e1 || !e2) continue;

                const profIni1 = parseFloat(e1.profundidad_inicial ?? e1.cota_inicial ?? 0);
                const profFin1 = parseFloat(e1.profundidad_final ?? e1.cota_final ?? 1);
                const profIni2 = parseFloat(e2.profundidad_inicial ?? e2.cota_inicial ?? 0);
                const profFin2 = parseFloat(e2.profundidad_final ?? e2.cota_final ?? 1);

                const top1 = renderZ(surfaceZ1) - (profIni1 * f);
                const bot1 = renderZ(surfaceZ1) - (profFin1 * f);
                const top2 = renderZ(surfaceZ2) - (profIni2 * f);
                const bot2 = renderZ(surfaceZ2) - (profFin2 * f);

                const hexColor = e1.nlp_color_hex || e1.color_hex || '#3b82f6';
                const color = Cesium.Color.fromCssColorString(hexColor).withAlpha(0.85);

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
                    },
                    id: {
                        type: 'GEOLOGY_WALL',
                        progresiva1: b1.nombre,
                        progresiva2: b2.nombre,
                        estrato: e1
                    }
                }));
            }
        }

        if (instances.length === 0) return null;

        // 4. CREAR PRIMITIVO BATCH UNIFICADO
        const primitive = new Cesium.Primitive({
            geometryInstances: instances,
            appearance: new Cesium.PerInstanceColorAppearance({
                translucent: true,
                closed: false,
                flat: true
            }),
            asynchronous: true
        });

        viewer.scene.primitives.add(primitive);
        viewer.scene.requestRender();

        return primitive;
    }
};
