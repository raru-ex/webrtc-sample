$(function(){
    var Common = raru.Common;
    var socket = Common.getSocket();
    var ownPeerConnection = new raru.SocketIO.MyRTCPeerConnection(socket);
    var remoteMediaStreamManager = null;
    var manager = new raru.Media.MediaStreamManager();

    init();

    $('#videoCall').on('click', getDeviceMedia({
        video: true,
        audio: true
    }));

    //TODO 間違ってる。一旦テストに
    $('#voiceCall').on('click', getScreenMedia);

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
                console.log('set local video: ' + stream.getTracks());
                //ownPeerConnection.addStream(stream);
                manager.addStream(stream);
                // ownPeerConnection.addStream(manager.getStream());
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
                console.log('set local screen: ' + stream.getTracks());
                manager.addStream(stream);
                ownPeerConnection.addStream(manager.getStream());
        var videoStream = manager.getVideoStream();
        var screenStream = manager.getScreenStream();
        var ownVideoDisplay = document.getElementById('ownVideoDisplay');
        var ownScreenDisplay = document.getElementById('ownScreenDisplay');
        ownVideoDisplay.srcObject = videoStream;
        ownScreenDisplay.srcObject = screenStream;

        //TODO とりあえず
        $('#ownVideoDisplay').removeClass('d-none');
        $('#ownScreenDisplay').removeClass('d-none');
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

    function requestStreamOwnerOption (evt) {
        remoteMediaStreamManager = new raru.Media.RemoteMediaStreamManager(evt.stream);

        console.log('request stream option');
        socket.emit('requestStreamOwnerOption', {
            socketId: socket.id,
            streamId: evt.stream.id
        });
    }

    socket.on('requestStreamOwnerOption', function (data) {
        console.log('socket on response stream option');
        if(data.streamId === manager.getStream().id) {
            socket.emit('responseStreamOwnerOption', manager.getOption());
        }
    })

    socket.on('responseStreamOwnerOption', function (option) {
        console.log('socket on response stream option');
        remoteMediaStreamManager.extendOption(option);
        var videoStream = remoteMediaStreamManager.getVideoStream();
        var screenStream = remoteMediaStreamManager.getScreenStream();
        var videoDisplay = document.getElementById('videoDisplay');
        var screenDisplay = document.getElementById('screenDisplay');
        videoDisplay.srcObject = videoStream;
        screenDisplay.srcObject = screenStream;

        //TODO とりあえず
        $('#videoDisplay').removeClass('d-none');
        $('#screenDisplay').removeClass('d-none');
    });

    /**
     * 初期化
     */
    function init() {
        ownPeerConnection.setOnAddStream(requestStreamOwnerOption);
    }
});
