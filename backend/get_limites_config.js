
// Script de diagnóstico para obtener las configuraciones del ensayo de Límites de Consistencia

const pool = require('./conexion');
const ensayosService = require('./services/ensayosService');

async function getLimitesConfig() {
    console.log('Iniciando script para obtener configuración de Límites de Consistencia...');
    try {
        const tipoEnsayos = await ensayosService.getTipoEnsayos();
        
        const granulometriaEnsayo = tipoEnsayos.find(t => t.codigo === 1 );

        if (!granulometriaEnsayo) {
            console.error('ERROR: No se pudo encontrar el tipo de ensayo con código "GRA". Verifica que exista en la tabla tipo_ensayo.');
            return;
        }

        console.log(`\nTipo de ensayo encontrado: "${granulometriaEnsayo.descripcion}" con ID: ${granulometriaEnsayo.id}`);

        const config = await ensayosService.getFormularioConfig(granulometriaEnsayo.id);

        if (!config) {
            console.error(`ERROR: No se pudo obtener la configuración para el tipo de ensayo con ID ${limitesEnsayo.id}`);
            return;
        }

        console.log('\n--------------------------------------------------');
        console.log('--- CONFIGURACIÓN DE FORMULARIO (Secciones de Tabla) ---');
        console.log('--------------------------------------------------');
        const tableSections = config.formConfig.secciones.filter(s => s.componente_key.startsWith('Tabla'));
        console.log(JSON.stringify(tableSections, null, 2));

        console.log('\n-----------------------------------');
        console.log('--- CONFIGURACIÓN DE TABLA ---');
        console.log('-----------------------------------');
        console.log(JSON.stringify(config.tableConfig, null, 2));
        
        console.log('\n----------------------------------------');
        console.log('--- CONFIGURACIÓN DE CÁLCULOS --- Geo');
        console.log('----------------------------------------');
        console.log(JSON.stringify(config.calculationConfig, null, 2));

        console.log('\n---------------------------------------');
        console.log('--- CONFIGURACIÓN DE GRÁFICOS ---');
        console.log('---------------------------------------');
        console.log(JSON.stringify(config.graficosConfig, null, 2));


    } catch (error) {
        console.error('\nOcurrió un error durante la ejecución del script:', error);
    } finally {
        // Cierra el pool de conexiones para que el script termine.
        await pool.end();
        console.log('\nConexión a la base de datos cerrada. Script finalizado.');
    }
}

getLimitesConfig();
