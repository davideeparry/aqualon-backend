const WebSocket = require('ws');
const parseJson = require('parse-json');

const wss = new WebSocket.Server({
    port: 8080
});

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        var msg = JSON.parse(message);
        if (msg.hasOwnProperty('uuid')) {
            ws.send(message);
            console.log(message);
        } else {
            console.log("Junk message");
            // Need more error logging here
        }
    });
});

