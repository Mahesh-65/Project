const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4001;

const mongoClient = new MongoClient(process.env.MONGO_URL || "mongodb://mongo:27017");
let users, notifications;

const redisClient = createClient({ url: process.env.REDIS_URL || "redis://redis:6379" });
redisClient.connect().catch(console.error);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || "change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

const authRequired = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
  next();
};

app.get("/health", (_, res) => res.json({ ok: true, service: "user-service" }));

app.get("/notifications", authRequired, async (req, res) => {
  const rows = await notifications.find({ userId: req.session.userId }).sort({ createdAt: -1 }).limit(20).toArray();
  res.json(rows);
});

app.post("/notifications", async (req, res) => {
  const { userId, title, message, type } = req.body;
  const doc = { userId, title, message, type, read: false, createdAt: new Date() };
  await notifications.insertOne(doc);
  res.status(201).json(doc);
});

app.patch("/notifications/read-all", authRequired, async (req, res) => {
  await notifications.updateMany({ userId: req.session.userId }, { $set: { read: true } });
  res.json({ message: "Done" });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, username, gender, age, interestedSports } = req.body;
    if (!email || !password || !fullName || !username) return res.status(400).json({ message: "Missing required fields" });
    
    const emailExists = await users.findOne({ email });
    if (emailExists) return res.status(409).json({ message: "Email already exists" });
    
    const userExists = await users.findOne({ username });
    if (userExists) return res.status(409).json({ message: "Username already taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const doc = {
      email, username, passwordHash, fullName, gender, 
      age: Number(age) || null,
      role: "user",
      city: "", 
      preferredSports: interestedSports || [], 
      bio: "", 
      skillLevel: "beginner",
      availability: [], 
      notificationPreferences: { email: true, push: true },
      createdAt: new Date()
    };
    const result = await users.insertOne(doc);
    req.session.userId = result.insertedId.toString();
    res.status(201).json({ id: req.session.userId, email, username, fullName: doc.fullName, role: doc.role });
  } catch (error) {
    res.status(400).json({ message: "Registration failed", error: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await users.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });
  req.session.userId = user._id.toString();
  res.json({ id: user._id, email: user.email, fullName: user.fullName, role: user.role || "user" });
});

app.post("/auth/logout", (req, res) => req.session.destroy(() => res.json({ message: "Logged out" })));
app.post("/auth/forgot-password", (_, res) => res.json({ message: "If the account exists, a reset email has been queued." }));

app.post("/auth/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  const hash = await bcrypt.hash(newPassword, 10);
  await users.updateOne({ email }, { $set: { passwordHash: hash } });
  res.json({ message: "Password reset successful" });
});

app.get("/users/me", authRequired, async (req, res) => {
  const user = await users.findOne({ _id: new ObjectId(req.session.userId) }, { projection: { passwordHash: 0 } });
  if (user && !user.role) {
    user.role = "user";
  }
  res.json(user);
});

app.put("/users/me", authRequired, async (req, res) => {
  const { city, preferredSports, bio, skillLevel, availability, notificationPreferences } = req.body;
  await users.updateOne({ _id: new ObjectId(req.session.userId) }, {
    $set: {
      city: city || "",
      preferredSports: preferredSports || [],
      bio: bio || "",
      skillLevel: skillLevel || "beginner",
      availability: availability || [],
      notificationPreferences: notificationPreferences || {}
    }
  });
  res.json({ message: "Profile updated" });
});

mongoClient.connect().then(() => {
  const db = mongoClient.db("user_db");
  users = db.collection("users");
  notifications = db.collection("notifications");
  users.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  users.createIndex({ username: 1 }, { unique: true }).catch(() => {});
  notifications.createIndex({ userId: 1, createdAt: -1 }).catch(() => {});
  app.listen(PORT, () => console.log(`user-service running on ${PORT}`));
}).catch(console.error);
