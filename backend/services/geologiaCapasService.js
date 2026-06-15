const db = require('../conexion');
const { uploadFileToNAS } = require('./nasStorageService');
const fsp = require('fs').promises;
const fs = require('fs');

class GeologiaCapasError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'GeologiaCapasError';
        this.statusCode = statusCode;
    }
}

const deleteGeologiaCapaFiles = async (capaId) => {
    const client = await db.connect();
    try {
        const query = 'SELECT file_url FROM geologia_capas WHERE id = $1';
        const result = await client.query(query, [capaId]);
        if (result.rows.length > 0) {
            const fileUrl = result.rows[0].file_url;
            await deleteFileFromNAS(fileUrl);
            await client.query('DELETE FROM geologia_capas WHERE id = $1', [capaId]);
        }
    } catch (err) {
        console.error('Error al eliminar archivos de geología:', err);
        throw new GeologiaCapasError('Error al eliminar la capa de geología.', 500);
    } finally {
        client.release();
    }
};

const uploadGeologiaCapa = async (file, proyectoId, tabName, userId) => {
    if (!file) throw new GeologiaCapasError('No se proporcionó ningún archivo para subir.', 400);
    if (!proyectoId) throw new GeologiaCapasError('ID de proyecto es requerido.', 400);
    if (!tabName) throw new GeologiaCapasError('Nombre de pestaña (tabName) es requerido.', 400);

    // Intenta obtener el token específico, o un fallback, si no, usa uno de prueba (placeholder según usuariO)
    let blobToken = process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA ||
        process.env.BLOB_READ_WRITE_TOKEN_SUELOS ||
        process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
        console.warn("ADVERTENCIA: No se encontró Vercel Blob Token en .env. Se usará un token dummy o la operación podría fallar en Vercel real si no hay token por defecto de entorno.");
        // Placeholder as requested by user. Wait, put() requires a token if it's not implicit. 
        // We'll pass the token only if it exists so node doesn't crash here.
    }

    const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
    const filename = `${Date.now()}_${cleanFilename}`;
    const targetFolder = `geologia/${proyectoId}/${tabName}`;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        let fileBuffer;
        if (file.buffer) {
            fileBuffer = file.buffer;
        } else if (file.path) {
            fileBuffer = await fsp.readFile(file.path);
        } else {
            throw new GeologiaCapasError('El archivo no tiene contenido válido.', 400);
        }

        // Sube al NAS
        const publicUrl = await uploadFileToNAS(fileBuffer, targetFolder, filename);

        // Inserta o actualiza en la base de datos (UPSERT)
        const query = `
            INSERT INTO geologia_capas (proyecto_id, tab_name, file_url, file_name)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (proyecto_id, tab_name) 
            DO UPDATE SET 
                file_url = EXCLUDED.file_url,
                file_name = EXCLUDED.file_name,
                uploaded_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await client.query(query, [proyectoId, tabName, publicUrl, file.originalname]);

        await client.query('COMMIT');
        return result.rows[0];

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al subir capa de geología:', err);
        throw new GeologiaCapasError('Error al subir la capa: ' + err.message, 500);
    } finally {
        // Limpiamos el temporal si existe
        client.release();
        if (file && file.path && fs.existsSync(file.path)) {
            try { await fsp.unlink(file.path); } catch (e) { }
        }
    }
};

const getGeologiaCapa = async (proyectoId, tabName) => {
    try {
        const query = `
            SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at
            FROM geologia_capas
            WHERE proyecto_id = $1 AND tab_name = $2;
        `;
        const result = await db.query(query, [proyectoId, tabName]);
        return result.rows[0] || null;
    } catch (err) {
        console.error('Error al obtener capa de geología:', err);
        throw new GeologiaCapasError('Error al obtener la capa de geología.', 500);
    }
};

module.exports = {
    uploadGeologiaCapa,
    getGeologiaCapa
};
