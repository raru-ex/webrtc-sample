var port = chrome.runtime.connect();

window.addEventListener('message', function (evt) {
    if (evt.source != window) return;
    if (evt.data.type == 'getStreamId') {
        port.postMessage('getStreamId', function (res) {
            console.log(res);
        })
    }
});

port.onMessage.addListener(function (request, sender, sendResponse) {
    window.postMessage({ type: 'gotStreamId', streamid: request.streamid }, "*");
});
