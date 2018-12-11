const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8081');
var uuid = 0;
var messageBuffer = require('./messageBuffer.js');
var createCsvWriter = require('csv-writer').createObjectCsvWriter;
var csv = require('csvtojson');
var readline = require('readline');
var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        prompt: ">",
});

const csvWriter = createCsvWriter({
    path: './file.csv',
    header: [
        {id: 'data', title: 'MSG'},
        {id: 'uuid', title: 'UUID'}
    ]
});

const wss = new WebSocket.Server({
    port: 8080
});

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      ws.send("yoyo: " + message);  
    })
});

ws.on('open', function open() {
    // Might need to add some auto-reconnecting code here if the connection breaks.
});

var re = /[ \t]+/;
rl.on('line', (input) => {
    var cmdList = input.split(re);
    if (cmdList[0].toLowerCase() == "exit") {
        console.log("This conversation can serve no purpose anymore. Good-bye.");
        process.exit();
    } else if (cmdList[0].toLowerCase() == "start") {
        if (cmdList[1].toLowerCase() != "-c") {
            var msg2 = {};
            msg2.uuid = uuid;
            uuid = uuid + 1;
            msg2.type = "start";
            newMsg(msg);
        } else if (cmdList[1].toLowerCase() == "-c") {
            csv().fromFile(cmdList[2])
            .then((jsonObj) => {
                if (jsonObj.length > 120) {
                    console.log("Input co-ordinate set too large, maximum number of co-ordinates is 120");
                } else {
                    var msg = {};
                    msg.uuid = uuid;
                    uuid = uuid + 1;
                    msg.type = "clear";
                    newMsg(msg);
                    for (var i = 0; i < jsonObj.length; i++) {
                        var currentCord = jsonObj[i];
                        var msg1 = {};
                        msg1.uuid = uuid;
                        uuid = uuid + 1;
                        msg1.type = "cordset";
                        msg1.lon = currentCord["lon"];
                        msg1.lat = currentCord["lat"];
                        newMsg(msg1);
                    }              
                    var msg2 = {};
                    msg2.uuid = uuid;
                    uuid = uuid + 1;
                    msg2.type = "start";
                    newMsg(msg2);
                }
            });
        }
    } else if (cmdList[0].toLowerCase() == "load") {
        csv().fromFile(cmdList[1])
        .then((jsonObj) => {
            if (jsonObj.length > 120) {
                console.log("Input co-ordinate set too large, maximum number of co-ordinates is 120");
            } else {
                var msg = {};
                msg.uuid = uuid;
                uuid = uuid + 1;
                msg.type = "clear";
                newMsg(msg);
                for (var i = 0; i < jsonObj.length; i++) {
                    var currentCord = jsonObj[i];
                    var msg1 = {};
                    msg1.uuid = uuid;
                    uuid = uuid + 1;
                    msg1.type = "cordset";
                    msg1.lon = currentCord["lon"];
                    msg1.lat = currentCord["lat"];
                    newMsg(msg1);
                }      
            }
        });
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














var currentChunkedMsg = "";
var chunkingMsg = false;
ws.on('message', function incoming(data) {
    var msg = JSON.parse(data);
    if (msg.hasOwnProperty('uuid')) {
        confirmationMessageHandler(msg.uuid);
        // TEMP
        if (msg.type == "chunk") {
            chunkingMsg = true;
            currentChunkedMsg = currentChunkedMsg + msg.msg;
        }
        if (chunkingMsg == true && msg.type == "success") {
            chunkingMsg = false;
            var record = [
                {data: currentChunkedMsg, uuid:msg.uuid},
            ]
            csvWriter.writeRecords(record).then(() => { currentChunkedMsg = "";});
        }
        // TEMP
    }
    console.log(data);
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
            setTimeout(processBuffer,waitTime+2000,waitTime+2000);
        } else {
            console.log("Attemped to send while socket was closed");
            setTimeout(processBuffer,waitTime+2000,waitTime+2000);
            // need more behavior here
        }
    } else {
        messageBuffer.deleteCurrentMsg();
        if (messageBuffer.size > 0) {
            processBuffer(0);
        }
    }
}

