const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const authRoutes = require("./routes/auth");
const videoRoutes = require("./routes/video");
const userRoutes = require("./routes/userList");
const path = require("path");
const WebSocket = require("ws");
const User = require("./models/User");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://192.168.190.232:3000",
      "http://192.168.1.6:3000",
      "https://videostremer.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", videoRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const users = {};

wss.on("connection", (ws, req) => {
  console.log("WebSocket connection established");

  console.log("req.url", req.url);
  console.log("req.headers.host", req.headers.host);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get("user-id");

  if (userId) {
    ws.userId = userId;
    users[userId] = ws;

    User.findByIdAndUpdate(userId, { online: true }, { new: true }).exec();

    const updateActiveUsers = async () => {
      const activeUsers = await User.find({ online: true });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({ type: "activeUsers", users: activeUsers })
          );
        }
      });
    };

    updateActiveUsers();

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      console.log("Received message:", data);

      switch (data.type) {
        case "call":
          if (users[data.target]) {
            users[data.target].send(
              JSON.stringify({
                type: "incoming_call",
                from: data.userId,
                offer: data.offer,
                callType: data.callType,
              })
            );
          }
          break;
        case "answer":
          if (users[data.target]) {
            users[data.target].send(
              JSON.stringify({
                type: "call_accepted",
                from: data.userId,
                answer: data.answer,
              })
            );
          }
          break;
        case "reject":
          if (users[data.target]) {
            users[data.target].send(
              JSON.stringify({
                type: "call_rejected",
                from: data.userId,
              })
            );
          }
          break;
        case "candidate":
          if (users[data.target]) {
            users[data.target].send(JSON.stringify(data));
          }
          break;
        case "end":
          if (users[data.target]) {
            users[data.target].send(JSON.stringify({ type: "end" }));
          }
          break;
        default:
          console.log("Unknown message type:", data.type);
          break;
      }
    });

    ws.on("close", async () => {
      console.log("WebSocket connection closed");
      if (ws.userId) {
        delete users[ws.userId];
        await User.findByIdAndUpdate(
          ws.userId,
          { online: false },
          { new: true }
        ).exec();
        const updateActiveUsers = async () => {
          const activeUsers = await User.find({ online: true });
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({ type: "activeUsers", users: activeUsers })
              );
            }
          });
        };
        updateActiveUsers();
      }
    });
  } else {
    ws.close();
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
