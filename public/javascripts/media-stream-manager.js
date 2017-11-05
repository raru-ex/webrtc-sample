var raru = raru || {};
raru.Media = raru.Media || {};

raru.Media.MediaStreamManager = (function () {
    var Common = raru.Common;
    var AUDIO = 1;
    var VIDEO = 2;
    var SCREEN = 3;

    /**
     * メディアストリーム管理を行うオブジェクトのコンストラクタ
     * カメラ、マイク、スクリーンの3種類を管理する前提
     * @param MediaStrem streamn
     */
    return {

        /**
         * カメラのストリームを返します。
         * 音声がある場合には音声も一緒に返します。
         * @return MediaStream カメラのStream
         */
        getVideoStream: function (stream) {
            var videoTrack = raru.Media.MediaStreamManager.getTrack(stream, VIDEO);
            var audioTrack = raru.Media.MediaStreamManager.getTrack(stream, AUDIO);
            var mediaStream = new MediaStream();

            if(!!videoTrack) {
                raru.Media.MediaStreamManager.addTrack(mediaStream, videoTrack);
            }
            if(!!audioTrack) {
                raru.Media.MediaStreamManager.addTrack(mediaStream, audioTrack);
            }

            if(0 < mediaStream.getTracks().length) {
                console.log('get video strem: ' + mediaStream);
                return mediaStream;
            }

            return null;
        },

        /**
         * キャプチャのストリームを返します。
         * 音声がある場合には音声も一緒に返します。
         * @return MediaStream キャプチャのStream
         */
        getScreenStream: function (stream) {
            var screenTrack = raru.Media.MediaStreamManager.getTrack(stream, SCREEN);
            // var audioTrack = raru.Media.MediaStreamManager.getTrack(AUDIO);
            var mediaStream = new MediaStream();

            if(!!screenTrack) {
                raru.Media.MediaStreamManager.addTrack(stream, screenTrack);
            }
            /*
            if(!!audioTrack) {
                mediaStream.addTrack(audioTrack);
            }
            */

            if(0 < mediaStream.getTracks().length) {
                console.log('get screen stream: ' + mediaStream);
                return mediaStream;
            }

            return null;
        },

        /**
         * 新たに取得したstreamを追加します。
         * すでにstreamが存在する場合には、重複していないトラックを追加します。
         * 同種のtrackが存在する場合には上書きを行います。
         * * getUserMediaをすると新規IDの振られたTrackが取得されるのでIDまでは見なくていいと判断し見ていない
         * @param MediaStream
         * @param Json option constructorと同じ
         */
        mergeStream: function (baseStream, stream) {
            if (!Common.isInitialized(stream) || !Common.isInitialized(stream)) {
                return baseStream;
            }

            console.log('merge stream: ' + stream);
            stream.getTracks().forEach(track => {
                addTrack(baseStream, track);
            });
        },

        /**
         * 種類を問わずTrackの追加を行います。
         * 同種のTrackがある場合には上書きを行います。
         * //TODO updateって上書きでいいの？
         */
        addTrack: function (baseStream, track) {
            var hasSameTrack = false;
            var trackType = raru.Media.MediaStreamManager._getTrackType(track);

            baseStream.getTracks().forEach(function (elem, index, array) {
                if(trackType === raru.Media.MediaStreamManager._getTrackType(elem)) {
                    baseStream.getTracks()[index] = track;
                    // raru.Media.MediaStreamManager.stream.removeTrack(raru.Media.MediaStreamManager.stream.getTracks()[index]);
                    // raru.Media.MediaStreamManager.stream.addTrack(track);
                    console.log('update track: ' + track)
                    hasSameTrack = true;
                }
            });

            // 存在しないタイプのTrackは追加
            if(!hasSameTrack) {
                baseStream.addTrack(track);
                console.log('add track: ' + track)
            }
            console.log(track);
            // 追加にしろ変更にしろidを更新
            // raru.Media.MediaStreamManager._setTrackId(track);
        },

        /**
         * 対象の種別のTrackを取得します。
         * @param String type
         * @return MediaStreamTrack 対象のタイプのTrack
         * 対象のタイプが存在しない場合にはnull
         */
        getTrack: function (stream, type) {
            var track = null;
            stream.getTracks().forEach(function (elem, index, array) {
                if (raru.Media.MediaStreamManager._getTrackType(elem) === type) {
                    console.log('get track: ' + elem);
                    track = elem;
                }
            });
            return track;
        },

        /*
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
        getOption: function (stream) {
            var option = {};
            stream.getTracks().forEach(track => {
                if(raru.Media.MediaStreamManager._isVideoTrack(track)) {
                    option.video = {
                        id: track.id
                    }
                }
                if(raru.Media.MediaStreamManager._isScreenTrack(track)) {
                    option.screen = {
                        id: track.id
                    }
                }
                if(raru.Media.MediaStreamManager._isAudioTrack(track)) {
                    option.audio = {
                        id: track.id
                    }
                }
            });
            return option;
        },

        //----------- private methods ------------//


        /**
         * 対象のトラックがキャプチャ以外の映像であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool キャプチャ以外の動画の場合true
         */
        _isVideoTrack: function (track) {
            return track.kind === 'video' && -1 === track.label.indexOf('screen');
        },

        /**
         * 対象のトラックがスクリーンキャプチャであるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool スクリーンキャプチャの場合true
         */
        _isScreenTrack: function (track) {
            return track.kind === 'video' && -1 < track.label.indexOf('screen');
        },

        /**
         * 対象のトラックが音声であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool 音声の場合true
         */
        _isAudioTrack: function (track) {
            return track.kind === 'audio';
        },

        /**
         * 対象のトラックのタイプを返します。
         * @param MediaStreamTrack 確認対象のtrack
         * @return String タイプ
         */
        _getTrackType: function (track) {
            if (raru.Media.MediaStreamManager._isVideoTrack(track)) {
                return VIDEO;
            } else if (raru.Media.MediaStreamManager._isScreenTrack(track)) {
                return SCREEN;
            } else if (raru.Media.MediaStreamManager._isAudioTrack(track)) {
                return AUDIO;
            }
        }
    }
})();

