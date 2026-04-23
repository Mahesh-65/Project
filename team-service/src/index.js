const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4003;
app.use(cors());
app.use(express.json());

const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let teams;

app.get("/health", (_, res) => res.json({ ok: true, service: "team-service" }));
app.post("/teams", async (req, res) => {
  const { name, captainId } = req.body;
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const doc = { name, captainId, inviteCode, members: [captainId], wins: 0, losses: 0, createdAt: new Date() };
  const r = await teams.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});
app.post("/teams/join", async (req, res) => {
  const { inviteCode, userId } = req.body;
  const team = await teams.findOne({ inviteCode });
  if (!team) return res.status(404).json({ message: "Invalid code" });
  await teams.updateOne({ _id: team._id }, { $addToSet: { members: userId } });
  res.json({ message: "Joined team", teamId: team._id });
});
app.get("/teams/:id", async (req, res) => {
  const row = await teams.findOne({ _id: new ObjectId(req.params.id) });
  res.json(row);
});

mongo.connect().then(() => {
  teams = mongo.db("team_db").collection("teams");
  teams.createIndex({ inviteCode: 1 }, { unique: true }).catch(() => {});
  app.listen(PORT, () => console.log(`team-service running on ${PORT}`));
}).catch(console.error);
