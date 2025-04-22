const mysql = require('mysql2/promise');

// Configuración
const conexion = mysql.createPool({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});

//FUNCION PARA REGISTRAR UN USUARIO EN LA BASE DE DATOS
async function registrarUsuario(ip, nuevoUsuario, datosPerfil) {
  const sql = `
    INSERT INTO usuarios (email, password, tipo, fechaCreacion, ultimoIngreso)
    VALUES (?, ?, ?, ?, ?)
  `;

  const valores = [
    nuevoUsuario.email,
    nuevoUsuario.password,
    nuevoUsuario.tipo,
    nuevoUsuario.fechaCreacion,
    nuevoUsuario.ultimoIngreso
  ];

  const conx = await conexion.getConnection();
  try {
    const [result] = await conx.query(sql, valores);

    const idUsuario = result.insertId;
    auditarCambios(idUsuario, ip, 'Se registró al usuario '+idUsuario);

  // Determinar la tabla según el tipo
  let tablaDestino = '';
  switch (nuevoUsuario.tipo.toLowerCase()) {
    case 'paciente':
      tablaDestino = 'usuariosPaciente';
      break;
    case 'profesional':
      tablaDestino = 'usuariosProfesional';
      break;
    case 'administrador':
      tablaDestino = 'usuariosAdministrador';
      break;
    default:
      throw new Error('Tipo de usuario desconocido: ' + nuevoUsuario.tipo);
  }

  //Extraer datos con valores por defecto
  const {
    nombre = 'nombre',
    apellido = 'apellido',
    dni = '00000000',
    fechaNacimiento = '1900-01-01',
    idEspecialidad = 0,
    disponibilidad = []
  } = datosPerfil || {};

  // Definir SQL e insertar en tabla correspondiente
  let sqlDatos = '';
  let valoresDatos = [];

  if (tablaDestino === 'usuariosProfesional') {
    sqlDatos = `
      INSERT INTO usuariosProfesional (idUsuario, nombre, apellido, dni, fechaNacimiento, idEspecialidad)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    valoresDatos = [idUsuario, nombre, apellido, dni, fechaNacimiento, idEspecialidad];
  } else {
    sqlDatos = `
      INSERT INTO ${tablaDestino} (idUsuario, nombre, apellido, dni, fechaNacimiento)
      VALUES (?, ?, ?, ?, ?)
    `;
    valoresDatos = [idUsuario, nombre, apellido, dni, fechaNacimiento];
  }

  await conx.query(sqlDatos, valoresDatos);

  //Si hay disponibilidad y la tabla es profesionales, insertarlas
  if (tablaDestino === 'usuariosProfesional' && Array.isArray(disponibilidad)) {
    const sqlDisp = `
      INSERT INTO disponibilidades (idUsuario, idSeccional, diaSemana, horaInicio, horaFin)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const disp of disponibilidad) {
      const {
        seccional = 0,
        dia = 0,
        horaInicio = 0,
        horaFin = 0
      } = disp;

      //Insertar disponibilidad (idDisponibilidad se ignora si es auto_inc)
      await conx.query(sqlDisp, [idUsuario, seccional, dia, horaInicio, horaFin]);
    }
  }

  //Insertar perfil principal en la tabla usuarioPerfiles
  const sqlPerfil = `
  INSERT INTO usuarioPerfiles (idUsuario, rol, idRol, nombre)
  VALUES (?, ?, ?, ?)
  `;
  const valoresPerfil = [idUsuario, nuevoUsuario.tipo, idUsuario, 'Perfil principal'];

  await conx.query(sqlPerfil, valoresPerfil);

  return result;
  } catch (err) {
  console.error('Error al registrar usuario:', err.sqlMessage || err);
  throw err;
  } finally {
  conx.release();
  }
}

//Ingresar usuario
async function ingresarUsuario(email, password) {
  const conx = await conexion.getConnection();

  try {
    //Buscar en tabla usuarios
    const [usuarios] = await conx.query(
      'SELECT * FROM usuarios WHERE email = ? AND password = ?',
      [email, password]
    );

    if (usuarios.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const { idUsuario, tipo } = usuarios[0];
    usuarios[0].password = '*****';

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

    // Buscar perfiles subrogados
    const [perfiles] = await conx.query(
      'SELECT * FROM usuarioPerfiles WHERE idUsuario = ?',
      [idUsuario]
    );

    usuarios[0].perfilesSubrogados = perfiles;

    return { tipo: tipo, usuario: usuarios[0], perfilActivo: result[0], };
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