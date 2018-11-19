const { io } = require('../server');

const { Usuarios } = require('../clases/usuarios'); 
const { crearMensaje } = require('../utilidades/utilidades');


const usuarios = new Usuarios();

io.on('connection', (client) => {

    console.log('Usuario conectado');

    client.on('entrarChat', (data, callback) => {

        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensage: 'El nombre/sala es necesario'
            })
        }

        // unir al cliente a una sala en particular
        client.join(data.sala);

        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonaPorSala(data.sala));
        callback(usuarios.getPersonaPorSala(data.sala))
    });

    client.on('crearMensaje', (data) => {

        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
    });


    client.on('disconnect', () => {

        let personaBorrada = usuarios.borrarPersona(client.id)

        if (personaBorrada.nombre === undefined) {
            return console.log('Ninguna persona en el chat')
        }

        // aqui emitimos un evento cuando la persona sale del chat
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salio`));
        // emitir la nueva lista de personas conectadas al chat
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonaPorSala(personaBorrada.sala));
    })


    // Escuchar evento de Mensaje Privado
    client.on('mensajePrivado', data => {

        // obtener la persona que esta mandando el mensaje
        let persona = usuarios.getPersona(client.id)

        if (data.mensaje === undefined) {
            return console.log('El mensaje es necesario')
        }

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });

});