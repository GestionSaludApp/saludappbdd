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

function auditarCambios() {
  console.log('Se intentó auditar el cambio');
}

module.exports = {
  registrarUsuario
};
