const express = require('express');
const control = require('./control.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//FUNCION PARA ESCUCHAR EL PUERTO DE ENTRADA
app.listen( process.env.PORT || 3000, () => {
  console.log('Escuchando el puerto 3000.');
  pruebaEscritura();
  console.log('Se intento escribir.');
})

//FUNCION PARA AGREGAR UN NUEVO USUARIO
app.post('/registrarUsuario', (req, res) => {
    var datosUsuario = req.body;
    console.log('ingreso a registrar');
  
    control.verificarDatosUsuario(datosUsuario, (resultado) => {
      if (!resultado.valido) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }
  
      res.status(200).json({ mensaje: 'Usuario registrado correctamente' });
    });
});

function pruebaEscritura() {
  const datosPrueba = {
    email: 'usuario@ejemplo.com',
    password: 'contrasena123',
    tipo: 'administrador',
    fechaCreacion: new Date().toISOString(),
    ultimoIngreso: new Date().toISOString()
  };

  control.verificarDatosUsuario(datosPrueba, (resultado) => {
    if (!resultado.valido) {
      console.log('Error de validación:', resultado.mensaje);
    } else {
      console.log('Usuario registrado correctamente');
    }
  });
}