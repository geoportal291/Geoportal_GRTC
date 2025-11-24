// backend/services/limitePlasticoService.js
const db = require('../conexion'); // Reusing the database connection pool

const createLimitePlastico = async (limitePlasticoData) => {
    const {
        ensayo_id, proyecto, tramo, progresiva, estrato_id,
        lp_resultado, ip_resultado,
        lp_ensayo1_cod_recipiente, lp_ensayo1_peso_recipiente, lp_ensayo1_peso_humedo, lp_ensayo1_peso_seco,
        lp_ensayo2_cod_recipiente, lp_ensayo2_peso_recipiente, lp_ensayo2_peso_humedo, lp_ensayo2_peso_seco
    } = limitePlasticoData;

    try {
        const result = await db.query(
            `INSERT INTO limite_plastico_ensayos (
                ensayo_id, proyecto, tramo, progresiva, estrato_id,
                lp_resultado, ip_resultado,
                lp_ensayo1_cod_recipiente, lp_ensayo1_peso_recipiente, lp_ensayo1_peso_humedo, lp_ensayo1_peso_seco,
                lp_ensayo2_cod_recipiente, lp_ensayo2_peso_recipiente, lp_ensayo2_peso_humedo, lp_ensayo2_peso_seco
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                ensayo_id, proyecto, tramo, progresiva, estrato_id,
                lp_resultado, ip_resultado,
                lp_ensayo1_cod_recipiente, lp_ensayo1_peso_recipiente, lp_ensayo1_peso_humedo, lp_ensayo1_peso_seco,
                lp_ensayo2_cod_recipiente, lp_ensayo2_peso_recipiente, lp_ensayo2_peso_humedo, lp_ensayo2_peso_seco
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error al crear ensayo de límite plástico en service:', err);
        throw new Error('Error al crear el ensayo de límite plástico.');
    }
};

const updateLimitePlastico = async (ensayo_id, limitePlasticoData) => {
    const {
        proyecto, tramo, progresiva, estrato_id,
        lp_resultado, ip_resultado,
        lp_ensayo1_cod_recipiente, lp_ensayo1_peso_recipiente, lp_ensayo1_peso_humedo, lp_ensayo1_peso_seco,
        lp_ensayo2_cod_recipiente, lp_ensayo2_peso_recipiente, lp_ensayo2_peso_humedo, lp_ensayo2_peso_seco
    } = limitePlasticoData;

    try {
        const result = await db.query(
            `UPDATE limite_plastico_ensayos SET
                proyecto = $1, tramo = $2, progresiva = $3, estrato_id = $4,
                lp_resultado = $5, ip_resultado = $6,
                lp_ensayo1_cod_recipiente = $7, lp_ensayo1_peso_recipiente = $8, lp_ensayo1_peso_humedo = $9, lp_ensayo1_peso_seco = $10,
                lp_ensayo2_cod_recipiente = $11, lp_ensayo2_peso_recipiente = $12, lp_ensayo2_peso_humedo = $13, lp_ensayo2_peso_seco = $14
            WHERE ensayo_id = $15
            RETURNING *`,
            [
                proyecto, tramo, progresiva, estrato_id,
                lp_resultado, ip_resultado,
                lp_ensayo1_cod_recipiente, lp_ensayo1_peso_recipiente, lp_ensayo1_peso_humedo, lp_ensayo1_peso_seco,
                lp_ensayo2_cod_recipiente, lp_ensayo2_peso_recipiente, lp_ensayo2_peso_humedo, lp_ensayo2_peso_seco,
                ensayo_id
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar ensayo de límite plástico en service:', err);
        throw new Error('Error al actualizar el ensayo de límite plástico.');
    }
};

module.exports = {
    createLimitePlastico,
    updateLimitePlastico,
};
