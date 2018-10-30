const WebSocket = require('ws');
const parseJson = require('parse-json');
var SerialPort = require('serialport');
var Readline = require('@serialport/parser-readline'); // nice little parser that uses a newline delimiter
var parser = new Readline();
var port = new SerialPort('COM3', function(err) {
    if (err) {
        console.log('Error opening serial port: ', err.message);
        // will need callback wrappers for reconnecting
    }
});

port.pipe(parser);

const wss = new WebSocket.Server({
    port: 8080
});

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        var msg = JSON.parse(message);
        if (msg.hasOwnProperty('uuid')) {
            port.write(message, function(err) {
                if (err) {
                    console.log("Error writing to serial: ", err.message);
                }
            });
        } else {
            console.log("Junk message");
            // Need more error logging here
        }
    });
    parser.on('data', function (msgFromBoat) {
        ws.send(messageFromBoat);
    });
});

