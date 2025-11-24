// backend/services/puntosMapaService.js
const db = require('../conexion');

const createPunto = async (puntoData) => {
    const { nombre, descripcion, latitud, longitud } = puntoData;

    if (latitud === undefined || longitud === undefined) {
        throw new Error('Latitud y longitud son requeridas.');
    }

    try {
        const result = await db.query(
            `INSERT INTO puntos_mapa (nombre, descripcion, latitud, longitud)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [nombre, descripcion, latitud, longitud]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error al crear punto en el servicio:', err);
        throw new Error('Error al crear el punto en la base de datos.');
    }
};

module.exports = {
    createPunto,
};
