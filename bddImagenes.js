const cloudinary = require('cloudinary').v2;
const { credenciales } = require("./credenciales.js");
cloudinary.config(credenciales.cloudinary);

const nombreRepositorioImagenes = credenciales.cloudinary.cloud_name;
const prefijoImagen = 'https://res.cloudinary.com/' + nombreRepositorioImagenes + '/image/upload/';

async function guardarImagen(directorio, archivo) {
  try {
    const result = await cloudinary.uploader.upload(archivo.tempFilePath, {
      folder: directorio
    });

    let ruta = result.secure_url;

    if (ruta.startsWith(prefijoImagen)) {
      ruta = ruta.substring(prefijoImagen.length);
    }

    return ruta;

  } catch (err) {
    console.error('Error al subir la imagen:', err);
    throw err;
  }
}

module.exports = {
  guardarImagen
};