const mongoose = require("mongoose");

const Audiobook = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    narrator: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    audioFile: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    genre: {
        type: String,
        required: true,
    },
    uploadedBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    chapters: [{
        name: {
            type: String,
            required: true,
        },
        startTime: {
            type: Number,
            required: true,
        },
        endTime: {
            type: Number,
            required: true,
        }
    }],
    currentProgress: {
        type: Map,
        of: Number,
        default: new Map(),
    }
}, {
    timestamps: true
});

const AudiobookModel = mongoose.model("Audiobook", Audiobook);

module.exports = AudiobookModel; 