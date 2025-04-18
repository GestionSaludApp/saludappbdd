const mysql = require('mysql');

//Configuración
const conexion = mysql.createConnection({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});

//Conexión
conexion.connect(function (err) {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos');
  }
});


function registrarUsuario(datosUsuario, callback) {
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

  conexion.query(sql, valores, function (err, result) {
    if (err) {
      console.error('Error al ejecutar INSERT:', err.sqlMessage || err);
      return callback(err, null);
    }

    auditarCambios();
    
    return callback(null, result);
  });
}

async function ingresarUsuario(email, password, callback) {

  try {
    // 1. Buscar en tabla usuario
    const [usuarios] = await conexion.query(
      'SELECT idUsuario, tipo FROM usuarios WHERE email = ? AND password = ?',
      [email, password]
    );

    if (usuarios.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const { idUsuario, tipo } = usuarios[0];

    // 2. Buscar en la tabla correspondiente
    let tabla;
    if (tipo === 'paciente') tabla = 'usuariosPaciente';
    else if (tipo === 'profesional') tabla = 'usuariosProfesional';
    else if (tipo === 'administrador') tabla = 'usuariosAdministrador';
    else throw new Error('Tipo de usuario desconocido');

    const [result] = await conexion.query(
      `SELECT * FROM ${tabla} WHERE idUsuario = ?`,
      [idUsuario]
    );

    if (result.length === 0) {
      throw new Error(`No se encontró el usuario en la tabla ${tabla}`);
    }

    return result[0]; // el objeto del usuario
  } finally {
    conexion.release();
  }
}

function auditarCambios() {
  console.log('Se intentó auditar el cambio');
}

module.exports = {
  registrarUsuario,
  ingresarUsuario,
};
