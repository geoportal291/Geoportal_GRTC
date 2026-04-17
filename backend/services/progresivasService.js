// backend/services/progresivasService.js
const db = require('../conexion'); // Adjust path as needed
const { v4: uuidv4 } = require('uuid');
const ensayosService = require('./ensayosService'); // Importar ensayosService
const suelosNlpService = require('./suelosNlpService'); // Importar NLP Service
const fsp = require('fs').promises;
const kmlService = require('./kmlService'); // NEW: Import kmlService
const { put, del } = require('@vercel/blob');
const AdmZip = require('adm-zip');
const { DOMParser } = require('xmldom');
const path = require('path');
const turf = require('@turf/turf');
const { kml } = require('@tmcw/togeojson');
const utm = require('utm');

// --- HELPERS PARA INTERPOLACIÓN DE COORDENADAS ---
const parseToMeters = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return null;
    let s = String(val).trim().toUpperCase().replace(',', '.');
    // If it contains a hyphen, use only the part after the last hyphen (to ignore parent prefixes like 5676-0100)
    if (s.includes('-')) {
        s = s.split('-').pop();
    }
    const kmMatch = s.match(/(\d+)\+(\d+(\.\d+)?)/);
    if (kmMatch) {
        return parseFloat(kmMatch[1]) * 1000 + parseFloat(kmMatch[2]);
    }
    const clean = s.replace(/[^0-9.]/g, '');
    if (!clean) return null;
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
};

const getKmlTrackData = async (kmlTrazadoId) => {
    if (!kmlTrazadoId) return null;
    const kmlText = await kmlService.getKmlContentById(kmlTrazadoId);
    if (!kmlText) return null;
    try {
        const kmlDoc = new DOMParser().parseFromString(kmlText, 'text/xml');
        const geojson = kml(kmlDoc);
        let track = null;
        let maxLen = 0;
        let points = new Map();

        if (geojson.features) {
            for (const feature of geojson.features) {
                if (feature.geometry.type === 'Point' && feature.properties && feature.properties.name) {
                    const m = parseToMeters(feature.properties.name);
                    if (m !== null) points.set(m, feature.geometry.coordinates);
                } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                    const len = turf.length(feature, { units: 'meters' });
                    if (len > maxLen) {
                        maxLen = len;
                        track = feature;
                    }
                }
            }
        }
        return { track, points };
    } catch (e) {
        console.error('[progresivasService] getKmlTrackData error:', e);
        return null;
    }
};

const interpolateUsingTrack = (trackData, targetMeters, startMeters, utmZoneRaw = null) => {
    if (!trackData) return null;
    if (targetMeters === null || isNaN(targetMeters)) return null;

    let coords = trackData.points.get(targetMeters);
    if (!coords && trackData.track) {
        const distance = Math.max(0, targetMeters - (startMeters || 0));
        try {
            const point = turf.along(trackData.track, distance, { units: 'meters' });
            coords = point.geometry.coordinates;
        } catch (err) {
            console.warn('[interpolateUsingTrack] Turf error:', err.message);
        }
    }

    if (coords) {
        const [lon, lat] = coords;
        try {
            let zNum;
            if (utmZoneRaw && typeof utmZoneRaw === 'string') {
                zNum = parseInt(utmZoneRaw.replace(/[A-Za-z]/g, ''));
            }
            const result = utm.fromLatLon(lat, lon, zNum);
            return {
                este: result.easting,
                norte: result.northing
            };
        } catch (e) {
            console.warn('[interpolateUsingTrack] UTM conversion error:', e);
        }
    }
    return null;
};
// --- FIN DE HELPERS ---

