// backend/services/kmlService.js
const db = require('../conexion');
const { DateTime } = require('luxon');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const fsp = require('fs').promises; // Import fs promises

// Custom error class for consistent error handling
class KmlServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'KmlServiceError';
        this.statusCode = statusCode;
        this.isCustomError = true;
    }
}

const createKmlTrazado = async (file, userId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Get the file buffer, whether from memory or disk
        const fileBuffer = file.buffer || await fsp.readFile(file.path);

        let kmlText;
        const originalFilename = file.originalname;

        // 1. Handle KMZ vs KML
        if (originalFilename.toLowerCase().endsWith('.kmz')) {
            try {
                const zip = new AdmZip(fileBuffer);
                const zipEntries = zip.getEntries();
                const kmlEntry = zipEntries.find(entry => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.kml'));

                if (kmlEntry) {
                    kmlText = kmlEntry.getData().toString('utf8');
                } else {
                    // Fallback: If no KML entry is found, assume the KMZ is a misnamed KML file.
                    kmlText = fileBuffer.toString('utf8');
                }
            } catch (zipError) {
                // Fallback: If AdmZip fails to parse, assume it's a misnamed KML file.
                kmlText = fileBuffer.toString('utf8');
            }
        } else if (originalFilename.toLowerCase().endsWith('.kml')) {
            kmlText = fileBuffer.toString('utf8');
        } else {
            throw new KmlServiceError('Formato de archivo no soportado. Solo se permiten KML y KMZ.', 400);
        }

        // 2. Seguridad: Validación y sanitización básica del XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            allowBooleanAttributes: true,
        });
        try {
            parser.parse(kmlText);
        } catch (xmlError) {
            throw new KmlServiceError('El contenido del archivo KML no es un XML válido.', 400);
        }

        // 3. Persistencia en kml_trazados
        const kmlUploadedAt = DateTime.now().toISO();

        const result = await client.query(
            `INSERT INTO kml_trazados (datos_kml, kml_filename, kml_uploaded_at, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING id;`,
            [kmlText, originalFilename, kmlUploadedAt, userId]
        );

        const newKmlTrazadoId = result.rows[0].id;

        await client.query('COMMIT');
        return {
            id: newKmlTrazadoId,
            kml_filename: originalFilename,
            kml_uploaded_at: kmlUploadedAt
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en kmlService.createKmlTrazado:', err.message, err.stack);
        // Re-throw custom errors or wrap generic ones
        if (err instanceof KmlServiceError) {
            throw err;
        }
        throw new KmlServiceError('Error interno al procesar el archivo KML/KMZ.', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
};

const getKmlTrazadoById = async (kmlTrazadoId) => {
    try {
        const result = await db.query(
            `SELECT id, datos_kml, kml_filename, kml_uploaded_at
             FROM kml_trazados
             WHERE id = $1;`,
            [kmlTrazadoId]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error en kmlService.getKmlTrazadoById:', err.message, err.stack);
        throw new KmlServiceError('Error al obtener trazado KML.', 500);
    }
};

const getKmlContentById = async (kmlTrazadoId) => {
    try {
        const kmlTrazado = await getKmlTrazadoById(kmlTrazadoId); // Use the existing function
        if (kmlTrazado && kmlTrazado.datos_kml) {
            return kmlTrazado.datos_kml;
        }
        return null;
    } catch (err) {
        console.error('Error en kmlService.getKmlContentById:', err.message, err.stack);
        throw new KmlServiceError('Error al obtener el contenido KML.', 500);
    }
};

module.exports = {
    createKmlTrazado,
    getKmlTrazadoById,
    getKmlContentById, // NEW: Export the new function
    KmlServiceError // Export custom error for easier handling in controllers
};