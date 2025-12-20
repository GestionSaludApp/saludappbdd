const bddUsuario = require('./bddUsuario');
const bddTurno = require('./bddTurno');
const bddGestion = require('./bddGestion');

const { credenciales } = require("./credenciales.js");

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
    return nuevoPerfil[campo] === undefined || nuevoPerfil[campo] === null || nuevoPerfil[campo] === '';
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

async function modificarPerfil(idUsuario, ip, datosPerfil) {
  const { idPerfil, nombre, apellido, dni, fechaNacimiento } = datosPerfil;

  if (!idPerfil || !nombre || !apellido || !dni || !fechaNacimiento) {
    throw new Error("Faltan datos para actualizar el perfil.");
  }

  try {
    const resultado = await bddUsuario.modificarPerfil(idUsuario, ip, datosPerfil);
    return { valido: true, perfil: resultado };
  } catch (error) {
    console.error('Error al modificar el perfil: ', error);
    return { valido: false, mensaje: 'Error al modificar el perfil' };
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

async function activarUsuario(email, password, codigo, ip) {
  try {
    if (!email || !password || !codigo) {
      return { ok: false, mensaje: 'Faltan datos para activar el usuario' };
    }

    const actualizado = await bddUsuario.activarUsuario(email, password, codigo, ip);

    if (actualizado) {
      return { ok: true };
    } else {
      return { ok: false, mensaje: 'No se pudo activar el usuario (datos incorrectos o código inválido)' };
    }
  } catch (error) {
    console.error('Error al activar el usuario:', error);
    return { ok: false, mensaje: 'Error en activación de usuario' };
  }
}

async function ingresarPerfil(idUsuario, idPerfil) {
  if (idUsuario === undefined || idPerfil === undefined) {
    return { valido: false, mensaje: `Faltan datos necesarios.` };
  }

  try {
    const perfilActivo = await bddUsuario.ingresarPerfil(idUsuario, idPerfil);
    return { valido: true, perfilActivo };
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

async function obtenerTurnosActivos() {
  try {
    const turnos = await bddTurno.obtenerTurnosActivos();
    return {
      valido: true,
      turnos
    };
  } catch (error) {
    console.error('Error al obtener turnos activos:', error);
    return {
      valido: false,
      mensaje: 'Error al obtener turnos activos'
    };
  }
}

async function buscarTurnosPorUsuario(filtros) {
  try {
    const resultado = await bddTurno.obtenerTurnosPorUsuario(filtros);
    return { valido: true, turnos: resultado };
  } catch (error) {
    console.error('Error al consultar turnos:', error);
    return { valido: false, mensaje: 'Error al consultar turnos' };
  }
}

async function buscarProfesionalesPorPaciente(idPerfilPaciente) {
  try {
    const profesionales = await bddTurno.buscarProfesionalesPorPaciente(idPerfilPaciente);

    return {
      valido: true,
      profesionales
    };

  } catch (error) {
    console.error('Error al buscar profesionales por paciente:', error);

    return {
      valido: false,
      mensaje: 'Error al buscar profesionales del paciente'
    };
  }
}

async function solicitarTurno(turno, ip) {
  try {
    const resultado = await bddTurno.solicitarTurno(turno, ip);
    return { valido: true, turno: resultado };
  } catch (error) {
    console.error('Error al solicitar turnos: ', error);
    return { valido: false, mensaje: 'Error al solicitar turnos' };
  }
}

async function cancelarTurno(idUsuario, ip, idTurno){
  try {
    const resultado = await bddTurno.cancelarTurno(idUsuario, ip, idTurno);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al cancelar el turno:', error);
    return { valido: false, mensaje: 'Error al modificar base de datos.' };
  }
}

async function finalizarTurno(idUsuario, ip, idTurno){
  try {
    const resultado = await bddTurno.finalizarTurno(idUsuario, ip, idTurno);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al finalizar el turno:', error);
    return { valido: false, mensaje: 'Error al modificar base de datos.' };
  }
}

async function buscarReportesPorPaciente(idPaciente) {
  try {
    const resultado = await bddTurno.buscarReportesPorPaciente(idPaciente);
    return { valido: true, reportes: resultado };
  } catch (error) {
    console.error('Error al consultar reportes:', error);
    return { valido: false, mensaje: 'Error al consultar reportes' };
  }
}

async function agregarEspecialidad(ip, idUsuario, nuevaEspecialidad){
  const camposObligatorios = [
    'nombre',
    'duracion'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return nuevaEspecialidad[campo] === undefined || nuevaEspecialidad[campo] === null || nuevaEspecialidad[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddGestion.agregarEspecialidad(ip, idUsuario, nuevaEspecialidad);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al registrar en la base de datos:', error);
    return { valido: false, mensaje: 'Error al registrar en la base de datos' };
  }
}

async function buscarEspecialidades(filtros) {
  try {
    const resultado = await bddGestion.buscarEspecialidades(filtros);
    return { valido: true, especialidades: resultado };
  } catch (error) {
    console.error('Error al consultar especialidades:', error);
    return { valido: false, mensaje: 'Error al consultar especialidades' };
  }
}

async function editarEspecialidad(ip, idUsuario, datosEspecialidad) {
  const { idEspecialidad, nombre, duracion } = datosEspecialidad;

  if (!idEspecialidad || !nombre || duracion == null) {
    throw new Error("Faltan datos para actualizar la especialidad.");
  }

  try {
    const resultado = await bddGestion.editarEspecialidad(ip, idUsuario, datosEspecialidad);
    return { valido: true, especialidad: resultado };
  } catch (error) {
    console.error('Error al modificar la especialidad: ', error);
    return { valido: false, mensaje: 'Error al modificar la especialidad' };
  }
}

async function eliminarEspecialidad(ip, idUsuario, datosEspecialidad){
  const camposObligatorios = [
    'idEspecialidad',
    'nombre',
    'duracion'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return datosEspecialidad[campo] === undefined || datosEspecialidad[campo] === null || datosEspecialidad[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddGestion.eliminarEspecialidad(ip, idUsuario, datosEspecialidad);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al eliminar el registro de la base de datos:', error);
    return { valido: false, mensaje: 'Error al eliminar de la base de datos' };
  }
}

async function agregarSeccional(ip, idUsuario, nuevaSeccional){
  const camposObligatorios = [
    'nombre'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return nuevaSeccional[campo] === undefined || nuevaSeccional[campo] === null || nuevaSeccional[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddGestion.agregarSeccional(ip, idUsuario, nuevaSeccional);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al registrar en la base de datos:', error);
    return { valido: false, mensaje: 'Error al registrar en la base de datos' };
  }
}

async function buscarSeccionales(filtros) {
  try {
    const resultado = await bddGestion.buscarSeccionales(filtros);
    return { valido: true, seccionales: resultado };
  } catch (error) {
    console.error('Error al consultar seccionales:', error);
    return { valido: false, mensaje: 'Error al consultar seccionales' };
  }
}

async function modificarSeccional(idUsuario, ip, datosSeccional) {
  const { idSeccional, nombre, direccion, ciudad, provincia, telefono, email } = datosSeccional;

  if (!idSeccional || !nombre || !direccion || !ciudad || !provincia || !telefono || !email) {
    throw new Error("Faltan datos para actualizar la seccional.");
  }

  try {
    const resultado = await bddGestion.modificarSeccional(datosSeccional);
    return { valido: true, seccional: resultado };
  } catch (error) {
    console.error('Error al modificar la seccional: ', error);
    return { valido: false, mensaje: 'Error al modificar la seccional' };
  }
}

async function eliminarSeccional(ip, idUsuario, datosSeccional) {
  const camposObligatorios = [
    'idSeccional',
    'nombre',
    'ciudad',
    'provincia'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return datosSeccional[campo] === undefined || 
           datosSeccional[campo] === null || 
           datosSeccional[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddGestion.eliminarSeccional(ip, idUsuario, datosSeccional);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al eliminar la seccional de la base de datos:', error);
    return { valido: false, mensaje: 'Error al eliminar de la base de datos' };
  }
}

async function agregarReporte(idUsuario, ip, nuevoReporte){
  const camposObligatorios = [
    'idPerfilPaciente',
    'idPerfilProfesional',
    'informe'
  ];

  const faltantes = camposObligatorios.filter(campo => {
    return nuevoReporte[campo] === undefined || nuevoReporte[campo] === null || nuevoReporte[campo] === '';
  });

  if (faltantes.length > 0) {
    return { valido: false, mensaje: `Faltan campos: ${faltantes.join(', ')}` };
  }

  try {
    const resultado = await bddTurno.agregarReporte(idUsuario, ip, nuevoReporte);
    return { valido: true, resultado };
  } catch (error) {
    console.error('Error al registrar en la base de datos:', error);
    return { valido: false, mensaje: 'Error al registrar en la base de datos' };
  }
}

async function cambiarSituacionTurno(idTurno, situacion) {
  try {
    await bddTurno.cambiarSituacionTurno(idTurno, situacion);

    return {
      valido: true
    };

  } catch (error) {
    console.error('Error al cambiar situación del turno:', error);

    return {
      valido: false,
      mensaje: 'Error al cambiar la situación del turno'
    };
  }
}

async function enviarConsulta(nombre, email, mensaje) {
  try {
    if (!nombre || !email || !mensaje) {
      return {
        valido: false,
        mensaje: 'Datos incompletos'
      };
    }

  const cuerpoEmail =
    `Consulta de ${nombre}<br><br>` +
    `${mensaje.replace(/\n/g, '<br>')}<br><br>` +
    `Responder a ${email}`;

    // email destino REAL (no el que manda el usuario)
    const destinatario = credenciales.email.usuario;

    const enviado = await bddUsuario.enviarEmailGeneral(
      destinatario,
      'Consulta desde la aplicación',
      cuerpoEmail
    );

    if (!enviado) {
      throw new Error('No se pudo enviar el email');
    }

    return { valido: true };

  } catch (error) {
    console.error('Error al enviar consulta:', error);
    return {
      valido: false,
      mensaje: 'Error al enviar la consulta'
    };
  }
}

// BUSCAR AUDITORIA
async function buscarAuditoria(cantidad) {
  try {
    // Normalización
    if (cantidad === undefined || cantidad === null) {
      cantidad = 0;
    }

    cantidad = Number(cantidad);

    if (isNaN(cantidad) || cantidad < 0) {
      return {
        valido: false,
        mensaje: 'La cantidad debe ser un número mayor o igual a 0'
      };
    }

    const auditoria = await bddGestion.buscarAuditoria(cantidad);

    return {
      valido: true,
      auditoria
    };

  } catch (error) {
    console.error('Error en buscarAuditoria:', error);

    return {
      valido: false,
      mensaje: 'Error al obtener la auditoría'
    };
  }
}

async function buscarPendientes() {
  try {
    const pendientes = await bddGestion.buscarPendientes();

    return {
      valido: true,
      pendientes
    };

  } catch (error) {
    console.error('Error al buscar pendientes:', error);

    return {
      valido: false,
      mensaje: 'Error al obtener registros pendientes'
    };
  }
}

async function cambiarEstado(tabla, id, nuevoEstado) {

  if (!tabla || id === undefined || !nuevoEstado) {
    return {
      valido: false,
      mensaje: 'Datos incompletos'
    };
  }

  try {
    await bddGestion.cambiarEstado(tabla, id, nuevoEstado);

    return {
      valido: true
    };
  } catch (error) {
    return {
      valido: false,
      mensaje: error.message
    };
  }
}


async function buscarPerfilesPorPermiso() {
  try {
    const perfiles = await bddGestion.buscarPerfilesPorPermiso();

    return {
      valido: true,
      perfiles
    };

  } catch (error) {
    console.error('Error al buscar perfiles por permiso:', error);

    return {
      valido: false,
      mensaje: 'Error al obtener perfiles por permiso'
    };
  }
}

module.exports = {
  verificarNuevoUsuario,
  verificarUsuario,
  activarUsuario,
  registrarPerfilAdicional,
  modificarPerfil,
  ingresarPerfil,
  buscarDisponibilidades,
  buscarTurnos,
  obtenerTurnosActivos,
  buscarTurnosPorUsuario,
  solicitarTurno,
  cancelarTurno,
  finalizarTurno,
  agregarEspecialidad,
  buscarEspecialidades,
  editarEspecialidad,
  eliminarEspecialidad,
  agregarSeccional,
  buscarSeccionales,
  modificarSeccional,
  eliminarSeccional,
  agregarReporte,
  buscarReportesPorPaciente,
  buscarAuditoria,
  buscarPendientes,
  buscarPerfilesPorPermiso,
  cambiarEstado,
  buscarProfesionalesPorPaciente,
  cambiarSituacionTurno,
  enviarConsulta
};