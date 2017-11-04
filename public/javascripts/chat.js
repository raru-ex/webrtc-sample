$(function(){
    var Common = raru.Common;
    var socket = Common.getSocket();
    var ENTER = 13;
    var name = $('#userName').text();
    var room = $('#roomName').text();
    var $textArea = $('textarea');
    var $chat = $('#chat');
    var $sendButton = $('#send');
    var chatBody = document.getElementById('chatBody');

    function init() {
        socket.emit('join', {
            name: name,
            roomName: room,
            time: getFormatedCurrentTime()
        });
    }

    socket.on('join', function (data) {
        displayMessage('システム', [data.name + 'さんが入室しました。'], data.time);
    });

    socket.on('exit', function (data) {
        displayMessage('システム', [data.name + 'さんが退室しました。'], getFormatedCurrentTime());
    });

    socket.on('sendMessage', function (data) {
        displayMessage(data.name, data.content, data.time);
    });

    $textArea.on('keyup', function (e) {
        if(e.shiftKey || e.ctrlKey) {
            if(e.keyCode === ENTER) {
                postMessage();
            }
        }
    });

    $sendButton.on('click', function () {
        postMessage();
    });

    function postMessage() {
        if(0 < $.trim($textArea.val()).length) {
            var content = Common.splitByLine($textArea.val());
            var time = getFormatedCurrentTime();
            displayMessage(name, content, time);
            sendMessageToOthers(name, content, time);
            $textArea.val('');
        }
    }

    function sendMessageToOthers(name, content, time) {
        socket.emit('sendMessage', {
            name: name,
            content: content,
            time: time
        });
    }

    function displayMessage(name, content, time) {
        $chat.append(createMessagePartialView(name, content, time));
        chatBody.scrollTo(0, chatBody.scrollHeight);
    }

    function createMessagePartialView(name, content, time) {
        var $messageLi = $('<li></li>', { addClass : 'message'});
        var $messageBody = $('<div></div>', { addClass : 'message-body'});
        var $messageHeader = $('<div></div>', { addClass: 'chat-header' }).append($('<span></span>', { addClass: 'name font-weight-bold' , text: name }));
        var $small = $('<small></small>', { addClass: 'text-muted pull-right' }).append($('<span></span>', { addClass: 'posted-time' , text: time}));
        $messageHeader.append($small);
        $messageBody.append($messageHeader);

        content.forEach(function (line) {
            $messageBody.append($('<p></p>', { text: line }));
        });

        return $messageLi.append($messageBody);
    }

    function getFormatedCurrentTime () {
        return moment().format('MM月DD日 kk:mm:ss');
    }

    init();
});
