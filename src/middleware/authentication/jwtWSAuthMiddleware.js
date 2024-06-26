const url = require('url');
const jwt = require('jsonwebtoken');
const { logger } = require('../../config/logger');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware function to handle WebSocket authentication
exports.jwtWSAuthMiddleware = (ws, req) => {
    const queryObject = url.parse(req.url, true).query;
    const authToken = queryObject.auth;

    if (!authToken) {
        logger.info('Authorization token is missing');
        ws.close(1008, 'Authorization token is missing');
        return { status: false, message: 'Authorization token is missing' };
    }

    try {
        const [, jwtToken] = authToken.split(" ");
        const decodedValue = jwt.verify(jwtToken, JWT_SECRET);

        if (decodedValue.userId) {
            ws.userId = decodedValue.userId;
            return { status: true, message: 'User Authenticated' };

        } else {
            logger.info('Invalid authorization token, no username found');
            ws.close(1008, 'Invalid authorization token, no username found');
            return { status: false, message: 'Invalid authorization token, no username found' };

        }
    } catch (error) {
        logger.info('Invalid authorization token');
        ws.close(1008, 'Invalid authorization token');
        return { status: false, message: 'Invalid authorization token' };

    }
};