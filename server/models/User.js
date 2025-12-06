const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // --- STATS ---
  points: { type: Number, default: 0 },
  treesPlanted: { type: Number, default: 0 }, 
  
  // "badge" is the main displayed title (e.g. "Forest King")
  badge: { type: String, default: "Eco Rookie" },

  // "badges" is the collection of all earned awards
  badges: [
    {
        badgeName: String,
        dateEarned: { type: Date, default: Date.now }
    }
  ],

  // --- ACTIVITY LOG ---
  history: [
    {
      action: String, // e.g., "Planted a Mango Tree"
      date: { type: Date, default: Date.now },
      points: String  // e.g., "+10"
    }
  ],
  
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);