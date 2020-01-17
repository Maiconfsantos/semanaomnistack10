const socketio = require('socket.io');

let io;
const connections = [];
const parseStringAsArray = require('./utils/parseStringAsArray');
const calculateDistance = require('./utils/calculateDistance');


exports.setupWebSocket = (server) =>{
    io = socketio(server);

    io.on('connection', socket=>{
       const { latitude, longitude, techs } = socket.handshake.query;

        connections.push({
            id: socket.id,
            coordinate: {
                latitude: Number(latitude),
                longitude: Number(longitude),
            },
            techs: parseStringAsArray(techs),
        });

    });
}


exports.findConnection = (coordinates, techs)=>{
    return connections.filter(
        connection =>{
            return calculateDistance(coordinates, connection.coordinate) < 10
                && connection.techs.some(item => techs.includes(item));
        } 
    );
}

exports.senMessage = (to, message, data) => {
    to.forEach(connection => {
        io.to(connection.id).emit(message,data);
    });
}