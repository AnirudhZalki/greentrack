const mqtt = require("mqtt");
const express = require("express");
const app = express();

// Start WebSocket server to push alerts to frontend
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: { origin: "*" }
});

httpServer.listen(4000, () => console.log("WS Server running on port 4000"));

// MQTT Connection
const client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("forest/fire/alerts");
});

client.on("message", (topic, msg) => {
  const alert = JSON.parse(msg.toString());
  console.log("🔥 Fire Alert Received:", alert);

  // PUSH to frontend via WebSocket
  io.emit("fire_alert", alert);
});
