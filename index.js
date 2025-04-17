const express = require('express');
const control = require('./control');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

//FUNCION PARA ESCUCHAR EL PUERTO DE ENTRADA
app.listen(PORT, () => {
    console.log('Escuchando el puerto.');
})

//FUNCION PARA AGREGAR UN NUEVO USUARIO
app.post('/registroUsuario', (req, res) => {
    const datosUsuario = req.body;
  
    control.verificarDatosUsuario(datosUsuario, (resultado) => {
      if (!resultado.valido) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }
  
      res.status(200).json({ mensaje: 'Usuario registrado correctamente' });
    });
});
