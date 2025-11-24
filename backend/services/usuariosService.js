const db = require('../conexion'); // Asume que conexion.js exporta el objeto de conexión a la base de datos

const usuariosService = {
  createUser: async (userData) => {
    let {
      dni,
      password,
      nombres,
      apPaterno,
      apMaterno,
      fechaNacimiento,
      fechaIngreso,
      contactoPersonal,
      mailPersonal,
      mailProyecto,
      profesion,
      rol,
      especialidad,
      otrosDetalles,
      // Campos de Información Académica
      centroEstudios,
      profesionAcademica,
      especialidadAcademica,
      fechaIngresoAcademica,
      fechaEgresoAcademica,
      informacionAdicionalAcademica,
      // Campos de Información Laboral
      institucionLaboral,
      cargoLaboral,
      fechaIngresoLaboral,
      fechaEgresoLaboral,
      informacionAdicionalLaboral,
    } = userData;

    // Convert empty date strings to null
    fechaNacimiento = fechaNacimiento || null;
    fechaIngreso = fechaIngreso || null;
    fechaIngresoAcademica = fechaIngresoAcademica || null;
    fechaEgresoAcademica = fechaEgresoAcademica || null;
    fechaIngresoLaboral = fechaIngresoLaboral || null;
    fechaEgresoLaboral = fechaEgresoLaboral || null;

    let client; // Declarar client fuera del try para que sea accesible en finally

    try {
      client = await db.connect(); // Obtener un cliente de la pool
      await client.query('BEGIN'); // Iniciar la transacción

      // La contraseña se almacenará en texto plano. ¡ADVERTENCIA DE SEGURIDAD: Esto no es recomendable para producción!

      // Consulta SQL para insertar el nuevo usuario en usuariost
      const userQuery = `
        INSERT INTO usuariost (
          dni, password, nombre, ap_paterno, ap_materno,
          fecha_nacimiento, fecha_ingreso, telefono, correo, mail_cu_104,
          profesion, rol_id, codigo_esp, otros_detalles, usuario, tramo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id;
      `;

      const userValues = [
        dni,
        password, // Contraseña en texto plano
        nombres,
        apPaterno,
        apMaterno,
        fechaNacimiento,
        fechaIngreso,
        contactoPersonal, // Mapeado a 'telefono'
        mailPersonal,     // Mapeado a 'correo'
        mailProyecto,     // Mapeado a 'mail_cu_104'
        profesion,
        rol,              // Mapeado a 'rol_id'
        especialidad,     // Asumiendo que 'especialidad' del frontend se mapea a 'codigo_esp'
        otrosDetalles,
        dni, // Asumiendo que 'dni' se usa como 'usuario'
        userData.tramo // Add tramo here
      ];

      const userResult = await client.query(userQuery, userValues);
      const userId = userResult.rows[0].id;

      // Insertar información académica si está presente
      if (centroEstudios || profesionAcademica || especialidadAcademica || fechaIngresoAcademica || fechaEgresoAcademica || informacionAdicionalAcademica) {
        const academicQuery = `
          INSERT INTO experiencia_academica (
            usuario_id, centro_estudios, profesion, especialidad,
            fecha_ingreso_academica, fecha_egreso_academica, informacion_adicional_academica
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        const academicValues = [
          userId,
          centroEstudios,
          profesionAcademica,
          especialidadAcademica,
          fechaIngresoAcademica,
          fechaEgresoAcademica,
          informacionAdicionalAcademica,
        ];
        await client.query(academicQuery, academicValues);
      }

      // Insertar información laboral si está presente
      if (institucionLaboral || cargoLaboral || fechaIngresoLaboral || fechaEgresoLaboral || informacionAdicionalLaboral) {
        const laborQuery = `
          INSERT INTO experiencia_laboral (
            usuario_id, institucion, cargo,
            fecha_ingreso_laboral, fecha_egreso_laboral, informacion_adicional_laboral
          ) VALUES ($1, $2, $3, $4, $5, $6);
        `;
        const laborValues = [
          userId,
          institucionLaboral,
          cargoLaboral,
          fechaIngresoLaboral,
          fechaEgresoLaboral,
          informacionAdicionalLaboral,
        ];
        await client.query(laborQuery, laborValues);
      }

      await client.query('COMMIT'); // Confirmar la transacción
      return { success: true, userId: userId };

    } catch (error) {
      if (client) {
        await client.query('ROLLBACK'); // Revertir la transacción en caso de error
      }
      console.error('Error al crear usuario en el servicio (transacción revertida):', error);
      throw new Error('Error al crear usuario en la base de datos: ' + error.message);
    } finally {
      if (client) {
        client.release(); // Liberar el cliente de la pool
      }
    }
  },

  getUserById: async (userId) => {
    try {
      const userQuery = `
        SELECT u.*, r.nombre AS rol_nombre, e.nombre AS especialidad_nombre
        FROM usuariost u
        LEFT JOIN roles r ON u.rol_id = r.id
        LEFT JOIN especialidades e ON u.codigo_esp = e.codigo_esp
        WHERE u.id = $1
      `;
      const userResult = await db.query(userQuery, [userId]);
      if (userResult.rows.length === 0) {
        return null;
      }
      const user = userResult.rows[0];

      const academicQuery = `
        SELECT *
        FROM experiencia_academica
        WHERE usuario_id = $1
      `;
      const academicResult = await db.query(academicQuery, [userId]);
      user.experiencia_academica = academicResult.rows;

      const laborQuery = `
        SELECT *
        FROM experiencia_laboral
        WHERE usuario_id = $1
      `;
      const laborResult = await db.query(laborQuery, [userId]);
      user.experiencia_laboral = laborResult.rows;

      return user;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw new Error('Error getting user by id: ' + error.message);
    }
  },

  deleteUser: async (dni) => {
    let client;
    try {
      client = await db.connect();
      await client.query('BEGIN');

      // Get the user_id from usuariost using dni
      const getUserIdQuery = `
        SELECT id FROM usuariost WHERE dni = $1;
      `;
      const userResult = await client.query(getUserIdQuery, [dni]);
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'User not found.' };
      }
      const userId = userResult.rows[0].id;

      // Delete from auditoria table first
      const deleteAuditoriaQuery = `
        DELETE FROM auditoria WHERE usuario_id = $1;
      `;
      await client.query(deleteAuditoriaQuery, [userId]);

      // Now delete from usuariost
      const deleteUserQuery = `
        DELETE FROM usuariost
        WHERE dni = $1;
      `;
      const result = await client.query(deleteUserQuery, [dni]);

      await client.query('COMMIT');
      return { success: result.rowCount > 0 };
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('Error deleting user in service (transaction rolled back):', error);
      throw new Error('Error deleting user from database: ' + error.message);
    } finally {
      if (client) {
        client.release();
      }
    }
  },

  getUsersGroupedByProject: async () => {
    try {
        const query = `
            SELECT
                p.id as proyecto_id,
                p.nombre_tramo as proyecto_nombre,
                COALESCE(json_agg(
                    json_build_object(
                        'id', u.id,
                        'nombre', TRIM(CONCAT(u.nombre, ' ', u.ap_paterno, ' ', u.ap_materno))
                    ) ORDER BY u.nombre, u.ap_paterno
                ) FILTER (WHERE u.id IS NOT NULL), '[]'::json) as usuarios
            FROM
                proyectos p
            LEFT JOIN
                proyecto_usuarios pu ON p.id = pu.proyecto_id
            LEFT JOIN
                usuariost u ON pu.usuario_id = u.id
            GROUP BY
                p.id, p.nombre_tramo
            
            UNION ALL
            
            SELECT
                NULL as proyecto_id,
                'Sin Asignar' as proyecto_nombre,
                COALESCE(json_agg(
                    json_build_object(
                        'id', u.id,
                        'nombre', TRIM(CONCAT(u.nombre, ' ', u.ap_paterno, ' ', u.ap_materno))
                    ) ORDER BY u.nombre, u.ap_paterno
                ), '[]'::json) as usuarios
            FROM
                usuariost u
            WHERE NOT EXISTS (
                SELECT 1 FROM proyecto_usuarios pu WHERE pu.usuario_id = u.id
            )
            ORDER BY
                proyecto_nombre;
        `;
        const { rows } = await db.query(query);
        return rows;
    } catch (error) {
        console.error('Error getting users grouped by project:', error);
        throw new Error('Error getting users grouped by project: ' + error.message);
    }
  },
};

module.exports = usuariosService;
