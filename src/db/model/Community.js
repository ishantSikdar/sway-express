const mongoose = require("..")
const { USER, COMMUNITY } = require("../../constant/dbContants")

const communitySchema = new mongoose.Schema({
    communityName: {
        type: String,
        required: true,
    },
    iconUrl: {
        type: String,
        required: false,
    },
    visibility: {
        type: String,
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: USER,
    }],
    code: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        required: true,
    },
    updatedAt: {
        type: Date,
        required: false,
    },
    updatedBy: {
        type: String,
        required: false,
    },
});

const Community = mongoose.model(COMMUNITY, communitySchema);
module.exports = Community;