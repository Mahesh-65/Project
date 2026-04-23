const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4004;
const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let tournaments;
let fixtures;
app.get("/health", (_, res) => res.json({ ok: true, service: "tournament-service" }));
app.post("/tournaments", async (req, res) => {
  const doc = { ...req.body, createdAt: new Date() };
  const r = await tournaments.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});
app.post("/tournaments/:id/fixtures/auto", async (req, res) => {
  const tournamentId = req.params.id;
  const teams = req.body.teams || [];
  const docs = [];
  for (let i = 0; i < teams.length; i += 2) if (teams[i + 1]) docs.push({ tournamentId, teamA: teams[i], teamB: teams[i + 1], status: "scheduled", scoreA: 0, scoreB: 0 });
  if (docs.length) await fixtures.insertMany(docs);
  res.json({ message: "Fixtures generated", count: docs.length });
});
app.get("/tournaments/:id/table", async (req, res) => {
  const rows = await fixtures.find({ tournamentId: req.params.id }).toArray();
  res.json({ tournamentId: req.params.id, fixtures: rows });
});
mongo.connect().then(() => {
  const db = mongo.db("tournament_db");
  tournaments = db.collection("tournaments");
  fixtures = db.collection("fixtures");
  app.listen(PORT, () => console.log(`tournament-service running on ${PORT}`));
}).catch(console.error);
