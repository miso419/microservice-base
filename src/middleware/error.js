const logger = require('@min/logger');

// NOTE: DO NOT REMOVE next even though it's not used. - express.js requirement
/* eslint-disable no-unused-vars */
module.exports = (err, req, res, next) => {
    const requestId = req.get('X-Session-Token')
        || req.get('requestId')
        || req.body.requestId
        || req.query.requestId;

    const userToken = req.get('userToken')
        || req.body.userToken
        || req.query.userToken;

    if (err.name === 'BuiltApiError') {
        const error = err.getError();
        res.status(error.status);
        res.json({
            requestId,
            error: { ...error },
        });
    } else {
        logger.error(err.message, err.stack, null, requestId);
        res.status(500);
        res.json({
            requestId,
            userToken,
            error: {
                code: '50000',
                message: 'Server error',
                details: err.message,
            },
        });
    }
};
