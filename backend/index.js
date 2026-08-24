// index.js
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
    process.exit(1);
});


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fsp = require('fs').promises;
const fs = require('fs');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const { parse } = require('node-html-parser');
const axios = require('axios');
const { put, del } = require('@vercel/blob');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');
const archiver = require('archiver');
const FormData = require('form-data');
const db = require('./conexion');
const distritosService = require('./services/distritosService');
const ensayosService = require('./services/ensayosService');
const kmlService = require('./services/kmlService');
const progresivasService = require('./services/progresivasService');
const proyectosService = require('./services/proyectosService');
const rutaKmlService = require('./services/rutaKmlService');
const estratosService = require('./services/estratosService');
const puntosMapaService = require('./services/puntosMapaService');
const suelosNlpService = require('./services/suelosNlpService');
const alcantarillasGraphicsService = require('./services/alcantarillasGraphicsService');
const alcantarillasE1Service = require('./services/alcantarillasE1Service');
const interferenciasService = require('./services/interferenciasService');
const badenesService = require('./services/badenesService');
const puentesService = require('./services/puentesService');
const murosService = require('./services/murosService');
const senalesPreventivasService = require('./services/senalesPreventivasService');
const canterasFuentesService = require('./services/canterasyfuentesdeaguainvvialService');
const estructurasExistentesService = require('./services/estructurasExistentesService');
const senalesInformativasService = require('./services/senalesInformativasService');
const hitosKilometricosService = require('./services/hitosKilometricosService');
const senalesReguladorasService = require('./services/senalesReguladorasService');
const observacionesService = require('./services/observacionesService');
const amigoSecretoService = require('./services/amigoSecretoService');
const wishlistService = require('./services/wishlistService');
const modelos3DService = require('./services/modelos3DService');
const geologiaCapasService = require('./services/geologiaCapasService');
const { uploadFileToNAS, deleteFileFromNAS } = require('./services/blobStorageService');

console.log('DEBUG: Servidor backend iniciando...');
require('dotenv').config();
const emailService = require('./services/emailService');

// El worker de Python corre en la misma máquina, en el puerto 8000. Mismo nombre
// de variable que usa services/suelosNlpService.js, que ya lo hacía así.
const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://127.0.0.1:8000';

function simplifyObjContent(objContent, maxFaces = 120000) {
    if (!objContent || typeof objContent !== 'string') {
        return '';
    }

    const lines = objContent.split('\n');
    const vertexLines = [];
    const faceLines = [];
    const objectLines = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith('o ')) {
            objectLines.push(line);
        } else if (line.startsWith('v ')) {
            vertexLines.push(line);
        } else if (line.startsWith('f ')) {
            faceLines.push(line);
        }
    }

    if (faceLines.length <= maxFaces) {
        return objContent;
    }

    const step = Math.max(1, Math.ceil(faceLines.length / maxFaces));
    const selectedFaces = [];
    const usedVertexIndices = new Set();

    for (let i = 0; i < faceLines.length; i += step) {
        const faceLine = faceLines[i];
        const parts = faceLine.split(/\s+/).slice(1);
        if (parts.length < 3) continue;

        const indices = parts.slice(0, 3)
            .map((token) => parseInt(String(token).split('/')[0], 10))
            .filter((value) => Number.isInteger(value) && value > 0);

        if (indices.length !== 3) continue;
        indices.forEach((index) => usedVertexIndices.add(index));
        selectedFaces.push(indices);
    }

    const sortedIndices = Array.from(usedVertexIndices).sort((a, b) => a - b);
    const remap = new Map();
    const simplifiedVertices = [];

    sortedIndices.forEach((originalIndex, idx) => {
        const vertexLine = vertexLines[originalIndex - 1];
        if (!vertexLine) return;
        remap.set(originalIndex, idx + 1);
        simplifiedVertices.push(vertexLine);
    });

    const simplifiedFaces = [];
    for (const face of selectedFaces) {
        const mapped = face.map((index) => remap.get(index));
        if (mapped.some((value) => !value)) continue;
        simplifiedFaces.push(`f ${mapped[0]} ${mapped[1]} ${mapped[2]}`);
    }

    return [
        ...objectLines.slice(0, 1),
        ...simplifiedVertices,
        ...simplifiedFaces
    ].join('\n');
}

async function resolveLandXmlObjStorage({
    objContent,
    fileName,
    userId
}) {
    const cleanBaseName = path.basename(fileName, path.extname(fileName))
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '') || 'modelo_landxml';

    if (objContent.length <= 10 * 1024 * 1024) {
        return {
            urlArchivoFinal: 'DB_EMBEDDED_OBJ',
            metadataPatch: {
                obj_content: objContent,
                obj_storage: 'DB',
                obj_resolution: 'FULL'
            }
        };
    }

    const targetFolder = `suelos/landxml/${userId || 'anonimo'}`;
    const finalObjFilename = `${Date.now()}_${cleanBaseName}.obj`;

    try {
        console.log(`[DEBUG 3D] Malla excede 10MB. Subiendo OBJ completo al NAS: ${targetFolder}/${finalObjFilename}`);
        const publicUrl = await uploadFileToNAS(
            Buffer.from(objContent, 'utf-8'),
            targetFolder,
            finalObjFilename
        );

        return {
            urlArchivoFinal: publicUrl,
            metadataPatch: {
                obj_storage: 'NAS',
                obj_filename: finalObjFilename,
                obj_resolution: 'FULL'
            }
        };
    } catch (storageError) {
        const status = storageError.response?.status;
        console.warn(`[DEBUG 3D] Falló upload de OBJ completo al NAS (${status || storageError.message}). Intentando versión reducida...`);

        const simplifiedObjContent = simplifyObjContent(objContent);
        if (!simplifiedObjContent) {
            throw storageError;
        }

        if (simplifiedObjContent.length <= 10 * 1024 * 1024) {
            return {
                urlArchivoFinal: 'DB_EMBEDDED_OBJ',
                metadataPatch: {
                    obj_content: simplifiedObjContent,
                    obj_storage: 'DB',
                    obj_resolution: 'REDUCED',
                    obj_original_storage_error: status || storageError.message
                }
            };
        }

        const reducedFilename = `${Date.now()}_${cleanBaseName}_reduced.obj`;
        const reducedUrl = await uploadFileToNAS(
            Buffer.from(simplifiedObjContent, 'utf-8'),
            targetFolder,
            reducedFilename
        );

        return {
            urlArchivoFinal: reducedUrl,
            metadataPatch: {
                obj_storage: 'NAS',
                obj_filename: reducedFilename,
                obj_resolution: 'REDUCED',
                obj_original_storage_error: status || storageError.message
            }
        };
    }
}

const whitelist = [
    'http://localhost:3000',
    'https://geoportalbetav3.fly.dev',
    'https://geoportal-frontend-1.fly.dev',
    'https://geoportal-frontend-julio.fly.dev'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (whitelist.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        const msg = 'La política de CORS para este sitio no permite el acceso desde el origen especificado.';
        return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
    credentials: true,
};

const app = express();
const server = http.createServer(app);

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const { upload, uploadDisk } = require('./config/multer');

app.use('/', express.static(path.join(__dirname, '..', 'frontend', 'build')));
app.use('/formats', express.static(path.join(__dirname, '..', 'frontend', 'build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middlewares de auth y autorización: ./middleware/auth.js
const { authenticateToken, authorizeGeologyManage, authorizeDisenoGeometricoManage, authorizeAdminOrCoordinator, authorizePermission } = require('./middleware/auth');

app.get('/', (req, res) => {
    res.send('🚀 Backend del Geoportal en funcionamiento');
});

// Ruta de Health Check para Fly.io
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// --------------------- UTILIDADES ---------------------
app.post('/api/utils/test-ocr', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ninguna imagen.' });
    }
    try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, req.file.originalname);

        console.log('Enviando imagen a Python OCR Service...');
        const pythonResponse = await axios.post(`${PYTHON_WORKER_URL}/process-image`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            responseType: 'arraybuffer'
        });

        const detectedIndex = pythonResponse.headers['x-detected-index'];
        const ocrText = pythonResponse.headers['x-ocr-text'];

        res.json({
            status: 'ok',
            detectedIndex: detectedIndex !== 'null' ? detectedIndex : null,
            ocrText: ocrText || 'Texto no legible'
        });

    } catch (err) {
        console.error('Error en prueba de OCR:', err.message);
        res.status(500).json({ error: 'Error al procesar OCR', details: err.message });
    }
});

// Bulk OCR Extraction Route
app.post('/api/utils/bulk-ocr', authenticateToken, uploadDisk.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Se requieren archivos de imagen (.jpg, .png) o comprimidos (.zip, .rar).' });
    }

    const { projectId } = req.body;
    if (!projectId) {
        return res.status(400).json({ error: 'Se requiere projectId.' });
    }

    try {
        const batchDir = path.join('/tmp', `bulk_batch_${Date.now()}_${require('uuid').v4()}`);
        await fsp.mkdir(batchDir, { recursive: true });

        for (const file of req.files) {
            const destPath = path.join(batchDir, file.originalname);
            await fsp.rename(file.path, destPath);
        }

        const jobPayload = {
            sourceDir: batchDir,
            isBatch: true,
            userId: req.user.id
        };

        const newJob = await db.query(
            `INSERT INTO processing_jobs (job_type, project_id, status, payload) VALUES ($1, $2, $3, $4) RETURNING id`,
            ['bulk_ocr', projectId, 'pending', jobPayload]
        );
        const jobId = newJob.rows[0].id;

        alcantarillasGraphicsService.processBulkOcrJob(jobId).catch(err => console.error('Error en proceso background bulk ocr:', err));

        res.status(202).json({
            status: 'processing',
            message: 'Procesamiento masivo iniciado.',
            jobId: jobId
        });

    } catch (err) {
        console.error('Error iniciando carga masiva:', err);
        if (req.files) {
            for (const file of req.files) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            }
        }
        res.status(500).json({ error: err.message });
    }
});

// --------------------- URL PREVIEWER ---------------------
app.get('/api/url-preview', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL no proporcionada.' });
    }

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
            }
        });

        const root = parse(data);

        let imageUrl = null;
        const selectors = [
            'meta[property="og:image"]',
            'meta[property="twitter:image"]',
            'meta[name="twitter:image"]',
            'link[rel="image_src"]'
        ];

        for (const selector of selectors) {
            const element = root.querySelector(selector);
            if (element) {
                imageUrl = element.getAttribute('content') || element.getAttribute('href');
                if (imageUrl) break;
            }
        }

        // Fallback 1: JSON-LD
        if (!imageUrl) {
            const jsonLdElement = root.querySelector('script[type="application/ld+json"]');
            if (jsonLdElement) {
                try {
                    const jsonData = JSON.parse(jsonLdElement.textContent);
                    const imageSources = Array.isArray(jsonData.image) ? jsonData.image : [jsonData.image];
                    const firstImage = imageSources.find(img => typeof img === 'string' || (typeof img === 'object' && img.url));
                    if (firstImage) {
                        imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;
                    }
                } catch (e) {
                    console.error('Error parsing JSON-LD for URL preview:', e.message);
                }
            }
        }

        // Fallback 2: si no hay og:image, buscar la primera imagen grande
        if (!imageUrl) {
            const images = root.querySelectorAll('img');
            for (const img of images) {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('data:') && !src.toLowerCase().includes('logo')) {
                    const width = parseInt(img.getAttribute('width') || '0', 10);
                    const height = parseInt(img.getAttribute('height') || '0', 10);
                    if (width > 100 && height > 100) {
                        imageUrl = src;
                        break;
                    }
                }
            }
            if (!imageUrl && images.length > 0) {
                const firstImgSrc = images.find(img => img.getAttribute('src') && !img.getAttribute('src').startsWith('data:'))?.getAttribute('src');
                if (firstImgSrc) {
                    imageUrl = firstImgSrc;
                }
            }
        }

        // Si la URL es relativa, completarla con el dominio de origen
        if (imageUrl && !imageUrl.startsWith('http')) {
            const origin = new URL(url).origin;
            imageUrl = new URL(imageUrl, origin).href;
        }

        if (imageUrl) {
            res.json({ imageUrl });
        } else {
            res.status(404).json({ error: 'No se pudo encontrar una imagen de previsualización.' });
        }

    } catch (error) {
        console.error(`Error al obtener la previsualización de ${url}:`, error.message);
        res.status(500).json({ error: 'Error al procesar la URL.' });
    }
});

