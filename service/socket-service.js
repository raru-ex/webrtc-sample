// chat 利用者
var users = {};
module.exports = function(socket) {

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
     * 切断したユーザを削除する
     */
    socket.on('disconnect', function() {
        delete users[socket.id];
        console.log(users);
    });

    /**
     * room内のユーザにメディア送信offerを伝達
     */
    socket.on('sendOffer', (offer) => {
        console.log('offer: ' + offer);
        broadcastToOwnRoom('sendOffer', offer);
    });

    /**
     * room内のユーザにcandidateを伝達
     */
    socket.on('sendCandidate', (candidate) => {
        console.log('candidate: ' + candidate);
        broadcastToOwnRoom('sendCandidate', candidate);
    });

    /**
     * offerを送って来たユーザにanswer情報を伝達
     */
    socket.on('sendAnswer', (answer) => {
        console.log('answer: ' + answer);
        broadcastToOwnRoom('sendAnswer', answer);
    });

    socket.on('requestStreamOwnerOption', (request) => {
        console.log('request: ' + request);
        broadcastToOwnRoom('requestStreamOwnerOption', request);
    });

    socket.on('responseStreamOwnerOption', (response) => {
        console.log('response: ' + response);
        broadcastToOwnRoom('responseStreamOwnerOption', response);
    });

    /**
     * 自身の入室しているroomで、自分以外のユーザへデータを送信する。
     * @eventName {String} 対象となるイベントの名前
     * @data {Object} 送信するデータ
     */
    function broadcastToOwnRoom(eventName, data) {
        console.log('data => ' + data)
        socket.broadcast.to(users[socket.id].room).emit(eventName, data);
    }
}
