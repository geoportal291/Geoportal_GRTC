// index.js
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason.message || reason, reason.stack || 'No stack trace available');
    process.exit(1);
});

const express = require('express');
const http = require('http');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fsp = require('fs').promises;
const fs = require('fs');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const db = require('./conexion');
const distritosService = require('./services/distritosService');
const ensayosService = require('./services/ensayosService');
const granulometriaService = require('./services/granulometriaService');
const limiteLiquidoService = require('./services/limiteLiquidoService');
const limitePlasticoService = require('./services/limitePlasticoService');
const kmlService = require('./services/kmlService');
const progresivasService = require('./services/progresivasService');
const proyectosService = require('./services/proyectosService');
const rutaKmlService = require('./services/rutaKmlService');
const estratosService = require('./services/estratosService');
const usuariosService = require('./services/usuariosService');
const puntosMapaService = require('./services/puntosMapaService');
const canterasService = require('./services/canterasService');
const alcantarillasService = require('./services/alcantarillasService');
const alcantarillasGraphicsService = require('./services/alcantarillasGraphicsService');
const amigoSecretoService = require('./services/amigoSecretoService');
const wishlistService = require('./services/wishlistService'); // NUEVO
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { put, del } = require('@vercel/blob');
const axios = require('axios'); // Asegurarse de que axios esté importado
const { parse } = require('node-html-parser'); // Importar el parser de node-html-parser
const alcantarillasE1Service = require('./services/alcantarillasE1Service');
const tokml = require('tokml');
const shpwrite = require('@mapbox/shp-write');
const archiver = require('archiver');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

console.log('DEBUG: Servidor backend iniciando...');
require('dotenv').config();

const whitelist = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://geoportalbeta.fly.dev',
    'https://frontend-morning-haze-4592.fly.dev',
    'http://192.168.1.19:3000'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        var msg = 'La política de CORS para este sitio no permite el acceso desde el origen especificado.';
        return callback(new Error(msg), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.options('*', cors(corsOptions)); // enable pre-flight
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = '/tmp/';
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, `${uuidv4()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 500
    }
});

app.use('/', express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use('/formats', express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const userResult = await db.query(`
                SELECT u.*, r.nombre AS rol_nombre
                FROM usuariost u
                LEFT JOIN roles r ON u.rol_id = r.id
                WHERE u.id = $1
            `, [decoded.id]);

            if (userResult.rows.length === 0) {
                return res.sendStatus(403); // User from token not found
            }

            req.user = userResult.rows[0]; // Attach the full user object
            next();
        } catch (err) {
            return res.sendStatus(403); // Invalid token
        }
    } else {
        res.sendStatus(401);
    }
};

// Middleware de autorización para ADMIN y COORDINADOR PROYECTO
const authorizeAdminOrCoordinator = (req, res, next) => {
    if (!req.user || (req.user.rol_nombre !== 'ADMIN' && req.user.rol_nombre !== 'COORDINADOR PROYECTO')) {
        return res.status(403).json({ error: 'Acceso denegado: Rol no autorizado' });
    }
    next();
};

// Middleware de autorización genérico para permisos específicos
const authorizePermission = (permissionName, accessType) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            // Lógica simplificada para el ejemplo, idealmente se validan permisos aquí
            next(); 
        } else {
            next();
        }
    };
};

app.get('/', (req, res) => {
    res.send('🚀 Backend del Geoportal en funcionamiento');
});

// Ruta de Health Check para Fly.io
app.get('/health', (req, res) => {
    res.status(200).send('OK');
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
            for(const img of images) {
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
                 if(firstImgSrc) {
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


// --------------------- LOGIN ---------------------
app.post('/login', async(req, res) => {
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
            if (password === user.password) { // Simplificado, usar bcrypt en producción
                const accessToken = jwt.sign({ id: user.id, rol_nombre: user.rol_nombre }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
                res.json({ status: 'ok', mensaje: 'login exitoso', usuario: { ...user, role: user.rol_nombre, token: accessToken } });
            } else {
                res.status(401).json({ status: 'error', mensaje: 'credenciales incorrectas' });
            }
        } else {
            res.status(401).json({ status: 'error', mensaje: 'credenciales incorrectas' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', mensaje: 'error del servidor' });
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
            return res.status(403).json({ error: 'No tienes permiso para ver esta lista de deseos.' });
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
    try {
        const ensayosList = await ensayosService.getEnsayosByTramoId(tramoId);
        const tramoInfo = await progresivasService.getProgresivaById(tramoId);
        res.json({
            ensayos: ensayosList,
            tramo: tramoInfo
        });
    } catch (err) {
        console.error(`Error al obtener ensayos para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener los ensayos del tramo', details: err.message });
    }
});

// Get all assays from all canteras
app.get('/api/ensayos/canteras', authenticateToken, async (req, res) => {
    try {
        const ensayosList = await ensayosService.getAllCanteraEnsayos();
        res.json(ensayosList);
    } catch (err) {
        console.error('Error al obtener todos los ensayos de canteras:', err);
        res.status(500).json({ error: 'Error al obtener los ensayos de canteras', details: err.message });
    }
});

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

app.post('/api/ensayos/base', authenticateToken, async (req, res) => {
    try {
        const newEnsayo = await ensayosService.createBaseEnsayo(req.body);
        res.status(201).json(newEnsayo);
    } catch (err) {
        console.error('Error al crear ensayo base:', err);
        res.status(500).json({ error: 'Error al crear ensayo base', details: err.message });
    }
});

// Update base assay data (name, status)
app.put('/api/ensayos/:id/base', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nombre_ensayo, estado } = req.body;
    try {
        const updatedEnsayo = await ensayosService.updateBaseEnsayo(id, { nombre_ensayo, estado });
        res.json(updatedEnsayo);
    } catch (err) {
        console.error(`Error al actualizar ensayo base ${id}:`, err);
        res.status(500).json({ error: 'Error al actualizar ensayo base', details: err.message });
    }
});

// Obtener todos los ensayos
app.get('/ensayos', async (req, res) => {
    try {
        const ensayos = await ensayosService.getEnsayos();
        res.json(ensayos);
    } catch (err) {
        console.error('Error al obtener ensayos:', err);
        res.status(500).json({ error: 'Error al obtener ensayos', details: err.message });
    }
});

// GET /api/ensayos/details - Nueva ruta para obtener detalles completos de ensayos
app.get('/api/ensayos/details', async (req, res) => {
    try {
        const ensayosDetails = await ensayosService.getEnsayosDetails();
        res.json(ensayosDetails);
    } catch (err) {
        console.error('Error al obtener detalles de ensayos:', err);
        res.status(500).json({ error: 'Error al obtener detalles de ensayos', details: err.message });
    }
});

// Get a single assay by ID with all details
app.get('/api/ensayos/details/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const ensayoDetails = await ensayosService.getEnsayoDetailsById(id);
        if (ensayoDetails) {
            res.json(ensayoDetails);
        } else {
            res.status(404).json({ error: 'Ensayo no encontrado' });
        }
    } catch (err) {
        console.error(`Error al obtener detalles para el ensayo ${id}:`, err);
        res.status(500).json({ error: 'Error al obtener detalles del ensayo', details: err.message });
    }
});

