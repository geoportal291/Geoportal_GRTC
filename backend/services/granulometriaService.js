// backend/services/granulometriaService.js
const db = require('../conexion'); // Reusing the database connection pool

const createGranulometria = async (granulometriaData) => {
    const {
        ensayo_id, proyecto, tramo, progresiva, estrato_id,
        peso_total, peso_antes_lavado, peso_despues_lavado,
        retenido_3in, retenido_2in, retenido_1_5in, retenido_1in,
        retenido_3_4in, retenido_3_8in, retenido_N4, retenido_N10,
        retenido_N20, retenido_N40, retenido_N60, retenido_N140, retenido_N200,
        porc_grava, porc_arena, porc_finos, cu, cc, d10, d30, d60,
        clasificacion_sucs, clasificacion_aashto, indice_grupo
    } = granulometriaData;

    try {
        const result = await db.query(
            `INSERT INTO granulometria_ensayos (
                ensayo_id, proyecto, tramo, progresiva, estrato_id,
                peso_total, peso_antes_lavado, peso_despues_lavado,
                retenido_3in, retenido_2in, retenido_1_5in, retenido_1in,
                retenido_3_4in, retenido_3_8in, retenido_N4, retenido_N10,
                retenido_N20, retenido_N40, retenido_N60, retenido_N140, retenido_N200,
                porc_grava, porc_arena, porc_finos, cu, cc, d10, d30, d60,
                clasificacion_sucs, clasificacion_aashto, indice_grupo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
            RETURNING *`,
            [
                ensayo_id, proyecto, tramo, progresiva, estrato_id,
                peso_total, peso_antes_lavado, peso_despues_lavado,
                retenido_3in, retenido_2in, retenido_1_5in, retenido_1in,
                retenido_3_4in, retenido_3_8in, retenido_N4, retenido_N10,
                retenido_N20, retenido_N40, retenido_N60, retenido_N140, retenido_N200,
                porc_grava, porc_arena, porc_finos, cu, cc, d10, d30, d60,
                clasificacion_sucs, clasificacion_aashto, indice_grupo
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error al crear ensayo de granulometría en service:', err);
        throw new Error('Error al crear el ensayo de granulometría.');
    }
};

const updateGranulometria = async (ensayo_id, granulometriaData) => {
    const {
        proyecto, tramo, progresiva, estrato_id,
        peso_total, peso_antes_lavado, peso_despues_lavado,
        retenido_3in, retenido_2in, retenido_1_5in, retenido_1in,
        retenido_3_4in, retenido_3_8in, retenido_N4, retenido_N10,
        retenido_N20, retenido_N40, retenido_N60, retenido_N140, retenido_N200,
        porc_grava, porc_arena, porc_finos, cu, cc, d10, d30, d60,
        clasificacion_sucs, clasificacion_aashto, indice_grupo
    } = granulometriaData;

    try {
        const result = await db.query(
            `UPDATE granulometria_ensayos SET
                proyecto = $1, tramo = $2, progresiva = $3, estrato_id = $4,
                peso_total = $5, peso_antes_lavado = $6, peso_despues_lavado = $7,
                retenido_3in = $8, retenido_2in = $9, retenido_1_5in = $10, retenido_1in = $11,
                retenido_3_4in = $12, retenido_3_8in = $13, retenido_n4 = $14, retenido_n10 = $15,
                retenido_n20 = $16, retenido_n40 = $17, retenido_n60 = $18, retenido_n140 = $19, retenido_n200 = $20,
                porc_grava = $21, porc_arena = $22, porc_finos = $23, cu = $24, cc = $25, d10 = $26, d30 = $27, d60 = $28,
                clasificacion_sucs = $29, clasificacion_aashto = $30, indice_grupo = $31
            WHERE ensayo_id = $32
            RETURNING *`,
            [
                proyecto, tramo, progresiva, estrato_id,
                peso_total, peso_antes_lavado, peso_despues_lavado,
                retenido_3in, retenido_2in, retenido_1_5in, retenido_1in,
                retenido_3_4in, retenido_3_8in, retenido_N4, retenido_N10,
                retenido_N20, retenido_N40, retenido_N60, retenido_N140, retenido_N200,
                porc_grava, porc_arena, porc_finos, cu, cc, d10, d30, d60,
                clasificacion_sucs, clasificacion_aashto, indice_grupo,
                ensayo_id
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar ensayo de granulometría en service:', err);
        throw new Error('Error al actualizar el ensayo de granulometría.');
    }
};

module.exports = {
    createGranulometria,
    updateGranulometria,
};
