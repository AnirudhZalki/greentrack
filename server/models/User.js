const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  points: { type: Number, default: 0 },
  badges: [
    {
      badgeName: String,
      dateEarned: Date
    }
  ]
});

module.exports = mongoose.model("User", UserSchema);
