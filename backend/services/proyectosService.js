// backend/services/proyectosService.js
const db = require('../conexion'); // Adjust path as needed
const { DateTime } = require('luxon'); // Assuming DateTime is used in project logic
const { v4: uuidv4 } = require('uuid'); // Assuming uuidv4 is used in project logic
const kmlService = require('./kmlService'); // NEW: Import kmlService

// Listar proyectos con detalle (incluyendo los nuevos campos)
const getDetailedProyectos = async () => {
    try {
        const proyectos = await db.query(`
            SELECT
                p.id, p.codigo, p.nombre_proyecto, p.descripcion_proyecto, p.estado,
                p.nombre_tramo, p.proyecto_nom, p.solicitante, p.departamento, p.provincia,
                p.distrito, p.localidad, p.longitud_total, p.progresiva_inicial, p.tipo_via,
                p.intervalo_manual, p.descripcion_larga, p.create_at, p.update_at,
                p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
            FROM proyectos p
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
        `);
        return proyectos.rows;
    } catch (err) {
        console.error('Error al obtener proyectos detallados en service:', err);
        throw new Error('Error al obtener proyectos detallados.');
    }
};

// Nueva función para obtener proyectos detallados asignados a un usuario
const getAssignedDetailedProyectos = async (userId) => {
    try {
        const proyectos = await db.query(`
            SELECT
                p.id, p.codigo, p.nombre_proyecto, p.descripcion_proyecto, p.estado,
                p.nombre_tramo, p.proyecto_nom, p.solicitante, p.departamento, p.provincia,
                p.distrito, p.localidad, p.longitud_total, p.progresiva_inicial, p.tipo_via,
                p.intervalo_manual, p.descripcion_larga, p.create_at, p.update_at,
                p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at
            FROM proyectos p
            JOIN proyecto_usuarios pu ON p.id = pu.proyecto_id
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
            WHERE pu.usuario_id = $1
            ORDER BY p.create_at DESC
        `, [userId]);
        return proyectos.rows;
    } catch (err) {
        console.error('Error al obtener proyectos detallados asignados en service:', err);
        throw new Error('Error al obtener proyectos detallados asignados.');
    }
};

// Lista simple
const getSimpleProyectos = async () => {
    try {
        const result = await db.query('SELECT id, codigo, nombre_tramo AS nombre FROM proyectos ORDER BY nombre');
        return result.rows;
    } catch (err) {
        console.error('Error al obtener proyectos simples en service:', err);
        throw new Error('Error al obtener proyectos simples.');
    }
};

// Obtener un proyecto por ID
const getProyectoById = async (id) => {
    try {
        const result = await db.query(`
            SELECT
                p.id, p.codigo, p.nombre_proyecto, p.descripcion_proyecto, p.estado,
                p.nombre_tramo, p.proyecto_nom, p.solicitante, p.departamento, p.provincia,
                p.distrito, p.localidad, p.longitud_total, p.progresiva_inicial, p.tipo_via,
                p.intervalo_manual, p.is_interval_manual, p.descripcion_larga, p.create_at, p.update_at,
                p.kml_trazado_id, kt.kml_filename, kt.kml_uploaded_at,
                COALESCE(json_agg(pr) FILTER (WHERE pr.id IS NOT NULL), '[]'::json) as progresivas
            FROM proyectos p
            LEFT JOIN kml_trazados kt ON p.kml_trazado_id = kt.id
            LEFT JOIN progresivas pr ON pr.proyecto_id = p.id AND pr.parent_id IS NULL
            WHERE p.id = $1
            GROUP BY p.id, kt.id
        `, [id]);
        return result.rows[0];
    } catch (err) {
        console.error(`Error al obtener proyecto ${id} en service:`, err);
        throw new Error(`Error al obtener el proyecto ${id}.`);
    }
};

