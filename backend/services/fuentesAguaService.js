// backend/services/fuentesAguaService.js
const db = require('../conexion');
const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { uploadFileToNAS, deleteFileFromNAS } = require('./blobStorageService');
const suelosNlpService = require('./suelosNlpService');

// --- Funciones de Fuentes de Agua ---

const createFuenteAgua = async (fuenteData, userId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            nombre, descripcion, estado,
            coordenada_este, coordenada_norte,
            id_progresiva_referencia, desplazamiento_km, lado,
            kml_id, latitud, longitud, tramo_id, id_proyecto, propietario
        } = fuenteData;

        if (!tramo_id) {
            throw new Error('El campo tramo_id es obligatorio para crear una fuente de agua.');
        }
        if (!id_proyecto) {
            throw new Error('El campo id_proyecto es obligatorio para crear una fuente de agua.');
        }

        // Get the next sequential code for the given tramo
        const codeQuery = 'SELECT MAX(CAST(codigo AS INTEGER)) as max_codigo FROM fuentes_agua_suelos WHERE tramo_id = $1';
        const codeResult = await client.query(codeQuery, [tramo_id]);
        const nextCodigo = (codeResult.rows[0].max_codigo || 0) + 1;

        const query = `
            INSERT INTO fuentes_agua_suelos (
                nombre, descripcion, estado,
                coordenada_este, coordenada_norte,
                id_progresiva_referencia, desplazamiento_km, lado,
                kml_id, latitud, longitud,
                tramo_id, codigo, id_proyecto, propietario
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *;
        `;
        const values = [
            nombre, descripcion, estado,
            coordenada_este, coordenada_norte,
            id_progresiva_referencia, desplazamiento_km, lado,
            kml_id, latitud, longitud,
            tramo_id, String(nextCodigo), id_proyecto, propietario
        ];
        const result = await client.query(query, values);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error detallado al crear fuente de agua:', err);
        throw new Error('Error al crear la fuente de agua: ' + err.message);
    } finally {
        client.release();
    }
};

