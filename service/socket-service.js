// chat 利用者
var users = {};
module.exports = function(socket) {
    socket.on('test', function(data) {
        console.log(data);
        broadcastToOwnRoom(data, 'test');
    });

    /**
     * room入室処理
     */
    socket.on('join', function(user) {
        users[socket.id] = {
            id: socket.id,
            room: user.roomName,
            name: user.name
        }
        socket.join(user.roomName, () => {
            console.log(users);
        });
    });

    /**
     * room内のユーザにメディア送信offerを伝達
     */
    socket.on('sendOffer', (offer) => {
        console.log('offer: ' + offer);
        broadcastToOwnRoom(offer, 'sendOffer');
    });

    /**
     * room内のユーザにcandidateを伝達
     */
    socket.on('sendCandidate', (candidate) => {
        console.log('candidate: ' + candidate);
        broadcastToOwnRoom(candidate, 'sendCandidate');
    });

    /**
     * offerを送って来たユーザにanswer情報を伝達
     */
    socket.on('sendAnswer', (answer) => {
        console.log('answer: ' + answer);
        broadcastToOwnRoom(answer, 'sendAnswer');
    });

    /**
     * 自身の入室しているroomで、自分以外のユーザへデータを送信する。
     * @data {Object} 送信するデータ
     * @eventName {String} 対象となるイベントの名前
     */
    function broadcastToOwnRoom(data, eventName) {
        console.log('data => ' + data)
        socket.broadcast.to(users[socket.id].room).emit(eventName, data);
    }
}
