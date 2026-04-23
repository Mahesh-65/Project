const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
const PORT = process.env.PORT || 4006;
const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let products, orders;

app.get("/health", (_, res) => res.json({ ok: true, service: "shop-service" }));

// Add product — store createdBy
app.post("/products", async (req, res) => {
  const doc = { ...req.body, createdAt: new Date() };
  const r = await products.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

// All products
app.get("/products", async (_, res) =>
  res.json(await products.find({}).sort({ createdAt: -1 }).toArray())
);

// Products I listed
app.get("/products/mine", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await products.find({ createdBy: userId }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Checkout / create order — store userId
app.post("/checkout", async (req, res) => {
  const { userId, items = [] } = req.body;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const total = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0);
  const doc = {
    userId, items, total,
    status: "created",
    trackingId: `TRK-${Date.now()}`,
    invoiceNumber: `INV-${Date.now()}`,
    createdAt: new Date(),
  };
  const r = await orders.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

// My orders
app.get("/orders/mine", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const rows = await orders.find({ userId }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// All orders (admin/seller view for products I listed)
app.get("/orders/for-seller", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const myProducts = await products.find({ createdBy: userId }, { projection: { _id: 1, name: 1 } }).toArray();
  const myProductIds = myProducts.map((p) => p._id.toString());
  // find orders containing any of my product IDs
  const rows = await orders.find({ "items.productId": { $in: myProductIds } }).sort({ createdAt: -1 }).toArray();
  res.json(rows);
});

// Update order status
app.patch("/orders/:id", async (req, res) => {
  const { status } = req.body;
  await orders.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status, updatedAt: new Date() } });
  res.json({ message: "Order updated" });
});

mongo.connect().then(() => {
  const db = mongo.db("shop_db");
  products = db.collection("products");
  orders   = db.collection("orders");
  products.createIndex({ createdBy: 1 }).catch(() => {});
  orders.createIndex({ userId: 1 }).catch(() => {});
  app.listen(PORT, () => console.log(`shop-service running on ${PORT}`));
}).catch(console.error);