const asegurarColumnas = async (client) => {
    try {
        await client.query(`
            ALTER TABLE estratos 
            ADD COLUMN IF NOT EXISTS nlp_clasificacion_sucs VARCHAR(255),
            ADD COLUMN IF NOT EXISTS nlp_clasificacion_aashto VARCHAR(255),
            ADD COLUMN IF NOT EXISTS nlp_color_hex VARCHAR(50)
        `);
        await client.query(`
            ALTER TABLE progresivas
            ADD COLUMN IF NOT EXISTS fecha_ejecucion DATE,
            ADD COLUMN IF NOT EXISTS elevacion DOUBLE PRECISION DEFAULT 0
        `);
        // Update check constraint to include 'aprobado' and handle typos in 'revisión'
        await client.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'progresivas_estado_check') THEN
                    ALTER TABLE progresivas DROP CONSTRAINT progresivas_estado_check;
                END IF;
                ALTER TABLE progresivas ADD CONSTRAINT progresivas_estado_check 
                CHECK (estado IN ('activo', 'inactivo', 'completado', 'pendiente', 'en revicion', 'en revision', 'aprobado'));
            END $$;
        `);
    } catch (error) {
        console.warn('Advertencia al verificar columnas en DB:', error.message);
    }
};

const importarConEnsayos = async ({ parentProgresiva, generatedChildren, estratosSeleccionados, tiposEnsayoIds }) => {
    if (!parentProgresiva || !generatedChildren || generatedChildren.length === 0) {
        throw new Error('Se requieren los datos de la progresiva principal y las sub-progresivas generadas.');
    }

    const selectedEstratosSet = new Set(estratosSeleccionados || []);
    let client;

    try {
        client = await db.connect();

        let actualTipoEnsayoIds = tiposEnsayoIds || [];

        // Fallback for legacy behavior if no IDs were provided but strata were selected
        if (actualTipoEnsayoIds.length === 0 && selectedEstratosSet.size > 0) {
            const tipoEnsayoGranulometria = await client.query("SELECT id FROM tipo_ensayo WHERE config_key = 'Granulometria'");
            const idG = tipoEnsayoGranulometria.rows[0]?.id;
            const tipoEnsayoLimites = await client.query("SELECT id FROM tipo_ensayo WHERE config_key = 'Límites de Consistencia'");
            const idL = tipoEnsayoLimites.rows[0]?.id;

            if (idG) actualTipoEnsayoIds.push(idG);
            if (idL) actualTipoEnsayoIds.push(idL);

            if (actualTipoEnsayoIds.length === 0) {
                throw new Error('No se encontraron los tipos de ensayo requeridos (G, L) para la creación automática de ensayos.');
            }
        }

        await client.query('BEGIN');

        await asegurarColumnas(client);

        const {
            proyecto_id, codigo, nombre, descripcion, estado, linea,
            longitud_total, tipo_via, intervalo_manual, coordenada_este, coordenada_norte
        } = parentProgresiva;

        const progresiva_inicial_parent = generatedChildren[0].codigo;
        const progresiva_final_parent = generatedChildren[generatedChildren.length - 1].codigo;
        const finalCodigoForParent = codigo || `${nombre.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString(36).slice(-5)}-${uuidv4().slice(0, 3)}`;

        const parentResult = await client.query(`
            INSERT INTO progresivas
            (proyecto_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, longitud_total, tipo_via, intervalo_manual)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id;
        `, [
            proyecto_id, finalCodigoForParent, nombre, descripcion, progresiva_inicial_parent, progresiva_final_parent, estado || 'pendiente',
            coordenada_este, coordenada_norte, linea, longitud_total, tipo_via, intervalo_manual
        ]);
        const parentId = parentResult.rows[0].id;

        // Auto-fill coordinates if we have a KML
        const kmlTrackData = await getKmlTrackData(parentProgresiva.kml_trazado_id);
        const startMeters = parseToMeters(progresiva_inicial_parent);

        for (const prog of generatedChildren) {
            const uniqueSubProgresivaCodigo = `${parentId}-${prog.codigo}`;
            
            let ce = prog.coordenada_este;
            let cn = prog.coordenada_norte;
            
            if ((ce === null || ce === undefined || ce === '') && kmlTrackData) {
                const interp = interpolateUsingTrack(kmlTrackData, parseToMeters(prog.codigo), startMeters, prog.linea || linea);
                if (interp) {
                    ce = interp.este;
                    cn = interp.norte;
                }
            }

            const childResult = await client.query(`
                INSERT INTO progresivas
                (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, lado, fecha_ejecucion)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id
            `, [
                proyecto_id, parentId, uniqueSubProgresivaCodigo, prog.nombre, prog.descripcion, Number(prog.codigo), Number(prog.codigo),
                prog.estado || 'pendiente', ce, cn, prog.linea, prog.lado, prog.fecha_ejecucion || null
            ]);
            const childId = childResult.rows[0].id;

            if (prog.estratos_perfil && prog.estratos_perfil.length > 0) {
                for (const [index, estrato] of prog.estratos_perfil.entries()) {
                    const prof_ini = parseFloat(estrato.profundidad_inicial);
                    const prof_fin = parseFloat(estrato.profundidad_final);

                    if (isNaN(prof_ini) || isNaN(prof_fin)) {
                        const rowNum = prog.excelRowNum || 'desconocida';
                        throw {
                            type: 'ExcelDataValidationError',
                            message: `Fila ${rowNum} del Excel: En el estrato N° ${index + 1} de la progresiva '${prog.nombre}', los valores de profundidad son inválidos o están vacíos.`,
                            details: {
                                excelRow: rowNum,
                                progressiveName: prog.nombre,
                                stratumNumber: index + 1,
                                field: 'profundidad',
                                invalidValueInitial: estrato.profundidad_inicial,
                                invalidValueFinal: estrato.profundidad_final,
                                reason: 'Valores de profundidad inválidos o vacíos.'
                            }
                        };
                    }

                    let clasifSucs = estrato.nlp_clasificacion_sucs || null;
                    let clasifAashto = estrato.nlp_clasificacion_aashto || null;
                    let colorHex = estrato.nlp_color_hex || null;

                    const estratoResult = await client.query(`
                        INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden, nlp_clasificacion_sucs, nlp_clasificacion_aashto, nlp_color_hex)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
                    `, [
                        'progresiva', // parent_type
                        childId,      // parent_id
                        estrato.nombre || estrato.descripcion, // Use estrato.nombre if available, else description
                        estrato.descripcion,
                        prof_ini,
                        prof_fin,
                        index + 1,
                        clasifSucs,
                        clasifAashto,
                        colorHex
                    ]);
                    const newEstratoId = estratoResult.rows[0].id;

                    // Verificar si este estrato fue seleccionado para crear ensayos
                    const estratoKey = `${prog.codigo}-${index}`;
                    if (selectedEstratosSet.has(estratoKey)) {
                        for (const tipoEnsayoId of actualTipoEnsayoIds) {
                            await ensayosService.createBaseEnsayo({
                                estrato_id: newEstratoId,
                                tipo_id: tipoEnsayoId,
                                tipo_ensayo_id: tipoEnsayoId,
                                nombre_ensayo: 'Ensayo (Importado)'
                            }, client);
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        return { status: 'ok', message: 'Progresivas y ensayos creados correctamente', progresivaId: parentId };

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error en importarConEnsayos service:', err.message, err.stack);
        throw err;
    } finally {
        if (client) client.release();
    }
};

const createBulkProgresivas = async (parentProgresiva, generatedChildren) => {
    if (!parentProgresiva || !generatedChildren || generatedChildren.length === 0) {
        throw new Error('Se requieren los datos de la progresiva principal y las sub-progresivas generadas.');
    }

    // Defensive validation to prevent 500 errors from incomplete data
    const requiredFields = ['proyecto_id', 'nombre', 'descripcion', 'estado', 'linea', 'longitud_total', 'tipo_via'];
    for (const field of requiredFields) {
        if (parentProgresiva[field] === null || parentProgresiva[field] === undefined) {
            throw new Error(`Error Interno: El campo '${field}' de la progresiva principal es obligatorio y no fue proporcionado.`);
        }
    }

    if (!parentProgresiva.nombre || parentProgresiva.nombre.trim() === '') {
        throw new Error('El nombre de la progresiva es un campo obligatorio.');
    }

    let client;
    try {
        client = await db.connect();
        await client.query('BEGIN');

        const {
            proyecto_id, codigo, nombre, descripcion, estado, linea,
            longitud_total, tipo_via, intervalo_manual, coordenada_este, coordenada_norte
        } = parentProgresiva;

        // --- Validaciones de Datos ---
        const isNumeric = (val) => val !== null && val !== undefined && val !== '';

        const coordenada_este_numeric = isNumeric(coordenada_este) ? Number(coordenada_este) : null;
        if (isNaN(coordenada_este_numeric)) throw new Error('El valor de "Coordenada Este" no es un número válido.');

        const coordenada_norte_numeric = isNumeric(coordenada_norte) ? Number(coordenada_norte) : null;
        if (isNaN(coordenada_norte_numeric)) throw new Error('El valor de "Coordenada Norte" no es un número válido.');

        const longitud_total_numeric = isNumeric(longitud_total) ? Number(longitud_total) : null;
        if (isNaN(longitud_total_numeric)) throw new Error('El valor de "Longitud Total" no es un número válido.');

        const tipo_via_numeric = isNumeric(tipo_via) ? Number(tipo_via) : null;
        if (isNaN(tipo_via_numeric)) throw new Error('El valor de "Tipo de Vía" no es un número válido.');

        const intervalo_manual_numeric = isNumeric(intervalo_manual) ? Number(intervalo_manual) : null;
        if (isNaN(intervalo_manual_numeric)) throw new Error('El valor de "Intervalo Manual" no es un número válido.');
        // --- Fin de Validaciones ---

        const progresiva_inicial_parent = generatedChildren[0].codigo;
        const progresiva_final_parent = generatedChildren[generatedChildren.length - 1].codigo;
        // Use the provided codigo, or generate if not present (though frontend should provide it now)
        const finalCodigoForParent = codigo || `${nombre.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString(36).slice(-5)}-${uuidv4().slice(0, 3)}`;

        const parentInsertQuery = `
            INSERT INTO progresivas
            (proyecto_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, longitud_total, tipo_via, intervalo_manual)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id;
        `;
        const parentInsertParams = [
            proyecto_id,
            finalCodigoForParent,
            nombre,
            descripcion,
            progresiva_inicial_parent,
            progresiva_final_parent,
            estado || 'pendiente',
            coordenada_este_numeric,
            coordenada_norte_numeric,
            linea,
            longitud_total_numeric,
            tipo_via_numeric,
            intervalo_manual_numeric
        ];

        const parentResult = await client.query(parentInsertQuery, parentInsertParams);
        const parentId = parentResult.rows[0].id;

        // Auto-fill coordinates
        const kmlTrackData = await getKmlTrackData(kml_trazado_id || parentProgresiva.kml_trazado_id);
        const startMeters = parseToMeters(progresiva_inicial_parent);

        for (const prog of generatedChildren) {
            const uniqueSubProgresivaCodigo = `${parentId}-${prog.codigo}`;
            
            let ce = prog.coordenada_este;
            let cn = prog.coordenada_norte;
            
            if ((ce === null || ce === undefined || ce === '') && kmlTrackData) {
                const interp = interpolateUsingTrack(kmlTrackData, parseToMeters(prog.codigo), startMeters, prog.linea || linea);
                if (interp) {
                    ce = interp.este;
                    cn = interp.norte;
                }
            }

            const p_ini = Number(prog.codigo.split('-')[1]) || Number(prog.codigo);
            const p_fin = p_ini;

            await client.query(`
                INSERT INTO progresivas
                (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, fecha_ejecucion)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                proyecto_id,
                parentId,
                uniqueSubProgresivaCodigo,
                prog.nombre,
                prog.descripcion,
                p_ini,
                p_fin,
                prog.estado || 'pendiente',
                ce,
                cn,
                prog.linea,
                prog.fecha_ejecucion || null
            ]);
        }

        await client.query('COMMIT');
        return { status: 'ok', message: 'Progresivas creadas correctamente', progresivaId: parentId };

    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error en createBulkProgresivas service:', err.message, err.stack);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
};

