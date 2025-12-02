const mongoose = require("mongoose");

const PlantationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  treeName: String,
  photo: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("Plantation", PlantationSchema);
