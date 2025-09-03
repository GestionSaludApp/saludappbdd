const mysql = require('mysql2/promise');

const { credenciales } = require("./credenciales.js");
const conexion = mysql.createPool(credenciales.mysql);

//OBTENER ESPECIALIDADES
async function buscarEspecialidades(filtros) {
  const { idEspecialidad, nombre, duracion } = filtros;

  let query = 'SELECT * FROM especialidades WHERE 1=1';
  const params = [];

  if (idEspecialidad !== undefined) {
    query += ' AND idEspecialidad = ?';
    params.push(idEspecialidad);
  }
  
  if (nombre !== undefined) {
    query += ' AND nombre = ?';
    params.push(nombre);
  }

  if (duracion !== undefined) {
    query += ' AND duracion = ?';
    params.push(duracion);
  }

  const [resultadoEspecialidades] = await conexion.query(query, params);
  return resultadoEspecialidades;
}

//MODIFICAR UNA ESPECIALIDAD
async function editarEspecialidad(ip, idUsuario, datosEspecialidad) {
  const { idEspecialidad, nombre, duracion } = datosEspecialidad;
  const sql = `
    UPDATE especialidades
    SET nombre = ?, duracion = ?
    WHERE idEspecialidad = ?
  `;

  try {
    const [resultado] = await conexion.execute(sql, [nombre, duracion, idEspecialidad]);

    if (resultado.affectedRows === 0) {
      throw new Error("No se encontró la especialidad para actualizar.");
    }

    auditarCambios(idUsuario, ip, 'Se modificó la especialidad: ' + idEspecialidad + datosEspecialidad.nombre + datosEspecialidad.duracion);
    return { exito: true, mensaje: "Especialidad actualizada correctamente." };
  } catch (error) {
    console.error("Error al actualizar especialidad:", error.message);
    throw error;
  }
}

//INSERTAR UNA ESPECIALIDAD
async function agregarEspecialidad(ip, idUsuario, nuevaEspecialidad) {
  const sql = `
    INSERT INTO especialidades (nombre, duracion)
    VALUES (?, ?)
  `;
  const valores = [
    nuevaEspecialidad.nombre,
    nuevaEspecialidad.duracion
  ];

  const conx = await conexion.getConnection();
  try {
    const [resultadoEspecialidad] = await conx.query(sql, valores);
    const idEspecialidad = resultadoEspecialidad.insertId;

    auditarCambios(idUsuario, ip, 'Se agrego la especialidad: ' + idEspecialidad + nuevaEspecialidad.nombre);

    return resultadoEspecialidad;
  } catch (err) {
    console.error('Error al crear la especialidad: ', err.sqlMessage || err);
    throw err;
  } finally {
    conx.release();
  }
}

//ELIMINAR UNA ESPECIALIDAD
async function eliminarEspecialidad(ip, idUsuario, datosEspecialidad) {
  const { idEspecialidad, nombre, duracion } = datosEspecialidad;

  const sql = `
    DELETE FROM especialidades
    WHERE idEspecialidad = ? AND nombre = ? AND duracion = ?
  `;

  try {
    const [resultado] = await conexion.execute(sql, [idEspecialidad, nombre, duracion]);

    if (resultado.affectedRows === 0) {
      throw new Error("No se encontró la especialidad con los datos indicados para eliminar.");
    }

    auditarCambios(idUsuario, ip, 'Se eliminó la especialidad: ' + idEspecialidad + ' - ' + datosEspecialidad.nombre);
    return { exito: true, mensaje: "Especialidad eliminada correctamente." };
  } catch (error) {
    console.error("Error al eliminar especialidad:", error.message);
    throw error;
  }
}

//OBTENER SUCURSALES
async function buscarSeccionales(filtros) {
  const { idSeccional, nombre, direccion, ciudad, provincia, telefono, email } = filtros;

  let query = 'SELECT * FROM seccionales WHERE 1=1';
  const params = [];

  if (idSeccional !== undefined) {
    query += ' AND idSeccional = ?';
    params.push(idSeccional);
  }
  
  if (nombre !== undefined) {
    query += ' AND nombre = ?';
    params.push(nombre);
  }

  if (direccion !== undefined) {
    query += ' AND direccion = ?';
    params.push(direccion);
  }

  if (ciudad !== undefined) {
    query += ' AND ciudad = ?';
    params.push(ciudad);
  }

  if (provincia !== undefined) {
    query += ' AND provincia = ?';
    params.push(provincia);
  }

  if (telefono !== undefined) {
    query += ' AND telefono = ?';
    params.push(telefono);
  }

  if (email !== undefined) {
    query += ' AND email = ?';
    params.push(email);
  }

  const [resultadoSeccionales] = await conexion.query(query, params);
  return resultadoSeccionales;
}

//MODIFICAR UNA SECCIONAL
async function modificarSeccional(datosSeccional) {
  const { idSeccional, nombre, direccion, ciudad, provincia, telefono, email } = datosSeccional;
  const sql = `
    UPDATE seccionales
    SET nombre = ?, direccion = ?, ciudad = ?, provincia = ?, telefono = ?, email = ?
    WHERE idSeccional = ?
  `;

  try {
    const [resultado] = await conexion.execute(sql, [nombre, direccion, ciudad, provincia, telefono, email, idSeccional]);

    if (resultado.affectedRows === 0) {
      throw new Error("No se encontró la seccional para actualizar.");
    }

    return { exito: true, mensaje: "Seccional actualizada correctamente." };
  } catch (error) {
    console.error("Error al actualizar seccional:", error.message);
    throw error;
  }
}

//INSERTAR UNA SECCIONAL
async function agregarSeccional(ip, idUsuario, nuevaSeccional) {
  const sql = `
    INSERT INTO seccionales (nombre, direccion, ciudad, provincia, telefono, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const valores = [
    nuevaSeccional.nombre,
    nuevaSeccional.direccion,
    nuevaSeccional.ciudad,
    nuevaSeccional.provincia,
    nuevaSeccional.telefono,
    nuevaSeccional.email
  ];

  const conx = await conexion.getConnection();
  try {
    const [resultadoSeccional] = await conx.query(sql, valores);
    const idSeccional = resultadoSeccional.insertId;

    auditarCambios(idUsuario, ip, 'Se agrego la seccional: ' + idSeccional + nuevaSeccional.nombre);

    return resultadoSeccional;
  } catch (err) {
    console.error('Error al crear la seccional: ', err.sqlMessage || err);
    throw err;
  } finally {
    conx.release();
  }
}

//ELIMINAR UNA SECCIONAL
async function eliminarSeccional(ip, idUsuario, datosSeccional) {
  const { idSeccional, nombre, ciudad, provincia } = datosSeccional;

  const sql = `
    DELETE FROM seccionales
    WHERE idSeccional = ? AND nombre = ? AND ciudad = ? AND provincia = ?
  `;

  try {
    const [resultado] = await conexion.execute(sql, [idSeccional, nombre, ciudad, provincia]);

    if (resultado.affectedRows === 0) {
      throw new Error("No se encontró la seccional con los datos indicados para eliminar.");
    }

    auditarCambios(idUsuario, ip, 'Se eliminó la seccional: ' + idSeccional + ' - ' + nombre);
    return { exito: true, mensaje: "Seccional eliminada correctamente." };
  } catch (error) {
    console.error("Error al eliminar seccional:", error.message);
    throw error;
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

module.exports = {
  agregarEspecialidad,
  buscarEspecialidades,
  editarEspecialidad,
  eliminarEspecialidad,
  agregarSeccional,
  buscarSeccionales,
  modificarSeccional,
  eliminarSeccional
};