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
            var url = prefix + '://' + location.host;
            if(!raru.Common.sockets[url]) {
                raru.Common.sockets[url] = io.connect(url);
            }
            return raru.Common.sockets[url];
        }
        return null;
    },

    splitByLine: function (str) {
        return str.split(/\r\n|\r|\n/);
    },

    sockets: []
};

