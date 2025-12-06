const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", () => {
    console.log("Simulator Connected");
    
    // Simulate a fire every 5 seconds
    setInterval(() => {
        const alert = {
            lat: 20.59 + (Math.random() * 0.1), 
            lng: 78.96 + (Math.random() * 0.1),
            temp: 45 + Math.floor(Math.random() * 10)
        };
        client.publish("greentrack/forest/fire", JSON.stringify(alert));
        console.log("Sent Alert:", alert);
    }, 5000);
});