// Crear nuevo proyecto (con todos los nuevos campos)
const createProyecto = async (projectData) => {
    const {
        nombre_tramo, proyecto_nom, solicitante, departamento, provincia,
        distrito, localidad, longitud_total, progresiva_inicial, tipo_via,
        intervalo_manual, descripcion_larga, estado
    } = projectData;

    // Basic backend validations (can be moved to a validation layer if complex)
    if (!nombre_tramo || !departamento || !provincia || !distrito || !longitud_total || !progresiva_inicial || !tipo_via) {
        throw new Error('Faltan campos requeridos para crear el proyecto.');
    }

    try {
        const result = await db.query(`
            INSERT INTO proyectos (
                nombre_tramo, proyecto_nom, solicitante, departamento, provincia,
                distrito, localidad, longitud_total, progresiva_inicial, tipo_via,
                intervalo_manual, descripcion_larga, estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            nombre_tramo,
            proyecto_nom,
            solicitante,
            departamento,
            provincia,
            distrito,
            localidad,
            longitud_total,
            progresiva_inicial,
            tipo_via,
            intervalo_manual,
            descripcion_larga,
            estado || 'Activo',
        ]);
        return result.rows[0];
    } catch (err) {
        console.error('Error al crear proyecto en service:', err);
        throw new Error('Error al crear el proyecto.');
    }
};

// Endpoint para crear proyecto y progresiva en una sola transacción
const createProyectoAndProgresiva = async (projectData, progresivaData, actorId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar el proyecto
        const {
            nombre_tramo, proyecto_nom, solicitante, departamento, provincia,
            distrito, localidad, longitud_total, progresiva_inicial, tipo_via,
            intervalo_manual, isIntervalManual, descripcion_larga, estado
        } = projectData;

        if (!nombre_tramo || !departamento || !provincia || !distrito || !longitud_total || !progresiva_inicial || !tipo_via) {
            throw new Error('Faltan campos requeridos para crear el proyecto.');
        }

        const projectInsertResult = await client.query(`
            INSERT INTO proyectos (
                nombre_tramo, proyecto_nom, solicitante, departamento, provincia,
                distrito, localidad, longitud_total, progresiva_inicial, tipo_via,
                intervalo_manual, is_interval_manual, descripcion_larga, estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id;
        `, [
            nombre_tramo, proyecto_nom, solicitante, departamento, provincia,
            distrito, localidad, longitud_total, progresiva_inicial, tipo_via,
            intervalo_manual, isIntervalManual, descripcion_larga, estado || 'Activo',
        ]);
        const newProjectId = projectInsertResult.rows[0].id;

        // 2. Insertar la progresiva principal y sus sub-progresivas
        const { parentProgresiva, generatedChildren } = progresivaData;

        if (!parentProgresiva || !generatedChildren || generatedChildren.length === 0) {
            throw new Error('Se requieren los datos de la progresiva principal y las sub-progresivas generadas.');
        }

        parentProgresiva.proyecto_id = newProjectId;

        const coordenada_este_numeric = parentProgresiva.coordenada_este ? Number(parentProgresiva.coordenada_este) : null;
        const coordenada_norte_numeric = parentProgresiva.coordenada_norte ? Number(parentProgresiva.coordenada_norte) : null;

        const {
            nombre: progNombre, descripcion: progDescripcion, estado: progEstado, linea,
            coordenada_este, coordenada_norte, codigo // <--- Add codigo here
        } = parentProgresiva;

        const progresiva_inicial_parent = generatedChildren[0].codigo;
        const progresiva_final_parent = generatedChildren[generatedChildren.length - 1].codigo;
        // Use the provided codigo, or generate if not present
        const finalCodigoForParent = codigo || `${progNombre.toUpperCase().replace(/\s/g, '-').substring(0, 8)}-${Date.now().toString(36).slice(-5)}-${uuidv4().slice(0, 3)}`;

        const parentInsertQuery = `
            INSERT INTO progresivas
            (proyecto_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea, longitud_total, tipo_via, intervalo_manual)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id;
        `;
        const parentInsertParams = [
            newProjectId,
            finalCodigoForParent,
            progNombre,
            progDescripcion,
            progresiva_inicial_parent,
            progresiva_final_parent,
            progEstado || 'pendiente',
            coordenada_este_numeric,
            coordenada_norte_numeric,
            linea,
            longitud_total,
            tipo_via,
            intervalo_manual
        ];
        const parentResult = await client.query(parentInsertQuery, parentInsertParams);
        const parentProgresivaId = parentResult.rows[0].id;

        for (const prog of generatedChildren) {
            const uniqueSubProgresivaCodigo = `${parentProgresivaId}-${prog.codigo}`;
            await client.query(`
                INSERT INTO progresivas
                (proyecto_id, parent_id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, coordenada_este, coordenada_norte, linea)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                newProjectId,
                parentProgresivaId,
                uniqueSubProgresivaCodigo,
                prog.nombre,
                prog.descripcion,
                prog.codigo,
                prog.codigo,
                prog.estado || 'pendiente',
                prog.coordenada_este,
                prog.coordenada_norte,
                prog.linea,
            ]);
        }

        await client.query('COMMIT');

        // Add history entry for project creation
        await addProjectHistory(newProjectId, 'CREACION_PROYECTO', actorId, `Proyecto "${nombre_tramo}" creado.`); // Added history

        return { status: 'ok', message: 'Proyecto y Progresiva creados correctamente', projectId: newProjectId, progresivaId: parentProgresivaId };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en createProyectoAndProgresiva service:', err.message, err.stack);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
};