const getProgresivas = async (user, selectedProjectId, includeChildren = false) => {
    try {
        let query = `
            SELECT
                p.id, p.parent_id, p.codigo, COALESCE(p.nombre, '') AS nombre, p.descripcion,
                p.progresiva_inicial, p.progresiva_final,
                p.estado, p.creado_en, p.actualizado_en,
                pr.nombre_tramo AS proyecto_nombre,
                p.coordenada_este, p.coordenada_norte,
                p.linea,
                p.longitud_total,
                p.tipo_via,
                p.intervalo_manual,
                p.proyecto_id,
                p.es_principal,
                p.kml_trazado_id, p.kml_puntos_id, 
                kt.kml_filename, kt.kml_uploaded_at,
                kp.kml_filename AS puntos_kml_filename, kp.kml_uploaded_at AS puntos_kml_uploaded_at,
                (
                    SELECT COALESCE(json_agg(json_build_object('id', e.id)), '[]')
                    FROM estratos e
                    WHERE e.parent_id = p.id AND e.parent_type = 'progresiva'
                ) AS estratos_perfil
            FROM progresivas p
            LEFT JOIN proyectos pr ON p.proyecto_id = pr.id
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
            -- Also fetch KML Points info if present
            LEFT JOIN kml_trazados kp ON p.kml_puntos_id = kp.id
        `;
        const queryParams = [];
        let paramIndex = 1; // Start parameter index for dynamic query

        let whereClauses = [];
        if (!includeChildren) {
            whereClauses.push('p.parent_id IS NULL');
        }

        if (user.rol_nombre !== 'ADMIN') {
            query += `
                JOIN proyecto_usuarios pu ON p.proyecto_id = pu.proyecto_id
            `;
            whereClauses.push(`pu.usuario_id = $${paramIndex}`);
            queryParams.push(user.id);
            paramIndex++;
        }

        if (selectedProjectId) {
            whereClauses.push(`p.proyecto_id = $${paramIndex}`);
            queryParams.push(selectedProjectId);
            paramIndex++;
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        query += `
            ORDER BY p.creado_en DESC
        `;

        console.log('[DEBUG Backend] getProgresivas query params:', { userRole: user.rol_nombre, selectedProjectId, includeChildren });
        // console.log('[DEBUG Backend] getProgresivas SQL:', query);
        // console.log('[DEBUG Backend] getProgresivas Values:', queryParams);

        const result = await db.query(query, queryParams);

        console.log('[DEBUG Backend] getProgresivas returned rows:', result.rows.length);

        // DEBUG: Verificar si estratos_perfil está llegando
        const sample = result.rows.find(r => r.estratos_perfil && r.estratos_perfil.length > 0);
        if (sample) {
            console.log('[DEBUG Backend] getProgresivas found sample with estratos:', sample.id, sample.estratos_perfil);
        } else {
            console.log('[DEBUG Backend] getProgresivas: No records with estratos_perfil found in this batch of ' + result.rows.length);
        }

        return result.rows;
    } catch (err) {
        console.error('Error detallado al obtener progresivas por proyectoId en service:', err);
        throw new Error(`Error al obtener progresivas por proyectoId: ${err.message}`);
    }
};

// --- PAGINATED FUNCTION for "Progresivas" Tab (with Search) ---
const getSubProgresivas = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * limit;

        let countResult;
        let progresivasResult;

        const baseQuery = `
            SELECT
                p.id, p.parent_id, p.proyecto_id, p.codigo, COALESCE(p.nombre, '') AS nombre, p.descripcion,
                p.progresiva_inicial, p.progresiva_final,
                p.estado, p.creado_en, p.actualizado_en,
                p.coordenada_este, p.coordenada_norte,
                p.linea,
                p.lado,
                p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
            FROM progresivas p
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
        `;

        if (searchTerm) {
            const cleanSearchTerm = `%${searchTerm.replace(/\+/g, '')}%`;
            const whereClause = "WHERE p.parent_id = $1 AND REPLACE(p.codigo, '+', '') ILIKE $2";

            countResult = await db.query(`SELECT COUNT(*) FROM progresivas p ${whereClause}`, [Number(id), cleanSearchTerm]);
            progresivasResult = await db.query(`${baseQuery} ${whereClause} ORDER BY p.id ASC LIMIT $3 OFFSET $4`, [Number(id), cleanSearchTerm, limit, offset]);

        } else {
            const whereClause = "WHERE p.parent_id = $1";

            countResult = await db.query(`SELECT COUNT(*) FROM progresivas p ${whereClause}`, [Number(id)]);
            progresivasResult = await db.query(`${baseQuery} ${whereClause} ORDER BY p.id ASC LIMIT $2 OFFSET $3`, [Number(id), limit, offset]);
        }

        const total = parseInt(countResult.rows[0].count, 10);
        const progresivas = progresivasResult.rows;
        const progresivaIds = progresivas.map(p => p.id);

        const estratosResult = await db.query(`
            SELECT
                e.id, e.parent_id AS progresiva_id, e.nombre, e.descripcion, e.cota_inicial AS profundidad_inicial, 
                e.cota_final AS profundidad_final, e.orden, e.nlp_clasificacion_sucs, e.nlp_clasificacion_aashto, e.nlp_color_hex
            FROM estratos e
            WHERE e.parent_type = 'progresiva' AND e.parent_id = ANY($1::int[])
            ORDER BY e.parent_id, e.orden ASC
        `, [progresivaIds]);
        const estratos = estratosResult.rows;
        const estratoIds = estratos.map(e => e.id);

        let ensayosMap = new Map();
        if (estratoIds.length > 0) {
            const ensayosResult = await db.query(`
                SELECT 
                    ens.id,
                    ens.nombre_ensayo,
                    ens.codigo_ensayo,
                    ens.fecha,
                    ens.resultado,
                    ens.estado,
                    ens.tipo_ensayo,
                    ens.estrato_id,
                    ens.datos_formulario,
                    prog.nombre AS progresiva_nombre,
                    prog.coordenada_este,
                    prog.coordenada_norte,
                    est.orden AS estrato_orden,
                    te.descripcion AS tipo_ensayo_descripcion,
                    te.config_key,
                    te.results_config
                FROM ensayos ens
                LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
                LEFT JOIN estratos est ON ens.estrato_id = est.id
                LEFT JOIN progresivas prog ON est.parent_type = 'progresiva' AND est.parent_id = prog.id
                WHERE ens.estrato_id = ANY($1::int[]) 
                ORDER BY ens.fecha DESC
            `, [estratoIds]);
            for (const ensayo of ensayosResult.rows) {
                if (!ensayosMap.has(ensayo.estrato_id)) {
                    ensayosMap.set(ensayo.estrato_id, []);
                }
                ensayosMap.get(ensayo.estrato_id).push(ensayo);
            }
        }

        const estratosConEnsayos = estratos.map(estrato => ({
            ...estrato,
            ensayos: ensayosMap.get(estrato.id) || []
        }));

        const estratosPorProgresivaMap = new Map();
        for (const estrato of estratosConEnsayos) {
            if (!estratosPorProgresivaMap.has(estrato.progresiva_id)) {
                estratosPorProgresivaMap.set(estrato.progresiva_id, []);
            }
            estratosPorProgresivaMap.get(estrato.progresiva_id).push(estrato);
        }

        const data = progresivas.map(p => ({
            ...p,
            estratos_perfil: estratosPorProgresivaMap.get(p.id) || []
        }));

        return res.json({
            total,
            data
        });

    } catch (err) {
        console.error('Error al obtener sub-progresivas paginadas en service:', err);
        return res.status(500).json({ error: 'Error al obtener sub-progresivas.' });
    }
};

// --- NON-PAGINATED FUNCTION for "Listado General" Tab ---
const getAllSubProgresivas = async (req, res) => {
    try {
        const { id } = req.params;

        const progresivasResult = await db.query(`
            SELECT
                p.id, p.parent_id, p.proyecto_id, p.codigo, COALESCE(p.nombre, '') AS nombre, p.descripcion,
                p.progresiva_inicial, p.progresiva_final,
                p.estado, p.creado_en, p.actualizado_en,
                p.coordenada_este, p.coordenada_norte,
                p.linea,
                p.lado,
                p.longitud_total, p.tipo_via, p.intervalo_manual,
                p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
            FROM progresivas p
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
            WHERE p.parent_id = $1
            ORDER BY p.id ASC
        `, [Number(id)]);

        console.log(`[DEBUG Backend] getAllSubProgresivas parent=${id} found=${progresivasResult.rows.length}`);
        if (progresivasResult.rows.length > 0) {
            const sample = progresivasResult.rows[0];
            console.log(`[DEBUG Backend] sample child: id=${sample.id} coords=(${sample.coordenada_este}, ${sample.coordenada_norte})`);
        }

        const progresivas = progresivasResult.rows;
        if (progresivas.length === 0) {
            return res.json([]);
        }
        const progresivaIds = progresivas.map(p => p.id);

        const estratosResult = await db.query(`
            SELECT
                e.id, e.parent_id AS progresiva_id, e.nombre, e.descripcion, e.cota_inicial AS profundidad_inicial, 
                e.cota_final AS profundidad_final, e.orden, e.nlp_clasificacion_sucs, e.nlp_clasificacion_aashto, e.nlp_color_hex
            FROM estratos e
            WHERE e.parent_type = 'progresiva' AND e.parent_id = ANY($1::int[])
            ORDER BY e.parent_id, e.orden ASC
        `, [progresivaIds]);
        const estratos = estratosResult.rows;
        const estratoIds = estratos.map(e => e.id);

        let ensayosMap = new Map();
        if (estratoIds.length > 0) {
            const ensayosResult = await db.query(`
                SELECT 
                    ens.id,
                    ens.nombre_ensayo,
                    ens.codigo_ensayo,
                    ens.fecha,
                    ens.resultado,
                    ens.estado,
                    ens.tipo_ensayo,
                    ens.estrato_id,
                    ens.datos_formulario,
                    prog.nombre AS progresiva_nombre,
                    prog.coordenada_este,
                    prog.coordenada_norte,
                    est.orden AS estrato_orden,
                    te.descripcion AS tipo_ensayo_descripcion,
                    te.config_key,
                    te.results_config
                FROM ensayos ens
                LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
                LEFT JOIN estratos est ON ens.estrato_id = est.id
                LEFT JOIN progresivas prog ON est.parent_type = 'progresiva' AND est.parent_id = prog.id
                WHERE ens.estrato_id = ANY($1::int[]) 
                ORDER BY ens.fecha DESC
            `, [estratoIds]);
            for (const ensayo of ensayosResult.rows) {
                if (!ensayosMap.has(ensayo.estrato_id)) {
                    ensayosMap.set(ensayo.estrato_id, []);
                }
                ensayosMap.get(ensayo.estrato_id).push(ensayo);
            }
        }

        const estratosConEnsayos = estratos.map(estrato => ({
            ...estrato,
            ensayos: ensayosMap.get(estrato.id) || []
        }));

        const estratosPorProgresivaMap = new Map();
        for (const estrato of estratosConEnsayos) {
            if (!estratosPorProgresivaMap.has(estrato.progresiva_id)) {
                estratosPorProgresivaMap.set(estrato.progresiva_id, []);
            }
            estratosPorProgresivaMap.get(estrato.progresiva_id).push(estrato);
        }

        const data = progresivas.map(p => ({
            ...p,
            estratos_perfil: estratosPorProgresivaMap.get(p.id) || []
        }));

        return res.json(data);

    } catch (err) {
        console.error('Error al obtener todas las sub-progresivas en service:', err);
        return res.status(500).json({ error: 'Error al obtener todas las sub-progresivas.' });
    }
};