// Create or Update a full assay
app.post('/api/ensayos/full-assay', authenticateToken, async (req, res) => {
    try {
        const result = await ensayosService.createOrUpdateFullAssay(null, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating full assay:', err);
        res.status(500).json({ error: 'Error creating full assay', details: err.message });
    }
});

app.put('/api/ensayos/full-assay/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await ensayosService.createOrUpdateFullAssay(id, req.body);
        res.json(result);
    } catch (err) {
        console.error(`Error updating full assay ${id}:`, err);
        res.status(500).json({ error: 'Error updating full assay', details: err.message });
    }
});

// Eliminar un ensayo por ID
app.delete('/api/ensayos/:id', authenticateToken, async(req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await ensayosService.deleteEnsayo(id);
        if (rowCount === 0) {
            return res.status(404).json({ mensaje: 'Ensayo no encontrado para eliminar' });
        }
        res.status(204).send(); // El ensayo fue eliminado correctamente
    } catch (err) {
        console.error('Error al eliminar ensayo:', err);
        res.status(500).json({ status: 'error', mensaje: err.message || 'No se pudo eliminar el ensayo' });
    }
});

// Eliminar ensayos en bulk
app.post('/api/ensayos/bulk-delete', authenticateToken, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs.' });
    }
    try {
        const rowCount = await ensayosService.bulkDeleteEnsayos(ids);
        if (rowCount > 0) {
            res.json({ status: 'ok', mensaje: `${rowCount} ensayos eliminados correctamente` });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'No se encontraron ensayos para eliminar' });
        }
    } catch (err) {
        console.error('Error en POST /ensayos/bulk-delete:', err);
        res.status(500).json({ error: 'Error al eliminar ensayos en bulk', details: err.message });
    }
});

// --------------------- ROLES ---------------------
app.get('/roles', async(req, res) => {
    try {
        const result = await db.query('SELECT * FROM roles');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener roles:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener roles' });
    }
});

// --------------------- ESPECIALIDADES ---------------------
app.get('/especialidades', async(req, res) => {
    try {
        const result = await db.query('SELECT * FROM especialidades');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener especialidades:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener especialidades' });
    }
});

