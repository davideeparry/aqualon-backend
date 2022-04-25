const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8081');
var uuid = 0;
var messageBuffer = require('./messageBuffer.js');
var readline = require('readline');
var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        prompt: ">",
});

const currentChunkedMsg = "";
const chunkingMsg = false;

const wss = new WebSocket.Server({
    port: 8080
});

wss.on('connection', function connection(ws) {
    console.log('Web API started...');

    ws.on('message', function incoming(message) {
        
        const obj = JSON.parse(message);

        if (obj.type == "example") {
            var msg = {};
            msg.uuid = uuid;
            uuid = uuid + 1;
            msg.type = "example";
            newMsg(msg);  
        }
    });
});

ws.on('open', function open() {
    // Might need to add some auto-reconnecting code here if the connection breaks.
});

const re = /[ \t]+/;
rl.on('line', (input) => {
    // commands are just examples from project this code was made for
    var cmdList = input.split(re);
    if (cmdList[0].toLowerCase() == "exit") {
        process.exit();
    } else if (cmdList[0].toLowerCase() == "delete") {
        var msg2 = {};
        msg2.uuid = uuid;
        uuid = uuid + 1;
        msg2.type = "delete";
        newMsg(msg2); 
    } else if (cmdList[0].toLowerCase() == "stop") {
        var msg2 = {};
        msg2.uuid = uuid;
        uuid = uuid + 1;
        msg2.type = "stop";
        newMsg(msg2);
    } else if (cmdList[0].toLowerCase() == "get") {
        if (cmdList[1].toLowerCase() == "data") {
            var msg2 = {};
            msg2.uuid = uuid;
            uuid = uuid + 1;
            msg2.type = "get";
            msg2.data = "data";
            newMsg(msg2);
        } else if (cmdList[1].toLowerCase() == "logs") {
            var msg2 = {};
            msg2.uuid = uuid;
            uuid = uuid + 1;
            msg2.type = "get";
            msg2.data = "logs";
            newMsg(msg2);
        } else if (cmdList[1].toLowerCase() == "status") {
            var msg2 = {};
            msg2.uuid = uuid;
            uuid = uuid + 1;
            msg2.type = "get";
            msg2.data = "status";
            newMsg(msg2);
        }
    }
});

ws.on('message', function incoming(data) {
    var msg = JSON.parse(data);
    if (msg.hasOwnProperty('uuid')) {
        if (msg.type == "success") {
            confirmationMessageHandler(msg.uuid);
        }
        
        // TEMP code for handling multi-part data messages
        if (msg.type == "chunk") {
            chunkingMsg = true;
            currentChunkedMsg = currentChunkedMsg + msg.msg;
        }
        if (chunkingMsg == true && msg.type == "success") {
            chunkingMsg = false;
            console.log(currentChunkedMsg); // just to show the basic process working
            currentChunkedMsg = "";
        }
        // End of TEMP
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
            setTimeout(processBuffer,1000,1000);
        } else {
            console.log("Attemped to send while socket was closed");
            setTimeout(processBuffer,1000,1000);
            // need more behavior here
        }
    } else {
        messageBuffer.deleteCurrentMsg();
        if (messageBuffer.size > 0) {
            processBuffer(0);
        }
    }
}

