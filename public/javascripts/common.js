var raru = raru || {};
raru.Common = {

    isInitialized: function (target) {
        return typeof target !== "undefined";
    },

    getSocket: function () {
        if(raru.Common.isInitialized(io) &&
           raru.Common.isInitialized(io.connect)) {
            var prefix = 'ws';
            if ('https:' == document.location.protocol) {
                prefix = 'wss';
            }
            return io.connect(prefix + '://' + location.host);
        }
        return null;
    },

    splitByLine: function (str) {
        return str.split(/\r\n|\r|\n/);
    }
};

