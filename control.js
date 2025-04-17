const bdd = require('./bdd');

function verificarDatosUsuario(usuario, callback) {
  const camposObligatorios = [
    'email',
    'password',
    'tipo',
    'datos',
    'fechaCreacion',
    'ultimoIngreso'
  ];

  const faltantes = camposObligatorios.filter(campo => !usuario[campo]);

  if (faltantes.length > 0) {
    return callback({ valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` });
  }

  // Datos válidos: llamamos a bdd
  bdd.registrarUsuario(usuario, (error, resultado) => {
    if (error) {
      return callback({ valido: false, mensaje: 'Error al registrar en la base de datos' });
    }

    return callback({ valido: true, resultado });
  });
}

module.exports = {
  verificarDatosUsuario
};