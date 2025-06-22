const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

// Search users
router.get(
    "/search/:query",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const query = req.params.query;
            const users = await User.find({
                $or: [
                    { username: { $regex: query, $options: "i" } },
                    { firstName: { $regex: query, $options: "i" } },
                    { lastName: { $regex: query, $options: "i" } }
                ],
                _id: { $ne: req.user._id } // Exclude current user
            }).select("username firstName lastName profilePicture");
            
            return res.json({ data: users });
        } catch (err) {
            console.error("Error searching users:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Send friend request
router.post(
    "/request",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const { receiverId } = req.body;
            
            // Check if request already exists
            const existingRequest = await FriendRequest.findOne({
                $or: [
                    { sender: req.user._id, receiver: receiverId },
                    { sender: receiverId, receiver: req.user._id }
                ]
            });

            if (existingRequest) {
                return res.status(400).json({ error: "Friend request already exists" });
            }

            // Create new request
            const request = await FriendRequest.create({
                sender: req.user._id,
                receiver: receiverId
            });

            return res.json(request);
        } catch (err) {
            console.error("Error sending friend request:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Accept/Decline friend request
router.put(
    "/request/:requestId",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const { status } = req.body;
            const request = await FriendRequest.findById(req.params.requestId);
            
            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            if (request.receiver.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: "Not authorized" });
            }

            if (status === "accepted") {
                // Add users to each other's friend lists
                await User.updateOne(
                    { _id: request.sender },
                    { $addToSet: { friends: request.receiver } }
                );
                await User.updateOne(
                    { _id: request.receiver },
                    { $addToSet: { friends: request.sender } }
                );
            }

            request.status = status;
            await request.save();

            return res.json(request);
        } catch (err) {
            console.error("Error updating friend request:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Get friend list
router.get(
    "/list",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const user = await User.findById(req.user._id)
                .populate("friends", "username firstName lastName profilePicture isOnline lastSeen currentlyPlaying");
            return res.json({ data: user.friends });
        } catch (err) {
            console.error("Error fetching friend list:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Get pending friend requests
router.get(
    "/requests",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            const requests = await FriendRequest.find({
                receiver: req.user._id,
                status: "pending"
            }).populate("sender", "username firstName lastName profilePicture");
            return res.json({ data: requests });
        } catch (err) {
            console.error("Error fetching friend requests:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

module.exports = router; 