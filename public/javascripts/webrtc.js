$(function(){
    var Common = raru.Common;
    var socket = Common.getSocket();
    var ownPeerConnection = new raru.SocketIO.MyRTCPeerConnection(socket);
    var remoteMediaStreamManager = null;
    var manager = new raru.Media.MediaStreamManager();
    var $videoCaller = $('#videoCall');
    var $voiceCaller = $('#voiceCall');
    var $screenCaller = $('#screenCall');
    var $ownMainDisplay = $('#ownMainDisplay');
    var $ownSubDisplay = $('#ownSubDisplay');
    var $remoteMainDisplay = $('#remoteMainDisplay');
    var $remoteSubDisplay = $('#remoteSubDisplay');

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
            $ownMainDisplay[0].srcObject = stream;
            manager.addStream(stream);
            ownPeerConnection.addStream(manager.getStream());
            if (option.video) {
                activateIcon($videoCaller);
                $ownMainDisplay.removeClass('soundonly');
            } else {
                $ownMainDisplay.addClass('soundonly');
            }
            activateIcon($voiceCaller);
            $ownMainDisplay.removeClass('d-none');
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
        ownMainDisplay[0].srcObject = videoStream;
        ownSubDisplay[0].srcObject = screenStream;

        //TODO とりあえず
        $ownMainDisplay.removeClass('d-none');
        $ownSubDisplay.removeClass('d-none');
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
        if (data.streamId === manager.getStream().id) {
            socket.emit('responseStreamOwnerOption', manager.getOption());
        }
    })

    socket.on('responseStreamOwnerOption', handleRemoteStream);

    function handleRemoteStream(option) {
        console.log('socket on response stream option');
        remoteMediaStreamManager.extendOption(option);
        var videoStream = remoteMediaStreamManager.getVideoStream();
        var screenStream = remoteMediaStreamManager.getScreenStream();

        if (!!videoStream && !!screenStream) {
            if(!option.video) {
                $remoteSubDisplay.addClass('soundonly');
            } else {
                $remoteSubDisplay.removeClass('soundonly');
            }

            $remoteMainDisplay[0].srcObject = screenStream;
            $remoteSubDisplay[0].srcObject = videoStream;
            $remoteMainDisplay.removeClass('d-none');
            $remoteSubDisplay.removeClass('d-none');
        } else if (!!videoStream) {
            if(!option.video) {
                $remoteMainDisplay.addClass('soundonly');
            } else {
                $remoteMainDisplay.removeClass('soundonly');
            }
            $remoteMainDisplay[0].srcObject = videoStream;
            $remoteMainDisplay.removeClass('d-none');
        } else if (!!screenStream) {
            $remoteMainDisplay[0].srcObject = screenStream;
            $remoteMainDisplay.removeClass('d-none');
        }
    }


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
