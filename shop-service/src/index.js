const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4006;
const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let products;
let orders;
app.get("/health", (_, res) => res.json({ ok: true, service: "shop-service" }));
app.post("/products", async (req, res) => {
  const doc = { ...req.body, createdAt: new Date() };
  const r = await products.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});
app.get("/products", async (_, res) => res.json(await products.find({}).sort({ createdAt: -1 }).toArray()));
app.post("/checkout", async (req, res) => {
  const { userId, items = [] } = req.body;
  const total = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0);
  const doc = { userId, items, total, status: "created", trackingId: `TRK-${Date.now()}`, createdAt: new Date() };
  const r = await orders.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc, invoiceNumber: `INV-${Date.now()}` });
});
mongo.connect().then(() => {
  const db = mongo.db("shop_db");
  products = db.collection("products");
  orders = db.collection("orders");
  app.listen(PORT, () => console.log(`shop-service running on ${PORT}`));
}).catch(console.error);
