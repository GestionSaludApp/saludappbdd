const mysql = require('mysql2/promise');

const { credenciales } = require("./credenciales.js");
const conexion = mysql.createPool(credenciales.mysql);

// Función para obtener disponibilidades con filtros opcionales
async function obtenerDisponibilidades({ idEspecialidad, idSeccional, diaSemana }) {
  let query = 'SELECT * FROM disponibilidades WHERE 1=1';
  const params = [];

  if (idEspecialidad !== undefined) {
    query += ' AND idEspecialidad = ?';
    params.push(idEspecialidad);
  }
  
  if (idSeccional !== undefined) {
    query += ' AND idSeccional = ?';
    params.push(idSeccional);
  }

  if (diaSemana !== undefined) {
    query += ' AND diaSemana = ?';
    params.push(diaSemana);
  }

  const [resultadoDisponibilidades] = await conexion.query(query, params);
  return resultadoDisponibilidades;
}

async function obtenerTurnos({ idEspecialidad, idSeccional, diaSemana }) {
  //Obtener disponibilidades filtradas
  const disponibilidades = await obtenerDisponibilidades({ idEspecialidad, idSeccional, diaSemana });

  const turnosDisponibles = [];

  for (const disp of disponibilidades) {
    //Obtener duración del turno para la especialidad de cada disponibilidad
    const [especialidad] = await conexion.query(
      'SELECT duracion FROM especialidades WHERE idEspecialidad = ? AND estado = "activo"',
      [disp.idEspecialidad]
    );
    const duracionTurno = especialidad[0]?.duracion;

    if (!duracionTurno) {
      console.warn(`No se encontró duración para idEspecialidad: ${disp.idEspecialidad}`);
      continue; //la saltea
    }

    let hora = disp.horaInicio;
    while (hora + duracionTurno <= disp.horaFin) {
      //Generar fecha próxima del diaSemana
      const fecha = calcularProximaFecha(disp.diaSemana);
      const fechaStr = formatearFechaParaIdTurno(fecha);

      //Generar ID del turno
      const idTurno = `s${disp.idSeccional}p${disp.idPerfil}e${disp.idEspecialidad}d${fechaStr}h${hora}`;

      //Verificar si ya esta tomado en turnos
      const disponible = await verificarDisponibilidadTurno(idTurno);
      if (disponible) {
        turnosDisponibles.push({
          idTurno,
          idProfesional: disp.idPerfil,
          idEspecialidad: disp.idEspecialidad,
          idSeccional: disp.idSeccional,
          diaSemana: disp.diaSemana,
          fecha,
          horaInicio: hora,
          horaFin: hora + duracionTurno
        });
      }

      hora += duracionTurno;
    }
  }

  return turnosDisponibles;
}

//Obtiene turnos para las vistas de cronograma de usuarios
async function obtenerTurnosPorUsuario({ idPerfil, idEspecialidad, idSeccional, diaSemana }) {
  let query = `
    SELECT * 
    FROM turnos 
    WHERE (idPerfilPaciente = ? OR idPerfilProfesional = ?)
  `;
  const params = [idPerfil, idPerfil];

  if (idEspecialidad) {
    query += " AND idEspecialidad = ?";
    params.push(idEspecialidad);
  }
  if (idSeccional) {
    query += " AND idSeccional = ?";
    params.push(idSeccional);
  }
  if (diaSemana) {
    query += " AND diaSemana = ?";
    params.push(diaSemana);
  }

  const [resultado] = await conexion.query(query, params);
  return resultado;
}

