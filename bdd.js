const mysql = require('mysql2/promise');

// Configuración
const conexion = mysql.createPool({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});

//FUNCION PARA REGISTRAR UN USUARIO EN LA BASE DE DATOS
async function registrarUsuario(ip, datosUsuario) {
  const sql = `
    INSERT INTO usuarios (email, password, tipo, fechaCreacion, ultimoIngreso)
    VALUES (?, ?, ?, ?, ?)
  `;

  const valores = [
    datosUsuario.email,
    datosUsuario.password,
    datosUsuario.tipo,
    datosUsuario.fechaCreacion,
    datosUsuario.ultimoIngreso
  ];

  const conx = await conexion.getConnection();
  try {
    const [result] = await conx.query(sql, valores);

    const idUsuario = result.insertId;
    auditarCambios(idUsuario, ip, 'Se registró al usuario '+idUsuario);

    return result;
  } catch (err) {
    console.error('Error al registrar usuario:', err.sqlMessage || err);
    throw err;
  } finally {
    conx.release();
  }
}

// Ingresar usuario (usa promesa)
async function ingresarUsuario(email, password) {
  const conx = await conexion.getConnection();

  try {
    //Buscar en tabla usuarios
    const [usuarios] = await conx.query(
      'SELECT idUsuario, tipo FROM usuarios WHERE email = ? AND password = ?',
      [email, password]
    );

    if (usuarios.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const { idUsuario, tipo } = usuarios[0];

    //Buscar en la tabla correspondiente
    let tabla;
    if (tipo === 'paciente') tabla = 'usuariosPaciente';
    else if (tipo === 'profesional') tabla = 'usuariosProfesional';
    else if (tipo === 'administrador') tabla = 'usuariosAdministrador';
    else throw new Error('Tipo de usuario desconocido');

    const [result] = await conx.query(
      `SELECT * FROM ${tabla} WHERE idUsuario = ?`,
      [idUsuario]
    );

    if (result.length === 0) {
      throw new Error(`No se encontró el usuario en la tabla ${tabla}`);
    }

    return { usuario: result[0], tipo: tipo };
  } finally {
    conx.release();
  }
}

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
  registrarUsuario,
  ingresarUsuario
};