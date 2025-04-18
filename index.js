const express = require('express');
const control = require('./control.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//FUNCION PARA ESCUCHAR EL PUERTO DE ENTRADA
app.listen( process.env.PORT || 3000, () => {
  console.log('Escuchando el puerto 3000.');
})

//FUNCION PARA AGREGAR UN NUEVO USUARIO
app.post('/registrarUsuario', (req, res) => {
    var datosUsuario = req.body;
  
    control.verificarNuevoUsuario(datosUsuario, (resultado) => {
      if (!resultado.valido) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }
  
      res.status(200).json({ mensaje: 'Usuario registrado correctamente' });
    });
});

//FUNCION PARA INGRESAR CON USUARIO - EMAIL + PASSWORD
app.post('/ingresarUsuario', (req, res) => {
  var datosUsuario = req.body;

  control.verificarUsuario(datosUsuario, (resultado) => {
    if (!resultado.valido) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    res.status(200).json({ mensaje: 'Usuario registrado correctamente' });
  });
});

