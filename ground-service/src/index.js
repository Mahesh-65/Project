const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
const PORT = process.env.PORT || 4005;
const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let grounds, bookings;

app.get("/health", (_, res) => res.json({ ok: true, service: "ground-service" }));

// List a ground — store createdBy / ownerId
app.post("/grounds", async (req, res) => {
  const doc = { ...req.body, createdAt: new Date() };
  const r = await grounds.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

// Search grounds
app.get("/grounds/search", async (req, res) => {
  const q = String(req.query.q || "");
  const rows = await grounds.find({
    $or: [
      { name: { $regex: q, $options: "i" } },
      { area: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
    ],
  }).toArray();
  res.json(rows);
});

// Grounds I own / listed
app.get("/grounds/mine", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await grounds.find({ ownerId: userId }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// All bookings for grounds I own
app.get("/grounds/mine/bookings", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const myGrounds = await grounds.find({ ownerId: userId }, { projection: { _id: 1 } }).toArray();
  const groundIds = myGrounds.map((g) => g._id.toString());
  const rows = await bookings.find({ groundId: { $in: groundIds } }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Book a ground — store userId
app.post("/bookings", async (req, res) => {
  const doc = { ...req.body, paymentStatus: "pending", status: "pending", createdAt: new Date() };
  const r = await bookings.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

// My bookings (as a user who booked)
app.get("/bookings/mine", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await bookings.find({ userId }).sort({ createdAt: -1 }).toArray();
  // enrich with ground name
  const groundIds = [...new Set(rows.map((b) => b.groundId).filter(Boolean))];
  const groundDocs = await grounds.find({
    _id: { $in: groundIds.map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) }
  }).toArray();
  const groundMap = Object.fromEntries(groundDocs.map((g) => [g._id.toString(), g]));
  res.json(rows.map((b) => ({ ...b, ground: groundMap[b.groundId] || null })));
});

// Approve / reject a booking (ground owner)
app.patch("/bookings/:id", async (req, res) => {
  const { status, paymentStatus } = req.body;
  const update = { updatedAt: new Date() };
  if (status) update.status = status;
  if (paymentStatus) update.paymentStatus = paymentStatus;
  await bookings.updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
  res.json({ message: "Booking updated" });
});

mongo.connect().then(() => {
  const db = mongo.db("ground_db");
  grounds  = db.collection("grounds");
  bookings = db.collection("bookings");
  grounds.createIndex({ ownerId: 1 }).catch(() => {});
  bookings.createIndex({ userId: 1 }).catch(() => {});
  bookings.createIndex({ groundId: 1 }).catch(() => {});
  app.listen(PORT, () => console.log(`ground-service running on ${PORT}`));
}).catch(console.error);
