const mongoose = require("mongoose");

const PlantationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // New Fields for Fire Reporting
  type: { type: String, enum: ['tree', 'fire'], default: 'tree' }, 
  description: String, // e.g., "Huge smoke seen near highway"

  treeName: String, // Only used if type is 'tree'
  photo: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("Plantation", PlantationSchema);