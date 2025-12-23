// backend/services/progresivasService.js
const db = require('../conexion'); // Adjust path as needed
const { v4: uuidv4 } = require('uuid');
const ensayosService = require('./ensayosService'); // Importar ensayosService
const fsp = require('fs').promises;
const kmlService = require('./kmlService'); // NEW: Import kmlService

const importarConEnsayos = async ({ parentProgresiva, generatedChildren, estratosSeleccionados }) => {
    if (!parentProgresiva || !generatedChildren || generatedChildren.length === 0) {
        throw new Error('Se requieren los datos de la progresiva principal y las sub-progresivas generadas.');
    }

    const selectedEstratosSet = new Set(estratosSeleccionados || []);
    let client;

    try {
        client = await db.connect();

        let idGranulometria, idLimites;
        if (estratosSeleccionados && estratosSeleccionados.length > 0) {
            const tipoEnsayoGranulometria = await client.query("SELECT id FROM tipo_ensayo WHERE config_key = 'Granulometria'");
            idGranulometria = tipoEnsayoGranulometria.rows[0]?.id;
            const tipoEnsayoLimites = await client.query("SELECT id FROM tipo_ensayo WHERE config_key = 'Límites de Consistencia'");
            idLimites = tipoEnsayoLimites.rows[0]?.id;

            if (!idGranulometria || !idLimites) {
                throw new Error('No se encontraron los tipos de ensayo requeridos (G, L) para la creación automática de ensayos.');
            }
        }

        await client.query('BEGIN');

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

        for (const prog of generatedChildren) {
            const uniqueSubProgresivaCodigo = `${parentId}-${prog.codigo}`;
            const childResult = await client.query(`
                INSERT INTO progresivas
                (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, lado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            `, [
                proyecto_id, parentId, uniqueSubProgresivaCodigo, prog.nombre, prog.descripcion, Number(prog.codigo), Number(prog.codigo),
                prog.estado || 'pendiente', prog.coordenada_este, prog.coordenada_norte, prog.linea, prog.lado
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

                    const estratoResult = await client.query(`
                        INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden)
                        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
                    `, [
                        'progresiva', // parent_type
                        childId,      // parent_id
                        estrato.nombre || estrato.descripcion, // Use estrato.nombre if available, else description
                        estrato.descripcion,
                        prof_ini,
                        prof_fin,
                        index + 1
                    ]);
                    const newEstratoId = estratoResult.rows[0].id;

                    // Verificar si este estrato fue seleccionado para crear ensayos
                    const estratoKey = `${prog.codigo}-${index}`;
                    if (selectedEstratosSet.has(estratoKey)) {
                        // Crear ensayo de Granulometría
                        await ensayosService.createBaseEnsayo({
                            estrato_id: newEstratoId,
                            tipo_ensayo_id: idGranulometria,
                            nombre_ensayo: 'Granulometría (Auto)'
                        }, client);
                        // Crear ensayo de Límites
                        await ensayosService.createBaseEnsayo({
                            estrato_id: newEstratoId,
                            tipo_ensayo_id: idLimites,
                            nombre_ensayo: 'Límites (Auto)'
                        }, client);
                    }
                }
            }
        }

        await client.query('COMMIT');
        return { status: 'ok', message: 'Progresivas y ensayos automáticos creados correctamente', progresivaId: parentId };

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

        for (const prog of generatedChildren) {
            const uniqueSubProgresivaCodigo = `${parentId}-${prog.codigo}`;
            await client.query(`
                INSERT INTO progresivas
                (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                proyecto_id,
                parentId,
                uniqueSubProgresivaCodigo,
                prog.nombre,
                prog.descripcion,
                Number(prog.codigo.split('-')[1]), // prog.progresiva_inicial
                Number(prog.codigo.split('-')[1]), // prog.progresiva_final
                prog.estado || 'pendiente',
                prog.coordenada_este,
                prog.coordenada_norte,
                prog.linea
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

const getProgresivas = async (user, selectedProjectId) => {
    try {
        let query = `
            SELECT
                p.id, p.codigo, COALESCE(p.nombre, '') AS nombre, p.descripcion,
                p.progresiva_inicial, p.progresiva_final,
                p.estado, p.creado_en, p.actualizado_en,
                pr.nombre_tramo AS proyecto_nombre,
                p.coordenada_este, p.coordenada_norte,
                p.linea,
                p.longitud_total,
                p.tipo_via,
                p.intervalo_manual,
                p.proyecto_id,
                p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
            FROM progresivas p
            LEFT JOIN proyectos pr ON p.proyecto_id = pr.id
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
        `;
        const queryParams = [];
        let paramIndex = 1; // Start parameter index for dynamic query
        let whereClauses = ['p.parent_id IS NULL'];

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

        const result = await db.query(query, queryParams);
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
                p.id, p.codigo, COALESCE(p.nombre, '') AS nombre, p.descripcion,
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
                e.cota_final AS profundidad_final, e.orden
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
                p.id, p.codigo, COALESCE(p.nombre, '') AS nombre, p.descripcion,
                p.progresiva_inicial, p.progresiva_final,
                p.estado, p.creado_en, p.actualizado_en,
                p.coordenada_este, p.coordenada_norte,
                p.linea,
                p.lado,
                p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
            FROM progresivas p
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
            WHERE p.parent_id = $1
            ORDER BY p.id ASC
        `, [Number(id)]);

        const progresivas = progresivasResult.rows;
        if (progresivas.length === 0) {
            return res.json([]);
        }
        const progresivaIds = progresivas.map(p => p.id);

        const estratosResult = await db.query(`
            SELECT
                e.id, e.parent_id AS progresiva_id, e.nombre, e.descripcion, e.cota_inicial AS profundidad_inicial, 
                e.cota_final AS profundidad_final, e.orden
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
                kt.kml_filename, kt.kml_uploaded_at
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
        // Delete estratos associated with child progresivas
        await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id IN (SELECT id FROM progresivas WHERE parent_id = $1)', [id]);
        // Delete estratos associated with the parent progresiva itself
        await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = $1', [id]);
        await client.query('DELETE FROM progresivas WHERE parent_id = $1', [id]);
        const result = await client.query('DELETE FROM progresivas WHERE id = $1', [id]);
        await client.query('COMMIT');
        return result.rowCount;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar progresiva en service:', err);
        throw new Error('Error al eliminar progresiva.');
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
        generatedChildren
    } = progresivaData;

    if (!nombre || !estado) {
        throw new Error('Nombre y estado son requeridos para actualizar la progresiva.');
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

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
                actualizado_en = NOW()
            WHERE id = $12
        `, [
            nombre, descripcion, estado, coordenada_este, coordenada_norte, linea, longitud_total,
            tipo_via, intervalo_manual, proyecto_id, kml_trazado_id, id
        ]);


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

        // 2. Crear mapa de children generados
        const generatedChildrenMap = new Map();
        for (const genChild of generatedChildren) {
            generatedChildrenMap.set(genChild.id || genChild.codigo, genChild);
        }

        const childrenToKeepIds = new Set();

        // 3. Recorrer los children del frontend
        for (const prog of generatedChildren) {
            const childId = prog.id;
            const isExistingChild = existingChildrenMap.has(childId);
            let currentChildDbId;

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
                    prog.coordenada_este,
                    prog.coordenada_norte,
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
                    prog.coordenada_este,
                    prog.coordenada_norte,
                    prog.linea,
                    prog.lado
                ]);
                currentChildDbId = childInsertResult.rows[0].id;
                childrenToKeepIds.add(currentChildDbId);
            }

            // --- Estratos ---
            if (prog.estratos_perfil && prog.estratos_perfil.length > 0) {


                const existingEstratosResult = await client.query(`
                    SELECT id, nombre, descripcion, cota_inicial, cota_final, orden
                    FROM estratos
                    WHERE parent_type = 'progresiva' AND parent_id = $1
                    ORDER BY orden ASC
                `, [currentChildDbId]);

                const existingEstratos = existingEstratosResult.rows;
                const existingEstratosMap = new Map(existingEstratos.map(e => [e.id, e]));
                const estratosToKeepIds = new Set();

                for (const estrato of prog.estratos_perfil) {
                    const estratoId = estrato.id;
                    const isExistingEstrato = existingEstratosMap.has(estratoId);

                    const prof_ini = parseFloat(estrato.profundidad_inicial);
                    const prof_fin = parseFloat(estrato.profundidad_final);

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
                            estrato.orden,
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
                            estrato.orden
                        ]);
                        estratosToKeepIds.add(newEstratoResult.rows[0].id);
                    }
                }

                // --- Eliminar estratos obsoletos ---
                for (const existingEstrato of existingEstratos) {
                    if (!estratosToKeepIds.has(existingEstrato.id)) {
                        await client.query('DELETE FROM estratos WHERE id = $1', [existingEstrato.id]);
                    }
                }

            } else {
                await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = $1', [currentChildDbId]);
                await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = $1', [currentChildDbId]);
            }
        } // 🔹 Cierre del for (generatedChildren)

        // --- Eliminar progresivas hijas que ya no existen ---
        for (const existingChild of existingChildren) {
            if (!childrenToKeepIds.has(existingChild.id)) {
                await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = $1', [existingChild.id]);
                await client.query('DELETE FROM progresivas WHERE id = $1', [existingChild.id]);
            }
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
    const {
        nombre, descripcion, estado, coordenada_este, coordenada_norte, estratos_perfil, linea, lado
    } = progresivaData;

    if (!nombre || !estado) {
        throw new Error('Nombre y estado son requeridos para actualizar la progresiva.');
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            UPDATE progresivas SET
                nombre = $1,
                descripcion = $2,
                estado = $3,
                coordenada_este = $4,
                coordenada_norte = $5,
                linea = $6,
                lado = $7,
                actualizado_en = NOW()
            WHERE id = $8
        `, [nombre, descripcion, estado, coordenada_este, coordenada_norte, linea, lado, id]);

        await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = $1', [id]);

        if (estratos_perfil && estratos_perfil.length > 0) {
            for (const [index, estrato] of estratos_perfil.entries()) {
                // The old 'estrato_id' was a FK to the lookup table.
                // Now we just use the name/description directly for the generic 'estratos' table.
                const prof_ini = parseFloat(estrato.profundidad_inicial);
                const prof_fin = parseFloat(estrato.profundidad_final);

                if (isNaN(prof_ini) || isNaN(prof_fin)) {
                    throw new Error(`Valores de profundidad inválidos para el estrato ${estrato.nombre || estrato.descripcion}`);
                }

                await client.query(`
                    INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    'progresiva',
                    id,
                    estrato.nombre || estrato.descripcion,
                    estrato.descripcion,
                    prof_ini,
                    prof_fin,
                    index + 1
                ]);
            }
        }

        await client.query('COMMIT');
        return { status: 'ok', message: 'Progresiva actualizada correctamente' };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar progresiva hija en service:', err);
        throw new Error('Error al actualizar la progresiva hija.');
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
                e.id, e.parent_id AS progresiva_id, e.nombre, e.descripcion, e.cota_inicial, e.cota_final, e.orden
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

                            p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at

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
                    p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
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
                    p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
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

