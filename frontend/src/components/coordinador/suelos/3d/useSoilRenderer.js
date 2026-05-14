/**
 * useSoilRenderer.js
 * Hook responsable del renderizado 3D de calicatas, estratos y trazados KML.
 * Extrae toda la lógica de "renderHoles" y "loadTracks" de Vista3D.jsx.
 *
 * MEJORA CLAVE respecto al código original:
 *   - Usa waitForTerrainReady() antes de muestrear alturas → elimina el warning
 *     "[geoUtils] No terrainProvider provided" y asegura que los marcadores
 *     se coloquen en la altura real del terreno.
 */
import { useCallback, useRef } from 'react';
import { utmToWgs84, processCoordinates, getUtmZoneFromLon, chunkedSampleTerrain, waitForTerrainReady } from '../../../../utils/geoUtils';

const Cesium = window.Cesium;

export default function useSoilRenderer({ viewerRef, isViewerStable, projectZone, setProjectZone }) {
    const soilEntitiesRef     = useRef([]);
    const kmlDataSourcesRef   = useRef([]);
    const progressivaAnchorsRef = useRef(new Map());

    // ── Limpieza ───────────────────────────────────────────────────────────────

    const clearSoilEntities = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;
        soilEntitiesRef.current.forEach(e => viewer.entities.remove(e));
        soilEntitiesRef.current = [];
    }, [viewerRef]);

    const clearKmlSources = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;
        kmlDataSourcesRef.current.forEach(ds => viewer.dataSources.remove(ds));
        kmlDataSourcesRef.current = [];
    }, [viewerRef]);

    // ── Carga de Trazados KML ─────────────────────────────────────────────────

    const loadTracks = useCallback(async (tracks) => {
        const viewer = viewerRef.current;
        if (!isViewerStable(viewer) || !tracks?.length) return;

        let zoneDetected = false;

        for (const track of tracks) {
            try {
                if (!isViewerStable(viewer)) return;
                if (!track.kml_content) {
                    console.error(`[useSoilRenderer] Track "${track.nombre}" sin contenido KML.`);
                    continue;
                }

                let kmlPrepared = track.kml_content;
                if (!kmlPrepared.includes('<tessellate>1</tessellate>')) {
                    kmlPrepared = kmlPrepared.replace(/<LineString>/g, '<LineString><tessellate>1</tessellate>');
                }

                const kmlBlob = new Blob([kmlPrepared], { type: 'application/vnd.google-earth.kml+xml' });
                const ds = await Cesium.KmlDataSource.load(kmlBlob, {
                    camera: viewer.scene.camera,
                    canvas: viewer.canvas,
                    clampToGround: true,
                });

                if (!isViewerStable(viewer)) return;

                // Detección automática de zona UTM
                if (!zoneDetected) {
                    const firstEnt = ds.entities.values.find(e => e.position);
                    if (firstEnt) {
                        const pos = firstEnt.position.getValue(Cesium.JulianDate.now());
                        if (pos) {
                            const carto = Cesium.Cartographic.fromCartesian(pos);
                            const zone = getUtmZoneFromLon(Cesium.Math.toDegrees(carto.longitude));
                            setProjectZone(zone);
                            zoneDetected = true;
                        }
                    }
                }

                ds.entities.values.forEach(entity => {
                    if (!entity.polyline) return;
                    entity.polyline.material = Cesium.Color.DODGERBLUE.withAlpha(0.9);
                    entity.polyline.depthFailMaterial = Cesium.Color.CYAN.withAlpha(0.95);
                    entity.polyline.width = 8.0;
                    entity.polyline.clampToGround = true;
                    entity.polyline.arcType = Cesium.ArcType.GEODESIC;
                    entity.polyline.zIndex = 20;
                    entity.polyline.show = true;
                });

                viewer.dataSources.add(ds);
                kmlDataSourcesRef.current.push(ds);
            } catch (e) {
                console.error(`[useSoilRenderer] Error cargando KML "${track.nombre}":`, e);
            }
        }
    }, [viewerRef, isViewerStable, setProjectZone]);

    // ── Renderizado de Calicatas (Cilindros de Estratos) ──────────────────────

    const renderHoles = useCallback(async (progresivas) => {
        const viewer = viewerRef.current;
        if (!isViewerStable(viewer)) return;

        const calicatas = (progresivas || []).filter(
            p => p.coordenada_este && p.coordenada_norte && p.estratos?.length > 0
        );
        if (!calicatas.length) return;

        // ── MEJORA: Esperar a que el terreno esté listo ANTES de muestrear ────
        const scene = viewer.scene;
        const tProvider = scene.terrainProvider || viewer.terrainProvider;
        await waitForTerrainReady(tProvider);

        // Muestrear solo las calicatas sin elevación en la DB
        const toSample = calicatas.filter(p => !p.elevacion);
        const cartographicsToSample = toSample.map(p => {
            const { lon, lat } = utmToWgs84(p.coordenada_este, p.coordenada_norte, projectZone);
            return Cesium.Cartographic.fromDegrees(lon, lat);
        });

        let sampledMap = {};
        if (cartographicsToSample.length > 0 && isViewerStable(viewer)) {
            try {
                const sampled = await chunkedSampleTerrain(Cesium, tProvider, cartographicsToSample);
                cartographicsToSample.forEach((c, idx) => {
                    sampledMap[`${c.longitude.toFixed(6)}_${c.latitude.toFixed(6)}`] = sampled[idx]?.height || 0;
                });
            } catch (e) {
                console.error('[useSoilRenderer] Error muestreando terreno:', e);
            }
        }

        if (!isViewerStable(viewer)) return;

        calicatas.forEach(p => {
            if (!isViewerStable(viewer)) return;

            const { lon, lat } = utmToWgs84(p.coordenada_este, p.coordenada_norte, projectZone);
            const key = `${Cesium.Math.toRadians(lon).toFixed(6)}_${Cesium.Math.toRadians(lat).toFixed(6)}`;

            let surfaceZ = 0;
            if (p.elevacion && parseFloat(p.elevacion) !== 0) {
                surfaceZ = parseFloat(p.elevacion);
            } else {
                surfaceZ = sampledMap[key] || 0;
            }

            progressivaAnchorsRef.current.set(p.id, { lon, lat, surfaceZ });

            // Marcador + etiqueta
            const markerId = `prog-marker-${p.id}`;
            if (!viewer.entities.getById(markerId)) {
                const markerEntity = viewer.entities.add({
                    id: markerId,
                    name: `Progresiva: ${p.nombre}`,
                    position: Cesium.Cartesian3.fromDegrees(lon, lat, surfaceZ + 1.0),
                    point: {
                        pixelSize: 10,
                        color: Cesium.Color.CYAN,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                    label: {
                        text: p.nombre,
                        font: '14pt Outfit, sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 3,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -20),
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                });
                soilEntitiesRef.current.push(markerEntity);
            }

            // Cilindros de estratos
            let cumulativeDepth = 0;
            if (!p.estratos || p.estratos.length === 0) {
                const noEstId = `calicata-empty-${p.id}`;
                if (!viewer.entities.getById(noEstId)) {
                    const entity = viewer.entities.add({
                        id: noEstId,
                        name: `Calicata: ${p.nombre} (Sin estratos)`,
                        position: Cesium.Cartesian3.fromDegrees(lon, lat, surfaceZ - 7.0),
                        cylinder: {
                            length: 14.0, topRadius: 1.2, bottomRadius: 1.2,
                            material: Cesium.Color.GRAY.withAlpha(0.6),
                            outline: true,
                        },
                    });
                    soilEntitiesRef.current.push(entity);
                }
            } else {
                p.estratos.forEach((estrato, eIdx) => {
                    const thickness = Math.abs(estrato.cota_final - estrato.cota_inicial) || 0.5;
                    const centerDepth = cumulativeDepth + thickness / 2;
                    const estratoId = `estrato-${p.id}-${eIdx}`;
                    if (!viewer.entities.getById(estratoId)) {
                        const entity = viewer.entities.add({
                            id: estratoId,
                            name: `P: ${p.nombre} | ${estrato.nombre || 'Estrato'}`,
                            description: `Profundidad: ${estrato.cota_inicial}m - ${estrato.cota_final}m<br/>${estrato.descripcion || ''}`,
                            position: Cesium.Cartesian3.fromDegrees(lon, lat, surfaceZ - centerDepth),
                            cylinder: {
                                length: thickness,
                                topRadius: 1.5,
                                bottomRadius: 1.5,
                                material: Cesium.Color.fromCssColorString(estrato.nlp_color_hex || '#858585').withAlpha(0.95),
                                outline: true,
                                outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
                                outlineWidth: 1,
                            },
                        });
                        soilEntitiesRef.current.push(entity);
                    }
                    cumulativeDepth += thickness;
                });
            }
        });

        if (isViewerStable(viewer)) viewer.scene.requestRender();
    }, [viewerRef, isViewerStable, projectZone]);

    return {
        soilEntitiesRef,
        kmlDataSourcesRef,
        progressivaAnchorsRef,
        loadTracks,
        renderHoles,
        clearSoilEntities,
        clearKmlSources,
    };
}
