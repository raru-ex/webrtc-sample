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
            return this.stream;
        }

        /**
         * 新たに取得したstreamを追加します。
         * すでにstreamが存在する場合には、重複していないトラックを追加します。
         * 同種のtrackが存在する場合には上書きを行います。
         * @param MediaStream
         */
        proto.addStream = function (stream) {
            if(!Common.isInitialized(this.stream)) {
                this.stream = stream;
            } else {
                stream.getTracks().forEach(addTrack);
            }
        }

        /**
         * 種類を問わずTrackの追加を行います。
         * 同種のTrackがある場合には宇賀脇を行います。
         */
        proto.addTrack = function (track) {
            var hasSameTrack = false;
            this.stream.getTracks().forEach(function (elem, index, array) {
                if(this._getTrackTypeString(track) === this._getTrackTypeString(elem)) {
                    this.stream.getTracks()[index] = track;
                    hasSameTrack = true;
                }
            });

            // 存在しないタイプのTrackは追加
            if(!hasSameTrack) {
                this.stream.addTrack(track);
            }
        }

        /**
         * カメラの映像を停止します。
         */
        proto.stopVideo = function () {
            this._stopStream('video');
        }

        /**
         * 音声を停止します。
         */
        proto.stopAudio = function () {
            this._stopStream('audio');
        }

        /**
         * デスクトップ共有を停止します。
         */
        proto.stopScreen = function () {
            this._stopStream('sreen');
        }

        /**
         * カメラの映像を削除します。
         */
        proto.removeVideo = function () {
            this._removeStream('video');
        }

        /**
         * 音声を削除します。
         */
        proto.removeAudio = function () {
            this._removeStream('audio');
        }

        /**
         * デスクトップ共有を削除します。
         */
        proto.removeScreen = function () {
            this._removeStream('screen');
        }

        //----------- private methods ------------//
        /**
         * 対象のstreamを停止します。
         * @param String type audio, video, screenの文字列
         * @return Bool 停止した場合にtrue
         */
        proto._stopStream = function (type) {
            return this._executeFunctionToTargetTrack(type, function (elem) {
                elem.stop();
            });
        }

        /**
         * 対象のstreamを削除します。
         * @param String 削除対象のtype
         * @return Bool 削除した場合にtrue
         */
        proto._removeStream = function (type) {
            return this._executeFunctionToTargetTrack(type, function (elem) {
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
            return this.stream.getTracks().forEach(function (elem, index, array) {
                if(this._getTrackTypeString(elem) === type) {
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
            if (this._isVideoTrack(track)) {
                return 'video';
            } else if (this._isScreenTrack(track)) {
                return 'screen';
            } else if (this._isAudioTrack(track)) {
                return 'audio';
            }
        }

    }

    return MediaStreamManager;
})();

