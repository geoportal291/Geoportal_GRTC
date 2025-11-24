const db = require('../conexion');

const getRutaKml = async () => {
    try {
        const result = await db.query(`
            SELECT
                tramo_id,
                ST_AsGeoJSON(ST_MakeLine(geom ORDER BY id)) AS ruta_geojson
            FROM
                ruta_kml
            GROUP BY
                tramo_id
            ORDER BY
                tramo_id;
        `);

        // Parsear el GeoJSON y extraer las coordenadas
        const rutasFormateadas = result.rows.map(row => {
            const geojson = JSON.parse(row.ruta_geojson);
            // Las coordenadas de un LineString en GeoJSON son un array de [lng, lat]
            // Necesitamos convertirlas a [lat, lng]
            const coordinates = geojson.coordinates.map(coord => [coord[1], coord[0]]);
            return {
                tramo_id: row.tramo_id,
                positions: coordinates
            };
        });

        return rutasFormateadas;
    } catch (err) {
        console.error('Error al obtener datos de ruta_kml:', err.message, err.stack);
        throw new Error('Error al obtener datos de ruta_kml');
    }
};

module.exports = {
    getRutaKml,
};