const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const { Console } = winston.transports;
const loggingWinston = new LoggingWinston();

// Create a Winston logger that streams to Stackdriver Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log"
function setup(level) {
    winston.configure({
        level,
        transports: [
            // Log to the console
            new Console(),
            // And log to Stackdriver Logging
            loggingWinston,
        ],
    });
}

function concatRequestId(message, requestId) {
    return `[REQUEST ID: ${requestId || 'N/A'}], MESSAGE: ${message}`;
}

function error(message, stack, metadata, requestId) {
    winston.error(concatRequestId(message, requestId), { stack, metadata });
}

function info(message, stack, metadata, requestId) {
    winston.info(concatRequestId(message, requestId), { stack, metadata });
}

function debug(message, stack, metadata, requestId) {
    winston.debug(concatRequestId(message, requestId), { stack, metadata });
}

module.exports = {
    setup,
    error,
    info,
    debug,
};