const getProgresivaById = async (id) => {
    try {
        const result = await db.query(
            `SELECT
                p.*,
                kt.kml_filename, kt.kml_uploaded_at,
                p.kml_puntos_id
            FROM progresivas p
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
            WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const progresiva = result.rows[0];
        const perfilEstratos = await db.query(
            `SELECT 
                id, parent_id AS progresiva_id, nombre, descripcion, cota_inicial AS profundidad_inicial, 
                cota_final AS profundidad_final, orden
            FROM estratos 
            WHERE parent_type = 'progresiva' AND parent_id = $1 
            ORDER BY orden ASC`,
            [progresiva.id]
        );

        return { ...progresiva, estratos_perfil: perfilEstratos.rows };
    } catch (err) {
        console.error('Error al obtener progresiva por ID en service:', err);
        throw new Error('Error al obtener progresiva por ID.');
    }
};

const deleteProgresiva = async (id) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Get all concerned progresivas (parent and its children)
        const progresivaIdsResult = await client.query('SELECT id FROM progresivas WHERE id = $1 OR parent_id = $1', [id]);
        const allAffectedProgIds = progresivaIdsResult.rows.map(r => r.id);

        if (allAffectedProgIds.length > 0) {
            // 2. Find and delete all associated essays (ensayos) to avoid FK violation
            await client.query(`
                DELETE FROM ensayos 
                WHERE estrato_id IN (
                    SELECT id FROM estratos 
                    WHERE parent_type = 'progresiva' AND parent_id = ANY($1::int[])
                )
            `, [allAffectedProgIds]);

            // 3. Delete estratos for all affected progresivas
            await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = ANY($1::int[])', [allAffectedProgIds]);
            
            // 4. Delete child progresivas
            await client.query('DELETE FROM progresivas WHERE parent_id = $1', [id]);
            
            // 5. Delete the parent progresiva itself
            const result = await client.query('DELETE FROM progresivas WHERE id = $1', [id]);
            
            await client.query('COMMIT');
            return result.rowCount;
        }

        await client.query('ROLLBACK');
        return 0;
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error al eliminar progresiva en service:', err);
        throw new Error(`Error al eliminar progresiva: ${err.message}`);
    } finally {
        if (client) {
            client.release();
        }
    }
};

const bulkDeleteProgresivas = async (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('Se requiere un array de IDs para la eliminación masiva.');
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Get all child progresiva IDs
        const subProgresivasToDelete = await client.query('SELECT id FROM progresivas WHERE parent_id = ANY($1::int[])', [ids]);
        const subProgresivaIds = subProgresivasToDelete.rows.map(r => r.id);

        // 2. Combine parent and child IDs to get all affected progresivas
        const allProgresivaIds = [...ids, ...subProgresivaIds];

        // 3. Find all 'estrato' IDs related to these progresivas
        const estratosToDelete = await client.query(
            'SELECT id FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = ANY($1::int[])',
            [allProgresivaIds]
        );
        const estratoIds = estratosToDelete.rows.map(r => r.id);

        // 4. If there are estratos, delete associated ensayos first
        if (estratoIds.length > 0) {
            await client.query('DELETE FROM ensayos WHERE estrato_id = ANY($1::int[])', [estratoIds]);
        }

        // 5. Now it's safe to delete estratos
        if (allProgresivaIds.length > 0) {
            await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = ANY($1::int[])', [allProgresivaIds]);
        }

        // 6. Delete child progresivas
        if (subProgresivaIds.length > 0) {
            await client.query('DELETE FROM progresivas WHERE id = ANY($1::int[])', [subProgresivaIds]);
        }

        // 7. Find and delete canteras associated with the tramos being deleted
        const canterasToDelete = await client.query('SELECT id FROM canteras WHERE tramo_id = ANY($1::int[])', [ids]);
        const canteraIds = canterasToDelete.rows.map(r => r.id);

        if (canteraIds.length > 0) {
            // 7a. Find estratos of these canteras
            const estratosCanterasToDelete = await client.query(
                'SELECT id FROM estratos WHERE parent_type = \'cantera\' AND parent_id = ANY($1::int[])',
                [canteraIds]
            );
            const estratoCanteraIds = estratosCanterasToDelete.rows.map(r => r.id);

            // 7b. Delete ensayos of these estratos
            if (estratoCanteraIds.length > 0) {
                await client.query('DELETE FROM ensayos WHERE estrato_id = ANY($1::int[])', [estratoCanteraIds]);
            }

            // 7c. Delete estratos of these canteras
            await client.query('DELETE FROM estratos WHERE parent_type = \'cantera\' AND parent_id = ANY($1::int[])', [canteraIds]);

            // 7d. Delete the canteras themselves
            await client.query('DELETE FROM canteras WHERE id = ANY($1::int[])', [canteraIds]);
        }

        // 8. Finally, delete the parent progresivas (tramos)
        const result = await client.query('DELETE FROM progresivas WHERE id = ANY($1::int[])', [ids]);

        await client.query('COMMIT');
        return result.rowCount;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar progresivas en bulk en service:', err);
        throw err; // Re-throw the original error to preserve details
    } finally {
        if (client) {
            client.release();
        }
    }
};

const updateProgresiva = async (id, progresivaData) => {

    const {
        nombre, descripcion, estado, coordenada_este, coordenada_norte, linea, longitud_total, tipo_via, intervalo_manual, proyecto_id,
        kml_trazado_id, // <-- AÑADIDO
        generatedChildren = []
    } = progresivaData;

    if (!nombre || !estado) {
        throw new Error('Nombre y estado son requeridos para actualizar la progresiva.');
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await asegurarColumnas(client);

        // Fetch current data to preserve some fields if they are missing in the payload
        const existingRes = await client.query('SELECT kml_trazado_id, kml_puntos_id, codigo FROM progresivas WHERE id = $1', [id]);
        const existing = existingRes.rows[0] || {};

        const finalKmlTrazadoId = kml_trazado_id !== undefined ? kml_trazado_id : existing.kml_trazado_id;
        const finalKmlPuntosId = progresivaData.kml_puntos_id !== undefined ? progresivaData.kml_puntos_id : existing.kml_puntos_id;
        const finalCodigo = progresivaData.codigo || existing.codigo;

        const updateResult = await client.query(`
            UPDATE progresivas SET
                nombre = $1,
                descripcion = $2,
                estado = $3,
                coordenada_este = $4,
                coordenada_norte = $5,
                linea = $6,
                longitud_total = $7,
                tipo_via = $8,
                intervalo_manual = $9,
                proyecto_id = $10,
                kml_trazado_id = $11,
                kml_puntos_id = $12,
                codigo = $13,
                actualizado_en = NOW()
            WHERE id = $14
        `, [
            nombre, descripcion, estado, coordenada_este, coordenada_norte, linea, longitud_total,
            tipo_via, intervalo_manual, proyecto_id, finalKmlTrazadoId, finalKmlPuntosId, finalCodigo, id
        ]);
        console.log(`[DEBUG updateProgresiva] Parent Update Success - ID: ${id}, RowCount: ${updateResult.rowCount}`);


        // 1. Obtener progresivas hijas existentes
        const existingChildrenResult = await client.query(`
            SELECT
                p.id, p.codigo, p.nombre, p.descripcion, p.progresiva_inicial, p.progresiva_final,
                p.estado, p.coordenada_este, p.coordenada_norte, p.linea, p.lado
            FROM progresivas p
            WHERE parent_id = $1
            ORDER BY id ASC
        `, [id]);

        const existingChildren = existingChildrenResult.rows;
        const existingChildrenMap = new Map(existingChildren.map(child => [child.id, child]));

        // Auto-fill coordinates
        const kmlTrackData = await getKmlTrackData(finalKmlTrazadoId);
        const startRes = await client.query('SELECT progresiva_inicial FROM progresivas WHERE id = $1', [id]);
        const startMeters = startRes.rows[0] ? Number(startRes.rows[0].progresiva_inicial) : 0;

        // 2. Crear mapa de children generados y sincronizar SOLO SI se proporcionan
        const childrenToKeepIds = new Set();
        if (generatedChildren !== undefined && Array.isArray(generatedChildren)) {
            console.log(`[DEBUG] updateProgresiva: Sincronizando ${generatedChildren.length} hijos.`);
            const generatedChildrenMap = new Map();
            for (const genChild of generatedChildren) {
                generatedChildrenMap.set((genChild.id !== undefined && genChild.id !== null) ? Number(genChild.id) : genChild.codigo, genChild);
            }

            // 3. Recorrer los children del frontend
            for (const prog of generatedChildren) {
            const childId = prog.id;
            const isExistingChild = existingChildrenMap.has(childId);
            let currentChildDbId;

            let ce = prog.coordenada_este;
            let cn = prog.coordenada_norte;
            console.log(`[DEBUG updateProgresiva] Child ${prog.id || prog.codigo} - IN Coords: (${ce}, ${cn})`);
            
            if ((ce === null || ce === undefined || ce === '') && kmlTrackData) {
                const interp = interpolateUsingTrack(kmlTrackData, parseToMeters(prog.codigo || prog.progresiva_inicial), startMeters, prog.linea || linea);
                if (interp) {
                    ce = interp.este;
                    cn = interp.norte;
                    console.log(`[DEBUG updateProgresiva] Child ${prog.id || prog.codigo} - INTERPOLATED Coords: (${ce}, ${cn})`);
                }
            }

            if (isExistingChild) {
                await client.query(`
                    UPDATE progresivas SET
                        nombre = $1,
                        descripcion = $2,
                        progresiva_inicial = $3,
                        progresiva_final = $4,
                        estado = $5,
                        coordenada_este = $6,
                        coordenada_norte = $7,
                        linea = $8,
                        lado = $9,
                        actualizado_en = NOW()
                    WHERE id = $10
                `, [
                    prog.nombre,
                    prog.descripcion,
                    prog.progresiva_inicial,
                    prog.progresiva_final,
                    prog.estado || 'pendiente',
                    ce,
                    cn,
                    prog.linea,
                    prog.lado,
                    childId
                ]);
                currentChildDbId = childId;
                childrenToKeepIds.add(childId);

            } else {
                const childInsertResult = await client.query(`
                    INSERT INTO progresivas
                    (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, lado)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING id
                `, [
                    proyecto_id,
                    id,
                    `${id}-${prog.codigo}`,
                    prog.nombre,
                    prog.descripcion,
                    prog.progresiva_inicial,
                    prog.progresiva_final,
                    prog.estado || 'pendiente',
                    ce,
                    cn,
                    prog.linea,
                    prog.lado
                ]);
                currentChildDbId = childInsertResult.rows[0].id;
                childrenToKeepIds.add(currentChildDbId);
            }

            // --- Estratos ---
            if (prog.estratos_perfil !== undefined) {
                console.log(`[DEBUG] updateProgresiva: Sincronizando estratos para hija ${currentChildDbId}`);
                const existingEstratosResult = await client.query(`
                    SELECT id, nombre, descripcion, cota_inicial, cota_final, orden
                    FROM estratos
                    WHERE parent_type = 'progresiva' AND parent_id = $1
                    ORDER BY orden ASC
                `, [currentChildDbId]);

                const existingEstratos = existingEstratosResult.rows;
                const existingEstratosMap = new Map(existingEstratos.map(e => [Number(e.id), e]));
                const estratosToKeepIds = new Set();

                if (Array.isArray(prog.estratos_perfil)) {
                    for (const [index, estrato] of prog.estratos_perfil.entries()) {
                        const rawEstratoId = estrato.id;
                        const estratoId = (rawEstratoId !== undefined && rawEstratoId !== null && rawEstratoId !== '') ? Number(rawEstratoId) : null;
                        const isExistingEstrato = (estratoId !== null && !isNaN(estratoId)) && existingEstratosMap.has(estratoId);

                        const prof_ini = parseFloat(estrato.profundidad_inicial || estrato.cota_inicial);
                        const prof_fin = parseFloat(estrato.profundidad_final || estrato.cota_final);

                        if (isNaN(prof_ini) || isNaN(prof_fin)) {
                            throw { type: 'ExcelDataValidationError', message: `Profundidad inválida en estrato ${estrato.nombre || estrato.descripcion} de progresiva ${prog.nombre}` };
                        }

                        if (isExistingEstrato) {
                            await client.query(`
                                UPDATE estratos SET
                                    nombre = $1, descripcion = $2, cota_inicial = $3, cota_final = $4, orden = $5
                                WHERE id = $6
                            `, [
                                estrato.nombre || estrato.descripcion,
                                estrato.descripcion,
                                prof_ini,
                                prof_fin,
                                index + 1,
                                estratoId
                            ]);
                            estratosToKeepIds.add(estratoId);
                        } else {
                            const newEstratoResult = await client.query(`
                                INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden)
                                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
                            `, [
                                'progresiva',
                                currentChildDbId,
                                estrato.nombre || estrato.descripcion,
                                estrato.descripcion,
                                prof_ini,
                                prof_fin,
                                index + 1
                            ]);
                            estratosToKeepIds.add(newEstratoResult.rows[0].id);
                        }
                    }
                }

                // --- Eliminar estratos obsoletos ---
                for (const existingEstrato of existingEstratos) {
                    const eId = Number(existingEstrato.id);
                    if (!estratosToKeepIds.has(eId)) {
                        // Crucial: delete essays before estratos to avoid FK violation
                        console.log(`[DEBUG] updateProgresiva: Eliminando estrato obsoleto ID ${eId}`);
                        await client.query('DELETE FROM ensayos WHERE estrato_id = $1', [eId]);
                        await client.query('DELETE FROM estratos WHERE id = $1', [eId]);
                    }
                }
            } else {
                 console.log(`[DEBUG] updateProgresiva: No se recibió 'estratos_perfil' para la hija ${currentChildDbId}. Omitiendo sincronización.`);
            }
            }

        // --- Eliminar progresivas hijas que ya no existen ---
        for (const existingChild of existingChildren) {
            if (!childrenToKeepIds.has(existingChild.id)) {
                // Child is being removed. Before deleting its estratos, we must delete its essays
                await client.query('DELETE FROM ensayos WHERE estrato_id IN (SELECT id FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = $1)', [existingChild.id]);
                await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = $1', [existingChild.id]);
                await client.query('DELETE FROM progresivas WHERE id = $1', [existingChild.id]);
            }
            }
        } else {
            console.log(`[DEBUG] updateProgresiva: No se recibió 'generatedChildren'. Omitiendo sincronización de hijos.`);
        }

        // --- Confirmar transacción ---
        await client.query('COMMIT');

        return { status: 'ok', message: 'Progresiva actualizada correctamente' };

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('[DEBUG] updateProgresiva: Error en el servicio:', err.message, err.stack);
        throw new Error(`Error al actualizar la progresiva: ${err.message}`);
    } finally {
        if (client) client.release();
    }
};


const updateChildProgresiva = async (id, progresivaData) => {
    console.log(`[DEBUG] updateChildProgresiva ID: ${id}, Payload:`, JSON.stringify(progresivaData));
    const {
        nombre, descripcion, estado, coordenada_este, coordenada_norte, estratos_perfil, linea, lado, fecha_ejecucion
    } = progresivaData;

    if (!nombre || !estado) {
        throw new Error('Nombre y estado son requeridos para actualizar la progresiva.');
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await asegurarColumnas(client);

        console.log(`[DEBUG] updateChildProgresiva: Actualizando campos de progresiva ID ${id}`);
        await client.query(`
            UPDATE progresivas SET
                nombre = $1,
                descripcion = $2,
                estado = $3,
                coordenada_este = $4,
                coordenada_norte = $5,
                linea = $6,
                lado = $7,
                fecha_ejecucion = $8,
                actualizado_en = NOW()
            WHERE id = $9
        `, [
            nombre,
            descripcion,
            estado,
            (coordenada_este === '' || coordenada_este === null || coordenada_este === undefined) ? null : Number(coordenada_este),
            (coordenada_norte === '' || coordenada_norte === null || coordenada_norte === undefined) ? null : Number(coordenada_norte),
            linea,
            lado,
            fecha_ejecucion || null,
            id
        ]);

        // --- Sincronizar estratos SOLO SI se proporcionan en el body ---
        if (estratos_perfil !== undefined) {
            // Get existing estratos for this child
            console.log(`[DEBUG] updateChildProgresiva: Obteniendo estratos actuales para ID ${id}`);
            const existingEstratosResult = await client.query(`
                SELECT id, nombre, descripcion, cota_inicial, cota_final, orden
                FROM estratos
                WHERE parent_type = 'progresiva' AND parent_id = $1
                ORDER BY orden ASC
            `, [id]);
            const existingEstratos = existingEstratosResult.rows;
            const existingEstratosMap = new Map(existingEstratos.map(e => [e.id, e]));
            const estratosToKeepIds = new Set();
            console.log(`[DEBUG] updateChildProgresiva: Encontrados ${existingEstratos.length} estratos existentes.`);

            if (Array.isArray(estratos_perfil)) {
                console.log(`[DEBUG] updateChildProgresiva: Procesando ${estratos_perfil.length} estratos del perfil.`);
                for (const [index, estrato] of estratos_perfil.entries()) {
                    const rawEstratoId = estrato.id;
                    const estratoId = (rawEstratoId !== undefined && rawEstratoId !== null && rawEstratoId !== '') ? Number(rawEstratoId) : null;
                    const isExistingEstrato = (estratoId !== null && !isNaN(estratoId)) && existingEstratosMap.has(estratoId);

                    console.log(`[DEBUG] updateChildProgresiva: Estrato index ${index}, ID original: ${rawEstratoId}, ID numérico: ${estratoId}, Existe en BD: ${isExistingEstrato}`);

                    const prof_ini = parseFloat(estrato.profundidad_inicial || estrato.cota_inicial);
                    const prof_fin = parseFloat(estrato.profundidad_final || estrato.cota_final);

                    if (isNaN(prof_ini) || isNaN(prof_fin)) {
                        console.error(`[DEBUG] updateChildProgresiva: Profundidad inválida para el estrato index ${index}`, estrato);
                        throw new Error(`Valores de profundidad inválidos para el estrato ${estrato.nombre || estrato.descripcion}`);
                    }

                    if (isExistingEstrato) {
                        console.log(`[DEBUG] updateChildProgresiva: Actualizando estrato ID ${estratoId}`);
                        await client.query(`
                            UPDATE estratos SET
                                nombre = $1, descripcion = $2, cota_inicial = $3, cota_final = $4, orden = $5
                            WHERE id = $6
                        `, [
                            estrato.nombre || estrato.descripcion,
                            estrato.descripcion,
                            prof_ini,
                            prof_fin,
                            index + 1,
                            estratoId
                        ]);
                        estratosToKeepIds.add(estratoId);
                    } else {
                        console.log(`[DEBUG] updateChildProgresiva: Insertando nuevo estrato`);
                        const newEstratoResult = await client.query(`
                            INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden)
                            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
                        `, [
                            'progresiva',
                            id,
                            estrato.nombre || estrato.descripcion,
                            estrato.descripcion,
                            prof_ini,
                            prof_fin,
                            index + 1
                        ]);
                        estratosToKeepIds.add(newEstratoResult.rows[0].id);
                    }
                }
            }

            // --- Eliminar estratos obsoletos ---
            for (const existingEstrato of existingEstratos) {
                if (!estratosToKeepIds.has(existingEstrato.id)) {
                    console.log(`[DEBUG] updateChildProgresiva: Eliminando estrato obsoleto ID ${existingEstrato.id} y sus ensayos.`);
                    // Delete assays first because of FK constraints
                    await client.query('DELETE FROM ensayos WHERE estrato_id = $1', [existingEstrato.id]);
                    await client.query('DELETE FROM estratos WHERE id = $1', [existingEstrato.id]);
                }
            }
        } else {
            console.log(`[DEBUG] updateChildProgresiva: No se recibió 'estratos_perfil'. Ignorando sincronización de estratos para no borrar datos.`);
        }

        await client.query('COMMIT');
        return { status: 'ok', message: 'Progresiva actualizada correctamente' };

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error al actualizar progresiva hija en service:', err);
        throw new Error(`Error al actualizar la progresiva hija: ${err.message}`);
    } finally {
        if (client) {
            client.release();
        }
    }
};

const getProgresivaPage = async (progresivaId, itemsPerPage = 10) => {
    try {
        const result = await db.query(
            `WITH ranked_progresivas AS (
                SELECT 
                    id, 
                    parent_id,
                    ROW_NUMBER() OVER(PARTITION BY parent_id ORDER BY id) as rn
                FROM progresivas 
                WHERE parent_id = (SELECT parent_id FROM progresivas WHERE id = $1) 
                    AND id <= $1 -- Only consider progresivas up to the current one
            )
            SELECT rn FROM ranked_progresivas WHERE id = $1`,
            [progresivaId]
        );

        if (result.rows.length === 0) {
            // If not found, it might be a parent progresiva or an error
            return { page: 1 };
        }

        const rank = result.rows[0].rn;
        const page = Math.ceil(rank / itemsPerPage);
        return { page };

    } catch (err) {
        console.error('Error al obtener la página de la progresiva:', err);
        throw new Error('Error al calcular la página de la progresiva.');
    }
};

const getProgresivasByProyectoId = async (proyectoId) => {
    try {
        // Step 1: Fetch all child progresivas for the project
        const progresivasResult = await db.query(`
            SELECT
                p.id, p.codigo, p.nombre, p.descripcion, p.estado, 
                p.lado, p.coordenada_este, p.coordenada_norte, p.linea,
                p.progresiva_inicial, p.parent_id
            FROM progresivas p
            WHERE p.proyecto_id = $1
            AND p.parent_id IS NOT NULL -- Only child progresivas
            ORDER BY p.id ASC
        `, [proyectoId]);

        const progresivas = progresivasResult.rows;
        if (progresivas.length === 0) {
            return [];
        }
        const progresivaIds = progresivas.map(p => p.id);

        // Step 2: Fetch all associated estratos in one query
        const estratosResult = await db.query(`
            SELECT
                e.id, e.parent_id AS progresiva_id, e.nombre, e.descripcion, e.cota_inicial, e.cota_final, e.orden, e.nlp_clasificacion_sucs, e.nlp_clasificacion_aashto, e.nlp_color_hex
            FROM estratos e
            WHERE e.parent_type = 'progresiva' AND e.parent_id = ANY($1::int[])
        `, [progresivaIds]);

        // Step 3: Map estratos to their parent progresiva
        const estratosMap = new Map();
        for (const estrato of estratosResult.rows) {
            if (!estratosMap.has(estrato.progresiva_id)) {
                estratosMap.set(estrato.progresiva_id, []);
            }
            estratosMap.get(estrato.progresiva_id).push(estrato);
        }

        // Step 4: Combine progresivas with their estratos
        const data = progresivas.map(p => ({
            ...p,
            estratos_perfil: estratosMap.get(p.id) || []
        }));

        return data;

    } catch (err) {
        console.error('Error detallado al obtener progresivas por proyectoId en service:', err);
        throw new Error(`Error al obtener progresivas por proyectoId: ${err.message}`);
    }
};



const getParentProgresivasByProyectoId = async (id_proyecto) => {

    if (!id_proyecto) {

        throw new Error('El ID del proyecto es requerido.');

    }

    try {

        const query = `

                        SELECT

                            p.id, p.codigo, p.nombre,

                            p.kml_trazado_id, p.kml_puntos_id, kt.kml_filename, kt.kml_uploaded_at

                        FROM progresivas p

                        LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id

                        WHERE p.proyecto_id = $1
             AND p.parent_id IS NULL -- Only parent progresivas (tramos)

                        ORDER BY p.codigo ASC;

        `;

        const result = await db.query(query, [id_proyecto]);

        return result.rows;

    } catch (err) {

        console.error('Error detallado al obtener tramos por proyectoId en service:', err);

        throw new Error(`Error al obtener tramos por proyectoId: ${err.message}`);

    }

};

const getTramosByUserId = async (user, projectId) => {
    const { id: userId, rol_nombre: userRole } = user;

    if (!userId || !projectId) {
        throw new Error('User and Project ID are required');
    }

    try {
        let query;
        const params = [projectId];

        if (userRole === 'ADMIN') {
            query = `
                SELECT DISTINCT
                    p.id, p.codigo, p.nombre, p.proyecto_id,
                    p.kml_trazado_id, p.kml_puntos_id, kt.kml_filename, kt.kml_uploaded_at
                FROM progresivas p
                LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
                WHERE p.parent_id IS NULL
                AND p.proyecto_id = $1
                ORDER BY p.nombre;
            `;
        } else {
            query = `
                SELECT DISTINCT
                    p.id, p.codigo, p.nombre, p.proyecto_id,
                    p.kml_trazado_id, p.kml_puntos_id, kt.kml_filename, kt.kml_uploaded_at
                FROM progresivas p
                JOIN proyecto_usuarios pu ON p.proyecto_id = pu.proyecto_id
                LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
                WHERE p.parent_id IS NULL
                AND pu.usuario_id = $1
                AND p.proyecto_id = $2
                ORDER BY p.nombre;
            `;
            params.unshift(userId); // Add userId to the beginning of params for the non-admin query
        }

        const result = await db.query(query, params);
        return result.rows;
    } catch (err) {
        console.error('Error in getTramosByUserId service:', err);
        throw new Error('Error al obtener los tramos del usuario.');
    }
};

const uploadKmlToProgresiva = async (progresivaId, file, userId, type = 'trazado') => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Create KML Trazado using kmlService
        const kmlTrazado = await kmlService.createKmlTrazado(file, userId);
        const newKmlTrazadoId = kmlTrazado.id;

        // 2. Update progresiva with properly column based on type
        let columnToUpdate = 'kml_trazado_id';
        if (type === 'puntos') {
            columnToUpdate = 'kml_puntos_id';
        }

        const query = `
             UPDATE progresivas
             SET ${columnToUpdate} = $1, actualizado_en = NOW()
             WHERE id = $2
             RETURNING id, kml_trazado_id, kml_puntos_id;`;

        const result = await client.query(query, [newKmlTrazadoId, progresivaId]);
        console.log(`[DEBUG] Associated KML ${newKmlTrazadoId} with Progresiva ${progresivaId}. Type column: ${columnToUpdate}. Rows updated: ${result.rowCount}`);

        if (result.rows.length === 0) {
            const error = new Error('Progresiva no encontrada para actualizar el KML.');
            error.statusCode = 404;
            error.isCustomError = true;
            throw error;
        }

        await client.query('COMMIT');
        return {
            status: 'ok',
            message: 'KML cargado y asociado a la progresiva correctamente.',
            progresiva: {
                id: result.rows[0].id,
                kml_trazado_id: result.rows[0].kml_trazado_id,
                kml_puntos_id: result.rows[0].kml_puntos_id,
                kml_filename: kmlTrazado.kml_filename,
                kml_uploaded_at: kmlTrazado.kml_uploaded_at
            }
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en uploadKmlToProgresiva service:', err.message, err.stack);
        // Re-throw custom errors from kmlService directly
        if (err.isCustomError) {
            throw err;
        }
        throw new kmlService.KmlServiceError('Error interno del servidor al subir KML a la progresiva.', 500);
    } finally {
        if (client) {
            client.release();
        }
        // Clean up the temporary file if it exists
        if (file && file.path) {
            try {
                await fsp.unlink(file.path);
            } catch (unlinkErr) {
                console.error(`Error al eliminar el archivo temporal ${file.path}:`, unlinkErr);
            }
        }
    }
};

const updateAndImportConEnsayos = async (progresivaId, { parentProgresiva, generatedChildren, estratosSeleccionados, tiposEnsayoIds }) => {


    if (!generatedChildren || !Array.isArray(generatedChildren) || generatedChildren.length === 0) {
        throw new Error("Se requieren sub-progresivas generadas (generatedChildren) para la importación y el array no puede estar vacío.");
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await asegurarColumnas(client);

        // 1. Delete old children and strata
        const existingChildren = await client.query('SELECT id FROM progresivas WHERE parent_id = $1', [progresivaId]);
        const existingChildIds = existingChildren.rows.map(row => row.id);
        if (existingChildIds.length > 0) {
            await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = ANY($1::int[])', [existingChildIds]);
            await client.query('DELETE FROM progresivas WHERE parent_id = $1', [progresivaId]);
        }

        // 2. Fetch existing parent to preserve some data (like KML IDs) if not provided
        const existingParentResult = await client.query('SELECT kml_trazado_id, kml_puntos_id, codigo FROM progresivas WHERE id = $1', [progresivaId]);
        const existingParent = existingParentResult.rows[0] || {};

        // 3. Update parent progresiva
        const {
            nombre, descripcion, estado, linea,
            longitud_total, tipo_via, intervalo_manual, coordenada_este, coordenada_norte,
            kml_trazado_id, kml_puntos_id, // <-- AÑADIDO
            codigo // <-- AÑADIDO para preservar si no viene en el excel
        } = parentProgresiva;

        const finalKmlTrazadoId = kml_trazado_id !== undefined ? kml_trazado_id : existingParent.kml_trazado_id;
        const finalKmlPuntosId = kml_puntos_id !== undefined ? kml_puntos_id : existingParent.kml_puntos_id;
        const finalCodigo = codigo || existingParent.codigo;

        const progresiva_inicial_parent = generatedChildren[0].codigo;
        const progresiva_final_parent = generatedChildren[generatedChildren.length - 1].codigo;
        const lineaIntParent = linea ? parseInt(linea, 10) : null;
        if (linea && isNaN(lineaIntParent)) {
            throw new Error(`El valor de linea para el tramo principal '${linea}' no es un número válido.`);
        }

        await client.query(`
            UPDATE progresivas SET
                nombre = $1, descripcion = $2, estado = $3, linea = $4, longitud_total = $5, tipo_via = $6,
                intervalo_manual = $7, coordenada_este = $8, coordenada_norte = $9, actualizado_en = NOW(),
                progresiva_inicial = $10, progresiva_final = $11, kml_trazado_id = $12, kml_puntos_id = $13,
                codigo = $14
            WHERE id = $15
        `, [
            nombre, descripcion, estado, lineaIntParent, longitud_total, tipo_via, intervalo_manual, 
            coordenada_este, coordenada_norte, progresiva_inicial_parent, progresiva_final_parent, 
            finalKmlTrazadoId, finalKmlPuntosId, finalCodigo, progresivaId
        ]);

        // 3. Insert new children, strata, and assays
        const selectedEstratosSet = new Set(estratosSeleccionados || []);
        
        // Auto-fill coordinates
        const kmlTrackData = await getKmlTrackData(finalKmlTrazadoId);
        const startMeters = parseToMeters(progresiva_inicial_parent);

        for (const prog of generatedChildren) {
            const uniqueSubProgresivaCodigo = `${progresivaId}-${prog.codigo}`;
            const lineaIntChild = prog.linea ? parseInt(prog.linea, 10) : null;
            if (prog.linea && isNaN(lineaIntChild)) {
                throw new Error(`El valor de linea para la progresiva hija '${prog.codigo}' no es un número válido.`);
            }

            let ce = prog.coordenada_este;
            let cn = prog.coordenada_norte;
            
            if ((ce === null || ce === undefined || ce === '') && kmlTrackData) {
                const interp = interpolateUsingTrack(kmlTrackData, parseToMeters(prog.codigo), startMeters, prog.linea || linea);
                if (interp) {
                    ce = interp.este;
                    cn = interp.norte;
                }
            }

            const childResult = await client.query(`
                INSERT INTO progresivas
                (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, lado, fecha_ejecucion)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id
            `, [
                parentProgresiva.proyecto_id, progresivaId, uniqueSubProgresivaCodigo, prog.nombre, prog.descripcion, parseInt(prog.codigo, 10), parseInt(prog.codigo, 10),
                prog.estado || 'pendiente', ce, cn, lineaIntChild, prog.lado, prog.fecha_ejecucion || null
            ]);
            const childId = childResult.rows[0].id;

            if (prog.estratos_perfil && prog.estratos_perfil.length > 0) {
                for (const [index, estrato] of prog.estratos_perfil.entries()) {
                    const prof_ini = parseFloat(estrato.profundidad_inicial);
                    const prof_fin = parseFloat(estrato.profundidad_final);
                    if (isNaN(prof_ini) || isNaN(prof_fin)) {
                        throw { type: 'ExcelDataValidationError', message: `Profundidad inválida en progresiva ${prog.nombre}` };
                    }
                    let clasifSucs = estrato.nlp_clasificacion_sucs || null;
                    let clasifAashto = estrato.nlp_clasificacion_aashto || null;
                    let colorHex = estrato.nlp_color_hex || null;

                    const estratoResult = await client.query(`
                        INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden, nlp_clasificacion_sucs, nlp_clasificacion_aashto, nlp_color_hex)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
                    `, [
                        'progresiva', childId, estrato.nombre || estrato.descripcion, estrato.descripcion, prof_ini, prof_fin, index + 1, clasifSucs, clasifAashto, colorHex
                    ]);
                    const newEstratoId = estratoResult.rows[0].id;
                    const estratoKey = `${prog.codigo}-${index}`;

                    // DYNAMIC ASSAY CREATION
                    if (selectedEstratosSet.has(estratoKey) && tiposEnsayoIds && tiposEnsayoIds.length > 0) {
                        for (const tipoEnsayoId of tiposEnsayoIds) {
                            await ensayosService.createBaseEnsayo({
                                estrato_id: newEstratoId,
                                tipo_ensayo_id: tipoEnsayoId,
                                // El nombre se puede mejorar o hacer dinámico si es necesario
                                nombre_ensayo: 'Ensayo (Auto)'
                            }, client);
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        return { status: 'ok', message: 'Tramo actualizado e importado correctamente', progresivaId: progresivaId };

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error en updateAndImportConEnsayos service:', err.message, err.stack);
        throw err;
    } finally {
        if (client) client.release();
    }
};


const deleteKmlFromProgresiva = async (progresivaId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Get kml_trazado_id from the progresiva
        const progresivaResult = await client.query(
            `SELECT kml_trazado_id FROM progresivas WHERE id = $1`,
            [progresivaId]
        );

        if (progresivaResult.rows.length === 0) {
            const error = new Error('Progresiva no encontrada.');
            error.statusCode = 404;
            error.isCustomError = true;
            throw error;
        }

        const kmlTrazadoId = progresivaResult.rows[0].kml_trazado_id;

        if (!kmlTrazadoId) {
            // No KML associated, nothing to delete
            await client.query('COMMIT');
            return { status: 'ok', message: 'No hay KML asociado a esta progresiva.' };
        }

        // 2. Update progresiva to set kml_trazado_id to NULL
        await client.query(
            `UPDATE progresivas SET kml_trazado_id = NULL, actualizado_en = NOW() WHERE id = $1`,
            [progresivaId]
        );

        // 3. Delete KML Trazado using kmlService
        await kmlService.deleteKmlTrazado(kmlTrazadoId);

        await client.query('COMMIT');
        return { status: 'ok', message: 'KML eliminado correctamente de la progresiva.' };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en deleteKmlFromProgresiva service:', err.message, err.stack);
        if (err.isCustomError) {
            throw err;
        }
        throw new Error('Error interno del servidor al eliminar KML de la progresiva.');
    } finally {
        if (client) {
            client.release();
        }
    }
};


// --- MANEJO DE IMAGENES Y DOCX ---

const uploadImage = async (file, userId) => {
    // Check ENV
    if (!process.env.BLOB_READ_WRITE_TOKEN_SUELOS && !process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("Falta configurar BLOB_READ_WRITE_TOKEN_SUELOS en variables de entorno.");
    }
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN_SUELOS || process.env.BLOB_READ_WRITE_TOKEN;

    const { url } = await put(`progresivas/${userId}/${file.originalname}`, file.buffer, {
        access: 'public',
        token: blobToken
    });
    return url;
};

const addImagenToProgresiva = async (progresivaId, imagenUrl, descripcion, nombreArchivo) => {
    const query = `
        INSERT INTO progresiva_imagenes (progresiva_id, imagen_url, descripcion, nombre_archivo)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const res = await db.query(query, [progresivaId, imagenUrl, descripcion, nombreArchivo]);
    return res.rows[0];
};

