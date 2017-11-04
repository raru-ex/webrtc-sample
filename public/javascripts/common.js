var raru = raru || {};
raru.Common = (function() {
    var sockets = [];

    return {
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
                var url = prefix + '://' + location.host;
                if(!sockets[url]) {
                    sockets[url] = io.connect(url);
                }
                return sockets[url];
            }
            return null;
        },

        splitByLine: function (str) {
            return str.split(/\r\n|\r|\n/);
        }
    }

})();
