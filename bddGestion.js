const mysql = require('mysql2/promise');

// Configuración
const conexion = mysql.createPool({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});

// Función para obtener disponibilidades con filtros opcionales
async function buscarEspecialidades(filtros) {
  const { idEspecialidad, nombre, duracion } = filtros;

  let query = 'SELECT * FROM especialidades WHERE 1=1';
  const params = [];

  if (idEspecialidad !== undefined) {
    query += ' AND idEspecialidad = ?';
    params.push(idEspecialidad);
  }
  
  if (nombre !== undefined) {
    query += ' AND nombre = ?';
    params.push(nombre);
  }

  if (duracion !== undefined) {
    query += ' AND duracion = ?';
    params.push(duracion);
  }

  const [resultadoEspecialidades] = await conexion.query(query, params);
  return resultadoEspecialidades;
}

async function modificarEspecialidad(datosEspecialidad) {
  const { idEspecialidad, nombre, duracion } = datosEspecialidad;
  const sql = `
    UPDATE especialidades
    SET nombre = ?, duracion = ?
    WHERE idEspecialidad = ?
  `;

  try {
    const [resultado] = await conexion.execute(sql, [nombre, duracion, idEspecialidad]);

    if (resultado.affectedRows === 0) {
      throw new Error("No se encontró la especialidad para actualizar.");
    }

    return { exito: true, mensaje: "Especialidad actualizada correctamente." };
  } catch (error) {
    console.error("Error al actualizar especialidad:", error.message);
    throw error;
  }
}

//FUNCIONES GENERALES

async function auditarCambios(idUsuario, ip, cambio) {
  const conx = await conexion.getConnection();
  const fecha = obtenerFechaFormateada();
  
  const sql = `
    INSERT INTO auditoria (fecha, idUsuario, IP, cambio)
    VALUES (?, ?, ?, ?)
  `;

  const valores = [fecha, idUsuario, ip, cambio];

  try {
    await conx.query(sql, valores);
  } catch (err) {
    console.error('Error al auditar cambio:', err.sqlMessage || err);
  } finally {
    conx.release();
  }
}


module.exports = {
  buscarEspecialidades,
  modificarEspecialidad,
};