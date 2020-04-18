const bodyParser = require('body-parser');
const express = require('express');
const hpp = require('hpp');
const logger = require('./helpers/logger');
const webSocket = require('./webSocket');
const home = require('./middleware/home');
const notFound = require('./middleware/notFound');
const error = require('./middleware/error');

module.exports = class {
    constructor(params) {
        this.params = params;
        this.middleware = (req, res, next) => { next(); };
        this.init();
    }

    init() {
        this.validateParams();
        this.initLogger();
        this.initExpress();
        this.initWebSocket();
        this.initRouteMiddleware();
    }

    validateParams() {
        if (!this.params.name) throw new Error('missing name');
        if (!this.params.localPort) throw new Error('missing localPort');
        if (!this.params.routes) throw new Error('missing routes');
        if (this.params.middleware) this.middleware = this.params.middleware;

        // logger config validation
        const { level, logGroupName, logStreamName } = this.params.logConfig || {};
        if (!level || !logGroupName || !logStreamName) {
            throw new Error('missing logConfig or properties (level, logGroupName, logStreamName)');
        }
    }

    initLogger() {
        const { level, logGroupName, logStreamName } = this.params.logConfig;
        logger.setup(level, logGroupName, logStreamName);
    }

    initExpress() {
        const port = process.env.PORT || this.params.localPort;
        this.server = express();
        this.server.disable('x-powered-by');
        this.server.set('port', port);
        this.server.set('name', this.params.name);
        this.server.set('version', this.params.version ? this.params.version : '');
        this.server.use(bodyParser.json({ limit: '50mb' }));
        this.server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
        this.server.use(hpp());
        this.server.use(this.middleware);
        this.server.use((req, res, next) => {
            req.requestId = req.get('X-Correlation-Id')
                || req.get('X-Session-Token')
                || req.get('requestId')
                || req.body.requestId
                || req.query.requestId;
            next();
        });
    }

    initWebSocket() {
        const { webSocketPort } = this.params;
        if (!webSocketPort) { return; }

        webSocket.init(this.server, webSocketPort);
        this.webSocketServer = webSocket;
    }

    initRouteMiddleware() {
        this.server.get('/', home);
        this.server.use(this.params.routes);
        this.server.use(notFound);
        this.server.use(error);
    }

    start() {
        this.http = this.server.listen(this.server.get('port'), () => {
            logger.info(`${this.server.get('name')} started at port: ${this.server.get('port')}`);
        });
    }

    stop() {
        if (this.http) this.http.close();
    }

    getWebSocketServer() {
        return this.webSocketServer;
    }
};
