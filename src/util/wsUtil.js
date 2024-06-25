const { WebSocket } = require('ws');
const url = require('url');
const { jwtWSAuthMiddleware } = require("../middleware/authentication/jwtWSAuthMiddleware");
const { objectIdSchema } = require('../validation/fields');
const Community = require('../db/model/Community');
const { API_REQ_LOG, } = require('../constant/logConstants');
const User = require('../db/model/User');
const { logger } = require('../config/logger');
const Message = require('../db/model/Message');
const { convertToISTddMMyyHHMM } = require('./dateUtil');

exports.establistChatConnection = async (socket, req) => {
    const authResponse = jwtWSAuthMiddleware(socket, req);

    if (!authResponse.status) {
        logger.error("Token auth failed");
        return { status: false, message: authResponse.message, community: null, user: null };
    }

    const location = url.parse(req.url, true);
    const communityId = location.pathname.split('/')[1];
    const result = objectIdSchema.safeParse(communityId);

    if (!result.success) {
        logger.info('Invalid Community Id');
        return { status: false, message: "Invalid Community Id", community: null, user: null };
    }

    const community = await Community.findById(communityId);
    const user = await User.findById(socket.userId);

    if (!community || !user) {
        logger.info('Community or User Not Found');
        return { status: false, message: "Community or User Not Found", community: null, user: null };
    }

    const userPresent = community.members.find((memberId) => memberId.toString() === socket.userId);

    if (!userPresent) {
        logger.info('User is not a part of community');
        return { status: false, message: "User not part of community", community: null, user: null }
    }

    socket.communityId = communityId;

    logger.info(`User ${socket.userId} authenticated and socket established`);
    return { status: true, message: "Connection Established", community, user };
}

exports.sendMessageToClients = async (messageData, user, clients, senderSocket) => {
    const messageTime = new Date();
    const messageToBeSaved = new Message({
        userId: senderSocket.userId,
        content: { data: messageData.content },
        createdAt: messageTime
    });
    await messageToBeSaved.save();

    clients.forEach((metadata, clientSocket) => {
        if (metadata.communityId === senderSocket.communityId && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(
                JSON.stringify({
                    message: messageData.content,
                    sender: {
                        name: user.name,
                        photoUrl: user.photo,
                    },
                    time: convertToISTddMMyyHHMM(messageTime),
                })
            );
        }
    });
}