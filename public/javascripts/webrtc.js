$(function(){
    var Common = raru.Common;
    var socket = Common.getSocket();
    var ownPeerConnection = new raru.SocketIO.MyRTCPeerConnection(socket);
    var remoteMediaStreamManager = null;
    var manager = new raru.Media.MediaStreamManager();
    var $videoCaller = $('#videoCall');
    var $voiceCaller = $('#voiceCall');
    var $screenCaller = $('#screenCall');

    init();
    $videoCaller.on('click', handleVideoCaller);
    $voiceCaller.on('click', handleVoiceCaller);
    $screenCaller.on('click', handleScreenCaller);

    /***** ロジック系関数 *****/

    /**
     * デバイスからのメディア(カメラ, マイク)を取得しstreamの流し込みを行う。
     * @param Object option vide, audioの有無オプション
     */
    function getDeviceMedia(option) {
        navigator.mediaDevices.getUserMedia(option)
        .then(function (stream) {
            console.log('set local video: ' + stream.getTracks());
            if (option.video) {
                activateIcon($videoCaller);
                activateIcon($voiceCaller);
            } else {
                activateIcon($voiceCaller);
            }
            //ownPeerConnection.addStream(stream);
            manager.addStream(stream);
            // ownPeerConnection.addStream(manager.getStream());
        }).catch(function (error) {
            console.log('mediaDevice.getUserMedia() error:', error);
            return;
        });
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
        var ownVideoDisplay = document.getElementById('ownMainDisplay');
        var ownScreenDisplay = document.getElementById('ownSubDisplay');
        ownVideoDisplay.srcObject = videoStream;
        ownScreenDisplay.srcObject = screenStream;

        //TODO とりあえず
        $('#ownMainDisplay').removeClass('d-none');
        $('#ownSubDisplay').removeClass('d-none');
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
        var videoDisplay = document.getElementById('subDisplay');
        var screenDisplay = document.getElementById('mainDisplay');
        videoDisplay.srcObject = videoStream;
        screenDisplay.srcObject = screenStream;

        //TODO とりあえず
        $('#subDisplay').removeClass('d-none');
        $('#mainDisplay').removeClass('d-none');
    });


    function handleVideoCaller() {
        if(!isActiveIcon($videoCaller)) {
            getDeviceMedia({
                video: true,
                audio: true
            });
        } else {
            // TODO stop video track
        }
    }

    function handleVoiceCaller() {
        if(!isActiveIcon($voiceCaller)) {
            getDeviceMedia({
                video: false,
                audio: true
            });
        } else {
            // TODO remote stream
        }
    }

    function handleScreenCaller() {
        getScreenMedia();
    }

    function activateIcon ($button) {
        var $target = $button.find('i');
        if (!$target.hasClass('active')) {
            $target.addClass('active');
        }
    }

    function isActiveIcon($button) {
        return $button.find('i').hasClass('active');
    }

    /**
     * 初期化
     */
    function init() {
        ownPeerConnection.setOnAddStream(requestStreamOwnerOption);
    }
});
