const fs = require('fs');
const path = require('path');
const pool = require('./conexion');

/**
 * Script de migración y sincronización dinámica de configuraciones de reportes PDF en base de datos.
 * Lee archivos JSON en la carpeta './config/reportes/' e inyecta la configuración en tipo_ensayo
 * correspondiente en base a la columna `config_key`, `id`, o `descripcion`.
 */
async function run() {
    try {
        console.log('=== INICIANDO MIGRACIÓN DINÁMICA DE REPORTES PDF ===');
        
        console.log('1. Asegurando existencia de columna config_reporte_pdf en tipo_ensayo...');
        await pool.query(`
            ALTER TABLE tipo_ensayo ADD COLUMN IF NOT EXISTS config_reporte_pdf JSONB;
        `);
        console.log('✅ Columna config_reporte_pdf en tipo_ensayo asegurada.');

        const reportesDir = path.join(__dirname, 'config', 'reportes');
        if (!fs.existsSync(reportesDir)) {
            console.warn(`⚠️ Advertencia: El directorio de plantillas de reportes no existe: ${reportesDir}`);
            console.log('Creándolo automáticamente...');
            fs.mkdirSync(reportesDir, { recursive: true });
            console.log('✅ Directorio creado. Por favor, coloque los archivos .json de configuración en esa ruta.');
            return;
        }

        const files = fs.readdirSync(reportesDir).filter(f => f.endsWith('.json'));
        console.log(`2. Detectados ${files.length} archivos de configuración de reportes en la carpeta.`);

        if (files.length === 0) {
            console.log('ℹ️ No se encontraron archivos .json en config/reportes/. Saltando carga de configuraciones.');
            return;
        }

        for (const file of files) {
            const filePath = path.join(reportesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            let config;
            try {
                config = JSON.parse(content);
            } catch (err) {
                console.error(`❌ ERROR al procesar JSON en '${file}':`, err.message);
                continue;
            }

            // Clave identificadora del tipo de ensayo (por ejemplo 'granulometria', 'limites', etc.)
            const configKey = config.config_key || path.basename(file, '.json');
            console.log(`\nProcesando plantilla para clave: '${configKey}' (Archivo: ${file})...`);

            // Buscar tipo de ensayo dinámicamente sin nombres de ensayo fijos
            const resTipos = await pool.query(`
                SELECT id, descripcion, config_key FROM tipo_ensayo 
                WHERE config_key = $1 OR id::text = $1 OR LOWER(descripcion) = LOWER($1)
            `, [configKey]);

            if (resTipos.rows.length === 0) {
                console.warn(`⚠️ Advertencia: No se encontró ningún tipo_ensayo en la base de datos que coincida con la clave: '${configKey}'.`);
                continue;
            }

            const tipoEnsayo = resTipos.rows[0];
            console.log(`🎯 Coincidencia encontrada: ${tipoEnsayo.descripcion} (ID: ${tipoEnsayo.id})`);

            // Actualizar la columna en la fila correspondiente de forma 100% dinámica
            await pool.query(`
                UPDATE tipo_ensayo SET config_reporte_pdf = $1 WHERE id = $2
            `, [JSON.stringify(config), tipoEnsayo.id]);

            console.log(`✅ Configuración de reporte para '${tipoEnsayo.descripcion}' inyectada exitosamente.`);
        }

        console.log('\n=== PROCESO DE MIGRACIÓN FINALIZADO CON ÉXITO ===');

    } catch (err) {
        console.error('❌ ERROR CRÍTICO durante el proceso de migración:', err.message);
    } finally {
        // Liberamos la conexión del pool
        await pool.end();
        console.log('Pool de base de datos cerrado correctamente.');
    }
}

run();