// --------------------- GENERIC PROXY ---------------------
app.get('/api/proxy', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL no proporcionada.' });
    }

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer', // Handle binary files correctly if needed, or text
            headers: {
                'User-Agent': 'Mozilla/5.0 (Geoportal Proxy)'
            }
        });

        // Forward content type
        const contentType = response.headers['content-type'];
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        res.send(response.data);

    } catch (error) {
        console.error(`Error en proxy para ${url}:`, error.message);
        if (error.response && error.response.status) {
            res.status(error.response.status).json({ error: 'Error al obtener el recurso remoto del proxy.' });
        } else {
            res.status(500).json({ error: 'Error al obtener el recurso remoto.' });
        }
    }
});


// --------------------- LOGIN ---------------------
// --------------------- CONFIGURACIÓN VISOR 3D ---------------------
app.get('/api/config/cesium', authenticateToken, (req, res) => {
    res.json({
        cesiumToken: process.env.CESIUM_ION_TOKEN || null,
        googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || null
    });
});

// --------------------- AJUSTES GLOBALES ---------------------
app.get('/api/settings/global', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM system_settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    } catch (err) {
        console.error('Error fetching global settings:', err);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

app.post('/api/settings/global', authenticateToken, async (req, res) => {
    // Recomendable verificar que sea admin/sadmin aquí, pero por brevedad lo dejamos abierto a usuarios autenticados o filtrar luego
    const { key, value } = req.body; // value should be string 'true' or 'false'
    try {
        await db.query(`
            INSERT INTO system_settings (setting_key, setting_value)
            VALUES ($1, $2)
            ON CONFLICT (setting_key)
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        `, [key, value]);
        res.json({ status: 'ok', message: 'Configuración actualizada' });
    } catch (err) {
        console.error('Error updating global settings:', err);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// --------------------- LOGIN ---------------------
app.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const result = await db.query(`
            SELECT u.*, r.nombre AS rol_nombre
            FROM usuariost u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.usuario = $1
        `, [usuario]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Aquí deberías validar la contraseña (hash)
            if (password === user.password) { // Simplificado

                // Verificar persistencia de 2FA (30 minutos)
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                if (user.last_2fa_verification && new Date(user.last_2fa_verification) > thirtyMinutesAgo) {
                    const accessToken = jwt.sign({ id: user.id, rol_nombre: user.rol_nombre }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
                    return res.json({ status: 'ok', mensaje: 'login exitoso (2FA persistido)', usuario: { ...user, role: user.rol_nombre, token: accessToken } });
                }

                // Verificar configuración global de 2FA
                const settingsRes = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'require_2fa_global'");
                const global2FA = settingsRes.rows.length > 0 ? settingsRes.rows[0].setting_value === 'true' : true; // Default ON

                if (!global2FA) {
                    // Si 2FA está desactivado globalmente, login directo
                    const accessToken = jwt.sign({ id: user.id, rol_nombre: user.rol_nombre }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
                    return res.json({ status: 'ok', mensaje: 'login exitoso (2FA desactivado globalmente)', usuario: { ...user, role: user.rol_nombre, token: accessToken } });
                }

                // Generar código de verificación
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                const expiry = new Date(Date.now() + 5 * 60000); // 5 minutos

                // Guardar código en la BD
                await db.query(`
                    UPDATE usuariost 
                    SET verification_code = $1, verification_expiry = $2 
                    WHERE id = $3
                `, [verificationCode, expiry, user.id]);

                // Enviar correo (Prioridad: mail_cu_104, luego correo personal)
                const userEmail = user.mail_cu_104 || user.correo;
                if (userEmail) {
                    const emailSent = await emailService.sendVerificationEmail(userEmail, verificationCode);
                    if (emailSent) {
                        res.json({
                            status: 'require_2fa',
                            mensaje: 'Código de verificación enviado',
                            userId: user.id,
                            emailMasked: userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
                        });
                    } else {
                        // Fallback si falla el correo? Or permitir entrar? Por seguridad mejor fallar.
                        res.status(500).json({ status: 'error', mensaje: 'Error al enviar código de verificación.' });
                    }
                } else {
                    // Si no tiene correo, ¿permitir login directo o bloquear?
                    // Asumiremos permitir directo por ahora para compatibilidad, O exigir correo.
                    // Si el requerimiento es 2FA, debería exigir correo.
                    // Pero para evitar bloqueo total si faltan datos:
                    const accessToken = jwt.sign({ id: user.id, rol_nombre: user.rol_nombre }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
                    res.json({ status: 'ok', mensaje: 'login exitoso (sin 2FA - falta correo)', usuario: { ...user, role: user.rol_nombre, token: accessToken } });
                }

            } else {
                res.status(401).json({ status: 'error', mensaje: 'credenciales incorrectas' });
            }
        } else {
            res.status(401).json({ status: 'error', mensaje: 'credenciales incorrectas' });
        }
    } catch (err) {
        console.error("Error en login:", err);
        res.status(500).json({ status: 'error', mensaje: 'error del servidor' });
    }
});

app.post('/verify-2fa', async (req, res) => {
    const { userId, code } = req.body;
    try {
        const result = await db.query(`
            SELECT u.*, r.nombre AS rol_nombre
            FROM usuariost u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }

        const user = result.rows[0];

        // Verificar código y expiración
        if (user.verification_code === code) {
            const now = new Date();
            const expiry = new Date(user.verification_expiry);

            if (now < expiry) {
                // Código válido y no expirado
                // Limpiar código y actualizar fecha de última verificación
                await db.query(`
                    UPDATE usuariost 
                    SET verification_code = NULL, verification_expiry = NULL, last_2fa_verification = NOW() 
                    WHERE id = $1
                `, [userId]);

                const accessToken = jwt.sign({ id: user.id, rol_nombre: user.rol_nombre }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
                res.json({ status: 'ok', mensaje: 'verificación exitosa', usuario: { ...user, role: user.rol_nombre, token: accessToken } });
            } else {
                res.status(400).json({ status: 'error', mensaje: 'El código ha expirado' });
            }
        } else {
            res.status(400).json({ status: 'error', mensaje: 'Código incorrecto' });
        }

    } catch (err) {
        console.error("Error en verify-2fa:", err);
        res.status(500).json({ status: 'error', mensaje: 'Error del servidor' });
    }
});

// --------------------- SEÑALES PREVENTIVAS ---------------------
app.post('/api/senales-preventivas/upload-excel', authenticateToken, upload.single('excelFile'), senalesPreventivasService.uploadExcel);

app.get('/api/senales-preventivas/:projectId', authenticateToken, senalesPreventivasService.getAllSenales);

app.post('/api/senales-preventivas', authenticateToken, senalesPreventivasService.createSenal);

app.put('/api/senales-preventivas/:id', authenticateToken, senalesPreventivasService.updateSenal);

app.delete('/api/senales-preventivas/project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        await senalesPreventivasService.deleteSenal(req, res);
        const pool = require('./conexion');
        await pool.query('DELETE FROM senales_preventivas WHERE id_proyecto = $1', [projectId]);
        res.json({ message: 'Señales preventivas deleted successfully' });
    } catch (err) {
        console.error('Error deleting senales preventivas:', err);
        res.status(500).json({ error: err.message });
    }
});

// --------------------- SEÑALES REGULADORAS ---------------------
app.post('/api/senales-reguladoras/upload-excel', authenticateToken, upload.single('excelFile'), senalesReguladorasService.uploadExcel);

app.get('/api/senales-reguladoras/:projectId', authenticateToken, senalesReguladorasService.getAllSenales);

app.post('/api/senales-reguladoras', authenticateToken, senalesReguladorasService.createSenal);

app.put('/api/senales-reguladoras/:id', authenticateToken, senalesReguladorasService.updateSenal);

app.delete('/api/senales-reguladoras/:id', authenticateToken, senalesReguladorasService.deleteSenal);

// --------------------- OBSERVACIONES (EVALUADOR) ---------------------
app.get('/api/observaciones/:projectId/:tipo/:elementoId', authenticateToken, async (req, res) => {
    try {
        const { projectId, tipo, elementoId } = req.params;
        const result = await observacionesService.getObservaciones(projectId, tipo, elementoId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/observaciones', authenticateToken, async (req, res) => {
    try {
        const result = await observacionesService.createObservacion(req.body, req.user.id);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --------------------- MODELOS 3D ---------------------
app.get('/api/modelos-3d', authenticateToken, async (req, res) => {
    try {
        const { proyecto_id, tramo_id } = req.query;
        const result = await modelos3DService.getModelos3D(proyecto_id, tramo_id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/modelos-3d/:id/obj', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const modelo = await modelos3DService.getModelo3DById(id);

        if (!modelo) {
            return res.status(404).json({ error: 'Modelo 3D no encontrado.' });
        }

        if (modelo.url_archivo === 'DB_EMBEDDED_OBJ') {
            const objContent = modelo.metadata?.obj_content;
            if (!objContent) {
                return res.status(404).json({ error: 'La malla OBJ no existe en los metadatos del modelo.' });
            }

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(objContent);
        }

        if (!modelo.url_archivo || ['PENDIENTE', 'STREAMING_LOCAL_SIN_MALLA'].includes(modelo.url_archivo)) {
            return res.status(400).json({ error: 'Este modelo no tiene una malla OBJ descargable.' });
        }

        const remoteResponse = await axios.get(modelo.url_archivo, {
            responseType: 'text',
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(remoteResponse.data);
    } catch (err) {
        console.error('[DEBUG 3D] Error sirviendo malla OBJ:', err.message);
        return res.status(err.response?.status || 500).json({
            error: 'No se pudo obtener la malla OBJ del modelo.',
            detalle: err.response?.data || err.message
        });
    }
});

app.post('/api/modelos-3d', authenticateToken, upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }

        let metadataPython = null;
        let estadoCalculo = 'COMPLETADO';
        let urlArchivoFinal = 'PENDIENTE';

        try {
            console.log("Iniciando envío a Python Worker...");
            console.log("Archivo recibido por Multer:", req.file ? req.file.originalname : "Ninguno");

            let fileBuffer = req.file.buffer;
            let fileName = req.file.originalname;
            let ext = fileName.split('.').pop().toUpperCase();

            // Lógica de descompresión ZIP
            if (ext === 'ZIP') {
                console.log("[DEBUG 3D] Detectado archivo comprimido ZIP, intentando extraer...");
                try {
                    const zip = new AdmZip(req.file.buffer);
                    const zipEntries = zip.getEntries();

                    // Buscamos el primer archivo .xml o .ifc dentro del ZIP
                    const targetEntry = zipEntries.find(entry =>
                        !entry.isDirectory && (
                            entry.name.toUpperCase().endsWith('.XML') ||
                            entry.name.toUpperCase().endsWith('.IFC')
                        )
                    );

                    if (!targetEntry) {
                        throw new Error('El archivo ZIP no contiene ningún archivo .xml o .ifc válido.');
                    }

                    console.log(`[DEBUG 3D] Archivo extraído con éxito: ${targetEntry.name} (${targetEntry.header.size} bytes)`);
                    fileBuffer = targetEntry.getData();
                    fileName = targetEntry.name;
                    ext = fileName.split('.').pop().toUpperCase();
                } catch (zipErr) {
                    console.error("Error descomprimiendo ZIP:", zipErr);
                    throw new Error('No se pudo leer el archivo ZIP. Asegúrate de que no esté dañado.');
                }
            }

            const formData = new FormData();
            formData.append('file', fileBuffer, {
                filename: fileName,
                contentType: ext === 'XML' ? 'text/xml' : 'application/octet-stream',
            });

            let pythonResponse;
            console.log("Extensión procesada:", ext);

            if (ext === 'XML') { // LandXML
                console.log(`Enviando a ${PYTHON_WORKER_URL}/3d/analizar-landxml`);
                pythonResponse = await axios.post(`${PYTHON_WORKER_URL}/3d/analizar-landxml`, formData, {
                    headers: { ...formData.getHeaders() },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                });
                console.log("Respuesta Exitosa de Python:", pythonResponse.data.mensaje);
                metadataPython = pythonResponse.data.data_extraida;

                // LOG DE DEPURACIÓN CRÍTICO
                console.log("[DEBUG 3D] Metadatos extraídos por Python:", JSON.stringify({
                    proyecto: metadataPython?.nombre_proyecto,
                    tiene_centro: !!metadataPython?.centro_utm,
                    centro: metadataPython?.centro_utm,
                    superficies: metadataPython?.cantidad_superficies
                }, null, 2));

                // Guardar OBJ en Vercel Blob (SOLO SI NO ES TRAMO MAESTRO)
                const isTramoMaestro = req.body.es_tramo_completo === 'true' || req.body.es_tramo_completo === true;

                if (metadataPython && metadataPython.obj_content) {
                    if (isTramoMaestro) {
                        console.log("[DEBUG 3D] Tramo Maestro: Saltando subida de malla OBJ para ahorrar espacio.");
                        urlArchivoFinal = 'STREAMING_LOCAL_SIN_MALLA';
                        delete metadataPython.obj_content;
                    } else {
                        console.log(`[DEBUG 3D] Malla detectada (${metadataPython.obj_content.length} bytes). Evaluando estrategia de almacenamiento.`);
                        const storageResult = await resolveLandXmlObjStorage({
                            objContent: metadataPython.obj_content,
                            fileName,
                            userId: req.user.id
                        });

                        urlArchivoFinal = storageResult.urlArchivoFinal;
                        metadataPython = {
                            ...metadataPython,
                            ...storageResult.metadataPatch
                        };

                        if (urlArchivoFinal !== 'DB_EMBEDDED_OBJ') {
                            delete metadataPython.obj_content;
                        }
                    }
                }
            } else if (ext === 'IFC') {
                console.log(`Enviando a ${PYTHON_WORKER_URL}/3d/analizar-ifc`);
                pythonResponse = await axios.post(`${PYTHON_WORKER_URL}/3d/analizar-ifc`, formData, {
                    headers: { ...formData.getHeaders() }
                });
                console.log("Respuesta Exitosa de Python:", pythonResponse.data);
                metadataPython = pythonResponse.data.data_extraida;
            } else {
                console.log("Extensión no soportada por el worker de Python.");
                estadoCalculo = 'SIN_PROCESAMIENTO_ESPECIAL';
            }
        } catch (pythonError) {
            console.error("Error contactando al worker de Python:", pythonError.message);
            if (pythonError.response) {
                console.error("Detalle del error desde Python:", pythonError.response.data);
            }
            estadoCalculo = 'ERROR_PROCESAMIENTO';
            metadataPython = {
                error: "Fallo la comunicación con el worker 3D",
                detalle: pythonError.response ? pythonError.response.data : pythonError.message
            };
        }

        const modeloData = {
            proyecto_id: req.body.proyecto_id || null,
            tramo_id: req.body.tramo_id || null,
            nombre_archivo: req.file.originalname,
            tipo: req.file.originalname.split('.').pop().toUpperCase(),
            url_archivo: urlArchivoFinal,
            tamano_bytes: req.file.size,
            subido_por: req.user.id,
            metadata: metadataPython,
            estado: estadoCalculo,
            es_tramo_completo: req.body.es_tramo_completo === 'true' || req.body.es_tramo_completo === true
        };

        const result = await modelos3DService.createModelo3D(modeloData);
        res.status(201).json(result);
    } catch (err) {
        console.error("Error subiendo modelo 3D:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/modelos-3d/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const existingModel = await modelos3DService.getModelo3DById(id);

        if (!existingModel) {
            return res.status(404).json({ status: 'error', error: 'Modelo 3D no encontrado.' });
        }

        const result = await modelos3DService.deleteModelo3D(id);

        if (existingModel.url_archivo && !['DB_EMBEDDED_OBJ', 'STREAMING_LOCAL_SIN_MALLA', 'PENDIENTE'].includes(existingModel.url_archivo)) {
            try {
                await deleteFileFromNAS(existingModel.url_archivo);
            } catch (cleanupError) {
                console.warn('[DEBUG 3D] No se pudo eliminar la malla OBJ del NAS:', cleanupError.message);
            }
        }

        res.json({ message: 'Modelo 3D eliminado exitosamente', data: result });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.get('/api/3d/datos-suelos/:proyectoId', authenticateToken, async (req, res) => {
    try {
        const { proyectoId } = req.params;
        const data = await progresivasService.getDatos3DSuelosByProyecto(proyectoId);
        res.json(data);
    } catch (err) {
        console.error("Error al obtener datos 3D de suelos:", err);
        res.status(500).json({ error: err.message });
    }
});

// --------------------- PANEL FOTOGRÁFICO (GEOLOGÍA) ---------------------

// Dominio de proyectos: ./routes/proyectos.js
app.use('/api/proyectos', require('./routes/proyectos'));


// --------------------- AMIGO SECRETO ---------------------
app.get('/api/amigo-secreto/participantes', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const participantIds = await amigoSecretoService.getParticipantesIds();
        res.json(participantIds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/amigo-secreto/participantes', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { userIds } = req.body;
    try {
        const result = await amigoSecretoService.updateParticipantes(userIds);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/eventos/:eventoId/asignacion', authenticateToken, async (req, res) => {
    try {
        const { eventoId } = req.params;
        const dadorUsuarioId = req.user.id;

        const amigoSecretoNombre = await amigoSecretoService.getMiAmigoSecreto(dadorUsuarioId, eventoId);

        if (amigoSecretoNombre) {
            res.json(amigoSecretoNombre);
        } else {
            res.status(404).json({ error: 'Asignación no encontrada para este usuario y evento.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Wishlist (Lista de Deseos) ---
app.get('/api/amigo-secreto/wishlist', authenticateToken, async (req, res) => {
    try {
        const wishlist = await wishlistService.getWishlistByUserId(req.user.id);
        res.json(wishlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/amigo-secreto/wishlist', authenticateToken, async (req, res) => {
    try {
        const newItem = await wishlistService.addWishlistItem(req.user.id, req.body);
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/amigo-secreto/wishlist/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        const rowCount = await wishlistService.deleteWishlistItem(itemId, req.user.id);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Deseo no encontrado o no tienes permiso para eliminarlo.' });
        }
        res.status(204).send(); // No Content
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/amigo-secreto/wishlist/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const requesterId = req.user.id;

    try {
        // Lógica de autorización: solo puedes ver la lista de la persona que te tocó
        const asignacionResult = await db.query(
            `SELECT 1 FROM amigo_secreto_asignaciones
             WHERE evento_id = 1 AND dador_usuario_id = $1 AND receptor_usuario_id = $2`,
            [requesterId, userId]
        );

        const isAuthorized = asignacionResult.rows.length > 0;

        if (!isAuthorized) {
            // Permitir a los organizadores ver cualquier lista para depuración o gestión
            const userRoleResult = await db.query('SELECT rol_nombre FROM usuariost u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1', [requesterId]);
            const userRole = userRoleResult.rows.length > 0 ? userRoleResult.rows[0].rol_nombre : '';
            if (userRole !== 'ADMIN' && userRole !== 'COORDINADOR PROYECTO') {
                return res.status(403).json({ error: 'No tienes permiso para ver esta lista de deseos.' });
            }
        }

        const wishlist = await wishlistService.getWishlistByUserId(userId);
        res.json(wishlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dominio de tramos: ./routes/tramos.js
app.use('/api/tramos', require('./routes/tramos'));


// Dominio de ensayos: ./routes/ensayos.js
app.use('/api/ensayos', require('./routes/ensayos'));


// Get all assay types for dynamic selection
app.get('/api/tipos-ensayo', authenticateToken, async (req, res) => {
    try {
        const tipos = await ensayosService.getAllTiposEnsayo();
        res.json(tipos);
    } catch (err) {
        console.error('Error al obtener todos los tipos de ensayo:', err);
        res.status(500).json({ error: 'Error al obtener todos los tipos de ensayo', details: err.message });
    }
});

// Obtener todos los tipos de ensayo para la configuración
app.get('/api/config/ensayo-tipos', authenticateToken, async (req, res) => {
    try {
        const tipos = await ensayosService.getTipoEnsayos();
        res.json(tipos);
    } catch (err) {
        console.error('Error al obtener tipos de ensayo:', err);
        res.status(500).json({ error: 'Error al obtener tipos de ensayo', details: err.message });
    }
});

// Obtener la configuración de formulario para un tipo de ensayo específico
app.get('/api/config/ensayo-tipos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const config = await ensayosService.getFormularioConfig(id);
        if (config) {
            res.json(config);
        } else {
            res.status(404).json({ error: 'Configuración de formulario no encontrada para este tipo de ensayo' });
        }
    } catch (err) {
        console.error(`Error al obtener configuración para el tipo de ensayo ${id}:`, err);
        res.status(500).json({ error: 'Error al obtener la configuración del formulario', details: err.message });
    }
});


// Obtener todos los ensayos
const handleGetEnsayos = async (req, res) => {
    try {
        const ensayos = await ensayosService.getEnsayos();
        res.json(ensayos);
    } catch (err) {
        console.error('Error al obtener ensayos:', err);
        res.status(500).json({ error: 'Error al obtener ensayos', details: err.message });
    }
};

app.get('/ensayos', handleGetEnsayos);
app.get('/api/ensayos', authenticateToken, handleGetEnsayos);


// --------------------- CANTERAS Y FUENTES (INVIAL) ---------------------

app.post('/api/canteras-fuentes/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo Excel.' });
        }
        const { projectId, utmZone } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: 'Falta el ID del proyecto.' });
        }

        const result = await canterasFuentesService.parseExcelAndSave(req.file.buffer, projectId, utmZone);
        res.json(result);
    } catch (err) {
        console.error('Error procesando Excel Canteras/Fuentes:', err);
        res.status(500).json({ error: 'Error al procesar el archivo Excel', details: err.message });
    }
});

app.get('/api/canteras-fuentes/canteras/:projectId', authenticateToken, async (req, res) => {
    try {
        const data = await canterasFuentesService.getCanterasByProject(req.params.projectId);
        res.json(data);
    } catch (err) {
        console.error('Error obteniendo canteras:', err);
        res.status(500).json({ error: 'Error al obtener canteras', details: err.message });
    }
});

app.get('/api/canteras-fuentes/fuentes/:projectId', authenticateToken, async (req, res) => {
    try {
        const data = await canterasFuentesService.getFuentesByProject(req.params.projectId);
        res.json(data);
    } catch (err) {
        console.error('Error obteniendo fuentes:', err);
        res.status(500).json({ error: 'Error al obtener fuentes', details: err.message });
    }
});

// --------------------- ZONAS CRITICAS (INVIAL) ---------------------

// Dominio de zonas-criticas: ./routes/zonas-criticas.js
app.use('/api/zonas-criticas', require('./routes/zonas-criticas'));


// --- Señales Informativas Routes ---
app.get('/api/senales-informativas/:projectId', authenticateToken, senalesInformativasService.getAllSenales);
app.post('/api/senales-informativas', authenticateToken, senalesInformativasService.createSenal);
app.post('/api/senales-informativas/upload-excel', authenticateToken, upload.single('excelFile'), senalesInformativasService.uploadExcel);
app.delete('/api/senales-informativas/:id', authenticateToken, senalesInformativasService.deleteSenal);
app.put('/api/senales-informativas/:id', authenticateToken, senalesInformativasService.updateSenal);

// --- Hitos Kilométricos Routes ---
app.get('/api/hitos-kilometricos/:projectId', authenticateToken, hitosKilometricosService.getAllHitos);
app.post('/api/hitos-kilometricos', authenticateToken, hitosKilometricosService.createHito);
app.post('/api/hitos-kilometricos/upload-excel', authenticateToken, upload.single('excelFile'), hitosKilometricosService.uploadExcel);
app.delete('/api/hitos-kilometricos/:id', authenticateToken, hitosKilometricosService.deleteHito);
app.put('/api/hitos-kilometricos/:id', authenticateToken, hitosKilometricosService.updateHito);

// --------------------- ROLES ---------------------
app.get('/api/roles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM roles');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener roles:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener roles' });
    }
});

// --------------------- ESPECIALIDADES ---------------------
app.get('/api/especialidades', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM especialidades');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener especialidades:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener especialidades' });
    }
});

// Dominio de usuarios: ./routes/usuarios.js
app.use('/api/usuarios', require('./routes/usuarios'));


// Obtener lista simplificada de usuarios (id, nombre completo)
app.get('/api/users/simple', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.usuario, CONCAT(u.nombre, ' ', u.ap_paterno, ' ', u.ap_materno) AS nombre, r.nombre AS rol_nombre
            FROM usuariost u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY nombre
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener usuarios simples:', err);
        res.status(500).json({ error: 'Error al obtener usuarios simples' });
    }
});

// Obtener todos los permisos disponibles
app.get('/api/permissions/all', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre FROM permisos ORDER BY nombre');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener todos los permisos:', err);
        res.status(500).json({ error: 'Error al obtener todos los permisos' });
    }
});

// Obtener permisos de un rol específico
app.get('/api/permissions/role/:roleId', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { roleId } = req.params;
    try {
        const result = await db.query(`
            SELECT p.nombre, rp.tipo_acceso
            FROM roles_permisos rp
            JOIN permisos p ON rp.permiso_id = p.id
            WHERE rp.rol_id = $1
        `, [roleId]);

        const formattedPermissions = {};
        result.rows.forEach(row => {
            formattedPermissions[`${row.nombre}_${row.tipo_acceso}`] = true;
        });
        res.json(formattedPermissions);
    } catch (err) {
        console.error('Error al obtener permisos del rol:', err);
        res.status(500).json({ error: 'Error al obtener permisos del rol' });
    }
});

// Actualizar permisos de un rol específico
app.post('/api/permissions/role/:roleId', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { roleId } = req.params;
    const newPermissions = req.body;

    // Restricción para COORDINADOR PROYECTO: no puede modificar sus propios permisos de rol
    if (req.user.rol_nombre === 'COORDINADOR PROYECTO' && req.user.rol_id.toString() === roleId) {
        return res.status(403).json({ error: 'No tienes permiso para modificar los permisos de tu propio rol.' });
    }

    try {
        await db.query('BEGIN');
        await db.query('DELETE FROM roles_permisos WHERE rol_id = $1', [roleId]);

        for (const permKey in newPermissions) {
            if (newPermissions[permKey]) {
                const [permName, tipoAcceso] = permKey.split('_');
                const permResult = await db.query('SELECT id FROM permisos WHERE nombre = $1', [permName]);
                if (permResult.rows.length > 0) {
                    const permisoId = permResult.rows[0].id;
                    await db.query(
                        'INSERT INTO roles_permisos (rol_id, permiso_id, tipo_acceso) VALUES ($1, $2, $3)',
                        [roleId, permisoId, tipoAcceso]
                    );
                }
            }
        }
        await db.query('COMMIT');
        res.json({ status: 'ok', message: 'Permisos del rol actualizados correctamente' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error al actualizar permisos del rol:', err);
        res.status(500).json({ error: 'Error al actualizar permisos del rol' });
    }
});

// Obtener permisos de un usuario específico
app.get('/api/permissions/user/:userId', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(`
            SELECT p.nombre, up.tipo_acceso
            FROM user_permisos up
            JOIN permisos p ON up.permiso_id = p.id
            WHERE up.user_id = $1
        `, [userId]);

        const formattedPermissions = {};
        result.rows.forEach(row => {
            formattedPermissions[`${row.nombre}_${row.tipo_acceso}`] = true;
        });
        res.json(formattedPermissions);
    } catch (err) {
        console.error('Error al obtener permisos del usuario:', err);
        res.status(500).json({ error: 'Error al obtener permisos del usuario' });
    }
});

// Actualizar permisos de un usuario específico
app.post('/api/permissions/user/:userId', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { userId } = req.params;
    const newPermissions = req.body;

    // Restricción para COORDINADOR PROYECTO: no puede modificar sus propios permisos de usuario
    if (req.user.rol_nombre === 'COORDINADOR PROYECTO' && req.user.id.toString() === userId) {
        return res.status(403).json({ error: 'No tienes permiso para modificar tus propios permisos de usuario.' });
    }

    try {
        await db.query('BEGIN');
        await db.query('DELETE FROM user_permisos WHERE user_id = $1', [userId]);

        for (const permKey in newPermissions) {
            if (newPermissions[permKey]) {
                const [permName, tipoAcceso] = permKey.split('_');
                const permResult = await db.query('SELECT id FROM permisos WHERE nombre = $1', [permName]);
                if (permResult.rows.length > 0) {
                    const permisoId = permResult.rows[0].id;
                    await db.query(
                        'INSERT INTO user_permisos (user_id, permiso_id, tipo_acceso) VALUES ($1, $2, $3)',
                        [userId, permisoId, tipoAcceso]
                    );
                }
            }
        }
        await db.query('COMMIT');
        res.json({ status: 'ok', message: 'Permisos del usuario actualizados correctamente' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error al actualizar permisos del usuario:', err);
        res.status(500).json({ error: 'Error al actualizar permisos del usuario' });
    }
});

// --------------------- PERFIL DEL USUARIO ---------------------
app.get('/api/perfil', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    try {
        const { id: userId } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const result = await db.query(`
            SELECT u.id, u.nombre, u.ap_paterno, u.ap_materno, u.correo, r.nombre AS rol_nombre
            FROM usuariost u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.id = $1;
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const { id, nombre, ap_paterno, ap_materno, correo, rol_nombre } = result.rows[0];
        res.json({
            id,
            nombreCompleto: `${nombre} ${ap_paterno} ${ap_materno}`,
            correo,
            rol: rol_nombre
        });
    } catch (err) {
        console.error('Error en /api/perfil:', err);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// Endpoint para obtener la entidad del proyecto predeterminada del usuario
app.get('/api/user/:userId/default-project-entity', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    if (req.user.id.toString() !== userId && req.user.rol_nombre !== 'ADMIN') {
        return res.status(403).json({ error: 'Acceso denegado: No autorizado para ver la información de otro usuario.' });
    }
    try {
        const result = await db.query(`
            SELECT p.nombre_tramo
            FROM proyectos p
            JOIN proyecto_usuarios pu ON p.id = pu.proyecto_id
            WHERE pu.usuario_id = $1
            LIMIT 1;
        `, [userId]);

        if (result.rows.length > 0) {
            res.json({ proyecto_nom: result.rows[0].nombre_tramo });
        } else {
            res.json({ proyecto_nom: 'N/A' });
        }
    } catch (err) {
        console.error('Error al obtener la entidad del proyecto del usuario:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener la entidad del proyecto.' });
    }
});

// --------------------- ANUNCIOS ---------------------
async function uploadFileToVercelBlob(file) {
    try {
        const filename = `trafico/${file.originalname}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo a Vercel Blob:', error);
        throw new Error('Error al subir archivo a Vercel Blob');
    }
}


// Crear un nuevo anuncio con archivo y subirlo
app.post('/anuncios', authenticateToken, upload.single('file'), async (req, res) => {
    const { titulo, contenido, fecha_inicio, fecha_fin, usuario_id } = req.body;
    const creador_id = req.user.id;
    const archivo = req.file;
    try {
        let archivoUrl = null;
        if (archivo) {
            archivoUrl = await uploadFileToVercelBlob(archivo);
        }
        const result = await db.query(`
            INSERT INTO anuncios (titulo, contenido, fecha_inicio, fecha_fin, usuario_id, creador_id, archivo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [titulo, contenido, fecha_inicio, fecha_fin, usuario_id, creador_id, archivoUrl]);
        res.status(201).json({ status: 'ok', mensaje: 'Anuncio creado correctamente', anuncio: result.rows[0] });
    } catch (err) {
        console.error('Error al crear anuncio:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el anuncio en el servidor' });
    }
});

// Dominio de tráfico: ./routes/trafico.js
app.use('/api/trafico', require('./routes/trafico'));


function sanitizeKmlStorageSegment(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_.]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'archivo';
}

async function uploadKmlToNAS(file, projectId = null) {
    try {
        const cleanFilename = sanitizeKmlStorageSegment(file.originalname);
        const finalFilename = `${Date.now()}_${cleanFilename}`;
        const targetFolder = projectId
            ? `proyectos/${projectId}/trazado`
            : 'proyectos/kml_temporal';

        console.log(`[KML NAS] Uploading KML to NAS with filename: ${finalFilename}`);
        return await uploadFileToNAS(file.buffer, targetFolder, finalFilename);
    } catch (error) {
        console.error('Error al subir archivo KML al NAS:', error);
        throw new Error('Error al subir archivo KML al NAS');
    }
}

// Endpoint to upload a KML file
app.post('/api/kml/upload', authenticateToken, authorizePermission('proyectos', 'edicion'), upload.single('kmlFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo KML.' });
        }
        // El buffer del archivo ya está en req.file.buffer gracias a multer.memoryStorage
        const fileForNas = {
            originalname: req.file.originalname,
            buffer: req.file.buffer
        };
        const requestedProjectId = req.body?.projectId || null;

        // Usar NAS como almacenamiento para KML
        const kmlUrl = await uploadKmlToNAS(fileForNas, requestedProjectId);

        // No es necesario limpiar el archivo del disco ya que se usó memoryStorage

        // Responder con la URL pública del archivo subido
        res.status(201).json({ url: kmlUrl });
    } catch (error) {
        console.error('Error en el endpoint /api/kml/upload:', error);
        if (req.file && req.file.path) {
            await fsp.unlink(req.file.path).catch(err => console.error("Error cleaning up temp file on failure:", err));
        }
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo KML.' });
    }
});


