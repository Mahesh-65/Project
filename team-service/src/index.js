const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4003;
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let teams;

app.get("/health", (_, res) => res.json({ ok: true, service: "team-service" }));

// Create team — captainId is the owner
app.post("/teams", async (req, res) => {
  const { name, captainId } = req.body;
  if (!name || !captainId) return res.status(400).json({ message: "name and captainId required" });
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const doc = {
    name, captainId, inviteCode,
    members: [{ userId: captainId, role: "captain", joinedAt: new Date() }],
    wins: 0, losses: 0,
    createdAt: new Date(),
  };
  const r = await teams.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

// Join a team via invite code
app.post("/teams/join", async (req, res) => {
  const { inviteCode, userId } = req.body;
  if (!inviteCode || !userId) return res.status(400).json({ message: "inviteCode and userId required" });
  const team = await teams.findOne({ inviteCode });
  if (!team) return res.status(404).json({ message: "Invalid invite code" });
  // check already a member
  const alreadyMember = team.members?.some((m) => m.userId === userId);
  if (alreadyMember) return res.status(409).json({ message: "Already a member" });
  await teams.updateOne(
    { _id: team._id },
    { $push: { members: { userId, role: "member", joinedAt: new Date() } } }
  );
  res.json({ message: "Joined team", teamId: team._id, teamName: team.name });
});

// Teams I captain (created)
app.get("/teams/mine", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await teams.find({ captainId: userId }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Teams I'm a member of
app.get("/teams/joined", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await teams.find({ "members.userId": userId }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Get single team
app.get("/teams/:id", async (req, res) => {
  try {
    const row = await teams.findOne({ _id: new ObjectId(req.params.id) });
    if (!row) return res.status(404).json({ message: "Team not found" });
    res.json(row);
  } catch { res.status(400).json({ message: "Invalid ID" }); }
});

// Remove a member (captain only — no server-side auth check here, handle in frontend)
app.delete("/teams/:id/members/:userId", async (req, res) => {
  await teams.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $pull: { members: { userId: req.params.userId } } }
  );
  res.json({ message: "Member removed" });
});

mongo.connect().then(() => {
  teams = mongo.db("team_db").collection("teams");
  teams.createIndex({ inviteCode: 1 }, { unique: true }).catch(() => {});
  teams.createIndex({ captainId: 1 }).catch(() => {});
  teams.createIndex({ "members.userId": 1 }).catch(() => {});
  app.listen(PORT, () => console.log(`team-service running on ${PORT}`));
}).catch(console.error);
