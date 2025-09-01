const mysql = require('mysql2/promise');
const cloudinary = require('cloudinary').v2;

import { credenciales } from './credenciales.js';

const nombreRepositorioImagenes = credenciales.cloudinary.cloud_name;
const prefijoImagen = 'https://res.cloudinary.com/' + nombreRepositorioImagenes + '/image/upload/';
const imagenGenerica = 'v1756689218/perfiles/s5gvajgadqovcyole97s.jpg';

// Configuración
/*
const conexion = mysql.createPool({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});
cloudinary.config({
  cloud_name: nombreRepositorioImagenes,
  api_key: '576566524786653',
  api_secret: 'i5Zis5pawFJdFpyHFKHMi60T3GQ',
});
*/

const conexion = mysql.createPool(credenciales.mysql);
cloudinary.config(credenciales.cloudinary);

//FUNCIONES PARA EL REGISTRO
async function registrarUsuario(ip, nuevoUsuario, nuevoPerfil) {
  const sql = `
    INSERT INTO usuarios (email, password, fechaCreacion, ultimoIngreso)
    VALUES (?, ?, ?, ?)
  `;
  const valores = [
    nuevoUsuario.email,
    nuevoUsuario.password,
    nuevoUsuario.fechaCreacion,
    nuevoUsuario.ultimoIngreso
  ];

  const conx = await conexion.getConnection();
  try {
    const [resultadoUsuario] = await conx.query(sql, valores);
    const idUsuario = resultadoUsuario.insertId;

    auditarCambios(idUsuario, ip, 'Se registró al usuario ' + idUsuario);

    const idPerfil = await agregarPerfilUsuario(conx, idUsuario, nuevoPerfil.categoria, nuevoPerfil.rol, nuevoPerfil.alias);

    await registrarPerfil(conx, idUsuario, idPerfil, nuevoPerfil);

    return resultadoUsuario;
  } catch (err) {
    console.error('Error al registrar usuario:', err.sqlMessage || err);
    throw err;
  } finally {
    conx.release();
  }
}

async function agregarPerfilUsuario(conx, idUsuario, categoria, rol, alias) {
  const sql = `
    INSERT INTO usuarioPerfiles (idUsuario, categoria, rol, alias)
    VALUES (?, ?, ?, ?)
  `;
  const valoresPerfil = [idUsuario, categoria, rol, alias];
  const [resultadoPerfilUsuario] = await conx.query(sql, valoresPerfil);
  return resultadoPerfilUsuario.insertId;
}

async function registrarPerfil(conx, idUsuario, idPerfil, nuevoPerfil) {
  const {
    nombre = 'nombre',
    apellido = 'apellido',
    dni = '00000000',
    fechaNacimiento = '1900-01-01',
    idEspecialidad = 0,
    disponibilidad = [],
    rol = ''
  } = nuevoPerfil || {};

  if (nuevoPerfil.imagen) {
    var imagen = await guardarImagen(nuevoPerfil.imagen);
  } else {imagen = imagenGenerica};
  
  let sqlDatos = '';
  let valoresDatos = [];

  if (rol.toLowerCase() === 'profesional') {
    sqlDatos = `
      INSERT INTO perfiles (idPerfil, idPermisos, idUsuario, nombre, apellido, dni, fechaNacimiento, idEspecialidad, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    valoresDatos = [idPerfil, 2, idUsuario, nombre, apellido, dni, fechaNacimiento, idEspecialidad, imagen];
    const [resultado] = await conx.query(sqlDatos, valoresDatos);
  }

  else if (rol.toLowerCase() === 'administrador') {
  sqlDatos = `
    INSERT INTO perfiles (idPerfil, idPermisos, idUsuario, nombre, apellido, dni, fechaNacimiento, idSeccional, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  valoresDatos = [idPerfil, 1, idUsuario, nombre, apellido, dni, fechaNacimiento, 0, imagen];
  await conx.query(sqlDatos, valoresDatos);
  }

  else if (rol.toLowerCase() === 'paciente' || rol === '') {
  sqlDatos = `
    INSERT INTO perfiles (idPerfil, idPermisos, idUsuario, nombre, apellido, dni, fechaNacimiento, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  valoresDatos = [idPerfil, 3, idUsuario, nombre, apellido, dni, fechaNacimiento, imagen];
  await conx.query(sqlDatos, valoresDatos);
  }

  
  if (rol.toLowerCase() === 'profesional' && Array.isArray(disponibilidad)) {
    const sqlDisp = `
      INSERT INTO disponibilidades (idSeccional, idPerfil, idEspecialidad, diaSemana, horaInicio, horaFin)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const disp of disponibilidad) {
      const {
        idSeccional = 0,
        idEspecialidad = 0,
        diaSemana = 0,
        horaInicio = 0,
        horaFin = 0
      } = disp;

      await conx.query(sqlDisp, [idSeccional, idPerfil, idEspecialidad, diaSemana, horaInicio, horaFin]);
    }
  }
}

