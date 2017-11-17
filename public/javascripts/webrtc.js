$(function(){
    // video, screenそれぞれで分けてdisplay: noneか否かで上下が自然と分けられる
    // remoteもvideo, screenで分けて画面のサイズ、位置調整をする方が楽な気がする
    var Common = raru.Common;
    var socket = Common.getSocket();
    var ownPeerConnection = new raru.SocketIO.MyRTCPeerConnection(socket);
    var remoteMediaStreamManager = null;
    var manager = null;
    var $videoCaller = $('#videoCall');
    var $voiceCaller = $('#voiceCall');
    var $screenCaller = $('#screenCall');
    var $ownVideoDisplay = $('#ownVideoDisplay');
    var $ownScreenDisplay = $('#ownScreenDisplay');
    var $remoteMainDisplay = $('#remoteMainDisplay');
    var $remoteSubDisplay = $('#remoteSubDisplay');
    var localStream = null;
    var remoteStream = null;

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
            localStream = stream;
            prepareMediaStreamManager(localStream)
            ownPeerConnection.addStream(manager.getStream());

            showOwnDisplay(localStream, option);

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
                prepareMediaStreamManager(stream);
                ownPeerConnection.addStream(manager.getStream());

                showOwnDisplay(stream);
            },
            function(error) {
                console.log('mediaDevice.getUserMedia() error:', error);
                return;
            });
        });

        window.postMessage({type: 'getStreamId'}, "*");
        return true;
    }

    function prepareMediaStreamManager (stream) {
        if (!manager) {
            manager = new raru.Media.MediaStreamManager(stream);
        } else {
            manager.addStream(stream);
        }
    }

    function showOwnDisplay(stream, deviceOption) {
        if (!deviceOption) {
            activateIcon($screenCaller);
            $ownScreenDisplay.removeClass('soundonly');
            $ownScreenDisplay.removeClass('d-none');
            $ownScreenDisplay[0].srcObject = stream;
        } else {
            if (deviceOption.video) {
                activateIcon($videoCaller);
                $ownVideoDisplay.removeClass('soundonly');
            } else {
                $ownVideoDisplay.addClass('soundonly');
            }
            activateIcon($voiceCaller);
            $ownVideoDisplay.removeClass('d-none');
            $ownVideoDisplay[0].srcObject = stream;
        }
    }

    function isActiveDisplay ($display) {
        return !!$display[0].srcObject;
    }

    /**
     * メディアの再生を行う。
     */
    function requestStreamOwnerOption (evt) {
        if(!remoteMediaStreamManager) {
            remoteMediaStreamManager = new raru.Media.RemoteMediaStreamManager(evt.stream);
            setupRemoteStreamManager();
        }

        console.log('added remotestream and request stream option');
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

    function handleCaller() {
        $this = $(this);
        if($this.hasClass('video')) {
            handleVideoCaller();
        } else if ($this.hasClass('voice')) {
            handleVoiceCaller();
        } else if ($this.hasClass('screen')) {
            handleScreenCaller();
        }
    }

    function handleVideoCaller() {
        if(!isActiveIcon($videoCaller)) {
            getDeviceMedia({
                video: true,
                audio: true
            });
        } else {
            // ビデオのみ停止処理 (音声そのまま注意)
            manager.removeVideo();
            // localStream.removeTrack(localStream.getVideoTracks()[0]);
            inactivateIcon($videoCaller);

            // 画面共有が開いている時には画面共有は残し、自分は見た目を消す
            if (isActiveIcon($screenCaller)) {
                $ownVideoDisplay.addClass('d-none');
                $ownVideoDisplay.removeClass('soundonly');
            } else {
            // 画面共有がないときには、自分を残し他は消す
                $ownVideoDisplay[0].srcObject = null;
                $ownVideoDisplay[0].srcObject = manager.getVideoStream();
                $ownVideoDisplay.addClass('soundonly');
                $ownScreenDisplay.addClass('d-none');
            }
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
            stopAllStream();
        }
    }

    function stopAllStream() {
        ownPeerConnection.removeStream(manager.getStream());
        manager.removeAllTrack();
        stopDisplaySrc($ownVideoDisplay);
        stopDisplaySrc($ownScreenDisplay);
        $ownVideoDisplay.addClass('d-none');
        $ownScreenDisplay.addClass('d-none');
        $ownVideoDisplay.removeClass('soundonly');
        $ownScreenDisplay.removeClass('soundonly');
        inactivateIcon($videoCaller);
        inactivateIcon($voiceCaller);
        inactivateIcon($screenCaller);
    }

    function stopDisplaySrc($display) {
        var tmpStream = $display[0].srcObject;
        if(!!tmpStream) {
            tmpStream.getTracks().forEach(track => {
                tmpStream.removeTrack(track);
            });
            $display[0].srcObject = null;
        }
    }

    function handleScreenCaller() {
        if (!isActiveIcon($screenCaller)) {
            getScreenMedia();
        } else {
            // 画面共有を削除
            manager.removeScreen();
            inactivateIcon($screenCaller);

            if (!isActiveIcon($videoCaller)) {
                $ownVideoDisplay[0].srcObject = null;
                $ownVideoDisplay[0].srcObject = manager.getVideoStream();
                $ownVideoDisplay.removeClass('d-none');
                $ownVideoDisplay.addClass('soundonly');
            }

            $ownScreenDisplay.addClass('d-none');
            $ownScreenDisplay.removeClass('soundonly');
            $ownScreenDisplay[0].srcObject = null;
        }
    }

    function activateIcon ($button) {
        var $target = $button.find('i');
        $target.addClass('active');
    }

    function isActiveIcon($button) {
        return $button.find('i').hasClass('active');
    }

    function inactivateIcon ($button) {
        var $target = $button.find('i');
        $target.removeClass('active');
    }

    function changeTrack (evt) {
        console.log('change track');
        console.log(evt);

        remoteMediaStreamManager.addTrack(evt.track);
        socket.emit('requestStreamOwnerOption', {
            socketId: socket.id,
            streamId: evt.currentTarget.id
        });
    }

    /**
     * 初期化
     */
    function init() {
        ownPeerConnection.setOnAddStream(requestStreamOwnerOption);
    }

    function setupRemoteStreamManager() {
        // TODO on add track, remove trackの関数を用意
        remoteMediaStreamManager.onRemoveTrack(changeTrack);
        remoteMediaStreamManager.onAddTrack(changeTrack);
    }
});
