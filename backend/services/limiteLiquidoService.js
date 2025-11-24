// backend/services/limiteLiquidoService.js
const db = require('../conexion'); // Reusing the database connection pool

const createLimiteLiquido = async (limiteLiquidoData) => {
    const {
        ensayo_id, proyecto, tramo, progresiva, estrato_id,
        ll_resultado,
        ll_ensayo1_golpes, ll_ensayo1_cod_recipiente, ll_ensayo1_peso_recipiente, ll_ensayo1_peso_humedo, ll_ensayo1_peso_seco,
        ll_ensayo2_golpes, ll_ensayo2_cod_recipiente, ll_ensayo2_peso_recipiente, ll_ensayo2_peso_humedo, ll_ensayo2_peso_seco,
        ll_ensayo3_golpes, ll_ensayo3_cod_recipiente, ll_ensayo3_peso_recipiente, ll_ensayo3_peso_humedo, ll_ensayo3_peso_seco
    } = limiteLiquidoData;

    try {
        const result = await db.query(
            `INSERT INTO limite_liquido_ensayos (
                ensayo_id, proyecto, tramo, progresiva, estrato_id,
                ll_resultado,
                ll_ensayo1_golpes, ll_ensayo1_cod_recipiente, ll_ensayo1_peso_recipiente, ll_ensayo1_peso_humedo, ll_ensayo1_peso_seco,
                ll_ensayo2_golpes, ll_ensayo2_cod_recipiente, ll_ensayo2_peso_recipiente, ll_ensayo2_peso_humedo, ll_ensayo2_peso_seco,
                ll_ensayo3_golpes, ll_ensayo3_cod_recipiente, ll_ensayo3_peso_recipiente, ll_ensayo3_peso_humedo, ll_ensayo3_peso_seco
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING *`,
            [
                ensayo_id, proyecto, tramo, progresiva, estrato_id,
                ll_resultado,
                ll_ensayo1_golpes, ll_ensayo1_cod_recipiente, ll_ensayo1_peso_recipiente, ll_ensayo1_peso_humedo, ll_ensayo1_peso_seco,
                ll_ensayo2_golpes, ll_ensayo2_cod_recipiente, ll_ensayo2_peso_recipiente, ll_ensayo2_peso_humedo, ll_ensayo2_peso_seco,
                ll_ensayo3_golpes, ll_ensayo3_cod_recipiente, ll_ensayo3_peso_recipiente, ll_ensayo3_peso_humedo, ll_ensayo3_peso_seco
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error al crear ensayo de límite líquido en service:', err);
        throw new Error('Error al crear el ensayo de límite líquido.');
    }
};

const updateLimiteLiquido = async (ensayo_id, limiteLiquidoData) => {
    const {
        proyecto, tramo, progresiva, estrato_id,
        ll_resultado,
        ll_ensayo1_golpes, ll_ensayo1_cod_recipiente, ll_ensayo1_peso_recipiente, ll_ensayo1_peso_humedo, ll_ensayo1_peso_seco,
        ll_ensayo2_golpes, ll_ensayo2_cod_recipiente, ll_ensayo2_peso_recipiente, ll_ensayo2_peso_humedo, ll_ensayo2_peso_seco,
        ll_ensayo3_golpes, ll_ensayo3_cod_recipiente, ll_ensayo3_peso_recipiente, ll_ensayo3_peso_humedo, ll_ensayo3_peso_seco
    } = limiteLiquidoData;

    try {
        const result = await db.query(
            `UPDATE limite_liquido_ensayos SET
                proyecto = $1, tramo = $2, progresiva = $3, estrato_id = $4,
                ll_resultado = $5,
                ll_ensayo1_golpes = $6, ll_ensayo1_cod_recipiente = $7, ll_ensayo1_peso_recipiente = $8, ll_ensayo1_peso_humedo = $9, ll_ensayo1_peso_seco = $10,
                ll_ensayo2_golpes = $11, ll_ensayo2_cod_recipiente = $12, ll_ensayo2_peso_recipiente = $13, ll_ensayo2_peso_humedo = $14, ll_ensayo2_peso_seco = $15,
                ll_ensayo3_golpes = $16, ll_ensayo3_cod_recipiente = $17, ll_ensayo3_peso_recipiente = $18, ll_ensayo3_peso_humedo = $19, ll_ensayo3_peso_seco = $20
            WHERE ensayo_id = $21
            RETURNING *`,
            [
                proyecto, tramo, progresiva, estrato_id,
                ll_resultado,
                ll_ensayo1_golpes, ll_ensayo1_cod_recipiente, ll_ensayo1_peso_recipiente, ll_ensayo1_peso_humedo, ll_ensayo1_peso_seco,
                ll_ensayo2_golpes, ll_ensayo2_cod_recipiente, ll_ensayo2_peso_recipiente, ll_ensayo2_peso_humedo, ll_ensayo2_peso_seco,
                ll_ensayo3_golpes, ll_ensayo3_cod_recipiente, ll_ensayo3_peso_recipiente, ll_ensayo3_peso_humedo, ll_ensayo3_peso_seco,
                ensayo_id
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar ensayo de límite líquido en service:', err);
        throw new Error('Error al actualizar el ensayo de límite líquido.');
    }
};

module.exports = {
    createLimiteLiquido,
    updateLimiteLiquido,
};