const updateFuenteAgua = async (id, fuenteData) => {
    const {
        nombre, descripcion, estado,
        coordenada_este, coordenada_norte,
        id_progresiva_referencia, desplazamiento_km, lado,
        kml_id, latitud, longitud, tramo_id, id_proyecto, propietario
    } = fuenteData;

    try {
        const query = `
            UPDATE fuentes_agua_suelos SET
                nombre = $1, descripcion = $2, estado = $3,
                coordenada_este = $4, coordenada_norte = $5,
                id_progresiva_referencia = $6, desplazamiento_km = $7, lado = $8,
                kml_id = $9, latitud = $10, longitud = $11, tramo_id = $12, id_proyecto = $13, propietario = $14
            WHERE id = $15
            RETURNING *;
        `;
        const values = [
            nombre, descripcion, estado,
            coordenada_este, coordenada_norte,
            id_progresiva_referencia, desplazamiento_km, lado,
            kml_id, latitud, longitud, tramo_id, id_proyecto, propietario, id
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar fuente de agua:', err);
        throw new Error('Error al actualizar la fuente de agua.');
    }
};

const getFuentesAguaByTramoId = async (tramoId) => {
    if (!tramoId) {
        throw new Error('El ID del tramo es requerido.');
    }
    try {
        // 1. Obtener las fuentes de agua
        const query = `
            SELECT f.*, p_ref.nombre AS progresiva_ref_nombre, p_ref.codigo AS progresiva_ref_codigo
            FROM fuentes_agua_suelos f
            LEFT JOIN progresivas p_ref ON f.id_progresiva_referencia = p_ref.id
            WHERE f.tramo_id = $1
            ORDER BY f.nombre ASC;
        `;
        const result = await db.query(query, [tramoId]);
        const fuentes = result.rows;
        if (fuentes.length === 0) return [];

        const fuentesIds = fuentes.map(f => f.id);

        // 2. Obtener todas las imágenes, muestras (estratos) y ensayos para esas fuentes en paralelo
        const [imagenesResult, estratosResult, ensayosResult] = await Promise.all([
            db.query('SELECT * FROM fuente_agua_imagenes_suelos WHERE fuente_agua_id = ANY($1::int[]) ORDER BY created_at ASC', [fuentesIds]),
            db.query("SELECT id, parent_id AS id_fuente, nombre, descripcion, cota_inicial, cota_final, orden, nlp_color_hex FROM estratos WHERE parent_type = 'fuente_agua' AND parent_id = ANY($1::int[]) ORDER BY parent_id, orden ASC", [fuentesIds]),
            db.query(`
                SELECT 
                    e.id, 
                    e.estrato_id, 
                    e.tipo_ensayo AS tipo_ensayo_id, 
                    te.descripcion AS tipo_ensayo_descripcion, 
                    te.config_key,
                    te.results_config,
                    te.config_tabla,
                    te.config_calculos,
                    te.config_graficos,
                    e.nombre_ensayo, 
                    e.fecha, 
                    e.estado, 
                    e.resultado, 
                    e.datos_formulario,
                    (u.nombre || ' ' || u.ap_paterno || ' ' || u.ap_materno) AS responsable_nombre
                FROM ensayos e
                LEFT JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
                LEFT JOIN usuariost u ON e.responsable_id = u.id
                WHERE e.estrato_id IN (SELECT id FROM estratos WHERE parent_type = 'fuente_agua' AND parent_id = ANY($1::int[]))
                ORDER BY e.estrato_id, e.fecha DESC;
            `, [fuentesIds])
        ]);

        // 3. Mapear resultados para fácil acceso
        const imagenesPorFuente = new Map();
        imagenesResult.rows.forEach(img => {
            if (!imagenesPorFuente.has(img.fuente_agua_id)) imagenesPorFuente.set(img.fuente_agua_id, []);
            imagenesPorFuente.get(img.fuente_agua_id).push(img);
        });

        const ensayosPorEstrato = new Map();
        ensayosResult.rows.forEach(ensayo => {
            if (!ensayosPorEstrato.has(ensayo.estrato_id)) ensayosPorEstrato.set(ensayo.estrato_id, []);
            ensayosPorEstrato.get(ensayo.estrato_id).push(ensayo);
        });

        const estratosPorFuente = new Map();
        estratosResult.rows.forEach(estrato => {
            if (!estratosPorFuente.has(estrato.id_fuente)) estratosPorFuente.set(estrato.id_fuente, []);
            const estratosConEnsayos = {
                ...estrato,
                ensayos: ensayosPorEstrato.get(estrato.id) || []
            };
            estratosPorFuente.get(estrato.id_fuente).push(estratosConEnsayos);
        });

        // 4. Combinar todo
        return fuentes.map(fuente => ({
            ...fuente,
            imagenes: imagenesPorFuente.get(fuente.id) || [],
            estratos_perfil: (estratosPorFuente.get(fuente.id) || []).sort((a, b) => a.orden - b.orden)
        }));

    } catch (err) {
        console.error('Error en getFuentesAguaByTramoId service:', err);
        throw new Error('Error al obtener las fuentes de agua del tramo.');
    }
};

const getFuenteDetailsById = async (fuenteId) => {
    try {
        const query = `
            SELECT f.*, p_ref.nombre AS progresiva_ref_nombre, p_ref.codigo AS progresiva_ref_codigo
            FROM fuentes_agua_suelos f
            LEFT JOIN progresivas p_ref ON f.id_progresiva_referencia = p_ref.id
            WHERE f.id = $1;
        `;
        const res = await db.query(query, [fuenteId]);
        if (res.rows.length === 0) return null;
        
        const fuente = res.rows[0];
        
        const [imagenesRes, estratosRes] = await Promise.all([
            db.query('SELECT * FROM fuente_agua_imagenes_suelos WHERE fuente_agua_id = $1 ORDER BY created_at ASC', [fuenteId]),
            db.query("SELECT id, parent_id AS id_fuente, nombre, descripcion, cota_inicial, cota_final, orden, nlp_color_hex FROM estratos WHERE parent_type = 'fuente_agua' AND parent_id = $1 ORDER BY orden ASC", [fuenteId])
        ]);

        const estratoIds = estratosRes.rows.map(e => e.id);
        let ensayos = [];
        if (estratoIds.length > 0) {
            const ensayosRes = await db.query(`
                SELECT 
                    e.id, 
                    e.estrato_id, 
                    e.tipo_ensayo AS tipo_ensayo_id, 
                    te.descripcion AS tipo_ensayo_descripcion, 
                    te.config_key,
                    e.nombre_ensayo, 
                    e.fecha, 
                    e.estado, 
                    e.resultado, 
                    e.datos_formulario,
                    (u.nombre || ' ' || u.ap_paterno || ' ' || u.ap_materno) AS responsable_nombre
                FROM ensayos e
                LEFT JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
                LEFT JOIN usuariost u ON e.responsable_id = u.id
                WHERE e.estrato_id = ANY($1::int[])
                ORDER BY e.fecha DESC;
            `, [estratoIds]);
            ensayos = ensayosRes.rows;
        }

        const ensayosPorEstrato = new Map();
        ensayos.forEach(ens => {
            if (!ensayosPorEstrato.has(ens.estrato_id)) ensayosPorEstrato.set(ens.estrato_id, []);
            ensayosPorEstrato.get(ens.estrato_id).push(ens);
        });

        const estratos = estratosRes.rows.map(est => ({
            ...est,
            ensayos: ensayosPorEstrato.get(est.id) || []
        }));

        return {
            ...fuente,
            imagenes: imagenesRes.rows,
            estratos_perfil: estratos
        };
    } catch (err) {
        console.error('Error al obtener detalles de fuente de agua:', err);
        throw new Error('Error al obtener detalles de la fuente de agua.');
    }
};

const deleteFuenteAgua = async (id) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener todas las muestras (estratos) de esta fuente
        const estratosResult = await client.query("SELECT id FROM estratos WHERE parent_type = 'fuente_agua' AND parent_id = $1", [id]);
        const estratoIds = estratosResult.rows.map(r => r.id);

        if (estratoIds.length > 0) {
            // 2. Eliminar ensayos asociados a estas muestras
            await client.query('DELETE FROM ensayos WHERE estrato_id = ANY($1::int[])', [estratoIds]);
            // 3. Eliminar muestras de la tabla estratos
            await client.query("DELETE FROM estratos WHERE parent_type = 'fuente_agua' AND parent_id = $1", [id]);
        }

        // 4. Obtener URLs de imágenes para eliminarlas del NAS
        const imagenesRes = await client.query('SELECT imagen_url FROM fuente_agua_imagenes_suelos WHERE fuente_agua_id = $1', [id]);
        const urls = imagenesRes.rows.map(r => r.imagen_url).filter(Boolean);
        for (const url of urls) {
            try {
                await deleteFileFromNAS(url);
            } catch (storageErr) {
                console.warn(`No se pudo eliminar la imagen del NAS: ${url}.`, storageErr.message);
            }
        }

        // 5. Eliminar imágenes de la base de datos
        await client.query('DELETE FROM fuente_agua_imagenes_suelos WHERE fuente_agua_id = $1', [id]);

        // 6. Eliminar la fuente de agua
        const query = 'DELETE FROM fuentes_agua_suelos WHERE id = $1 RETURNING *;';
        const result = await client.query(query, [id]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error al eliminar fuente de agua:', err);
        throw new Error(`Error al eliminar la fuente de agua: ${err.message}`);
    } finally {
        if (client) {
            client.release();
        }
    }
};

