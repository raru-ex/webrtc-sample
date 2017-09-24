// chat 利用者
var users = {};
module.exports = function(socket) {
    socket.on('test', function(data) {
        console.log(data);
        broadcastToOwnRoom(data, 'test');
    });

    socket.on('init', function(user) {
        users[socket.id] = {
            id: socket.id,
            room: user.roomName,
            name: user.name
        }
        socket.join(user.roomName, () => {
            console.log(users); // [ <socket.id>, 'room 237' ]
        });
    });

    socket.on('sendOffer', (offer) => {
        console.log('offer: ' + offer);
        broadcastToOwnRoom(offer, 'sendOffer');
    });

    socket.on('sendCandidate', (candidate) => {
        console.log('candidate: ' + candidate);
        broadcastToOwnRoom(candidate, 'sendCandiate');
    });

    socket.on('sendAnswer', (answer) => {
        console.log('answer: ' + answer);
        broadcastToOwnRoom(answer, 'sendAnswer');
    });

    function broadcastToOwnRoom(data, eventName) {
        console.log('data => ' + data)
        socket.broadcast.to(users[socket.id].room).emit(eventName, data);
    }
}