async function registrarPerfilAdicional(ip, idUsuario, nuevoPerfil){
  const conx = await conexion.getConnection();
  try {
    const idPerfil = await agregarPerfilUsuario(conx, idUsuario, nuevoPerfil.categoria, nuevoPerfil.rol, nuevoPerfil.alias);
    await registrarPerfil(conx, idUsuario, idPerfil, nuevoPerfil);
    auditarCambios(idUsuario, ip, 'Se agregó el perfil ' + idPerfil + ' al usuario ' + idUsuario);

    return idPerfil;
  } catch (err) {
    console.error('Error al agregar perfil:', err.sqlMessage || err);
    throw err;
  } finally {
    conx.release();
  }
}

//FUNCIONES PARA EL INGRESO
async function ingresarUsuario(email, password) {
  const conx = await conexion.getConnection();

  try {
    const [usuarios] = await conx.query(
      'SELECT * FROM usuarios WHERE email = ? AND password = ?',
      [email, password]
    );

    if (usuarios.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const idUsuario = usuarios[0].idUsuario;
    usuarios[0].password = '*****';

    //Obtener el perfil principal
    const resultadoPerfil = await obtenerPerfiles(idUsuario, 'principal');
    
    if (!resultadoPerfil || resultadoPerfil.length === 0) {
      throw new Error('No se encontró un perfil principal para este usuario');
    }
    
    const perfil = resultadoPerfil[0];
    
    const perfilActivo = await obtenerPerfilRol(perfil.rol, perfil.idPerfil);
    
    perfilActivo.alias = perfil.alias;
    perfilActivo.categoria = perfil.categoria;
    perfilActivo.rol = perfil.rol;
    
    //Agregar disponibilidades si es profesional
    if (perfilActivo.rol === 'profesional') {
      perfilActivo.disponibilidad = await obtenerDisponibilidades(perfilActivo.idPerfil);
    }

    // Agregar perfiles subrogados
    usuarios[0].perfiles = await obtenerPerfiles(idUsuario);

    await actualizarUltimoIngreso(idUsuario);

    return { usuario: usuarios[0], perfilActivo };
  } finally {
    conx.release();
  }
}

async function obtenerPerfilRol(rol, idPerfil) {
  const conx = await conexion.getConnection();

  try {
    const [resultadoPerfilRol] = await conx.query(
      `SELECT * FROM perfiles WHERE idPerfil = ?`,
      [idPerfil]
    );

    if (resultadoPerfilRol.length === 0) {
      throw new Error(`No se encontró el perfil en la tabla perfiles`);
    }

    return {...resultadoPerfilRol[0],};
  } finally {
    conx.release();
  }
}

async function obtenerDisponibilidades(idPerfil) {
  const conx = await conexion.getConnection();

  try {
    const [disponibilidades] = await conx.query(
      'SELECT * FROM disponibilidades WHERE idPerfil = ?',
      [idPerfil]
    );
    return disponibilidades;
  } finally {
    conx.release();
  }
}

async function obtenerPerfiles(idUsuario, categoria = null) {
  const conx = await conexion.getConnection();

  try {
    let query = 'SELECT * FROM usuarioPerfiles WHERE idUsuario = ?';
    const params = [idUsuario];

    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    const [perfiles] = await conx.query(query, params);
    return perfiles;
  } finally {
    conx.release();
  }
}

async function guardarImagen(archivo) {
  try {
    const result = await cloudinary.uploader.upload(archivo.tempFilePath, {
      folder: 'perfiles'
    });

    let ruta = result.secure_url;

    if (ruta.startsWith(prefijoImagen)) {
      ruta = ruta.substring(prefijoImagen.length);
    }

    return ruta;

  } catch (err) {
    console.error('Error al subir la imagen:', err);
    throw err;
  }
}

//FUNCIONES GENERALES

async function actualizarUltimoIngreso(idUsuario) {
  const conx = await conexion.getConnection();

  try {
    const fechaHora = obtenerFechaFormateada();

    const sql = `
      UPDATE usuarios
      SET ultimoIngreso = ?
      WHERE idUsuario = ?
    `;

    await conx.query(sql, [fechaHora, idUsuario]);
  } catch (err) {
    console.error('Error al actualizar el último ingreso:', err.sqlMessage || err);
    throw err;
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
  registrarPerfilAdicional,
  ingresarUsuario
};