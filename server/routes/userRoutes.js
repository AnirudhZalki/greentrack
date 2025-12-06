const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// @route   GET /auth/profile
// @desc    Get current user's profile data
router.get("/profile", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route   PUT /auth/update
// @desc    Update Name or Email
router.put("/update", auth, async (req, res) => {
    try {
        const { name, email } = req.body;
        
        // Find and update
        await User.findByIdAndUpdate(req.user.id, { name, email });

        res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Update failed" });
    }
});

// @route   GET /auth/leaderboard
// @desc    Get top users sorted by points
router.get("/leaderboard", async (req, res) => {
    try {
        const users = await User.find()
            .select("name points badge") // Fetch minimal data
            .sort({ points: -1 })        // Highest points first
            .limit(10);                  // Top 10 only

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Leaderboard Error" });
    }
});

module.exports = router;