// Función para insertar un turno
async function solicitarTurno(turno) {
  const disponible = await verificarDisponibilidadTurno(turno.idTurno);

  if (!disponible) {
      throw new Error('El turno ya existe.');
  }

  const query = `
      INSERT INTO turnos
      (idTurno, idSeccional, idPerfilProfesional, idEspecialidad, diaSemana, horaInicio, horaFin, idPerfilPaciente)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const valores = [
      turno.idTurno,
      turno.idSeccional,
      turno.idProfesional,
      turno.idEspecialidad,
      turno.diaSemana,
      turno.horaInicio,
      turno.horaFin,
      turno.idPaciente
  ];

  const [resultado] = await conexion.query(query, valores);

  auditarCambios(0, 0, 'Se solicitó el turno '+turno.idTurno+' para el paciente ' + turno.idPaciente);

  //Retorna un objeto que identifica el turno insertado
  return {
    idTurno: turno.idTurno,
    mensaje: 'Turno insertado exitosamente'
  };
}

//Verificar disponibilidad de turnos
async function verificarDisponibilidadTurno(idTurno) {
  const [rows] = await conexion.query(
    'SELECT EXISTS(SELECT 1 FROM turnos WHERE idTurno = ?) AS disponible',
    [idTurno]
  );
  return rows[0].disponible === 0; // true si NO existe (disponible)
}

async function obtenerPerfilesPorEspecialidad(idEspecialidad) {
  const query = 'SELECT idPerfil FROM perfilesProfesional WHERE idEspecialidad = ? AND estado = "activo"';
  const [resultado] = await conexion.query(query, [idEspecialidad]);
  return resultado.map(resultado => resultado.idPerfil);
}

async function agregarPerfilUsuario(conx, idUsuario, categoria, rol, alias) {
  return resultadoPerfilUsuario.insertId;
}

//INSERTAR UN REPORTE MEDICO
async function agregarReporte(idUsuario, ip, nuevoReporte) {
  const fecha = obtenerFechaFormateada();
  const sql = `
    INSERT INTO reportes (idPerfilPaciente, idPerfilProfesional, fecha, informe, imagen)
    VALUES (?, ?, ?, ?, ?)
  `;
  const valores = [
    nuevoReporte.idPerfilPaciente,
    nuevoReporte.idPerfilProfesional,
    fecha,
    nuevoReporte.informe,
    nuevoReporte.imagen
  ];

  const conx = await conexion.getConnection();
  try {
    const [resultadoReporte] = await conx.query(sql, valores);
    const idReporte = resultadoReporte.insertId;

    if (resultadoReporte) {
      auditarCambios(idUsuario, ip, 'Se agrego el reporte: ' + idReporte + ' sobre el paciente: ' + nuevoReporte.idPerfilPaciente);
      this.finalizarTurno(idUsuario, ip, nuevoReporte.idTurno);
    }

    return resultadoReporte;
  } catch (err) {
    console.error('Error al crear el reporte: ', err.sqlMessage || err);
    throw err;
  } finally {
    conx.release();
  }
}

//FINALIZAR UN TURNO
async function finalizarTurno(idUsuario, ip, idTurno) {
  const fecha = obtenerFechaFormateada();
  const conexionLocal = await conexion.getConnection();

  try {
    await conexionLocal.beginTransaction();

    const queryCopiar = `
      INSERT INTO turnosFinalizados (idTurno, idSeccional, idPerfilProfesional, idEspecialidad, diaSemana, horaInicio, horaFin, idPerfilPaciente, fechaFinalizacion)
      SELECT idTurno, idSeccional, idPerfilProfesional, idEspecialidad, diaSemana, horaInicio, horaFin, idPerfilPaciente, ?
      FROM turnos
      WHERE idTurno = ?
    `;
    await conexionLocal.query(queryCopiar, [fecha, idTurno]);

    const queryEliminar = `DELETE FROM turnos WHERE idTurno = ?`;
    await conexionLocal.query(queryEliminar, [idTurno]);

    auditarCambios(idUsuario, ip, 'Se finalizó el turno ' + idTurno);

    await conexionLocal.commit();

    return {
      mensaje: 'Turno finalizado exitosamente'
    };
  } catch (error) {
    await conexionLocal.rollback();
    console.error('Error al finalizar turno:', error);
    throw new Error('No se pudo finalizar el turno');
  } finally {
    conexionLocal.release();
  }
}

//FUNCIONES GENERALES

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

function calcularProximaFecha(diaSemana) {
  const hoy = new Date();
  const hoyDia = hoy.getDay(); // 0-6
  let diff = diaSemana - hoyDia;
  if (diff < 0) diff += 7; // próxima semana
  hoy.setDate(hoy.getDate() + diff);
  return hoy;
}

function formatearFechaParaIdTurno(fecha) {
  const d = String(fecha.getDate()).padStart(2, '0');
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const a = fecha.getFullYear();
  return `${d}${m}${a}`;
}

module.exports = {
  obtenerDisponibilidades,
  obtenerPerfilesPorEspecialidad,
  obtenerTurnos,
  obtenerTurnosPorUsuario,
  solicitarTurno,
  finalizarTurno,
  agregarReporte
};