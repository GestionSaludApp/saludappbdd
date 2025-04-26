const mysql = require('mysql2/promise');

// Configuración
const conexion = mysql.createPool({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});

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
  let idProfesional = null;
  const tablaDestino = (() => {
    switch (nuevoPerfil.rol.toLowerCase()) {
      case 'paciente': return 'perfilesPaciente';
      case 'profesional': return 'perfilesProfesional';
      case 'administrador': return 'perfilesAdministrador';
      default: throw new Error('Tipo de usuario desconocido: ' + nuevoPerfil.rol);
    }
  })();

  const {
    nombre = 'nombre',
    apellido = 'apellido',
    dni = '00000000',
    fechaNacimiento = '1900-01-01',
    idEspecialidad = 0,
    disponibilidad = []
  } = nuevoPerfil || {};

  let sqlDatos = '';
  let valoresDatos = [];

  if (tablaDestino === 'perfilesProfesional') {
    sqlDatos = `
      INSERT INTO perfilesProfesional (idPerfil, idUsuario, idEspecialidad, nombre, apellido, dni, fechaNacimiento)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    valoresDatos = [idPerfil, idUsuario, idEspecialidad, nombre, apellido, dni, fechaNacimiento];
    const [resultado] = await conexion.query(sqlDatos, valoresDatos);
    idProfesional = resultado.insertId;
  } else {
    sqlDatos = `
      INSERT INTO ${tablaDestino} (idPerfil, idUsuario, nombre, apellido, dni, fechaNacimiento)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    valoresDatos = [idPerfil, idUsuario, nombre, apellido, dni, fechaNacimiento];
    await conx.query(sqlDatos, valoresDatos);
  }
  
  if (tablaDestino === 'perfilesProfesional' && Array.isArray(disponibilidad)) {
    const sqlDisp = `
      INSERT INTO disponibilidades (idSeccional, idProfesional, idEspecialidad, diaSemana, horaInicio, horaFin)
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

      await conx.query(sqlDisp, [idSeccional, idProfesional, idEspecialidad, diaSemana, horaInicio, horaFin]);
    }
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
      perfilActivo.disponibilidad = await obtenerDisponibilidades(perfilActivo.idProfesional);
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
    let tabla;
    switch (rol) {
      case 'paciente':
        tabla = 'perfilesPaciente';
        break;
      case 'profesional':
        tabla = 'perfilesProfesional';
        break;
      case 'administrador':
        tabla = 'perfilesAdministrador';
        break;
      default:
        throw new Error('Tipo de usuario desconocido');
    }

    const [resultadoPerfilRol] = await conx.query(
      `SELECT * FROM ${tabla} WHERE idPerfil = ?`,
      [idPerfil]
    );

    if (resultadoPerfilRol.length === 0) {
      throw new Error(`No se encontró el perfil en la tabla ${tabla}`);
    }

    return {...resultadoPerfilRol[0],};
  } finally {
    conx.release();
  }
}

async function obtenerDisponibilidades(idProfesional) {
  const conx = await conexion.getConnection();

  try {
    const [disponibilidades] = await conx.query(
      'SELECT * FROM disponibilidades WHERE idProfesional = ?',
      [idProfesional]
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
  ingresarUsuario
};