// --------------------- USUARIOS ---------------------
app.post('/usuarios', authenticateToken, authorizePermission('usuarios', 'edicion'), async(req, res) => {
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

app.get('/usuarios', authenticateToken, authorizePermission('usuarios', 'lectura'), async(req, res) => {
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

app.get('/usuarios/:id', authenticateToken, authorizePermission('usuarios', 'lectura'), async(req, res) => {
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

app.delete('/usuarios/:dni', authenticateToken, authorizePermission('usuarios', 'edicion'), async(req, res) => {
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

app.put('/usuarios/:dni', authenticateToken, authorizePermission('usuarios', 'edicion'), async(req, res) => {
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
app.post('/anuncios', authenticateToken, upload.single('file'), async(req, res) => {
    const { titulo, contenido, fecha_inicio, fecha_fin, usuario_id, duracion_horas } = req.body;
    const creador_id = req.user.id;
    const archivo = req.file;
    try {
        let archivoUrl = null;
        if (archivo) {
            archivoUrl = await uploadFileToVercelBlob(archivo);
        }
        const result = await db.query(`
            INSERT INTO anuncios (titulo, contenido, fecha_inicio, fecha_fin, usuario_id, creador_id, archivo_url, duracion_horas)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [titulo, contenido, fecha_inicio, fecha_fin, usuario_id, creador_id, archivoUrl, duracion_horas]);
        res.status(201).json({ status: 'ok', mensaje: 'Anuncio creado correctamente', anuncio: result.rows[0] });
    } catch (err) {
        console.error('Error al crear anuncio:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el anuncio en el servidor' });
    }
});

// Nuevo endpoint para subir imágenes de tráfico
app.post('/api/trafico/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const imageUrl = await uploadFileToVercelBlob(req.file);
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [stationId, imageUrl, description, upload_date]
        );
        res.status(201).json({ status: 'ok', message: 'Imagen subida y guardada correctamente', imageData: result.rows[0] });
    } catch (error) {
        console.error('Error al subir imagen de tráfico:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir la imagen de tráfico.' });
    }
});

// Nueva función para subir imagenes de estación de control a Vercel Blob
async function uploadStationImageToVercelBlob(file, description, index) {
    try {
        const sanitizedDescription = description.replace(/[^a-zA-Z0-9-_]/g, '_');
        const originalExtension = path.extname(file.originalname);
        const filename = `trafico/estacion/${sanitizedDescription}/${sanitizedDescription}_${index}${originalExtension}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo de estación a Vercel Blob:', error);
        throw new Error('Error al subir archivo de estación a Vercel Blob');
    }
}

// Nueva funcion para subir imagenes de tramo a Vercel Blob
async function uploadTramoImageToVercelBlob(file, description, index) {
    try {
        const sanitizedDescription = description.replace(/[^a-zA-Z0-9-_]/g, '_');
        const originalExtension = path.extname(file.originalname);
        const filename = `trafico/tramo/${sanitizedDescription}/${sanitizedDescription}_${index}${originalExtension}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo de tramo a Vercel Blob:', error);
        throw new Error('Error al subir archivo de tramo a Vercel Blob');
    }
}

// Nueva función para subir imagenes de conteo vehicular a Vercel Blob
async function uploadConteoVehicularImageToVercelBlob(file, description, index) {
    try {
        const sanitizedDescription = description.replace(/[^a-zA-Z0-9-_]/g, '_');
        const originalExtension = path.extname(file.originalname);
        const filename = `trafico/conteovehicular/${sanitizedDescription}/${sanitizedDescription}_${index}${originalExtension}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo de conteo vehicular a Vercel Blob:', error);
        throw new Error('Error al subir archivo de conteo vehicular a Vercel Blob');
    }
}

// Nueva funcion para subir archivos de censo de cargas a Vercel Blob
async function uploadCensoDeCargasFileToVercelBlob(file, description, index) {
    try {
        const sanitizedDescription = description.replace(/[^a-zA-Z0-9-_]/g, '_');
        const originalExtension = path.extname(file.originalname);
        const filename = `trafico/censodecargas/${sanitizedDescription}/${sanitizedDescription}_${index}${originalExtension}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo de censo de cargas a Vercel Blob:', error);
        throw new Error('Error al subir archivo de censo de cargas a Vercel Blob');
    }
}

// Nueva funcion para subir archivos de encuesta de velocidad a Vercel Blob
async function uploadEncuestaVelocidadFileToVercelBlob(file, description, index) {
    try {
        const sanitizedDescription = description.replace(/[^a-zA-Z0-9-_]/g, '_');
        const originalExtension = path.extname(file.originalname);
        const filename = `trafico/encuestavelocidad/${sanitizedDescription}/${sanitizedDescription}_${index}${originalExtension}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo de encuesta de velocidad a Vercel Blob:', error);
        throw new Error('Error al subir archivo de encuesta de velocidad a Vercel Blob');
    }
}
// Nuevo endpoint para subir imágenes de estación de control
app.post('/api/trafico/estacion/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const imageUrl = await uploadStationImageToVercelBlob(req.file, description, index);
        
        //insertar la nueva imagen en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, imageUrl, description, upload_date, 'estacion_control']
        );

        res.status(201).json({ status: 'ok', message: 'Imagen de estación subida y guardada correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir imagen de estación de control:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir la imagen de estación de control.' });
    }
});

//nuevo endpoint para subir imagenes de tramo
app.post('/api/trafico/tramo/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { tramoId, description, upload_date, index } = req.body;
        if (!tramoId) {
            return res.status(400).json({ error: 'tramoId es requerido.' });
        }
        const imageUrl = await uploadTramoImageToVercelBlob(req.file, description, index);
        
        // Reutilizamos la tabla trafico_imagenes, guardando el tramoId en la columna station_id
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tramoId, imageUrl, description, upload_date, 'tramo']
        );

        res.status(201).json({ status: 'ok', message: 'Imagen de tramo subida y guardada correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir imagen de tramo:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir la imagen de tramo.' });
    }
});

//endpoint para subir archivos e imagenes para conteovehicular
app.post('/api/trafico/conteovehicular/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index, source_type } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const fileUrl = await uploadConteoVehicularImageToVercelBlob(req.file, description, index);
        
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, fileUrl, description, upload_date, source_type]
        );

        res.status(201).json({ status: 'ok', message: 'Archivo de conteo vehicular subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('DEBUG_CONTEO_VEHICULAR_UPLOAD_ERROR:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de conteo vehicular.' });
    }
});

// Nueva función para subir archivos Excel de conteo vehicular a Vercel Blob
async function uploadConteoVehicularExcelToVercelBlob(file, stationId) {
    try {
        const originalExtension = path.extname(file.originalname);
        const filename = `trafico/reportconteo/${stationId}_${Date.now()}${originalExtension}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo Excel de conteo vehicular a Vercel Blob:', error);
        throw new Error('Error al subir archivo Excel de conteo vehicular a Vercel Blob');
    }
}

// Nuevo endpoint para subir archivos Excel de conteo vehicular
app.post('/api/trafico/conteovehicular/upload-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        const { stationId, description } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const excelUrl = await uploadConteoVehicularExcelToVercelBlob(req.file, stationId);
        const { DateTime } = require('luxon'); // Asegúrate de tener luxon importado al inicio si no lo está
        const upload_date = DateTime.utc().toISODate();

        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, excelUrl, description || 'Excel Conteo Vehicular', upload_date, 'conteo_vehicular_excel']
        );

        res.status(201).json({ status: 'ok', message: 'Archivo Excel subido correctamente', excelUrl, imageData: result.rows[0] });
        
        // --- Audit Log: Subida de Archivo de Tráfico ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [req.user.id, 'Subida de Archivo de Tráfico', `Archivo Excel "${description || 'Excel Conteo Vehicular'}" subido para estación ${stationId} por usuario ${req.user.id}. URL: ${excelUrl}`]
        );
        // --- End Audit Log ---
    } catch (error) {
        console.error('Error al subir archivo Excel de conteo vehicular:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo Excel de conteo vehicular.' });
    }
});

async function uploadKmlToVercelBlob(file) {
    try {
        // Sanitize filename to prevent path traversal issues and create a unique name
        const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_');
        const filename = `tramoinv/${Date.now()}_${cleanFilename}`;

        console.log(`Uploading KML to Vercel Blob with filename: ${filename}`);
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true, // Allow overwrite in case of hash collision, though unlikely with timestamp
        });

        console.log(`Upload successful. Blob URL: ${blob.url}`);
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo KML a Vercel Blob:', error);
        throw new Error('Error al subir archivo KML a Vercel Blob');
    }
}

// Endpoint to upload a KML file
app.post('/api/kml/upload', upload.single('kmlFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo KML.' });
        }
        // Read the file from disk into a buffer because multer is configured with diskStorage
        const fileBuffer = await fsp.readFile(req.file.path);
        
        // Create a file-like object that the helper function expects (with a buffer)
        const fileForBlob = {
            originalname: req.file.originalname,
            buffer: fileBuffer
        };
        
        // Use the helper function to upload the file buffer
        const blobUrl = await uploadKmlToVercelBlob(fileForBlob);
        
        // Clean up the temporary file from disk
        await fsp.unlink(req.file.path);
        
        // Respond with the public URL of the uploaded file
        res.status(201).json({ url: blobUrl });
    } catch (error) {
        console.error('Error en el endpoint /api/kml/upload:', error);
        // Ensure the temporary file is cleaned up on error as well
        if (req.file && req.file.path) {
            await fsp.unlink(req.file.path).catch(err => console.error("Error cleaning up temp file on failure:", err));
        }
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo KML.' });
    }
});

app.get('/api/tipoensayos', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, codigo, descripcion FROM tipo_ensayo ORDER BY descripcion');
        console.log('DEBUG: Backend /tipo-ensayos response rows:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener tipos de ensayo:', err);
        res.status(500).json({
            error: 'Error al obtener tipos de ensayo',
            details: err.message
        });
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
app.post('/api/alcantarillas/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    const { projectId, utmZone, entregableNum } = req.body;
    const userId = req.user.id; // Get authenticated user ID
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
        
        // Leer el archivo del disco ya que multer.diskStorage no llena el buffer
        const fileBuffer = await fsp.readFile(req.file.path);
        
        // Procesar el Excel y guardar las alcantarillas en la base de datos, pasando el buffer
        const processResult = await alcantarillasService.processExcelAndSaveAlcantarillas(fileBuffer, projectId, utmZone);
        
        // Si el procesamiento fue exitoso, subir el archivo a Vercel Blob
        const excelUrl = await uploadAlcantarillasExcelToVercelBlob(fileBuffer, req.file.originalname, projectId);
        
        // Eliminar el archivo temporal
        await fsp.unlink(req.file.path);
        
        // Guardar la URL del archivo Excel en la tabla invvial
        const columnName = `alcantarillas_excel_url_entregable${entregableNum}`;
        await db.query(
            `INSERT INTO invvial (id_proyecto, kml_url, ${columnName})
             VALUES ($1, '', $2)
             ON CONFLICT (id_proyecto)
             DO UPDATE SET ${columnName} = EXCLUDED.${columnName}
             RETURNING *`,
            [projectId, excelUrl]
        );

        // --- Audit Log: Subida de Archivo Excel de Alcantarillas ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Subida de Archivo Excel de Alcantarillas', `Archivo Excel de Alcantarillas subido para proyecto ${projectId} por usuario ${userId}. URL: ${excelUrl}. ${processResult.message}`]
        );
        // --- End Audit Log ---

        res.status(201).json({ status: 'ok', message: 'Archivo Excel de alcantarillas subido y procesado correctamente', excelUrl, processResult });
    } catch (error) {
        console.error('Error en la ruta /api/alcantarillas/upload-excel:', error);
        // Asegurarse de eliminar el archivo temporal incluso si hay un error después de leerlo
        if (req.file && req.file.path) {
            try {
                await fsp.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error al eliminar archivo temporal en el bloque catch:', unlinkError);
            }
        }
        res.status(500).json({ status: 'error', message: error.message || 'Error al subir el archivo Excel de alcantarillas.' });
    }
});

// Helper function to upload a temporary file to Vercel Blob
async function uploadTempFileToVercelBlob(fileBuffer, originalFilename, folder = 'temp') {
    try {
        const originalExtension = path.extname(originalFilename);
        const filename = `${folder}/${uuidv4()}${originalExtension}`;
        const blob = await put(filename, fileBuffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error(`Error al subir archivo temporal a Vercel Blob en la carpeta ${folder}:`, error);
        throw new Error(`Error al subir archivo temporal a Vercel Blob en la carpeta ${folder}`);
    }
}

// Nuevo endpoint para subir archivos Excel de gráficos de alcantarillas (AHORA ASÍNCRONO)
app.post('/api/alcantarillas/upload-graphics-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user.id;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }

        // The file is saved to /tmp by the 'upload' middleware.
        // We'll create a job to process it, similar to the chunked upload completion.
        const jobPayload = { filePath: req.file.path, originalName: req.file.originalname, userId: userId };
        const jobType = path.extname(req.file.originalname).toLowerCase() === '.rar' ? 'rar_extraction' : 'simple_file_upload';

        const newJob = await db.query(
            `INSERT INTO processing_jobs (job_type, project_id, status, payload)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [jobType, projectId, 'pending', jobPayload]
        );
        const jobId = newJob.rows[0].id;

        // Trigger the processing in the background
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

// NEW: Multer configuration for chunked uploads - Use memory storage to access body fields
const uploadChunk = multer({ storage: multer.memoryStorage() });

// NEW ENDPOINT: For receiving file chunks
app.post('/api/alcantarillas/upload-chunk', authenticateToken, uploadChunk.single('fileChunk'), async (req, res) => {
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

// NEW ENDPOINT: For finalizing a chunked upload
app.post('/api/alcantarillas/complete-upload', authenticateToken, async (req, res) => {
    const { projectId, uploadId, originalFilename } = req.body;
    const userId = req.user.id;

    if (!projectId || !uploadId || !originalFilename) {
        return res.status(400).json({ error: 'projectId, uploadId, and originalFilename are required.' });
    }

    try {
        const result = await alcantarillasGraphicsService.reassembleAndProcessChunks(projectId, uploadId, originalFilename, userId);
        res.status(202).json(result); // 202 Accepted, as the processing is async
    } catch (error) {
        console.error('Error al completar la subida por chunks:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al ensamblar el archivo.' });
    }
});

// NEW ENDPOINT: For simple (non-chunked) file uploads
app.post('/api/alcantarillas/upload-images', authenticateToken, upload.single('files'), async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user.id;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }
        
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

// NEW: Endpoint to delete a single graphic image
app.delete('/api/alcantarillas/graphics/:imageId', authenticateToken, async (req, res) => {
    const { imageId } = req.params;
    const { projectId } = req.query; // Assuming projectId is passed as a query parameter
    const userId = req.user.id; // Get authenticated user ID

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

// NEW: Endpoint to delete all graphic images for a project
app.delete('/api/alcantarillas/graphics/all/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id; // Get authenticated user ID

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

// NEW: Endpoint para eliminar el archivo Excel de alcantarillas y sus datos asociados
app.delete('/api/alcantarillas/delete-excel/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { entregableNum } = req.query; // Get entregableNum from query
    const userId = req.user.id; // Get authenticated user ID

    try {
        if (!entregableNum) {
            return res.status(400).json({ error: 'entregableNum es requerido.' });
        }
        const columnName = `alcantarillas_excel_url_entregable${entregableNum}`;
        
        // 1. Obtener la URL del Excel de la tabla invvial
        const invvialResult = await db.query(`SELECT ${columnName} FROM invvial WHERE id_proyecto = $1`, [projectId]);
        const excelUrl = invvialResult.rows.length > 0 ? invvialResult.rows[0][columnName] : null;
        
        // 2. Eliminar el archivo de Vercel Blob si existe
        if (excelUrl) {
            await del(excelUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
        
        // 3. Eliminar la entrada de alcantarillas_excel_url de la tabla invvial
        await db.query(`UPDATE invvial SET ${columnName} = NULL WHERE id_proyecto = $1`, [projectId]);
        
        // 4. Eliminar todas las alcantarillas asociadas a este proyecto
        await db.query('DELETE FROM alcantarillas WHERE id_proyecto = $1', [projectId]);
        
        // --- Audit Log: Eliminación de Archivo Excel de Alcantarillas ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Archivo Excel de Alcantarillas', `Archivo Excel de Alcantarillas y datos asociados eliminados para proyecto ${projectId} por usuario ${userId}.`]
        );
        // --- End Audit Log ---

        res.status(200).json({ status: 'ok', message: 'Archivo Excel de alcantarillas y datos asociados eliminados correctamente.' });
    } catch (error) {
        console.error('Error al eliminar el archivo Excel de alcantarillas y los datos:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar el archivo Excel de alcantarillas y los datos.' });
    }
});

// Nuevo endpoint para obtener el último archivo Excel de conteo vehicular para una estación
app.get('/api/trafico/conteovehicular/latest-excel/:stationId', async (req, res) => {
    const { stationId } = req.params;
    try {
        const result = await db.query(
            'SELECT image_url FROM trafico_imagenes WHERE station_id = $1 AND source_type = $2 ORDER BY upload_date DESC, id DESC LIMIT 1',
            [stationId, 'conteo_vehicular_excel']
        );
        if (result.rows.length > 0) {
            res.json({ status: 'ok', excelUrl: result.rows[0].image_url });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontró ningún archivo Excel para esta estación.' });
        }
    } catch (error) {
        console.error('Error al obtener el último archivo Excel:', error);
        res.status(500).json({ status: 'error', message: 'Error al obtener el último archivo Excel.' });
    }
});

// Nueva función para subir archivos de encuesta origen destino a Vercel Blob
async function uploadEncuestaOrigenDestinoFileToVercelBlob(file, description, index) {
    try {
        const sanitizedDescription = description.replace(/[^a-zA-Z0-9-_]/g, '_');
        const originalExtension = path.extname(file.originalname);
        const filename = `trafico/encuestaorigendestino/${sanitizedDescription}/${sanitizedDescription}_${index}${originalExtension}`;
        const blob = await put(filename, file.buffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo de encuesta origen destino a Vercel Blob:', error);
        throw new Error('Error al subir archivo de encuesta origen destino a Vercel Blob');
    }
}

// Nuevo endpoint para subir archivos de encuesta origen destino
app.post('/api/trafico/encuestaorigendestino/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index, source_type } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const fileUrl = await uploadEncuestaOrigenDestinoFileToVercelBlob(req.file, description, index);
        
        // Insertar el nuevo archivo en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *'
            , [stationId, fileUrl, description, upload_date, source_type]
        );
        res.status(201).json({ status: 'ok', message: 'Archivo de encuesta origen destino subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir archivo de encuesta origen destino:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de encuesta origen destino.' });
    }
});

// Nuevo endpoint para subir archivos de censo de cargas
app.post('/api/trafico/censodecargas/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index, source_type } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const fileUrl = await uploadCensoDeCargasFileToVercelBlob(req.file, description, index);
        
        // Insertar el nuevo archivo en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *'
            , [stationId, fileUrl, description, upload_date, source_type]
        );
        res.status(201).json({ status: 'ok', message: 'Archivo de censo de cargas subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir archivo de censo de cargas:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de censo de cargas.' });
    }
});

// Nuevo endpoint para subir archivos de encuesta de velocidad
app.post('/api/trafico/encuestavelocidad/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { sectionId, description, upload_date, index, source_type } = req.body;
        if (!sectionId) {
            return res.status(400).json({ error: 'sectionId es requerido.' });
        }
        const fileUrl = await uploadEncuestaVelocidadFileToVercelBlob(req.file, description, index);
        
        // Insertar el nuevo archivo en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *'
            , [sectionId, fileUrl, description, upload_date, source_type]
        );
        res.status(201).json({ status: 'ok', message: 'Archivo de encuesta de velocidad subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir archivo de encuesta de velocidad:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de encuesta de velocidad.' });
    }
});

