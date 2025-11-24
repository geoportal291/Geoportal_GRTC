const db = require('../conexion');
const { put, del } = require('@vercel/blob');
const fsp = require('fs').promises;

// --- Funciones de Canteras ---

const createCantera = async (canteraData, userId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const { 
            nombre, material, estado, accesibilidad, descripcion, 
            coordenada_este, coordenada_norte, 
            id_progresiva_referencia, desplazamiento_km, lado, 
            kml_id, latitud, longitud, tramo_id, id_proyecto
        } = canteraData;

        if (!tramo_id) {
            throw new Error('El campo tramo_id es obligatorio para crear una cantera.');
        }
         if (!id_proyecto) {
            throw new Error('El campo id_proyecto es obligatorio para crear una cantera.');
        }


        // Get the next sequential code for the given tramo
        const codeQuery = 'SELECT MAX(CAST(codigo AS INTEGER)) as max_codigo FROM canteras WHERE tramo_id = $1';
        const codeResult = await client.query(codeQuery, [tramo_id]);
        const nextCodigo = (codeResult.rows[0].max_codigo || 0) + 1;

        const query = `
            INSERT INTO canteras (
                nombre, material, estado, accesibilidad, descripcion,
                coordenada_este, coordenada_norte,
                id_progresiva_referencia, desplazamiento_km, lado,
                kml_id, latitud, longitud,
                tramo_id, codigo, id_proyecto
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *;
        `;
        const values = [
            nombre, material, estado, accesibilidad, descripcion,
            coordenada_este, coordenada_norte,
            id_progresiva_referencia, desplazamiento_km, lado,
            kml_id, latitud, longitud,
            tramo_id, String(nextCodigo), id_proyecto
        ];
        const result = await client.query(query, values);
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error detallado al crear cantera:', err);
        throw new Error('Error al crear la cantera: ' + err.message);
    } finally {
        client.release();
    }
};

