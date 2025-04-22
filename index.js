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
    const { nuevoUsuario, datosPerfil } = req.body;
    
    //console.log(nuevoUsuario);
    //console.log(datosPerfil);
    
    const resultado = await control.verificarNuevoUsuario(ip, nuevoUsuario, datosPerfil);

    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Usuario registrado correctamente', resultado: resultado.resultado });
  } catch (err) {
    console.error('Error interno en /registrarUsuario:', err);
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

    res.status(200).json({ mensaje: 'Usuario autenticado correctamente', tipo: resultado.tipo, usuario: resultado.usuario, perfilActivo: resultado.perfilActivo });
  } catch (err) {
    console.error('Error interno en ingreso de usuario:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});