// --- Funciones de Imágenes de Fuentes de Agua ---

const uploadImage = async (file, userId) => {
    if (!file) {
        throw new Error('No se proporcionó ningún archivo para subir.');
    }
    if (!userId) {
        throw new Error('ID de usuario es requerido para la subida de imagen.');
    }

    const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
    const finalFilename = `${Date.now()}_${cleanFilename}`;
    const targetFolder = `suelos/fuentes_agua/${userId}`;

    try {
        let fileBuffer;
        if (file.buffer) {
            fileBuffer = file.buffer;
        } else if (file.path) {
            fileBuffer = await fsp.readFile(file.path);
        } else {
            throw new Error('El archivo no tiene contenido válido.');
        }

        return await uploadFileToNAS(fileBuffer, targetFolder, finalFilename);
    } finally {
        if (file && file.path) {
            try {
                if (await fsp.access(file.path).then(() => true).catch(() => false)) {
                    await fsp.unlink(file.path);
                }
            } catch (unlinkErr) {
                console.error(`Error al eliminar el archivo temporal ${file.path}:`, unlinkErr);
            }
        }
    }
};

const addImagenToFuenteAgua = async (fuenteId, imagenUrl, descripcion, nombreArchivo) => {
    try {
        const query = `
            INSERT INTO fuente_agua_imagenes_suelos (fuente_agua_id, imagen_url, descripcion, nombre_archivo)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await db.query(query, [fuenteId, imagenUrl, descripcion, nombreArchivo]);
        return result.rows[0];
    } catch (err) {
        console.error('Error al añadir imagen a la fuente de agua:', err);
        throw new Error('Error al guardar la referencia de la imagen.');
    }
};

const deleteImagen = async (imagenId) => {
    try {
        const res = await db.query('SELECT imagen_url FROM fuente_agua_imagenes_suelos WHERE id = $1', [imagenId]);
        if (res.rows.length > 0) {
            const { imagen_url } = res.rows[0];
            try {
                await deleteFileFromNAS(imagen_url);
            } catch (storageErr) {
                console.warn(`No se pudo eliminar la imagen del NAS: ${imagen_url}.`, storageErr.message);
            }
        }
        await db.query('DELETE FROM fuente_agua_imagenes_suelos WHERE id = $1', [imagenId]);
        return { id: imagenId };
    } catch (err) {
        console.error('Error al eliminar imagen:', err);
        throw new Error('Error al eliminar la imagen.');
    }
};

const deleteBulkImagenes = async (imageIds) => {
    if (!imageIds || imageIds.length === 0) return { deletedCount: 0 };

    try {
        const res = await db.query('SELECT imagen_url FROM fuente_agua_imagenes_suelos WHERE id = ANY($1::int[])', [imageIds]);
        const urls = res.rows.map(r => r.imagen_url).filter(Boolean);

        if (urls.length > 0) {
            for (const imageUrl of urls) {
                try {
                    await deleteFileFromNAS(imageUrl);
                } catch (storageErr) {
                    console.warn(`No se pudo eliminar la imagen del NAS: ${imageUrl}.`, storageErr.message);
                }
            }
        }

        const deleteRes = await db.query('DELETE FROM fuente_agua_imagenes_suelos WHERE id = ANY($1::int[])', [imageIds]);
        return { deletedCount: deleteRes.rowCount };
    } catch (err) {
        console.error('Error al eliminar imágenes masivas:', err);
        throw new Error('Error al eliminar las imágenes.');
    }
};

// --- Funciones de Testigos/Muestras (insertados en la tabla estratos con parent_type = 'fuente_agua') ---

const createFuenteEstrato = async (fuenteId, estratoData) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const { nombre, descripcion, cota_inicial, cota_final } = estratoData;

        // Calculate the next sequential 'orden' for this water source
        const ordenQuery = `
            SELECT MAX(orden) as max_orden
            FROM estratos
            WHERE parent_type = 'fuente_agua' AND parent_id = $1;
        `;
        const ordenResult = await client.query(ordenQuery, [fuenteId]);
        const nextOrden = (ordenResult.rows[0].max_orden || 0) + 1;

        // --- CLASIFICACIÓN NLP Y COLOR ---
        let colorHex = '#cbd5e1';
        let sucs = null;
        let aashto = null;
        const textoAClasificar = nombre || descripcion;
        if (textoAClasificar) {
            try {
                const nlpRes = await suelosNlpService.clasificarSuelo(textoAClasificar);
                if (nlpRes && nlpRes.encontrado) {
                    if (nlpRes.clasificacion_sucs !== "DESCONOCIDO (Requiere Revisión)") {
                        colorHex = nlpRes.color_hex_sugerido || colorHex;
                        sucs = nlpRes.clasificacion_sucs || null;
                        aashto = nlpRes.clasificacion_aashto || null;
                    } else if (nlpRes.color_hex_sugerido) {
                        colorHex = nlpRes.color_hex_sugerido;
                    }
                }
            } catch (nlpErr) {
                console.warn('[NLP Error] No se pudo clasificar el suelo al crear testigo:', nlpErr.message);
            }
        }

        const query = `
            INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden, nlp_clasificacion_sucs, nlp_clasificacion_aashto, nlp_color_hex)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        const values = ['fuente_agua', fuenteId, nombre, descripcion, cota_inicial, cota_final, nextOrden, sucs, aashto, colorHex];
        const result = await client.query(query, values);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear muestra de fuente de agua:', err);
        throw new Error('Error al crear la muestra de la fuente de agua: ' + err.message);
    } finally {
        client.release();
    }
};

