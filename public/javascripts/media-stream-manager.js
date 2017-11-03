var raru = raru || {};
raru.Media = raru.Media || {};

raru.Media.MediaStreamManager = (function () {

    /**
     * メディアストリーム管理を行うオブジェクトのコンストラクタ
     * カメラ、マイク、スクリーンの3種類を管理する前提
     * @param MediaStrem streamn
     * @param Json option video, audio, screenの有無 (省略可能)
     * {
     *   audio {
     *     id: '123-333-2222'
     *   },
     *   video: {
     *     id: '882-313-112'
     *   }
     *   screen: {
     *     id: '291-129-282'
     *   }
     * }
     */
    var MediaStreamManager = function(stream, option) {
        var self = this;
        var Common = raru.Common;
        var videoTrackId = null;
        var screenTrackId = null;
        var audioTrackId = null;
        this.AUDIO = 1;
        this.VIDEO = 2;
        this.SCREEN = 3;
        this.isRemote = false;

        //---------- public functions ----------//
        var proto = MediaStreamManager.prototype;

        /**
         * streamを取得します。
         * @return MediaStream
         */
        proto.getStream = function () {
            return self.stream;
        }

        /**
         * カメラのストリームを返します。
         * 音声がある場合には音声も一緒に返します。
         * @return MediaStream カメラのStream
         */
        proto.getVideoStream = function () {
            var videoTrack = self.getTrack(self.VIDEO);
            var audioTrack = self.getTrack(self.AUDIO);
            var mediaStream = new MediaStream();

            if(!!videoTrack) {
                mediaStream.addTrack(videoTrack);
            }
            if(!!audioTrack) {
                mediaStream.addTrack(audioTrack);
            }

            if(0 < mediaStream.getTracks().length) {
                console.log('get video strem: ' + mediaStream);
                return mediaStream;
            }

            return null;
        }

        /**
         * キャプチャのストリームを返します。
         * 音声がある場合には音声も一緒に返します。
         * @return MediaStream キャプチャのStream
         */
        proto.getScreenStream = function () {
            var screenTrack = self.getTrack(self.SCREEN);
            var audioTrack = self.getTrack(self.AUDIO);
            var mediaStream = new MediaStream();

            if(!!screenTrack) {
                mediaStream.addTrack(screenTrack);
            }
            if(!!audioTrack) {
                mediaStream.addTrack(audioTrack);
            }

            if(0 < mediaStream.getTracks().length) {
                console.log('get screen stream: ' + mediaStream);
                return mediaStream;
            }

            return null;
        }

        /**
         * 新たに取得したstreamを追加します。
         * すでにstreamが存在する場合には、重複していないトラックを追加します。
         * 同種のtrackが存在する場合には上書きを行います。
         * * getUserMediaをすると新規IDの振られたTrackが取得されるのでIDまでは見なくていいと判断し見ていない
         * @param MediaStream
         * @param Json option constructorと同じ
         */
        proto.addStream = function (stream) {
            if (!Common.isInitialized(stream)) {
                return;
            }

            console.log('add stream: ' + stream);
            if(!Common.isInitialized(self.stream)) {
                self.stream = new MediaStrem();
            }
            stream.getTracks().forEach(self.addTrack);
        }

        /**
         * 種類を問わずTrackの追加を行います。
         * 同種のTrackがある場合には上書きを行います。
         * //TODO updateって上書きでいいの？
         */
        proto.addTrack = function (track) {
            var hasSameTrack = false;
            var trackType = self._getTrackType(track);

            self.stream.getTracks().forEach(function (elem, index, array) {
                if(trackType === self._getTrackType(elem)) {
                    self.stream.getTracks()[index] = track;
                    // self.stream.removeTrack(self.stream.getTracks()[index]);
                    // self.stream.addTrack(track);
                    console.log('update track: ' + track)
                    hasSameTrack = true;
                }
            });

            // 存在しないタイプのTrackは追加
            if(!hasSameTrack) {
                self.stream.addTrack(track);
                console.log('add track: ' + track)
            }
            console.log(track);
            // 追加にしろ変更にしろidを更新
            self._setTrackId(track);
        }

        /**
         * カメラの映像を停止します。
         */
        proto.stopVideo = function () {
            self._stopStream(self.VIDEO);
        }

        /**
         * 音声を停止します。
         */
        proto.stopAudio = function () {
            self._stopStream(self.AUDIO);
        }

        /**
         * デスクトップ共有を停止します。
         */
        proto.stopScreen = function () {
            self._stopStream('sreen');
        }

        /**
         * カメラの映像を削除します。
         */
        proto.removeVideo = function () {
            self._removeStream(self.VIDEO);
        }

        /**
         * 音声を削除します。
         */
        proto.removeAudio = function () {
            self._removeStream(self.AUDIO);
        }

        /**
         * デスクトップ共有を削除します。
         */
        proto.removeScreen = function () {
            self._removeStream(self.SCREEN);
        }

        proto.onAddTrack = function (callback) {
            self.stream.onaddtrack = callback;
        }

        proto.onRemoveTrack = function (callback) {
            self.stream.onremovetrack = callback;
        }


        /**
         * 対象の種別のTrackを取得します。
         * @param String type
         * @return MediaStreamTrack 対象のタイプのTrack
         * 対象のタイプが存在しない場合にはnull
         */
        proto.getTrack = function (type) {
            var track = null;
            self.stream.getTracks().forEach(function (elem, index, array) {
                if (self._getTrackType(elem) === type) {
                    console.log('get track: ' + elem);
                    track = elem;
                }
            });
            return track;
        }

        /**
         * 現在streamに登録されている状態をコンストラクタ引数のoption形式で返します。
         * @return Object option コンストラクタ引数
         */
        proto.getOption = function () {
            var option = {};
            if(!!self.videoTrackId) {
                option.video = {
                    id: self.videoTrackId
                }
            }
            if(!!self.screenTrackId) {
                option.screen = {
                    id: self.screenTrackId
                }
            }
            if(!!self.audioTrackId) {
                option.audio = {
                    id: self.audioTrackId
                }
            }
            return option;
        }

        /**
         * optionを反映します。
         * @param Json option コンストラクタのoptionと同様
         */
        proto.extendOption = function (option) {
            if (Common.isInitialized(option)) {
                if (!!option.audio) {
                    self.audioTrackId = option.audio.id;
                }
                if (!!option.video) {
                    self.videoTrackId = option.video.id;
                }
                if (!!option.screen) {
                    self.screenTrackId = option.screen.id;
                }
            }
        }
        //----------- private methods ------------//


        /**
         * 対象のstreamを停止します。
         * @param String type audio, video, screenの文字列
         * @return Bool 停止した場合にtrue
         */
        proto._stopStream = function (type) {
            return self._executeFunctionToTargetTrack(type, function (elem) {
                elem.stop();
            });
        }

        /**
         * 対象のstreamを削除します。
         * @param String 削除対象のtype
         * @return Bool 削除した場合にtrue
         */
        proto._removeStream = function (type) {
            return self._executeFunctionToTargetTrack(type, function (elem) {
                self.stream.removeTrack(elem);
            });
        }

        /**
         * 対象のタイプのTrackに対して処理を実行
         * @param String type
         * @param Function callback 対象のタイプを引数に実行されるコールバック関数
         * @return 同種のtrackに対して処理を実行した場合true
         */
        proto._executeFunctionToTargetTrack = function (type, callback) {
            return self.stream.getTracks().forEach(function (elem, index, array) {
                if(self._getTrackType(elem) === type) {
                    callback(elem);
                    return true;
                }
            });

            return false;
        }

        /**
         * trackに合わせてidをセットします。
         */
        proto._setTrackId = function (track) {
            var type = self._getTrackType(track);
            if(type === self.AUDIO) {
                self.audioTrackId = track.id;
            } else if (type === self.VIDEO) {
                self.videoTrackId = track.id;
            } else if (type === self.SCREEN) {
                self.screenTrackId = track.id
            }
        }

        /**
         * 対象のトラックがキャプチャ以外の映像であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool キャプチャ以外の動画の場合true
         */
        proto._isVideoTrack = function (track) {
            if (self.isRemote) {
                return track.id === self.videoTrackId;
            }
            return track.kind === 'video' && -1 === track.label.indexOf('screen');
        }

        /**
         * 対象のトラックがスクリーンキャプチャであるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool スクリーンキャプチャの場合true
         */
        proto._isScreenTrack = function (track) {
            if (self.isRemote) {
                return track.id === self.screenTrackId;
            }
            return track.kind === 'video' && -1 < track.label.indexOf('screen');
        }

        /**
         * 対象のトラックが音声であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool 音声の場合true
         */
        proto._isAudioTrack = function (track) {
            if (self.isRemote) {
                return track.id === self.audioTrackId;
            }
            return track.kind === 'audio';
        }

        /**
         * 対象のトラックのタイプを返します。
         * @param MediaStreamTrack 確認対象のtrack
         * @return String タイプ
         */
        proto._getTrackType = function (track) {
            if (self._isVideoTrack(track)) {
                return self.VIDEO;
            } else if (self._isScreenTrack(track)) {
                return self.SCREEN;
            } else if (self._isAudioTrack(track)) {
                return self.AUDIO;
            }
        }

        /**
         * オブジェクトを初期化します
         * @param MediaStream stream セットするストリーム
         * @param Json option コンストラクタと同様
         */
        proto._init = function (inputStream, option) {
            self.extendOption(option);
            if(Common.isInitialized(inputStream)) {
                self.stream = inputStream;
            } else {
                self.stream = new MediaStream();
                self.addStream(inputStream);
            }
        }

        self._init(stream, option);
    }

    return MediaStreamManager;
})();

/**
 * RemoteのStreamを管理する用のクラス
 */
raru.Media.RemoteMediaStreamManager = (function() {
    var RemoteMediaStreamManager = {};

    /**
     * コンストラクタ
     * isRemoteをtrueにセットする以外は全てMediaStreamManagerと同じです。
     */
    RemoteMediaStreamManager = function (stream, option) {
        raru.Media.MediaStreamManager.call(this, stream, option);
        this.isRemote = true;
    }


    /**
     * MediaStreamManagerのプロトタイプを継承します。
     */
    RemoteMediaStreamManager.prototype = Object.create(raru.Media.MediaStreamManager.prototype, {
        constructor: {
            configurable: true,
            enumerable: true,
            writable: true,
            value: RemoteMediaStreamManager
        }
    });

    return RemoteMediaStreamManager;
})();
