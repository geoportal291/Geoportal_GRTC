/**
 * Rutas del dominio de usuarios.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/usuarios pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const db = require('../conexion');
const usuariosService = require('../services/usuariosService');
const { authenticateToken, authorizeAdminOrCoordinator, authorizePermission } = require('../middleware/auth');

const router = express.Router();

// --------------------- USUARIOS ---------------------
router.post('/', authenticateToken, authorizePermission('usuarios', 'edicion'), async (req, res) => {
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

router.get('/', authenticateToken, authorizePermission('usuarios', 'lectura'), async (req, res) => {
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
router.get('/dni/:dni', authenticateToken, async (req, res) => {
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
router.get('/por-proyecto', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const usersByProject = await usuariosService.getUsersGroupedByProject();
        res.json(usersByProject);
    } catch (err) {
        console.error('Error al obtener usuarios por proyecto:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener usuarios por proyecto' });
    }
});

router.get('/:id', authenticateToken, authorizePermission('usuarios', 'lectura'), async (req, res) => {
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

router.delete('/:dni', authenticateToken, authorizePermission('usuarios', 'edicion'), async (req, res) => {
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

router.put('/:dni', authenticateToken, authorizePermission('usuarios', 'edicion'), async (req, res) => {
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

module.exports = router;