const getImagenesByProgresivaId = async (progresivaId) => {
    const query = `SELECT * FROM progresiva_imagenes WHERE progresiva_id = $1 ORDER BY created_at DESC`;
    const res = await db.query(query, [progresivaId]);
    return res.rows;
};

const deleteImagenProgresiva = async (imagenId) => {
    // Primero obtener URL para borrar del blob
    const imgQuery = 'SELECT imagen_url FROM progresiva_imagenes WHERE id = $1';
    const imgRes = await db.query(imgQuery, [imagenId]);

    if (imgRes.rows.length === 0) throw new Error('Imagen no encontrada');
    const { imagen_url } = imgRes.rows[0];

    // Borrar de Vercel Blob (si es posible, requiere token)
    try {
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN_SUELOS || process.env.BLOB_READ_WRITE_TOKEN;
        if (blobToken) await del(imagen_url, { token: blobToken });
    } catch (e) {
        console.warn("No se pudo borrar del blob, posiblemente ya borrado o sin permisos:", e.message);
    }

    // Borrar de DB
    await db.query('DELETE FROM progresiva_imagenes WHERE id = $1', [imagenId]);
    return { status: 'ok', id: imagenId };
};

const processDocxUpload = async (docFile, tramoId, userId) => {
    // 1. Unzip
    const zip = new AdmZip(docFile.buffer);

    // 2. Parse rels to map rId -> filename
    const relsEntry = zip.getEntry('word/_rels/document.xml.rels');
    if (!relsEntry) throw new Error('No se encontró document.xml.rels en el DOCX');

    const relsXml = relsEntry.getData().toString('utf8');
    const relsDoc = new DOMParser().parseFromString(relsXml, 'text/xml');
    const relationships = relsDoc.getElementsByTagName('Relationship');

    const imageMap = {}; // rId -> target (media/image1.jpeg)
    for (let i = 0; i < relationships.length; i++) {
        const rel = relationships[i];
        const type = rel.getAttribute('Type');
        if (type && type.includes('relationships/image')) {
            const id = rel.getAttribute('Id');
            const target = rel.getAttribute('Target');
            imageMap[id] = target;
        }
    }

    // 3. Parse document.xml by PARAGRAPHS to fix fragmentation
    const docEntry = zip.getEntry('word/document.xml');
    if (!docEntry) throw new Error('Documento XML principal no encontrado');
    const docXml = docEntry.getData().toString('utf8');
    const doc = new DOMParser().parseFromString(docXml, 'text/xml');

    // Helper to extract clean text from a node
    const getTextFromNode = (node) => {
        let text = '';
        const textNodes = node.getElementsByTagName('w:t');
        for (let i = 0; i < textNodes.length; i++) {
            text += textNodes[i].textContent;
        }
        return text;
    };

    // Helper to find images in a node
    const getImagesFromNode = (node) => {
        const images = [];
        const blips = node.getElementsByTagName('a:blip');
        for (let i = 0; i < blips.length; i++) {
            const embedId = blips[i].getAttribute('r:embed');
            if (embedId) images.push(embedId);
        }
        return images;
    };

    // New Strategy: Process all PARAGRAPHS (w:p) sequentially.
    const paragraphs = doc.getElementsByTagName('w:p');
    const sequence = [];

    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const text = getTextFromNode(p);
        const images = getImagesFromNode(p);

        if (text.trim() || images.length > 0) {
            sequence.push({ text: text.trim(), images });
        }
    }

    let bufferImages = [];
    let processedCount = 0;

    const childrenRes = await db.query('SELECT id, codigo, progresiva_inicial FROM progresivas WHERE parent_id = $1', [tramoId]);
    const children = childrenRes.rows;

    const normalizeProg = (txt) => {
        const m = txt.match(/(\d+)\s*\+\s*(\d+)/);
        if (m) return (parseInt(m[1]) * 1000 + parseInt(m[2]));
        return null;
    };

    // 4. Process the sequence
    for (const item of sequence) {
        // First, add any images found in this paragraph to the buffer
        if (item.images.length > 0) {
            bufferImages.push(...item.images);
        }

        // Then, check if this paragraph contains a matching progresiva text
        if (item.text) {
            const pVal = normalizeProg(item.text);
            if (pVal !== null) {
                const match = children.find(c => Math.abs(c.progresiva_inicial - pVal) < 1);

                if (match) {
                    if (bufferImages.length > 0) {
                        for (const rId of bufferImages) {
                            const imgPath = imageMap[rId];
                            if (imgPath) {
                                const zipPath = 'word/' + imgPath;
                                const imgEntry = zip.getEntry(zipPath);
                                if (imgEntry) {
                                    const imgBuffer = imgEntry.getData();
                                    const fileObj = {
                                        buffer: imgBuffer,
                                        originalname: `import_${match.codigo}_${path.basename(imgPath)}`
                                    };

                                    try {
                                        const url = await uploadImage(fileObj, userId);
                                        await addImagenToProgresiva(match.id, url, item.text, fileObj.originalname);
                                        processedCount++;
                                    } catch (e) {
                                        console.error("Failed to upload image from docx", e);
                                    }
                                }
                            }
                        }
                        bufferImages = [];
                    }
                }
            }
        }
    }

    return { processed: processedCount };
};

