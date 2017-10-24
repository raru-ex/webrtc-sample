var raru = raru || {};
raru.Media = raru.Media || {};

raru.Media.MediaStreamManager = (function () {

    /**
     * メディアストリーム管理を行うオブジェクトのコンストラクタ
     * カメラ、マイク、スクリーンの3種類を管理する前提
     * @param MediaStrem streamn
     */
    var MediaStreamManager = function(stream) {
        var self = this;
        var Common = raru.Common;
        this.stream = stream;

        //---------- functions ----------//
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
            var videoTrack = self.getTrack('video');
            var audioTrack = self.getTrack('audio');
            var mediaStream = new MediaStream();

            if(!!videoTrack) {
                mediaStream.addTrack(videoTrack);
            }
            if(!!audioTrack) {
                mediaStream.addTrack(audioTrack);
            }

            if(0 < mediaStream.getTracks().length) {
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
            var screenTrack = self.getTrack('screen');
            var mediaStream = new MediaStream();

            if(!!screenTrack) {
                mediaStream.addTrack(screenTrack);
            }

            if(0 < mediaStream.getTracks().length) {
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
         */
        proto.addStream = function (stream) {
            if(!Common.isInitialized(self.stream)) {
                self.stream = stream;
            } else {
                stream.getTracks().forEach(self.addTrack);
            }
        }

        /**
         * 種類を問わずTrackの追加を行います。
         * 同種のTrackがある場合には宇賀脇を行います。
         */
        proto.addTrack = function (track) {
            var hasSameTrack = false;
            self.stream.getTracks().forEach(function (elem, index, array) {
                if(self._getTrackTypeString(track) === self._getTrackTypeString(elem)) {
                    self.stream.getTracks()[index] = track;
                    hasSameTrack = true;
                }
            });

            // 存在しないタイプのTrackは追加
            if(!hasSameTrack) {
                self.stream.addTrack(track);
            }
        }

        /**
         * カメラの映像を停止します。
         */
        proto.stopVideo = function () {
            self._stopStream('video');
        }

        /**
         * 音声を停止します。
         */
        proto.stopAudio = function () {
            self._stopStream('audio');
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
            self._removeStream('video');
        }

        /**
         * 音声を削除します。
         */
        proto.removeAudio = function () {
            self._removeStream('audio');
        }

        /**
         * デスクトップ共有を削除します。
         */
        proto.removeScreen = function () {
            self._removeStream('screen');
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
                if (self._getTrackTypeString(elem) === type) {
                    track = elem;
                }
            });
            return track;
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
                if(self._getTrackTypeString(elem) === type) {
                    callback(elem);
                    return true;
                }
            });

            return false;
        }

        /**
         * 対象のトラックがキャプチャ以外の映像であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool キャプチャ以外の動画の場合true
         */
        proto._isVideoTrack = function (track) {
            return track.kind === 'video' && -1 === track.label.indexOf('screen');
        }

        /**
         * 対象のトラックがスクリーンキャプチャであるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool スクリーンキャプチャの場合true
         */
        proto._isScreenTrack = function (track) {
            return track.kind === 'video' && -1 < track.label.indexOf('screen');
        }

        /**
         * 対象のトラックが音声であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool 音声の場合true
         */
        proto._isAudioTrack = function (track) {
            return track.kind === 'audio';
        }

        /**
         * 対象のトラックのタイプを返します。
         * @param MediaStreamTrack 確認対象のtrack
         * @return String タイプ
         */
        proto._getTrackTypeString = function (track) {
            if (self._isVideoTrack(track)) {
                return 'video';
            } else if (self._isScreenTrack(track)) {
                return 'screen';
            } else if (self._isAudioTrack(track)) {
                return 'audio';
            }
        }

    }

    return MediaStreamManager;
})();

