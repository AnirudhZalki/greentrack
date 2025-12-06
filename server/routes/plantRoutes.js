const router = require("express").Router();
const Plantation = require("../models/Plantation");
const User = require("../models/User");
const auth = require("../middleware/auth");
const checkBadges = require("../utils/badgeSystem"); // Ensure badgeSystem.js is in 'utils' or 'models' folder
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Upload Config ---
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

// --- ADD PLANT ---
router.post("/add", auth, upload.single("photo"), async (req, res) => {
    try {
        // 1. Save Plant
        const newPlant = new Plantation({
            userId: req.user.id,
            treeName: req.body.treeName,
            photo: req.file ? req.file.filename : "",
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            verified: false 
        });
        await newPlant.save();

        // 2. Award Points & Update History
        const pointsAwarded = 10;
        const user = await User.findByIdAndUpdate(req.user.id, {
            $inc: { treesPlanted: 1, points: pointsAwarded },
            $push: { 
                history: { 
                    $each: [{
                        action: `Planted: ${req.body.treeName}`,
                        date: new Date(),
                        points: `+${pointsAwarded}`
                    }],
                    $position: 0 
                }
            }
        }, { new: true }); // Return updated user

        // 3. Check for New Badges
        // We move badgeSystem.js to a utils folder or keep it in models
        // Assuming checkBadges returns the name of the new badge or null
        const newBadge = await checkBadges(req.user.id);
        
        res.json({ 
            success: true, 
            message: "Plant added successfully!",
            newBadge: newBadge // Send this to frontend if you want to show a popup
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 1. Get Pending Plants (Admin Only ideally)
router.get("/pending", auth, async (req, res) => {
    try {
        const pending = await Plantation.find({ verified: false });
        res.json(pending);
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
});

// 2. Approve Plant
router.put("/approve/:id", auth, async (req, res) => {
    try {
        await Plantation.findByIdAndUpdate(req.params.id, { verified: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
});

// --- GET ALL (For Map) ---
router.get("/all", async (req, res) => {
    try {
        const plants = await Plantation.find();
        res.json(plants);
    } catch (err) {
        res.status(500).json({ message: "Error loading plants" });
    }
});

module.exports = router;