// Dominio de alcantarillas: ./routes/alcantarillas.js
app.use('/api/alcantarillas', require('./routes/alcantarillas'));


// NEW: Endpoint to get the status of a background processing job
app.get('/api/jobs/:jobId/status', authenticateToken, async (req, res) => {
    const { jobId } = req.params;
    try {
        const result = await db.query(
            'SELECT status, result, updated_at FROM processing_jobs WHERE id = $1',
            [jobId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job no encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error al obtener el estado del job ${jobId}:`, error);
        res.status(500).json({ status: 'error', message: 'Error al obtener el estado del job.' });
    }
});


// Endpoint para crear un nuevo badén
app.post('/api/badenes', authenticateToken, async (req, res) => {
    try {
        const newBaden = await badenesService.createBaden(req.body);
        res.status(201).json(newBaden);
    } catch (error) {
        console.error('Error al crear badén:', error);
        res.status(500).json({ error: 'Error al crear badén', details: error.message });
    }
});

// Endpoint para actualizar un badén existente
app.put('/api/badenes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedBaden = await badenesService.updateBaden(id, req.body);
        if (updatedBaden) {
            res.json(updatedBaden);
        } else {
            res.status(404).json({ error: 'Badén no encontrado' });
        }
    } catch (error) {
        console.error(`Error al actualizar badén ${id}:`, error);
        res.status(500).json({ error: 'Error al actualizar badén', details: error.message });
    }
});


// ✅ Listar anuncios activos
app.get('/anuncios/activos', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id, a.titulo, a.contenido,
                a.fecha_inicio,
                a.fecha_fin,
                COALESCE(creador.nombre, '') || ' ' || COALESCE(creador.ap_paterno, '') || ' ' || COALESCE(creador.ap_materno, '') as autor,
                COALESCE(asignado.nombre, '') || ' ' || COALESCE(asignado.ap_paterno, '') || ' ' || COALESCE(asignado.ap_materno, '') as asignado_a,
                a.archivo_url,
                a.usuario_id
            FROM anuncios a
            LEFT JOIN usuariost creador ON a.creador_id = creador.id
            LEFT JOIN usuariost asignado ON a.usuario_id = asignado.id
            WHERE CURRENT_DATE BETWEEN a.fecha_inicio::date AND a.fecha_fin::date
            ORDER BY a.fecha_inicio DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener anuncios activos:', err.message, err.stack);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener anuncios activos', details: err.message });
    }
});

app.get('/debug/anuncios', async (req, res) => {
    try {
        const result = await db.query('SELECT 1 FROM anuncios LIMIT 1;');
        res.json({ status: 'ok', message: 'Tabla anuncios accesible', rows: result.rows });
    } catch (err) {
        console.error('Error al acceder a anuncios:', err);
        res.status(500).json({ status: 'error', message: 'Error al acceder a la tabla anuncios', details: err.message, code: err.code });
    }
});

// --- Rutas de Imágenes de Progresivas ---

// Dominio de progresivas: ./routes/progresivas.js
app.use('/api/progresivas', require('./routes/progresivas'));


app.post('/api/progresiva-imagen/upload', authenticateToken, upload.single('imagen'), async (req, res) => {
    try {
        const { progresivaId, descripcion } = req.body;
        if (!req.file || !progresivaId) throw new Error('Faltan datos obligatorios (archivo o ID progresiva).');

        // 1. Upload to Blob
        const imageUrl = await progresivasService.uploadImage(req.file, req.user.id);

        // 2. Save Reference
        const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        const dbRecord = await progresivasService.addImagenToProgresiva(progresivaId, imageUrl, descripcion, cleanName);

        res.status(201).json(dbRecord);
    } catch (err) {
        console.error('Error subiendo imagen progresiva:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/progresiva-imagen/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await progresivasService.deleteImagenProgresiva(id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// NEW: Endpoint para obtener datos de ruta_kml
app.get('/api/ruta-kml', async (req, res) => {
    try {
        const ruta = await rutaKmlService.getRutaKml();
        res.json(ruta);
    } catch (err) {
        console.error('Error al obtener ruta KML:', err);
        res.status(500).json({ error: 'Error al obtener ruta KML', details: err.message });
    }
});

app.get('/anuncios', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, CONCAT(u.nombre, ' ', u.ap_paterno) AS autor
            FROM anuncios a
            LEFT JOIN usuariost u ON a.usuario_id = u.id
            ORDER BY a.fecha_publicacion DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener anuncios:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener anuncios' });
    }
});

app.delete('/anuncios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM anuncios WHERE id = $1', [id]);
        if (result.rowCount > 0) {
            res.json({ status: 'ok', mensaje: 'Anuncio eliminado' });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Anuncio no encontrado' });
        }
    } catch (err) {
        console.error('Error al eliminar anuncio:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al eliminar anuncio' });
    }
});

app.put('/anuncios/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, fecha_inicio, fecha_fin, usuario_id } = req.body;

    try {
        const result = await db.query(`
            UPDATE anuncios SET
                titulo = $1,
                contenido = $2,
                fecha_inicio = $3,
                fecha_fin = $4,
                usuario_id = $5
            WHERE id = $6
            RETURNING *
        `, [titulo, contenido, fecha_inicio, fecha_fin, usuario_id, id]);

        if (result.rowCount > 0) {
            res.json({ status: 'ok', mensaje: 'Anuncio actualizado', anuncio: result.rows[0] });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Anuncio no encontrado' });
        }
    } catch (err) {
        console.error('Error al actualizar anuncio:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar anuncio' });
    }
});

// --------------------- MIDDLEWARE ---------------------
const authorizeAdmin = (req, res, next) => {
    if (!req.user || (req.user.rol_nombre !== 'ADMIN' && req.user.rol_nombre !== 'COORDINADOR PROYECTO')) {
        return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de Administrador o Coordinador de Proyecto.' });
    }
    next();
};

// --------------------- DEBUG ---------------------
app.get('/debug/tables', async (req, res) => {
    try {
        const tables = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        res.json({ tablas: tables.rows });
    } catch (err) {
        console.error('Error al verificar tablas:', err);
        res.status(500).json({ error: 'Error al verificar tablas', details: err.message });
    }
});

app.get('/debug/tipo-ensayo-schema', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'tipo_ensayo'
            ORDER BY ordinal_position;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener esquema de tipo_ensayo:', err);
        res.status(500).json({ error: 'Error al obtener esquema de tipo_ensayo', details: err.message });
    }
});

app.get('/debug/progresivas-schema', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'progresivas'
            ORDER BY ordinal_position;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener esquema de progresivas:', err);
        res.status(500).json({ error: 'Error al obtener esquema de progresivas', details: err.message });
    }
});

app.get('/debug/elementos-trafico-schema', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'elementos_trafico'
            ORDER BY ordinal_position;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener esquema de elementos_trafico:', err);
        res.status(500).json({ error: 'Error al obtener esquema de elementos_trafico', details: err.message });
    }
});

app.get('/debug/usuariost', async (req, res) => {
    try {
        const result = await db.query('SELECT 1 FROM usuariost LIMIT 1;');
        res.json({ status: 'ok', message: 'Tabla usuariost accesible', rows: result.rows });
    } catch (err) {
        console.error('Error al acceder a usuariost:', err);
        res.status(500).json({ status: 'error', message: 'Error al acceder a la tabla usuariost', details: err.message, code: err.code });
    }
});


// NEW: Endpoint to upload KML file for a project


// NEW: Endpoint to get Project Statistics (Ensuring it exists)


// Endpoint para importar proyectos desde Excel (marcador de posición)
app.post('/proyectos/import', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const result = await proyectosService.importProyectos(req.file);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error al importar proyectos:', err);
        res.status(500).json({ error: 'Error al importar proyectos', details: err.message });
    }
});


app.get('/api/user-projects', authenticateToken, async (req, res) => {
    try {
        const { id: userId, rol_nombre: userRole } = req.user; // Get user ID and role from authenticated token
        console.log(`[DEBUG] Fetching projects for userId: ${userId}, role: ${userRole}`);
        let projects;
        if (userRole === 'ADMIN') {
            projects = await proyectosService.getAllProjectsForAdmin();
        } else {
            projects = await proyectosService.getUserAssignedProjects(userId);
        }
        console.log(`[DEBUG] Found ${projects.length} projects for userId: ${userId}`);
        res.json(projects);
    } catch (err) {
        console.error('Error en /api/user-projects:', err);
        res.status(500).json({ error: 'Error al obtener proyectos del usuario', details: err.message });
    }
});

// NEW: Ruta para obtener un proyecto por ID


// Dominio de canteras: ./routes/canteras.js
app.use('/api/canteras', require('./routes/canteras'));


// NEW: CREATE Cantera


// Dominio de fuentes-agua: ./routes/fuentes-agua.js
app.use('/api/fuentes-agua', require('./routes/fuentes-agua'));


// --------------------- KML ---------------------
// Get KML content by its trazado ID
app.get('/api/kml-trazados/:id/content', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const kmlContent = await kmlService.getKmlContentById(id);
        if (kmlContent) {
            res.json({ kmlContent });
        } else {
            res.status(404).json({ error: 'Contenido KML no encontrado' });
        }
    } catch (err) {
        console.error(`Error al obtener contenido KML para el trazado ${id}:`, err);
        const statusCode = err.isCustomError ? err.statusCode : 500;
        res.status(statusCode).json({ error: 'Error al obtener el contenido KML', details: err.message });
    }
});


// NEW: Endpoint to get KML content by kml_trazado_id

// NEW: Endpoint to delete KML from a progresiva

// Obtener progresivas principales


app.get('/api/user/tramos', authenticateToken, async (req, res) => {
    const user = req.user; // Get the full user object
    const { projectId } = req.query; // Get projectId from query string
    if (!projectId) {
        return res.status(400).json({ error: 'El ID del proyecto es requerido.' });
    }
    try {
        const tramos = await progresivasService.getTramosByUserId(user, projectId); // Pass the full user object
        res.json(tramos);
    } catch (err) {
        console.error(`Error al obtener tramos para el usuario ${user.id}:`, err);
        res.status(500).json({ error: 'Error al obtener los tramos del usuario', details: err.message });
    }
});


// Eliminar progresivas en bulk (usando POST para mayor compatibilidad)
app.post('/progresivas/bulk-delete', authenticateToken, async (req, res) => {
    const { ids } = req.body; // Se espera un array de IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs.' });
    }
    try {
        const rowCount = await progresivasService.bulkDeleteProgresivas(ids);
        if (rowCount > 0) {
            res.json({ status: 'ok', mensaje: `${rowCount} progresivas eliminadas correctamente` });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'No se encontraron progresivas para eliminar' });
        }
    } catch (err) {
        console.error('Error en POST /progresivas/bulk-delete:', err.stack); // Log the full stack
        res.status(500).json({ error: 'Error al eliminar progresivas en bulk', details: err.message, stack: err.stack }); // Also send stack in response for debugging
    }
});


// --------------------- CATÁLOGOS ---------------------
// Mock data for catalogs that might be moved to the database later
const entidadesSolicitantes = [
    { id: 'GRTC', nombre: 'GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES' },
];

const otrasEntidades = [
    { id: 'PN', nombre: 'Persona Natural' },
];

// Endpoint for Entidades Solicitantes
app.get('/api/entidades-solicitantes', authenticateToken, (req, res) => {
    res.json(entidadesSolicitantes);
});

// Endpoint for Otras Entidades/Personas
app.get('/api/otras-entidades', authenticateToken, (req, res) => {
    res.json(otrasEntidades);
});

app.get('/codigo_departamentos', authenticateToken, async (req, res) => {
    try {
        const departamentos = await distritosService.getDepartamentos();
        res.json(departamentos);
    } catch (err) {
        console.error('Error al obtener departamentos:', err);
        res.status(500).json({ error: 'Error al obtener departamentos', details: err.message });
    }
});

// Nueva ruta para obtener provincias por departamento
app.get('/provincias/:codigo_departamento', authenticateToken, async (req, res) => {
    const { codigo_departamento } = req.params;
    try {
        const provincias = await distritosService.getProvincias(codigo_departamento);
        res.json(provincias);
    } catch (err) {
        console.error('Error al obtener provincias:', err);
        res.status(500).json({ error: 'Error al obtener provincias', details: err.message });
    }
});

// Nueva ruta para obtener distritos por provincia
app.get('/distritos/:codigo_provincia', authenticateToken, async (req, res) => {
    const { codigo_provincia } = req.params;
    try {
        const distritos = await distritosService.getDistritos(codigo_provincia);
        res.json(distritos);
    } catch (err) {
        console.error('Error al obtener distritos:', err);
        res.status(500).json({ error: 'Error al obtener distritos', details: err.message });
    }
});

app.get('/estratos', authenticateToken, async (req, res) => {
    try {
        const estratos = await estratosService.getEstratos();
        res.json(estratos);
    } catch (err) {
        console.error('Error al obtener estratos:', err);
        res.status(500).json({
            error: 'Error al obtener estratos',
            details: err.message
        });
    }
});

// Nueva ruta para crear un estrato
app.post('/estratos', authenticateToken, async (req, res) => {
    try {
        const nuevoEstrato = await estratosService.createEstrato(req.body);
        res.status(201).json(nuevoEstrato);
    } catch (err) {
        console.error('Error al crear estrato:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el estrato' });
    }
});

// Nueva ruta para actualizar un estrato
app.put('/estratos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const estratoActualizado = await estratosService.updateEstrato(id, req.body);
        if (!estratoActualizado) {
            return res.status(404).json({ mensaje: 'Estrato no encontrado' });
        }
        res.json(estratoActualizado);
    } catch (err) {
        console.error('Error al actualizar estrato:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar el estrato' });
    }
});

// Nueva ruta para eliminar un estrato
app.delete('/estratos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await estratosService.deleteEstrato(id);
        if (rowCount === 0) {
            return res.status(404).json({ mensaje: 'Estrato no encontrado para eliminar' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar estrato:', err);
        res.status(500).json({ status: 'error', mensaje: 'No se pudo eliminar el estrato' });
    }
});

// Nueva ruta para obtener estratos por progresivaId
app.get('/estratos/progresiva/:progresivaId', authenticateToken, async (req, res) => {
    const { progresivaId } = req.params;
    try {
        const estratos = await estratosService.getEstratosByProgresivaId(progresivaId);
        res.json(estratos);
    } catch (err) {
        console.error('Error al obtener estratos por progresivaId:', err);
        res.status(500).json({ error: 'Error al obtener estratos por progresivaId', details: err.message });
    }
});

// Nueva ruta para obtener ensayos por estratoId
app.get('/ensayos/estrato/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        const ensayos = await ensayosService.getEnsayosByEstratoId(estratoId);
        res.json(ensayos);
    } catch (err) {
        console.error('Error al obtener ensayos por estratoId:', err);
        res.status(500).json({ error: 'Error al obtener ensayos por estratoId', details: err.message });
    }
});

// Nueva ruta para crear un ensayo
app.post('/ensayos', authenticateToken, async (req, res) => {
    try {
        const newEnsayo = await ensayosService.createEnsayo(req.body);
        res.status(201).json(newEnsayo);
    } catch (err) {
        console.error('Error al crear ensayo:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el ensayo' });
    }
});


// NEW: Ruta para obtener todos los ensayos de un tramo específico


// NEW: Import assays from Excel
app.post(
    '/api/proyectos/:proyectoId/tramos/:tramoId/ensayos/importar',
    authenticateToken,
    upload.single('file'), // 'file' must match the name attribute in the frontend form
    async (req, res) => {
        const { proyectoId, tramoId } = req.params;
        const { isSimulation } = req.query; // LEER el parámetro
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }

        try {
            const result = await ensayosService.importarEnsayos(
                proyectoId,
                tramoId,
                file.buffer,
                req.user,
                isSimulation === 'true', // PASAR el booleano
                { configKey: req.body?.configKey || null }
            );
            res.status(201).json(result);
        } catch (err) {
            console.error(`Error al importar ensayos para el tramo ${tramoId}:`, err);
            // Check for specific validation errors from the service
            if (err.validationErrors) {
                return res.status(400).json({
                    error: 'Error de validación en el archivo Excel.',
                    details: err.validationErrors
                });
            }
            res.status(500).json({ error: 'Error al importar ensayos desde Excel', details: err.message });
        }
    }
);

// --------------------- NAVBAR VISIBILITY ---------------------
// Get all navbar options
app.get('/api/navbar-options', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre, link, descripcion, icono FROM navbar_options ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener opciones de navbar:', err);
        res.status(500).json({ error: 'Error al obtener opciones de navbar' });
    }
});

// Get navbar visibility for the logged-in user (combines role and specialty visibility)
app.get('/api/navbar-visibility/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    // Ensure the requesting user is the same as the userId in the URL, or is an ADMIN
    if (req.user.id.toString() !== userId && req.user.rol_nombre !== 'ADMIN') {
        return res.status(403).json({ error: 'Acceso denegado: No autorizado para ver la visibilidad de otro usuario.' });
    }

    const userRoleId = req.user.rol_id;
    const userSpecialtyId = req.user.codigo_esp; // Get specialty ID from authenticated user

    try {
        // 1. Get role-based visibility
        const roleVisibilityResult = await db.query(`
            SELECT no.link, COALESCE(rno.visible, TRUE) as is_visible
            FROM navbar_options no
            LEFT JOIN roles_navbar_options rno ON no.id = rno.navbar_option_id AND rno.role_id = $1
        `, [userRoleId]);

        const roleVisibility = {};
        roleVisibilityResult.rows.forEach(row => {
            roleVisibility[row.link] = row.is_visible;
        });

        // 2. Get specialty-based visibility (if user has a specialty)
        let specialtyVisibility = {};
        if (userSpecialtyId) {
            const specialtyVisibilityResult = await db.query(`
                SELECT no.link, COALESCE(eno.visible, TRUE) as is_visible
                FROM navbar_options no
                LEFT JOIN especialidades_navbar_options eno ON no.id = eno.navbar_option_id AND eno.especialidad_id = $1
            `, [userSpecialtyId]);

            specialtyVisibilityResult.rows.forEach(row => {
                specialtyVisibility[row.link] = row.is_visible;
            });
        }

        // 3. Combine visibility (Hierarchical: Role > Specialty)
        // If role says false, it's false. Otherwise, specialty decides.
        const finalVisibility = {};
        const allNavbarOptions = await db.query('SELECT link FROM navbar_options');

        allNavbarOptions.rows.forEach(option => {
            const link = option.link;
            const isVisibleByRole = roleVisibility[link] !== false; // Default to true if not explicitly false
            const isVisibleBySpecialty = specialtyVisibility[link] !== false; // Default to true if not explicitly false

            // Hierarchical logic: If role hides it, it's hidden. Otherwise, specialty decides.
            finalVisibility[link] = isVisibleByRole && isVisibleBySpecialty;
        });

        res.json(finalVisibility);
    } catch (err) {
        console.error('Error al obtener visibilidad de navbar para el usuario:', err);
        res.status(500).json({ error: 'Error al obtener visibilidad de navbar para el usuario' });
    }
});

// Get navbar visibility for a specific role
app.get('/api/navbar-visibility/:roleId', authenticateToken, authorizeAdmin, async (req, res) => {
    const { roleId } = req.params;
    try {
        const result = await db.query(`
            SELECT no.id, no.nombre, no.link, no.descripcion, no.icono, COALESCE(rno.visible, TRUE) as is_visible
            FROM navbar_options no
            LEFT JOIN roles_navbar_options rno ON no.id = rno.navbar_option_id AND rno.role_id = $1
            ORDER BY no.id
        `, [roleId]);

        const visibilityMap = {};
        result.rows.forEach(row => {
            visibilityMap[row.link] = row.is_visible;
        });
        res.json(visibilityMap);
    } catch (err) {
        console.error('Error al obtener visibilidad de navbar para rol:', err);
        res.status(500).json({ error: 'Error al obtener visibilidad de navbar para rol' });
    }
});

// Update navbar visibility for a specific role
app.post('/api/navbar-visibility/:roleId', authenticateToken, authorizeAdmin, async (req, res) => {
    const { roleId } = req.params;
    const visibilitySettings = req.body; // Extraer visibilitySettings del cuerpo de la solicitud

    // Restricción para COORDINADOR PROYECTO: no puede modificar la visibilidad de su propio rol
    if (req.user.rol_nombre === 'COORDINADOR PROYECTO' && req.user.rol_id.toString() === roleId) {
        return res.status(403).json({ error: 'No tienes permiso para modificar la visibilidad de tu propio rol.' });
    }

    try {
        await db.query('BEGIN'); // Iniciar transacción

        // Eliminar permisos existentes para el rol
        await db.query('DELETE FROM roles_navbar_options WHERE role_id = $1', [roleId]);

        // Insertar nuevos permisos
        for (const link in visibilitySettings) {
            const isVisible = visibilitySettings[link];
            // Obtener el navbar_option_id basado en el link
            const navbarOptionResult = await db.query('SELECT id FROM navbar_options WHERE link = $1', [link]);
            if (navbarOptionResult.rows.length > 0) {
                const navbarOptionId = navbarOptionResult.rows[0].id;
                await db.query(
                    'INSERT INTO roles_navbar_options (role_id, navbar_option_id, visible) VALUES ($1, $2, $3)',
                    [roleId, navbarOptionId, isVisible]
                );
            }
        }
        await db.query('COMMIT'); // Confirmar transacción
        res.json({ status: 'ok', message: 'Visibilidad de navbar actualizada correctamente' });
    } catch (err) {
        await db.query('ROLLBACK'); // Revertir transacción en caso de error
        console.error('Error al actualizar visibilidad de navbar:', err);
        res.status(500).json({ error: 'Error al actualizar visibilidad de navbar' });
    }
});

// Get navbar visibility for a specific specialty
app.get('/api/navbar-visibility/specialty/:specialtyId', authenticateToken, authorizeAdmin, async (req, res) => {
    const { specialtyId } = req.params; // <-- Añadido: Extraer specialtyId de req.params
    try {
        const result = await db.query(`
            SELECT no.id, no.nombre, no.link, no.descripcion, no.icono, COALESCE(eno.visible, TRUE) as is_visible
            FROM navbar_options no
            LEFT JOIN especialidades_navbar_options eno ON no.id = eno.navbar_option_id AND eno.especialidad_id = $1
            ORDER BY no.id
        `, [specialtyId]);

        const visibilityMap = {};
        result.rows.forEach(row => {
            visibilityMap[row.link] = row.is_visible;
        });
        res.json(visibilityMap);
    } catch (err) {
        console.error('Error al obtener visibilidad de navbar para especialidad:', err);
        res.status(500).json({ error: 'Error al obtener visibilidad de navbar para especialidad' });
    }
});

// Update navbar visibility for a specific specialty
app.post('/api/navbar-visibility/specialty/:specialtyId', authenticateToken, authorizeAdmin, async (req, res) => {
    const { specialtyId } = req.params;
    const visibilitySettings = req.body; // Extraer visibilitySettings del cuerpo de la solicitud

    try {
        await db.query('BEGIN'); // Start transaction

        // Eliminar configuraciones existentes para la especialidad
        await db.query('DELETE FROM especialidades_navbar_options WHERE especialidad_id = $1', [specialtyId]);

        for (const link in visibilitySettings) {
            const isVisible = visibilitySettings[link];
            const navbarOptionResult = await db.query('SELECT id FROM navbar_options WHERE link = $1', [link]);
            if (navbarOptionResult.rows.length > 0) {
                const navbarOptionId = navbarOptionResult.rows[0].id;
                await db.query(
                    'INSERT INTO especialidades_navbar_options (especialidad_id, navbar_option_id, visible) VALUES ($1, $2, $3)',
                    [specialtyId, navbarOptionId, isVisible]
                );
            }
        }
        await db.query('COMMIT'); // Commit transaction
        res.json({ status: 'ok', message: 'Visibilidad de navbar por especialidad actualizada correctamente' });
    } catch (err) {
        await db.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error al actualizar visibilidad de navbar por especialidad:', err);
        res.status(500).json({ error: 'Error al actualizar visibilidad de navbar por especialidad' });
    }
});

// --------------------- AUDITORIA ---------------------
app.post('/api/audit/log', authenticateToken, async (req, res) => {
    const { accion, detalles } = req.body;
    const usuario_id = req.user.id;

    if (!accion) {
        return res.status(400).json({ error: 'La "accion" es requerida.' });
    }

    try {
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [usuario_id, accion, detalles ? JSON.stringify(detalles) : null]
        );
        res.status(200).json({ status: 'ok', message: 'Evento de auditoría registrado.' });
    } catch (err) {
        console.error('Error al registrar evento de auditoría:', err);
        res.status(500).json({ error: 'Error al registrar evento de auditoría', details: err.message });
    }
});


app.delete('/api/audit/logs', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        await db.query('DELETE FROM auditoria');
        res.status(200).json({ status: 'ok', message: 'Registros de auditoría limpiados correctamente.' });
    } catch (err) {
        console.error('Error al limpiar logs de auditoría:', err);
        res.status(500).json({ error: 'Error al limpiar logs de auditoría', details: err.message });
    }
});
app.get('/api/audit/logs', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id, u.usuario, a.accion, a.detalles, a.creado_en
            FROM auditoria a
            JOIN usuariost u ON a.usuario_id = u.id
            ORDER BY a.creado_en DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener logs de auditoría:', err);
        res.status(500).json({ error: 'Error al obtener logs de auditoría', details: err.message });
    }
});

// --------------------- CHANGELOGS ---------------------
// Obtener la última entrada del changelog
app.get('/api/changelog/latest', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT version, title, content, release_date FROM changelogs ORDER BY release_date DESC LIMIT 1');
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'No changelog entries found' });
        }
    } catch (err) {
        console.error('Error al obtener el último changelog:', err);
        res.status(500).json({ error: 'Error al obtener el último changelog' });
    }
});

// Crear una nueva entrada de changelog (solo para administradores/coordinadores)
app.post('/api/admin/changelog', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { version, title, content } = req.body;
    if (!version || !title || !content) {
        return res.status(400).json({ error: 'Faltan campos requeridos: version, title, content' });
    }

    try {
        const result = await db.query(
            'INSERT INTO changelogs (version, title, content) VALUES ($1, $2, $3) RETURNING *'
            , [version, title, content]
        );
        res.status(201).json({ status: 'ok', message: 'Changelog creado correctamente', changelog: result.rows[0] });
    } catch (err) {
        console.error('Error al crear changelog:', err);
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'La versión del changelog ya existe.' });
        }
        res.status(500).json({ error: 'Error al crear changelog' });
    }
});

// --------------------- ALCANTARILLAS E1 ---------------------

app.post('/api/upload-alcantarillas-e1', authenticateToken, authorizeAdminOrCoordinator, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        const { proyectoId } = req.body; // Obtener proyectoId del cuerpo de la solicitud
        if (!proyectoId) {
            return res.status(400).json({ error: 'El ID del proyecto es requerido.' });
        }

        const userId = req.user.id; // Obtener el ID del usuario autenticado
        const result = await alcantarillasE1Service.uploadAlcantarillasE1Data(req.file.buffer, userId, proyectoId);
        res.status(200).json({ status: 'ok', message: 'Datos de alcantarillas E1 procesados correctamente.', data: result.data });
    } catch (error) {
        console.error('Error en /api/upload-alcantarillas-e1:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al procesar el archivo Excel para Alcantarillas E1.' });
    }
});

app.get('/api/alcantarillas-e1', authenticateToken, async (req, res) => {
    try {
        const { proyectoId } = req.query; // Opcional: filtrar por proyectoId
        const data = await alcantarillasE1Service.getAlcantarillasE1Data(proyectoId);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en /api/alcantarillas-e1:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al obtener datos de Alcantarillas E1.' });
    }
});

// --------------------- ELEMENTOS DE TRÁFICO ---------------------


app.get('/api/elementos-trafico', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const targetProjectId = req.query.proyectoId;

        if (!targetProjectId) {
            return res.status(400).json({ error: 'El ID del proyecto es requerido.' });
        }

        let hasAccess = false;

        if (user.rol_nombre === 'ADMIN') {
            hasAccess = true;
        } else {
            const accessCheck = await db.query(
                'SELECT 1 FROM proyecto_usuarios WHERE usuario_id = $1 AND proyecto_id = $2',
                [user.id, targetProjectId]
            );
            if (accessCheck.rows.length > 0) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return res.json([]);
        }

        const result = await db.query('SELECT * FROM elementos_trafico WHERE proyecto_id = $1 ORDER BY id', [targetProjectId]);
        const elementos = result.rows;

        // Para cada elemento, obtener sus imágenes asociadas
        for (let i = 0; i < elementos.length; i++) {
            const imagenesResult = await db.query(
                'SELECT image_url, description, upload_date, source_type FROM trafico_imagenes WHERE station_id = $1 ORDER BY upload_date DESC, id DESC',
                [elementos[i].id]
            );
            elementos[i].imagenes = imagenesResult.rows;
        }

        res.json(elementos);
    } catch (err) {
        console.error('Error al obtener elementos de tráfico:', err);
        res.status(500).json({ error: 'Error al obtener elementos de tráfico' });
    }
});


// --------------------- BADENES ---------------------

// Helper function for Badenes Excel upload
async function uploadBadenesExcelToVercelBlob(fileBuffer, originalFilename, projectId) {
    try {
        const originalExtension = path.extname(originalFilename);
        const filename = `tramoinv/invexcel/badenes_${projectId}_${Date.now()}${originalExtension}`;
        const blob = await put(filename, fileBuffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo Excel de badenes a Vercel Blob:', error);
        throw new Error('Error al subir archivo Excel de badenes a Vercel Blob');
    }
}


app.post('/api/badenes/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        const { projectId, utmZone, entregableNum } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: 'El ID del proyecto es requerido.' });
        }

        const zone = utmZone || '18L';
        const userId = req.user.id;

        const result = await badenesService.processExcelAndSaveBadenes(req.file.buffer, projectId, zone);

        // Upload to Vercel Blob
        const excelUrl = await uploadBadenesExcelToVercelBlob(req.file.buffer, req.file.originalname, projectId);

        // Save to invvial_excels if entregableNum is provided
        if (entregableNum) {
            await db.query(
                `INSERT INTO invvial_excels (id_proyecto, excel_url, entregable_num, uploaded_by_user_id, original_filename)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id_proyecto, entregable_num)
                 DO UPDATE SET 
                    excel_url = EXCLUDED.excel_url,
                    uploaded_at = NOW(),
                    uploaded_by_user_id = EXCLUDED.uploaded_by_user_id,
                    original_filename = EXCLUDED.original_filename`,
                [projectId, excelUrl, entregableNum, userId, req.file.originalname]
            );
        }

        // Audit Log
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Subida de Archivo Excel de Badenes', `Archivo Excel de Badenes subido para proyecto ${projectId} por usuario ${userId}. URL: ${excelUrl}. ${result.message}`]
        );

        res.status(200).json({
            status: 'ok',
            message: result.message,
            count: result.count,
            fileInfo: {
                excel_url: excelUrl,
                original_filename: req.file.originalname
            }
        });
    } catch (error) {
        console.error('Error en /api/badenes/upload-excel:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al procesar el archivo Excel.' });
    }
});

app.get('/api/badenes/excel-info/:projectId/:entregableNum', authenticateToken, async (req, res) => {
    const { projectId, entregableNum } = req.params;
    try {
        const result = await db.query(
            'SELECT excel_url, original_filename FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2',
            [projectId, entregableNum]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Información del archivo Excel no encontrada.' });
        }
    } catch (error) {
        console.error('Error al obtener información del archivo Excel de badenes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.delete('/api/badenes/delete-excel/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { entregableNum } = req.query;
        const userId = req.user.id;

        // 1. Get Excel URL to delete from Blob
        if (entregableNum) {
            const invvialResult = await db.query(
                `SELECT excel_url FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2`,
                [projectId, entregableNum]
            );
            const excelUrl = invvialResult.rows.length > 0 ? invvialResult.rows[0].excel_url : null;

            if (excelUrl) {
                try {
                    await del(excelUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
                } catch (blobError) {
                    console.warn(`No se pudo eliminar el archivo de Vercel Blob: ${blobError.message}.`);
                }
            }

            // 2. Delete from invvial_excels
            await db.query(`DELETE FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2`, [projectId, entregableNum]);
        }

        // 3. Delete Badenes data
        const result = await badenesService.deleteExcelAndBadenes(projectId);

        // Audit Log
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Datos de Badenes', `Datos de Badenes eliminados para proyecto ${projectId} por usuario ${userId}.`]
        );

        res.json(result);
    } catch (error) {
        console.error('Error al eliminar datos de badenes:', error);
        res.status(500).json({ error: 'Error al eliminar datos de badenes.' });
    }
});


// --------------------- PUENTES ---------------------
app.get('/api/puentes/by-project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const puentes = await puentesService.getPuentesByProjectId(projectId);
        res.json(puentes);
    } catch (err) {
        console.error('Error getting puentes:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/puentes/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    const { projectId, utmZone } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const result = await puentesService.processExcelAndSavePuentes(req.file.buffer, projectId, utmZone);
        res.json(result);
    } catch (err) {
        console.error('Error uploading puentes excel:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/puentes', authenticateToken, async (req, res) => {
    try {
        const newPuente = await puentesService.createPuente(req.body);
        res.status(201).json(newPuente);
    } catch (err) {
        console.error('Error creating puente:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/puentes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedPuente = await puentesService.updatePuente(id, req.body);
        res.json(updatedPuente);
    } catch (err) {
        console.error('Error updating puente:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/puentes/project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await puentesService.deleteExcelAndPuentes(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error deleting puentes:', err);
        res.status(500).json({ error: err.message });
    }
});

// --------------------- MUROS ---------------------
app.get('/api/muros/by-project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const muros = await murosService.getMurosByProjectId(projectId);
        res.json(muros);
    } catch (err) {
        console.error('Error getting muros:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/muros/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    const { projectId, utmZone } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const result = await murosService.processExcelAndSaveMuros(req.file.buffer, projectId, utmZone);
        res.json(result);
    } catch (err) {
        console.error('Error uploading muros excel:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/muros', authenticateToken, async (req, res) => {
    try {
        const newMuro = await murosService.createMuro(req.body);
        res.status(201).json(newMuro);
    } catch (err) {
        console.error('Error creating muro:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/muros/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedMuro = await murosService.updateMuro(id, req.body);
        res.json(updatedMuro);
    } catch (err) {
        console.error('Error updating muro:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/muros/project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await murosService.deleteExcelAndMuros(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error deleting muros:', err);
        res.status(500).json({ error: err.message });
    }
});

// --------------------- SENALES PREVENTIVAS ---------------------
app.delete('/api/senales-preventivas/:id', senalesPreventivasService.deleteSenal);


// --------------------- ESTRUCTURAS EXISTENTES ---------------------
app.get('/api/estructuras-existentes/by-project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await estructurasExistentesService.getAll(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error getting estructuras existentes:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/estructuras-existentes/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    const { projectId, utmZone } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const result = await estructurasExistentesService.processExcelAndSave(req.file.buffer, projectId, utmZone);
        res.json(result);
    } catch (err) {
        console.error('Error uploading estructuras existentes excel:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/estructuras-existentes', authenticateToken, async (req, res) => {
    try {
        const result = await estructurasExistentesService.create(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating estructura existente:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/estructuras-existentes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await estructurasExistentesService.update(id, req.body);
        res.json(result);
    } catch (err) {
        console.error('Error updating estructura existente:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/estructuras-existentes/project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await estructurasExistentesService.deleteProjectData(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error deleting estructuras existentes:', err);
        res.status(500).json({ error: err.message });
    }
});


// --------------------- INTERFERENCIAS ELECTRICAS ---------------------
app.get('/api/interferencias/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const data = await interferenciasService.getInterferenciasByProjectId(req.params.projectId);
        res.json(data);
    } catch (err) {
        console.error('Error getting interferencias:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/interferencias', authenticateToken, async (req, res) => {
    try {
        const newInterferencia = await interferenciasService.createInterferencia(req.body);
        res.status(201).json(newInterferencia);
    } catch (err) {
        console.error('Error creating interferencia:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/interferencias/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedInterferencia = await interferenciasService.updateInterferencia(id, req.body);
        res.json(updatedInterferencia);
    } catch (err) {
        console.error('Error updating interferencia:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/interferencias/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    const { projectId } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const result = await interferenciasService.processExcelAndSaveInterferencias(req.file.buffer, projectId);
        res.json(result);
    } catch (err) {
        console.error('Error uploading interferencias excel:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/interferencias/project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await interferenciasService.deleteInterferenciasByProject(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error deleting interferencias:', err);
        res.status(500).json({ error: err.message });
    }
});


// --------------------- DELETE ROUTES FOR INDIVIDUAL ELEMENTS ---------------------


// BADENES
app.delete('/api/badenes/:id', authenticateToken, async (req, res) => {
    try {
        await badenesService.deleteBaden(req.params.id);
        res.json({ message: 'Eliminado correctamente' });
    } catch (err) {
        console.error(`Error deleting baden ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// PUENTES
app.delete('/api/puentes/:id', authenticateToken, async (req, res) => {
    try {
        await puentesService.deletePuente(req.params.id);
        res.json({ message: 'Eliminado correctamente' });
    } catch (err) {
        console.error(`Error deleting puente ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// MUROS
app.delete('/api/muros/:id', authenticateToken, async (req, res) => {
    try {
        await murosService.deleteMuro(req.params.id);
        res.json({ message: 'Eliminado correctamente' });
    } catch (err) {
        console.error(`Error deleting muro ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// ZONAS CRITICAS

// ESTRUCTURAS EXISTENTES
app.delete('/api/estructuras-existentes/:id', authenticateToken, async (req, res) => {
    try {
        await estructurasExistentesService.deleteEstructuraExistente(req.params.id);
        res.json({ message: 'Eliminado correctamente' });
    } catch (err) {
        console.error(`Error deleting estructura existente ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// MÓDULO GEOLOGÍA: CAPAS KML Y MUESTRAS
// ==========================================


// ==========================================
// VERSIONES DE DISEÑO GEOMÉTRICO
// ==========================================


// EXPORTACIÓN DE ENSAYOS DE TRAMO (POR TRAMO SELECCIONADO)
// Exportar un tipo específico de ensayo para un tramo

// Exportar todos los ensayos de un tramo


// ==========================================
// CLASIFICACIÓN DE MATERIALES (CRUD + EXCEL)
// ==========================================


// ==========================================
// RUTA: MOTOR NLP PARA SUELOS
// ==========================================
app.post('/api/clasificar-suelo-nlp', authenticateToken, async (req, res) => {
    try {
        const { texto } = req.body;
        if (!texto) {
            return res.status(400).json({ error: 'Falta el texto a clasificar en el body.' });
        }
        const resultado = await suelosNlpService.clasificarSuelo(texto);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error en /api/clasificar-suelo-nlp:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor NLP.' });
    }
});

app.post('/api/clasificar-suelo-nlp-batch', authenticateToken, async (req, res) => {
    try {
        const { textos } = req.body;
        if (!textos || !Array.isArray(textos)) {
            return res.status(400).json({ error: 'Falta array de textos a clasificar en el body.' });
        }
        const resultado = await suelosNlpService.clasificarSuelosBatch(textos);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error en /api/clasificar-suelo-nlp-batch:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor NLP.' });
    }
});

// Socket.IO CORS options should be defined before io initialization
const ioCorsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST']
};

const io = new Server(server, {
    cors: ioCorsOptions
});

// In-memory data for Amigo Secreto - only for tracking currently connected users
let participantesSorteo = [];

// ===== SOCKET.IO AUTHENTICATION MIDDLEWARE =====
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: Token not provided.'));
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userResult = await db.query(`
            SELECT u.id, u.nombre, u.ap_paterno, r.nombre as rol_nombre, u.rol_id
            FROM usuariost u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id = $1
        `, [decodedToken.id]);

        if (userResult.rows.length === 0) {
            return next(new Error('Authentication error: User not found.'));
        }
        socket.data.user = userResult.rows[0];
        next();
    } catch (err) {
        console.error('Socket authentication error:', err.message);
        return next(new Error('Authentication error: Invalid token.'));
    }
});

// ===== SOCKET.IO CONNECTION LOGIC (DATABASE PERSISTENT) =====
io.on('connection', async (socket) => {
    console.log(`🔌 Usuario autenticado conectado: ${socket.data.user.nombre} (ID: ${socket.id})`);

    const isOrganizer = ['ADMIN', 'COORDINADOR PROYECTO'].includes(socket.data.user.rol_nombre);

    try {
        // --- Autorización para participar ---
        const participantCheck = await db.query('SELECT 1 FROM amigo_secreto_participantes WHERE usuario_id = $1', [socket.data.user.id]);
        const isParticipant = participantCheck.rows.length > 0;

        if (!isParticipant && !isOrganizer) {
            console.log(`🚫 Usuario no autorizado ${socket.data.user.nombre} intentó conectarse.`);
            socket.emit('error_event', { message: 'No estás en la lista de participantes para este evento.' });
            return socket.disconnect();
        }

        // Add user to the in-memory list of connected participants if not already there
        if (!participantesSorteo.some(p => p.id === socket.data.user.id)) {
            participantesSorteo.push(socket.data.user);
        }

        // --- Fetch initial state from DB ---
        const eventoResult = await db.query('SELECT es_sorteo_iniciado FROM amigo_secreto_eventos WHERE id = 1');
        const esSorteoIniciado = eventoResult.rows[0]?.es_sorteo_iniciado || false;

        let asignacion = null;
        if (esSorteoIniciado) {
            const asignacionResult = await db.query(
                `SELECT u.nombre, asa.receptor_usuario_id AS receptor_id
                 FROM amigo_secreto_asignaciones asa
                 JOIN usuariost u ON asa.receptor_usuario_id = u.id
                 WHERE asa.evento_id = 1 AND asa.dador_usuario_id = $1`,
                [socket.data.user.id]
            );
            if (asignacionResult.rows.length > 0) {
                const row = asignacionResult.rows[0];
                asignacion = {
                    nombre: row.nombre,
                    receptorId: row.receptor_id
                };
            }
        }

        socket.emit('initial_state', {
            participantes: participantesSorteo,
            esSorteoIniciado,
            isOrganizer,
            asignacion: asignacion // Send existing assignment if any
        });

        // Broadcast updated participant list to everyone
        io.emit('update_participants', participantesSorteo);

    } catch (dbError) {
        console.error("Error fetching initial state from DB:", dbError);
        socket.emit('error_event', { message: 'Error de servidor al obtener estado del sorteo.' });
    }

    // --- Event Handlers ---

    socket.on('start_draw', async () => {
        const isOrganizer = ['ADMIN', 'COORDINADOR PROYECTO'].includes(socket.data.user.rol_nombre);
        if (!isOrganizer) { // Re-check authorization
            return socket.emit('error_event', { message: 'No tienes permiso para iniciar el sorteo.' });
        }

        const client = await db.connect();
        try {
            // Obtener participantes autorizados desde la base de datos
            const { rows: authorizedParticipants } = await client.query(`
                SELECT u.id, u.nombre, u.ap_paterno FROM usuariost u
                JOIN amigo_secreto_participantes asp ON u.id = asp.usuario_id
            `);

            if (authorizedParticipants.length < 2) {
                return io.emit('error_event', { message: 'No hay suficientes participantes seleccionados para el sorteo (mínimo 2).' });
            }

            console.log(`🎉 Sorteo iniciado por ${socket.data.user.nombre}! con ${authorizedParticipants.length} participantes.`);

            let receptores = [...authorizedParticipants];
            let asignacionesTemp = {};
            let asignacionValida = false;
            let attempts = 0;

            // Lógica de Sorteo Robusta (Fisher-Yates shuffle con prevención de auto-asignación)
            // Se hacen varios intentos por si el shuffle inicial produce auto-asignaciones
            while (!asignacionValida && attempts < 100) { // Limitar intentos para evitar bucles infinitos
                // 1. Barajar la lista de receptores
                for (let i = receptores.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [receptores[i], receptores[j]] = [receptores[j], receptores[i]];
                }

                // 2. Verificar si hay auto-asignaciones
                let hayConflictos = false;
                for (let i = 0; i < authorizedParticipants.length; i++) {
                    if (authorizedParticipants[i].id === receptores[i].id) {
                        hayConflictos = true;
                        // Intentar una corrección local simple para este conflicto
                        if (receptores.length > 1) { // Asegurarse de que haya al menos dos elementos para intercambiar
                            const swapIndex = (i + 1) % receptores.length; // Intercambiar con el siguiente (circularmente)
                            [receptores[i], receptores[swapIndex]] = [receptores[swapIndex], receptores[i]];
                            // Tras el swap, se podría haber creado un nuevo conflicto o no haber resuelto el original.
                            // Por simplicidad, si hubo un conflicto y lo 'corregimos', asumimos que necesitamos verificar de nuevo o re-shuffulear.
                            // Si se quiere una solución 100% garantizada en pocos pasos, se requiere un algoritmo más complejo (e.g., matching bipartito).
                            // Para 'amigo secreto', re-shuffulear es aceptable si hay pocos conflictos.
                        }
                    }
                }

                // Después de intentar corregir conflictos, re-verificamos la validez de toda la asignación
                hayConflictos = false;
                for (let i = 0; i < authorizedParticipants.length; i++) {
                    if (authorizedParticipants[i].id === receptores[i].id) {
                        hayConflictos = true;
                        break;
                    }
                }

                if (!hayConflictos) {
                    asignacionValida = true;
                }
                attempts++;
            }

            if (!asignacionValida) {
                // Si después de varios intentos no se logra, emitir un error.
                console.error('No se pudo realizar el sorteo sin conflictos después de múltiples intentos.');
                return io.emit('error_event', { message: 'No se pudo realizar el sorteo sin conflictos. Inténtalo de nuevo.' });
            }

            // 3. Crear el mapa de asignaciones
            authorizedParticipants.forEach((dador, index) => {
                const receptor = receptores[index];
                asignacionesTemp[dador.id] = { nombre: `${receptor.nombre} ${receptor.ap_paterno}`.trim(), id: receptor.id };
            });

            // 4. Guardar en la Base de Datos
            await client.query('BEGIN');
            await client.query('DELETE FROM amigo_secreto_asignaciones WHERE evento_id = 1'); // Limpiar asignaciones anteriores

            const insertPromises = Object.entries(asignacionesTemp).map(([dadorId, receptorData]) => {
                return client.query(
                    'INSERT INTO amigo_secreto_asignaciones (evento_id, dador_usuario_id, receptor_usuario_id) VALUES (1, $1, $2)',
                    [parseInt(dadorId, 10), receptorData.id]
                );
            });
            await Promise.all(insertPromises);

            await client.query('UPDATE amigo_secreto_eventos SET es_sorteo_iniciado = true WHERE id = 1');
            await client.query('COMMIT');
            console.log("Asignaciones guardadas en la DB.");

            // 5. Notificar a los clientes
            io.emit('draw_started'); // Notificar que el sorteo ha comenzado

            setTimeout(async () => {
                const allSockets = await io.fetchSockets();
                allSockets.forEach(sock => {
                    const miAsignacion = asignacionesTemp[sock.data.user.id];
                    if (miAsignacion) {
                        sock.emit('final_assignment', { nombre: `¡${miAsignacion.nombre}!`, receptorId: miAsignacion.id });
                    }
                });
            }, 3000); // Delay para la animación

        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Fallo la transacción del sorteo:', e);
            io.emit('error_event', { message: 'Error en el servidor al realizar el sorteo.' });
            socket.emit('error_event', { message: 'Error en el servidor al reiniciar el sorteo.' });
        } finally {
            client.release();
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Usuario desconectado: ${socket.data.user.nombre}`);
        participantesSorteo = participantesSorteo.filter(p => p.id !== socket.data.user.id);
        io.emit('update_participants', participantesSorteo);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}`);
    console.log('🚀🚀🚀 Backend del Geoportal con WebSockets - ¡NUEVA VERSION EN LINEA! 🚀🚀🚀');
    // --- CHECK PYTHON WORKER STATUS WITH RETRIES ---
    const checkPythonWorker = async (retries = 5, delay = 5000) => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(`${PYTHON_WORKER_URL}/health`);
                console.log('✅ Python Worker (FastAPI) is CONNECTED:', response.data);
                return;
            } catch (error) {
                console.warn(`⏳ Esperando al Python Worker (Intento ${i + 1}/${retries})...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
        console.error('❌ Failed to connect to Python Worker after several attempts.');
        console.error('   Ensure start.sh is running correctly and Python dependencies are installed.');
    };

    // Iniciar verificación en background sin bloquear a Node.js
    checkPythonWorker();
});

// Aumentar timeouts para manejar subidas largas
server.keepAliveTimeout = 600 * 1000; // 10 minutos
server.headersTimeout = 610 * 1000; // 10 minutos y 10 segundos
server.timeout = 600 * 1000; // 10 minutos (reemplaza a setTimeout)
