const mongoose = require("mongoose");
// How to create a model
// Step 1 :require mongoose
// Step 2 :Create a mongoose schema (structure of a user)
// Step 3 : Create a model

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        private: true
    },
    profilePicture: {
        type: String,
        default: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
    },
    likedSongs: {
        type: [{
            type: mongoose.Types.ObjectId,
            ref: "Song"
        }],
        default: [],
        required: false
    },
    likedPlaylists: {
        type: [{
            type: mongoose.Types.ObjectId,
            ref: "Playlist"
        }],
        default: [],
        required: false
    },
    subscribedArtists: {
        type: [{
            type: mongoose.Types.ObjectId,
            ref: "User"
        }],
        default: [],
        required: false
    },
    friends: [{
        type: mongoose.Types.ObjectId,
        ref: "User"
    }],
    currentlyPlaying: {
        song: {
            type: mongoose.Types.ObjectId,
            ref: "Song"
        },
        timestamp: Date
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Pre-save middleware to ensure arrays are initialized
UserSchema.pre('save', function(next) {
    if (!this.isModified('likedSongs')) this.likedSongs = this.likedSongs || [];
    if (!this.isModified('likedPlaylists')) this.likedPlaylists = this.likedPlaylists || [];
    if (!this.isModified('subscribedArtists')) this.subscribedArtists = this.subscribedArtists || [];
    next();
});

// Static method to update arrays without full validation
UserSchema.statics.updateArrays = async function(userId, updates) {
    try {
        const result = await this.updateOne(
            { _id: userId },
            updates,
            { 
                runValidators: false,
                new: true 
            }
        );
        return result;
    } catch (error) {
        console.error('Error updating arrays:', error);
        return null;
    }
};

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;