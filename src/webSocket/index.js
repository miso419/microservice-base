const http = require('http');
const WebSocket = require('ws');
const { INBOUND_EVENT } = require('./constants');

let webSocketServer = null;

const throwErrorIfFalse = (condition, errMsg) => {
    if (!condition) {
        throw new SyntaxError(errMsg);
    }
};

/* eslint-disable no-param-reassign */
// ws must be mutated. e.g. ws.userToken = jsonData.userToken;

const handleClientMessage = (ws, message) => {
    const jsonData = JSON.parse(message);
    if (jsonData.event === INBOUND_EVENT.LOGIN) {
        ws.userToken = jsonData.userToken;
    } else if (jsonData.event === INBOUND_EVENT.LOGOUT) {
        ws.userToken = null;
        ws.terminate();
    }
    // Except above events, all inbound messages are ignored. They must be through HTTP request.
};

const initEvents = () => {
    webSocketServer.on('connection', (ws) => {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        ws.on('message', (message) => handleClientMessage(ws, message));
    });
};

// Ref: https://github.com/websockets/ws
const detectBrokenConnections = () => {
    setInterval(() => {
        webSocketServer.clients.forEach((ws) => {
            if (!ws.isAlive) { return ws.terminate(); }

            ws.isAlive = false;
            ws.ping(null, false, true);
            return null;
        });
    }, 10000);
};

const init = (expressApp, webSocketPort) => {
    throwErrorIfFalse(!webSocketServer, 'webSocketServer has already been initialised.');
    throwErrorIfFalse(expressApp, 'expressApp is required.');
    throwErrorIfFalse(webSocketPort, 'webSocketPort is required.');

    const server = http.createServer(expressApp);
    // TODO: Add verifyClient
    webSocketServer = new WebSocket.Server({ server, port: webSocketPort });

    initEvents();
    detectBrokenConnections();
};

const validateWebSocketServer = () => {
    throwErrorIfFalse(webSocketServer, 'webSocketServer has not been initialised. Call init() first.');
};

const executeSend = (ws, jsonData) => {
    ws.send(JSON.stringify(jsonData),
        (error) => {
            if (error) {
                throw new Error(`WSS Send Error. data: ${JSON.stringify(jsonData)}, error: ${JSON.stringify(error)}`);
            }
        });
};

const getWs = (userToken) => {
    // HACK: clients is not an iterative array
    let matchedWs = null;
    webSocketServer.clients.forEach((ws) => {
        if (ws.userToken === userToken) {
            matchedWs = ws;
        }
    });
    return matchedWs;
};

const send = (userToken, jsonData) => {
    validateWebSocketServer();
    const ws = getWs(userToken);
    if (!ws) { return; }

    executeSend(ws, jsonData);
};

const broadcastAll = (jsonData) => {
    validateWebSocketServer();
    webSocketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            executeSend(client, jsonData);
        }
    });
};
/* eslint-enable no-param-reassign */

// TODO: broadcastPerClient, broadcastPerProject, broadcastPerTeam, etc.

module.exports = {
    init,
    send,
    broadcastAll,
};