// ------------------------------

const createProgresiva = async (data) => {
    const {
        proyecto_id, parent_id, codigo, nombre, descripcion,
        progresiva_inicial, progresiva_final, estado,
        coordenada_este, coordenada_norte, linea, lado
    } = data;

    if (!proyecto_id || !codigo) {
        throw new Error('Proyecto ID y Código son obligatorios.');
    }

    let finalCodigo = codigo;
    // Si es sub-progresiva y el código no incluye el parent_id, lo agregamos para mantener consistencia
    if (parent_id && !String(codigo).startsWith(`${parent_id}-`)) {
        finalCodigo = `${parent_id}-${codigo}`;
    }

    // Calcular valores numéricos de progresiva si no vienen
    let p_val = progresiva_inicial;
    if (p_val === undefined || p_val === null) {
        // Intentar deducir del código original (ej: "0100" -> 100)
        const rawCode = String(codigo).replace(`${parent_id}-`, '');
        p_val = parseInt(rawCode, 10);
        if (isNaN(p_val)) p_val = 0;
    }

    console.log(`[DEBUG createProgresiva] Data received:`, JSON.stringify({
        proyecto_id, parent_id, codigo, finalCodigo, p_val, ce: coordenada_este, cn: coordenada_norte
    }));

    const query = `
        INSERT INTO progresivas
        (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, lado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (codigo) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            coordenada_este = COALESCE(EXCLUDED.coordenada_este, progresivas.coordenada_este),
            coordenada_norte = COALESCE(EXCLUDED.coordenada_norte, progresivas.coordenada_norte),
            descripcion = COALESCE(EXCLUDED.descripcion, progresivas.descripcion),
            actualizado_en = NOW()
        RETURNING *
    `;

    const params = [
        proyecto_id,
        parent_id || null,
        finalCodigo,
        nombre,
        descripcion || '',
        p_val, // progresiva_inicial
        progresiva_final !== undefined ? progresiva_final : p_val, // progresiva_final (default to same as initial for points)
        estado || 'pendiente', // Default to 'pendiente' as per new requirement
        coordenada_este || null,
        coordenada_norte || null,
        linea || null,
        lado || 'C'
    ];

    try {
        const result = await db.query(query, params);
        console.log(`[DEBUG createProgresiva] Success - ID: ${result.rows[0].id}, Code: ${result.rows[0].codigo}, Count: ${result.rowCount}`);
        return result.rows[0];
    } catch (dbErr) {
        console.error(`[DEBUG createProgresiva] DB Error for Code ${finalCodigo}:`, dbErr.message);
        throw dbErr;
    }
};

