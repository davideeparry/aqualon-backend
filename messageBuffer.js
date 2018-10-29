var messageBuffer = {};
messageBuffer.buffer = {};
messageBuffer.size = 0;
messageBuffer.currentMsg = {};
messageBuffer.currentMsgConfirmed = false;
messageBuffer.addMsg = function(msg) {
    if (msg.hasOwnProperty('uuid')) {
        messageBuffer.buffer[msg.uuid] = msg;
        if (messageBuffer.size == 0) {
            messageBuffer.currentMsg = msg.uuid;
        }
        messageBuffer.size = messageBuffer.size + 1;
    } else {
        // Want better error logging here and throughout
        console.log("ERROR: No uuid in msg in call to addMsg");
        return false;
    }
};
messageBuffer.getCurrentMsg = function() {
    if (messageBuffer.size == 0) {
        return false;
    } else {
        return messageBuffer.buffer[messageBuffer.currentMsg];
    }
};
messageBuffer.confirmMsg = function(uuid) {
    if (messageBuffer.size == 0) {
        return false;
    }
    if (uuid == messageBuffer.currentMsg) {
        messageBuffer.currentMsgConfirmed = true;
        return true;
    }
};
messageBuffer.deleteCurrentMsg = function() {
    if (messageBuffer.size == 0) {
        return false;
    } 
    delete messageBuffer.buffer[messageBuffer.currentMsg];
    if (messageBuffer.size == 1) {
        messageBuffer.currentMsg = {};
    } else {
        messageBuffer.currentMsg = Object.keys(messageBuffer.buffer)[0];
    }
    messageBuffer.size = messageBuffer.size - 1;
    messageBuffer.currentMsgConfirmed = false;
};
module.exports = messageBuffer;