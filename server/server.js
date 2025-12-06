const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http"); 
const { Server } = require("socket.io"); 
const mqtt = require("mqtt"); 
const path = require("path");

require("dotenv").config({ path: __dirname + "/.env" });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Serve static frontend files (dashboard, map, etc.)
app.use(express.static("public")); 
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// --- Routes ---
const authRoutes = require("./routes/authRoutes");
const plantRoutes = require("./routes/plantRoutes");
const userRoutes = require("./routes/userRoutes"); // Import User Routes

// Mount Routes
app.use("/auth", authRoutes); // Login & Register
app.use("/auth", userRoutes); // Profile & Leaderboard (Merged under /auth for frontend compatibility)
app.use("/plant", plantRoutes); // Plantation Actions

// --- MQTT (Fire Detection) ---
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com"); 

mqttClient.on("connect", () => {
    console.log("✅ MQTT Connected (Sensors Online)");
    mqttClient.subscribe("greentrack/forest/fire");
});

mqttClient.on("message", (topic, message) => {
    const data = JSON.parse(message.toString());
    console.log("🔥 FIRE DETECTED:", data);
    io.emit("fire_alert", data);
});

// --- Database & Server ---
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

server.listen(3000, () => console.log("🚀 Server running on port 3000"));