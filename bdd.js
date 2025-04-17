//EN ESTE ARCHIVO VAN TODAS LAS INTERACCIONES DIRECTAS CON LA BASE DE DATOS

//DEFINICIONES:
const { query } = require('express');
var mysql = require('mysql');

//DATOS DE LA BASE:
var conexion =  mysql.createConnection({
    host: 'mysql.db.mdbgo.com',
    user: 'saludapp_admin',
    password: 'Practica3!',
    database: 'saludapp_bdd'
});

//ESTABLECER CONEXION (SIN EXPORT PARA QUE SOLO PUEDA USARSE DESDE ESTE ARCHIVO)
function conectar() {
    if (conexion.state === 'disconnected') {
        conexion.connect(function(err) {
            if (err) {
                console.log('Error al conectar a la base de datos:', err);
            } else {
                console.log('Conexión exitosa a la base de datos');
            }
        });
    }
}

conectar();

function registrarUsuario(datosUsuario, callback) {
    const sql = `
        INSERT INTO usuarios (email, password, tipo, fechaCreacion, ultimoIngreso)
        VALUES (?, ?, ?, ?, ?)
    `;

    const valores = [
        datosUsuario.email,
        datosUsuario.password,
        datosUsuario.tipo,
        datosUsuario.fechaCreacion,
        datosUsuario.ultimoIngreso
    ];

    conexion.query(sql, valores, function (err, result) {
        if (err) {
        return callback(err, null);
        }

        auditarCambios();
        return callback(null, result);
    });
};

async function auditarCambios() {
    console.log('se intento auditar el cambio');
}

module.exports = {
    registrarUsuario
};