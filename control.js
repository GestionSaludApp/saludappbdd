const bdd = require('./bdd');

function verificarNuevoUsuario(usuario, callback) {
  const camposObligatorios = [
    'email',
    'password',
    'tipo',
    'fechaCreacion',
    'ultimoIngreso'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return usuario[campo] === undefined || usuario[campo] === null || usuario[campo] === '';
  });

  if (faltantes.length > 0) {
    return callback({ valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` });
  }

  // Si pasa la validación, intentamos registrar en la BDD
  bdd.registrarUsuario(usuario, (error, resultado) => {
    if (error) {
      return callback({ valido: false, mensaje: 'Error al registrar en la base de datos' });
    }

    return callback({ valido: true, resultado });
  });
}

function verificarUsuario(usuario, callback) {
  const camposObligatorios = [
    'email',
    'password',
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return usuario[campo] === undefined || usuario[campo] === null || usuario[campo] === '';
  });

  if (faltantes.length > 0) {
    return callback({ valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` });
  }

  // Si pasa la validación, intentamos encontrarlo en la BDD
  bdd.ingresarUsuario(usuario, (error, resultado) => {
    if (error) {
      return callback({ valido: false, mensaje: 'Error al buscar en la base de datos' });
    }

    return callback({ valido: true, resultado });
  });
}

module.exports = {
  verificarNuevoUsuario,
  verificarUsuario,
};