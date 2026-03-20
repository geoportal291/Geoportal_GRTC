require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT id, proyecto_id, tab_name, file_name, uploaded_at, 
                   (geojson_data IS NOT NULL) as has_geojson,
                   jsonb_typeof(geojson_data) as geojson_type,
                   (geojson_data->>'type') as format_type,
                   jsonb_array_length(geojson_data->'features') as num_features
            FROM geologia_capas 
            ORDER BY uploaded_at DESC 
            LIMIT 5
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
check();
