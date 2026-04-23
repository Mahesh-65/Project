const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("redis");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4002;
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const redis = createClient({ url: process.env.REDIS_URL || "redis://redis:6379" });
redis.connect().catch(console.error);

const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let matches;
let chats;

app.get("/health", (_, res) => res.json({ ok: true, service: "player-service" }));

app.get("/players/search", async (req, res) => {
  const { sport = "", location = "", skillLevel = "" } = req.query;
  const key = `search:${sport}:${location}:${skillLevel}`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));
  const payload = { message: "Player discovery index placeholder", filters: req.query };
  await redis.setEx(key, 60, JSON.stringify(payload));
  res.json(payload);
});

app.post("/matches", async (req, res) => {
  const doc = { ...req.body, createdAt: new Date() };
  const result = await matches.insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
});

app.get("/matches", async (_, res) => {
  const rows = await matches.find({}).sort({ startsAt: 1 }).toArray();
  res.json(rows);
});

app.post("/matches/:id/join", async (req, res) => {
  const matchId = new ObjectId(req.params.id);
  const { userId } = req.body;
  const match = await matches.findOne({ _id: matchId });
  if (!match) return res.status(404).json({ message: "Match not found" });
  const joinedCount = await chats.countDocuments({ matchId: matchId.toString(), type: "join", status: "joined" });
  const status = joinedCount >= Number(match.totalSlots || 0) ? "waiting" : "joined";
  const joinEvent = { matchId: matchId.toString(), userId, type: "join", status, createdAt: new Date() };
  await chats.insertOne(joinEvent);
  res.json(joinEvent);
});

app.post("/matches/:id/chat", async (req, res) => {
  const doc = { matchId: req.params.id, ...req.body, type: "chat", createdAt: new Date() };
  await chats.insertOne(doc);
  res.status(201).json({ message: "Sent" });
});

mongo.connect().then(() => {
  const db = mongo.db("player_db");
  matches = db.collection("matches");
  chats = db.collection("events");
  app.listen(PORT, () => console.log(`player-service running on ${PORT}`));
}).catch(console.error);
