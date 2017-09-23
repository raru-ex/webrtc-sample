$(function(){
    var socket = io.connect("ws://"+ location.host);
    $('#submit').on('click', function() {
        console.log('test');
        socket.emit('init', "hello");
        console.log('test2');
    });
});
