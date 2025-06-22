const express = require("express");
const router = express.Router();
const passport = require("passport");
const Song = require("../models/Song");
const User = require("../models/User");

// Middleware to ensure JSON responses
router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Error handler middleware
const handleErrors = (err, res) => {
    console.error("API Error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
};

// Create a new song
router.post(
    "/create",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const {name, thumbnail, track, author} = req.body;
            if (!name || !thumbnail || !track || !author) {
                return res.status(400).json({error: "Insufficient details to create song."});
            }
            const artist = req.user._id;
            const songDetails = {name, thumbnail, track, artist, author};
            const createdSong = await Song.create(songDetails);
            return res.json(createdSong);
        } catch (err) {
            return handleErrors(err, res);
        }
    }
);

// Get all songs by current user
router.get(
    "/get/mysongs",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const songs = await Song.find({artist: req.user._id}).populate("artist");
            return res.json({data: songs});
        } catch (err) {
            return handleErrors(err, res);
        }
    }
);

// Get all songs by name (search)
router.get(
    "/get/songname/:name",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const songs = await Song.find({
                name: { $regex: req.params.name, $options: "i" }
            }).populate("artist");
            return res.json({data: songs});
        } catch (err) {
            return handleErrors(err, res);
        }
    }
);

// Get all liked songs
router.get(
    "/liked",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            console.log("Fetching liked songs for user:", req.user._id);
            const user = await User.findById(req.user._id)
                .populate({
                    path: "likedSongs",
                    populate: {
                        path: "artist",
                        select: "firstName lastName username"
                    }
                });

            if (!user) {
                return res.status(404).json({error: "User not found"});
            }

            console.log("Found liked songs:", user.likedSongs);
            return res.json({data: user.likedSongs || []});
        } catch (err) {
            return handleErrors(err, res);
        }
    }
);

// Check if a song is liked
router.get(
    "/is-liked/:songId",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const {songId} = req.params;
            const user = await User.findById(req.user._id);
            
            if (!user) {
                return res.status(404).json({error: "User not found"});
            }

            const isLiked = user.likedSongs ? user.likedSongs.some(id => id.toString() === songId) : false;
            return res.json({isLiked});
        } catch (err) {
            return handleErrors(err, res);
        }
    }
);

// Like a song
router.post(
    "/like",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const {songId} = req.body;
            if (!songId) {
                return res.status(400).json({error: "Song ID is required"});
            }

            // Check if song exists
            const song = await Song.findById(songId);
            if (!song) {
                return res.status(404).json({error: "Song not found"});
            }

            // Add song to user's liked songs if not already liked
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({error: "User not found"});
            }

            const likedSongs = user.likedSongs || [];
            const alreadyLiked = likedSongs.some(id => id.toString() === songId);
            
            if (!alreadyLiked) {
                const updatedUser = await User.findByIdAndUpdate(
                    user._id,
                    { $push: { likedSongs: songId } },
                    { new: true }
                );
                
                if (!updatedUser) {
                    return res.status(500).json({error: "Failed to update liked songs"});
                }
            }

            return res.json({success: true, message: "Song liked successfully"});
        } catch (err) {
            console.error("Error liking song:", err);
            return res.status(500).json({error: "Internal server error", details: err.message});
        }
    }
);

// Unlike a song
router.post(
    "/unlike",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const {songId} = req.body;
            if (!songId) {
                return res.status(400).json({error: "Song ID is required"});
            }

            // Remove song from user's liked songs
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({error: "User not found"});
            }

            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { $pull: { likedSongs: songId } },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(500).json({error: "Failed to update liked songs"});
            }

            return res.json({success: true, message: "Song unliked successfully"});
        } catch (err) {
            console.error("Error unliking song:", err);
            return res.status(500).json({error: "Internal server error", details: err.message});
        }
    }
);

// Route to get trending songs
router.get(
    "/get/trending",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            // For now, we'll return the most recently added songs as trending
            // In a real app, you'd use metrics like play count, likes, etc.
            const songs = await Song.find({})
                .populate("artist")
                .sort({ createdAt: -1 })
                .limit(12);
            
            return res.status(200).json({
                data: songs,
                success: true
            });
        } catch (error) {
            console.error("Error fetching trending songs:", error);
            return res.status(500).json({
                err: "Internal server error",
                success: false
            });
        }
    }
);

// Delete a song
router.delete(
    "/delete/:songId",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            console.log("Delete request received for song:", req.params.songId);
            console.log("Request user:", req.user?._id);
            
            const currentUser = req.user;
            const songId = req.params.songId;

            if (!songId) {
                console.log("No song ID provided");
                return res.status(400).json({error: "Song ID is required"});
            }

            if (!currentUser || !currentUser._id) {
                console.log("No authenticated user found");
                return res.status(401).json({error: "Authentication required"});
            }

            console.log("Looking for song with ID:", songId);
            // Get the song
            const song = await Song.findById(songId);
            
            if (!song) {
                console.log("Song not found:", songId);
                return res.status(404).json({error: "Song not found"});
            }

            console.log("Found song:", {
                id: song._id,
                name: song.name,
                artist: song.artist,
                currentUser: currentUser._id
            });

            // Check if currentUser owns the song
            if (song.artist.toString() !== currentUser._id.toString()) {
                console.log("Unauthorized delete attempt:", {
                    songArtist: song.artist.toString(),
                    currentUser: currentUser._id.toString()
                });
                return res.status(403).json({error: "Not authorized to delete this song"});
            }

            // Delete the song
            const deletedSong = await Song.findByIdAndDelete(songId);
            if (!deletedSong) {
                console.log("Failed to delete song:", songId);
                return res.status(500).json({error: "Failed to delete song"});
            }

            // Also remove the song from any user's likedSongs
            const updateResult = await User.updateMany(
                { likedSongs: songId },
                { $pull: { likedSongs: songId } }
            );
            console.log("Updated users' liked songs:", updateResult);

            console.log("Song deleted successfully:", songId);
            return res.status(200).json({success: true, message: "Song deleted successfully"});
        } catch (error) {
            console.error("Error deleting song:", error);
            return res.status(500).json({error: "Internal server error", details: error.message});
        }
    }
);

module.exports = router;