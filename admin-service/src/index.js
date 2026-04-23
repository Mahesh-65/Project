const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4007;
const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let reports;
app.get("/health", (_, res) => res.json({ ok: true, service: "admin-service" }));
app.post("/admin/login", async (req, res) => res.json({ message: "Admin login successful", admin: req.body.email }));
app.get("/admin/dashboard", async (_, res) => {
  const openReports = await reports.countDocuments({ status: { $in: ["open", null] } });
  res.json({ activeUsers: 1248, activeCities: 39, popularSports: ["football", "cricket", "badminton"], openReports, revenue: 128400 });
});
app.post("/admin/reports", async (req, res) => {
  const doc = { type: req.body.type, payload: req.body.payload || {}, status: "open", createdAt: new Date() };
  const r = await reports.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});
mongo.connect().then(() => {
  reports = mongo.db("admin_db").collection("reports");
  app.listen(PORT, () => console.log(`admin-service running on ${PORT}`));
}).catch(console.error);
