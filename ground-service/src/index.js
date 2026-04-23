const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4005;
const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let grounds;
let bookings;
app.get("/health", (_, res) => res.json({ ok: true, service: "ground-service" }));
app.post("/grounds", async (req, res) => {
  const doc = { ...req.body, createdAt: new Date() };
  const r = await grounds.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});
app.get("/grounds/search", async (req, res) => {
  const q = String(req.query.q || "");
  const rows = await grounds.find({ $or: [{ name: { $regex: q, $options: "i" } }, { area: { $regex: q, $options: "i" } }] }).toArray();
  res.json(rows);
});
app.post("/bookings", async (req, res) => {
  const doc = { ...req.body, paymentStatus: "pending", createdAt: new Date() };
  const r = await bookings.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});
mongo.connect().then(() => {
  const db = mongo.db("ground_db");
  grounds = db.collection("grounds");
  bookings = db.collection("bookings");
  app.listen(PORT, () => console.log(`ground-service running on ${PORT}`));
}).catch(console.error);
