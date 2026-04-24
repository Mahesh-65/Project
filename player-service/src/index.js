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
let matches, events, lfp;

app.get("/health", (_, res) => res.json({ ok: true, service: "player-service" }));

// Player discovery
app.get("/players/search", async (req, res) => {
  const { sport = "", location = "", skillLevel = "" } = req.query;
  const key = `search:${sport}:${location}:${skillLevel}`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));
  const payload = { message: "Player discovery index placeholder", filters: req.query };
  await redis.setEx(key, 60, JSON.stringify(payload));
  res.json(payload);
});

// ── MATCHES ──────────────────────────────────────────────

// All matches
app.get("/matches", async (_, res) => {
  const rows = await matches.find({}).sort({ startsAt: 1 }).toArray();
  res.json(rows);
});

// Matches I created
app.get("/matches/mine", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await matches.find({ createdBy: userId }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Matches I joined
app.get("/matches/joined", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const joinEvents = await events.find({ userId, type: "join" }).toArray();
  const matchIds = [...new Set(joinEvents.map((e) => e.matchId))];
  const rows = await matches.find({ _id: { $in: matchIds.map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) } }).toArray();
  // attach join status to each match
  const statusMap = Object.fromEntries(joinEvents.map((e) => [e.matchId, e.status]));
  res.json(rows.map((m) => ({ ...m, joinStatus: statusMap[m._id.toString()] || "joined" })));
});

// Create match — store createdBy
app.post("/matches", async (req, res) => {
  const { createdBy } = req.body;
  const doc = { ...req.body, createdBy: createdBy || null, createdAt: new Date() };
  const result = await matches.insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
});

// Join requests on a match (for the creator)
app.get("/matches/:id/requests", async (req, res) => {
  const rows = await events.find({ matchId: req.params.id, type: "join" }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Join a match
app.post("/matches/:id/join", async (req, res) => {
  const matchId = new ObjectId(req.params.id);
  const { userId } = req.body;
  const match = await matches.findOne({ _id: matchId });
  if (!match) return res.status(404).json({ message: "Match not found" });
  // prevent duplicate join
  const existing = await events.findOne({ matchId: matchId.toString(), userId, type: "join" });
  if (existing) return res.status(409).json({ message: "Already joined", status: existing.status });
  const joinedCount = await events.countDocuments({ matchId: matchId.toString(), type: "join", status: "joined" });
  const status = joinedCount >= Number(match.totalSlots || 0) ? "waiting" : "joined";
  const joinEvent = { matchId: matchId.toString(), userId, type: "join", status, createdAt: new Date() };
  await events.insertOne(joinEvent);
  res.json(joinEvent);
});

// Approve/reject a join request (creator only)
app.patch("/matches/:matchId/requests/:userId", async (req, res) => {
  const { action } = req.body; // "approve" | "reject"
  const newStatus = action === "approve" ? "joined" : "rejected";
  await events.updateOne(
    { matchId: req.params.matchId, userId: req.params.userId, type: "join" },
    { $set: { status: newStatus, updatedAt: new Date() } }
  );
  res.json({ message: `Request ${newStatus}` });
});

// Chat
app.post("/matches/:id/chat", async (req, res) => {
  const doc = { matchId: req.params.id, ...req.body, type: "chat", createdAt: new Date() };
  await events.insertOne(doc);
  res.status(201).json({ message: "Sent" });
});

// ── LFP (LOOKING FOR PLAYERS) ─────────────────────────

app.post("/lfp", async (req, res) => {
  const { title, sport, location, playersNeeded, startsIn, createdBy } = req.body;
  if (!title || !sport || !createdBy) return res.status(400).json({ message: "Missing required fields" });
  const doc = {
    title, sport, location: location || "TBD",
    playersNeeded: Number(playersNeeded) || 1,
    startsIn: startsIn || "ASAP",
    createdBy,
    createdAt: new Date(),
    status: "active"
  };
  const r = await lfp.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

app.get("/lfp", async (_, res) => {
  const rows = await lfp.find({ status: "active" }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

app.patch("/lfp/:id/fill", async (req, res) => {
  await lfp.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: "filled", updatedAt: new Date() } });
  res.json({ message: "Marked as filled" });
});

mongo.connect().then(() => {
  const db = mongo.db("player_db");
  matches = db.collection("matches");
  events  = db.collection("events");
  lfp     = db.collection("lfp");
  matches.createIndex({ createdBy: 1 }).catch(() => {});
  events.createIndex({ matchId: 1, userId: 1, type: 1 }).catch(() => {});
  lfp.createIndex({ createdAt: -1 }).catch(() => {});
  app.listen(PORT, () => console.log(`player-service running on ${PORT}`));
}).catch(console.error);
