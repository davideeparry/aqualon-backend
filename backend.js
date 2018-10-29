const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
var messageBuffer = require('./messageBuffer.js');

ws.on('open', function open() {
    // Might need to add some auto-reconnecting code here if the connection breaks.
});

ws.on('message', function incoming(data) {
    var msg = JSON.parse(data);
    if (msg.hasOwnProperty('uuid')) {
        confirmationMessageHandler(msg.uuid);
    }
});

function confirmationMessageHandler(uuid) {
    messageBuffer.confirmMsg(uuid);
};

function newMsg(msg) {
    messageBuffer.addMsg(msg);
    if (messageBuffer.size == 1) {
        processBuffer(0);
    }
}

function processBuffer(waitTime) {
    if (!messageBuffer.currentMsgConfirmed) {
        var msg = messageBuffer.getCurrentMsg();
        if (ws.readyState == ws.OPEN) {
            ws.send(JSON.stringify(msg));
            setTimeout(processBuffer,waitTime+500,waitTime+500);
        } else {
            console.log("Attemped to send while socket was closed");
            setTimeout(processBuffer,waitTime+500,waitTime+500);
            // need more behavior here
        }
    } else {
        messageBuffer.deleteCurrentMsg();
        if (messageBuffer.size > 0) {
            processBuffer(0);
        }
    }
}

