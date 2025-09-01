const mysql = require('mysql2/promise');

// Configuración
const conexion = mysql.createPool({
  host: 'mysql.db.mdbgo.com',
  user: 'saludapp_admin',
  password: 'Practica3!',
  database: 'saludapp_bdd'
});

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
  // 1. Obtener disponibilidades filtradas
  const disponibilidades = await obtenerDisponibilidades({ idEspecialidad, idSeccional, diaSemana });

  const turnosDisponibles = [];

  for (const disp of disponibilidades) {
    // 2. Obtener duración del turno para la especialidad de cada disponibilidad
    const [especialidad] = await conexion.query(
      'SELECT duracion FROM especialidades WHERE idEspecialidad = ?',
      [disp.idEspecialidad]
    );
    const duracionTurno = especialidad[0]?.duracion;

    if (!duracionTurno) {
      console.warn(`No se encontró duración para idEspecialidad: ${disp.idEspecialidad}`);
      continue; // saltar esta disponibilidad
    }

    let hora = disp.horaInicio;
    while (hora + duracionTurno <= disp.horaFin) {
      // 3. Generar fecha próxima del diaSemana
      const fecha = calcularProximaFecha(disp.diaSemana); // Usamos el diaSemana de la disponibilidad
      const fechaStr = formatearFechaParaIdTurno(fecha); // 'ddmmyyyy'

      // 4. Generar ID del turno
      const idTurno = `s${disp.idSeccional}p${disp.idPerfil}e${disp.idEspecialidad}d${fechaStr}h${hora}`;

      // 5. Verificar si existe en turnosActivos
      const disponible = await verificarDisponibilidadTurno(idTurno);
      if (disponible) {
        turnosDisponibles.push({
          idTurno,
          idPerfil: disp.idPerfil,
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
      turno.idPerfilProfesional,
      turno.idEspecialidad,
      turno.diaSemana,
      turno.horaInicio,
      turno.horaFin,
      turno.idPerfilPaciente
  ];

  const [resultado] = await conexion.query(query, valores);

  auditarCambios(0, 0, 'Se solicitó el turno '+turno.idTurno+' para el paciente ' + turno.idPerfilPaciente);

  //Retorna un objeto que identifica el turno insertado
  return {
    idTurno: turno.idTurno,
    mensaje: 'Turno insertado exitosamente'
  };
}

//Verificar disponibilidad de turnos
async function verificarDisponibilidadTurno(idTurno) {
  const [rows] = await conexion.query(
    'SELECT EXISTS(SELECT 1 FROM turnosActivos WHERE idTurno = ?) AS disponible',
    [idTurno]
  );
  return rows[0].disponible === 0; // true si NO existe (disponible)
}

async function obtenerPerfilesPorEspecialidad(idEspecialidad) {
  const query = 'SELECT idPerfil FROM perfilesProfesional WHERE idEspecialidad = ?';
  const [resultado] = await conexion.query(query, [idEspecialidad]);
  return resultado.map(resultado => resultado.idPerfil);
}

//GESTIONAR HISTORIAS CLINICAS
async function escribirInforme(idPaciente, idProfesional, informe, imagen){
  fecha = obtenerFechaFormateada();
  const sql = `
    INSERT INTO historiasClinicas (idPerfilPaciente, idPerfilProfesional, fecha, informe, imagen)
    VALUES (?, ?, ?, ?, ?)
  `;
  const valores = [idPaciente, idProfesional, fecha, informe, imagen];
  const [resultado] = await conx.query(sql, valores);
  return resultado.insertId;
}

async function agregarPerfilUsuario(conx, idUsuario, categoria, rol, alias) {
  

  return resultadoPerfilUsuario.insertId;
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
  escribirInforme,
  obtenerDisponibilidades,
  obtenerPerfilesPorEspecialidad,
  obtenerTurnos,
  solicitarTurno
};