// Placeholder for import/export logic if needed later
const importProyectos = async (file) => {
    // Lógica de importación de Excel aquí
    return { message: 'Funcionalidad de importación de Excel (en desarrollo)' };
};

const exportProyectos = async () => {
    try {
        const proyectos = await db.query(`
            SELECT
                p.id AS proyecto_id,
                p.nombre_tramo,
                p.proyecto_nom,
                p.solicitante,
                p.departamento,
                p.provincia,
                p.distrito,
                p.localidad,
                p.longitud_total AS proyecto_longitud_total,
                p.progresiva_inicial AS proyecto_progresiva_inicial,
                p.tipo_via AS proyecto_tipo_via,
                p.intervalo_manual AS proyecto_intervalo_manual,
                p.descripcion_larga AS proyecto_descripcion_larga,
                p.estado AS proyecto_estado,
                pr.id AS progresiva_id,
                pr.codigo AS progresiva_codigo,
                pr.nombre AS progresiva_nombre,
                pr.descripcion AS progresiva_descripcion,
                pr.progresiva_inicial AS progresiva_progresiva_inicial,
                pr.progresiva_final AS progresiva_progresiva_final,
                pr.estado AS progresiva_estado,
                pr.coordenada_este AS progresiva_coordenada_este,
                pr.coordenada_norte AS progresiva_coordenada_norte,
                pr.linea AS progresiva_linea,
                pr.estrato_id AS progresiva_estrato_id
            FROM proyectos p
            LEFT JOIN progresivas pr ON p.id = pr.proyecto_id AND pr.parent_id IS NULL -- Solo progresivas principales
            ORDER BY p.create_at DESC, pr.creado_en DESC
        `);

        // Formatear los datos para incluir el valorTotal de la progresiva principal
        const formattedData = proyectos.rows.map(row => {
            // El valorTotal para la generación de sub-progresivas es la longitud_total del proyecto
            // y el intervalo es el tipo_via o intervalo_manual del proyecto
            const valorTotalSubProgresivas = row.proyecto_longitud_total;
            const intervaloSubProgresivas = row.proyecto_intervalo_manual || row.proyecto_tipo_via;

            return {
                "Proyecto ID": row.proyecto_id,
                "Nombre Tramo": row.nombre_tramo,
                "Entidad Solicitante": row.proyecto_nom,
                "Solicitante": row.solicitante,
                "Departamento": row.departamento,
                "Provincia": row.provincia,
                "Distrito": row.distrito,
                "Localidad": row.localidad,
                "Longitud Total Proyecto": row.proyecto_longitud_total,
                "Progresiva Inicial Proyecto": row.proyecto_progresiva_inicial,
                "Tipo Via Proyecto": row.proyecto_tipo_via,
                "Intervalo Manual Proyecto": row.proyecto_intervalo_manual,
                "Descripcion Larga Proyecto": row.proyecto_descripcion_larga,
                "Estado Proyecto": row.proyecto_estado,
                "Progresiva ID": row.progresiva_id,
                "Codigo Progresiva": row.progresiva_codigo,
                "Nombre Progresiva": row.progresiva_nombre,
                "Descripcion Progresiva": row.progresiva_descripcion,
                "Progresiva Inicial": row.progresiva_progresiva_inicial,
                "Progresiva Final": row.progresiva_progresiva_final,
                "Estado Progresiva": row.progresiva_estado,
                "Coordenada Este Progresiva": row.progresiva_coordenada_este,
                "Coordenada Norte Progresiva": row.progresiva_coordenada_norte,
                "Linea Progresiva": row.progresiva_linea,
                "Estrato ID Progresiva": row.progresiva_estrato_id,
                "Valor Total Sub-Progresivas": valorTotalSubProgresivas, // El valor total para generar sub-progresivas
                "Intervalo Sub-Progresivas": intervaloSubProgresivas // El intervalo para generar sub-progresivas
            };
        });

        return formattedData;
    } catch (err) {
        console.error('Error al exportar proyectos en service:', err);
        throw new Error('Error al exportar proyectos.');
    }
};

