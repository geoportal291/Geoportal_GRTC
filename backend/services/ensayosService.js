const db = require('../conexion');
const XLSX = require('xlsx');

// --- Helper Functions for Data Structure ---
const setNestedProperty = (obj, path, value) => {
    if (!path) return;
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (i === keys.length - 1) {
            current[key] = value;
        } else {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
    }
};

const deepMerge = (target, source) => {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
};
// -------------------------------------------



// Helper para generar códigos únicos
const generateUniqueCode = (prefix = 'ENS') => {
    return `${prefix}-${Date.now()}`;
};

// Obtiene la lista de ensayos (vista general)
const getEnsayos = async () => {
    try {
        const result = await db.query('SELECT * FROM ensayos ORDER BY id DESC');
        return result.rows;
    } catch (err) {
        console.error('Error al obtener ensayos en service:', err);
        throw new Error('Error al obtener ensayos.');
    }
};

// Obtiene los detalles de un ensayo específico por su ID
const getEnsayoDetailsById = async (id) => {
    try {
        const result = await db.query(`
            SELECT
                e.*, 
                te.descripcion AS tipo_ensayo_descripcion,
                est.nombre AS estrato_nombre,
                est.descripcion AS estrato_descripcion,
                est.parent_type,
                est.parent_id,
                est.orden AS estrato_orden,
                
                -- Progresiva/Tramo related fields (if parent_type is 'progresiva')
                prog.codigo AS progresiva_codigo,
                prog.id AS progresiva_id,
                tramo_prog.nombre AS tramo_nombre,
                tramo_prog.id AS tramo_id,
                
                -- Cantera related fields (if parent_type is 'cantera')
                can.nombre AS cantera_nombre,
                can.codigo AS cantera_codigo,
                can.id AS cantera_id,
                tramo_can.nombre AS tramo_cantera_nombre,
                tramo_can.id AS tramo_cantera_id,

                -- Project related fields
                p.nombre_tramo AS proyecto_nombre,
                p.id AS proyecto_id
            FROM ensayos e
            LEFT JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
            LEFT JOIN estratos est ON e.estrato_id = est.id
            -- Joins for Progresiva-based assays
            LEFT JOIN progresivas prog ON est.parent_type = 'progresiva' AND est.parent_id = prog.id
            LEFT JOIN progresivas tramo_prog ON prog.parent_id = tramo_prog.id
            -- Joins for Cantera-based assays
            LEFT JOIN canteras can ON est.parent_type = 'cantera' AND est.parent_id = can.id
            LEFT JOIN progresivas tramo_can ON can.tramo_id = tramo_can.id
            -- General Join for Project
            LEFT JOIN proyectos p ON (prog.proyecto_id = p.id OR can.id_proyecto = p.id)
            WHERE e.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        const ensayoData = result.rows[0];

        const response = {
            ensayo_id: ensayoData.id,
            fecha: ensayoData.fecha,
            nombre_ensayo: ensayoData.nombre_ensayo,
            resultado: ensayoData.resultado,
            estado: ensayoData.estado,
            codigo_ensayo: ensayoData.codigo_ensayo,
            tipo_ensayo: ensayoData.tipo_ensayo,
            tipo_ensayo_descripcion: ensayoData.tipo_ensayo_descripcion,
            datos_ensayo: ensayoData.datos_formulario || {},
            estrato_id: ensayoData.estrato_id,
            estrato_nombre: ensayoData.estrato_nombre,
            estrato_descripcion: ensayoData.estrato_descripcion,
            estrato_orden: ensayoData.estrato_orden,
            parent_type: ensayoData.parent_type,
            parent_id: ensayoData.parent_id,
            proyecto_id: ensayoData.proyecto_id,
            proyecto_nombre: ensayoData.proyecto_nombre,
        };

        if (ensayoData.parent_type === 'progresiva') {
            response.progresiva_id = ensayoData.progresiva_id;
            response.progresiva_codigo = ensayoData.progresiva_codigo;
            response.tramo_id = ensayoData.tramo_id;
            response.tramo_nombre = ensayoData.tramo_nombre;
        } else if (ensayoData.parent_type === 'cantera') {
            response.cantera_id = ensayoData.cantera_id;
            response.cantera_nombre = ensayoData.cantera_nombre;
            response.cantera_codigo = ensayoData.cantera_codigo;
            response.tramo_nombre = ensayoData.tramo_cantera_nombre;
            response.tramo_id = ensayoData.tramo_cantera_id;
        }

        return response;
    } catch (err) {
        console.error('Error al obtener detalles del ensayo por ID en service:', err);
        throw new Error('Error al obtener detalles del ensayo.');
    }
};

// Crea o actualiza un ensayo con su formulario dinámico
const createOrUpdateFullAssay = async (ensayoId, assayData) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Extraemos 'datos_ensayo' explícitamente del payload que manda el frontend
        // y lo renombramos a 'datos_formulario' para que coincida con la variable de la consulta SQL.
        const {
            nombre_ensayo,
            tipo_ensayo_id,
            estrato_id,
            datos_ensayo: datos_formulario,
            resultado // <--- Nuevo campo recibido
        } = assayData;
        // -----------------------------

        let proyectoId = null;
        if (estrato_id) {
            const estratoInfoResult = await client.query(`
                SELECT parent_type, parent_id FROM estratos WHERE id = $1
            `, [estrato_id]);

            if (estratoInfoResult.rows.length > 0) {
                const { parent_type, parent_id } = estratoInfoResult.rows[0];

                if (parent_type === 'progresiva') {
                    const proyectoResult = await client.query(`
                        SELECT prog.proyecto_id
                        FROM progresivas prog
                        WHERE prog.id = $1
                    `, [parent_id]);
                    if (proyectoResult.rows.length > 0) {
                        proyectoId = proyectoResult.rows[0].proyecto_id;
                    }
                } else if (parent_type === 'cantera') {
                    const proyectoResult = await client.query(`
                        SELECT c.id_proyecto
                        FROM canteras c
                        WHERE c.id = $1
                    `, [parent_id]);
                    if (proyectoResult.rows.length > 0) {
                        proyectoId = proyectoResult.rows[0].id_proyecto;
                    }
                }
            }
        }

        let currentEnsayoId = ensayoId;

        if (currentEnsayoId) { // Modo Actualización
            const query = `
                UPDATE ensayos 
                SET 
                    nombre_ensayo = $1, 
                    tipo_ensayo = $2, 
                    estrato_id = $3, 
                    datos_formulario = $4, 
                    fecha = CURRENT_DATE, 
                    estado = $5,
                    proyecto_id = $6,
                    resultado = $7
                WHERE id = $8
            `;
            const values = [
                nombre_ensayo,
                tipo_ensayo_id,
                estrato_id,
                datos_formulario,
                'actualizado',
                proyectoId,
                resultado, // <--- Guardar resultado
                currentEnsayoId
            ];
            await client.query(query, values);

        } else { // Modo Creación
            const codigo_ensayo = generateUniqueCode('ENS'); // Generar código único
            const query = `
                INSERT INTO ensayos (nombre_ensayo, tipo_ensayo, estrato_id, datos_formulario, fecha, estado, proyecto_id, codigo_ensayo, resultado)
                VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
                RETURNING id;
            `;
            const values = [
                nombre_ensayo,
                tipo_ensayo_id,
                estrato_id,
                datos_formulario,
                'pendiente',
                proyectoId,
                codigo_ensayo,
                resultado // <--- Guardar resultado
            ];
            const result = await client.query(query, values);
            currentEnsayoId = result.rows[0].id;
        }

        await client.query('COMMIT');
        return { ensayoId: currentEnsayoId, status: 'ok' };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en la transacción de createOrUpdateFullAssay:', err);
        throw new Error('La transacción falló: ' + err.message);
    } finally {
        client.release();
    }
};

// Obtiene la configuración de un formulario para un tipo de ensayo
const getFormularioConfig = async (tipoEnsayoId) => {
    try {
        if (!tipoEnsayoId) {
            console.warn('getFormularioConfig llamado con tipoEnsayoId nulo o indefinido.');
            return null;
        }

        const tipoEnsayoResult = await db.query(
            'SELECT results_config, config_tabla, config_calculos, config_graficos FROM tipo_ensayo WHERE id = $1',
            [tipoEnsayoId]
        );

        if (tipoEnsayoResult.rows.length === 0) {
            return null;
        }
        const resultsConfig = tipoEnsayoResult.rows[0].results_config || { groups: [] };
        const tableConfig = tipoEnsayoResult.rows[0].config_tabla || {};
        const calculationConfig = tipoEnsayoResult.rows[0].config_calculos || {};
        const graficosConfig = tipoEnsayoResult.rows[0].config_graficos || [];

        const seccionesResult = await db.query(
            'SELECT id, titulo, componente_key, orden, config_json, config_key, layout_style FROM formulario_secciones WHERE tipo_ensayo_id = $1 ORDER BY orden',
            [tipoEnsayoId]
        );

        const secciones = seccionesResult.rows;

        for (const seccion of secciones) {
            if (seccion.componente_key === 'CamposGenerales') {
                const camposResult = await db.query(
                    'SELECT name, label, type, step, required, orden FROM formulario_campos WHERE seccion_id = $1 ORDER BY orden',
                    [seccion.id]
                );
                seccion.campos = camposResult.rows;
            }
        }

        return {
            formConfig: { secciones: secciones },
            resultsConfig: resultsConfig,
            tableConfig: tableConfig,
            calculationConfig: calculationConfig,
            graficosConfig: graficosConfig
        };

    } catch (err) {
        console.error('Error al obtener configuración de formulario en service:', err);
        throw new Error('Error al obtener la configuración del formulario.');
    }
};

// Obtiene todos los tipos de ensayo disponibles
const getTipoEnsayos = async () => {
    try {
        const result = await db.query('SELECT id, codigo, descripcion FROM tipo_ensayo ORDER BY descripcion');
        return result.rows;
    } catch (err) {
        console.error('Error al obtener tipos de ensayo en service:', err);
        throw new Error('Error al obtener tipos de ensayo.');
    }
};

const createBaseEnsayo = async (baseEnsayoData, existingClient = null) => {
    const { estrato_id, tipo_ensayo_id, nombre_ensayo, cantera_id, identificador, proyecto_id: fallbackProyectoId } = baseEnsayoData;

    // DEBUG: Trace identificador in createBaseEnsayo
    if (identificador) {
        console.log(`[createBaseEnsayo] Received identificador: '${identificador}' for insert.`);
    } else {
        console.log('[createBaseEnsayo] WARNING: Identificador is null/undefined.');
    }

    const client = existingClient || await db.connect(); // Use existing client or get a new one
    let needsTransaction = !existingClient; // Only manage transaction if no existing client

    try {
        if (needsTransaction) await client.query('BEGIN');

        // 1. Get next correlativo for the given tipo_ensayo
        const correlativoResult = await client.query(
            'SELECT MAX(correlativo_tipo_ensayo) as max_correlativo FROM ensayos WHERE tipo_ensayo = $1',
            [tipo_ensayo_id]
        );
        const nextCorrelativo = (correlativoResult.rows[0].max_correlativo || 0) + 1;

        // 2. Fetch all necessary code parts from the generic 'estratos' table
        const estratoDetailsResult = await client.query(`
            SELECT
                e.parent_type,
                e.parent_id,
                e.orden AS estrato_orden,
                e.nombre AS estrato_nombre,
                e.descripcion AS estrato_descripcion
            FROM estratos e
            WHERE e.id = $1
        `, [estrato_id]);

        if (estratoDetailsResult.rows.length === 0) {
            throw new Error('Estrato no encontrado para generar el código.');
        }
        const { parent_type, parent_id, estrato_orden, estrato_nombre, estrato_descripcion } = estratoDetailsResult.rows[0];

        let progresiva_codigo = null;
        let tramo_codigo = null;
        let proyecto_codigo = null;
        let proyecto_id = fallbackProyectoId || null;
        let cantera_nombre = null; // Usaremos el nombre de la cantera para el código

        if (parent_type === 'progresiva') {
            const progresivaInfoResult = await client.query(`
                SELECT
                    prog.codigo AS progresiva_codigo,
                    tramo.codigo AS tramo_codigo,
                    p.codigo AS proyecto_codigo,
                    prog.proyecto_id
                FROM progresivas prog
                JOIN progresivas tramo ON prog.parent_id = tramo.id
                JOIN proyectos p ON prog.proyecto_id = p.id
                WHERE prog.id = $1
            `, [parent_id]);

            if (progresivaInfoResult.rows.length === 0) {
                throw new Error('Progresiva o tramo no encontrados para generar el código.');
            }
            ({ progresiva_codigo, tramo_codigo, proyecto_codigo, proyecto_id } = progresivaInfoResult.rows[0]);

        } else if (parent_type === 'cantera') {
            const canteraInfoResult = await client.query(`
                SELECT
                    c.nombre AS cantera_nombre,
                    p.codigo AS proyecto_codigo,
                    c.id_proyecto AS proyecto_id
                FROM canteras c
                LEFT JOIN proyectos p ON c.id_proyecto = p.id
                WHERE c.id = $1
            `, [cantera_id]); // <-- CAMBIO CLAVE: Usar cantera_id del payload

            if (canteraInfoResult.rows.length === 0) {
                throw new Error(`Cantera con ID ${cantera_id} no encontrada para generar el código.`);
            }
            ({ cantera_nombre, proyecto_codigo, proyecto_id } = canteraInfoResult.rows[0]);

        } else {
            throw new Error(`Tipo de entidad padre desconocido: ${parent_type}`);
        }

        const tipoEnsayoResult = await client.query('SELECT codigo FROM tipo_ensayo WHERE id = $1', [tipo_ensayo_id]);
        if (tipoEnsayoResult.rows.length === 0) {
            throw new Error('Tipo de ensayo no encontrado para generar el código.');
        }
        const tipo_ensayo_codigo = tipoEnsayoResult.rows[0].codigo;

        // 3. Construct the final codigo_ensayo
        const formatCodePart = (code, length) => String(code).padStart(length, '0');

        const proyectoCodePart = proyecto_codigo || 'CU';
        let tramoCodePartFormatted;
        let progresivaCodePartFormatted;
        let managerTypeCode;

        if (parent_type === 'progresiva') {
            managerTypeCode = '1';
            tramoCodePartFormatted = formatCodePart(String(tramo_codigo).split('-').pop(), 3);
            progresivaCodePartFormatted = formatCodePart(String(progresiva_codigo).split('-').pop(), 5);
        } else if (parent_type === 'cantera') {
            managerTypeCode = '2';
            const canteraInfoResult = await client.query(`
                SELECT
                    c.codigo AS cantera_codigo,
                    tramo.codigo AS tramo_codigo,
                    p.codigo AS proyecto_codigo,
                    c.id_proyecto AS proyecto_id
                FROM canteras c
                LEFT JOIN proyectos p ON c.id_proyecto = p.id
                LEFT JOIN progresivas tramo ON c.tramo_id = tramo.id
                WHERE c.id = $1
            `, [cantera_id]);

            if (canteraInfoResult.rows.length === 0) {
                throw new Error(`Cantera con ID ${cantera_id} no encontrada para generar el código.`);
            }

            const { cantera_codigo, tramo_codigo: tramo_codigo_cantera, proyecto_codigo: proyecto_codigo_cantera, proyecto_id: proyecto_id_cantera } = canteraInfoResult.rows[0];
            proyecto_codigo = proyecto_codigo_cantera;
            proyecto_id = proyecto_id_cantera;

            tramoCodePartFormatted = formatCodePart(String(tramo_codigo_cantera).split('-').pop(), 3);
            // For canteras, the "progresiva" part is the cantera code
            progresivaCodePartFormatted = formatCodePart(cantera_codigo, 2);
        } else {
            tramoCodePartFormatted = '000'; // Default
            progresivaCodePartFormatted = '00000'; // Default
        }

        const estratoCodePart = formatCodePart(estrato_orden, 1);
        const tipoEnsayoCodePart = formatCodePart(tipo_ensayo_codigo, 2);
        const ensayoCorrelativoPart = formatCodePart(nextCorrelativo, 3); // Use the new correlativo

        const finalCodigoEnsayo = `${proyectoCodePart}${tramoCodePartFormatted}${managerTypeCode || ''}${progresivaCodePartFormatted}${estratoCodePart}${tipoEnsayoCodePart}${ensayoCorrelativoPart}`;

        // DEBUG: Log calculated parts if project determination fails
        if (!proyecto_id) {
            console.error('[createBaseEnsayo] ERROR: proyecto_id is null/undefined during coding generation.', {
                estrato_id, tipo_ensayo_id, parent_type, parent_id,
                progresivaInfoResult: typeof progresivaInfoResult !== 'undefined' ? progresivaInfoResult.rows : 'N/A',
                baseEnsayoData
            });
        }


        // 4. Perform a single INSERT with all data
        const insertQuery = `
            INSERT INTO ensayos (
                estrato_id, tipo_ensayo, nombre_ensayo, fecha, estado, 
                datos_formulario, proyecto_id, codigo_ensayo, correlativo_tipo_ensayo, identificador
            )
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9) 
            RETURNING id, codigo_ensayo, fecha, identificador;
        `;
        const values = [
            estrato_id,
            tipo_ensayo_id,
            nombre_ensayo,
            'pendiente',
            '{}',
            proyecto_id,
            finalCodigoEnsayo,
            nextCorrelativo,
            identificador || null
        ];

        const result = await client.query(insertQuery, values);


        if (needsTransaction) await client.query('COMMIT');

        return result.rows[0]; // Returns { id, codigo_ensayo }

    } catch (err) {
        if (needsTransaction) await client.query('ROLLBACK');
        console.error('Error al crear ensayo base en service:', err);
        throw new Error('Error al crear el ensayo base: ' + err.message);
    } finally {
        if (needsTransaction) client.release(); // Only release if we got the client
    }
};


const deleteEnsayo = async (id) => {
    try {
        const result = await db.query('DELETE FROM ensayos WHERE id = $1', [id]);
        return result.rowCount;
    } catch (err) {
        console.error('Error al eliminar ensayo en service:', err);
        throw new Error(`No se pudo eliminar el ensayo: ${err.message}`);
    }
};

const bulkDeleteEnsayos = async (ids) => {
    try {
        const result = await db.query('DELETE FROM ensayos WHERE id = ANY($1::int[])', [ids]);
        return result.rowCount;
    } catch (err) {
        console.error('Error en el borrado masivo de ensayos en service:', err);
        throw new Error(`No se pudo eliminar los ensayos: ${err.message}`);
    }
};

const getEnsayosByEstratoId = async (estratoId) => {
    try {
        const result = await db.query(
            'SELECT * FROM ensayos WHERE estrato_id = $1 ORDER BY fecha DESC',
            [estratoId]
        );
        return result.rows;
    } catch (err) {
        console.error('Error al obtener ensayos por estratoId en service:', err);
        throw new Error('Error al obtener ensayos por estratoId.');
    }
};

const getEnsayosByTramoId = async (tramoId) => {
    try {
        const result = await db.query(`
            SELECT
                e.id,
                e.nombre_ensayo,
                e.codigo_ensayo,
                e.fecha,
                e.resultado,
                e.estado,
                e.tipo_ensayo,
                e.estrato_id,
                e.datos_formulario,
                p.id AS proyecto_id,
                p.nombre_tramo AS proyecto_nombre,
                prog.id AS progresiva_id,
                prog.nombre AS progresiva_nombre,
                prog.descripcion AS progresiva_descripcion,
                prog.coordenada_este,
                prog.coordenada_norte,
                est.id AS estrato_perfil_id,
                est.nombre AS estrato_nombre,
                te.id AS tipo_ensayo_id,
                te.descripcion AS tipo_ensayo_descripcion,
                te.config_key,
                te.results_config,
                te.config_calculos, /* <--- AÑADIDO: Configuración para calcular al vuelo */
                est.orden AS estrato_orden
            FROM ensayos e
            LEFT JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
            LEFT JOIN estratos est ON e.estrato_id = est.id
            LEFT JOIN progresivas prog ON est.parent_type = 'progresiva' AND est.parent_id = prog.id
            LEFT JOIN proyectos p ON prog.proyecto_id = p.id
            WHERE prog.parent_id = $1
            ORDER BY te.descripcion, e.fecha DESC
        `, [tramoId]);

        return result.rows;
    } catch (err) {
        console.error('Error al obtener ensayos por tramoId en service:', err);
        throw new Error('Error al obtener ensayos por tramoId.');
    }
};


const exportEnsayosToExcelByTramo = async (tramoId) => {
    try {
        const tramoResult = await db.query('SELECT id, nombre, codigo FROM progresivas WHERE id = $1', [tramoId]);
        if (tramoResult.rows.length === 0) throw new Error('Tramo no encontrado.');
        const tramo = tramoResult.rows[0];

        const ensayosResult = await db.query(`
            SELECT e.*, te.descripcion AS tipo_ensayo_descripcion, te.config_export_excel, te.config_key,
                   prog.codigo AS progresiva_codigo, est.descripcion AS estrato_descripcion, est.orden AS estrato_orden
            FROM ensayos e
            JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
            JOIN estratos est ON e.estrato_id = est.id -- Join to generic estratos
            JOIN progresivas prog ON est.parent_type = 'progresiva' AND est.parent_id = prog.id -- Join to progresivas
            WHERE prog.parent_id = $1
            ORDER BY e.tipo_ensayo, e.fecha DESC
        `, [tramoId]);

        const normalizeString = (str) => {
            if (!str) return '';
            return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        };

        const staticHeaders = [
            { header: 'CÓDIGO ENSAYO', key: 'codigo_ensayo', width: 20 },
            { header: 'Fecha de Creación', key: 'fecha', width: 15 },
            { header: 'Progresiva', key: 'progresiva_formateada', width: 15 },
            { header: 'Estrato', key: 'estrato_orden', width: 10 },
            { header: 'Identificador', key: 'identificador_manual', width: 15 }
        ];

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        const formatProgresivaForExport = (codigo) => {
            if (!codigo || !codigo.includes('-')) return codigo;
            const parts = codigo.split('-');
            const numberPart = parts[1];
            return `0+${numberPart}`;
        };

        const ensayosAgrupados = ensayosResult.rows.reduce((acc, ensayo) => {
            const key = normalizeString(ensayo.config_key || ensayo.tipo_ensayo_descripcion);
            if (!acc[key]) {
                acc[key] = {
                    ensayos: [],
                    config: ensayo.config_export_excel,
                    description: ensayo.tipo_ensayo_descripcion
                };
            }
            acc[key].ensayos.push(ensayo);
            return acc;
        }, {});

        // START OF MODIFIED LOGIC TO HANDLE MULTIPLE SHEET CONFIGS
        for (const normalizedKey in ensayosAgrupados) {
            const grupo = ensayosAgrupados[normalizedKey];
            let configs = Array.isArray(grupo.config) ? grupo.config : [grupo.config]; // Convert to array if not already

            configs.forEach(config => {
                if (!config || (!config.tablas && !config.headers)) return; // Skip invalid configs

                const worksheet = workbook.addWorksheet(config.sheetName || normalizedKey);

                const mainTitleStyle = {
                    font: { bold: true, size: 14 },
                    alignment: { vertical: 'middle', horizontal: 'center' },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } },
                    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                };
                const groupedHeaderStyle = {
                    font: { bold: true },
                    alignment: { vertical: 'middle', horizontal: 'center' },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } },
                    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                };
                const subHeaderStyle = {
                    font: { bold: true },
                    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } },
                    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                };

                if (config.tablas && Array.isArray(config.tablas)) {
                    let currentRowIndex = 1;

                    if (config.mainTitle) {
                        const titleCell = worksheet.getCell(currentRowIndex, 1);
                        titleCell.value = config.mainTitle.replace('{tramo.nombre}', tramo.nombre);
                        worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, 20);
                        Object.assign(titleCell, mainTitleStyle);
                        currentRowIndex += 2;
                    }

                    config.tablas.forEach(tablaConfig => {
                        if (tablaConfig.title) {
                            const tableTitleCell = worksheet.getCell(currentRowIndex, 1);
                            const allHeadersForCount = [...staticHeaders, ...tablaConfig.headers];
                            const headerCount = allHeadersForCount.reduce((acc, h) => acc + (h.subheaders ? h.subheaders.length : 1), 0);
                            worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, headerCount > 0 ? headerCount : 1);
                            tableTitleCell.value = tablaConfig.title;
                            Object.assign(tableTitleCell, { ...groupedHeaderStyle, alignment: { ...groupedHeaderStyle.alignment, horizontal: 'left' } });
                            currentRowIndex++;
                        }

                        const headerKeys = [];
                        const headerRow = worksheet.getRow(currentRowIndex);
                        const allHeaders = [...staticHeaders, ...tablaConfig.headers];
                        const hasSubheaders = allHeaders.some(h => h.subheaders && h.subheaders.length > 0);
                        const subHeaderRow = hasSubheaders ? worksheet.getRow(currentRowIndex + 1) : null;
                        let colIndex = 1;

                        allHeaders.forEach(header => {
                            const cell = headerRow.getCell(colIndex);
                            cell.value = header.header;

                            if (header.subheaders && header.subheaders.length > 0) {
                                worksheet.mergeCells(currentRowIndex, colIndex, currentRowIndex, colIndex + header.subheaders.length - 1);
                                Object.assign(cell, groupedHeaderStyle);

                                header.subheaders.forEach((subheader, subIndex) => {
                                    const subCell = subHeaderRow.getCell(colIndex + subIndex);
                                    subCell.value = subheader.header;
                                    Object.assign(subCell, subHeaderStyle);
                                    headerKeys.push({ key: subheader.key, col: colIndex + subIndex });
                                });
                                colIndex += header.subheaders.length;
                            } else {
                                worksheet.mergeCells(currentRowIndex, colIndex, currentRowIndex + (hasSubheaders ? 1 : 0), colIndex);
                                Object.assign(cell, subHeaderStyle);
                                headerKeys.push({ key: header.key, col: colIndex });
                                colIndex++;
                            }
                        });

                        currentRowIndex += hasSubheaders ? 2 : 1;

                        grupo.ensayos.forEach(ensayo => {
                            const newRow = worksheet.getRow(currentRowIndex++);

                            headerKeys.forEach(({ key, col }) => {
                                let value;
                                if (key === 'progresiva_formateada') {
                                    value = formatProgresivaForExport(ensayo.progresiva_codigo);
                                } else {
                                    const dataPath = key.replace(/^datos_formulario\./, '');
                                    // Directamente usamos ensayo.datos_formulario en lugar de transformedData
                                    value = dataPath.split('.').reduce((o, i) => (o ? o[i] : undefined), ensayo.datos_formulario);

                                    // Fallback al objeto ensayo para claves como 'codigo_ensayo'
                                    if (value === undefined) {
                                        value = key.split('.').reduce((o, i) => (o ? o[i] : undefined), ensayo);
                                    }
                                }
                                newRow.getCell(col).value = value !== undefined && value !== null ? value : '';
                            });
                        });
                        currentRowIndex++;
                    });
                }
                else if (config.headers && Array.isArray(config.headers)) {
                    // Simplified logic for single-table export (kept as is)
                    let currentRowIndex = 1;
                    const headerKeys = [];
                    const headerRow = worksheet.getRow(currentRowIndex);
                    let colIndex = 1;

                    const allHeaders = [...staticHeaders, ...config.headers];
                    allHeaders.forEach(header => {
                        const cell = headerRow.getCell(colIndex);
                        cell.value = header.header;
                        Object.assign(cell, subHeaderStyle);
                        headerKeys.push({ key: header.key, col: colIndex });
                        colIndex++;
                    });

                    currentRowIndex++;

                    grupo.ensayos.forEach(ensayo => {
                        const newRow = worksheet.getRow(currentRowIndex++);
                        headerKeys.forEach(({ key, col }) => {
                            let value;
                            if (key === 'progresiva_formateada') {
                                value = formatProgresivaForExport(ensayo.progresiva_codigo);
                            } else if (key === 'identificador_manual') {
                                value = ensayo.codigo_ensayo; // Pre-fill with Code
                            } else {
                                const dataPath = key.replace(/^datos_formulario\./, '');
                                value = dataPath.split('.').reduce((o, i) => (o ? o[i] : undefined), ensayo.datos_formulario);
                                if (value === undefined) {
                                    value = key.split('.').reduce((o, i) => (o ? o[i] : undefined), ensayo);
                                }
                            }
                            newRow.getCell(col).value = value !== undefined && value !== null ? value : '';
                        });
                    });
                }

                worksheet.columns.forEach((column, idx) => {
                    if (idx < staticHeaders.length) { // Check if it's one of our static headers
                        const staticHeader = staticHeaders[idx]; // idx is 0-indexed
                        if (staticHeader.width) {
                            column.width = staticHeader.width;
                            return; // Skip dynamic calculation if fixed width is set
                        }
                    }

                    let maxLength = 0;
                    column.eachCell({ includeEmpty: true }, cell => {
                        const length = cell.value ? String(cell.value).length : 10;
                        if (length > maxLength) {
                            maxLength = length;
                        }
                    });
                    column.width = Math.min(50, Math.max(12, maxLength + 2));
                });
            }); // END configs.forEach
        } // END for (const normalizedKey in ensayosAgrupados)
        // END OF MODIFIED LOGIC

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;

    } catch (err) {
        console.error('Error al exportar ensayos a Excel:', err);
        throw new Error('Error al exportar ensayos a Excel: ' + err.message);
    }
};

const exportEnsayosToExcelByTipo = async (tramoId, tipoEnsayoId) => {
    try {
        const tramoResult = await db.query('SELECT id, nombre, codigo FROM progresivas WHERE id = $1', [tramoId]);
        if (tramoResult.rows.length === 0) throw new Error('Tramo no encontrado.');
        const tramo = tramoResult.rows[0];

        const ensayosResult = await db.query(`
            SELECT e.*, te.descripcion AS tipo_ensayo_descripcion, te.config_export_excel, te.config_key,
                   prog.codigo AS progresiva_codigo, est.descripcion AS estrato_descripcion, est.orden AS estrato_orden
            FROM ensayos e
            JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
            JOIN estratos est ON e.estrato_id = est.id
            JOIN progresivas prog ON est.parent_type = 'progresiva' AND est.parent_id = prog.id
            WHERE prog.parent_id = $1 AND e.tipo_ensayo = $2
            ORDER BY e.fecha DESC
        `, [tramoId, tipoEnsayoId]);

        let config_export_excel, tipo_ensayo_descripcion;

        if (ensayosResult.rows.length === 0) {
            // Si no hay ensayos, buscamos la configuración directamente del tipo de ensayo para generar la plantilla vacía
            const tipoEnsayoResult = await db.query('SELECT descripcion, config_export_excel FROM tipo_ensayo WHERE id = $1', [tipoEnsayoId]);
            if (tipoEnsayoResult.rows.length === 0) throw new Error('Tipo de ensayo no encontrado.');

            config_export_excel = tipoEnsayoResult.rows[0].config_export_excel;
            tipo_ensayo_descripcion = tipoEnsayoResult.rows[0].descripcion;
        } else {
            config_export_excel = ensayosResult.rows[0].config_export_excel;
            tipo_ensayo_descripcion = ensayosResult.rows[0].tipo_ensayo_descripcion;
        }

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        const formatProgresivaForExport = (codigo) => {
            if (!codigo || !codigo.includes('-')) return codigo;
            const parts = codigo.split('-');
            const numberPart = parts[1];
            return `0+${numberPart}`;
        };

        const staticHeaders = [
            { header: 'CÓDIGO ENSAYO', key: 'codigo_ensayo', width: 20 },
            { header: 'Fecha de Creación', key: 'fecha', width: 15 },
            { header: 'Progresiva', key: 'progresiva_formateada', width: 15 },
            { header: 'Estrato', key: 'estrato_orden', width: 10 },
            { header: 'Identificador', key: 'identificador', width: 15 }
        ];

        const mainTitleStyle = {
            font: { bold: true, size: 14 },
            alignment: { vertical: 'middle', horizontal: 'center' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        };
        const groupedHeaderStyle = {
            font: { bold: true },
            alignment: { vertical: 'middle', horizontal: 'center' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        };
        const subHeaderStyle = {
            font: { bold: true },
            alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        };

        // --- INICIO DE LA LÓGICA CORREGIDA ---
        let configs = Array.isArray(config_export_excel) ? config_export_excel : [config_export_excel];

        configs.forEach(config => {
            if (!config || (!config.tablas && !config.headers)) return;

            const worksheet = workbook.addWorksheet(config.sheetName || tipo_ensayo_descripcion);

            if (config.tablas && Array.isArray(config.tablas)) {
                let currentRowIndex = 1;

                if (config.mainTitle) {
                    const titleCell = worksheet.getCell(currentRowIndex, 1);
                    titleCell.value = config.mainTitle.replace('{tramo.nombre}', tramo.nombre);
                    worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, 20);
                    Object.assign(titleCell, mainTitleStyle);
                    currentRowIndex += 2;
                }

                config.tablas.forEach(tablaConfig => {
                    if (tablaConfig.title) {
                        const tableTitleCell = worksheet.getCell(currentRowIndex, 1);
                        const allHeadersForCount = [...staticHeaders, ...tablaConfig.headers];
                        const headerCount = allHeadersForCount.reduce((acc, h) => acc + (h.subheaders ? h.subheaders.length : 1), 0);
                        worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, headerCount > 0 ? headerCount : 1);
                        tableTitleCell.value = tablaConfig.title;
                        Object.assign(tableTitleCell, { ...groupedHeaderStyle, alignment: { ...groupedHeaderStyle.alignment, horizontal: 'left' } });
                        currentRowIndex++;
                    }

                    const headerKeys = [];
                    const headerRow = worksheet.getRow(currentRowIndex);
                    const allHeaders = [...staticHeaders, ...tablaConfig.headers];
                    const hasSubheaders = allHeaders.some(h => h.subheaders && h.subheaders.length > 0);
                    const subHeaderRow = hasSubheaders ? worksheet.getRow(currentRowIndex + 1) : null;
                    let colIndex = 1;

                    allHeaders.forEach(header => {
                        const cell = headerRow.getCell(colIndex);
                        cell.value = header.header;

                        if (header.subheaders && header.subheaders.length > 0) {
                            worksheet.mergeCells(currentRowIndex, colIndex, currentRowIndex, colIndex + header.subheaders.length - 1);
                            Object.assign(cell, groupedHeaderStyle);

                            header.subheaders.forEach((subheader, subIndex) => {
                                const subCell = subHeaderRow.getCell(colIndex + subIndex);
                                subCell.value = subheader.header;
                                Object.assign(subCell, subHeaderStyle);
                                headerKeys.push({ key: subheader.key, col: colIndex + subIndex });
                            });
                            colIndex += header.subheaders.length;
                        } else {
                            worksheet.mergeCells(currentRowIndex, colIndex, currentRowIndex + (hasSubheaders ? 1 : 0), colIndex);
                            Object.assign(cell, subHeaderStyle);
                            headerKeys.push({ key: header.key, col: colIndex });
                            colIndex++;
                        }
                    });

                    currentRowIndex += hasSubheaders ? 2 : 1;

                    ensayosResult.rows.forEach(ensayo => {
                        const newRow = worksheet.getRow(currentRowIndex++);

                        headerKeys.forEach(({ key, col }) => {
                            let value;
                            if (key === 'progresiva_formateada') {
                                value = formatProgresivaForExport(ensayo.progresiva_codigo);
                            } else {
                                const dataPath = key.replace(/^datos_formulario\./, '');
                                value = dataPath.split('.').reduce((o, i) => (o ? o[i] : undefined), ensayo.datos_formulario);
                                if (value === undefined) {
                                    value = key.split('.').reduce((o, i) => (o ? o[i] : undefined), ensayo);
                                }
                            }
                            newRow.getCell(col).value = value !== undefined && value !== null ? value : '';
                        });
                    }); currentRowIndex++;
                });
            }

            worksheet.columns.forEach((column, idx) => {
                // Check if this column corresponds to a static header with an explicit width
                // ExcelJS column.number is 1-indexed, idx is 0-indexed
                if (idx < staticHeaders.length) {
                    const staticHeader = staticHeaders[idx];
                    if (staticHeader.width) {
                        column.width = staticHeader.width;
                        return; // Skip dynamic calculation if fixed width is set
                    }
                }

                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, cell => {
                    const length = cell.value ? String(cell.value).length : 10;
                    if (length > maxLength) {
                        maxLength = length;
                    }
                });
                column.width = Math.min(50, Math.max(12, maxLength + 2));
            });
        });
        // --- FIN DE LA LÓGICA CORREGIDA ---

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;

    } catch (err) {
        console.error(`Error al exportar ensayos por tipo ${tipoEnsayoId}:`, err);
        throw new Error('Error al exportar ensayos a Excel: ' + err.message);
    }
};



const updateBaseEnsayo = async (ensayoId, { nombre_ensayo, estado }) => {
    try {
        const query = `
            UPDATE ensayos 
            SET 
                nombre_ensayo = $1, 
                estado = $2
            WHERE id = $3
            RETURNING *;
        `;
        const values = [nombre_ensayo, estado, ensayoId];
        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            throw new Error('No se encontró el ensayo para actualizar.');
        }

        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar ensayo base en service:', err);
        throw new Error('Error al actualizar el ensayo base.');
    }
};

const importarEnsayos = async (proyectoId, tramoId, fileBuffer, user, isSimulation = false, tipoEnsayoKey = null) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN'); // Start transaction

        const XLSX = require('xlsx');

        const normalizeString = (str) => {
            if (!str) return '';
            return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        };
        const normalizeHeader = (str) => normalizeString(str).replace(/\s+/g, '');
        const normalizeCode = (str) => {
            if (!str) return '';
            return String(str).trim(); // Simple trim for now, can add toLowerCase if needed
        };

        const parseExcelDate = (excelDate) => {
            if (!excelDate) return null;
            // Si es número (serial excel)
            if (typeof excelDate === 'number') {
                // Excel base date: Dec 30 1899
                // Javascript base date: Jan 1 1970
                // Difference: 25569 days
                // Sumamos 12h (43200000ms) para caer a mediodía y evitar errores de redondeo al día anterior
                const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000) + 43200000);
                return isNaN(date.getTime()) ? null : date;
            }
            // Si es string, intentar parsear
            const date = new Date(excelDate);
            return isNaN(date.getTime()) ? null : date;
        };

        const normalizeProgresivaForLookup = (input) => {
            if (input === null || input === undefined) return null;
            // Limpieza básica: quitar 'km', 'KM', 'Km' y espacios
            let str = String(input).replace(/km/ig, '').trim().replace(/\s+/g, '');

            // Intentar detectar separador + o -
            // Usamos split en lugar de regex estricto para tolerar decimales
            let parts = [];
            if (str.includes('+')) {
                parts = str.split('+');
            } else if (str.includes('-')) {
                parts = str.split('-'); // Cuidado con negativos al inicio, pero progresivas suelen ser positivas
            }

            if (parts.length === 2 && parts[0] !== '' && parts[1] !== '') {
                const km = parseFloat(parts[0]);
                const m = parseFloat(parts[1]);
                // Si ambos lados son números válidos
                if (!isNaN(km) && !isNaN(m)) {
                    // Retornamos metros totales.
                    // Usamos Math.round(X * 100) / 100 para manejar hasta 2 decimales de precision si existen
                    return Math.round((km * 1000 + m) * 100) / 100;
                }
            }

            // Si no hubo separador, o falló el parseo, intentar parsear directo como número (metros totales)
            const val = parseFloat(str);
            if (!isNaN(val)) {
                return Math.round(val * 100) / 100;
            }

            // Fallback: retornar string limpia por si acaso hay match exacto de texto (raro si usamos logica numerica)
            return null;
        };

        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const validationErrors = [];
        const summary = { ensayosAProcesar: 0, ensayosParaCrear: 0, ensayosParaActualizar: 0 };
        let newEnsayoCounter = 0; // Contador para códigos únicos

        // --- Fase 0: Validación de Hojas y Cabeceras ---
        // 1. Build a map from every possible sheet name to its parent assay type info
        const tipoEnsayoResult = await client.query('SELECT id, descripcion, config_key, config_export_excel, config_importacion FROM tipo_ensayo');
        const sheetNameToAssayTypeMap = new Map();

        tipoEnsayoResult.rows.forEach(tipoEnsayo => {
            if (!tipoEnsayo.config_export_excel) return;

            // Ensure config is an array to handle both single and multi-sheet configs
            const configs = Array.isArray(tipoEnsayo.config_export_excel)
                ? tipoEnsayo.config_export_excel
                : [tipoEnsayo.config_export_excel];

            const importConfig = tipoEnsayo.config_importacion || {};

            configs.forEach(config => {
                if (config.sheetName) {
                    const assayTypeInfo = {
                        id: tipoEnsayo.id,
                        config_key: tipoEnsayo.config_key,
                        description: tipoEnsayo.descripcion,
                        // Pass the specific config for this sheet, which contains the correct headers
                        configForSheet: config,
                        importConfig: importConfig
                    };
                    const normName = normalizeString(config.sheetName);
                    if (!sheetNameToAssayTypeMap.has(normName)) {
                        sheetNameToAssayTypeMap.set(normName, []);
                    }
                    sheetNameToAssayTypeMap.get(normName).push(assayTypeInfo);
                }
            });
        }
        );

        console.log('[IMPORT DEBUG] Mapped Sheets from DB Config:', Array.from(sheetNameToAssayTypeMap.keys()));

        const requiredHeaders = ['codigoensayo', 'fechadecreacion', 'progresiva', 'estrato'];
        const sheetsData = [];
        const pendingEnsayoMap = new Map(); // Track pending inserts for merging across sheets

        // 2. Validate sheets from the uploaded workbook against the map
        for (const sheetName of workbook.SheetNames) {
            const normalizedSheetName = normalizeString(sheetName);
            let candidates = sheetNameToAssayTypeMap.get(normalizedSheetName);

            if (!candidates) {
                // This sheet is not defined in any assay's export config
                validationErrors.push({ sheet: sheetName, error: `La hoja '${sheetName}' no corresponde a un tipo de ensayo válido o su configuración de exportación no está definida.` });
                continue;
            }

            // Filter by specific type if requested (e.g. from specific import button)
            if (tipoEnsayoKey) {
                // frontend sends "key:id" sometimes, we need to extract just the key or handle it
                let cleanKey = tipoEnsayoKey;
                if (tipoEnsayoKey.includes(':')) {
                    cleanKey = tipoEnsayoKey.split(':')[0];
                }
                candidates = candidates.filter(c => normalizeString(c.config_key) === normalizeString(cleanKey));
                if (candidates.length === 0) continue; // Skip sheets not belonging to the requested type
            }

            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length < 1) continue;

            // --- SMART TYPE SELECTION LOGIC ---
            // Issue: 'Humedad Natural' might map to both 'Límites' (ID 2) and 'Contenido Humedad' (ID 5).
            // We need to pick the one that matches the PENDING assay if possible.
            // We peek at the first data row to finding the 'Codigo'.
            let selectedTypeInfo = candidates[0]; // Default to first match

            if (candidates.length > 1) {
                // Try to find a code in the first data row
                // We know structure is [Header, (Subheader?), Data...]
                // Let's guess where data starts based on first candidate's config
                const config0 = candidates[0].configForSheet || {};
                const hasSub0 = config0.tablas?.some(t => t.headers.some(h => h.subheaders));
                const dataRowIndex = hasSub0 ? 2 : 1;
                // Note: This is an approximation. If candidates have different structures, this might be flaky, 
                // but typically Code is always Col 0.

                if (jsonData.length > dataRowIndex) {
                    const firstRow = jsonData[dataRowIndex];
                    if (firstRow && firstRow[0]) {
                        const potentialCode = normalizeCode(firstRow[0]);
                        // Check if this code is already pending
                        const pending = pendingEnsayoMap.get(potentialCode);
                        if (pending) {
                            // If pending assay exists, check if its type is in our candidates list
                            const match = candidates.find(c => c.id === pending.tipo_ensayo_id);
                            if (match) {
                                console.log(`[IMPORT SMART SELECT] Sheet '${sheetName}' (Code ${potentialCode}) matches pending assay type '${match.description}' (ID ${match.id}). Using it.`);
                                selectedTypeInfo = match;
                            }
                        }
                    }
                }
            }

            const tipoEnsayoInfo = selectedTypeInfo;
            // ----------------------------------

            // The config is now specific to the sheet, passed from the map
            const config = tipoEnsayoInfo.configForSheet || {};
            const hasSubheaders = config.tablas?.some(t => t.headers.some(h => h.subheaders));

            let headers, dataRows;

            // Función auxiliar para desambiguar headers repetidos (ej: "0.64 mm", "0.64 mm") -> ("0.64 mm", "0.64 mm_1")
            const makeHeadersUnique = (headerRow) => {
                const counts = {};
                return headerRow.map(h => {
                    const normalized = normalizeHeader(h);
                    if (!normalized) return normalized;

                    if (counts[normalized] === undefined) {
                        counts[normalized] = 0;
                        return normalized;
                    } else {
                        counts[normalized]++;
                        return `${normalized}_${counts[normalized]}`; // ej: titulo_1
                    }
                });
            };

            if (hasSubheaders) {
                if (jsonData.length < 2) continue; // Skip if there aren't enough rows for complex headers
                headers = makeHeadersUnique(jsonData[1]);
                dataRows = jsonData.slice(2);
            } else {
                headers = makeHeadersUnique(jsonData[0]);
                dataRows = jsonData.slice(1);
            }

            console.log(`[IMPORT DEBUG] Headers Procesados y Unicos:`, JSON.stringify(headers));

            // Validate main headers (always in the first row)
            const mainHeaders = jsonData[0].map(h => normalizeHeader(h));
            console.info(`[IMPORT DEBUG] Sheet: ${sheetName}, Normalized Main Headers: ${JSON.stringify(mainHeaders)}`);
            for (let i = 0; i < requiredHeaders.length; i++) {
                if (mainHeaders[i] !== requiredHeaders[i]) {
                    // FIX: rowIndex is not defined in this scope. Provide a static row number for the header.
                    validationErrors.push({ sheet: sheetName, row: 1, error: `La columna ${i + 1} debe ser '${requiredHeaders[i].toUpperCase()}' pero se encontró '${jsonData[0][i] || ''}'.` });
                }
            }

            sheetsData.push({
                sheetName,
                headers,
                rows: dataRows,
                tipoEnsayo: {
                    id: tipoEnsayoInfo.id,
                    descripcion: tipoEnsayoInfo.description,
                    config_key: tipoEnsayoInfo.config_key,
                    importConfig: tipoEnsayoInfo.importConfig
                },
                config // Pass config for later use
            });
        }

        if (validationErrors.length > 0) {
            throw { validationErrors };
        }

        // --- Fase A: Búsqueda Masiva de Datos ---
        // 1. Obtener datos del Tramo Padre para calculo de offset (por si acaso, aunque intentaremos usar progresiva_inicial)
        const tramoResult = await client.query('SELECT codigo FROM progresivas WHERE id = $1', [tramoId]);
        let tramoStartOffset = 0;
        if (tramoResult.rows.length > 0) {
            const tramoCodigo = tramoResult.rows[0].codigo;
            const normalizedTramoCode = normalizeProgresivaForLookup(tramoCodigo);
            if (normalizedTramoCode !== null) {
                tramoStartOffset = normalizedTramoCode;
            }
        }

        // CAMBIO CLAVE: Usar 'progresiva_inicial' en lugar de 'codigo' para el mapeo, ya que suele contener el valor limpio (ej: 500)
        const progresivasQuery = await client.query('SELECT id, codigo, progresiva_inicial FROM progresivas WHERE parent_id = $1', [tramoId]);

        const progresivaDbMap = new Map();
        progresivasQuery.rows.forEach(p => {
            // Prioridad 1: Usar progresiva_inicial (numérico/limpio)
            let key = null;
            if (p.progresiva_inicial !== null && p.progresiva_inicial !== undefined) {
                key = Number(p.progresiva_inicial); // Asegurar numérico
            } else {
                // Fallback: Usar código normalizado
                key = normalizeProgresivaForLookup(p.codigo);
            }
            if (key !== null) {
                progresivaDbMap.set(key, p.id);
            }
        });

        const estratosQuery = await client.query("SELECT id, orden, parent_id AS progresiva_id FROM estratos WHERE parent_type = 'progresiva' AND parent_id = ANY($1::int[])", [progresivasQuery.rows.map(p => p.id)]);
        // Mapeo Estratos: Clave "ProgresivaID-Orden" -> EstratoID
        const estratoDbMap = new Map(estratosQuery.rows.map(e => [`${e.progresiva_id}-${e.orden}`, e.id]));

        const ensayosQuery = await client.query('SELECT id, codigo_ensayo, identificador, tipo_ensayo FROM ensayos WHERE proyecto_id = $1', [proyectoId]);
        // Map Key: "CODE|TYPE_ID"
        const ensayoCodeMap = new Map(ensayosQuery.rows.map(e => [`${normalizeCode(e.codigo_ensayo)}|${e.tipo_ensayo}`, e.id]));

        // --- NEW: Persistent Identifier Map ---
        // Map 'IDENTIFIER|TYPE_ID' -> EnsayoID
        const identificadorDbMap = new Map();
        ensayosQuery.rows.forEach(e => {
            if (e.identificador) {
                identificadorDbMap.set(`${normalizeString(e.identificador)}|${e.tipo_ensayo}`, e.id);
            }
        });
        // --------------------------------------

        // --- Fase B: Simulación y Recopilación de Errores ---
        const ensayosToInsert = []; // Will store data for createBaseEnsayo calls
        const ensayosToUpdate = [];
        let lastProgresiva = null;
        let lastEstrato = null;

        for (const sheet of sheetsData) {
            const config = sheet.config || {};
            console.log(`[IMPORT DEBUG] Sheet: ${sheet.sheetName}, Config Full:`, JSON.stringify(config)); // Inspect DB content
            const allConfigHeaders = config.tablas?.flatMap(t => t.headers.flatMap(h => h.subheaders ? h.subheaders : [h])) || config.headers || [];
            // Usar un array ordenado de claves en lugar de un mapa para manejar cabeceras duplicadas
            const keyOrder = allConfigHeaders.map(h => h.key);
            console.info(`[IMPORT DEBUG] Sheet: ${sheet.sheetName}, Key Order: ${JSON.stringify(keyOrder)}`);

            for (const [rowIndex, row] of sheet.rows.entries()) {
                const isRowEmpty = row.every(cell => cell === null || cell === undefined || String(cell).trim() === '');
                const isSubHeader = (!row[0] && !row[1] && !row[2] && typeof row[3] === 'string' && isNaN(parseFloat(row[3])));

                if (isRowEmpty || isSubHeader) {
                    continue;
                }

                summary.ensayosAProcesar++;

                let codigoEnsayo = normalizeCode(row[0]);
                // Corrected indices: [0]Code, [1]Date, [2]Progresiva, [3]Estrato, [4]Identificador
                let progresivaValue = row[2] ? String(row[2]) : lastProgresiva;
                let estratoValue = row[3] ? String(row[3]) : lastEstrato;
                let identificador = row[4] ? String(row[4]).trim() : null; // New Column

                // DEBUG: Trace identificador reading
                console.log(`[IMPORT READ] Row ${rowIndex}: Identificador raw='${row[4]}', parsed='${identificador}'`);

                // --- VALIDACIÓN ANTI-FANTASMAS ---
                // Si la fila NO tiene Código, NI Progresiva explicita, NI Identificador...
                // ...entonces es probablemente una fila basura/residual. NO heredar contexto.
                // Exigimos al menos UN identificador explícito para procesar una nueva fila si no trae progresiva.
                if (!codigoEnsayo && !row[2] && !identificador) {
                    console.log(`[IMPORT SKIP] Row ${rowIndex} ignorada: No tiene Código, Progresiva ni Identificador explícito.`);
                    continue;
                }

                if (progresivaValue) lastProgresiva = progresivaValue;
                if (estratoValue) lastEstrato = estratoValue;

                // Priority for Merging: 1. Manual Identifier, 2. Automatic Code
                let mergeKey = identificador ? normalizeString(identificador) : normalizeCode(codigoEnsayo);

                const hasSubheaders = config.tablas?.some(t => t.headers.some(h => h.subheaders));
                if (!progresivaValue || !estratoValue) {
                    validationErrors.push({ sheet: sheet.sheetName, row: rowIndex + (hasSubheaders ? 3 : 2), error: "Las columnas 'Progresiva' y 'Estrato' no pueden estar vacías." });
                    continue;
                }

                const normalizedProgresiva = normalizeProgresivaForLookup(progresivaValue);
                // 1. Try Direct Lookup
                let progresivaId = progresivaDbMap.get(normalizedProgresiva);

                // 2. If failed, try with Offset (Relative -> Absolute)
                if (!progresivaId && tramoStartOffset > 0 && normalizedProgresiva !== null) {
                    const absoluteProgresiva = normalizedProgresiva + tramoStartOffset;
                    // Handle float precision if needed, though map keys should match
                    // Let's try direct exact match first
                    progresivaId = progresivaDbMap.get(absoluteProgresiva);
                }



                if (!progresivaId) {
                    validationErrors.push({ sheet: sheet.sheetName, row: rowIndex + (hasSubheaders ? 3 : 2), error: `La progresiva '${progresivaValue}' no se encontró en este tramo. (Valor leído: ${progresivaValue})` });
                    continue;
                }

                const estratoId = estratoDbMap.get(`${progresivaId}-${estratoValue}`);
                if (!estratoId) {
                    validationErrors.push({ sheet: sheet.sheetName, row: rowIndex + (hasSubheaders ? 3 : 2), error: `El estrato '${estratoValue}' no se encontró para la progresiva '${progresivaValue}'.` });
                    continue;
                }

                const datos_formulario = {};

                // --- NUEVA LÓGICA: Usar headers detectados del Excel ---
                if (sheet.headers && sheet.headers.length > 0) {
                    row.forEach((cellValue, index) => {
                        const headerKey = sheet.headers[index];
                        if (headerKey) {
                            // Guardamos con la clave EXACTA del header (ej: "0.64mm_1")
                            // Esto permite que luego el key_map encuentre la coincidencia.
                            datos_formulario[headerKey] = cellValue;
                        }
                    });
                } else {
                    // --- LÓGICA DEFAULT ANTIGUA (Fallback) ---
                    // Se basa en posición fija asumiendo que el Excel coincide con config_export
                    row.forEach((cellValue, index) => {
                        // Omitir las 5 primeras columnas estáticas
                        if (index < 5) return;
                        const dataKey = keyOrder[index - 5];
                        if (dataKey) {
                            setNestedProperty(datos_formulario, dataKey, cellValue);
                        }
                    });
                }

                // --- TRANSFORMACIÓN DE DATOS DINÁMICA (Basada en DB) ---
                if (sheet.tipoEnsayo.importConfig) {
                    // 1. Obtener mapa global
                    let keyMap = sheet.tipoEnsayo.importConfig.key_map || {};

                    // 2. Obtener mapa específico de la hoja (si existe) y mezclar (sobrescribe globales)
                    if (sheet.tipoEnsayo.importConfig.sheets) {
                        const sheetName = sheet.sheetName; // Fixed: sheet.sheetName
                        const configSheet = sheet.tipoEnsayo.importConfig.sheets[sheetName];

                        console.log(`[IMPORT DEBUG] Sheet '${sheetName}' - Buscando config específica... Encontrada? ${!!configSheet}. Keys disponibles: ${Object.keys(sheet.tipoEnsayo.importConfig.sheets).join(', ')}`);

                        if (configSheet && configSheet.key_map) {
                            console.log(`[IMPORT DEBUG] Sheet '${sheetName}' - Aplicando KeyMap Específico!`, JSON.stringify(configSheet.key_map));
                            keyMap = { ...keyMap, ...configSheet.key_map };
                        }
                    }

                    // Log final del mapa para fecha
                    console.log(`[IMPORT DEBUG] Sheet '${sheet.sheetName}': KeyMap FINAL listo. Mapeo para 'fecha':`, JSON.stringify(keyMap['fecha']));

                    // Iterar sobre las claves que llegaron del Excel (que están planas en datos_formulario porque así las leímos inicialmente)
                    // Usamos un array de las claves para no iterar sobre propiedades nuevas que vayamos añadiendo
                    const originalKeys = Object.keys(datos_formulario);

                    originalKeys.forEach(excelKey => {
                        const targetPath = keyMap[excelKey];

                        if (targetPath) {
                            // Si hay instrucción de mover este dato a una ruta especifica
                            let value = datos_formulario[excelKey];

                            // --- AUTO-CONVERSION DE FECHAS/HORAS EXCEL ---
                            let numValue = parseFloat(value);

                            const isDateTarget = Array.isArray(targetPath) ? targetPath.some(t => t.toLowerCase().includes('fecha')) : targetPath.toLowerCase().includes('fecha');
                            const isTimeTarget = Array.isArray(targetPath) ? targetPath.some(t => t.toLowerCase().includes('hora')) : targetPath.toLowerCase().includes('hora');

                            // Si el destino es 'fecha' y el valor parece una fecha Excel (> 40000)
                            if (isDateTarget && !isNaN(numValue) && numValue > 40000 && numValue < 80000) {
                                const parsedDate = parseExcelDate(numValue);
                                if (parsedDate) {
                                    value = parsedDate.toISOString().split('T')[0];
                                }
                            }
                            // Si el destino es 'hora' y el valor es fracción de día (< 1)
                            else if (isTimeTarget && !isNaN(numValue) && numValue < 1 && numValue > 0) {
                                // Convertir fracción de día a HH:mm
                                const totalSeconds = Math.round(numValue * 86400);
                                const hours = Math.floor(totalSeconds / 3600);
                                const minutes = Math.floor((totalSeconds % 3600) / 60);
                                value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            }
                            // ---------------------------------------------

                            // 1. Si la ruta es un array (Multi-Target) o tiene puntos (Deep Path)
                            if (Array.isArray(targetPath) || targetPath.includes('.')) {
                                if (Array.isArray(targetPath)) {
                                    targetPath.forEach(path => setNestedProperty(datos_formulario, path, value));
                                } else {
                                    setNestedProperty(datos_formulario, targetPath, value);
                                }

                                // Borrar la clave original plana para no dejar basura, 
                                // salvo que la clave original sea parte de la ruta (raro)
                                const rootPath = Array.isArray(targetPath) ? null : targetPath.split('.')[0];
                                if (excelKey !== rootPath) {
                                    delete datos_formulario[excelKey];
                                }
                            } else {
                                // 2. Si es una renombración simple en la raiz (ej: "Old" -> "New")
                                datos_formulario[targetPath] = value;
                                if (excelKey !== targetPath) {
                                    delete datos_formulario[excelKey];
                                }
                            }
                        }
                    });
                }
                // --------------------------------------------------------

                if (codigoEnsayo || mergeKey) {
                    // Normalización de fecha (Col 1)
                    const fechaRaw = row[1];
                    let fecha = null;
                    if (fechaRaw) {
                        const parsedDate = parseExcelDate(fechaRaw);
                        if (parsedDate) {
                            fecha = parsedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                        } else {
                            validationErrors.push({ sheet: sheet.sheetName, row: rowIndex + (hasSubheaders ? 3 : 2), error: `Formato de fecha inválido en columna 'Fecha': '${fechaRaw}'.` });
                            continue;
                        }
                    } else {
                        // If date is empty, use current date as fallback, but warn
                        console.warn(`[IMPORT WARNING] Sheet '${sheet.sheetName}', row ${rowIndex + (hasSubheaders ? 3 : 2)}: Fecha vacía. Usando fecha actual.`);
                        fecha = new Date().toISOString().split('T')[0];
                    }

                    // GENERATE COMPOSITE KEY FOR UNIQUENESS PROPERLY SCOPED BY TYPE
                    const baseIdentifier = mergeKey || codigoEnsayo;
                    const compositeKey = `${baseIdentifier}|${sheet.tipoEnsayo.id}`;

                    if (baseIdentifier) {
                        // Check if this assay (by compositeKey) is already pending (from PREVIOUS sheets OR current sheet duplicate)
                        let pending = pendingEnsayoMap.get(compositeKey);

                        // DUPLICATE CHECK WITHIN SAME SHEET
                        if (pending && pending._sheetName === sheet.sheetName) {
                            validationErrors.push({
                                sheet: sheet.sheetName,
                                row: rowIndex + (hasSubheaders ? 3 : 2),
                                error: `Identificador duplicado '${baseIdentifier}' detectado en la misma hoja. Ya existe un ensayo para este tipo en la fila anterior.`
                            });
                            continue; // Skip processing this duplicate row
                        }

                        // --- NEW: Check Persistent DB for Merge ---
                        // If not pending in memory, check if it exists in DB via Identificador + Type OR Code + Type
                        let existingEnsayoId = null;

                        // 1. Check by Manual Identifier + Type
                        const dbKeyId = `${normalizeString(identificador || '')}|${sheet.tipoEnsayo.id}`;
                        if (!pending && identificador && identificadorDbMap.has(dbKeyId)) {
                            existingEnsayoId = identificadorDbMap.get(dbKeyId);
                            // console.log(`[IMPORT PERSIST] Found existing assay by Identifier '${identificador}' Type ${sheet.tipoEnsayo.id} -> ID ${existingEnsayoId}`);
                        }

                        // 2. Fallback to Code + Type
                        if (!existingEnsayoId && codigoEnsayo && ensayoCodeMap) {
                            const normCode = normalizeCode(codigoEnsayo);
                            const dbKeyCode = `${normCode}|${sheet.tipoEnsayo.id}`;
                            if (ensayoCodeMap.has(dbKeyCode)) {
                                existingEnsayoId = ensayoCodeMap.get(dbKeyCode);
                            }
                        }
                        // ------------------------------------------

                        if (existingEnsayoId) {
                            // UPDATE EXISTING DB ENTRY
                            ensayosToUpdate.push({
                                ensayoId: existingEnsayoId,
                                estrato_id: estratoId,
                                datos_formulario,
                                fecha,
                                identificador: identificador
                            });
                            summary.ensayosParaActualizar++;
                        } else if (pending) {
                            // NEW ENTRY (Mergeable across sheets) - Already pending in memory
                            if (identificador && !pending.identificador) {
                                pending.identificador = identificador;
                            }

                            // Merge datos_formulario
                            if (datos_formulario) {
                                pending.datos_formulario = deepMerge(pending.datos_formulario || {}, datos_formulario);
                            }

                            if (pending.estrato_id !== estratoId) {
                                console.warn(`[IMPORT WARNING] Code '${codigoEnsayo}' has different stratums in different sheets! Keeping first one.`);
                            }
                        } else {
                            // CREATE NEW PENDING
                            const newEnsayoObj = {
                                type: 'pending', // Marker
                                tipo_ensayo_id: sheet.tipoEnsayo.id,
                                estrato_id: estratoId,
                                codigo_ensayo: codigoEnsayo || mergeKey,
                                fecha: fecha,
                                datos_formulario: datos_formulario,
                                progresiva_id: progresivaId,
                                _mergeKey: baseIdentifier,
                                _sheetName: sheet.sheetName,
                                identificador: identificador,
                                proyecto_id: proyectoId
                            };

                            pendingEnsayoMap.set(compositeKey, newEnsayoObj);
                            summary.ensayosParaCrear++;
                        }
                    }
                } else {
                    // NO CODE -> ALWAYS NEW, NO MERGE
                    ensayosToInsert.push({
                        tipo_ensayo_id: sheet.tipoEnsayo.id,
                        estrato_id: estratoId,
                        proyecto_id: proyectoId,
                        datos_formulario: datos_formulario,
                        nombre_ensayo: `Importado - ${sheet.sheetName}`
                    });
                    summary.ensayosParaCrear++;
                }

            }
        }

        // --- FLUSH PENDING MERGES ---
        // Add pending assays from map to insertion list (deduplicating objects)
        const flushedPending = new Set();
        for (const pending of pendingEnsayoMap.values()) {
            if (!flushedPending.has(pending)) {
                // Ensure name is set if not already (it should be)
                if (!pending.nombre_ensayo) {
                    pending.nombre_ensayo = `Importado (${pending.codigo_ensayo || 'S/C'})`;
                }
                ensayosToInsert.push(pending);
                flushedPending.add(pending);
            }
        }
        // ----------------------------
        if (validationErrors.length > 0) {
            throw { validationErrors };
        }

        // --- Fase C: Ejecución de Cambios ---
        if (!isSimulation) { // Only commit changes if not in simulation mode
            for (const ensayo of ensayosToUpdate) {
                await client.query('UPDATE ensayos SET estrato_id = $1, datos_formulario = $2, estado = $3, fecha = CURRENT_DATE, identificador = $4 WHERE id = $5',
                    [ensayo.estrato_id, ensayo.datos_formulario, 'actualizado', ensayo.identificador, ensayo.ensayoId]);
            }

            for (const ensayoData of ensayosToInsert) {
                // 1. Create the base assay using createBaseEnsayo to get the system-generated code
                const { id: newEnsayoId, codigo_ensayo: newCodigoEnsayo } = await createBaseEnsayo({
                    estrato_id: ensayoData.estrato_id,
                    tipo_ensayo_id: ensayoData.tipo_ensayo_id,
                    nombre_ensayo: ensayoData.nombre_ensayo,
                    identificador: ensayoData.identificador,
                    proyecto_id: proyectoId
                }, client); // Pass the existing client

                // 2. Update the datos_formulario for the newly created assay
                await client.query('UPDATE ensayos SET datos_formulario = $1, estado = $2, fecha = CURRENT_DATE WHERE id = $3',
                    [ensayoData.datos_formulario, 'pendiente', newEnsayoId]);
            }
        }

        if (isSimulation) {
            await client.query('ROLLBACK'); // Rollback if it's a simulation
        } else {
            await client.query('COMMIT'); // Commit if it's a real import
        }

        return {
            status: 'ok',
            message: `Importación completada: ${summary.ensayosParaCrear} ensayos creados, ${summary.ensayosParaActualizar} ensayos actualizados.`,
            summary,
            validationErrors: validationErrors.length > 0 ? validationErrors : undefined // Return errors even in simulation
        };

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.validationErrors) {
            throw err;
        }
        console.error('Error en la transacción de importación de ensayos:', err);
        throw new Error('La transacción de importación falló: ' + err.message);
    } finally {
        client.release();
    }
};

const getAllTiposEnsayo = async () => {
    try {
        const query = `
            SELECT id, descripcion, config_key 
            FROM tipo_ensayo 
            ORDER BY descripcion ASC`;
        const result = await db.query(query);
        return result.rows;
    } catch (err) {
        console.error('Error al obtener todos los tipos de ensayo en service:', err);
        throw new Error('Error al obtener todos los tipos de ensayo.');
    }
};

const getAllCanteraEnsayos = async () => {
    try {
        const result = await db.query(`
                    SELECT
                        e.id,
                        e.nombre_ensayo,
                        e.codigo_ensayo,
                        e.fecha,
                        e.resultado,
                        e.estado,
                        e.tipo_ensayo,
                        e.estrato_id,
                        p.id AS proyecto_id,
                        p.nombre_tramo AS proyecto_nombre,
                        can.id AS cantera_id,
                        can.nombre AS cantera_nombre,
                        can.codigo AS cantera_codigo,
                        est.id AS estrato_perfil_id,
                        est.descripcion AS estrato_descripcion,
                        te.id AS tipo_ensayo_id,
                        te.descripcion AS tipo_ensayo_descripcion,
                        te.config_key,
                        est.orden AS estrato_orden
                    FROM ensayos e
                    LEFT JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
                    LEFT JOIN estratos est ON e.estrato_id = est.id
                    LEFT JOIN canteras can ON est.parent_type = 'cantera' AND est.parent_id = can.id
                    LEFT JOIN proyectos p ON can.id_proyecto = p.id
                    WHERE est.parent_type = 'cantera'
                    ORDER BY te.descripcion, e.fecha DESC
                `);

        return result.rows;
    } catch (err) {
        console.error('Error al obtener todos los ensayos de canteras en service:', err);
        throw new Error('Error al obtener todos los ensayos de canteras.');
    }
};

module.exports = {
    getEnsayoDetailsById,
    createBaseEnsayo,
    deleteEnsayo,
    exportEnsayosToExcelByTramo,
    importarEnsayos,
    getAllTiposEnsayo,
    createOrUpdateFullAssay,
    updateBaseEnsayo,
    getEnsayosByTramoId,
    getEnsayosByEstratoId,
    bulkDeleteEnsayos,
    exportEnsayosToExcelByTipo,
    getFormularioConfig,
    getTipoEnsayos,
    getAllCanteraEnsayos,
    getEnsayos
};