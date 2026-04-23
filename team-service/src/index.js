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
let teams, requests;

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

// Request to join a team via invite code
app.post("/teams/join", async (req, res) => {
  const { inviteCode, userId } = req.body;
  if (!inviteCode || !userId) return res.status(400).json({ message: "inviteCode and userId required" });
  const team = await teams.findOne({ inviteCode });
  if (!team) return res.status(404).json({ message: "Invalid invite code" });
  
  // check already a member
  const alreadyMember = team.members?.some((m) => m.userId === userId);
  if (alreadyMember) return res.status(409).json({ message: "Already a member" });

  // check if request already exists
  const existing = await requests.findOne({ teamId: team._id.toString(), userId, status: "pending" });
  if (existing) return res.status(409).json({ message: "Request already pending" });

  const requestDoc = {
    teamId: team._id.toString(),
    teamName: team.name,
    userId,
    status: "pending",
    createdAt: new Date()
  };
  await requests.insertOne(requestDoc);
  res.json({ message: "Join request sent", status: "pending" });
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
  // find pending requests for this user too
  const userRequests = await requests.find({ userId, status: "pending" }).toArray();
  res.json({ teams: rows, requests: userRequests });
});

// Get requests for a team (captain view)
app.get("/teams/:id/requests", async (req, res) => {
  const rows = await requests.find({ teamId: req.params.id, status: "pending" }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Approve / reject team join request
app.patch("/teams/:id/requests/:requestId", async (req, res) => {
  const { action } = req.body; // "approve" | "reject"
  const request = await requests.findOne({ _id: new ObjectId(req.params.requestId) });
  if (!request) return res.status(404).json({ message: "Request not found" });

  const newStatus = action === "approve" ? "approved" : "rejected";
  await requests.updateOne({ _id: request._id }, { $set: { status: newStatus, updatedAt: new Date() } });

  if (action === "approve") {
    await teams.updateOne(
      { _id: new ObjectId(request.teamId) },
      { $push: { members: { userId: request.userId, role: "member", joinedAt: new Date() } } }
    );
  }

  res.json({ message: `Request ${newStatus}` });
});

// Get single team
app.get("/teams/:id", async (req, res) => {
  try {
    const row = await teams.findOne({ _id: new ObjectId(req.params.id) });
    if (!row) return res.status(404).json({ message: "Team not found" });
    res.json(row);
  } catch { res.status(400).json({ message: "Invalid ID" }); }
});

mongo.connect().then(() => {
  const db = mongo.db("team_db");
  teams = db.collection("teams");
  requests = db.collection("requests");
  teams.createIndex({ inviteCode: 1 }, { unique: true }).catch(() => {});
  teams.createIndex({ captainId: 1 }).catch(() => {});
  teams.createIndex({ "members.userId": 1 }).catch(() => {});
  app.listen(PORT, () => console.log(`team-service running on ${PORT}`));
}).catch(console.error);
