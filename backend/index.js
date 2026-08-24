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
const usuariosService = require('./services/usuariosService');
const puntosMapaService = require('./services/puntosMapaService');
const canterasService = require('./services/canterasService');
const fuentesAguaService = require('./services/fuentesAguaService');
const suelosNlpService = require('./services/suelosNlpService');
const alcantarillasService = require('./services/alcantarillasService');
const alcantarillasGraphicsService = require('./services/alcantarillasGraphicsService');
const alcantarillasE1Service = require('./services/alcantarillasE1Service');
const interferenciasService = require('./services/interferenciasService');
const badenesService = require('./services/badenesService');
const puentesService = require('./services/puentesService');
const murosService = require('./services/murosService');
const senalesPreventivasService = require('./services/senalesPreventivasService');
const canterasFuentesService = require('./services/canterasyfuentesdeaguainvvialService');
const zonasCriticasService = require('./services/zonasCriticasService');
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
        const pythonResponse = await axios.post('http://127.0.0.1:8000/process-image', formData, {
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
                console.log("Enviando a http://127.0.0.1:8000/3d/analizar-landxml");
                pythonResponse = await axios.post('http://127.0.0.1:8000/3d/analizar-landxml', formData, {
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
                console.log("Enviando a http://127.0.0.1:8000/3d/analizar-ifc");
                pythonResponse = await axios.post('http://127.0.0.1:8000/3d/analizar-ifc', formData, {
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

// POST: subir KMZ con imágenes embebidas
app.post('/api/proyectos/:id/panel-fotografico/upload-kmz', authenticateToken, authorizeAdminOrCoordinator, upload.single('kmz'), async (req, res) => {
    const { id: proyectoId } = req.params;

    if (!req.file) {
        return res.status(400).json({ status: 'error', error: 'No se subió ningún archivo KMZ.' });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA ||
        process.env.BLOB_READ_WRITE_TOKEN;

    try {
        const fileBuffer = req.file.buffer;

        // 1. Abrir el KMZ como ZIP
        const zip = new AdmZip(fileBuffer);
        const zipEntries = zip.getEntries();

        // 2. Encontrar el archivo KML principal
        const kmlEntry = zipEntries.find(e =>
            !e.isDirectory && e.entryName.toLowerCase().endsWith('.kml')
        );
        if (!kmlEntry) {
            return res.status(400).json({ status: 'error', error: 'El KMZ no contiene un archivo KML.' });
        }

        const kmlText = kmlEntry.getData().toString('utf8');

        // 3. Parsear el KML con fast-xml-parser
        const fxp = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            isArray: (name) => ['Placemark', 'Folder'].includes(name),
            allowBooleanAttributes: true,
        });
        const kmlParsed = fxp.parse(kmlText);

        const extractPlacemarks = (node) => {
            let marks = [];
            if (!node) return marks;
            if (node.Placemark) marks = marks.concat(node.Placemark);
            if (node.Folder) {
                const folders = Array.isArray(node.Folder) ? node.Folder : [node.Folder];
                folders.forEach(f => { marks = marks.concat(extractPlacemarks(f)); });
            }
            return marks;
        };

        const doc = kmlParsed?.kml?.Document || kmlParsed?.kml || {};
        const placemarks = extractPlacemarks(doc);

        // 4. Crear un mapa rápido de imágenes del ZIP
        const imageMap = {};
        zipEntries.forEach(entry => {
            if (!entry.isDirectory) {
                const lower = entry.entryName.toLowerCase();
                if (lower.match(/\.(jpe?g|png|gif|webp|bmp)$/)) {
                    imageMap[entry.entryName] = entry.getData();
                    const basename = entry.entryName.split('/').pop();
                    imageMap[basename] = entry.getData();
                }
            }
        });

        // 5. Preparar tareas de procesamiento (Subida paralela controlada a Vercel Blob)
        console.log(`[Panel Fotográfico] Procesando ${placemarks.length} elementos en lotes...`);
        const results = [];
        const CONCURRENCY_LIMIT = 15; // Lote de peticiones concurrentes a Vercel Blob

        for (let i = 0; i < placemarks.length; i += CONCURRENCY_LIMIT) {
            const chunk = placemarks.slice(i, i + CONCURRENCY_LIMIT);
            const chunkResults = await Promise.all(chunk.map(async (pm) => {
                const nombre = pm.name ? String(pm.name).trim() : null;
                const descripcion = pm.description ? String(pm.description).replace(/<[^>]+>/g, '').trim() : null;

                let lat = null, lng = null;
                const coords = pm?.Point?.coordinates;
                if (coords) {
                    const parts = String(coords).trim().split(',');
                    if (parts.length >= 2) {
                        const parsedLng = parseFloat(parts[0]);
                        const parsedLat = parseFloat(parts[1]);
                        if (!isNaN(parsedLng) && !isNaN(parsedLat)) {
                            lng = parsedLng;
                            lat = parsedLat;
                        }
                    }
                }

                let imageBuffer = null, imageFilename = null;
                const descRaw = pm.description ? String(pm.description) : '';
                const imgMatch = descRaw.match(/src=["']([^"']+\.(jpe?g|png|gif|webp|bmp))["']/i);
                if (imgMatch) {
                    const refPath = imgMatch[1];
                    const refBasename = refPath.split('/').pop();
                    imageBuffer = imageMap[refPath] || imageMap[refBasename] || null;
                    imageFilename = refBasename;
                }

                if (!imageBuffer && nombre) {
                    const matchKey = Object.keys(imageMap).find(k =>
                        k.toLowerCase().includes(nombre.toLowerCase().replace(/\s+/g, '_')) ||
                        k.toLowerCase().includes(nombre.toLowerCase().replace(/\s+/g, ''))
                    );
                    if (matchKey) {
                        imageBuffer = imageMap[matchKey];
                        imageFilename = matchKey.split('/').pop();
                    }
                }

                let imageUrl = null;
                if (imageBuffer) {
                    try {
                        const safeFilename = (imageFilename || `foto_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9-._]/g, '_');
                        const targetFolder = getGeologiaStorageFolder(proyectoId, 'panel_fotografico');
                        const finalFilename = `${Date.now()}_${safeFilename}`;

                        console.log(`[Panel Fotográfico] Subiendo a NAS QNAP: ${targetFolder}/${finalFilename}...`);
                        imageUrl = await uploadFileToNAS(imageBuffer, targetFolder, finalFilename);
                    } catch (putErr) {
                        console.error(`[Panel Fotográfico] ERROR CRÍTICO NAS QNAP (${imageFilename}):`, putErr.message);
                        if (putErr.response) console.error(`[Panel Fotográfico] Detalle error NAS:`, putErr.response.data);
                    }
                } else {
                    console.warn(`[Panel Fotográfico] No se encontró buffer de imagen para ${nombre || 'elemento sin nombre'} (${imageFilename})`);
                }
                return { nombre, descripcion, lat, lng, imageUrl, original_filename: imageFilename };
            }));
            results.push(...chunkResults);
        }

        // Solo incluimos registros que tengan URL de imagen si es requisito de la tabla, 
        // o al menos que tengan coordenadas. 
        // Si image_url es NOT NULL en la DB, debemos filtrar los que no tienen imageUrl para evitar el 500 error.
        const validResults = results.filter(r => r.imageUrl);

        if (validResults.length === 0 && results.length > 0) {
            console.error("[Panel Fotográfico] No se pudo subir ninguna imagen de las encontradas en el KMZ.");
            throw new Error("No se pudo subir ninguna imagen al NAS. Verifique la configuración de WebDAV y los permisos.");
        }

        // 6. Inserción en BD
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM geologia_fotos_panel WHERE proyecto_id = $1', [proyectoId]);

            const fotosInsertadas = [];
            for (const r of validResults) {
                const resDb = await client.query(
                    `INSERT INTO geologia_fotos_panel (proyecto_id, nombre, descripcion, lat, lng, image_url, original_filename)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                    [proyectoId, r.nombre, r.descripcion, r.lat, r.lng, r.imageUrl, r.original_filename]
                );
                fotosInsertadas.push(resDb.rows[0]);
            }
            await client.query('COMMIT');
            console.log(`[Panel Fotográfico] OK: ${fotosInsertadas.length} fotos guardadas.`);

            // 7. Extraer GeoJSON del KML para mostrar la capa base en el mapa (opcional)
            try {
                const kmlDom = new DOMParser().parseFromString(kmlText, 'text/xml');
                const geojson = kml(kmlDom);

                if (geojson && geojson.features && geojson.features.length > 0) {
                    console.log(`[Panel Fotográfico] Guardando capa GeoJSON extraída del KMZ (${geojson.features.length} elementos)...`);
                    await db.query(`
                        INSERT INTO geologia_capas (proyecto_id, tab_name, geojson_data, file_name)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (proyecto_id, tab_name) 
                        DO UPDATE SET 
                            geojson_data = EXCLUDED.geojson_data,
                            file_name = EXCLUDED.file_name,
                            uploaded_at = CURRENT_TIMESTAMP
                    `, [proyectoId, 'panel_fotografico', JSON.stringify(geojson), req.file.originalname]);
                }
            } catch (layerErr) {
                console.error('[Panel Fotográfico] Error al extraer capa GeoJSON del KMZ:', layerErr.message);
            }

            res.json({ status: 'ok', count: fotosInsertadas.length, fotos: fotosInsertadas });
        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('[Panel Fotográfico] Error al procesar KMZ:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// GET: obtener todas las fotos del panel fotográfico
app.get('/api/proyectos/:id/panel-fotografico', authenticateToken, async (req, res) => {
    const { id: proyectoId } = req.params;
    try {
        const result = await db.query(
            `SELECT * FROM geologia_fotos_panel WHERE proyecto_id = $1 ORDER BY id ASC`,
            [proyectoId]
        );
        res.json({ status: 'ok', fotos: result.rows });
    } catch (err) {
        console.error('[Panel Fotográfico] Error al obtener fotos:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// DELETE: limpiar/resetear todas las fotos del panel
app.delete('/api/proyectos/:id/panel-fotografico', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { id: proyectoId } = req.params;
    try {
        await db.query('DELETE FROM geologia_fotos_panel WHERE proyecto_id = $1', [proyectoId]);
        res.json({ status: 'ok', message: 'Panel fotográfico limpiado exitosamente.' });
    } catch (err) {
        console.error('[Panel Fotográfico] Error al eliminar fotos:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

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

// --------------------- ENSAYOS ---------------------
// Get all assays for a specific tramo
app.get('/api/tramos/:tramoId/ensayos', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    console.log(`[DEBUG] GET /api/tramos/${tramoId}/ensayos hit`);
    try {
        const ensayosList = await ensayosService.getEnsayosByTramoId(tramoId);
        console.log(`[DEBUG] ensayosList count: ${ensayosList.length}`);
        const tramoInfo = await progresivasService.getProgresivaById(tramoId);
        console.log(`[DEBUG] tramoInfo found: ${!!tramoInfo}`);
        res.json({
            ensayos: ensayosList,
            tramo: tramoInfo
        });
    } catch (err) {
        console.error(`[ERROR] Error al obtener ensayos para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener los ensayos del tramo', details: err.message });
    }
});


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

app.post('/api/zonas-criticas/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo Excel.' });
        }
        const { projectId, utmZone } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: 'Falta el ID del proyecto.' });
        }

        const result = await zonasCriticasService.processExcelAndSaveZonasCriticas(req.file.buffer, projectId, utmZone);
        res.json(result);
    } catch (err) {
        console.error('Error procesando Excel Zonas Críticas:', err);
        res.status(500).json({ error: 'Error al procesar el archivo Excel', details: err.message });
    }
});

app.get('/api/zonas-criticas/:projectId', authenticateToken, async (req, res) => {
    try {
        const data = await zonasCriticasService.getAllZonasCriticas(req.params.projectId);
        res.json(data);
    } catch (err) {
        console.error('Error obteniendo zonas críticas:', err);
        res.status(500).json({ error: 'Error al obtener zonas críticas', details: err.message });
    }
});

app.put('/api/zonas-criticas/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await zonasCriticasService.updateZonaCritica(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error actualizando zona crítica:', err);
        res.status(500).json({ error: 'Error actualizando zona crítica', details: err.message });
    }
});

app.delete('/api/zonas-criticas/:id', authenticateToken, async (req, res) => {
    try {
        const result = await zonasCriticasService.deleteZonaCritica(req.params.id);
        res.json(result);
    } catch (err) {
        console.error('Error eliminando zona crítica:', err);
        res.status(500).json({ error: 'Error eliminando zona crítica', details: err.message });
    }
});

app.delete('/api/zonas-criticas/delete-excel/:projectId', authenticateToken, async (req, res) => {
    try {
        await zonasCriticasService.deleteExcelAndZonasCriticas(req.params.projectId);
        res.json({ message: 'Datos eliminados correctamente' });
    } catch (err) {
        console.error('Error eliminando datos de Excel de zonas críticas:', err);
        res.status(500).json({ error: 'Error eliminando datos', details: err.message });
    }
});

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

// --------------------- USUARIOS ---------------------
app.post('/api/usuarios', authenticateToken, authorizePermission('usuarios', 'edicion'), async (req, res) => {
    try {
        const result = await usuariosService.createUser(req.body);
        res.status(201).json({ status: 'ok', mensaje: 'Usuario creado correctamente', userId: result.userId });

        // --- Audit Log: Creación de Usuario ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [req.user.id, 'Creación de Usuario', `Usuario con DNI ${req.body.dni} creado por ${req.user.id}`]
        );
        // --- End Audit Log ---
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear usuario', details: err.message });
    }
});

app.get('/api/usuarios', authenticateToken, authorizePermission('usuarios', 'lectura'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.*, r.nombre AS rol_nombre, e.nombre AS especialidad_nombre
            FROM usuariost u
            LEFT JOIN roles r ON u.rol_id = r.id
            LEFT JOIN especialidades e ON u.codigo_esp = e.codigo_esp
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener usuarios' });
    }
});

// Buscar usuario por DNI (para autocompletado en el modal)
app.get('/api/usuarios/dni/:dni', authenticateToken, async (req, res) => {
    const { dni } = req.params;
    try {
        const result = await db.query(
            `SELECT u.*, r.nombre AS rol_nombre, e.nombre AS especialidad_nombre
             FROM usuariost u
             LEFT JOIN roles r ON u.rol_id = r.id
             LEFT JOIN especialidades e ON u.codigo_esp = e.codigo_esp
             WHERE u.dni = $1 LIMIT 1`,
            [dni]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error('Error al obtener usuario por DNI:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener usuario por DNI' });
    }
});

// Obtener usuarios agrupados por proyecto
app.get('/api/usuarios/por-proyecto', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const usersByProject = await usuariosService.getUsersGroupedByProject();
        res.json(usersByProject);
    } catch (err) {
        console.error('Error al obtener usuarios por proyecto:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener usuarios por proyecto' });
    }
});

app.get('/api/usuarios/:id', authenticateToken, authorizePermission('usuarios', 'lectura'), async (req, res) => {
    const { id } = req.params;
    try {
        const user = await usuariosService.getUserById(id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener usuario' });
    }
});


app.delete('/api/usuarios/:dni', authenticateToken, authorizePermission('usuarios', 'edicion'), async (req, res) => {
    const { dni } = req.params;
    try {
        const result = await usuariosService.deleteUser(dni);
        if (result.success) {
            res.json({ status: 'ok', mensaje: 'Usuario eliminado correctamente' });
            // --- Audit Log: Eliminación de Usuario ---
            await db.query(
                'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
                [req.user.id, 'Eliminación de Usuario', `Usuario con DNI ${dni} eliminado por ${req.user.id}`]
            );
            // --- End Audit Log ---
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al eliminar usuario' });
    }
});

app.put('/api/usuarios/:dni', authenticateToken, authorizePermission('usuarios', 'edicion'), async (req, res) => {
    const { dni } = req.params;
    const {
        tramo, usuario, password, nombre, ap_paterno,
        ap_materno, correo, mail_cu_104, fecha_ingreso,
        codigo_esp, nivel, subnivel, tipo_user, rol_id
    } = req.body;

    try {
        const result = await db.query(`
            UPDATE usuariost SET
                tramo = $1,
                usuario = $2,
                password = $3,
                nombre = $4,
                ap_paterno = $5,
                ap_materno = $6,
                correo = $7,
                mail_cu_104 = $8,
                fecha_ingreso = $9,
                codigo_esp = $10,
                nivel = $11,
                subnivel = $12,
                tipo_user = $13,
                rol_id = $14
            WHERE dni = $15
        `, [
            tramo, usuario, password, nombre, ap_paterno,
            ap_materno, correo, mail_cu_104, fecha_ingreso,
            codigo_esp, nivel, subnivel, tipo_user, rol_id, dni
        ]);

        if (result.rowCount > 0) {
            res.json({ status: 'ok', mensaje: 'Usuario actualizado correctamente' });
            // --- Audit Log: Actualización de Usuario ---
            await db.query(
                'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
                [req.user.id, 'Actualización de Usuario', `Usuario con DNI ${dni} actualizado por ${req.user.id}. Campos actualizados: ${JSON.stringify(req.body)}`]
            );
            // --- End Audit Log ---
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar usuario' });
    }
});

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


// Nueva función para subir archivos Excel de alcantarillas a Vercel Blob
async function uploadAlcantarillasExcelToVercelBlob(fileBuffer, originalFilename, projectId) {
    try {
        const originalExtension = path.extname(originalFilename);
        const filename = `tramoinv/invexcel/${projectId}_${Date.now()}${originalExtension}`;
        const blob = await put(filename, fileBuffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo Excel de alcantarillas a Vercel Blob:', error);
        throw new Error('Error al subir archivo Excel de alcantarillas a Vercel Blob');
    }
}

// Nuevo endpoint para subir archivos Excel de alcantarillas
app.post('/api/alcantarillas/upload-excel', authenticateToken, authorizePermission('alcantarillas', 'edicion'), upload.single('excelFile'), async (req, res) => {
    const { projectId, utmZone, entregableNum } = req.body;
    const userId = req.user.id;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }
        if (!entregableNum) {
            return res.status(400).json({ error: 'entregableNum es requerido.' });
        }

        const fileBuffer = req.file.buffer;

        // Procesar los 4 tipos de elementos con el entregable por defecto si es necesario
        const processResultAlcantarillas = await alcantarillasService.processExcelAndSaveAlcantarillas(fileBuffer, projectId, utmZone, entregableNum);
        const processResultBadenes = await badenesService.processExcelAndSaveBadenes(fileBuffer, projectId, utmZone, entregableNum);
        const processResultPuentes = await puentesService.processExcelAndSavePuentes(fileBuffer, projectId, utmZone, entregableNum);
        const processResultMuros = await murosService.processExcelAndSaveMuros(fileBuffer, projectId, utmZone, entregableNum);
        const processResultInterferencias = await interferenciasService.processExcelAndSaveInterferencias(fileBuffer, projectId);

        // Subir el archivo a Vercel Blob
        const excelUrl = await uploadAlcantarillasExcelToVercelBlob(fileBuffer, req.file.originalname, projectId);

        // Guardar la URL en la tabla invvial_excels
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

        const finalMessage = `Archivo Excel procesado. ${processResultAlcantarillas.message}. ${processResultBadenes.message}. ${processResultPuentes.message}. ${processResultMuros.message}. ${processResultInterferencias.message}.`;

        // --- Audit Log ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Subida de Archivo Excel de Inventario Vial', `Archivo subido para proyecto ${projectId}. URL: ${excelUrl}. Resultados: ${finalMessage}`]
        );
        // --- End Audit Log ---

        res.status(201).json({
            status: 'ok',
            message: finalMessage,
            excelUrl,
            processResult: {
                alcantarillas: processResultAlcantarillas,
                badenes: processResultBadenes,
                puentes: processResultPuentes,
                muros: processResultMuros,
                interferencias: processResultInterferencias
            },
            fileInfo: {
                excel_url: excelUrl,
                original_filename: req.file.originalname
            }
        });
    } catch (error) {
        console.error('Error en la ruta /api/alcantarillas/upload-excel:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al subir el archivo Excel de inventario vial.' });
    }
});

// Nuevo endpoint para subir archivos Excel de gráficos de alcantarillas (AHORA ASÍNCRONO)
app.post('/api/alcantarillas/upload-graphics-excel', authenticateToken, authorizePermission('alcantarillas', 'edicion'), upload.single('excelFile'), async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user.id;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }

        const jobPayload = {
            filePath: req.file.path,
            originalName: req.file.originalname,
            userId: userId,
            entregable: req.body.entregable || null
        };
        const jobType = path.extname(req.file.originalname).toLowerCase() === '.rar' ? 'rar_extraction' : 'simple_file_upload';

        const newJob = await db.query(
            `INSERT INTO processing_jobs (job_type, project_id, status, payload)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [jobType, projectId, 'pending', jobPayload]
        );
        const jobId = newJob.rows[0].id;

        if (jobType === 'rar_extraction') {
            alcantarillasGraphicsService.processRarExtractionJob(jobId).catch(err => console.error(`Error no controlado en el job de extracción RAR (Job ID: ${jobId}):`, err));
        } else {
            alcantarillasGraphicsService.processSimpleUploadJob(jobId).catch(err => console.error(`Error no controlado en el job de subida simple (Job ID: ${jobId}):`, err));
        }

        res.status(202).json({
            status: 'ok',
            message: 'Archivo recibido. El procesamiento ha comenzado en segundo plano.',
            jobId: jobId
        });
    } catch (error) {
        console.error('Error en la ruta /api/alcantarillas/upload-graphics-excel:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al iniciar el procesamiento del archivo.' });
    }
});

const uploadChunk = multer({ storage: multer.memoryStorage() });

app.post('/api/alcantarillas/upload-chunk', authenticateToken, authorizePermission('alcantarillas', 'edicion'), uploadChunk.single('fileChunk'), async (req, res) => {
    try {
        const { uploadId, chunkIndex } = req.body;
        const chunkBuffer = req.file.buffer;

        if (!uploadId || !chunkIndex || chunkBuffer === undefined) {
            return res.status(400).json({ error: 'uploadId, chunkIndex, and fileChunk are required.' });
        }

        const chunkDir = path.join('/tmp', uploadId);
        await fsp.mkdir(chunkDir, { recursive: true });
        const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
        await fsp.writeFile(chunkPath, chunkBuffer);
        res.status(200).json({ status: 'ok', message: 'Chunk received.' });
    } catch (error) {
        console.error('Error saving chunk:', error);
        res.status(500).json({ status: 'error', message: 'Failed to save chunk.' });
    }
});

app.post('/api/alcantarillas/complete-upload', authenticateToken, authorizePermission('alcantarillas', 'edicion'), async (req, res) => {
    const { projectId, uploadId, originalFilename, entregable } = req.body;
    const userId = req.user.id;

    if (!projectId || !uploadId || !originalFilename) {
        return res.status(400).json({ error: 'projectId, uploadId, and originalFilename are required.' });
    }

    try {
        const result = await alcantarillasGraphicsService.reassembleAndProcessChunks(projectId, uploadId, originalFilename, userId, entregable);
        res.status(202).json(result);
    } catch (error) {
        console.error('Error al completar la subida por chunks:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al ensamblar el archivo.' });
    }
});

app.post('/api/alcantarillas/upload-images', authenticateToken, authorizePermission('alcantarillas', 'edicion'), uploadDisk.single('files'), async (req, res) => {
    const { projectId, entregable } = req.body;
    const userId = req.user.id;

    try {
        if (!req.file) {
            console.log('DEBUG MANUAL UPLOAD: No file received in req.file');
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }

        console.log('DEBUG MANUAL UPLOAD: req.file:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        });

        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }

        const jobPayload = {
            filePath: req.file.path,
            originalName: req.file.originalname,
            userId: userId,
            entregable: entregable || null
        };
        const jobType = path.extname(req.file.originalname).toLowerCase() === '.rar' ? 'rar_extraction' : 'simple_file_upload';

        const newJob = await db.query(
            `INSERT INTO processing_jobs (job_type, project_id, status, payload)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [jobType, projectId, 'pending', jobPayload]
        );
        const jobId = newJob.rows[0].id;

        if (jobType === 'rar_extraction') {
            alcantarillasGraphicsService.processRarExtractionJob(jobId).catch(err => console.error(`Error no controlado en el job de extracción RAR (Job ID: ${jobId}):`, err));
        } else {
            alcantarillasGraphicsService.processSimpleUploadJob(jobId).catch(err => console.error(`Error no controlado en el job de subida simple (Job ID: ${jobId}):`, err));
        }

        res.status(202).json({
            status: 'ok',
            message: 'Archivo recibido. Procesamiento iniciado.',
            jobId: jobId
        });

    } catch (error) {
        console.error(`Error en la ruta POST /api/alcantarillas/upload-images:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al subir la imagen.' });
    }
});

app.delete('/api/alcantarillas/graphics/:imageId', authenticateToken, async (req, res) => {
    const { imageId } = req.params;
    const { projectId } = req.query;
    const userId = req.user.id;

    try {
        const result = await alcantarillasGraphicsService.deleteGraphicImage(imageId, projectId);

        // --- Audit Log: Eliminación de Imagen de Gráfico de Alcantarillas ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Imagen de Gráfico de Alcantarillas', `Imagen de gráfico ${imageId} eliminada para proyecto ${projectId} por usuario ${userId}.`]
        );
        // --- End Audit Log ---

        res.status(200).json({ status: 'ok', message: result.message });
    } catch (error) {
        console.error(`Error en la ruta DELETE /api/alcantarillas/graphics/${imageId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar la imagen de gráfico.' });
    }
});

app.delete('/api/alcantarillas/graphics/all/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    try {
        const result = await alcantarillasGraphicsService.deleteAllGraphicImages(projectId);

        // --- Audit Log: Eliminación de Todas las Imágenes de Gráfico de Alcantarillas ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Todas las Imágenes de Gráfico de Alcantarillas', `Todas las imágenes de gráfico eliminadas para proyecto ${projectId} por usuario ${userId}.`]
        );
        // --- End Audit Log ---

        res.status(200).json({ status: 'ok', message: result.message });
    } catch (error) {
        console.error(`Error en la ruta DELETE /api/alcantarillas/graphics/all/${projectId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar todas las imágenes de gráfico.' });
    }
});

// NEW: Endpoint to delete graphic images by folder (deliverable)
app.delete('/api/alcantarillas/graphics/folder/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { entregable } = req.body;
    const userId = req.user.id;

    if (!entregable) {
        return res.status(400).json({ error: 'El entregable es requerido.' });
    }

    try {
        const result = await alcantarillasGraphicsService.deleteGraphicImagesByFolder(projectId, entregable);

        // --- Audit Log ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación selectiva de Gráficos', `Imágenes de entregable ${entregable} eliminadas para proyecto ${projectId}.`]
        );

        res.status(200).json({ status: 'ok', message: result.message });
    } catch (error) {
        console.error(`Error en DELETE /api/alcantarillas/graphics/folder/${projectId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar imágenes por carpeta.' });
    }
});

// NEW: Endpoint to get all graphic images for a project
app.get('/api/alcantarillas/graphics/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const images = await alcantarillasGraphicsService.getGraphicsImagesByProjectId(projectId);
        res.status(200).json(images);
    } catch (error) {
        console.error(`Error en la ruta GET /api/alcantarillas/graphics/${projectId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al obtener imágenes de gráfico.' });
    }
});

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

// Nuevo endpoint para obtener alcantarillas por ID de proyecto
app.get('/api/proyectos/:projectId/alcantarillas', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const alcantarillas = await alcantarillasService.getAlcantarillasByProjectId(projectId);
        res.json(alcantarillas);
    } catch (error) {
        console.error(`Error al obtener alcantarillas para el proyecto ${projectId}:`, error);
        res.status(500).json({ error: 'Error al obtener alcantarillas', details: error.message });
    }
});

// Endpoint para crear una nueva alcantarilla
app.post('/api/alcantarillas', authenticateToken, async (req, res) => {
    try {
        const newAlcantarilla = await alcantarillasService.createAlcantarilla(req.body);
        res.status(201).json(newAlcantarilla);
    } catch (error) {
        console.error('Error al crear alcantarilla:', error);
        res.status(500).json({ error: 'Error al crear alcantarilla', details: error.message });
    }
});

// Endpoint para actualizar una alcantarilla existente
app.put('/api/alcantarillas/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedAlcantarilla = await alcantarillasService.updateAlcantarilla(id, req.body);
        if (updatedAlcantarilla) {
            res.json(updatedAlcantarilla);
        } else {
            res.status(404).json({ error: 'Alcantarilla no encontrada' });
        }
    } catch (error) {
        console.error(`Error al actualizar alcantarilla ${id}:`, error);
        res.status(500).json({ error: 'Error al actualizar alcantarilla', details: error.message });
    }
});

// --------------------- BADENES ---------------------
// Nuevo endpoint para obtener badenes por ID de proyecto
app.get('/api/proyectos/:projectId/badenes', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const badenes = await badenesService.getBadenesByProjectId(projectId);
        res.json(badenes);
    } catch (error) {
        console.error(`Error al obtener badenes para el proyecto ${projectId}:`, error);
        res.status(500).json({ error: 'Error al obtener badenes', details: error.message });
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


// NEW: Endpoint para eliminar el archivo Excel de alcantarillas y sus datos asociados
app.delete('/api/alcantarillas/delete-excel/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { entregableNum, tipos } = req.query; // Get entregableNum and tipos from query
    const userId = req.user.id;

    const client = await db.connect();

    try {
        // entregableNum es opcional para Canteras/Fuentes global
        const typesToDelete = tipos ? tipos.split(',') : [];
        if (typesToDelete.length === 0) {
            return res.status(400).json({ error: 'Debe especificar al menos un tipo de dato para eliminar (alcantarillas, badenes).' });
        }

        // 1. Get Excel URL (Only if entregableNum is provided)
        let excelUrl = null;
        if (entregableNum) {
            const invvialResult = await client.query(
                `SELECT excel_url FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2`,
                [projectId, entregableNum]
            );
            excelUrl = invvialResult.rows.length > 0 ? invvialResult.rows[0].excel_url : null;
        }

        // 2. Delete file from Vercel Blob if it exists and we are deleting all associated data
        if (excelUrl) {
            try {
                await del(excelUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            } catch (blobError) {
                console.warn(`No se pudo eliminar el archivo de Vercel Blob: ${blobError.message}. Puede que ya no exista.`);
            }
        }

        // 3. Delete DB entries in a transaction
        let deletedMessages = [];
        await client.query('BEGIN');

        if (typesToDelete.includes('alcantarillas')) {
            await client.query('DELETE FROM alcantarillas WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de alcantarillas');
        }
        if (typesToDelete.includes('badenes')) {
            await client.query('DELETE FROM badenes WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de badenes');
        }
        if (typesToDelete.includes('interferencias')) {
            await client.query('DELETE FROM interferencias_electricas WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de interferencias');
        }
        if (typesToDelete.includes('puentes')) {
            await client.query('DELETE FROM puentes WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de puentes');
        }
        if (typesToDelete.includes('muros')) {
            await client.query('DELETE FROM muros WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de muros');
        }
        if (typesToDelete.includes('canterasfuentes')) {
            await client.query('DELETE FROM invvial_canteras WHERE id_proyecto = $1', [projectId]);
            await client.query('DELETE FROM invvial_fuentes WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de canteras y fuentes de agua');
        }

        // 4. Delete the entry from invvial_excels table (Only if entregableNum is provided)
        if (entregableNum) {
            await client.query(`DELETE FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2`, [projectId, entregableNum]);
        }

        await client.query('COMMIT');

        // --- Audit Log ---
        const auditDetails = `Archivo Excel, ${deletedMessages.join(' y ')} eliminados para proyecto ${projectId} (entregable ${entregableNum}) por usuario ${userId}.`;
        await client.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Datos de Inventario Vial', auditDetails]
        );
        // --- End Audit Log ---

        res.status(200).json({ status: 'ok', message: `Archivo Excel, ${deletedMessages.join(' y ')} eliminados correctamente.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el archivo Excel y los datos:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar el archivo Excel y los datos.' });
    } finally {
        client.release();
    }
});

// NEW: Endpoint to get excel info
app.get('/api/alcantarillas/excel-info/:projectId/:entregableNum', authenticateToken, async (req, res) => {
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
        console.error('Error al obtener información del archivo Excel:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
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

app.post('/api/tramos/:tramoId/upload-docx-photos', authenticateToken, upload.single('docxFile'), async (req, res) => {
    try {
        const { tramoId } = req.params;
        if (!req.file) throw new Error('No se recibió archivo DOCX.');

        const result = await progresivasService.processDocxUpload(req.file, tramoId, req.user.id);

        res.json({ status: 'ok', summary: result });
    } catch (err) {
        console.error('DOCX Upload Error:', err);
        res.status(500).json({ error: err.message, details: err.stack });
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

// --------------------- PROYECTOS ---------------------
// Listar proyectos con detalle (incluyendo los nuevos campos)
app.get('/api/proyectos/detallado', authenticateToken, async (req, res) => {
    try {
        const proyectos = await proyectosService.getDetailedProyectos();
        res.json(proyectos);
    } catch (err) {
        console.error('Error al obtener proyectos detallados:', err);
        res.status(500).json({ error: 'Error al obtener proyectos detallados', details: err.message });
    }
});

// Nueva ruta para obtener solo los proyectos detallados asignados al usuario (o todos si es admin)
app.get('/api/proyectos/assigned-detailed', authenticateToken, async (req, res) => {
    try {
        const { id: userId, rol_nombre: userRole } = req.user;
        let proyectos;

        if (userRole === 'ADMIN') {
            proyectos = await proyectosService.getDetailedProyectos();
        } else {
            proyectos = await proyectosService.getAssignedDetailedProyectos(userId);
        }

        res.json(proyectos);
    } catch (err) {
        console.error('Error al obtener proyectos asignados detallados:', err);
        res.status(500).json({ error: 'Error al obtener proyectos asignados detallados', details: err.message });
    }
});

// Lista simple (sin cambios, si se mantiene)
app.get('/api/proyectos', authenticateToken, async (req, res) => {
    try {
        const proyectos = await proyectosService.getSimpleProyectos();
        res.json(proyectos);
    } catch (err) {
        console.error('Error al obtener proyectos:', err);
        res.status(500).json({ error: 'Error al obtener proyectos', details: err.message });
    }
});

// Obtener un proyecto por ID
app.get('/api/proyectos/:id', authenticateToken, async (req, res) => {
    try {
        const proyecto = await proyectosService.getProyectoById(req.params.id);
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json(proyecto);
    } catch (err) {
        console.error(`Error al obtener proyecto ${req.params.id}:`, err);
        res.status(500).json({ error: 'Error al obtener proyecto', details: err.message });
    }
});

// Crear un proyecto completo con su tramo inicial y progresivas en una sola transacción
app.post('/api/proyectos/create-full', authenticateToken, async (req, res) => {
    const { projectData, progresivaData } = req.body;
    const actorId = req.user.id; // Obtener el ID del usuario autenticado

    if (!projectData || !progresivaData) {
        return res.status(400).json({ error: 'Faltan datos del proyecto o del tramo.' });
    }

    try {
        const result = await proyectosService.createProyectoAndProgresiva(projectData, progresivaData, actorId);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error en la transacción de crear proyecto completo:', err);
        res.status(500).json({ error: 'Error al crear el proyecto completo', details: err.message });
    }
});
// Actualizar un proyecto existente
app.get('/api/proyectos/:id/estadisticas', authenticateToken, async (req, res) => {
    try {
        const stats = await proyectosService.getProjectStatistics(req.params.id);
        res.json(stats);
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas del proyecto.' });
    }
});

app.put('/api/proyectos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { projectData, progresivaData, calibrationData } = req.body;
    try {
        const result = await proyectosService.updateProyecto(id, projectData, progresivaData, calibrationData);
        res.json(result);
    } catch (err) {
        console.error(`Error al actualizar el proyecto ${id}:`, err);
        res.status(500).json({ error: 'Error al actualizar el proyecto', details: err.message });
    }
});

// Eliminar un proyecto existente
app.delete('/api/proyectos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await proyectosService.deleteProyecto(id);
        if (rowCount === 0) {
            return res.status(404).json({ mensaje: 'Proyecto no encontrado para eliminar' });
        }
        res.status(204).send(); // No content
    } catch (err) {
        console.error(`Error al eliminar el proyecto ${id}:`, err);
        res.status(500).json({ error: 'Error al eliminar el proyecto', details: err.message });
    }
});


app.get('/api/proyectos/:proyectoId/tramos', authenticateToken, async (req, res) => {
    const { proyectoId } = req.params;
    try {
        const tramos = await progresivasService.getParentProgresivasByProyectoId(proyectoId);
        res.json(tramos);
    } catch (err) {
        console.error(`Error al obtener tramos para el proyecto ${proyectoId}:`, err);
        res.status(500).json({ error: 'Error al obtener tramos por proyecto', details: err.message });
    }
});

// Rutas para la asignación de usuarios a proyectos
// API: Asignar un usuario a un proyecto
app.post('/api/proyectos/:projectId/assignUser', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, rolProyecto } = req.body;
        const actorId = req.user.id; // Obtener el ID del usuario autenticado
        const assignment = await proyectosService.assignUserToProjectDb(parseInt(projectId), parseInt(userId), rolProyecto, actorId);
        res.status(201).json(assignment);
    } catch (error) {
        console.error('Error al asignar usuario a proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Eliminar usuario de un proyecto
app.delete('/api/proyectos/:projectId/removeUser/:userId', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const actorId = req.user.id; // Obtener el ID del usuario autenticado
        // El servicio espera (projectId, userId, actorId). Se eliminó rolProyecto que no estaba definido.
        const result = await proyectosService.removeUserFromProjectDb(parseInt(projectId), parseInt(userId), actorId);
        if (result) {
            res.status(200).json({ message: 'Usuario desasignado del proyecto correctamente.' });
        } else {
            res.status(404).json({ error: 'Asignación no encontrada.' });
        }
    } catch (error) {
        console.error('Error al desasignar usuario de proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Obtener miembros del equipo de un proyecto
app.get('/api/proyectos/:projectId/assignments', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const assignments = await proyectosService.getProjectAssignments(parseInt(projectId));
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error al obtener asignaciones del proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Obtener el historial de un proyecto
app.get('/api/proyectos/:projectId/history', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId } = req.params;
        const history = await proyectosService.getProjectHistory(parseInt(projectId));
        res.status(200).json(history);
    } catch (error) {
        console.error('Error al obtener historial del proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// NEW: Endpoint to upload a KML file for a project
app.post('/api/proyectos/:proyectoId/upload-kml', authenticateToken, authorizePermission('proyectos', 'edicion'), upload.single('kmlFile'), async (req, res) => {
    const { proyectoId } = req.params;
    const { file } = req; // Multer places the file here
    const userId = req.user.id;

    try {
        if (!file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo KML.' });
        }

        // Call the service function to handle KML processing and saving
        const result = await proyectosService.uploadKmlToProyecto(proyectoId, file, userId); // Pass userId
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al subir KML para el proyecto ${proyectoId}:`, error);
        // Custom error handling for service-level errors
        if (error.isCustomError) { // Assuming custom errors have an 'isCustomError' flag
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al subir KML.' });
    }
});

// --- KML Management for Projects ---
// GET the active KML for a project (optionally by section)
app.get('/api/proyectos/:id/kml', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { section } = req.query; // e.g. 'trafico', 'invvial'
    const isLegacyBlobUrl = (value) => {
        const normalized = String(value || '').toLowerCase();
        return normalized.includes('.blob.vercel-storage.com') || normalized.includes('public.blob.vercel-storage.com');
    };

    try {
        let result;
        if (section) {
            // First try the new section-aware table
            result = await db.query(
                `SELECT kml_url
                 FROM proyectos_secciones_kml
                 WHERE id_proyecto = $1 AND seccion = $2 AND NULLIF(kml_url, '') IS NOT NULL`,
                [id, section]
            );

            // Fallback for 'invvial' section if not found in the new table
            if (result.rows.length === 0 && section === 'invvial') {
                result = await db.query(
                    `SELECT COALESCE(NULLIF(i.kml_url, ''), NULLIF(p.url_kml, '')) AS kml_url
                     FROM proyectos p
                     LEFT JOIN invvial i ON i.id_proyecto = p.id
                     WHERE p.id = $1`,
                    [id]
                );
            }
        } else {
            // Legacy/default behavior with fallback to the project-level URL
            result = await db.query(
                `SELECT COALESCE(NULLIF(i.kml_url, ''), NULLIF(p.url_kml, '')) AS kml_url
                 FROM proyectos p
                 LEFT JOIN invvial i ON i.id_proyecto = p.id
                 WHERE p.id = $1`,
                [id]
            );
        }

        if (result.rows.length > 0 && result.rows[0].kml_url) {
            const currentUrl = result.rows[0].kml_url;

            if (isLegacyBlobUrl(currentUrl)) {
                console.warn(`[KML] Se detectó URL legacy de Vercel Blob para proyecto ${id} (${section || 'default'}). Se devolverá null para evitar cargas inválidas.`);
                res.json({ url: null, blockedLegacyUrl: true });
                return;
            }

            res.json({ url: currentUrl });
        } else {
            // Return 200 with null instead of 404 to avoid console errors in the map component
            res.json({ url: null });
        }
    } catch (error) {
        console.error(`Error getting KML for project ${id}:`, error);
        res.status(500).json({ error: 'Server error while fetching KML URL.' });
    }
});

// Update a project's KML URL (optionally by section)
app.post('/api/proyectos/:projectId/kml', authenticateToken, authorizePermission('proyectos', 'edicion'), async (req, res) => {
    const { projectId } = req.params;
    const { url, section } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'La URL del KML es requerida.' });
    }
    try {
        let result;
        const targetSection = section || 'invvial';

        // 1. Save to the section-aware table (Primary)
        result = await db.query(
            'INSERT INTO proyectos_secciones_kml (id_proyecto, seccion, kml_url) VALUES ($1, $2, $3) ON CONFLICT (id_proyecto, seccion) DO UPDATE SET kml_url = $3 RETURNING *',
            [projectId, targetSection, url]
        );

        // 2. Sync with legacy invvial table if section is invvial
        if (targetSection === 'invvial') {
            await db.query(
                'INSERT INTO invvial (id_proyecto, kml_url) VALUES ($1, $2) ON CONFLICT (id_proyecto) DO UPDATE SET kml_url = $2',
                [projectId, url]
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(`Error saving KML for project ${projectId} section ${section}:`, error);
        res.status(500).json({ error: 'Server error while saving KML URL.' });
    }
});

// NEW: Endpoint to upload KML file for a project

// NEW: Endpoint to get consolidated Map Data for Dashboard
app.get('/api/proyectos/:id/map-data', authenticateToken, async (req, res) => {
    try {
        const data = await proyectosService.getProjectMapData(req.params.id);
        res.json(data);
    } catch (error) {
        console.error('Error fetching map data:', error);
        res.status(500).json({ error: error.message });
    }
});

// NEW: Endpoint to get Project Statistics (Ensuring it exists)

// DELETE the KML for a project (section-aware)
app.delete('/api/proyectos/:id/kml', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { section } = req.query;
    const targetSection = section || 'invvial';

    try {
        // 1. Get the URL of the KML to delete it from the active storage backend.
        let getUrlResult;
        if (targetSection === 'invvial') {
            getUrlResult = await db.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [id]);
        } else {
            getUrlResult = await db.query('SELECT kml_url FROM proyectos_secciones_kml WHERE id_proyecto = $1 AND seccion = $2', [id, targetSection]);
        }

        if (getUrlResult.rows.length > 0) {
            const { kml_url } = getUrlResult.rows[0];

            // Delete from NAS when the URL belongs to the public NAS base.
            // Legacy Vercel URLs are ignored here; the DB reference is removed below.
            if (kml_url) {
                try {
                    await deleteFileFromNAS(kml_url);
                } catch (storageErr) {
                    console.warn(`Could not delete KML from active storage ${kml_url}: ${storageErr.message}`);
                }
            }

            // 2. Delete the row from the appropriate table(s)
            if (targetSection === 'invvial') {
                await db.query('DELETE FROM invvial WHERE id_proyecto = $1', [id]);
            }

            await db.query('DELETE FROM proyectos_secciones_kml WHERE id_proyecto = $1 AND seccion = $2', [id, targetSection]);

            res.status(204).send(); // Success, no content
        } else {
            res.status(404).json({ error: 'No KML found for this project to delete.' });
        }
    } catch (error) {
        console.error(`Error deleting KML for project ${id} section ${targetSection}:`, error);
        res.status(500).json({ error: 'Server error while deleting KML.' });
    }
});

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

// Endpoint para exportar proyectos a Excel (marcador de posición)
app.get('/api/proyectos/export', authenticateToken, async (req, res) => {
    try {
        const result = await proyectosService.exportProyectos();
        res.status(200).json(result);
    } catch (err) {
        console.error('Error al exportar proyectos:', err);
        res.status(500).json({ error: 'Error al exportar proyectos', details: err.message });
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

// --------------------- CANTERAS ---------------------
// --- NEW: Endpoints for Calibration Data ---
app.get('/api/proyectos/:id/calibracion', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const data = await proyectosService.getCalibracionByProyecto(id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/proyectos/:id/calibracion', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const calibracionData = req.body;
    try {
        const result = await proyectosService.saveCalibracionForProyecto(id, calibracionData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/proyectos/:id/calibracion', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await proyectosService.deleteCalibracionForProyecto(id);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/proyectos/:proyectoId/canteras', authenticateToken, async (req, res) => {
    const { proyectoId } = req.params;
    try {
        const canteras = await canterasService.getCanterasByProyectoId(proyectoId);
        res.json(canteras);
    } catch (err) {
        console.error(`Error al obtener canteras para el proyecto ${proyectoId}:`, err);
        res.status(500).json({ error: 'Error al obtener canteras', details: err.message });
    }
});

// Ruta para subir una imagen y asociarla a una cantera
app.post('/api/canteras/upload-image', authenticateToken, upload.single('imagen_cantera'), async (req, res) => {
    const { canteraId, descripcion } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }
    if (!canteraId) {
        return res.status(400).json({ error: 'El ID de la cantera es requerido.' });
    }
    try {
        const imageUrl = await canterasService.uploadImage(req.file, req.user.id);
        const nuevaImagen = await canterasService.addImagenToCantera(canteraId, imageUrl, descripcion, req.file.originalname);
        res.status(201).json(nuevaImagen);
    } catch (error) {
        console.error('Error al subir y asociar la imagen de la cantera:', error);
        res.status(500).json({ error: 'Error al procesar la subida de la imagen.', details: error.message });
    }
});

// Ruta para subida masiva (ZIP o Múltiples Imágenes)
app.post('/api/canteras/:canteraId/upload-bulk', authenticateToken, upload.array('files'), async (req, res) => {
    const { canteraId } = req.params;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se subieron archivos.' });
    }
    try {
        const results = await canterasService.uploadBulkImages(req.files, canteraId, req.user.id);
        res.status(201).json({ status: 'ok', uploaded: results.length, images: results });
    } catch (error) {
        console.error('Error al subir imágenes masivas:', error);
        res.status(500).json({ error: 'Error al procesar subida masiva', details: error.message });
    }
});

// Ruta para eliminar una imagen de una cantera
app.delete('/api/canteras/imagenes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await canterasService.deleteImagen(id);
        res.status(200).json({ status: 'ok', message: 'Imagen eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar la imagen de la cantera:', error);
        res.status(500).json({ error: 'Error al eliminar la imagen.' });
    }
});

// Ruta para eliminación masiva de imágenes
app.post('/api/canteras/imagenes/bulk-delete', authenticateToken, async (req, res) => {
    const { imageIds } = req.body;
    if (!imageIds || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de imágenes.' });
    }
    try {
        const result = await canterasService.deleteBulkImagenes(imageIds);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar imágenes masivas:', error);
        res.status(500).json({ error: 'Error al eliminar imágenes.' });
    }
});

// --------------------- CANTERAS (Existing routes) ---------------------
app.post('/api/canteras', authenticateToken, async (req, res) => {
    try {
        const canteraData = req.body;
        const userId = req.user.id;
        if (!canteraData) {
            console.error('Error: req.body (canteraData) está vacío o es undefined.');
            return res.status(400).json({ error: 'No se recibieron datos de la cantera.' });
        }
        console.log('DEBUG: /api/canteras - Recibido req.body:', JSON.stringify(canteraData, null, 2));
        const nuevaCantera = await canterasService.createCantera(canteraData, userId);
        res.status(201).json(nuevaCantera);
    } catch (error) {
        console.error('Error al crear cantera en index.js:', error.stack); // Loguear el stack completo
        res.status(500).json({ error: 'Error al crear la cantera', details: error.message });
    }
});

// NEW: CREATE Cantera

// NEW: UPDATE Cantera
app.put('/api/canteras/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedCantera = await canterasService.updateCantera(id, req.body);
        res.json(updatedCantera);
    } catch (error) {
        console.error(`Error al actualizar cantera ${id}:`, error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar la cantera.', details: error.message });
    }
});

app.get('/api/canteras/:canteraId/details', authenticateToken, async (req, res) => {
    const { canteraId } = req.params;
    try {
        const details = await canterasService.getCanteraDetailsById(canteraId);
        if (details) {
            res.json(details);
        } else {
            res.status(404).json({ error: 'Cantera no encontrada' });
        }
    } catch (err) {
        console.error(`Error al obtener detalles para la cantera ${canteraId}:`, err);
        res.status(500).json({ error: 'Error al obtener detalles de la cantera', details: err.message });
    }
});

// NEW: DELETE Cantera
app.delete('/api/canteras/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await canterasService.deleteCantera(id);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Cantera no encontrada para eliminar.' });
        }
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Error al eliminar cantera ${id}:`, error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar la cantera.', details: error.message });
    }
});

// Rutas para la gestión de estratos de canteras
app.post('/api/canteras/:canteraId/estratos', authenticateToken, async (req, res) => {
    const { canteraId } = req.params;
    try {
        const nuevoEstrato = await canterasService.createCanteraEstrato(parseInt(canteraId), req.body);
        res.status(201).json(nuevoEstrato);
    } catch (err) {
        console.error('Error al crear estrato de cantera:', err);
        res.status(500).json({ error: 'Error al crear el estrato de la cantera', details: err.message });
    }
});

app.put('/api/canteras/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        const updatedEstrato = await canterasService.updateCanteraEstrato(parseInt(estratoId), req.body);
        res.status(200).json(updatedEstrato);
    } catch (err) {
        console.error('Error al actualizar estrato de cantera:', err);
        res.status(500).json({ error: 'Error al actualizar el estrato de la cantera', details: err.message });
    }
});

app.delete('/api/canteras/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        await canterasService.deleteCanteraEstrato(parseInt(estratoId));
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar estrato de cantera:', err);
        res.status(500).json({ error: 'Error al eliminar el estrato de la cantera', details: err.message });
    }
});

app.get('/api/tramos/:tramoId/canteras', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    try {
        const canteras = await canterasService.getCanterasByTramoId(tramoId);
        res.json(canteras);
    } catch (err) {
        console.error(`Error al obtener canteras para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener canteras por tramo', details: err.message });
    }
});

// NEW: Endpoint to upload and associate a KML file with a cantera
app.post('/api/canteras/:id/kml', authenticateToken, async (req, res) => {
    const { id: canteraId } = req.params;
    const { kmlContent } = req.body; // Expect KML content directly in body
    const userId = req.user.id;
    try {
        if (!kmlContent) {
            return res.status(400).json({ error: 'No se proporcionó contenido KML.' });
        }
        // 1. Create the KML record in kml_trazados table
        const kmlTrazado = await kmlService.createKmlTrazado(kmlContent, userId);

        // 2. Associate the new KML ID with the cantera
        const updatedCantera = await canterasService.asociarKml(canteraId, kmlTrazado.id);
        res.status(200).json({
            status: 'ok',
            message: 'KML cargado y asociado a la cantera correctamente.',
            cantera: updatedCantera
        });
    } catch (error) {
        console.error(`Error al subir KML para la cantera ${canteraId}:`, error);
        if (error.isCustomError) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al subir KML para la cantera.' });
    }
});

// --------------------- FUENTES DE AGUA ---------------------
app.get('/api/tramos/:tramoId/fuentes-agua', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    try {
        const fuentes = await fuentesAguaService.getFuentesAguaByTramoId(tramoId);
        res.json(fuentes);
    } catch (err) {
        console.error(`Error al obtener fuentes de agua para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener fuentes de agua por tramo', details: err.message });
    }
});

app.post('/api/fuentes-agua', authenticateToken, async (req, res) => {
    try {
        const fuenteData = req.body;
        const userId = req.user.id;
        if (!fuenteData) {
            return res.status(400).json({ error: 'No se recibieron datos de la fuente de agua.' });
        }
        const nuevaFuente = await fuentesAguaService.createFuenteAgua(fuenteData, userId);
        res.status(201).json(nuevaFuente);
    } catch (error) {
        console.error('Error al crear fuente de agua:', error);
        res.status(500).json({ error: 'Error al crear la fuente de agua', details: error.message });
    }
});

app.put('/api/fuentes-agua/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await fuentesAguaService.updateFuenteAgua(id, req.body);
        res.json(updated);
    } catch (error) {
        console.error(`Error al actualizar fuente de agua ${id}:`, error);
        res.status(500).json({ error: 'Error al actualizar la fuente de agua.', details: error.message });
    }
});

app.get('/api/fuentes-agua/:fuenteId/details', authenticateToken, async (req, res) => {
    const { fuenteId } = req.params;
    try {
        const details = await fuentesAguaService.getFuenteDetailsById(fuenteId);
        if (details) {
            res.json(details);
        } else {
            res.status(404).json({ error: 'Fuente de agua no encontrada' });
        }
    } catch (err) {
        console.error(`Error al obtener detalles para la fuente de agua ${fuenteId}:`, err);
        res.status(500).json({ error: 'Error al obtener detalles de la fuente de agua', details: err.message });
    }
});

app.delete('/api/fuentes-agua/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await fuentesAguaService.deleteFuenteAgua(id);
        res.status(204).send();
    } catch (error) {
        console.error(`Error al eliminar fuente de agua ${id}:`, error);
        res.status(500).json({ error: 'Error al eliminar la fuente de agua.', details: error.message });
    }
});

app.post('/api/fuentes-agua/:fuenteId/upload-bulk', authenticateToken, upload.array('files'), async (req, res) => {
    const { fuenteId } = req.params;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se subieron archivos.' });
    }
    try {
        const results = await fuentesAguaService.uploadBulkImages(req.files, fuenteId, req.user.id);
        res.status(201).json({ status: 'ok', uploaded: results.length, images: results });
    } catch (error) {
        console.error('Error al subir imágenes masivas de fuente de agua:', error);
        res.status(500).json({ error: 'Error al procesar subida masiva', details: error.message });
    }
});

app.delete('/api/fuentes-agua/imagenes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await fuentesAguaService.deleteImagen(id);
        res.status(200).json({ status: 'ok', message: 'Imagen eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar la imagen de la fuente de agua:', error);
        res.status(500).json({ error: 'Error al eliminar la imagen.' });
    }
});

app.post('/api/fuentes-agua/imagenes/bulk-delete', authenticateToken, async (req, res) => {
    const { imageIds } = req.body;
    if (!imageIds || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de imágenes.' });
    }
    try {
        const result = await fuentesAguaService.deleteBulkImagenes(imageIds);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar imágenes masivas de fuente de agua:', error);
        res.status(500).json({ error: 'Error al eliminar imágenes.' });
    }
});

app.post('/api/fuentes-agua/:fuenteId/estratos', authenticateToken, async (req, res) => {
    const { fuenteId } = req.params;
    try {
        const nuevoEstrato = await fuentesAguaService.createFuenteEstrato(parseInt(fuenteId), req.body);
        res.status(201).json(nuevoEstrato);
    } catch (err) {
        console.error('Error al crear muestra de fuente de agua:', err);
        res.status(500).json({ error: 'Error al crear la muestra de la fuente de agua', details: err.message });
    }
});

app.put('/api/fuentes-agua/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        const updatedEstrato = await fuentesAguaService.updateFuenteEstrato(parseInt(estratoId), req.body);
        res.status(200).json(updatedEstrato);
    } catch (err) {
        console.error('Error al actualizar muestra de fuente de agua:', err);
        res.status(500).json({ error: 'Error al actualizar la muestra de la fuente de agua', details: err.message });
    }
});

app.delete('/api/fuentes-agua/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        await fuentesAguaService.deleteFuenteEstrato(parseInt(estratoId));
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar muestra de fuente de agua:', err);
        res.status(500).json({ error: 'Error al eliminar la muestra de la fuente de agua', details: err.message });
    }
});

// NEW: Get a single tramo by ID (using progresivasService as tramos are parent progresivas)
app.get('/api/tramos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const tramo = await progresivasService.getProgresivaById(id);
        if (!tramo) {
            return res.status(404).json({ error: 'Tramo no encontrado' });
        }
        res.json(tramo);
    } catch (err) {
        console.error(`Error al obtener tramo por ID ${id}:`, err);
        res.status(500).json({ error: 'Error al obtener tramo por ID', details: err.message });
    }
});

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

// NEW: Export assays by tramo to Excel
app.get('/api/tramos/:tramoId/ensayos/export-excel', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    try {
        const fileBuffer = await ensayosService.exportEnsayosToExcelByTramo(tramoId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="ensayos_tramo_${tramoId}.xlsx"`);
        res.send(fileBuffer);
    } catch (err) {
        console.error(`Error al exportar ensayos para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al exportar ensayos a Excel', details: err.message });
    }
});

// NEW: Export assays by tramo AND type to Excel
app.get('/api/tramos/:tramoId/ensayos/export-excel/:tipoEnsayoId', authenticateToken, async (req, res) => {
    const { tramoId, tipoEnsayoId } = req.params;
    try {
        const fileBuffer = await ensayosService.exportEnsayosToExcelByTipo(tramoId, tipoEnsayoId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="ensayos_tramo_${tramoId}_tipo_${tipoEnsayoId}.xlsx"`);
        res.send(fileBuffer);
    } catch (err) {
        console.error(`Error al exportar ensayos para el tramo ${tramoId} y tipo ${tipoEnsayoId}:`, err);
        res.status(500).json({ error: 'Error al exportar ensayos a Excel por tipo', details: err.message });
    }
});

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

// --------------------- ZONAS CRITICAS ---------------------
app.get('/api/zonas-criticas/by-project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await zonasCriticasService.getAllZonasCriticas(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error getting zonas criticas:', err);
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/zonas-criticas', authenticateToken, async (req, res) => {
    try {
        const newZona = await zonasCriticasService.createZonaCritica(req.body);
        res.status(201).json(newZona);
    } catch (err) {
        console.error('Error creating zona critica:', err);
        res.status(500).json({ error: err.message });
    }
});


app.delete('/api/zonas-criticas/project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await zonasCriticasService.deleteExcelAndZonasCriticas(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error deleting zonas criticas:', err);
        res.status(500).json({ error: err.message });
    }
});

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

// ALCANTARILLAS
app.delete('/api/alcantarillas/:id', authenticateToken, async (req, res) => {
    try {
        await alcantarillasService.deleteAlcantarilla(req.params.id);
        res.json({ message: 'Eliminado correctamente' });
    } catch (err) {
        console.error(`Error deleting alcantarilla ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

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

// --- GEOLOGÍA CAPAS (KML/KMZ/Shapefiles RAR/ZIP) ---
const sanitizeGeologiaStorageSegment = (value) => String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const getGeologiaStorageFolder = (proyectoId, bucketName) => {
    const safeBucket = sanitizeGeologiaStorageSegment(bucketName) || 'otros';
    return `geologia/${proyectoId}/${safeBucket}`;
};

const ensureGeologiaCapasDriveUrlColumn = async () => {
    await db.query('ALTER TABLE geologia_capas ADD COLUMN IF NOT EXISTS drive_url TEXT;');
};

app.post('/api/proyectos/:id/geologia-capas', authenticateToken, authorizeGeologyManage, upload.single('archivo'), async (req, res) => {
    try {
        await ensureGeologiaCapasDriveUrlColumn();
        const proyectoId = parseInt(req.params.id);
        const tabName = String(req.body.tabName || '').trim();
        const file = req.file;

        if (!file || !tabName) return res.status(400).json({ status: 'error', message: 'Faltan datos' });

        console.log(`📂 [Geología] Iniciando subida para pID: ${proyectoId}, Tab: ${tabName}, Archivo: ${file.originalname} (${file.size} bytes)`);

        const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        const remoteFilename = `${Date.now()}_${cleanFilename}`;
        const targetFolder = getGeologiaStorageFolder(proyectoId, tabName);
        const storagePath = `${targetFolder}/${remoteFilename}`;
        let fileUrl;

        try {
            if (true) {
                console.log(`🗄️ [Geología] Subiendo archivo al NAS: ${storagePath}`);
                fileUrl = await uploadFileToNAS(file.buffer, targetFolder, remoteFilename);
                console.log(`✅ [Geología] Subido al NAS: ${fileUrl}`);
            } else {
                console.log(`☁️ [Geología] Intentando subir a Vercel Blob: ${storagePath}`);
                const blob = await put(storagePath, file.buffer, {
                    access: 'public',
                    token: process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA || process.env.BLOB_READ_WRITE_TOKEN
                });
                fileUrl = blob.url;
                console.log(`✅ [Geología] Subido a Vercel Blob: ${fileUrl}`);
            }
        } catch (storageErr) {
            const storageName = 'NAS';
            console.error(`❌ [Geología] Error al subir a ${storageName}:`, storageErr);
            throw new Error(`Falla en ${storageName}: ${storageErr.message}`);
        }

        let geojsonData = null;
        const ext = path.extname(file.originalname).toLowerCase();

        // If it's a RAR or ZIP (shapefile archive), send to Python worker for conversion
        if (ext === '.rar' || ext === '.zip') {
            try {
                console.log(`📦 [Geología] Enviando archivo ${ext} al Python worker...`);
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('file', file.buffer, { filename: file.originalname });

                const pythonRes = await axios.post('http://127.0.0.1:8000/convert-shapefile', formData, {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 300000 // 5 min timeout
                });

                if (pythonRes.data && pythonRes.data.status === 'ok' && pythonRes.data.geojson) {
                    geojsonData = pythonRes.data.geojson;
                    console.log(`✅ [Geología] Python worker convirtió exitosamente el ${ext}.`);
                } else {
                    console.error('❌ [Geología] Mala respuesta del Python worker:', pythonRes.data);
                    throw new Error(`Respuesta de Python inválida: ${JSON.stringify(pythonRes.data)}`);
                }
            } catch (pyErr) {
                console.error('❌ [Geología] Error en el Python worker:', pyErr.message);
                const pyErrMsg = pyErr.response ? JSON.stringify(pyErr.response.data) : pyErr.message;
                throw new Error(`Worker Python falló: ${pyErrMsg}`);
            }
        } else if (ext === '.kml' || ext === '.kmz') {
            try {
                console.log(`📍 [Geología] Procesando archivo ${ext} localmente...`);
                const { kml } = require('@tmcw/togeojson');
                const DOMParser = require('xmldom').DOMParser;
                let kmlText = '';

                if (ext === '.kmz') {
                    const AdmZip = require('adm-zip');
                    const zip = new AdmZip(file.buffer);
                    const zipEntries = zip.getEntries();
                    const kmlEntry = zipEntries.find(entry => entry.entryName.toLowerCase().endsWith('.kml'));
                    if (!kmlEntry) throw new Error('No se encontró ningún .kml en el .kmz');
                    kmlText = zip.readAsText(kmlEntry);
                } else {
                    kmlText = file.buffer.toString('utf-8');
                }

                const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
                const { injectFoldersToGeoJSON } = require('./utils/kmlFolderInjector');
                geojsonData = kml(doc);
                geojsonData = injectFoldersToGeoJSON(kmlText, geojsonData);

                if (geojsonData && geojsonData.features) {
                    let defaultLayerName = cleanFilename.replace('.kmz', '').replace('.kml', '').replace(/^[0-9]+_/, '');
                    geojsonData.features.forEach(f => {
                        if (!f.properties) f.properties = {};
                        f.properties._layer_name = f.properties.folder || f.properties.type || defaultLayerName;
                    });
                }
                console.log(`✅ [Geología] KML/KMZ procesado localmente.`);
            } catch (kmlErr) {
                console.error('❌ [Geología] Error procesando KML/KMZ:', kmlErr);
                throw new Error(`Procesamiento local falló: ${kmlErr.message}`);
            }
        }

        // Save to database (with geojson_data if available)
        console.log(`💾 [Geología] Intentando guardar en DB...`);
        const query = `
            INSERT INTO geologia_capas (proyecto_id, tab_name, file_url, file_name, geojson_data)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (proyecto_id, tab_name) DO UPDATE 
            SET file_url = EXCLUDED.file_url, file_name = EXCLUDED.file_name, 
                geojson_data = EXCLUDED.geojson_data, uploaded_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const dbResult = await db.query(query, [proyectoId, tabName, fileUrl, file.originalname, geojsonData ? JSON.stringify(geojsonData) : null]);
        console.log(`✅ [Geología] Guardado exitosamente en ID: ${dbResult.rows[0]?.id}`);
        res.status(200).json({ status: 'success', data: dbResult.rows[0] });
    } catch (err) {
        console.error('❌ [Geología] Error Final:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

const ensureDisenoGeometricoCapasTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS diseno_geometrico_capas (
            id SERIAL PRIMARY KEY,
            proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
            tab_name VARCHAR(100) NOT NULL,
            file_url TEXT NOT NULL DEFAULT '',
            file_name VARCHAR(255) NOT NULL DEFAULT '',
            drive_url TEXT,
            geojson_data JSONB,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (proyecto_id, tab_name)
        );
    `);

    await db.query('ALTER TABLE diseno_geometrico_capas ADD COLUMN IF NOT EXISTS drive_url TEXT;');
    await db.query('ALTER TABLE diseno_geometrico_capas ADD COLUMN IF NOT EXISTS geojson_data JSONB;');
    await db.query('ALTER TABLE diseno_geometrico_capas ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;');
    await db.query("ALTER TABLE diseno_geometrico_capas ALTER COLUMN file_url SET DEFAULT '';");
    await db.query("ALTER TABLE diseno_geometrico_capas ALTER COLUMN file_name SET DEFAULT '';");
};

const ensureFeatureCollection = (value) => {
    if (!value || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
        return { type: 'FeatureCollection', features: [] };
    }

    return value;
};

const DG_COORDINATE_PRECISION = 6;
const DG_GEOJSON_WARN_BYTES = 12 * 1024 * 1024;
const DG_GEOJSON_MAX_BYTES = 20 * 1024 * 1024;

const roundCoordinateValue = (value) => {
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(DG_COORDINATE_PRECISION));
};

const reducePointSequence = (points, maxPoints, closeRing = false) => {
    if (!Array.isArray(points) || points.length <= maxPoints) return points;

    const stride = Math.ceil(points.length / maxPoints);
    const reduced = points.filter((_, index) => index === 0 || index === points.length - 1 || index % stride === 0);

    if (closeRing && reduced.length > 2) {
        const firstPoint = JSON.stringify(reduced[0]);
        const lastPoint = JSON.stringify(reduced[reduced.length - 1]);
        if (firstPoint !== lastPoint) {
            reduced.push(reduced[0]);
        }
    }

    return reduced;
};

const compactCoordinates = (coordinates, geometryType) => {
    if (!Array.isArray(coordinates)) return coordinates;

    if (geometryType === 'Point') {
        const point = coordinates
            .slice(0, 3)
            .map((value) => roundCoordinateValue(Number(value)));

        return point.length >= 2 && point[0] !== null && point[1] !== null ? point : null;
    }

    if (geometryType === 'MultiPoint' || geometryType === 'LineString') {
        return reducePointSequence(
            coordinates
                .map((point) => compactCoordinates(point, 'Point'))
                .filter(Boolean),
            geometryType === 'LineString' ? 5000 : 8000
        );
    }

    if (geometryType === 'MultiLineString') {
        return coordinates
            .map((line) => compactCoordinates(line, 'LineString'))
            .filter((line) => Array.isArray(line) && line.length >= 2);
    }

    if (geometryType === 'Polygon') {
        return coordinates
            .map((ring) => reducePointSequence(
                ring
                    .map((point) => compactCoordinates(point, 'Point'))
                    .filter(Boolean),
                4000,
                true
            ))
            .filter((ring) => Array.isArray(ring) && ring.length >= 4);
    }

    if (geometryType === 'MultiPolygon') {
        return coordinates
            .map((polygon) => compactCoordinates(polygon, 'Polygon'))
            .filter((polygon) => Array.isArray(polygon) && polygon.length > 0);
    }

    return coordinates;
};

const compactFeatureForStorage = (feature) => {
    if (!feature || feature.type !== 'Feature') return null;

    const geometryType = feature.geometry?.type;
    if (!geometryType) return null;

    const compactedCoordinates = compactCoordinates(feature.geometry.coordinates, geometryType);
    if (!compactedCoordinates) return null;

    return {
        type: 'Feature',
        properties: feature.properties || {},
        geometry: {
            type: geometryType,
            coordinates: compactedCoordinates
        }
    };
};

const compactGeojsonForStorage = (geojsonData) => {
    const normalized = ensureFeatureCollection(geojsonData);

    return {
        type: 'FeatureCollection',
        features: normalized.features
            .map((feature) => compactFeatureForStorage(feature))
            .filter(Boolean)
    };
};

const applyDenseLayerStyling = (featureCollection) => {
    const normalized = ensureFeatureCollection(featureCollection);

    return {
        ...normalized,
        dg_meta: {
            ...(normalized.dg_meta || {}),
            denseVisualMode: true
        },
        features: normalized.features.map((feature) => {
            const geometryType = feature?.geometry?.type || '';
            const properties = { ...(feature?.properties || {}) };

            if (geometryType.includes('Point')) {
                properties.dg_marker_size = 8;
            } else if (geometryType.includes('Line')) {
                properties['stroke-width'] = Math.min(Number(properties['stroke-width']) || 4, 1);
                properties['stroke-opacity'] = Math.min(Number(properties['stroke-opacity'] ?? 1), 0.45);
            } else if (geometryType.includes('Polygon')) {
                properties['stroke-width'] = Math.min(Number(properties['stroke-width']) || 3, 1);
                properties['stroke-opacity'] = Math.min(Number(properties['stroke-opacity'] ?? 1), 0.35);
                properties['fill-opacity'] = Math.min(Number(properties['fill-opacity'] ?? 0.35), 0.08);
            }

            return {
                ...feature,
                properties
            };
        })
    };
};

const splitFeatureCollectionBySize = (featureCollection, maxBytes) => {
    const normalized = ensureFeatureCollection(featureCollection);
    const features = normalized.features || [];
    const prefix = '{"type":"FeatureCollection","features":[';
    const suffix = ']}';
    const prefixBytes = Buffer.byteLength(prefix, 'utf8');
    const suffixBytes = Buffer.byteLength(suffix, 'utf8');

    const chunks = [];
    let currentFeatures = [];
    let currentBytes = prefixBytes + suffixBytes;

    for (const feature of features) {
        const featureString = JSON.stringify(feature);
        const featureBytes = Buffer.byteLength(featureString, 'utf8');
        const separatorBytes = currentFeatures.length > 0 ? 1 : 0;

        if (prefixBytes + suffixBytes + featureBytes > maxBytes) {
            return {
                chunks: [],
                oversizedFeature: true
            };
        }

        if (currentBytes + separatorBytes + featureBytes > maxBytes && currentFeatures.length > 0) {
            chunks.push({
                type: 'FeatureCollection',
                features: currentFeatures
            });
            currentFeatures = [feature];
            currentBytes = prefixBytes + suffixBytes + featureBytes;
            continue;
        }

        currentFeatures.push(feature);
        currentBytes += separatorBytes + featureBytes;
    }

    if (currentFeatures.length > 0 || chunks.length === 0) {
        chunks.push({
            type: 'FeatureCollection',
            features: currentFeatures
        });
    }

    return {
        chunks,
        oversizedFeature: false
    };
};

app.post('/api/proyectos/:id/diseno-geometrico-capas/blank', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const tabName = String(req.body?.tabName || '').trim();
        const displayName = String(req.body?.displayName || '').trim();

        if (!proyectoId || !tabName) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos para crear la capa vacia' });
        }

        const result = await db.query(`
            INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, file_url, file_name, geojson_data)
            VALUES ($1, $2, '', $3, $4)
            RETURNING *;
        `, [
            proyectoId,
            tabName,
            displayName || tabName,
            JSON.stringify({ type: 'FeatureCollection', features: [] })
        ]);

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico POST /blank:', err);
        if (err.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'Ya existe una capa con ese nombre' });
        }
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/proyectos/:id/diseno-geometrico-capas', authenticateToken, authorizeDisenoGeometricoManage, upload.single('archivo'), async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const tabName = String(req.body.tabName || '').trim();
        const displayName = String(req.body.displayName || '').trim();
        const file = req.file;

        if (!file || !tabName) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos para registrar la capa' });
        }

        const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        const filename = `diseno-geometrico/${proyectoId}/${tabName}/${Date.now()}_${cleanFilename}`;

        const blob = await put(filename, file.buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA || process.env.BLOB_READ_WRITE_TOKEN
        });

        let geojsonData = null;
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.rar' || ext === '.zip') {
            try {
                const formData = new FormData();
                formData.append('file', file.buffer, { filename: file.originalname });

                const pythonRes = await axios.post('http://127.0.0.1:8000/convert-shapefile', formData, {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 300000
                });

                if (pythonRes.data?.status === 'ok' && pythonRes.data?.geojson) {
                    geojsonData = pythonRes.data.geojson;
                } else {
                    throw new Error(`Respuesta invalida del conversor de shapefiles: ${JSON.stringify(pythonRes.data)}`);
                }
            } catch (pythonError) {
                const workerStatus = pythonError.response?.status || 502;
                const workerDetail = pythonError.response?.data?.detail
                    || pythonError.response?.data?.message
                    || pythonError.message;
                return res.status(workerStatus).json({
                    status: 'error',
                    message: `No se pudo procesar el shapefile: ${workerDetail}`
                });
            }
        } else if (ext === '.kml' || ext === '.kmz') {
            let kmlText = '';

            if (ext === '.kmz') {
                const zip = new AdmZip(file.buffer);
                const zipEntries = zip.getEntries();
                const kmlEntry = zipEntries.find((entry) => entry.entryName.toLowerCase().endsWith('.kml'));

                if (!kmlEntry) {
                    throw new Error('No se encontro ningun archivo KML dentro del KMZ');
                }

                kmlText = zip.readAsText(kmlEntry);
            } else {
                kmlText = file.buffer.toString('utf-8');
            }

            const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
            const { injectFoldersToGeoJSON } = require('./utils/kmlFolderInjector');
            geojsonData = injectFoldersToGeoJSON(kmlText, kml(doc));

            if (geojsonData?.features) {
                const fallbackLayerName = displayName || cleanFilename.replace(/\.(kmz|kml)$/i, '').replace(/^[0-9]+_/, '');
                geojsonData.features.forEach((feature) => {
                    if (!feature.properties) feature.properties = {};
                    feature.properties._layer_name = feature.properties.folder || feature.properties.type || fallbackLayerName;
                });
            }
        }

        let geojsonPayload = null;
        let payloadCollections = [];
        if (geojsonData) {
            let compactedGeojson = compactGeojsonForStorage(geojsonData);
            geojsonPayload = JSON.stringify(compactedGeojson);
            let payloadBytes = Buffer.byteLength(geojsonPayload, 'utf8');

            console.log(`[Diseno Geometrico] GeoJSON compactado para ${file.originalname}: ${payloadBytes} bytes.`);

            if (payloadBytes > DG_GEOJSON_WARN_BYTES) {
                console.warn(`[Diseno Geometrico] GeoJSON grande detectado (${payloadBytes} bytes) para ${file.originalname}.`);
                compactedGeojson = applyDenseLayerStyling(compactedGeojson);
                geojsonPayload = JSON.stringify(compactedGeojson);
                payloadBytes = Buffer.byteLength(geojsonPayload, 'utf8');
            }

            if (payloadBytes > DG_GEOJSON_MAX_BYTES) {
                const splitResult = splitFeatureCollectionBySize(compactedGeojson, DG_GEOJSON_MAX_BYTES);

                if (splitResult.oversizedFeature || !splitResult.chunks.length) {
                    return res.status(413).json({
                        status: 'error',
                        message: 'La capa es demasiado pesada incluso despues de compactarla. Intenta simplificar el shapefile en origen.'
                    });
                }

                payloadCollections = splitResult.chunks;
                console.warn(`[Diseno Geometrico] La capa ${file.originalname} se dividira automaticamente en ${payloadCollections.length} partes.`);
            } else {
                payloadCollections = [compactedGeojson];
            }
        }

        const savedName = displayName || file.originalname;
        const savedLayers = [];

        await db.query('BEGIN');
        try {
            await db.query(`
                DELETE FROM diseno_geometrico_capas
                WHERE proyecto_id = $1
                  AND (tab_name = $2 OR tab_name LIKE $3);
            `, [proyectoId, tabName, `${tabName}__part_%`]);

            for (let index = 0; index < payloadCollections.length; index += 1) {
                const partNumber = index + 1;
                const layerTabName = index === 0 ? tabName : `${tabName}__part_${partNumber}`;
                const layerDisplayName = payloadCollections.length > 1
                    ? `${savedName} (Parte ${partNumber}/${payloadCollections.length})`
                    : savedName;
                const layerPayload = payloadCollections[index] ? JSON.stringify(payloadCollections[index]) : null;

                const layerResult = await db.query(`
                    INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, file_url, file_name, geojson_data)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *;
                `, [proyectoId, layerTabName, blob.url, layerDisplayName, layerPayload]);

                savedLayers.push(layerResult.rows[0]);
            }

            await db.query('COMMIT');
        } catch (dbError) {
            await db.query('ROLLBACK');
            throw dbError;
        }

        res.status(200).json({
            status: 'success',
            data: payloadCollections.length === 1 ? savedLayers[0] : savedLayers,
            split: payloadCollections.length > 1,
            parts: payloadCollections.length
        });
    } catch (err) {
        console.error('Error en Diseno Geometrico POST /capas:', err);
        if (String(err.message || '').includes('Connection terminated unexpectedly')) {
            return res.status(413).json({
                status: 'error',
                message: 'La capa convertida sigue siendo demasiado grande para guardarse. Intenta dividir el shapefile o reducir su detalle.'
            });
        }
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/proyectos/:id/diseno-geometrico-capas', authenticateToken, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const result = await db.query(`
            SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url
            FROM diseno_geometrico_capas
            WHERE proyecto_id = $1
            ORDER BY uploaded_at DESC, id DESC;
        `, [proyectoId]);

        res.status(200).json({ status: 'success', data: result.rows });
    } catch (err) {
        console.error('Error en Diseno Geometrico GET /capas:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/proyectos/:id/diseno-geometrico-capas/:tabName', authenticateToken, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const result = await db.query(`
            SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url
            FROM diseno_geometrico_capas
            WHERE proyecto_id = $1 AND tab_name = $2;
        `, [proyectoId, tabName]);

        res.status(200).json({ status: 'success', data: result.rows[0] || null });
    } catch (err) {
        console.error('Error en Diseno Geometrico GET /capas/:tabName:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.patch('/api/proyectos/:id/diseno-geometrico-capas/:tabName/rename', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const newName = String(req.body?.newName || '').trim();

        if (!newName) {
            return res.status(400).json({ status: 'error', message: 'Falta el nuevo nombre' });
        }

        const result = await db.query(`
            UPDATE diseno_geometrico_capas
            SET file_name = $1
            WHERE proyecto_id = $2 AND tab_name = $3
            RETURNING *;
        `, [newName, proyectoId, tabName]);

        if (!result.rowCount) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada' });
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico PATCH /rename:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.patch('/api/proyectos/:id/diseno-geometrico-capas/:tabName/drive-link', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const driveUrl = typeof req.body?.driveUrl === 'string' ? req.body.driveUrl.trim() || null : null;

        const result = await db.query(`
            INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, drive_url, file_name, file_url)
            VALUES ($1, $2, $3, 'CARPETA CONFIGURADA', '')
            ON CONFLICT (proyecto_id, tab_name) DO UPDATE
            SET drive_url = EXCLUDED.drive_url
            RETURNING *;
        `, [proyectoId, tabName, driveUrl]);

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico PATCH /drive-link:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.patch('/api/proyectos/:id/diseno-geometrico-capas/:tabName/geojson', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const fileName = String(req.body?.fileName || '').trim();
        const geojsonData = ensureFeatureCollection(req.body?.geojsonData);

        const result = await db.query(`
            UPDATE diseno_geometrico_capas
            SET geojson_data = $1,
                uploaded_at = CURRENT_TIMESTAMP,
                file_name = CASE
                    WHEN $2 <> '' THEN $2
                    ELSE file_name
                END
            WHERE proyecto_id = $3 AND tab_name = $4
            RETURNING *;
        `, [
            JSON.stringify(geojsonData),
            fileName,
            proyectoId,
            tabName
        ]);

        if (!result.rowCount) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para guardar' });
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico PATCH /geojson:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.delete('/api/proyectos/:id/diseno-geometrico-capas/:tabName', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const result = await db.query(`
            DELETE FROM diseno_geometrico_capas
            WHERE proyecto_id = $1 AND tab_name = $2
            RETURNING id;
        `, [proyectoId, tabName]);

        if (!result.rowCount) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para eliminar' });
        }

        res.status(200).json({ status: 'success', message: 'Capa eliminada correctamente' });
    } catch (err) {
        console.error('Error en Diseno Geometrico DELETE /capas/:tabName:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ==========================================
// VERSIONES DE DISEÑO GEOMÉTRICO
// ==========================================

const ensureDisenoGeometricoVersionesTables = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS diseno_geometrico_versiones (
            id SERIAL PRIMARY KEY,
            proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
            version_numero INTEGER NOT NULL,
            nombre VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (proyecto_id, version_numero)
        );
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS diseno_geometrico_version_capas (
            id SERIAL PRIMARY KEY,
            version_id INTEGER NOT NULL REFERENCES diseno_geometrico_versiones(id) ON DELETE CASCADE,
            tipo VARCHAR(50) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_url TEXT NOT NULL,
            geojson_data JSONB
        );
    `);
};

app.get('/api/proyectos/:id/diseno-geometrico-versiones', authenticateToken, async (req, res) => {
    try {
        await ensureDisenoGeometricoVersionesTables();
        const proyectoId = parseInt(req.params.id, 10);
        const result = await db.query(`
            SELECT v.id, v.version_numero, v.nombre, v.created_at,
                   json_agg(json_build_object('id', c.id, 'tipo', c.tipo, 'file_name', c.file_name, 'file_url', c.file_url, 'geojson_data', c.geojson_data)) as capas
            FROM diseno_geometrico_versiones v
            LEFT JOIN diseno_geometrico_version_capas c ON v.id = c.version_id
            WHERE v.proyecto_id = $1
            GROUP BY v.id
            ORDER BY v.version_numero DESC;
        `, [proyectoId]);
        
        const formattedData = result.rows.map(row => ({
            ...row,
            capas: row.capas.filter(c => c && c.id !== null)
        }));

        res.status(200).json({ status: 'success', data: formattedData });
    } catch (err) {
        console.error('Error GET versiones:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/proyectos/:id/diseno-geometrico-versiones', authenticateToken, authorizeDisenoGeometricoManage, upload.any(), async (req, res) => {
    let transactionStarted = false;
    try {
        await ensureDisenoGeometricoVersionesTables();
        const proyectoId = parseInt(req.params.id, 10);
        const nombre = String(req.body.nombre || '').trim();
        const files = req.files || [];
        
        const versionRes = await db.query(`SELECT COALESCE(MAX(version_numero), 0) + 1 as next_v FROM diseno_geometrico_versiones WHERE proyecto_id = $1`, [proyectoId]);
        const versionNumero = versionRes.rows[0].next_v;

        await db.query('BEGIN');
        transactionStarted = true;
        
        const insertVersionRes = await db.query(`
            INSERT INTO diseno_geometrico_versiones (proyecto_id, version_numero, nombre)
            VALUES ($1, $2, $3) RETURNING id;
        `, [proyectoId, versionNumero, nombre]);
        
        const versionId = insertVersionRes.rows[0].id;
        const AdmZip = require('adm-zip');
        const { DOMParser } = require('xmldom');
        const path = require('path');
        const FormData = require('form-data');
        const axios = require('axios');
        const { kml } = require('@tmcw/togeojson');
        
        await db.query(`DELETE FROM diseno_geometrico_capas WHERE proyecto_id = $1`, [proyectoId]);

        for (const file of files) {
            let tipo = 'EXTRA';
            if (file.fieldname.startsWith('file_eje')) tipo = 'EJE';
            else if (file.fieldname.startsWith('file_bordes')) tipo = 'BORDES';
            else if (file.fieldname.startsWith('file_corte')) tipo = 'CORTE';
            else if (file.fieldname.startsWith('file_progresivas')) tipo = 'PROGRESIVAS';
            else if (file.fieldname.startsWith('file_pis')) tipo = 'PIS';

            const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
            const filename = `diseno-geometrico/${proyectoId}/v${versionNumero}/${Date.now()}_${cleanFilename}`;

            const blob = await put(filename, file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA || process.env.BLOB_READ_WRITE_TOKEN
            });

            let geojsonData = null;
            const ext = path.extname(file.originalname).toLowerCase();
            
            if (ext === '.rar' || ext === '.zip') {
                const formData = new FormData();
                formData.append('file', file.buffer, { filename: file.originalname });
                try {
                    const pythonRes = await axios.post('http://127.0.0.1:8000/convert-shapefile', formData, {
                        headers: formData.getHeaders(),
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        timeout: 300000
                    });
                    if (pythonRes.data?.status === 'ok') geojsonData = pythonRes.data.geojson;
                } catch(e) { console.error('Error python worker version:', e.message); }
            } else if (ext === '.kml' || ext === '.kmz') {
                try {
                    let kmlText = '';
                    if (ext === '.kmz') {
                        const zip = new AdmZip(file.buffer);
                        const kmlEntry = zip.getEntries().find((entry) => entry.entryName.toLowerCase().endsWith('.kml'));
                        if (kmlEntry) kmlText = zip.readAsText(kmlEntry);
                    } else {
                        kmlText = file.buffer.toString('utf-8');
                    }
                    const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
                    const { injectFoldersToGeoJSON } = require('./utils/kmlFolderInjector');
                    geojsonData = injectFoldersToGeoJSON(kmlText, kml(doc));
                } catch(e) { console.error('Error parseando KML/KMZ:', e.message); }
            }
            
            if (geojsonData) {
                geojsonData = compactGeojsonForStorage(geojsonData);
            }

                await db.query(`
                INSERT INTO diseno_geometrico_version_capas (version_id, tipo, file_name, file_url, geojson_data)
                VALUES ($1, $2, $3, $4, $5);
            `, [versionId, tipo, file.originalname, blob.url, geojsonData ? JSON.stringify(geojsonData) : null]);

            await db.query(`
                INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, file_name, file_url, geojson_data)
                VALUES ($1, $2, $3, $4, $5);
            `, [proyectoId, `v_capa_${Date.now()}_${Math.floor(Math.random()*1000)}`, file.originalname, blob.url, geojsonData ? JSON.stringify(geojsonData) : null]);
        }
        
        await db.query('COMMIT');
        res.status(200).json({ status: 'success', message: 'Version creada con exito' });
    } catch (err) {
        if (transactionStarted) await db.query('ROLLBACK');
        console.error('Error POST versiones:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.delete('/api/proyectos/:id/diseno-geometrico-versiones/:versionId', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoVersionesTables();
        const { id, versionId } = req.params;
        const result = await db.query('DELETE FROM diseno_geometrico_versiones WHERE id = $1 AND proyecto_id = $2 RETURNING id;', [versionId, id]);
        if (!result.rowCount) return res.status(404).json({ status: 'error', message: 'Version no encontrada' });
        res.status(200).json({ status: 'success', message: 'Version eliminada' });
    } catch (err) {
        console.error('Error DELETE version:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/proyectos/:id/geologia-capas/:tabName', authenticateToken, async (req, res) => {
    try {
        const proyectoId = parseInt(req.params.id);
        const { tabName } = req.params;
        console.log(`🔍[GET] geologia - capas: Buscando proyectoId = ${proyectoId}, tabName = ${tabName} `);

        await ensureGeologiaCapasDriveUrlColumn();
        const query = 'SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url FROM geologia_capas WHERE proyecto_id = $1 AND tab_name = $2;';
        const result = await db.query(query, [proyectoId, tabName]);

        if (result.rows.length === 0) {
            console.warn(`⚠️[GET] geologia - capas: No se encontró registro para pID = ${proyectoId}, tab = ${tabName} `);
            return res.status(200).json({ status: 'success', data: null });
        }

        console.log(`✅[GET] geologia - capas: Encontrado ID = ${result.rows[0].id}, has_geojson = ${!!result.rows[0].geojson_data} `);
        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('❌ Error en GET /geologia-capas:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// NUEVA RUTA: Obtener TODAS las capas de geología de un proyecto (usada por Dashboard)
app.get('/api/proyectos/:id/geologia-capas', authenticateToken, async (req, res) => {
    try {
        const proyectoId = parseInt(req.params.id);
        console.log(`🔍[GET] Todas las geologia - capas: Buscando proyectoId = ${proyectoId}`);

        await ensureGeologiaCapasDriveUrlColumn();
        const query = 'SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url FROM geologia_capas WHERE proyecto_id = $1;';
        const result = await db.query(query, [proyectoId]);

        res.status(200).json({ status: 'success', data: result.rows });
    } catch (err) {
        console.error('❌ Error en GET todas /geologia-capas:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// NUEVA RUTA: Eliminar capa (DELETE)
app.delete('/api/proyectos/:id/geologia-capas/:tabName', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        const query = 'DELETE FROM geologia_capas WHERE proyecto_id = $1 AND tab_name = $2 RETURNING id;';
        const result = await db.query(query, [req.params.id, req.params.tabName]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para eliminar' });
        }

        res.status(200).json({ status: 'success', message: 'Capa eliminada correctamente' });
    } catch (err) {
        console.error('Error al eliminar capa:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// NUEVA RUTA: Renombrar capa (PATCH)
app.patch('/api/proyectos/:id/geologia-capas/:tabName/rename', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        await ensureGeologiaCapasDriveUrlColumn();
        const { id, tabName } = req.params;
        const { newName } = req.body;

        if (!newName) return res.status(400).json({ status: 'error', message: 'Falta el nuevo nombre' });

        const query = 'UPDATE geologia_capas SET file_name = $1 WHERE proyecto_id = $2 AND tab_name = $3 RETURNING *;';
        const result = await db.query(query, [newName, id, tabName]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para renombrar' });
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error al renombrar capa:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- GEOLOGÍA MUESTRAS (CRUD) ---
app.patch('/api/proyectos/:id/geologia-capas/:tabName/drive-link', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        await ensureGeologiaCapasDriveUrlColumn();
        const { id, tabName } = req.params;
        const rawDriveUrl = typeof req.body?.driveUrl === 'string' ? req.body.driveUrl.trim() : '';
        const driveUrl = rawDriveUrl || null;

        console.log(`📂 [Backend] Guardado inteligente de Drive Link para pID: ${id}, Tab: ${tabName}`);

        // 1. Siempre asegurar/actualizar el registro base para este Tab Name exacto
        const upsertQuery = `
            INSERT INTO geologia_capas (proyecto_id, tab_name, drive_url, file_name, file_url)
            VALUES ($1, $2, $3, 'CARPETA CONFIGURADA', '')
            ON CONFLICT (proyecto_id, tab_name) DO UPDATE
            SET drive_url = EXCLUDED.drive_url
            RETURNING *;
        `;

        let result;
        try {
            result = await db.query(upsertQuery, [id, tabName, driveUrl]);
        } catch (dbErr) {
            console.error('Error en UPSERT drive-link:', dbErr);
            throw dbErr;
        }

        // 2. Propagar el link a cualquier variante que ya exista o se cree (ej: "GRUPO - SECCIÓN A")
        try {
            await db.query(
                "UPDATE geologia_capas SET drive_url = $1 WHERE proyecto_id = $2 AND tab_name LIKE $3 || '%'",
                [driveUrl, id, tabName]
            );
        } catch (propagateErr) {
            console.warn(`Error propagando link para ${tabName}:`, propagateErr.message);
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error al actualizar carpeta de capa:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// EXPORTACIÓN DE ENSAYOS DE TRAMO (POR TRAMO SELECCIONADO)
// Exportar un tipo específico de ensayo para un tramo

// Exportar todos los ensayos de un tramo


app.get('/api/proyectos/:id/geologia-muestras', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM geologia_muestras WHERE proyecto_id = $1 ORDER BY id DESC;';
        const result = await db.query(query, [req.params.id]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/proyectos/:id/geologia-muestras', authenticateToken, authorizeGeologyManage, upload.single('archivo'), async (req, res) => {
    try {
        const proyectoId = req.params.id;
        const { codigo, tipo_roca, progresiva, coordenada_este, coordenada_norte, latitud, longitud, formacion_litologica, descripcion } = req.body;
        let fileUrl = null;

        if (req.file) {
            const safeCode = sanitizeGeologiaStorageSegment(codigo) || 'muestra';
            const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
            const targetFolder = getGeologiaStorageFolder(proyectoId, 'muestras');
            const finalFilename = `${safeCode}_${Date.now()}_${safeFilename}`;
            fileUrl = await uploadFileToNAS(req.file.buffer, targetFolder, finalFilename);
        }

        const query = `
            INSERT INTO geologia_muestras 
            (proyecto_id, codigo, tipo_roca, progresiva, coordenada_este, coordenada_norte, latitud, longitud, formacion_litologica, descripcion, archivo_pdf_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
        `;
        const values = [proyectoId, codigo, tipo_roca, progresiva, coordenada_este, coordenada_norte, latitud, longitud, formacion_litologica, descripcion, fileUrl];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/proyectos/:id/geologia-muestras/:muestraId', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        const query = 'DELETE FROM geologia_muestras WHERE id = $1 AND proyecto_id = $2 RETURNING *;';
        const result = await db.query(query, [req.params.muestraId, req.params.id]);
        res.status(200).json({ message: 'Eliminado', data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CLASIFICACIÓN DE MATERIALES (CRUD + EXCEL)
// ==========================================

// GET - Listar todos los registros
app.get('/api/proyectos/:id/clasificacion-materiales', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM clasificacion_materiales WHERE proyecto_id = $1 ORDER BY id ASC;';
        const result = await db.query(query, [req.params.id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error GET clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Crear un registro individual
app.post('/api/proyectos/:id/clasificacion-materiales', authenticateToken, async (req, res) => {
    try {
        const proyectoId = req.params.id;
        const { prog_inicio, prog_fin, descripcion_geotecnica, simbolo, tramo_m,
            pct_roca_fija, pct_roca_suelta, pct_material_suelto, corte_talud,
            long_roca_fija, long_roca_suelta, long_material_suelto, porcentaje,
            grupo_formacion, descripcion_detallada } = req.body;

        const query = `
            INSERT INTO clasificacion_materiales
            (proyecto_id, prog_inicio, prog_fin, descripcion_geotecnica, simbolo, tramo_m,
             pct_roca_fija, pct_roca_suelta, pct_material_suelto, corte_talud,
             long_roca_fija, long_roca_suelta, long_material_suelto, porcentaje,
             grupo_formacion, descripcion_detallada)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *;
        `;
        const values = [proyectoId, prog_inicio, prog_fin, descripcion_geotecnica, simbolo,
            tramo_m || null, pct_roca_fija || null, pct_roca_suelta || null,
            pct_material_suelto || null, corte_talud,
            long_roca_fija || null, long_roca_suelta || null,
            long_material_suelto || null, porcentaje || null,
            grupo_formacion, descripcion_detallada];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error POST clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Subir Excel y parsear filas en batch
app.post('/api/proyectos/:id/clasificacion-materiales/upload-excel', authenticateToken, upload.single('archivo'), async (req, res) => {
    try {
        const proyectoId = req.params.id;
        if (!req.file) return res.status(400).json({ error: 'No se proporcionó archivo' });

        const XLSX = require('xlsx');
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use raw array mode to handle complex headers with logos/merged cells
        const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (allRows.length === 0) return res.status(400).json({ error: 'El archivo Excel está vacío' });

        console.log(`[ClasMat] Total raw rows: ${allRows.length}`);
        console.log(`[ClasMat] First 3 rows:`, allRows.slice(0, 3).map(r => r.slice(0, 5)));

        // --- STEP 1: Find the header row that contains "INICIO" or "FIN" ---
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(allRows.length, 20); i++) {
            const rowStr = allRows[i].map(c => String(c).trim().toUpperCase()).join('|');
            if (rowStr.includes('INICIO') && rowStr.includes('FIN')) {
                headerRowIdx = i;
                console.log(`[ClasMat] Header row found at index ${i}: ${rowStr}`);
                break;
            }
        }

        if (headerRowIdx === -1) {
            // Fallback: look for a row that has a progresiva pattern like "0+000"
            for (let i = 0; i < allRows.length; i++) {
                const rowStr = allRows[i].join('|');
                if (/\d\+\d{3}/.test(rowStr)) {
                    headerRowIdx = i - 1; // Assume previous row is header
                    if (headerRowIdx < 0) headerRowIdx = 0;
                    console.log(`[ClasMat] Header guessed at index ${headerRowIdx} (data found at ${i})`);
                    break;
                }
            }
        }

        if (headerRowIdx === -1) {
            return res.status(400).json({ error: 'No se encontraron las columnas INICIO/FIN en el Excel. Asegúrese de que el archivo contenga los encabezados correctos.' });
        }

        // --- STEP 2: Build column index mapping from header row ---
        // Normalizar texto quitando tildes y espacios extras
        const normalizeText = (text) => {
            return String(text)
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .trim().toUpperCase()
                .replace(/\s+/g, ' '); // normalize spaces
        };

        // EXCEL CELDAS COMBINADAS: A veces "DESC GEOTECNICA" está una fila arriba de "INICIO"/"FIN".
        // Vamos a fusionar el texto de las 3 filas anteriores a los datos para armar un encabezado compuesto.
        const headerCells = [];
        const numCols = allRows[headerRowIdx].length;

        for (let col = 0; col < numCols; col++) {
            let combinedHeader = '';
            // Miramos hasta 2 filas más arriba (si existen)
            for (let r = Math.max(0, headerRowIdx - 2); r <= headerRowIdx; r++) {
                if (allRows[r] && allRows[r][col]) {
                    combinedHeader += ' ' + String(allRows[r][col]);
                }
            }
            headerCells.push(normalizeText(combinedHeader));
        }

        console.log(`[ClasMat] Normalized Header cells:`, headerCells);

        // Find column indices by fuzzy matching
        const findColIdx = (candidates) => {
            for (const candidate of candidates) {
                const normCandidate = normalizeText(candidate);
                const idx = headerCells.findIndex(h => h.includes(normCandidate));
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const colIndices = {
            prog_inicio: findColIdx(['INICIO', 'PROG. INICIO', 'PROG INICIO']),
            prog_fin: findColIdx(['FIN', 'PROG. FIN', 'PROG FIN']),
            descripcion_geotecnica: findColIdx(['DESCRIPCION GEOTECNICA', 'DESC. GEOTECNICA', 'DESC GEOTECNICA', 'DESCRIPCION']),
            simbolo: findColIdx(['SIMBOLO', 'SIMB.', 'SIMB']),
            tramo_m: findColIdx(['TRAMO', 'LONGITUD', 'LONG.']),
        };

        // --- TEMPORAL PARA DEBUGGING, BORRAR LUEGO ---
        require('fs').writeFileSync(
            require('path').join(__dirname, '..', 'debug-headers.json'),
            JSON.stringify({ headerCells, colIndices }, null, 2)
        );
        // ---------------------------------------------

        // For percentage columns, find them by order — they come after TRAMO
        // Scan for "ROCA FIJA", "ROCA SUELTA", "MATERIAL SUELTO" in headers
        // These appear twice (once for %, once for longitud)
        const rfIndices = [];
        const rsIndices = [];
        const msIndices = [];
        headerCells.forEach((h, i) => {
            if (h.includes('ROCA FIJA') && !h.includes('SUELTA')) rfIndices.push(i);
            if (h.includes('ROCA SUELTA')) rsIndices.push(i);
            if (h.includes('MATERIAL') && h.includes('SUELTO')) msIndices.push(i);
        });

        colIndices.pct_roca_fija = rfIndices[0] !== undefined ? rfIndices[0] : -1;
        colIndices.pct_roca_suelta = rsIndices[0] !== undefined ? rsIndices[0] : -1;
        colIndices.pct_material_suelto = msIndices[0] !== undefined ? msIndices[0] : -1;
        colIndices.corte_talud = findColIdx(['CORTE', 'TALUD']);
        colIndices.long_roca_fija = rfIndices[1] !== undefined ? rfIndices[1] : -1;
        colIndices.long_roca_suelta = rsIndices[1] !== undefined ? rsIndices[1] : -1;
        colIndices.long_material_suelto = msIndices[1] !== undefined ? msIndices[1] : -1;
        colIndices.porcentaje = findColIdx(['PORCENTAJE']);
        colIndices.grupo_formacion = findColIdx(['UNID. LITOLOGICA', 'UNID LITOLOGICA', 'UNIDAD LITOLOGICA', 'LITOLOGIA', 'GRUPO', 'FORMACION LITOLOGICA', 'FORMACION']);
        colIndices.descripcion_detallada = -1;

        // Last column is usually "Descripcion Geotecnica" (detailed) — find the LAST column with DESC
        for (let i = headerCells.length - 1; i >= 0; i--) {
            if ((headerCells[i].includes('DESCRIPCION') || headerCells[i].includes('DETALLE') || headerCells[i].includes('DESC. DETALLADA')) && i !== colIndices.descripcion_geotecnica) {
                colIndices.descripcion_detallada = i;
                break;
            }
        }

        console.log(`[ClasMat] Column indices:`, colIndices);

        // Delete existing records
        await db.query('DELETE FROM clasificacion_materiales WHERE proyecto_id = $1', [proyectoId]);

        // --- STEP 3: Parse data rows (everything after header row) ---
        const parseNum = (val) => {
            if (val === null || val === undefined || val === '') return null;
            const str = String(val).replace(/[^0-9.\-]/g, '');
            const num = parseFloat(str);
            return isNaN(num) ? null : num;
        };

        const getVal = (row, colIdx) => {
            if (colIdx === -1 || colIdx >= row.length) return null;
            const val = row[colIdx];
            if (val === null || val === undefined || String(val).trim() === '') return null;
            return String(val).trim();
        };

        const limitLen = (str, max) => str ? String(str).substring(0, max) : null;

        let insertedCount = 0;
        for (let i = headerRowIdx + 1; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.length === 0) continue;

            const prog_inicio = limitLen(getVal(row, colIndices.prog_inicio), 20);
            const prog_fin = limitLen(getVal(row, colIndices.prog_fin), 20);

            // Skip rows without progresiva data (empty or header-like)
            if (!prog_inicio && !prog_fin) continue;
            // Skip rows where progresiva looks like a header word
            if (prog_inicio && /^(INICIO|PROGRESIVA|KM)$/i.test(prog_inicio)) continue;

            const values = [
                proyectoId,
                prog_inicio,
                prog_fin,
                limitLen(getVal(row, colIndices.descripcion_geotecnica), 150),
                limitLen(getVal(row, colIndices.simbolo), 50),
                parseNum(getVal(row, colIndices.tramo_m)),
                parseNum(getVal(row, colIndices.pct_roca_fija)),
                parseNum(getVal(row, colIndices.pct_roca_suelta)),
                parseNum(getVal(row, colIndices.pct_material_suelto)),
                limitLen(getVal(row, colIndices.corte_talud), 50),
                parseNum(getVal(row, colIndices.long_roca_fija)),
                parseNum(getVal(row, colIndices.long_roca_suelta)),
                parseNum(getVal(row, colIndices.long_material_suelto)),
                parseNum(getVal(row, colIndices.porcentaje)),
                limitLen(getVal(row, colIndices.grupo_formacion), 150),
                limitLen(getVal(row, colIndices.descripcion_detallada), 500)
            ];

            await db.query(`
                INSERT INTO clasificacion_materiales
                (proyecto_id, prog_inicio, prog_fin, descripcion_geotecnica, simbolo, tramo_m,
                 pct_roca_fija, pct_roca_suelta, pct_material_suelto, corte_talud,
                 long_roca_fija, long_roca_suelta, long_material_suelto, porcentaje,
                 grupo_formacion, descripcion_detallada)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16);
            `, values);
            insertedCount++;
        }

        console.log(`✅ Clasificación de Materiales: ${insertedCount} registros importados para proyecto ${proyectoId}`);
        res.status(200).json({ status: 'ok', message: `${insertedCount} registros importados correctamente`, count: insertedCount });
    } catch (err) {
        console.error('Error upload-excel clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Eliminar un registro individual
app.delete('/api/proyectos/:id/clasificacion-materiales/:registroId', authenticateToken, async (req, res) => {
    try {
        const query = 'DELETE FROM clasificacion_materiales WHERE id = $1 AND proyecto_id = $2 RETURNING *;';
        const result = await db.query(query, [req.params.registroId, req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.status(200).json({ message: 'Eliminado', data: result.rows[0] });
    } catch (err) {
        console.error('Error DELETE clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Eliminar TODOS los registros de un proyecto
app.delete('/api/proyectos/:id/clasificacion-materiales', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM clasificacion_materiales WHERE proyecto_id = $1;', [req.params.id]);
        res.status(200).json({ message: `${result.rowCount} registros eliminados` });
    } catch (err) {
        console.error('Error DELETE ALL clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

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
                const response = await axios.get('http://127.0.0.1:8000/health');
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
