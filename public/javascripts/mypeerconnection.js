var raru = raru || {};
raru.SocketIO = raru.SocketIO || {};

raru.SocketIO.MyRTCPeerConnection = (function() {

    /**
     * PeerConnectionのコンストラクタ
     * @param Object socket nodeのwebsocketのインスタンス
     * @param Array servers turn, stunサーバの設定
     */
    var MyRTCPeerConnection = function(socket, servers) {
        // callback時などにthisが辛いため保持
        var self = this;

        if(!(this instanceof raru.SocketIO.MyRTCPeerConnection)) {
            return new raru.SocketIO.MyRTCPeerConnection(socket, servers);
        }

        this.servers = servers || { 'iceServers': [{
            'urls':'stun:stun.l.google.com:19302'
        }]};

        this.socket = socket;
        this.ownPeerConnection = new RTCPeerConnection(servers);
        this.stream = null;


        var proto = MyRTCPeerConnection.prototype;

        /**
         * onicecandidateイベントの設定を行います
         * @param Function callback
         */
        proto.setOnIcecandidate = function (callback) {
            self.ownPeerConnection.onicecandidate = callback;
        }

        /**
         * onnegotiationneededイベントの設定を行います。
         * @param Function callback
         */
        proto.setOnNegotiationneeded = function (callback) {
            self.ownPeerConnection.onicecandidate = callback;
        }

        proto.getConnection = function () {
            return this.ownPeerConnection;
        }

        /**
         * onaddstreamイベントの設定を行います。
         * @param Function callback
         */
        proto.setOnAddStream = function (callback) {
            self.ownPeerConnection.onaddstream = callback;
        }

        /**
         * ontrackイベントの設定を行います。
         * @param Function callback
         */
        proto.setOnTrack = function (callback) {
            self.ownPeerConnection.ontrack = callback;
        }

        /**
         * local(自身)のstreamをセットします。
         * @param MediaStream stream メディアのストリーム
         * @param Bool requestCreateOffer offerを送信する場合はtrue
         */
        proto.addStream = function (stream, requestCreateOffer = false) {
            self.stream = stream;
            self.ownPeerConnection.addStream(stream);
            if (requestCreateOffer) {
                self._createOffer();
            }
        }

        proto.removeStream = function (stream) {
           self.ownPeerConnection.removeStream(stream);
        }


        /**
         * local(自身)のストリームを返します。
         */
        proto.getLocalStream = function () {
            return self.stream;
        }

        /**
         * web socketにイベントを追加します。
         * @param String name イベント名
         * @param Function callback パラメータ
         */
        proto.addSocketEvent = function (name, callback) {
            self.socket.on(name, function (data) {
                    callback(JSON.parse(data));
                });
        }

        //########## private functions (privateにできなかった) ##########//

        //---------- web rtc functions ---------//

        /**
         * 基本的なイベントが設定されたRTCPeerConnectionを返します
         * @param Object config Object stun/turnサーバの設定
         * @return RTCPeerConnection 新規コネクション
         */
        proto._init = function () {
            self._initWebRTCEvents();
            self._initSocketEvents();
        }

        /**
         * WebRTC系のイベントをデフォルトの処理で初期化
         */
        proto._initWebRTCEvents = function () {
            // candidate取得時処理
            self.ownPeerConnection.onicecandidate = function (evt) {
                if (evt.candidate) {
                    self._emit('sendCandidate', {
                        candidate: evt.candidate
                    });
                }
            }

            // ネゴシエーションが必要なときに自動でofferを送信
            self.ownPeerConnection.onnegotiationneeded = function (evt) {
                self._trace('called on negotiation needed: ' + evt);
                self._createOffer();
            }
        }

        /**
         * Socket受け取り系イベントをデフォルト処理で初期化
         */
        proto._initSocketEvents = function () {
            /**
             * offerを受け取り、ansterを返す
             */
            self.addSocketEvent('sendOffer', function(data) {
                if(!!self.ownPeerConnection) {
                    self._trace('received offer: ' + data.offer);
                    self.ownPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                        .then(self._createAnswer)
                        .catch(self._defaultErrorHandler('Received Offer'));
                }
            });

            self.addSocketEvent('sendCandidate', function (data) {
                self._trace('receive icecandidate: ' + data.candidate);
                self.ownPeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate), self._defaultSuccessHandler, self._defaultErrorHandler('Add Ice Candidate'));
            });

            self.addSocketEvent('sendAnswer', function (data) {
                if(!!self.ownPeerConnection) {
                    self._trace('received answer: ' + data.answer);
                    self.ownPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer), self._defaultSuccessHandler, self._defaultErrorHandler('Received Answer'));
                }
            });
        }

        /**
         * オファーを作成して送信します。
         */
        proto._createOffer = function () {
            self._trace('called create Offer');
            if(!!self.ownPeerConnection) {
                self.ownPeerConnection.createOffer()
                    .then(function (offer) {
                        self._trace('create offer: ' + offer);
                        return self.ownPeerConnection.setLocalDescription(new RTCSessionDescription(offer));
                    })
                    .then(function () {
                        self._emit('sendOffer', {
                            offer: self.ownPeerConnection.localDescription
                        });
                    })
                    .catch(self._defaultErrorHandler('create Offer'));
            }
        }

        /**
         * アンサーを作成して返信します。
         */
        proto._createAnswer = function (){
            self._trace('called create Answer');
            if (!!self.ownPeerConnection) {
                self.ownPeerConnection.createAnswer()
                    .then(function (answer) {
                        self._trace('create answer' + answer);
                        return self.ownPeerConnection.setLocalDescription(new RTCSessionDescription(answer));
                    })
                    .then(function () {
                        self._emit('sendAnswer', {
                            answer: self.ownPeerConnection.localDescription
                        });
                    });
            }
        }

        //---------- utils ----------//
        /**
         * socketを利用してデータ送信を行う。
         * @param String name イベント名
         * @param Array params 送信するパラメータの連想配列
         */
        proto._emit = function (name, param) {
            self._trace(name + ': ' + param);
            self.socket.emit(name, JSON.stringify(param));
        }

        /**
         * デフォルトのエラー時コールバック
         * とりあえずエラーメッセージを表示
         */
        proto._defaultErrorHandler = function (context) {
            return function(error) {
                self._trace('Failure in ' + context + ': ' + error.toString);
            }
        }

        /**
         * デフォルトの処理成功コールバック
         */
        proto._defaultSuccessHandler = function (context) {
            return function() {
                self._trace(context + ' is success');
            }
        }

        /**
         * ログ出力用メソッド
         * @param Object arg ログ出力対象
         */
        proto._trace = function (arg) {
            console.log(self._getCurrentTime() + ': ', arg);
        }

        /**
         * 現在日時を取得
         * @return Date 現在日時
         */
        proto._getCurrentTime = function () {
            return (window.performance.now() / 1000).toFixed(3);
        }

        this._init();
    }

    return MyRTCPeerConnection;
})();
