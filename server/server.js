const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Force dotenv to load from the same folder as this file
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use('/uploads', express.static("server/uploads"));

// IMPORT ROUTES
const authRoutes = require("./routes/authRoutes");
const plantRoutes = require("./routes/plantRoutes");

// USE ROUTES
app.use("/auth", authRoutes);
app.use("/plant", plantRoutes);

// DEBUG
console.log("MONGO_URL =", process.env.MONGO_URL);

// DB CONNECT
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("GreenTrack Server Running...");
});

app.listen(3000, () => console.log("Server running on port 3000"));