const updateCantera = async (id, canteraData) => {
    const { 
        nombre, material, estado, accesibilidad, descripcion, 
        coordenada_este, coordenada_norte, 
        id_progresiva_referencia, desplazamiento_km, lado, 
        kml_id, latitud, longitud, tramo_id, id_proyecto
    } = canteraData;

    // Note: We are not recalculating the 'codigo' on update, as it should be stable.
    // If a cantera moves tramo, a more complex logic would be needed.
    // For now, we just update the tramo_id if provided.

    try {
        const query = `
            UPDATE canteras SET
                nombre = $1, material = $2, estado = $3, accesibilidad = $4, descripcion = $5,
                coordenada_este = $6, coordenada_norte = $7,
                id_progresiva_referencia = $8, desplazamiento_km = $9, lado = $10,
                kml_id = $11, latitud = $12, longitud = $13, tramo_id = $14, id_proyecto = $15
            WHERE id = $16
            RETURNING *;
        `;
        const values = [
            nombre, material, estado, accesibilidad, descripcion,
            coordenada_este, coordenada_norte,
            id_progresiva_referencia, desplazamiento_km, lado,
            kml_id, latitud, longitud, tramo_id, id_proyecto, id
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar cantera:', err);
        throw new Error('Error al actualizar la cantera.');
    }
};

const getCanterasByTramoId = async (tramoId) => {
    if (!tramoId) {
        throw new Error('El ID del tramo es requerido.');
    }
    try {
        // 1. Obtener las canteras
        const canterasQuery = `
            SELECT c.*, p_ref.nombre AS progresiva_ref_nombre, p_ref.codigo AS progresiva_ref_codigo
            FROM canteras c
            LEFT JOIN progresivas p_ref ON c.id_progresiva_referencia = p_ref.id
            WHERE c.tramo_id = $1
            ORDER BY c.nombre ASC;
        `;
        const canterasResult = await db.query(canterasQuery, [tramoId]);
        const canteras = canterasResult.rows;
        if (canteras.length === 0) return [];

        const canteraIds = canteras.map(c => c.id);

        // 2. Obtener todas las imágenes, estratos y ensayos para esas canteras en paralelo
        const [imagenesResult, estratosResult, ensayosResult] = await Promise.all([
            db.query('SELECT * FROM cantera_imagenes WHERE cantera_id = ANY($1::int[]) ORDER BY created_at ASC', [canteraIds]),
            db.query('SELECT id, parent_id AS id_cantera, nombre, descripcion, cota_inicial, cota_final, orden FROM estratos WHERE parent_type = \'cantera\' AND parent_id = ANY($1::int[]) ORDER BY parent_id, orden ASC', [canteraIds]),
            db.query(`
                SELECT e.id, e.estrato_id, e.tipo_ensayo AS tipo_ensayo_id, te.descripcion AS tipo_ensayo_descripcion, e.nombre_ensayo, e.fecha, e.estado, e.resultado, (u.nombre || ' ' || u.ap_paterno || ' ' || u.ap_materno) AS responsable_nombre
                FROM ensayos e
                LEFT JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
                LEFT JOIN usuariost u ON e.responsable_id = u.id
                WHERE e.estrato_id IN (SELECT id FROM estratos WHERE parent_type = 'cantera' AND parent_id = ANY($1::int[]))
                ORDER BY e.estrato_id, e.fecha DESC;
            `, [canteraIds])
        ]);

        // 3. Mapear resultados para fácil acceso
        const imagenesPorCantera = new Map();
        imagenesResult.rows.forEach(img => {
            if (!imagenesPorCantera.has(img.cantera_id)) imagenesPorCantera.set(img.cantera_id, []);
            imagenesPorCantera.get(img.cantera_id).push(img);
        });

        const ensayosPorEstrato = new Map();
        ensayosResult.rows.forEach(ensayo => {
            if (!ensayosPorEstrato.has(ensayo.estrato_id)) ensayosPorEstrato.set(ensayo.estrato_id, []);
            ensayosPorEstrato.get(ensayo.estrato_id).push(ensayo);
        });

        const estratosPorCantera = new Map();
        estratosResult.rows.forEach(estrato => {
            if (!estratosPorCantera.has(estrato.id_cantera)) estratosPorCantera.set(estrato.id_cantera, []);
            const estratosConEnsayos = {
                ...estrato,
                ensayos: ensayosPorEstrato.get(estrato.id) || []
            };
            estratosPorCantera.get(estrato.id_cantera).push(estratosConEnsayos);
        });

        // 4. Combinar todo
        return canteras.map(cantera => ({
            ...cantera,
            imagenes: imagenesPorCantera.get(cantera.id) || [],
            estratos_perfil: (estratosPorCantera.get(cantera.id) || []).sort((a, b) => a.orden - b.orden)
        }));

    } catch (err) {
        console.error('Error en getCanterasByTramoId service:', err);
        throw new Error('Error al obtener las canteras del tramo.');
    }
};

const deleteCantera = async (id) => {
    try {
        // ON DELETE CASCADE se encargará de eliminar imágenes y estratos asociados
        const query = 'DELETE FROM canteras WHERE id = $1 RETURNING *;';
        const result = await db.query(query, [id]);
        return result.rows[0];
    } catch (err) {
        console.error('Error al eliminar cantera:', err);
        throw new Error('Error al eliminar la cantera.');
    }
};

// --- Funciones de Imágenes de Cantera ---

const uploadImage = async (file, userId) => {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }
  if (!userId) {
    throw new Error('ID de usuario es requerido para la subida de imagen.');
  }

  let blobToken = process.env.BLOB_READ_WRITE_TOKEN_SUELOS;

  if (!blobToken) {
    // Fallback al token original si BLOB_READ_WRITE_TOKEN_SUELOS no está configurado
    blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  }

  if (!blobToken) {
    throw new Error(`Ningún token de Vercel Blob configurado (BLOB_READ_WRITE_TOKEN_SUELOS o BLOB_READ_WRITE_TOKEN).`);
  }

  const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
  const filename = `canteras/${userId}/${Date.now()}_${cleanFilename}`;

  try {
    // Leer el archivo del disco ya que multer.diskStorage no llena el buffer
    const fileBuffer = await fsp.readFile(file.path);

    const blob = await put(filename, fileBuffer, { access: 'public', token: blobToken });
    
    return blob.url;
  } finally {
    // Eliminar el archivo temporal después de la subida (o si falla)
    if (file && file.path) {
        try {
            await fsp.unlink(file.path);
        } catch (unlinkErr) {
            console.error(`Error al eliminar el archivo temporal ${file.path}:`, unlinkErr);
        }
    }
  }
};

