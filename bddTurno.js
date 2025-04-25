const mysql = require('mysql2/promise');

// Configuración
const conexion = mysql.createPool({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});

// Función para obtener disponibilidades con filtros opcionales
async function obtenerDisponibilidades({ idEspecialidad, idSeccional, diaSemana }) {
  let query = 'SELECT * FROM disponibilidades WHERE 1=1';
  const params = [];

  if (idEspecialidad !== undefined) {
    const idPerfiles = await obtenerPerfilesPorEspecialidad(idEspecialidad);
    if (idPerfiles.length > 0) {
      const perfilesValidos = idPerfiles.map(() => '?').join(', ');
      query += ` AND idPerfil IN (${perfilesValidos})`;
      params.push(...idPerfiles);
    } else {
      // No hay perfiles con esa especialidad, forzamos resultado vacío
      return [];
    }
  }

  if (idSeccional !== undefined) {
    query += ' AND idSeccional = ?';
    params.push(idSeccional);
  }

  if (diaSemana !== undefined) {
    query += ' AND diaSemana = ?';
    params.push(diaSemana);
  }

  const [resultadoDisponibilidades] = await conexion.query(query, params);
  return resultadoDisponibilidades;
}

async function obtenerPerfilesPorEspecialidad(idEspecialidad) {
  const query = 'SELECT idPerfil FROM perfilesProfesional WHERE idEspecialidad = ?';
  const [resultado] = await conexion.query(query, [idEspecialidad]);
  return resultado.map(resultado => resultado.idPerfil);
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

function obtenerFechaFormateada() {
  const ahora = new Date();

  //Ajustar 3 horas para Argentina (GMT-3)
  ahora.setHours(ahora.getHours() - 3);

  const dia = String(ahora.getDate()).padStart(2, '0');
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const anio = ahora.getFullYear();

  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${anio}, ${horas}:${minutos}`;
}

module.exports = {
  obtenerDisponibilidades
};