const updateFuenteEstrato = async (estratoId, estratoData) => {
    const { nombre, descripcion, cota_inicial, cota_final, orden } = estratoData;

    // --- CLASIFICACIÓN NLP Y COLOR ---
    let colorHex = '#cbd5e1';
    let sucs = null;
    let aashto = null;
    const textoAClasificar = nombre || descripcion;
    if (textoAClasificar) {
        try {
            const nlpRes = await suelosNlpService.clasificarSuelo(textoAClasificar);
            if (nlpRes && nlpRes.encontrado) {
                if (nlpRes.clasificacion_sucs !== "DESCONOCIDO (Requiere Revisión)") {
                    colorHex = nlpRes.color_hex_sugerido || colorHex;
                    sucs = nlpRes.clasificacion_sucs || null;
                    aashto = nlpRes.clasificacion_aashto || null;
                } else if (nlpRes.color_hex_sugerido) {
                    colorHex = nlpRes.color_hex_sugerido;
                }
            }
        } catch (nlpErr) {
            console.warn('[NLP Error] No se pudo clasificar el suelo al actualizar testigo:', nlpErr.message);
        }
    }

    try {
        const query = `
            UPDATE estratos SET
                nombre = $1, descripcion = $2, cota_inicial = $3, cota_final = $4, orden = $5,
                nlp_clasificacion_sucs = $6, nlp_clasificacion_aashto = $7, nlp_color_hex = $8
            WHERE id = $9
            RETURNING *;
        `;
        const values = [nombre, descripcion, cota_inicial, cota_final, orden, sucs, aashto, colorHex, estratoId];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar muestra de fuente de agua:', err);
        throw new Error('Error al actualizar la muestra de la fuente de agua.');
    }
};

