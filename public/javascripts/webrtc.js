$(function(){
    var socket = getSocket();
    var ownPeerConnection = new raru.SocketIO.MyRTCPeerConnection(socket);
    init();

    /*
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
    })
    */;

    $('#change_media').on('click', getScreenMedia);

    /***** ロジック系関数 *****/
    function getSocket() {
        var prefix = 'ws';
        if ("https:" == document.location.protocol) {
            var prefix = 'wss';
        }
        return io.connect(prefix + '://' + location.host);
    }
    function getScreenMedia() {
        window.addEventListener('message', function(evt) {
            if(evt.data.type != 'gotStreamId') return;
            console.log(evt);

            navigator.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: evt.data.streamid
                    }
                }
            },
            function (stream) {
                localStream = stream;
                ownPeerConnection.setLocalStream(localStream);
            },
            function(error) {
                console.log('mediaDevice.getUserMedia() error:', error);
                return;
            });
        });

        window.postMessage({type: 'getStreamId'}, "*");
        return true;
    }

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
