$(function(){
    var socket = io.connect("ws://"+ location.host);
    var ownPeerConnection = new raru.SocketIO.MyRTCPeerConnection(socket);
    init();

    $('#media_auth').on('click', function() {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
            .then(function (stream) { // success
                localStream = stream;
                ownPeerConnection.setLocalStream(localStream);
            }).catch(function (error) { // error
                console.log('mediaDevice.getUserMedia() error:', error);
                return;
            });
    });

    // TODO require chrome extension
    $('#change_media').on('click', function () {
        navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop'
                }
            }
        })
        .then(function (stream) {
            localStream = stream;
            ownPeerConnection.setLocalStream(localStream);
        })
        .catch(function(error) {
            console.log('mediaDevice.getUserMedia() error:', error);
            return;
        });
    });

    /***** ロジック系関数 *****/
    function playVideo(evt) {
        var element = document.getElementById('display_video')
        if ('srcObject' in element) {
            element.srcObject = evt.stream;
        } else {
            element.src = window.URL.createObjectURL(evt.stream);
        }
    }

    function init() {
        ownPeerConnection.setOnAddStream(playVideo);
        socket.emit('join', {
            roomName: 'test',
            name: 'test' + Date.now()
        });
    }
});