const deleteFuenteEstrato = async (estratoId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Delete assays first
        await client.query('DELETE FROM ensayos WHERE estrato_id = $1', [estratoId]);

        const query = 'DELETE FROM estratos WHERE id = $1 RETURNING *;';
        const result = await client.query(query, [estratoId]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error al eliminar muestra de fuente de agua:', err);
        throw new Error(`Error al eliminar la muestra de la fuente de agua: ${err.message}`);
    } finally {
        if (client) {
            client.release();
        }
    }
};

const uploadBulkImages = async (files, fuenteId, userId) => {
    if (!files || files.length === 0) {
        throw new Error('No se subieron archivos.');
    }

    const uploadedImages = [];
    const tempDirs = [];
    const targetFolder = `suelos/fuentes_agua/${userId}/${fuenteId}`;

    try {
        for (const file of files) {
            const ext = path.extname(file.originalname).toLowerCase();
            const isArchive = ext === '.zip' || ext === '.rar';
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);

            if (isArchive) {
                console.log(`Procesando archivo comprimido: ${file.originalname}`);
                const extractionDir = path.join('/tmp', `bulk_fuente_${uuidv4()}`);
                await fsp.mkdir(extractionDir, { recursive: true });
                tempDirs.push(extractionDir);

                try {
                    if (ext === '.zip') {
                        const zip = new AdmZip(file.path);
                        zip.extractAllTo(extractionDir, true);
                    } else if (ext === '.rar') {
                        await new Promise((resolve, reject) => {
                            exec(`unrar e -o+ "${file.path}" "${extractionDir}"`, (err) => err ? reject(err) : resolve());
                        });
                    }

                    const getAllFiles = async (dir) => {
                        const dirents = await fsp.readdir(dir, { withFileTypes: true });
                        const res = await Promise.all(dirents.map(d => {
                            const resPath = path.join(dir, d.name);
                            return d.isDirectory() ? getAllFiles(resPath) : resPath;
                        }));
                        return res.flat();
                    };

                    const allExtracted = await getAllFiles(extractionDir);
                    const imageFiles = allExtracted.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

                    imageFiles.sort((a, b) => {
                        return path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true, sensitivity: 'base' });
                    });

                    for (const imgPath of imageFiles) {
                        try {
                            const imgBuffer = await fsp.readFile(imgPath);
                            const originalName = path.basename(imgPath);
                            const cleanName = originalName.replace(/[^a-zA-Z0-9-._]/g, '_');
                            const finalFilename = `${Date.now()}_${cleanName}`;
                            const imageUrl = await uploadFileToNAS(imgBuffer, targetFolder, finalFilename);

                            const savedImg = await addImagenToFuenteAgua(fuenteId, imageUrl, 'Importación Masiva (ZIP)', originalName);
                            uploadedImages.push(savedImg);
                        } catch (imgErr) {
                            console.error(`Error subiendo imagen individual del ZIP ${imgPath}:`, imgErr);
                        }
                    }
                } catch (archiveErr) {
                    console.error('Error al procesar archivo comprimido:', archiveErr);
                }
            } else if (isImage) {
                console.log(`Procesando imagen suelta: ${file.originalname}`);
                try {
                    let fileBuffer;
                    if (file.buffer) fileBuffer = file.buffer;
                    else if (file.path) fileBuffer = await fsp.readFile(file.path);

                    if (fileBuffer) {
                        const cleanName = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
                        const finalFilename = `${Date.now()}_${cleanName}`;
                        const imageUrl = await uploadFileToNAS(fileBuffer, targetFolder, finalFilename);

                        const savedImg = await addImagenToFuenteAgua(fuenteId, imageUrl, 'Importación Masiva (Directa)', file.originalname);
                        uploadedImages.push(savedImg);
                    }
                } catch (imgErr) {
                    console.error(`Error subiendo imagen suelta ${file.originalname}:`, imgErr);
                }
            }
        }
    } finally {
        for (const dir of tempDirs) {
            try { await fsp.rm(dir, { recursive: true, force: true }); } catch (e) { }
        }
        for (const file of files) {
            if (file.path && fs.existsSync(file.path)) {
                try { await fsp.unlink(file.path); } catch (e) { }
            }
        }
    }

    return uploadedImages;
};

module.exports = {
    createFuenteAgua,
    updateFuenteAgua,
    getFuentesAguaByTramoId,
    getFuenteDetailsById,
    deleteFuenteAgua,
    uploadImage,
    uploadBulkImages,
    addImagenToFuenteAgua,
    deleteImagen,
    deleteBulkImagenes,
    createFuenteEstrato,
    updateFuenteEstrato,
    deleteFuenteEstrato
};
