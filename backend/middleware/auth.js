/**
 * Middlewares de autenticación y autorización, compartidos por todos los
 * routers. Extraídos de index.js sin modificar una línea (fase B4).
 */

const jwt = require('jsonwebtoken');
const db = require('../conexion');

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
                return res.sendStatus(403);
            }

            const user = userResult.rows[0];
            const permissions = await usuariosService.getUserPermissions(user.id, user.rol_id);

            user.permissions = permissions;
            req.user = user;

            next();
        } catch (err) {
            console.error("Error en middleware de autenticación:", err);
            return res.sendStatus(403);
        }
    } else {
        res.sendStatus(401);
    }
};


const authorizeGeologyManage = async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });

    // Convertir a número por seguridad
    const roleId = parseInt(req.user.rol_id, 10);
    const specialtyId = parseInt(req.user.codigo_esp, 10);
    const roleName = req.user.rol_nombre;

    const isAdmin = roleName === 'ADMIN';
    // Especialista en Geología (Código 2)
    const isSpecialistGeology = specialtyId === 2;
    // Evaluador (Rol 6) con especialidad en Geología (Código 2)
    const isEvaluatorGeology = roleId === 6 && specialtyId === 2;

    if (isAdmin || isSpecialistGeology || isEvaluatorGeology) {
        return next();
    }

    return res.status(403).json({ error: 'Acceso denegado: No tiene permisos de gestión en el módulo de Geología' });
};

// Middleware de autorización para ADMIN y COORDINADOR PROYECTO
const authorizeDisenoGeometricoManage = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });

    const isAdmin = req.user.rol_nombre === 'ADMIN';
    const isCoordinator = req.user.rol_nombre === 'COORDINADOR PROYECTO';

    if (isAdmin || isCoordinator) {
        return next();
    }

    return res.status(403).json({ error: 'Acceso denegado: No tiene permisos de gestion en Diseno Geometrico' });
};

const authorizeAdminOrCoordinator = (req, res, next) => {
    if (!req.user || (req.user.rol_nombre !== 'ADMIN' && req.user.rol_nombre !== 'COORDINADOR PROYECTO')) {
        return res.status(403).json({ error: 'Acceso denegado: Rol no autorizado' });
    }
    next();
};

// Middleware de autorización genérico para permisos específicos
const authorizePermission = (permissionName, requiredAccessType) => {
    return (req, res, next) => {
        const { user } = req;

        // Si el usuario es ADMIN, tiene acceso total a todo.
        if (user && user.rol_nombre === 'ADMIN') {
            return next();
        }

        const userPermissions = user ? user.permissions : {};
        const userAccess = userPermissions ? userPermissions[permissionName] : undefined;

        if (!userAccess) {
            return res.status(403).json({ error: `Acceso denegado. No tienes permisos para el módulo '${permissionName}'.` });
        }

        const hasPermission = (required, userPerm) => {
            if (required === 'lectura') {
                return userPerm === 'lectura' || userPerm === 'edicion';
            }
            if (required === 'edicion') {
                return userPerm === 'edicion';
            }
            return false;
        };

        if (hasPermission(requiredAccessType, userAccess)) {
            next();
        } else {
            return res.status(403).json({ error: `Acceso denegado. Se requiere permiso de '${requiredAccessType}' para el módulo '${permissionName}'.` });
        }
    };
};

module.exports = {
    authenticateToken,
    authorizeGeologyManage,
    authorizeDisenoGeometricoManage,
    authorizeAdminOrCoordinator,
    authorizePermission,
};
