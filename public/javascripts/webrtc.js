$(function(){
    var socket = io.connect("ws://"+ location.host);
    var mediaOption = { video: true, audio:true };
    var localStream;
    var localVideo = document.getElementById('display_video');
    var servers = { 'iceServers': [{
        'urls':'stun:stun.l.google.com:19302'
    }]}
    var peerConnection = prepareNewPeerConnection(servers);

    socket.emit('init', {
        roomName: 'test',
        name: 'test' + Date.now()
    });

    $('#submit').on('click', function() {
        socket.emit('test', "hello");
    });

    socket.on('test', function(data) {
        trace(data);
    });


    $('#media_auth').on('click', function() {
      navigator.mediaDevices.getUserMedia(mediaOption)
      .then(function (stream) { // success
          localStream = stream;
          peerConnection.addStream(localStream);
          trace('success add stream');
      }).catch(function (error) { // error
        console.error('mediaDevice.getUserMedia() error:', error);
        return;
      });
    });

    $('send_media').on('click', function() {
    });

    /***** 受け取り処理 *****/
    /**
     * 通信相手からのofferを受け取りAnswerを返す
     */
    socket.on('sendOffer', function(offer) {
        trace('get offer');
        if(!!peerConnection) {
            trace('received offer: ' + offer);
            peerConnection.setRemoteDescription(new RTCSessionDescription(offer), function(){}, errorHandler('Received Offer'));
            createAnswer();
        }
    });

    socket.on('sendCandidate', function (candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate), function(){}, errorHandler('Add Ice Candidate'));
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
                socket.emit('sendCandidate', evt.candidate)
            }
            trace(evt.candidate);
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
        if ('srcObject' in element) {
            element.srcObject = stream;
        } else {
            element.src = window.URL.createObjectURL(stream);
        }
        element.play();
    }

    function createOffer() {
        trace('called create Offer');
        trace(peerConnection);
        if(!!peerConnection) {
            peerConnection.createOffer()
            .then(function (offer) {
                trace(offer);
                return peerConnection.setLocalDescription(new RTCSessionDescription(offer));
            })
            .then(function () {
                trace('send offer');
                socket.emit('sendOffer', peerConnection.localDescription);
            });
        }
    }

    function createAnswer() {
        trace('called create Answer');
        trace(peerConnection);
        if (!!peerConnection) {
            peerConnection.createAnswer()
            .then(function (answer) {
                trace(answer);
                // TODO set local description to other connection
                socket.emit('sendAnswer', answer);
            })
        }
    }

    function errorHandler(context) {
        return function(error) {
            trace('Failure in ' + context + ': ' + error.toString);
        }
    }

    function trace(arg) {
        var now = (window.performance.now() / 1000).toFixed(3);
        console.log(now + ': ', arg);
    }
});
