// backend/services/distritosService.js
const db = require('../conexion');

const getDepartamentos = async () => {
    try {
        const result = await db.query('SELECT codigo_departamento AS id, nombre FROM codigo_departamentos ORDER BY nombre');
        return result.rows;
    } catch (err) {
        console.error('Error al obtener departamentos en service:', err);
        throw new Error('Error al obtener departamentos.');
    }
};

const getProvincias = async (codigo_departamento) => {
    try {
        const result = await db.query('SELECT codigo_provincia AS id, nombre FROM provincias WHERE codigo_departamento = $1 ORDER BY nombre', [codigo_departamento]);
        return result.rows;
    } catch (err) {
        console.error('Error al obtener provincias en service:', err);
        throw new Error('Error al obtener provincias.');
    }
};

const getDistritos = async (codigo_provincia) => {
    try {
        const result = await db.query('SELECT codigo_distrito AS id, nombre FROM distritos WHERE codigo_provincia = $1 ORDER BY nombre', [codigo_provincia]);
        return result.rows;
    } catch (err) {
        console.error('Error al obtener distritos en service:', err);
        throw new Error('Error al obtener distritos.');
    }
};

module.exports = {
    getDepartamentos,
    getProvincias,
    getDistritos,
};
