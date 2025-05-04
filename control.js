const bddUsuario = require('./bddUsuario');
const bddTurno = require('./bddTurno');

async function verificarNuevoUsuario(ip, nuevoUsuario, nuevoPerfil) {
  const camposObligatorios = [
    'email',
    'password',
    'fechaCreacion',
    'ultimoIngreso'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return nuevoUsuario[campo] === undefined || nuevoUsuario[campo] === null || nuevoUsuario[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddUsuario.registrarUsuario(ip, nuevoUsuario, nuevoPerfil);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al registrar en la base de datos:', error);
    return { valido: false, mensaje: 'Error al registrar en la base de datos' };
  }
}

async function registrarPerfilAdicional(ip, idUsuario, nuevoPerfil) {
  const camposObligatorios = [
    'alias',
    'categoria',
    'rol'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return nuevoUsuario[campo] === undefined || nuevoUsuario[campo] === null || nuevoUsuario[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddUsuario.registrarPerfilAdicional(ip, idUsuario, nuevoPerfil);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al registrar en la base de datos:', error);
    return { valido: false, mensaje: 'Error al registrar en la base de datos' };
  }
}

async function verificarUsuario(usuario) {
  const camposObligatorios = ['email', 'password'];

  const faltantes = camposObligatorios.filter(campo => {
    return usuario[campo] === undefined || usuario[campo] === null || usuario[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddUsuario.ingresarUsuario(usuario.email, usuario.password);
    return { valido: true, usuario: resultado.usuario, perfilActivo: resultado.perfilActivo };
  } catch (error) {
    console.error('Error al buscar en la base de datos:', error);
    return { valido: false, mensaje: 'Error al buscar en la base de datos' };
  }
}

async function buscarDisponibilidades(filtros) {
  try {
    const resultado = await bddTurno.obtenerDisponibilidades(filtros);
    return { valido: true, disponibilidades: resultado };
  } catch (error) {
    console.error('Error al consultar disponibilidades:', error);
    return { valido: false, mensaje: 'Error al consultar disponibilidades' };
  }
}

async function buscarTurnos(filtros) {
  try {
    const resultado = await bddTurno.obtenerTurnos(filtros);
    return { valido: true, turnos: resultado };
  } catch (error) {
    console.error('Error al consultar turnos:', error);
    return { valido: false, mensaje: 'Error al consultar turnos' };
  }
}

async function solicitarTurno(turno) {
  try {
    const resultado = await bddTurno.solicitarTurno(turno);
    return { valido: true, turno: resultado };
  } catch (error) {
    console.error('Error al solicitar turnos: ', error);
    return { valido: false, mensaje: 'Error al solicitar turnos' };
  }
}

module.exports = {
  verificarNuevoUsuario,
  verificarUsuario,
  registrarPerfilAdicional,
  buscarDisponibilidades,
  buscarTurnos,
  solicitarTurno,
};