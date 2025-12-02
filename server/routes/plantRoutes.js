const router = require("express").Router();
const Plantation = require("../models/Plantation");
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer config (stores images inside /server/uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });


// ================================
// ADD NEW PLANTATION
// ================================
router.post("/add", auth, upload.single("photo"), async (req, res) => {
    try {
        console.log("📥 Incoming Plantation Request:");
        console.log("BODY =", req.body);
        console.log("FILE =", req.file);
        console.log("USER =", req.user);

        // Validate location
        if (!req.body.latitude || !req.body.longitude) {
            return res.status(400).json({ success: false, message: "Location not selected" });
        }

        // Validate file
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Photo is required" });
        }

        const plant = new Plantation({
            userId: req.user.id,
            treeName: req.body.treeName,
            photo: req.file.filename,
            latitude: parseFloat(req.body.latitude),
            longitude: parseFloat(req.body.longitude)
        });

        await plant.save();

        // Reward points
        await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });

        return res.json({ success: true, message: "Plantation saved successfully!" });

    } catch (error) {
        console.error("❌ Error saving plantation:", error);
        res.status(500).json({ success: false, message: "Server error", error });
    }
});


// ================================
// GET ALL PLANTATIONS
// ================================
router.get("/all", async (req, res) => {
    try {
        const plants = await Plantation.find().sort({ timestamp: -1 });
        res.json(plants);
    } catch (error) {
        console.error("❌ Error fetching plants:", error);
        res.status(500).json({ message: "Error loading plants" });
    }
});


module.exports = router;
