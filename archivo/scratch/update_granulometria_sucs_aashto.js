const db = require('../backend/conexion');

async function main() {
    try {
        console.log("Iniciando la actualización de la tabla tipo_ensayo para Granulometría (ID: 1)...");

        // 1. Definir los nuevos general_fields que incluyen limite_liquido e indice_plasticidad
        const generalFields = [
            {"key": "peso_total", "type": "number", "label": "Peso Total (g)"},
            {"key": "peso_fina_tamizada", "type": "number", "label": "Peso de Fracción Fina para Tamizado (g)"},
            {"key": "peso_muestra_lavada", "type": "calculated", "label": "Peso Muestra Lavada (g)"},
            {"key": "peso_fraccion_gruesa", "type": "calculated", "label": "Peso de la Fracción Gruesa (g)"},
            {"key": "peso_fraccion_fina", "type": "calculated", "label": "Peso Fracción Fina (g)"},
            {"key": "coeficiente", "type": "calculated", "label": "Coeficiente"},
            {"key": "limite_liquido", "type": "number", "label": "Límite Líquido (%)"},
            {"key": "indice_plasticidad", "type": "number", "label": "Índice de Plasticidad (%)"},
            {"key": "gradacion", "type": "text", "label": "Gradación"}
        ];

        // Obtener la fila actual de granulometría
        const currentResult = await db.query('SELECT config_tabla, config_calculos FROM tipo_ensayo WHERE id = 1');
        if (currentResult.rows.length === 0) {
            throw new Error("No se encontró el tipo de ensayo con ID = 1 (Granulometría)");
        }

        const configTabla = currentResult.rows[0].config_tabla;
        configTabla.general_fields = generalFields;

        // 2. Definir los nuevos cálculos
        const nuevosCalculos = {
            "calculated_values.sucs.ll": "= (general_fields.limite_liquido > 0 ? general_fields.limite_liquido : 0)",
            "calculated_values.sucs.ip": "= (general_fields.indice_plasticidad > 0 ? general_fields.indice_plasticidad : 0)",
            "calculated_values.sucs.d10": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 10)",
            "calculated_values.sucs.d30": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 30)",
            "calculated_values.sucs.d50": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 50)",
            "calculated_values.sucs.d60": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 60)",
            "calculated_values.sucs.cu": "= (calculated_values.sucs.d10 > 0 ? calculated_values.sucs.d60 / calculated_values.sucs.d10 : 0)",
            "calculated_values.sucs.cc": "= (calculated_values.sucs.d10 * calculated_values.sucs.d60 > 0 ? (calculated_values.sucs.d30 * calculated_values.sucs.d30) / (calculated_values.sucs.d10 * calculated_values.sucs.d60) : 0)",
            "calculated_values.sucs.pasa_10": "= tables.granulometria.malla_10.pasa",
            "calculated_values.sucs.pasa_40": "= tables.granulometria.malla_40.pasa",
            "calculated_values.sucs.pasa_200": "= tables.granulometria.malla_200.pasa",
            "calculated_values.sucs.porcentaje_grava": "= calculated_values.sucs.grava",
            "calculated_values.sucs.porcentaje_arena": "= calculated_values.sucs.arena",
            "calculated_values.sucs.porcentaje_finos": "= calculated_values.sucs.finos",
            "calculated_values.sucs.clasificacion_sucs": "= clasificar_sucs(calculated_values.sucs.grava, calculated_values.sucs.arena, calculated_values.sucs.finos, calculated_values.sucs.d10, calculated_values.sucs.d30, calculated_values.sucs.d60, calculated_values.sucs.ll, calculated_values.sucs.ip)",
            "calculated_values.aashto.clasificacion_aashto": "= clasificar_aashto(calculated_values.sucs.pasa_10, calculated_values.sucs.pasa_40, calculated_values.sucs.pasa_200, calculated_values.sucs.ll, calculated_values.sucs.ip)"
        };

        const configCalculos = { ...currentResult.rows[0].config_calculos, ...nuevosCalculos };

        // Realizar la actualización en la DB
        await db.query(
            'UPDATE tipo_ensayo SET config_tabla = $1, config_calculos = $2 WHERE id = 1',
            [JSON.stringify(configTabla), JSON.stringify(configCalculos)]
        );

        console.log("¡Éxito! La base de datos local ha sido actualizada correctamente.");
        console.log("Nuevos Campos Generales (config_tabla) y Fórmulas de Cálculo (config_calculos) inyectados.");
        
        db.end();
    } catch (err) {
        console.error("Error al actualizar la base de datos:", err);
        db.end();
    }
}

main();