raru.Media.RemoteMediaStreamManager = (function() {
        var Common = raru.Common;
        var AUDIO = 1;
        var VIDEO = 2;
        var SCREEN = 3;
    /**
     * メディアストリーム管理を行うオブジェクトのコンストラクタ
     * カメラ、マイク、スクリーンの3種類を管理する前提
     * @param MediaStrem streamn
     */
    return {

        /**
         * カメラのストリームを返します。
         * 音声がある場合には音声も一緒に返します。
         * @return MediaStream カメラのStream
         */
        getVideoStream: function (stream, option) {
            var videoTrack = raru.Media.RemoteMediaStreamManager.getTrack(stream, VIDEO, option);
            var audioTrack = raru.Media.RemoteMediaStreamManager.getTrack(stream, AUDIO, option);
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
        },

        /**
         * キャプチャのストリームを返します。
         * 音声がある場合には音声も一緒に返します。
         * @return MediaStream キャプチャのStream
         */
        getScreenStream: function (stream, option) {
            var screenTrack = raru.Media.RemoteMediaStreamManager.getTrack(stream, SCREEN, option);
            // var audioTrack = raru.Media.MediaStreamManager.getTrack(AUDIO);
            var mediaStream = new MediaStream();

            if(!!screenTrack) {
                mediaStream.addTrack(screenTrack);
            }
            /*
            if(!!audioTrack) {
                mediaStream.addTrack(audioTrack);
            }
            */

            if(0 < mediaStream.getTracks().length) {
                console.log('get screen stream: ' + mediaStream);
                return mediaStream;
            }

            return null;
        },

        /**
         * 対象の種別のTrackを取得します。
         * @param String type
         * @return MediaStreamTrack 対象のタイプのTrack
         * 対象のタイプが存在しない場合にはnull
         */
        getTrack: function (stream, type, option) {
            var track = null;
            stream.getTracks().forEach(function (elem, index, array) {
                if (raru.Media.RemoteMediaStreamManager._getTrackType(elem, option) === type) {
                    console.log('get track: ' + elem);
                    track = elem;
                }
            });
            return track;
        },

        //----------- private methods ------------//


        /**
         * 対象のトラックがキャプチャ以外の映像であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool キャプチャ以外の動画の場合true
         */
        _isVideoTrack: function (track, option) {
            return !!option.video && track.id == option.video.id;
        },

        /**
         * 対象のトラックがスクリーンキャプチャであるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool スクリーンキャプチャの場合true
         */
        _isScreenTrack: function (track, option) {
            return !!option.screen && track.id == option.screen.id;
        },

        /**
         * 対象のトラックが音声であるかを判定
         * @param MediaStreamTrack チェック対象のtrack
         * @return Bool 音声の場合true
         */
        _isAudioTrack: function (track, option) {
            return !!option.audio && track.id == option.audio.id;
        },

        /**
         * 対象のトラックのタイプを返します。
         * @param MediaStreamTrack 確認対象のtrack
         * @return String タイプ
         */
        _getTrackType: function (track, option) {
            if (raru.Media.RemoteMediaStreamManager._isVideoTrack(track, option)) {
                return VIDEO;
            } else if (raru.Media.RemoteMediaStreamManager._isScreenTrack(track, option)) {
                return SCREEN;
            } else if (raru.Media.RemoteMediaStreamManager._isAudioTrack(track, option)) {
                return AUDIO;
            }
        }
    }
})();
