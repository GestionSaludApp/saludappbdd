const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

const control = require('./control.js');
const bddImagenes = require('./bddImagenes.js');

//HABILITAR EL PUERTO
app.listen(process.env.PORT || 3000, () => {
  console.log('Escuchando el puerto 3000.');
});

//REGISTRAR UN NUEVO USUARIO
app.post('/registrarUsuario', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Parsear los JSON stringificados
    const nuevoUsuario = JSON.parse(req.body.nuevoUsuario);
    const nuevoPerfil = JSON.parse(req.body.nuevoPerfil);

    // Recuperar la imagen
    const imagen = req.files?.imagen || null;
    if (imagen) {
      nuevoPerfil.imagen = imagen;
    }

    const resultado = await control.verificarNuevoUsuario(ip, nuevoUsuario, nuevoPerfil);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Usuario registrado correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno en /registrarUsuario:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//AGREGAR UN NUEVO PERFIL A UN USUARIO EXISTENTE
app.post('/registrarPerfilAdicional', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { idUsuario, nuevoPerfil } = req.body;
    
    const resultado = await control.registrarPerfilAdicional(ip, idUsuario, nuevoPerfil);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Perfil registrado correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno en /registrarPerfilAdicional:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//MODIFICAR PERFiL
app.post('/modificarPerfil', async (req, res) => {
  try{
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { idUsuario } = req.body.idUsuario;
    const datosPerfilObjeto = JSON.parse(datosPerfil);

    const resultado = await control.modificarPerfil(idUsuario, ip, datosPerfilObjeto);
    if (resultado.valido) {
      res.status(200).json(exito);
    } else {
      res.status(400).json({error: resultado.mensaje})
    }
  } catch (err) {
    console.error('Error interno en modificar perfil:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }

});

//LOGUEAR UN USUARIO
app.post('/ingresarUsuario', async (req, res) => {
  try {
    const datosUsuario = req.body;
    const resultado = await control.verificarUsuario(datosUsuario);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Usuario autenticado correctamente', usuario: resultado.usuario, perfilActivo: resultado.perfilActivo });
  } catch (err) {
    console.error('Error interno en ingreso de usuario:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//BUSCAR DISPONIBILIDADES
app.post('/buscarDisponibilidades', async (req, res) => {
  const filtros = req.body;

  const resultado = await control.buscarDisponibilidades(filtros);

  if (resultado.valido) {
    res.status(200).json(resultado.disponibilidades);
  } else {
    res.status(400).json({ error: resultado.mensaje });
  }
});

//BUSCAR TURNOS
app.post('/buscarTurnos', async (req, res) => {
  const filtros = req.body;

  const resultado = await control.buscarTurnos(filtros);

  if (resultado.valido) {
    res.status(200).json(resultado.turnos);
  } else {
    res.status(400).json({ error: resultado.mensaje });
  }
});

//BUSCAR TURNOS DEL USUARIO
app.post('/buscarTurnosPorUsuario', async (req, res) => {
  const filtros = req.body;

  const resultado = await control.buscarTurnosPorUsuario(filtros);

  if (resultado.valido) {
    res.status(200).json(resultado.turnos);
  } else {
    res.status(400).json({ error: resultado.mensaje });
  }
});

//SOLICITAR TURNOS
app.post('/solicitarTurno', async (req, res) => {
  const turno = req.body;
  const resultado = await control.solicitarTurno(turno);

  if (resultado.valido) {
    res.status(200).json({
      exito: true,
      turno: resultado.turno
    });
  } else {
    res.status(400).json({
      exito: false,
      error: resultado.mensaje
    });
  }
});

//AGREGAR ESPECIALIDADES
app.post('/agregarEspecialidad', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { idUsuario, nuevaEspecialidad } = req.body;
    const nuevaEspecialidadObjeto = JSON.parse(nuevaEspecialidad);

    const resultado = await control.agregarEspecialidad(ip, idUsuario, nuevaEspecialidadObjeto);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Especialidad registrada correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno en agregar especialidades:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//BUSCAR ESPECIALIDADES
app.post('/buscarEspecialidades', async (req, res) => {
  const filtros = req.body;

  const resultado = await control.buscarEspecialidades(filtros);

  if (resultado.valido) {
    res.status(200).json(resultado.especialidades);
  } else {
    res.status(400).json({ error: resultado.mensaje });
  }
});

//MODIFICAR ESPECIALIDADES
app.post('/editarEspecialidad', async (req, res) => {
  try {
    const { idUsuario, datosEspecialidad } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const resultado = await control.editarEspecialidad(ip, idUsuario, datosEspecialidad);
    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Especialidad actualizada correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno en editar especialidades:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//ELIMINAR ESPECIALIDADES
app.post('/eliminarEspecialidad', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { idUsuario, datosEspecialidad } = req.body;
    
    const resultado = await control.eliminarEspecialidad(ip, idUsuario, datosEspecialidad);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Especialidad eliminada correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno al eliminar especialidades:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//AGREGAR SECCIONALES
app.post('/agregarSeccional', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { idUsuario, nuevaSeccional } = req.body;
    const nuevaSeccionalObjeto = JSON.parse(nuevaSeccional);
    
    const resultado = await control.agregarSeccional(ip, idUsuario, nuevaSeccionalObjeto);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Seccional registrada correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno en agregar seccionales:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//BUSCAR SECCIONALES
app.post('/buscarSeccionales', async (req, res) => {
  const filtros = req.body;

  const resultado = await control.buscarSeccionales(filtros);

  if (resultado.valido) {
    res.status(200).json(resultado.seccionales);
  } else {
    res.status(400).json({ error: resultado.mensaje });
  }
});

//MODIFICAR SECCIONALES
app.post('/modificarSeccional', async (req, res) => {
  const datosSeccional = req.body;
  const resultado = await control.modificarSeccional(datosSeccional);
  if (resultado.valido) {
    res.status(200).json(exito);
  } else {
    res.status(400).json({error: resultado.mensaje})
  }
});

//ELIMINAR SECCIONALES
app.post('/eliminarSeccional', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { idUsuario, datosSeccional } = req.body;

    const resultado = await control.eliminarSeccional(ip, idUsuario, datosSeccional);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Seccional eliminada correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno al eliminar seccionales:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//AGREGAR REPORTE MEDICO
app.post('/agregarReporte', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { idUsuario, nuevoReporte } = req.body;
    const nuevoReporteObjeto = JSON.parse(nuevoReporte);
    
    const resultado = await control.agregarReporte(idUsuario, ip, nuevoReporteObjeto);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Reporte agregado exitosamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno en agregar reportes:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

//ALMACENAR IMAGENES EN CLOUDINARY
app.post('/guardarImagen', async (req, res) => {
  try {
    const directorio = JSON.parse(req.body.directorio);
    const imagen = req.files?.imagen || null;

    if (!imagen) {
      return res.status(400).json({ mensaje: 'No se recibió ninguna imagen.' });
    }

    const ruta = await bddImagenes.guardarImagen(directorio, imagen);

    res.status(200).json({ 
      mensaje: 'Imagen almacenada exitosamente', 
      resultado: ruta
    });

  } catch (err) {
    console.error('Error interno en /guardarImagen:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