const updateProyecto = async (id, projectData, progresivaData) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            nombre_tramo, proyecto_nom, solicitante, departamento, provincia,
            distrito, localidad, longitud_total, progresiva_inicial, tipo_via,
            intervalo_manual, isIntervalManual, descripcion_larga, estado
        } = projectData;
    
        // Basic backend validations
        if (!nombre_tramo || !departamento || !provincia || !distrito || !longitud_total || !progresiva_inicial || !tipo_via) {
            throw new Error('Faltan campos requeridos para actualizar el proyecto.');
        }
        
            const projectUpdateResult = await client.query(`
                UPDATE proyectos SET
                    nombre_tramo = $1,
                    proyecto_nom = $2,
                    solicitante = $3,
                    departamento = $4,
                    provincia = $5,
                    distrito = $6,
                    localidad = $7,
                    longitud_total = $8,
                    progresiva_inicial = $9,
                    tipo_via = $10,
                    intervalo_manual = $11,
                    is_interval_manual = $12,
                    descripcion_larga = $13,
                    estado = $14,
                    update_at = NOW()
                WHERE id = $15
                RETURNING *
            `, [
                nombre_tramo, proyecto_nom, solicitante, departamento, provincia,
                distrito, localidad, longitud_total, progresiva_inicial, tipo_via,
                intervalo_manual, isIntervalManual, descripcion_larga, estado, id
            ]);
        if (projectUpdateResult.rows.length === 0) {
            throw new Error('Proyecto no encontrado para actualizar.');
        }

        // Update parent progresiva if progresivaData is provided
        if (progresivaData && progresivaData.parentProgresiva) {
            const { parentProgresiva } = progresivaData;
            const {
                nombre: progNombre, descripcion: progDescripcion, estado: progEstado, linea,
                coordenada_este, coordenada_norte, codigo: progCodigo
            } = parentProgresiva;

            const coordenada_este_numeric = coordenada_este ? Number(coordenada_este) : null;
            const coordenada_norte_numeric = coordenada_norte ? Number(coordenada_norte) : null;

            const updateProgresivaResult = await client.query(`
                UPDATE progresivas SET
                    nombre = $1,
                    descripcion = $2,
                    estado = $3,
                    linea = $4,
                    coordenada_este = $5,
                    coordenada_norte = $6
                WHERE proyecto_id = $7 AND codigo = $8 AND parent_id IS NULL
                RETURNING *;
            `, [
                progNombre, progDescripcion, progEstado, linea,
                coordenada_este_numeric, coordenada_norte_numeric, id, progCodigo
            ]);

            if (updateProgresivaResult.rows.length === 0) {
                console.warn(`No se encontró progresiva principal para el proyecto ${id} con código ${progCodigo} al actualizar.`);
            }
        }

        await client.query('COMMIT');
        return projectUpdateResult.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar proyecto en service:', err);
        throw new Error('Error al actualizar el proyecto.');
    } finally {
        if (client) {
            client.release();
        }
    }
};


