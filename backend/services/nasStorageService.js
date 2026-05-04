const axios = require('axios');
const https = require('https');

const WEBDAV_BASE_URL = (process.env.NAS_WEBDAV_BASE_URL || 'https://webdav.dafe.it.com').replace(/\/+$/, '');
const WEBDAV_USER = process.env.NAS_WEBDAV_USER || process.env.NAS_FTP_USER || 'geoportal';
const WEBDAV_PASS = process.env.NAS_WEBDAV_PASS || process.env.NAS_FTP_PASS || 'admin123';
const WEBDAV_ROOT_PATH = normalizeRemotePath(process.env.NAS_WEBDAV_ROOT_PATH || '/geoportal');
const PUBLIC_BASE_URL = (process.env.NAS_PUBLIC_BASE_URL || 'https://files.dafe.it.com/geoportal').replace(/\/+$/, '');
const ALLOW_INSECURE_TLS = String(process.env.NAS_WEBDAV_ALLOW_INSECURE_TLS || 'false').toLowerCase() === 'true';

const axiosClient = axios.create({
    baseURL: WEBDAV_BASE_URL,
    auth: {
        username: WEBDAV_USER,
        password: WEBDAV_PASS
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: !ALLOW_INSECURE_TLS
    }),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    validateStatus: () => true
});

function normalizeRemotePath(value) {
    const cleaned = String(value || '')
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/')
        .replace(/^\/?/, '/')
        .replace(/\/$/, '');

    return cleaned === '' ? '/' : cleaned;
}

function joinRemotePath(...parts) {
    const cleaned = parts
        .filter(Boolean)
        .map((part) => String(part).replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
        .filter(Boolean);

    return normalizeRemotePath(cleaned.join('/'));
}

async function ensureWebDavDir(remoteDirPath) {
    const normalized = normalizeRemotePath(remoteDirPath);
    const segments = normalized.split('/').filter(Boolean);

    let currentPath = '';
    for (const segment of segments) {
        currentPath = `${currentPath}/${segment}`;
        const response = await axiosClient.request({
            method: 'MKCOL',
            url: currentPath
        });

        if (![201, 301, 405].includes(response.status)) {
            throw new Error(`MKCOL ${currentPath} devolvió ${response.status}`);
        }
    }
}

/**
 * Sube un archivo al NAS vía WebDAV y devuelve la URL pública.
 *
 * @param {Buffer} fileBuffer
 * @param {string} targetFolder - Subcarpeta dentro del geoportal, ej. geologia/24/geodinamica_interna
 * @param {string} fileName
 * @returns {Promise<string>}
 */
async function uploadFileToNAS(fileBuffer, targetFolder, fileName) {
    const normalizedFolder = String(targetFolder || '').replace(/^\/+|\/+$/g, '');
    const remoteDirPath = joinRemotePath(WEBDAV_ROOT_PATH, normalizedFolder);
    const remoteFilePath = joinRemotePath(remoteDirPath, fileName);

    try {
        console.log(`[NAS Storage] Conectando a WebDAV ${WEBDAV_BASE_URL}...`);
        await ensureWebDavDir(remoteDirPath);

        console.log(`[NAS Storage] Subiendo archivo por WebDAV: ${remoteFilePath}...`);
        const uploadResponse = await axiosClient.put(remoteFilePath, fileBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });

        if (![200, 201, 204].includes(uploadResponse.status)) {
            throw new Error(`PUT ${remoteFilePath} devolvió ${uploadResponse.status}`);
        }

        const publicUrl = `${PUBLIC_BASE_URL}/${normalizedFolder}/${fileName}`;
        console.log(`[NAS Storage] Subida exitosa. URL Pública: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        const details = error.response?.status
            ? `HTTP ${error.response.status}`
            : error.message;
        console.error(`[NAS Storage] Error subiendo archivo ${fileName} al NAS por WebDAV:`, details);
        throw error;
    }
}

/**
 * Elimina un archivo del NAS a partir de su URL pública.
 *
 * @param {string} fileUrl
 * @returns {Promise<boolean>} true si se intentó contra el NAS, false si la URL no pertenece al NAS público configurado.
 */
async function deleteFileFromNAS(fileUrl) {
    const normalizedPublicBase = `${PUBLIC_BASE_URL}/`;
    if (!fileUrl || !String(fileUrl).startsWith(normalizedPublicBase)) {
        return false;
    }

    const relativePath = String(fileUrl).slice(normalizedPublicBase.length);
    const remoteFilePath = joinRemotePath(WEBDAV_ROOT_PATH, relativePath);

    try {
        console.log(`[NAS Storage] Eliminando archivo por WebDAV: ${remoteFilePath}...`);
        const deleteResponse = await axiosClient.request({
            method: 'DELETE',
            url: remoteFilePath
        });

        if (![200, 204, 404].includes(deleteResponse.status)) {
            throw new Error(`DELETE ${remoteFilePath} devolvió ${deleteResponse.status}`);
        }

        return true;
    } catch (error) {
        const details = error.response?.status
            ? `HTTP ${error.response.status}`
            : error.message;
        console.error(`[NAS Storage] Error eliminando archivo ${fileUrl} del NAS por WebDAV:`, details);
        throw error;
    }
}

module.exports = {
    uploadFileToNAS,
    deleteFileFromNAS,
    WEBDAV_BASE_URL,
    WEBDAV_ROOT_PATH,
    PUBLIC_BASE_URL
};
