const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

const clients = new Set();
const adminClients = new Set();

wss.on("connection", (ws, req) => {
  const isAdmin = req.url === "/admin";
  console.log(`${isAdmin ? "Admin" : "Client"} connected`);

  if (isAdmin) {
    adminClients.add(ws);
  } else {
    clients.add(ws);
  }

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "location") {
        console.log(
          `Received location from ${data.userId}: Latitude ${data.latitude}, Longitude ${data.longitude}`
        );
        // Broadcast the location to all connected admin clients
        adminClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`${isAdmin ? "Admin" : "Client"} disconnected`);
    if (isAdmin) {
      adminClients.delete(ws);
    } else {
      clients.delete(ws);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
