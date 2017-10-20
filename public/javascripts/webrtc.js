$(function(){
    var socket = io.connect("ws://"+ location.host);
    var servers = { 'iceServers': [{
        'urls':'stun:stun.l.google.com:19302'
    }]};
    var mediaOption,
        ownPeerConnection,
        localStream,
        displayArea = document.getElementById('display_video');

    /**
     * システムに必要な初期化処理を行います。
     */
    function _init() {
        mediaOption = {
            video: true,
            audio: true
        }
        ownPeerConnection = prepareNewPeerConnection(servers);
        displayArea = document.getElementById('display_video');

        socket.emit('join', {
            roomName: 'test',
            name: 'test' + Date.now()
        });
    }

    $('#media_auth').on('click', function() {
        navigator.mediaDevices.getUserMedia(mediaOption)
            .then(function (stream) { // success
                localStream = stream;
                ownPeerConnection.addStream(localStream);
                trace('success add stream');
            }).catch(function (error) { // error
                console.error('mediaDevice.getUserMedia() error:', error);
                return;
            });
    });

    /***** 受け取り処理 *****/
    /**
     * 通信相手からのofferを受け取りAnswerを返す
     */
    socket.on('sendOffer', function(offer) {
        if(!!ownPeerConnection) {
            trace('received offer: ' + offer);
            ownPeerConnection.setRemoteDescription(new RTCSessionDescription(offer), function(){}, errorHandler('Received Offer'));
            createAnswer();
        }
    });

    socket.on('sendCandidate', function (candidate) {
        trace('receive icecandidate: ' + candidate);
        ownPeerConnection.addIceCandidate(new RTCIceCandidate(candidate), function(){}, errorHandler('Add Ice Candidate'));
    });

    socket.on('sendAnswer', function (answer) {
        if(!!ownPeerConnection) {
            trace('received answer: ' + answer);
            ownPeerConnection.setRemoteDescription(new RTCSessionDescription(answer), function(){}, errorHandler('Received Answer'));
        }
    });

    // ----- 後々切り出し webRTC
    /**
     * 基本的なイベントが設定されたRTCPeerConnectionを返します
     * @config {Object} stun/turnサーバの設定
     * @return {RTCPeerConnection} 新規コネクション
     */
    function prepareNewPeerConnection(config) {
        var preparedConnection = new RTCPeerConnection(config);

        // candidate取得時処理
        preparedConnection.onicecandidate = function (evt) {
            if (evt.candidate) {
                trace('send candidate: ' + evt.candidate);
                socket.emit('sendCandidate', evt.candidate)
            }
        }

        // ネゴシエーションが必要なときに自動でofferを送信
        preparedConnection.onnegotiationneeded = function (evt) {
            createOffer();
        }

        preparedConnection.onaddstream = function (evt) {
            playVideo(document.getElementById('display_video'), evt.stream);
        }

        return preparedConnection;
    }

    /***** ロジック系関数 *****/
    function playVideo(element, stream) {
        trace('play video');
        if ('srcObject' in element) {
            trace('src object');
            element.srcObject = stream;
        } else {
            trace('src');
            element.src = window.URL.createObjectURL(stream);
        }
        element.play();
    }

    function createOffer() {
        trace('called create Offer');
        if(!!ownPeerConnection) {
            ownPeerConnection.createOffer()
            .then(function (offer) {
                trace('create offer: ' + offer);
                return ownPeerConnection.setLocalDescription(new RTCSessionDescription(offer));
            })
            .then(function () {
                trace('send offer' + ownPeerConnection.localDescription);
                socket.emit('sendOffer', ownPeerConnection.localDescription);
            });
        }
    }

    function createAnswer() {
        trace('called create Answer');
        if (!!ownPeerConnection) {
            ownPeerConnection.createAnswer()
            .then(function (answer) {
                trace('create answer' + answer);
                return ownPeerConnection.setLocalDescription(new RTCSessionDescription(answer));
            })
            .then(function () {
                trace('send answer');
                socket.emit('sendAnswer', ownPeerConnection.localDescription);
            });
        }
    }

    /**
     * 簡易エラーコールバック用メソッド
     */
    function errorHandler(context) {
        return function(error) {
            trace('Failure in ' + context + ': ' + error.toString);
        }
    }

    /**
     * ログ出力用メソッド
     */
    function trace(arg) {
        var now = (window.performance.now() / 1000).toFixed(3);
        console.log(now + ': ', arg);
    }
});