const uploadKmlToProgresiva = async (progresivaId, file, userId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Create KML Trazado using kmlService
        const kmlTrazado = await kmlService.createKmlTrazado(file, userId);
        const newKmlTrazadoId = kmlTrazado.id;

        // 2. Update progresiva with kml_trazado_id
        const result = await client.query(
            `UPDATE progresivas
             SET kml_trazado_id = $1, actualizado_en = NOW()
             WHERE id = $2
             RETURNING id, kml_trazado_id;`,
            [newKmlTrazadoId, progresivaId]
        );

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
                kml_filename: kmlTrazado.kml_filename, // Include filename for frontend feedback
                kml_uploaded_at: kmlTrazado.kml_uploaded_at // Include timestamp for frontend feedback
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

        // 1. Delete old children and strata
        const existingChildren = await client.query('SELECT id FROM progresivas WHERE parent_id = $1', [progresivaId]);
        const existingChildIds = existingChildren.rows.map(row => row.id);
        if (existingChildIds.length > 0) {
            await client.query('DELETE FROM estratos WHERE parent_type = \'progresiva\' AND parent_id = ANY($1::int[])', [existingChildIds]);
            await client.query('DELETE FROM progresivas WHERE parent_id = $1', [progresivaId]);
        }

        // 2. Update parent progresiva
        const {
            nombre, descripcion, estado, linea,
            longitud_total, tipo_via, intervalo_manual, coordenada_este, coordenada_norte,
            kml_trazado_id // <-- AÑADIDO
        } = parentProgresiva;
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
                progresiva_inicial = $10, progresiva_final = $11, kml_trazado_id = $12
            WHERE id = $13
        `, [nombre, descripcion, estado, lineaIntParent, longitud_total, tipo_via, intervalo_manual, coordenada_este, coordenada_norte, progresiva_inicial_parent, progresiva_final_parent, kml_trazado_id, progresivaId]);

        // 3. Insert new children, strata, and assays
        const selectedEstratosSet = new Set(estratosSeleccionados || []);

        for (const prog of generatedChildren) {
            const uniqueSubProgresivaCodigo = `${progresivaId}-${prog.codigo}`;
            const lineaIntChild = prog.linea ? parseInt(prog.linea, 10) : null;
            if (prog.linea && isNaN(lineaIntChild)) {
                throw new Error(`El valor de linea para la progresiva hija '${prog.codigo}' no es un número válido.`);
            }

            const childResult = await client.query(`
                INSERT INTO progresivas
                (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, lado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            `, [
                parentProgresiva.proyecto_id, progresivaId, uniqueSubProgresivaCodigo, prog.nombre, prog.descripcion, parseInt(prog.codigo, 10), parseInt(prog.codigo, 10),
                prog.estado || 'pendiente', prog.coordenada_este, prog.coordenada_norte, lineaIntChild, prog.lado
            ]);
            const childId = childResult.rows[0].id;

            if (prog.estratos_perfil && prog.estratos_perfil.length > 0) {
                for (const [index, estrato] of prog.estratos_perfil.entries()) {
                    const prof_ini = parseFloat(estrato.profundidad_inicial);
                    const prof_fin = parseFloat(estrato.profundidad_final);
                    if (isNaN(prof_ini) || isNaN(prof_fin)) {
                        throw { type: 'ExcelDataValidationError', message: `Profundidad inválida en progresiva ${prog.nombre}` };
                    }
                    const estratoResult = await client.query(`
                        INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden)
                        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
                    `, [
                        'progresiva', childId, estrato.nombre || estrato.descripcion, estrato.descripcion, prof_ini, prof_fin, index + 1
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
        estado || 'activo',
        coordenada_este || null,
        coordenada_norte || null,
        linea || null,
        lado || 'C'
    ];

    const result = await db.query(query, params);
    return result.rows[0];
};

module.exports = {
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

};