// Nuevo endpoint para eliminar un grupo de imágenes de tráfico
app.delete('/api/trafico/delete-image-group', async (req, res) => {
    const { stationId, description, uploadDate } = req.body;
    try {
        // Lógica para eliminar las imágenes de la base de datos
        const result = await db.query(
            'DELETE FROM trafico_imagenes WHERE station_id = $1 AND description = $2 AND upload_date = $3',
            [stationId, description, uploadDate]
        );
        
        if (result.rowCount > 0) {
            res.status(200).json({ status: 'ok', message: 'Grupo de imágenes eliminado correctamente.' });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontró el grupo de imágenes para eliminar.' });
        }
    } catch (error) {
        console.error('Error al eliminar el grupo de imágenes:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar el grupo de imágenes.' });
    }
});

// Nuevo endpoint para eliminar una imagen individual de tráfico
app.delete('/api/trafico/delete-image', async (req, res) => {
    const { imageUrl } = req.body;
    try {
        // Eliminar de Vercel Blob
        await del(imageUrl);
        // Eliminar de la base de datos
        const result = await db.query(
            'DELETE FROM trafico_imagenes WHERE image_url = $1',
            [imageUrl]
        );
        if (result.rowCount > 0) {
            res.status(200).json({ status: 'ok', message: 'Imagen eliminada correctamente.' });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontró la imagen para eliminar.' });
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar la imagen.' });
    }
});

// ✅ Listar anuncios activos
app.get('/anuncios/activos', async(req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id, a.titulo, a.contenido,
                to_char(a.fecha_inicio, 'DD/MM/YYYY') as fecha_inicio,
                to_char(a.fecha_fin, 'DD/MM/YYYY') as fecha_fin,
                COALESCE(creador.nombre, '') || ' ' || COALESCE(creador.ap_paterno, '') || ' ' || COALESCE(creador.ap_materno, '') as autor,
                COALESCE(asignado.nombre, '') || ' ' || COALESCE(asignado.ap_paterno, '') || ' ' || COALESCE(asignado.ap_materno, '') as asignado_a,
                a.archivo_url
            FROM anuncios a
            LEFT JOIN usuariost creador ON a.creador_id = creador.id
            LEFT JOIN usuariost asignado ON a.usuario_id = asignado.id
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
        const result = await db.query('SELECT * FROM anuncios LIMIT 1;');
        res.json({ status: 'ok', message: 'Tabla anuncios accesible', rows: result.rows });
    } catch (err) {
        console.error('Error al acceder a anuncios:', err);
        res.status(500).json({ status: 'error', message: 'Error al acceder a la tabla anuncios', details: err.message, code: err.code });
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

app.get('/anuncios', async(req, res) => {
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

app.delete('/anuncios/:id', async(req, res) => {
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

app.put('/anuncios/:id', authenticateToken, async(req, res) => {
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
app.get('/proyectos/detallado', authenticateToken, async (req, res) => {
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
app.get('/proyectos', authenticateToken, async (req, res) => {
    try {
        const proyectos = await proyectosService.getSimpleProyectos();
        res.json(proyectos);
    } catch (err) {
        console.error('Error al obtener proyectos:', err);
        res.status(500).json({ error: 'Error al obtener proyectos', details: err.message });
    }
});

// Crear un proyecto completo con su tramo inicial y progresivas en una sola transacción
app.post('/proyectos/create-full', authenticateToken, async (req, res) => {
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
app.put('/proyectos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { projectData, progresivaData } = req.body;
    try {
        const result = await proyectosService.updateProyecto(id, projectData, progresivaData);
        res.json(result);
    } catch (err) {
        console.error(`Error al actualizar el proyecto ${id}:`, err);
        res.status(500).json({ error: 'Error al actualizar el proyecto', details: err.message });
    }
});

// Eliminar un proyecto existente
app.delete('/proyectos/:id', authenticateToken, async (req, res) => {
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
app.post('/proyectos/:projectId/assignUser', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
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

app.delete('/proyectos/:projectId/removeUser/:userId', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const actorId = req.user.id; // Obtener el ID del usuario autenticado
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

app.get('/proyectos/:projectId/assignments', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId } = req.params;
        const assignments = await proyectosService.getProjectAssignments(parseInt(projectId));
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error al obtener asignaciones del proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/proyectos/:projectId/history', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
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
app.post('/api/proyectos/:proyectoId/upload-kml', authenticateToken, upload.single('kmlFile'), async (req, res) => {
    const { proyectoId } = req.params;
    const { file } = req; // Multer places the file here
    const userId = req.user.id; // Get authenticated user ID

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
// GET the active KML for a project
app.get('/api/proyectos/:id/kml', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [id]);
        if (result.rows.length > 0) {
            res.json({ url: result.rows[0].kml_url });
        } else {
            res.status(404).json({ error: 'No KML found for this project.' });
        }
    } catch (error) {
        console.error(`Error getting KML for project ${id}:`, error);
        res.status(500).json({ error: 'Server error while fetching KML URL.' });
    }
});

// POST to set/update the KML for a project
app.post('/api/proyectos/:id/kml', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'KML URL is required.' });
    }
    try {
        // Use INSERT ON CONFLICT (UPSERT) to either create a new entry or update the existing one for the project
        const result = await db.query(
            `INSERT INTO invvial (id_proyecto, kml_url)
             VALUES ($1, $2)
             ON CONFLICT (id_proyecto)
             DO UPDATE SET kml_url = EXCLUDED.kml_url
             RETURNING *`,
            [id, url]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(`Error setting KML for project ${id}:`, error);
        res.status(500).json({ error: 'Server error while setting KML URL.' });
    }
});

// DELETE the KML for a project
app.delete('/api/proyectos/:id/kml', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // First, get the URL of the KML to delete it from Vercel Blob
        const getUrlResult = await db.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [id]);
        if (getUrlResult.rows.length > 0) {
            const { kml_url } = getUrlResult.rows[0];
            // Delete from Vercel Blob storage
            if (kml_url) {
                await del(kml_url);
            }
            // Then, delete the row from the invvial table
            await db.query('DELETE FROM invvial WHERE id_proyecto = $1', [id]);
            res.status(204).send(); // Success, no content
        } else {
            res.status(404).json({ error: 'No KML found for this project to delete.' });
        }
    } catch (error) {
        console.error(`Error deleting KML for project ${id}:`, error);
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
app.get('/proyectos/export', authenticateToken, async (req, res) => {
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

// --------------------- CANTERAS ---------------------
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
        res.status(500).json({ error: 'Error al procesar la subida de la imagen.' });
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
    } catch (err) {
        console.error('Error al crear cantera en index.js:', err.stack); // Loguear el stack completo
        res.status(500).json({ error: 'Error al crear la cantera', details: err.message });
    }
});

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

// NEW: Endpoint to delete KML from a progresiva
app.delete('/api/progresivas/:progresivaId/kml', authenticateToken, async (req, res) => {
    const { progresivaId } = req.params;
    try {
        const result = await progresivasService.deleteKmlFromProgresiva(progresivaId);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al eliminar KML de la progresiva ${progresivaId}:`, error);
        if (error.isCustomError) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al eliminar KML de la progresiva.' });
    }
});

// Obtener progresivas principales
app.get('/progresivas', authenticateToken, async (req, res) => {
    try {
        const { selectedProjectId } = req.query; // Get selectedProjectId from query parameters
        const progresivas = await progresivasService.getProgresivas(req.user, selectedProjectId);
        res.json(progresivas);
    } catch (err) {
        console.error('Error al obtener progresivas:', err);
        res.status(500).json({ error: 'Error al obtener progresivas', details: err.message });
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

// Nueva ruta para importar progresivas con creación automática de ensayos
app.post('/progresivas/importar-con-ensayos', authenticateToken, async (req, res) => {
    try {
        const result = await progresivasService.importarConEnsayos(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al importar con ensayos automáticos:', error);
        if (error && error.type) {
            const statusCode = error.type === 'ExcelDataValidationError' ? 400 : 500;
            res.status(statusCode).json(error);
        } else {
            res.status(500).json({ error: 'Error en /progresivas/importar-con-ensayos', details: error.message || 'Error desconocido' });
        }
    }
});

app.put('/progresivas/importar-con-ensayos/:overwriteProgresivaId', authenticateToken, async (req, res) => {
    const { overwriteProgresivaId } = req.params;
    try {
        // Mapeo del payload del frontend al esperado por el servicio
        const { parentProgresiva, reconstructedSubProgresivas, estratosSeleccionados, tiposEnsayoIds } = req.body;
        const servicePayload = {
            parentProgresiva,
            generatedChildren: reconstructedSubProgresivas, // Renombrar la propiedad
            estratosSeleccionados,
            tiposEnsayoIds
        };
        const result = await progresivasService.updateAndImportConEnsayos(overwriteProgresivaId, servicePayload);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al actualizar e importar tramo ${overwriteProgresivaId}:`, error.stack); // Loguear el stack completo
        if (error && error.type) {
            const statusCode = error.type === 'ExcelDataValidationError' ? 400 : 500;
            res.status(statusCode).json(error);
        } else {
            res.status(500).json({ error: `Error en /progresivas/importar-con-ensayos/${overwriteProgresivaId}`, details: error.message || 'Error desconocido' });
        }
    }
});

// NEW: Endpoint to upload a KML file for a progresiva
app.post('/api/progresivas/:progresivaId/upload-kml', authenticateToken, upload.single('kmlFile'), async (req, res) => {
    const { progresivaId } = req.params;
    const { file } = req; // Multer places the file here
    const userId = req.user.id; // Get authenticated user ID
    try {
        if (!file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo KML.' });
        }
        // Call the service function to handle KML processing and saving
        const result = await progresivasService.uploadKmlToProgresiva(progresivaId, file, userId); // Pass userId
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al subir KML para la progresiva ${progresivaId}:`, error);
        // Custom error handling for service-level errors
        if (error.isCustomError) { // Assuming custom errors have an 'isCustomError' flag
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al subir KML a la progresiva.' });
    }
});

// NEW: Endpoint to get KML content by kml_trazado_id
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

// NEW: Endpoint to delete KML from a progresiva
app.delete('/api/progresivas/:progresivaId/kml', authenticateToken, async (req, res) => {
    const { progresivaId } = req.params;
    try {
        const result = await progresivasService.deleteKmlFromProgresiva(progresivaId);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al eliminar KML de la progresiva ${progresivaId}:`, error);
        if (error.isCustomError) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al eliminar KML de la progresiva.' });
    }
});

// Obtener progresivas principales
app.get('/progresivas', authenticateToken, async (req, res) => {
    try {
        const { selectedProjectId } = req.query; // Get selectedProjectId from query parameters
        const progresivas = await progresivasService.getProgresivas(req.user, selectedProjectId);
        res.json(progresivas);
    } catch (err) {
        console.error('Error al obtener progresivas:', err);
        res.status(500).json({ error: 'Error al obtener progresivas', details: err.message });
    }
});

app.get('/progresivas/:id/children', authenticateToken, progresivasService.getSubProgresivas);

// Nueva ruta para TODAS las sub-progresivas (para el Listado General)
app.get('/progresivas/:id/children/all', authenticateToken, progresivasService.getAllSubProgresivas);

app.get('/progresivas/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const progresiva = await progresivasService.getProgresivaById(id);
        if (!progresiva) {
            return res.status(404).json({ error: 'Progresiva no encontrada' });
        }
        res.json(progresiva);
    } catch (err) {
        console.error('Error al obtener progresiva por ID:', err);
        res.status(500).json({ error: 'Error al obtener progresiva por ID', details: err.message });
    }
});

app.get('/progresivas/:progresivaId/page', authenticateToken, async (req, res) => {
    const { progresivaId } = req.params;
    try {
        const result = await progresivasService.getProgresivaPage(progresivaId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Error getting progresiva page', details: err.message });
    }
});

// Nueva ruta para obtener progresivas por proyectoId
app.get('/api/progresivas/proyecto/:proyectoId', authenticateToken, async (req, res) => {
    const { proyectoId } = req.params;
    try {
        const progresivas = await progresivasService.getProgresivasByProyectoId(proyectoId);
        res.json(progresivas);
    } catch (err) {
        console.error('Error al obtener progresivas por proyectoId:', err);
        res.status(500).json({ error: 'Error al obtener progresivas por proyectoId', details: err.message });
    }
});

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

app.delete('/progresivas/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await progresivasService.deleteProgresiva(id);
        if (rowCount > 0) {
            res.json({ status: 'ok', mensaje: 'Progresiva eliminada correctamente' });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Progresiva no encontrada' });
        }
    } catch (err) {
        console.error('Error al eliminar progresiva:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al eliminar progresiva' });
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

app.put('/progresivas/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await progresivasService.updateProgresiva(id, req.body);
        res.json(result);
    } catch (err) {
        console.error('Error al actualizar progresiva:', err);
        res.status(500).json({ error: 'Error al actualizar la progresiva', details: err.message });
    }
});

app.put('/progresivas/child/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await progresivasService.updateChildProgresiva(id, req.body);
        res.json(result);
    } catch (err) {
        console.error('Error al actualizar progresiva hija:', err);
        res.status(500).json({ error: 'Error al actualizar la progresiva hija', details: err.message });
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

// NEW: Ruta para crear un ensayo de granulometría
app.post('/api/ensayos/granulometria', authenticateToken, async (req, res) => {
    try {
        const newGranulometria = await granulometriaService.createGranulometria(req.body);
        res.status(201).json(newGranulometria);
    } catch (err) {
        console.error('Error al crear ensayo de granulometría:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el ensayo de granulometría' });
    }
});

// NEW: Ruta para crear un ensayo de límite líquido
app.post('/api/ensayos/limite-liquido', authenticateToken, async (req, res) => {
    try {
        const newLimiteLiquido = await limiteLiquidoService.createLimiteLiquido(req.body);
        res.status(201).json(newLimiteLiquido);
    } catch (err) {
        console.error('Error al crear ensayo de límite líquido:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el ensayo de límite líquido' });
    }
});

// NEW: Ruta para crear un ensayo de límite plástico
app.post('/api/ensayos/limite-plastico', authenticateToken, async (req, res) => {
    try {
        const newLimitePlastico = await limitePlasticoService.createLimitePlastico(req.body);
        res.status(201).json(newLimitePlastico);
    } catch (err) {
        console.error('Error al crear ensayo de límite plástico:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el ensayo de límite plástico' });
    }
});

// NEW: Ruta para actualizar un ensayo de granulometría
app.put('/api/ensayos/granulometria/:ensayo_id', authenticateToken, async (req, res) => {
    const { ensayo_id } = req.params;
    try {
        const updated = await granulometriaService.updateGranulometria(ensayo_id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error al actualizar ensayo de granulometría:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar el ensayo de granulometría' });
    }
});

// NEW: Ruta para actualizar un ensayo de límite líquido
app.put('/api/ensayos/limite-liquido/:ensayo_id', authenticateToken, async (req, res) => {
    const { ensayo_id } = req.params;
    try {
        const updated = await limiteLiquidoService.updateLimiteLiquido(ensayo_id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error al actualizar ensayo de límite líquido:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar el ensayo de límite líquido' });
    }
});

// NEW: Ruta para actualizar un ensayo de límite plástico
app.put('/api/ensayos/limite-plastico/:ensayo_id', authenticateToken, async (req, res) => {
    const { ensayo_id } = req.params;
    try {
        const updated = await limitePlasticoService.updateLimitePlastico(ensayo_id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error al actualizar ensayo de límite plástico:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar el ensayo de límite plástico' });
    }
});

// NEW: Ruta para obtener todos los ensayos de un tramo específico
app.get('/api/tramos/:tramoId/ensayos', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    try {
        // También necesitamos obtener el nombre del tramo para mostrarlo en el frontend
        const tramoResult = await db.query('SELECT nombre, codigo FROM progresivas WHERE id = $1', [tramoId]);
        if (tramoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tramo no encontrado.' });
        }
        const tramo = tramoResult.rows[0];
        const ensayos = await ensayosService.getEnsayosByTramoId(tramoId);
        res.json({ tramo, ensayos });
    } catch (err) {
        console.error(`Error al obtener ensayos para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener ensayos por tramo', details: err.message });
    }
});

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
                isSimulation === 'true' // PASAR el booleano
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

app.post('/api/trafico/exportar-kml', authenticateToken, (req, res) => {
    console.log('INFO: Se ha recibido una solicitud en /api/trafico/exportar-kml'); // Log de entrada
    const geojsonData = req.body;
    if (!geojsonData) {
        console.error('ERROR: No se proporcionaron datos GeoJSON en la solicitud.');
        return res.status(400).json({ error: 'No se proporcionaron datos GeoJSON.' });
    }

    try {
        const kmlData = tokml(geojsonData, {
            name: 'nombre', // Usa la propiedad 'nombre' de cada feature como el nombre del lugar
            description: 'descripcion' // Usa la propiedad 'descripcion' para la descripción
        });

        res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        res.setHeader('Content-Disposition', 'attachment; filename="export.kml"');
        res.send(kmlData);
        console.log('INFO: Se ha exportado el archivo KML correctamente.');
    } catch (error) {
        console.error('ERROR: Fallo en la conversión a KML:', error.stack);
        res.status(500).json({ error: 'Error interno al generar el archivo KML.' });
    }
});

app.post('/api/trafico/exportar-shapefile', authenticateToken, async (req, res) => {
    console.log('INFO: Solicitud recibida para exportar Shapefile (manejando múltiples geometrías)');
    const geojsonData = req.body;
    if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos GeoJSON válidos o están vacíos.' });
    }

    const tempFilesToClean = []; // Para mantener un registro de todos los archivos temporales

    try {
        const uniqueExportId = Date.now();
        const outputShapefileZipName = `export_shapefiles_${uniqueExportId}.zip`;
        const outputShapefileZipPath = path.join(__dirname, outputShapefileZipName);
        tempFilesToClean.push(outputShapefileZipPath); // Añadir el ZIP final de este Shapefile a la lista de limpieza

        const archive = archiver('zip', {
            zlib: { level: 9 } // Nivel de compresión
        });
        const output = fs.createWriteStream(outputShapefileZipPath);

        await new Promise((resolve, reject) => {
            output.on('close', () => {
                console.log(`DEBUG: Archivo ZIP de Shapefile creado: ${outputShapefileZipPath}`);
                resolve();
            });
            archive.on('error', err => reject(err));
            archive.pipe(output);
        });

        // Agrupar features por tipo de geometría
        const groupedFeatures = {
            Point: [],
            LineString: [],
            Polygon: []
        };

        geojsonData.features.forEach(feature => {
            if (feature.geometry && groupedFeatures[feature.geometry.type]) {
                groupedFeatures[feature.geometry.type].push(feature);
            } else {
                console.warn(`ADVERTENCIA: Geometría de tipo desconocido o no soportado: ${feature.geometry ? feature.geometry.type : 'N/A'}`);
            }
        });

        // Procesar cada grupo de geometría
        for (const geoType in groupedFeatures) {
            const features = groupedFeatures[geoType];
            if (features.length > 0) {
                const tempGeoJsonFileName = `temp_${geoType}_${uniqueExportId}.json`;
                const tempGeoJsonPath = path.join(__dirname, tempGeoJsonFileName);
                tempFilesToClean.push(tempGeoJsonPath);

                const tempShapefileDirName = `${geoType}_shapefile_dir_${uniqueExportId}`;
                const tempShapefileDirPath = path.join(__dirname, tempShapefileDirName);
                tempFilesToClean.push(tempShapefileDirPath); // Añadir el directorio temporal a la lista de limpieza

                const outputShapefileZipName = `${geoType}_shapefile.zip`;
                const outputShapefileZipPath = path.join(__dirname, outputShapefileZipName);
                tempFilesToClean.push(outputShapefileZipPath); // Añadir el ZIP final de este Shapefile a la lista de limpieza

                const geoJsonForType = {
                    type: 'FeatureCollection',
                    features: features
                };

                await fsp.writeFile(tempGeoJsonPath, JSON.stringify(geoJsonForType));
                console.log(`DEBUG: GeoJSON temporal para ${geoType} guardado en: ${tempGeoJsonPath}`);

                // Ejecutar ogr2ogr para crear el directorio del Shapefile
                // ogr2ogr creará los archivos .shp, .shx, .dbf, etc. dentro de tempShapefileDirPath
                const ogr2ogrCommand = `ogr2ogr -f "ESRI Shapefile" -overwrite "${tempShapefileDirPath}" "${tempGeoJsonPath}" -nln ${geoType.toLowerCase()} -skipfailures 2>&1`;
                console.log(`DEBUG: Ejecutando comando ogr2ogr para ${geoType}: ${ogr2ogrCommand}`);

                await new Promise((resolve, reject) => {
                    exec(ogr2ogrCommand, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`ERROR: ogr2ogr falló para ${geoType}: ${error.message}`);
                            console.error(`ogr2ogr stdout/stderr combinado para ${geoType}: ${stdout}`);
                            return reject(new Error(`ogr2ogr conversion failed for ${geoType}: ${stdout}`));
                        }
                        console.log(`ogr2ogr stdout/stderr combinado para ${geoType}: ${stdout}`);
                        resolve();
                    });
                });

                console.log(`DEBUG: Directorio Shapefile para ${geoType} creado en: ${tempShapefileDirPath}`);

                // Comprimir el directorio del Shapefile en un archivo ZIP
                const shapefileArchiver = archiver('zip', {
                    zlib: { level: 9 }
                });
                const output = fs.createWriteStream(outputShapefileZipPath);

                await new Promise((resolve, reject) => {
                    output.on('close', () => {
                        console.log(`DEBUG: Archivo ZIP de Shapefile para ${geoType} creado: ${outputShapefileZipPath}`);
                        resolve();
                    });
                    shapefileArchiver.on('error', err => reject(err));
                    shapefileArchiver.directory(tempShapefileDirPath, false); // false para no incluir el directorio raíz
                    shapefileArchiver.finalize();
                    shapefileArchiver.pipe(output);
                });

                // Añadir el archivo ZIP de Shapefile generado al archivo ZIP final de la respuesta
                const finalShapefileZipBuffer = await fsp.readFile(outputShapefileZipPath);
                archive.append(finalShapefileZipBuffer, { name: outputShapefileZipName });
            }
        }

        await archive.finalize(); // Finalizar el archivo ZIP principal
        console.log('INFO: Archivo Shapefile (ZIP) principal enviado correctamente.');

        // Configurar la respuesta para la descarga
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="export_shapefiles_${uniqueExportId}.zip"`);
        archive.pipe(res);

    } catch (error) {
        console.error('ERROR: Fallo en la exportación a Shapefile con ogr2ogr (manejo de múltiples geometrías):', error.stack);
        res.status(500).json({ error: `Error interno al generar el archivo Shapefile: ${error.message}` });
    } finally {
        // Limpiar todos los archivos temporales
        for (const filePath of tempFilesToClean) {
            await fsp.unlink(filePath).catch(err => {
                if (err.code !== 'ENOENT' && err.code !== 'EISDIR') {
                    console.error(`Error al eliminar archivo temporal ${filePath}: ${err.message}`);
                }
            });
        }
        console.log('DEBUG: Archivos temporales limpiados.');
    }
});
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

// Endpoint para obtener el trazado más reciente
app.get('/api/trafico/obtener-trazado', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT nombre, ST_AsGeoJSON(geom) AS geojson
            FROM rutas
            ORDER BY id DESC
            LIMIT 1;
        `);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'No se encontró ningún trazado.' });
        }
    } catch (err) {
        console.error('Error al obtener trazado:', err);
        res.status(500).json({ status: 'error', message: 'Error al obtener el trazado del servidor', details: err.message });
    }
});

// --------------------- TRAZADO DE MAPA ---------------------
app.post('/api/trafico/guardar-trazado', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { nombre, puntos } = req.body; // puntos será un array de {lat, lng}

    if (!nombre || !puntos || !Array.isArray(puntos) || puntos.length < 2) {
        return res.status(400).json({ error: 'Nombre y al menos dos puntos son requeridos para el trazado.' });
    }

    try {
        // Construir la cadena de puntos para ST_MakeLine
        // ST_MakePoint(longitude, latitude)
        const pointStrings = puntos.map(p => `ST_MakePoint(${p.lng}, ${p.lat})`).join(', ');

        const query = `
            INSERT INTO rutas (nombre, geom)
            VALUES ($1, ST_SetSRID(ST_MakeLine(ARRAY[${pointStrings}]), 4326))
            RETURNING id;
        `;

        const result = await db.query(query, [nombre]);
        res.status(201).json({ status: 'ok', message: 'Trazado guardado correctamente', id: result.rows[0].id });
    } catch (err) {
        console.error('Error al guardar trazado:', err);
        res.status(500).json({ status: 'error', message: 'Error al guardar el trazado en el servidor', details: err.message });
    }
});

app.delete('/api/trafico/delete-image', authenticateToken, async (req, res) => {
    const { stationId, imageUrl } = req.body;
    try {
        const result = await db.query('DELETE FROM trafico_imagenes WHERE station_id = $1 AND image_url = $2', [stationId, imageUrl]);
        if (result.rowCount > 0) {
            res.json({ status: 'ok', message: 'Imagen eliminada correctamente' });
        } else {
            res.status(404).json({ status: 'error', message: 'Imagen no encontrada' });
        }
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar la imagen.' });
    }
});

// Nueva ruta para eliminar un grupo de imágenes
app.delete('/api/trafico/delete-image-group', authenticateToken, async (req, res) => {
    const { stationId, description, uploadDate } = req.body;
    try {
        const result = await db.query('DELETE FROM trafico_imagenes WHERE station_id = $1 AND description = $2 AND upload_date = $3', [stationId, description, uploadDate]);
        if (result.rowCount > 0) {
            res.json({ status: 'ok', message: `Se eliminaron ${result.rowCount} imágenes del grupo.` });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontraron imágenes para eliminar en este grupo.' });
        }
    } catch (error) {
        console.error('Error al eliminar grupo de imágenes:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar el grupo de imágenes.' });
    }
});

app.get('/api/trafico/download-excel', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('URL query parameter is required.');
    }

    // Use axios to fetch the file as a stream
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    // Set the content type from the original response
    res.setHeader('Content-Type', response.headers['content-type']);
    // Pipe the stream to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('Error proxying Excel download:', error);
    res.status(500).send('Error downloading file.');
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
        } finally {
            client.release();
        }
    });

    socket.on('restart_draw', async () => {
        if (!isOrganizer) { // Re-check authorization
            return socket.emit('error_event', { message: 'No tienes permiso para reiniciar el sorteo.' });
        }
        
        console.log(`🔄 Sorteo reiniciado por ${socket.data.user.nombre}!`);

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM amigo_secreto_asignaciones WHERE evento_id = 1');
            await client.query('UPDATE amigo_secreto_eventos SET es_sorteo_iniciado = false WHERE id = 1');
            await client.query('COMMIT');

            io.emit('draw_restarted');

        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Fallo la transacción de reinicio:', e);
            io.emit('error_event', { message: 'Error en el servidor al reiniciar el sorteo.' });
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


const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}`);
    console.log('🚀🚀🚀 Backend del Geoportal con WebSockets - ¡NUEVA VERSION EN LINEA! 🚀🚀🚀');
});

// Aumentar timeouts para manejar subidas largas
server.keepAliveTimeout = 600 * 1000; // 10 minutos
server.headersTimeout = 610 * 1000; // 10 minutos y 10 segundos
server.timeout = 600 * 1000; // 10 minutos (reemplaza a setTimeout)