const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
const PORT = process.env.PORT || 4004;
const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let tournaments, fixtures, registrations;

app.get("/health", (_, res) => res.json({ ok: true, service: "tournament-service" }));

// Create tournament — store createdBy
app.post("/tournaments", async (req, res) => {
  const doc = { ...req.body, createdAt: new Date() };
  const r = await tournaments.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

// All tournaments
app.get("/tournaments", async (_, res) => {
  const rows = await tournaments.find({}).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Tournaments I created
app.get("/tournaments/mine", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await tournaments.find({ createdBy: userId }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Tournaments I registered for
app.get("/tournaments/joined", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const regs = await registrations.find({ userId }).toArray();
  const ids = regs.map((r) => { try { return new ObjectId(r.tournamentId); } catch { return null; } }).filter(Boolean);
  const rows = await tournaments.find({ _id: { $in: ids } }).toArray();
  const statusMap = Object.fromEntries(regs.map((r) => [r.tournamentId, r.status]));
  res.json(rows.map((t) => ({ ...t, regStatus: statusMap[t._id.toString()] || "registered" })));
});

// Register for tournament
app.post("/tournaments/:id/register", async (req, res) => {
  const { userId, teamId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const existing = await registrations.findOne({ tournamentId: req.params.id, userId });
  if (existing) return res.status(409).json({ message: "Already registered", status: existing.status });
  const doc = { tournamentId: req.params.id, userId, teamId: teamId || null, status: "pending", createdAt: new Date() };
  const r = await registrations.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

// Registrations for a tournament (creator view)
app.get("/tournaments/:id/registrations", async (req, res) => {
  const rows = await registrations.find({ tournamentId: req.params.id }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Approve / reject registration
app.patch("/tournaments/:id/registrations/:userId", async (req, res) => {
  const { action } = req.body; // "approve" | "reject"
  const newStatus = action === "approve" ? "approved" : "rejected";
  await registrations.updateOne(
    { tournamentId: req.params.id, userId: req.params.userId },
    { $set: { status: newStatus, updatedAt: new Date() } }
  );
  res.json({ message: `Registration ${newStatus}` });
});

// Auto-generate fixtures
app.post("/tournaments/:id/fixtures/auto", async (req, res) => {
  const tournamentId = req.params.id;
  const teamList = req.body.teams || [];
  const docs = [];
  for (let i = 0; i < teamList.length; i += 2) {
    if (teamList[i + 1]) {
      docs.push({ tournamentId, teamA: teamList[i], teamB: teamList[i + 1], status: "scheduled", scoreA: 0, scoreB: 0, createdAt: new Date() });
    }
  }
  if (docs.length) await fixtures.insertMany(docs);
  res.json({ message: "Fixtures generated", count: docs.length });
});

// Get fixture table
app.get("/tournaments/:id/table", async (req, res) => {
  const rows = await fixtures.find({ tournamentId: req.params.id }).toArray();
  res.json({ tournamentId: req.params.id, fixtures: rows });
});

mongo.connect().then(() => {
  const db = mongo.db("tournament_db");
  tournaments = db.collection("tournaments");
  fixtures = db.collection("fixtures");
  registrations = db.collection("registrations");
  tournaments.createIndex({ createdBy: 1 }).catch(() => {});
  registrations.createIndex({ tournamentId: 1, userId: 1 }, { unique: true }).catch(() => {});
  app.listen(PORT, () => console.log(`tournament-service running on ${PORT}`));
}).catch(console.error);
