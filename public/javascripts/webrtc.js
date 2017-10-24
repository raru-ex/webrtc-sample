$(function(){
    var socket = getSocket();
    var ownPeerConnection = new raru.SocketIO.MyRTCPeerConnection(socket);
    init($('#name').text(), $('#room').text());

    $('#media_auth').on('click', getDeviceMedia({
        video: true,
        audio: true
    }));

    $('#change_media').on('click', getScreenMedia);

    /***** ロジック系関数 *****/

    /**
     * http, httpsに適切なsocketを作成して返す
     */
    function getSocket() {
        var prefix = 'ws';
        if ("https:" == document.location.protocol) {
            var prefix = 'wss';
        }
        return io.connect(prefix + '://' + location.host);
    }

    /**
     * デバイスからのメディア(カメラ, マイク)を取得しstreamの流し込みを行う。
     * @param Object option vide, audioの有無オプション
     */
    function getDeviceMedia(option) {
        return function () {
            navigator.mediaDevices.getUserMedia(option)
            .then(function (stream) {
                localStream = stream;
                console.log(stream);
                console.log(stream.getVideoTracks());
                console.log(stream.getTracks());
                ownPeerConnection.setLocalStream(localStream);
            }).catch(function (error) {
                console.log('mediaDevice.getUserMedia() error:', error);
                return;
            });
        };
    }

    /**
     * 画面共有の取得とstreamの流し込みを行う。
     */
    function getScreenMedia() {
        window.addEventListener('message', function(evt) {
            if(evt.data.type != 'gotStreamId') return;
            console.log(evt);

            navigator.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: evt.data.streamid,
                        minWidth          : 640,
                        maxWidth          : 1280,
                        minHeight         : 480,
                        maxHeight         : 720
                    }
                }
            },
            function (stream) {
                localStream = stream;
                console.log(stream);
                console.log(stream.getVideoTracks());
                console.log(stream.getTracks());
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

    /**
     * メディアの再生を行う。
     */
    function playVideo(evt) {
        var element = document.getElementById('display_video')
        if ('srcObject' in element) {
            element.srcObject = evt.stream;
        } else {
            element.src = window.URL.createObjectURL(evt.stream);
        }
    }

    /**
     * 初期化
     */
    function init(name, room) {
        ownPeerConnection.setOnAddStream(playVideo);
        socket.emit('join', {
            name: name,
            roomName: room
        });
    }
});