const getDatos3DSuelosByProyecto = async (proyectoId) => {
    let client;
    try {
        client = await db.connect();
        await asegurarColumnas(client);

        // 1. Obtener todos los tramos (padres) para sacar los tracks KML
        const tramosResult = await db.query(`
            SELECT id, kml_trazado_id, nombre 
            FROM progresivas 
            WHERE proyecto_id = $1 AND parent_id IS NULL
        `, [proyectoId]);

        const tracks = [];
        for (const tramo of tramosResult.rows) {
            if (tramo.kml_trazado_id) {
                const trackData = await kmlService.getKmlContentById(tramo.kml_trazado_id);
                if (trackData) {
                    tracks.push({
                        tramo_id: tramo.id,
                        nombre: tramo.nombre,
                        kml_content: trackData
                    });
                }
            }
        }

        // 2. Obtener todas las progresivas del proyecto
        const progresivasResult = await db.query(`
            SELECT 
                p.id, p.parent_id, p.nombre, p.codigo, 
                p.coordenada_este, p.coordenada_norte, p.elevacion, p.linea, p.lado
            FROM progresivas p
            WHERE p.proyecto_id = $1
        `, [proyectoId]);

        console.log(`[DEBUG 3D] Proyecto ${proyectoId}: Encontradas ${progresivasResult.rows.length} progresivas totales.`);
        
        const progresivaIds = progresivasResult.rows.map(p => p.id);
        
        let estratos = [];
        if (progresivaIds.length > 0) {
            const estratosResult = await db.query(`
                SELECT 
                    id, parent_id as progresiva_id, nombre, descripcion,
                    cota_inicial, cota_final, orden, nlp_color_hex
                FROM estratos
                WHERE parent_type = 'progresiva' AND parent_id = ANY($1::int[])
                ORDER BY parent_id, orden ASC
            `, [progresivaIds]);
            estratos = estratosResult.rows;
        }

        // 3. Mapear estratos a progresivas
        const data = progresivasResult.rows.map(p => ({
            ...p,
            estratos: estratos.filter(e => e.progresiva_id === p.id)
        }));

        console.log(`[DEBUG 3D] Proyecto ${proyectoId}: Enviando ${tracks.length} trazados y ${data.length} progresivas procesadas.`);
        return { tracks, progresivas: data };
    } catch (err) {
        console.error('Error en getDatos3DSuelosByProyecto:', err);
        throw err;
    } finally {
        if (client) client.release();
    }
};

module.exports = {
    getDatos3DSuelosByProyecto, // NUEVO EXPORTE
    createProgresiva, // NEW EXPORT

    importarConEnsayos, // Añadir la nueva función

    createBulkProgresivas,

    getProgresivas,

    getSubProgresivas,

    getAllSubProgresivas,

    getProgresivaById,

    deleteProgresiva,

    bulkDeleteProgresivas,

    updateProgresiva,

    updateChildProgresiva,

    getProgresivaPage,

    getProgresivasByProyectoId,

    getParentProgresivasByProyectoId,

    getTramosByUserId,

    updateAndImportConEnsayos,

    uploadKmlToProgresiva,

    deleteKmlFromProgresiva, // NEW: Export the delete function

    uploadImage,
    addImagenToProgresiva,
    getImagenesByProgresivaId,
    deleteImagenProgresiva,
    processDocxUpload,
};