// Eliminar un proyecto por ID
const deleteProyecto = async (id) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Eliminar progresivas asociadas al proyecto
        await client.query('DELETE FROM progresivas WHERE proyecto_id = $1', [id]);

        // Eliminar el proyecto
        const result = await client.query('DELETE FROM proyectos WHERE id = $1', [id]);

        await client.query('COMMIT');
        return result.rowCount;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error al eliminar proyecto ${id} en service:`, err);
        throw new Error(`Error al eliminar el proyecto ${id}.`);
    } finally {
        if (client) {
            client.release();
        }
    }
};


// Asignar un usuario a un proyecto
const assignUserToProjectDb = async (projectId, userId, rolProyecto = 'view', actorId) => {
    try {
        const result = await db.query(
            'INSERT INTO proyecto_usuarios (proyecto_id, usuario_id, rol_proyecto) VALUES ($1, $2, $3) ON CONFLICT (proyecto_id, usuario_id) DO UPDATE SET rol_proyecto = $3, asignado_en = CURRENT_TIMESTAMP RETURNING *',
            [projectId, userId, rolProyecto]
        );
        // Add history entry for user assignment
        await addProjectHistory(projectId, 'ASIGNACION_USUARIO', actorId, `Usuario ${userId} asignado con rol "${rolProyecto}".`); // Added history
        return result.rows[0];
    } catch (err) {
        console.error('Error al asignar usuario a proyecto en service:', err);
        throw new Error('Error al asignar usuario a proyecto.');
    }
};

// Desasignar un usuario de un proyecto
const removeUserFromProjectDb = async (projectId, userId, actorId) => {
    try {
        const result = await db.query(
            'DELETE FROM proyecto_usuarios WHERE proyecto_id = $1 AND usuario_id = $2 RETURNING *',
            [projectId, userId]
        );
        // Add history entry for user removal
        await addProjectHistory(projectId, 'DESASIGNACION_USUARIO', actorId, `Usuario ${userId} desasignado.`); // Added history
        return result.rows[0];
    } catch (err) {
        console.error('Error al desasignar usuario de proyecto en service:', err);
        throw new Error('Error al desasignar usuario de proyecto.');
    }
};

// Obtener asignaciones de un proyecto
const getProjectAssignments = async (projectId) => {
    try {
        const result = await db.query(
            `SELECT
                pu.usuario_id,
                pu.rol_proyecto,
                u.nombre,
                u.ap_paterno,
                u.ap_materno,
                u.rol_id,
                r.nombre AS rol_nombre
            FROM proyecto_usuarios pu
            JOIN usuariost u ON pu.usuario_id = u.id
            JOIN roles r ON u.rol_id = r.id
            WHERE pu.proyecto_id = $1`,
            [projectId]
        );
        return result.rows;
    } catch (err) {
        console.error('Error al obtener asignaciones de proyecto en service:', err);
        throw new Error('Error al obtener asignaciones de proyecto.');
    }
};

// Añadir un registro al historial del proyecto
const addProjectHistory = async (projectId, action, actorId, details) => {
    try {
        await db.query(
            'INSERT INTO proyecto_historial (proyecto_id, accion, actor_id, detalles) VALUES ($1, $2, $3, $4)',
            [projectId, action, actorId, details]
        );
    } catch (err) {
        console.error('Error al añadir historial de proyecto:', err);
        // No lanzar error para no bloquear la operación principal
    }
};

// Obtener el historial de un proyecto
const getProjectHistory = async (projectId) => {
    try {
        const result = await db.query(
            `SELECT
                ph.id,
                ph.proyecto_id,
                ph.accion,
                ph.actor_id,
                ph.fecha,
                ph.detalles,
                u.nombre AS actor_nombre,
                u.ap_paterno AS actor_ap_paterno,
                u.ap_materno AS actor_ap_materno
            FROM proyecto_historial ph
            JOIN usuariost u ON ph.actor_id = u.id
            WHERE ph.proyecto_id = $1
            ORDER BY ph.fecha DESC`,
            [projectId]
        );
        return result.rows;
    } catch (err) {
        console.error('Error al obtener historial del proyecto:', err);
        throw new Error('Error al obtener historial del proyecto.');
    }
};

const getAllProjectsForAdmin = async () => {
    try {
        const result = await db.query(`
            SELECT
                id AS proyecto_id,
                nombre_proyecto,
                nombre_tramo
            FROM proyectos
            ORDER BY nombre_proyecto ASC;
        `);
        return result.rows;
    } catch (err) {
        console.error('Error al obtener todos los proyectos para admin:', err);
        throw new Error('Error al obtener todos los proyectos para admin.');
    }
};

const getUserAssignedProjects = async (userId) => {
    try {
        const result = await db.query(`
            SELECT
                p.id AS proyecto_id,
                p.nombre_proyecto,
                p.nombre_tramo
            FROM proyectos p
            JOIN proyecto_usuarios pu ON p.id = pu.proyecto_id
            WHERE pu.usuario_id = $1
            ORDER BY p.nombre_proyecto ASC;
        `, [userId]);
        return result.rows;
    } catch (err) {
        console.error('Error al obtener proyectos asignados al usuario:', err);
        throw new Error('Error al obtener proyectos asignados al usuario.');
    }
};

const uploadKmlToProyecto = async (proyectoId, file, userId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Create KML Trazado using kmlService
        const kmlTrazado = await kmlService.createKmlTrazado(file, userId);
        const newKmlTrazadoId = kmlTrazado.id;

        // 2. Update proyecto with kml_trazado_id
        const result = await client.query(
            `UPDATE proyectos
             SET kml_trazado_id = $1, update_at = NOW()
             WHERE id = $2
             RETURNING id, kml_trazado_id;`,
            [newKmlTrazadoId, proyectoId]
        );

        if (result.rows.length === 0) {
            const error = new Error('Proyecto no encontrado para actualizar el KML.');
            error.statusCode = 404;
            error.isCustomError = true;
            throw error;
        }

        await client.query('COMMIT');
        return {
            status: 'ok',
            message: 'KML cargado y asociado al proyecto correctamente.',
            proyecto: {
                id: result.rows[0].id,
                kml_trazado_id: result.rows[0].kml_trazado_id,
                kml_filename: kmlTrazado.kml_filename, // Include filename for frontend feedback
                kml_uploaded_at: kmlTrazado.kml_uploaded_at // Include timestamp for frontend feedback
            }
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en uploadKmlToProyecto service:', err.message, err.stack);
        // Re-throw custom errors from kmlService directly
        if (err.isCustomError) {
            throw err;
        }
        throw new kmlService.KmlServiceError('Error interno del servidor al subir KML al proyecto.', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
};

// --- Funciones de Calibración de Tramos ---

const getCalibracionByProyecto = async (id_proyecto) => {
    try {
        const result = await db.query(
            'SELECT nombre_tramo, progresiva_inicio, progresiva_fin FROM proyecto_calibracion_tramos WHERE id_proyecto = $1',
            [id_proyecto]
        );
        // Convert array of objects to the desired format: { "TRAMO 1": { start: "0+000", end: "34+000" } }
        const calibrationData = {};
        result.rows.forEach(row => {
            calibrationData[row.nombre_tramo] = {
                start: row.progresiva_inicio,
                end: row.progresiva_fin,
            };
        });
        return calibrationData;
    } catch (err) {
        console.error(`Error al obtener calibración para el proyecto ${id_proyecto}:`, err);
        throw new Error('Error al obtener datos de calibración.');
    }
};

const saveCalibracionForProyecto = async (id_proyecto, calibracionData) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        for (const tramoName in calibracionData) {
            const { start, end } = calibracionData[tramoName];
            if (start && end) { // Only save if both start and end are provided
                await client.query(
                    `INSERT INTO proyecto_calibracion_tramos (id_proyecto, nombre_tramo, progresiva_inicio, progresiva_fin)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (id_proyecto, nombre_tramo)
                     DO UPDATE SET progresiva_inicio = EXCLUDED.progresiva_inicio, progresiva_fin = EXCLUDED.progresiva_fin, actualizado_en = NOW()`,
                    [id_proyecto, tramoName, start, end]
                );
            }
        }

        await client.query('COMMIT');
        return { status: 'ok', message: 'Datos de calibración guardados correctamente.' };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error al guardar calibración para el proyecto ${id_proyecto}:`, err);
        throw new Error('Error al guardar datos de calibración.');
    } finally {
        client.release();
    }
};

const deleteCalibracionForProyecto = async (id_proyecto) => {
    try {
        await db.query('DELETE FROM proyecto_calibracion_tramos WHERE id_proyecto = $1', [id_proyecto]);
        return { status: 'ok', message: 'Datos de calibración eliminados correctamente.' };
    } catch (err) {
        console.error(`Error al eliminar calibración para el proyecto ${id_proyecto}:`, err);
        throw new Error('Error al eliminar datos de calibración.');
    }
};


module.exports = {
    getDetailedProyectos,
    getSimpleProyectos,
    getProyectoById,
    createProyecto,
    createProyectoAndProgresiva,
    importProyectos,
    exportProyectos,
    updateProyecto,
    deleteProyecto,
    assignUserToProjectDb,
    removeUserFromProjectDb,
    getProjectAssignments,
    addProjectHistory,
    getProjectHistory,
    getUserAssignedProjects,
    getAllProjectsForAdmin, // NEW
    getAssignedDetailedProyectos,
    uploadKmlToProyecto, // NEW: Export the new function
    getCalibracionByProyecto,
    saveCalibracionForProyecto,
    deleteCalibracionForProyecto,
};
