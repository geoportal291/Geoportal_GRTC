/**
 * BoreholeBatchEngine.js
 * Renderizado de alto rendimiento de cilindros de perforación (calicatas/estratos)
 * utilizando Primitivos por lotes (Batched Geometries).
 * Reemplaza la Entities API masiva para garantizar 60 FPS con cientos de sondajes.
 */

export class BoreholeBatchEngine {
    /**
     * Renderiza una lista de progresivas/estratos como un único Primitivo de Cesium por lotes.
     */
    static renderBoreholeBatch(viewer, progresivas, options = {}) {
        const Cesium = window.Cesium;
        if (!Cesium || !viewer || !progresivas || progresivas.length === 0) return null;

        const toLon = options.toLon || ((x, y) => ({ lon: parseFloat(x), lat: parseFloat(y) }));
        const zExag = parseFloat(options.zExag) || 1.0;
        const f = Math.max(1.0, zExag);
        const zBase = Number.isFinite(options.zBase) ? options.zBase : 0;
        const radius = options.radius || 4.0; // Radio del cilindro en metros
        // Misma fórmula de exageración que malla/calicatas/muro (única fuente de verdad):
        //   cota absoluta: zRender = zBase + (zReal - zBase) * f
        //   profundidad:   surfaceRender - prof * f
        const renderZ = (zReal) => zBase + (zReal - zBase) * f;

        const instances = [];

        progresivas.forEach((p) => {
            const ex = parseFloat(p.coordenada_este || p.este);
            const ny = parseFloat(p.coordenada_norte || p.norte);

            if (!Number.isFinite(ex) || !Number.isFinite(ny) || (ex === 0 && ny === 0)) return;

            const lonLat = toLon(ex, ny);
            if (!lonLat) return;

            const surfaceZ = parseFloat(p.elevacion || p.cota || 0);
            const estratos = p.estratos || p.estratos_perfil || [];

            estratos.forEach((e, idx) => {
                const profIni = parseFloat(e.profundidad_inicial ?? e.cota_inicial ?? (idx * 1.5));
                const profFin = parseFloat(e.profundidad_final ?? e.cota_final ?? ((idx + 1) * 1.5));

                const heightMeters = Math.max(0.2, (profFin - profIni) * f);
                const centerZ = renderZ(surfaceZ) - ((profIni + (profFin - profIni) / 2) * f);

                const centerPosition = Cesium.Cartesian3.fromDegrees(lonLat.lon, lonLat.lat, centerZ);

                const cylinderGeometry = new Cesium.CylinderGeometry({
                    length: heightMeters,
                    topRadius: radius,
                    bottomRadius: radius,
                    slices: 16
                });

                // Matriz de modelo para posicionar verticalmente el cilindro en el centro del estrato
                const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerPosition);

                const hexColor = e.nlp_color_hex || e.color_hex || '#3b82f6';
                const color = Cesium.Color.fromCssColorString(hexColor).withAlpha(0.95);

                instances.push(new Cesium.GeometryInstance({
                    geometry: cylinderGeometry,
                    modelMatrix: modelMatrix,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
                    },
                    id: {
                        type: 'BOREHOLE_STRATUM',
                        progresivaId: p.id,
                        nombre_progresiva: p.nombre,
                        numero_estrato: idx + 1,
                        profundidad_inicial: profIni,
                        profundidad_final: profFin,
                        clasificacion_sucs: e.clasificacion_sucs || e.clasificacion || 'S/D',
                        humedad: e.humedad || e.humedad_natural || null,
                        descripcion: e.descripcion || 'Sin descripción litológica.',
                        nlp_color_hex: hexColor
                    }
                }));
            });
        });

        if (instances.length === 0) return null;

        const primitive = new Cesium.Primitive({
            geometryInstances: instances,
            appearance: new Cesium.PerInstanceColorAppearance({
                translucent: true,
                closed: true
            }),
            asynchronous: true
        });

        viewer.scene.primitives.add(primitive);
        viewer.scene.requestRender();

        return primitive;
    }
}