const addImagenToCantera = async (canteraId, imagenUrl, descripcion, nombreArchivo) => {
    try {
        const query = `
            INSERT INTO cantera_imagenes (cantera_id, imagen_url, descripcion, nombre_archivo)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await db.query(query, [canteraId, imagenUrl, descripcion, nombreArchivo]);
        return result.rows[0];
    } catch (err) {
        console.error('Error al añadir imagen a la cantera:', err);
        throw new Error('Error al guardar la referencia de la imagen.');
    }
};

const deleteImagen = async (imagenId) => {
    try {
        // Primero, obtener la URL de la imagen para borrarla de Vercel
        const res = await db.query('SELECT imagen_url FROM cantera_imagenes WHERE id = $1', [imagenId]);
        if (res.rows.length > 0) {
            const { imagen_url } = res.rows[0];

            // Obtener el token de Vercel Blob
            let blobToken = process.env.BLOB_READ_WRITE_TOKEN_SUELOS || process.env.BLOB_READ_WRITE_TOKEN;
            if (!blobToken) {
                throw new Error('No se ha configurado un token de Vercel Blob para la eliminación.');
            }

            await del(imagen_url, { token: blobToken }); // Eliminar de Vercel Blob con token
        }
        // Luego, eliminar el registro de la base de datos
        await db.query('DELETE FROM cantera_imagenes WHERE id = $1', [imagenId]);
        return { id: imagenId };
    } catch (err) {
        console.error('Error al eliminar imagen:', err);
        throw new Error('Error al eliminar la imagen.');
    }
};

// --- Funciones de Estratos (sin cambios) ---

const createCanteraEstrato = async (canteraId, estratoData) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const { nombre, descripcion, cota_inicial, cota_final } = estratoData; // 'orden' is removed from destructuring

        // Calculate the next sequential 'orden' for this cantera
        const ordenQuery = `
            SELECT MAX(orden) as max_orden
            FROM estratos
            WHERE parent_type = 'cantera' AND parent_id = $1;
        `;
        const ordenResult = await client.query(ordenQuery, [canteraId]);
        const nextOrden = (ordenResult.rows[0].max_orden || 0) + 1;

        const query = `
            INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = ['cantera', canteraId, nombre, descripcion, cota_inicial, cota_final, nextOrden]; // Use nextOrden
        const result = await client.query(query, values);
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear estrato de cantera:', err);
        throw new Error('Error al crear el estrato de la cantera: ' + err.message);
    } finally {
        client.release();
    }
};

const updateCanteraEstrato = async (estratoId, estratoData) => {
    const { nombre, descripcion, cota_inicial, cota_final, orden } = estratoData;
    try {
        const query = `
            UPDATE estratos SET
                nombre = $1, descripcion = $2, cota_inicial = $3, cota_final = $4, orden = $5
            WHERE id = $6
            RETURNING *;
        `;
        const values = [nombre, descripcion, cota_inicial, cota_final, orden, estratoId];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error al actualizar estrato de cantera:', err);
        throw new Error('Error al actualizar el estrato de la cantera.');
    }
};

const deleteCanteraEstrato = async (estratoId) => {
    try {
        const query = 'DELETE FROM estratos WHERE id = $1 RETURNING *;';
        const result = await db.query(query, [estratoId]);
        return result.rows[0];
    } catch (err) {
        console.error('Error al eliminar estrato de cantera:', err);
        throw new Error('Error al eliminar el estrato de la cantera.');
    }
};

module.exports = {
    createCantera,
    updateCantera,
    getCanterasByTramoId,
    deleteCantera,
    uploadImage,
    addImagenToCantera,
    deleteImagen,
    createCanteraEstrato,
    updateCanteraEstrato,
    deleteCanteraEstrato,
};
