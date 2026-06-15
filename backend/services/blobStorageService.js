const { put, del } = require('@vercel/blob');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN_SUELOS;

/**
 * Sube un archivo a Vercel Blob y devuelve la URL pública.
 * Mantiene la misma firma que uploadFileToNAS para compatibilidad.
 *
 * @param {Buffer} fileBuffer
 * @param {string} targetFolder - Subcarpeta, ej. 'suelos/canteras/123'
 * @param {string} fileName
 * @returns {Promise<string>} URL pública del blob
 */
async function uploadFileToNAS(fileBuffer, targetFolder, fileName) {
    if (!BLOB_TOKEN) {
        throw new Error('[BlobStorage] BLOB_READ_WRITE_TOKEN_SUELOS no está configurado en las variables de entorno.');
    }

    const normalizedFolder = String(targetFolder || '').replace(/^\/+|\/+$/g, '');
    const blobPath = normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;

    try {
        console.log(`[BlobStorage] Subiendo archivo a Vercel Blob: ${blobPath}...`);
        const result = await put(blobPath, fileBuffer, {
            access: 'public',
            token: BLOB_TOKEN,
        });

        console.log(`[BlobStorage] Subida exitosa. URL pública: ${result.url}`);
        return result.url;
    } catch (error) {
        console.error(`[BlobStorage] Error subiendo archivo ${fileName} a Vercel Blob:`, error.message);
        throw error;
    }
}

/**
 * Elimina un archivo de Vercel Blob a partir de su URL pública.
 * Mantiene la misma firma que deleteFileFromNAS para compatibilidad.
 *
 * @param {string} fileUrl - URL pública del blob a eliminar
 * @returns {Promise<boolean>} true si se intentó la eliminación, false si la URL no es válida
 */
async function deleteFileFromNAS(fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string') {
        return false;
    }

    // Solo intentar borrar URLs de Vercel Blob (ignorar URLs legacy del NAS)
    const isVercelBlob =
        fileUrl.includes('blob.vercel-storage.com') ||
        fileUrl.includes('public.blob.vercel-storage.com');

    if (!isVercelBlob) {
        console.warn(`[BlobStorage] URL no es de Vercel Blob, se ignora la eliminación: ${fileUrl}`);
        return false;
    }

    if (!BLOB_TOKEN) {
        throw new Error('[BlobStorage] BLOB_READ_WRITE_TOKEN_SUELOS no está configurado en las variables de entorno.');
    }

    try {
        console.log(`[BlobStorage] Eliminando archivo de Vercel Blob: ${fileUrl}...`);
        await del(fileUrl, { token: BLOB_TOKEN });
        console.log(`[BlobStorage] Archivo eliminado correctamente.`);
        return true;
    } catch (error) {
        console.error(`[BlobStorage] Error eliminando archivo ${fileUrl} de Vercel Blob:`, error.message);
        throw error;
    }
}

module.exports = {
    uploadFileToNAS,
    deleteFileFromNAS,
};
