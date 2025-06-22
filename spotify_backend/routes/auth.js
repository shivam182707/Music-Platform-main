const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const {getToken} = require("../utils/helpers");
const passport = require("passport");

// Get current user
router.get(
    "/current-user",
    passport.authenticate("jwt", {session: false}),
    async (req, res) => {
        try {
            console.log("Current user request received, user:", req.user?._id);
            
            if (!req.user) {
                console.log("No user in request");
                return res.status(401).json({error: "Not authenticated"});
            }

            const user = await User.findById(req.user._id)
                .select("-password") // Exclude password from the response
                .lean(); // Convert to plain JavaScript object
            
            if (!user) {
                console.log("User not found in database:", req.user._id);
                return res.status(404).json({error: "User not found"});
            }
            
            console.log("User found:", user._id);
            return res.json(user);
        } catch (error) {
            console.error("Error fetching current user:", error);
            return res.status(500).json({error: "Internal server error"});
        }
    }
);

// This POST route will help to register a user
router.post("/register", async (req, res) => {
    try {
        // This code is run when the /register api is called as a POST request
        const {email, password, firstName, lastName, username} = req.body;

        // Basic validation
        if (!email || !password || !firstName || !username) {
            return res.status(400).json({error: "Please provide all required fields"});
        }

        // Step 2 : Does a user with this email already exist? If yes, we throw an error.
        const user = await User.findOne({email: email});
        if (user) {
            return res.status(403).json({error: "A user with this email already exists"});
        }

        // Step 3: Create a new user in the DB
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserData = {
            email,
            password: hashedPassword,
            firstName,
            lastName: lastName || "",
            username,
            likedSongs: [],
            likedPlaylists: [],
            subscribedArtists: []
        };

        const newUser = await User.create(newUserData);
        
        // Step 4: Create token
        const token = await getToken(email, newUser);

        // Step 5: Return the result to the user
        const userToReturn = {...newUser.toJSON(), token};
        delete userToReturn.password;
        return res.status(200).json(userToReturn);
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({error: "Registration failed", details: error.message});
    }
});

router.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body;
        console.log("Login attempt for email:", email);

        if (!email || !password) {
            return res.status(400).json({error: "Please provide email and password"});
        }

        // Find user by email
        const user = await User.findOne({email: email});
        if (!user) {
            return res.status(403).json({error: "Invalid credentials"});
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(403).json({error: "Invalid credentials"});
        }

        // Generate token
        const token = await getToken(email, user);
        
        // Create response object without password
        const userResponse = user.toObject();
        delete userResponse.password;
        
        console.log("Login successful for user:", user._id);
        
        // Return user data with token
        return res.status(200).json({
            ...userResponse,
            token
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({error: "Login failed", details: error.message});
    }
});

module.exports = router;