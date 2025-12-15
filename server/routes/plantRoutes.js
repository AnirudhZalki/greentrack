const router = require("express").Router();
const Plantation = require("../models/Plantation");
const User = require("../models/User");
const auth = require("../middleware/auth");
const checkBadges = require("../utils/badgeSystem"); 
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer"); 

// --- EMAIL CONFIGURATION (Using your credentials) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'zalkianirudh@gmail.com', // Your Email
        pass: 'enbu qpsh wuut buhr'     // Your App Password
    }
});

// --- Upload Config ---
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

// --- 1. ADD TREE ---
router.post("/add", auth, upload.single("photo"), async (req, res) => {
    try {
        const newPlant = new Plantation({
            userId: req.user.id,
            type: 'tree',
            treeName: req.body.treeName,
            photo: req.file ? req.file.filename : "",
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            verified: false 
        });
        await newPlant.save();

        const pointsAwarded = 10;
        await User.findByIdAndUpdate(req.user.id, {
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
        });

        const newBadge = await checkBadges(req.user.id);
        
        res.json({ success: true, message: "Plant added successfully!", newBadge: newBadge });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// --- 2. REPORT FIRE ---
router.post("/report-fire", auth, async (req, res) => {
    try {
        const newFire = new Plantation({
            userId: req.user.id,
            type: 'fire',
            description: req.body.description,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            verified: false 
        });
        await newFire.save();
        res.json({ success: true, message: "Fire report submitted! Waiting for verification." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// --- 3. GET PENDING (For Admin) ---
router.get("/pending", auth, async (req, res) => {
    try {
        const pending = await Plantation.find({ verified: false }).populate("userId", "name"); 
        res.json(pending);
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
});

// --- 4. APPROVE ITEM & SEND EMAIL ---
router.put("/approve/:id", auth, async (req, res) => {
    try {
        const item = await Plantation.findById(req.params.id);
        if(!item) return res.status(404).json({ message: "Item not found" });

        item.verified = true;
        await item.save();

        // IF FIRE -> SEND EMAIL
        if (item.type === 'fire') {
            const mailOptions = {
                from: '"GreenTrack Alert System" <no-reply@greentrack.com>',
                to: 'zalkianirudh@gmail.com',
                subject: '🔥 CRITICAL FIRE ALERT: Verified by Admin',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e74c3c; border-radius: 10px;">
                        <h2 style="color: #e74c3c;">🔥 Fire Alert Verified</h2>
                        <p><strong>Status:</strong> Validated by GreenTrack Admin.</p>
                        <hr>
                        <p><strong>Description:</strong> ${item.description}</p>
                        <p><strong>Coordinates:</strong> ${item.latitude}, ${item.longitude}</p>
                        <p><strong>Reported At:</strong> ${new Date().toLocaleString()}</p>
                        <br>
                        <a href="https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}" 
                           style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                           View on Google Maps
                        </a>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log('Error sending email:', error);
                else console.log('Fire Alert Email sent: ' + info.response);
            });
        }
        res.json({ success: true, message: "Approved successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error" });
    }
});

// --- 5. GET ALL VERIFIED (For Map) ---
router.get("/all", async (req, res) => {
    try {
        const plants = await Plantation.find({ verified: true }).populate("userId", "name");
        res.json(plants);
    } catch (err) {
        res.status(500).json({ message: "Error loading data" });
    }
});

// --- 6. DELETE / EXTINGUISH (New Route) ---
// This route is required for the "Mark Extinguished" button to work
router.delete("/delete/:id", auth, async (req, res) => {
    try {
        await Plantation.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Item removed/extinguished" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting item" });
    }
});

module.exports = router;