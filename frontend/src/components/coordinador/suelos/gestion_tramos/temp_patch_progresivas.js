const handleImportKmlPoints = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(kml|kmz)$/i)) {
        alertify.error('Solo se permiten archivos KML o KMZ.');
        e.target.value = '';
        return;
    }

    if (!progresivaDetails || !subProgresivas) {
        alertify.error('No hay un tramo activo para asociar los puntos.');
        return;
    }

    try {
        let kmlText = '';

        if (file.name.match(/\.kmz$/i)) {
            // Handle KMZ (ZIP)
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            const kmlFilename = Object.keys(content.files).find(name => name.toLowerCase().endsWith('.kml'));

            if (!kmlFilename) {
                throw new Error('El archivo KMZ no contiene un archivo .kml válido.');
            }

            kmlText = await content.files[kmlFilename].async('string');
        } else {
            // Handle KML (Text)
            kmlText = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }

        // Check XML validity
        if (!kmlText.trim().startsWith('<')) {
            throw new Error('El contenido extraído no es un XML válido.');
        }

        const kmlDoc = new DOMParser().parseFromString(kmlText, 'text/xml');
        const parserError = kmlDoc.getElementsByTagName("parsererror");
        if (parserError.length > 0) {
            throw new Error('Error al analizar la estructura del XML.');
        }

        const geojson = kml(kmlDoc);

        if (!geojson || !geojson.features) {
            throw new Error('No se encontraron datos geográficos válidos.');
        }

        const updates = [];
        const inserts = [];
        let matchedCount = 0;
        let newCount = 0;

        geojson.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const [lon, lat] = feature.geometry.coordinates;
                const name = feature.properties?.name || '';

                const cleanName = name.trim().replace(/\s/g, '').replace(/km/i, '').replace(/m/i, '');
                const meters = convertProgresivaToMeters(cleanName);
                const targetCode = convertMetersToProgresiva(meters);

                if (targetCode) {
                    const zoneStr = progresivaDetails.linea || '18L';
                    const zoneNum = parseInt(zoneStr.match(/\d+/)?.[0] || '18', 10);
                    const utmCoords = fromLatLon(lat, lon, zoneNum);
                    const este = parseFloat(utmCoords.easting.toFixed(2));
                    const norte = parseFloat(utmCoords.northing.toFixed(2));

                    const match = subProgresivas.find(sp => sp.codigo === targetCode);

                    if (match) {
                        updates.push({
                            id: match.id,
                            nombre: match.nombre,
                            lado: match.lado,
                            estratos_perfil: match.estratos_perfil,
                            codigo: match.codigo,
                            descripcion: match.descripcion,
                            estado: match.estado,
                            linea: match.linea,
                            coordenada_este: este,
                            coordenada_norte: norte
                        });
                        matchedCount++;
                    } else {
                        inserts.push({
                            codigo: targetCode,
                            nombre: name || `Progresiva ${formatCodigoForDisplay(targetCode)}`,
                            lado: 'C',
                            estratos_perfil: [],
                            descripcion: 'Importado desde KML',
                            estado: 'activo',
                            linea: zoneStr,
                            coordenada_este: este,
                            coordenada_norte: norte
                        });
                        newCount++;
                    }
                }
            }
        });

        if (updates.length === 0 && inserts.length === 0) {
            alertify.warning('No se encontraron puntos coincidentes o válidos.');
            return;
        }

        alertify.confirm(
            'Confirmar Importación KML/KMZ',
            `Se procesará el archivo: <strong>${file.name}</strong><br/>
         - Actualizaciones: ${matchedCount}<br/>
         - Nuevas Progresivas: ${newCount}<br/><br/>
         ¿Desea continuar?`,
            async () => {
                setIsLoadingAction(true);
                const headers = getAuthHeaders();
                try {
                    let success = 0;
                    for (const u of updates) { await axios.put(`${API_URL}/progresivas/child/${u.id}`, u, { headers }); success++; }
                    for (const i of inserts) {
                        const payload = { ...i, proyecto_id: progresivaDetails.proyecto_id, parent_id: progresivaDetails.id };
                        await axios.post(`${API_URL}/progresivas`, payload, { headers });
                        success++;
                    }
                    alertify.success(`Operación completada: ${success} registros procesados.`);
                    handleViewDetails(progresivaDetails);
                } catch (err) {
                    console.error(err);
                    alertify.error('Error al guardar datos: ' + (err.response?.data?.error || err.message));
                } finally {
                    setIsLoadingAction(false);
                }
            },
            () => { }
        ).set('labels', { ok: 'Procesar', cancel: 'Cancelar' });

    } catch (err) {
        console.error(err);
        alertify.error(`Error procesando archivo: ${err.message}`);
    } finally {
        e.target.value = ''; // Reset input
    }
};
