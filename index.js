const express = require('express');
const control = require('./control.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//HABILITAR EL PUERTO
app.listen(process.env.PORT || 3000, () => {
  console.log('Escuchando el puerto 3000.');
});

//REGISTRAR UN NUEVO USUARIO
app.post('/registrarUsuario', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { nuevoUsuario, nuevoPerfil } = req.body;
    
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

//SOLICITAR TURNOS
app.post('/solicitarTurno', async (req, res) => {
  const turno = req.body;
  const resultado = await control.solicitarTurno(turno);
  if (resultado.valido) {
    res.status(200).json(exito);
  } else {
    res.status(400).json({error: resultado.mensaje})
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
app.post('/modificarEspecialidad', async (req, res) => {
  const datosEspecialidad = req.body;
  const resultado = await control.modificarEspecialidad(datosEspecialidad);
  if (resultado.valido) {
    res.status(200).json(exito);
  } else {
    res.status(400).json({error: resultado.mensaje})
  }
});

